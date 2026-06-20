'use client';

import React, { useState } from 'react';
import AudioRecorder from '@/components/voice/AudioRecorder';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, BarChart3, Users, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [critiqueText, setCritiqueText] = useState('');
  const [critiqueJson, setCritiqueJson] = useState<any>(null);
  const [critiquing, setCritiquing] = useState(false);
  const [streamError, setStreamError] = useState('');

  const handleCritiqueStart = () => {
    setCritiqueText('');
    setCritiqueJson(null);
    setCritiquing(true);
    setStreamError('');
  };

  const handleCritiqueUpdate = (chunk: string) => {
    setCritiqueText((prev) => prev + chunk);
  };

  const handleCritiqueDone = (full: string) => {
    setCritiquing(false);
    try {
      const json = JSON.parse(full);
      setCritiqueJson(json);
    } catch {
      // keep raw text if not valid JSON
      if (full.includes('error')) {
        try {
          const err = JSON.parse(full);
          setStreamError(err.error || 'Stream error');
        } catch {
          setStreamError(full);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-900/40 flex items-center justify-center">
              <Mic className="w-5 h-5 text-sky-400" />
            </div>
            <span className="text-xl font-bold tracking-tight">8-Star Voice Trainer</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-zinc-300 hover:text-white gap-2 hidden sm:flex">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/coach">
              <Button variant="ghost" className="text-zinc-300 hover:text-white gap-2 hidden sm:flex">
                <Users className="w-4 h-4" />
                Coach
              </Button>
            </Link>
            <Link href="/deploy">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 shadow-lg shadow-emerald-500/20">
                <ExternalLink className="w-4 h-4" />
                Deploy
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Master Your Voice</h1>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Real-time pitch detection, AI-powered brutal critique, and progress tracking 
            to transform your vocal performance.
          </p>
        </div>

        <Tabs defaultValue="practice" className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 mb-6 mx-auto flex w-fit">
            <TabsTrigger value="practice" className="data-[state=active]:bg-zinc-800 gap-2">
              <Mic className="w-4 h-4" />
              Practice
            </TabsTrigger>
            <TabsTrigger value="critique" className="data-[state=active]:bg-zinc-800 gap-2">
              <Sparkles className="w-4 h-4" />
              Critique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="practice">
            <AudioRecorder
              onCritiqueStart={handleCritiqueStart}
              onCritiqueUpdate={handleCritiqueUpdate}
              onCritiqueDone={handleCritiqueDone}
            />
          </TabsContent>

          <TabsContent value="critique">
            <div className="max-w-3xl mx-auto space-y-4">
              {critiquing && !critiqueText && (
                <Card className="bg-zinc-900 border-zinc-800 p-12 rounded-2xl text-center">
                  <div className="animate-pulse text-zinc-400 flex flex-col items-center gap-3">
                    <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
                    <p>Analyzing your performance with brutal honesty...</p>
                    <p className="text-xs text-zinc-600">This may take a moment as the AI processes your audio</p>
                  </div>
                </Card>
              )}

              {streamError && (
                <Card className="bg-red-950/20 border-red-800/50 p-6 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-red-300">Analysis Error</div>
                      <div className="text-sm text-red-200/80">{streamError}</div>
                    </div>
                  </div>
                </Card>
              )}

              {critiqueText && !critiqueJson && !streamError && (
                <Card className="bg-zinc-900 border-zinc-800 p-6 rounded-2xl">
                  <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-mono">
                    {critiqueText}
                  </pre>
                </Card>
              )}

              {critiqueJson && (
                <>
                  <Card className="bg-zinc-900 border-zinc-800 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <h3 className="text-lg font-semibold">AI Critique</h3>
                      </div>
                      <span
                        className={`text-sm font-bold px-3 py-1 rounded-full ${
                          (critiqueJson.overall_vocal_grade || '').startsWith('A')
                            ? 'bg-emerald-900/40 text-emerald-300'
                            : (critiqueJson.overall_vocal_grade || '').startsWith('F')
                            ? 'bg-red-900/40 text-red-300'
                            : 'bg-amber-900/40 text-amber-300'
                        }`}
                      >
                        {critiqueJson.overall_vocal_grade}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                      {[
                        { label: 'Pitch Accuracy', value: critiqueJson.brutal_metrics?.pitch_accuracy, color: 'text-emerald-400' },
                        { label: 'Tone Quality', value: critiqueJson.brutal_metrics?.tone_quality, color: 'text-sky-400' },
                        { label: 'Breath Support', value: critiqueJson.brutal_metrics?.breath_support, color: 'text-amber-400' },
                        { label: 'Vocal Agility', value: critiqueJson.brutal_metrics?.vocal_agility, color: 'text-rose-400' },
                      ].map((m) => (
                        <div key={m.label} className="bg-zinc-950 rounded-xl p-3 text-center border border-zinc-800/50">
                          <div className="text-xs text-zinc-500 uppercase tracking-wide">{m.label}</div>
                          <div className={`text-2xl font-bold ${m.color}`}>{m.value ?? 0}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800/50 mb-5">
                      <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Uncompromising Truth</div>
                      <div className="text-sm text-zinc-300 leading-relaxed">
                        {critiqueJson.uncompromising_truth}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3" />
                        Critical Flaws
                      </h4>
                      {critiqueJson.critical_flaws?.map((f: string, i: number) => (
                        <div key={i} className="text-sm text-zinc-400 flex items-start gap-2 bg-red-950/10 rounded-lg p-2.5 border border-red-900/20">
                          <span className="text-red-500 mt-0.5 font-bold">{i + 1}.</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 mt-5">
                      <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        Actionable Prescription
                      </h4>
                      {critiqueJson.actionable_prescription?.map((p: string, i: number) => (
                        <div key={i} className="text-sm text-zinc-400 flex items-start gap-2 bg-emerald-950/10 rounded-lg p-2.5 border border-emerald-900/20">
                          <span className="text-emerald-500 mt-0.5 font-bold">{i + 1}.</span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {critiqueJson.vocal_range_detected && (
                    <Card className="bg-zinc-900 border-zinc-800 p-6 rounded-2xl">
                      <h3 className="text-lg font-semibold mb-4">Detected Range</h3>
                      <div className="flex justify-between items-center">
                        <div className="text-center flex-1">
                          <div className="text-xs text-zinc-500 uppercase mb-1">Lowest</div>
                          <div className="text-3xl font-bold text-sky-400">
                            {critiqueJson.vocal_range_detected.lowest_stable_note}
                          </div>
                        </div>
                        <div className="text-center px-6 flex-1 border-x border-zinc-800">
                          <div className="text-xs text-zinc-500 uppercase mb-1">Classification</div>
                          <div className="text-2xl font-bold text-amber-400">
                            {critiqueJson.vocal_range_detected.voice_classification}
                          </div>
                        </div>
                        <div className="text-center flex-1">
                          <div className="text-xs text-zinc-500 uppercase mb-1">Highest</div>
                          <div className="text-3xl font-bold text-rose-400">
                            {critiqueJson.vocal_range_detected.highest_stable_note}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              )}

              {!critiqueText && !critiquing && (
                <Card className="bg-zinc-900 border-zinc-800 p-12 rounded-2xl text-center">
                  <Sparkles className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500">
                    Record a session and request a critique to see results here.
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
