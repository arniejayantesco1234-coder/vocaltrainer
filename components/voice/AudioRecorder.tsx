'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, RotateCcw, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import PitchGauge from '@/components/pitch/PitchGauge';
import VocalRangeFinder from './VocalRangeFinder';

interface AudioRecorderProps {
  onCritiqueStart?: () => void;
  onCritiqueUpdate?: (chunk: string) => void;
  onCritiqueDone?: (full: string) => void;
}

export default function AudioRecorder({
  onCritiqueStart,
  onCritiqueUpdate,
  onCritiqueDone,
}: AudioRecorderProps) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'stopped' | 'processing'>('idle');
  const isProcessing = status === 'processing';
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [pitchData, setPitchData] = useState({ frequency: 0, note: '', cents: 0 });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pitch data refs for worker communication
  const pitchDataRef = useRef({ frequency: 0, note: '', cents: 0 });

  const startWorker = useCallback(() => {
    if (workerRef.current) return;
    const worker = new Worker('/workers/pitch-worker.js');
    worker.onmessage = (e) => {
      const { frequency, note, cents } = e.data;
      pitchDataRef.current = { frequency, note, cents };
      setPitchData({ frequency, note, cents });
    };
    workerRef.current = worker;
  }, []);

  const stopWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  const getSupportedMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=opus',
      'audio/mp4',
      'audio/ogg;codecs=opus',
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  };

  const requestMicrophonePermission = async (): Promise<MediaStream> => {
    // Check if mediaDevices API exists
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser does not support microphone access. Please use Chrome, Safari, or Firefox.');
    }

    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      throw new Error('Microphone access requires a secure connection (HTTPS). The preview may not support this. Try deploying the app first.');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
          channelCount: 1,
        }
      });
      return stream;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Microphone permission denied. Please click the microphone icon in your browser address bar and allow access, then try again.');
      }
      if (err.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone and try again.');
      }
      if (err.name === 'NotReadableError') {
        throw new Error('Microphone is already in use by another application. Please close other apps using the microphone.');
      }
      throw err;
    }
  };

  const startPracticeSession = async () => {
    setError(null);
    try {
      const stream = await requestMicrophonePermission();
      streamRef.current = stream;

      const mime = getSupportedMimeType();
      const options: MediaRecorderOptions = mime
        ? { mimeType: mime, audioBitsPerSecond: 32000 }
        : { audioBitsPerSecond: 32000 };

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setStatus('stopped');
      };

      recorder.start(100);
      setStatus('recording');
      setSessionStarted(true);
      setRecordingTime(0);

      // Start recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // AudioContext only after user gesture (Safari/Chrome fix)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      startWorker();

      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);

      const sendFrame = () => {
        if (!analyserRef.current || !workerRef.current) return;
        analyserRef.current.getFloatTimeDomainData(dataArray);
        workerRef.current.postMessage({ 
          samples: dataArray, 
          sampleRate: ctx.sampleRate 
        });
        rafRef.current = requestAnimationFrame(sendFrame);
      };
      rafRef.current = requestAnimationFrame(sendFrame);
    } catch (err: any) {
      setError(err.message || 'Microphone access denied. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    stopWorker();
    setStatus('stopped');
    setPitchData({ frequency: 0, note: '', cents: 0 });
  };

  const resetRecording = () => {
    setAudioUrl(null);
    setStatus('idle');
    setSessionStarted(false);
    setRecordingTime(0);
    setPitchData({ frequency: 0, note: '', cents: 0 });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const uploadAndCritique = async () => {
    if (!audioUrl) return;
    setStatus('processing');
    onCritiqueStart?.();

    try {
      const blob = await fetch(audioUrl).then((r) => r.blob());
      
      // Check file size - should be well under 1MB with 32kbps
      if (blob.size > 1.5 * 1024 * 1024) {
        throw new Error('Audio file too large. Please record a shorter clip.');
      }

      const form = new FormData();
      form.append('audio', blob, 'recording.webm');

      const res = await fetch('/api/critique', {
        method: 'POST',
        body: form,
      });

      if (!res.ok || !res.body) {
        const errorText = await res.text().catch(() => 'Unknown error');
        throw new Error(`Critique request failed: ${res.status} ${errorText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        onCritiqueUpdate?.(chunk);
      }

      onCritiqueDone?.(full);

      // Persist session + metrics to Supabase
      let parsed: any = null;
      try {
        parsed = JSON.parse(full);
      } catch {
        // If not valid JSON, store raw text
      }

      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          overall_vocal_grade: parsed?.overall_vocal_grade || '',
          lowest_stable_note: parsed?.vocal_range_detected?.lowest_stable_note || '',
          highest_stable_note: parsed?.vocal_range_detected?.highest_stable_note || '',
          voice_classification: parsed?.vocal_range_detected?.voice_classification || '',
          pitch_accuracy: parsed?.brutal_metrics?.pitch_accuracy || 0,
          tone_quality: parsed?.brutal_metrics?.tone_quality || 0,
          breath_support: parsed?.brutal_metrics?.breath_support || 0,
          vocal_agility: parsed?.brutal_metrics?.vocal_agility || 0,
          critical_flaws: parsed?.critical_flaws || [],
          uncompromising_truth: parsed?.uncompromising_truth || '',
          actionable_prescription: parsed?.actionable_prescription || [],
        })
        .select('id')
        .single();

      if (!sessionError && sessionData) {
        const metrics = [
          { name: 'pitch_accuracy', value: parsed?.brutal_metrics?.pitch_accuracy || 0 },
          { name: 'tone_quality', value: parsed?.brutal_metrics?.tone_quality || 0 },
          { name: 'breath_support', value: parsed?.brutal_metrics?.breath_support || 0 },
          { name: 'vocal_agility', value: parsed?.brutal_metrics?.vocal_agility || 0 },
        ];
        await supabase.from('session_metrics').insert(
          metrics.map((m) => ({
            session_id: sessionData.id,
            metric_name: m.name,
            metric_value: m.value,
          }))
        );
      }
    } catch (err: any) {
      setError(err.message || 'Critique failed');
      setStatus('stopped');
    }
  };

  useEffect(() => {
    return () => {
      stopRecording();
      resetRecording();
    };
  }, []);

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900 border-zinc-800 p-6 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-900/30 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Voice Trainer</h2>
              <p className="text-xs text-zinc-500">Real-time pitch detection & AI critique</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status === 'recording' && (
              <span className="flex items-center gap-1.5 text-red-400 text-sm font-medium animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                REC {formatTime(recordingTime)}
              </span>
            )}
            {status === 'processing' && (
              <span className="flex items-center gap-1.5 text-amber-400 text-sm font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </span>
            )}
          </div>
        </div>

        {!sessionStarted && (
          <div className="text-center py-10">
            <Button
              onClick={startPracticeSession}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-lg px-10 py-7 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 hover:shadow-emerald-500/30"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Practice Session
            </Button>
            <p className="text-zinc-500 text-sm mt-4 max-w-sm mx-auto">
              Click to enable microphone and begin real-time pitch detection. 
              Audio will be compressed to 32kbps mono to stay under size limits.
            </p>
          </div>
        )}

        {sessionStarted && (
          <>
            <div className="flex justify-center gap-3 mb-6">
              {status === 'recording' ? (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="rounded-full w-16 h-16 p-0 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all hover:scale-105"
                >
                  <Square className="w-5 h-5" />
                </Button>
              ) : status === 'stopped' ? (
                <div className="flex items-center gap-3">
                  <Button
                    onClick={resetRecording}
                    variant="outline"
                    className="rounded-full w-12 h-12 p-0 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={uploadAndCritique}
                    disabled={isProcessing}
                    className="bg-sky-500 hover:bg-sky-600 text-white rounded-full px-8 py-6 shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 transition-all hover:scale-105"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Get AI Critique
                  </Button>
                </div>
              ) : null}
            </div>

            {audioUrl && (
              <div className="mb-6">
                <audio controls src={audioUrl} className="w-full rounded-lg" />
              </div>
            )}

            <PitchGauge
              frequency={pitchData.frequency}
              note={pitchData.note}
              cents={pitchData.cents}
            />

            <VocalRangeFinder
              currentNote={pitchData.note}
              isActive={status === 'recording'}
            />
          </>
        )}

        {error && (
          <div className="mt-4 p-5 rounded-xl bg-red-950/30 text-red-200 text-sm border border-red-800/50">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-red-400 mt-0.5 text-lg">!</span>
              <div className="flex-1">
                <div className="font-semibold text-red-300 mb-1">Microphone Access Issue</div>
                <div>{error}</div>
              </div>
            </div>
            <div className="ml-7 space-y-2">
              <Button
                onClick={startPracticeSession}
                variant="outline"
                size="sm"
                className="border-red-700 text-red-300 hover:bg-red-900/30 hover:text-red-200"
              >
                <Mic className="w-3.5 h-3.5 mr-1.5" />
                Try Again
              </Button>
              <p className="text-xs text-red-400/70">
                Tip: Look for the microphone icon in your browser's address bar and set it to "Allow".
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
