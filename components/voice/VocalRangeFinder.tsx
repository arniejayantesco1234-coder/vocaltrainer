'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Mic2, ArrowDown, ArrowUp, User } from 'lucide-react';

interface VocalRangeFinderProps {
  currentNote: string;
  isActive: boolean;
}

function noteToMidi(note: string): number {
  if (!note) return -1;
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const match = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return -1;
  const name = match[1];
  const octave = parseInt(match[2], 10);
  const idx = names.indexOf(name);
  if (idx === -1) return -1;
  return octave * 12 + idx + 12;
}

function classifyVoice(lowMidi: number, highMidi: number): string {
  const range = highMidi - lowMidi;
  // Approximate ranges
  if (lowMidi >= 28 && highMidi <= 47) return 'Bass';
  if (lowMidi >= 33 && highMidi <= 52) return 'Baritone';
  if (lowMidi >= 36 && highMidi <= 55) return 'Tenor';
  if (lowMidi >= 40 && highMidi <= 59) return 'Alto';
  if (lowMidi >= 48 && highMidi <= 67) return 'Soprano';
  if (range <= 12) return 'Limited Range';
  if (range >= 24) return 'Wide Range';
  return 'Mixed/Undetermined';
}

export default function VocalRangeFinder({ currentNote, isActive }: VocalRangeFinderProps) {
  const [lowest, setLowest] = useState<string | null>(null);
  const [highest, setHighest] = useState<string | null>(null);
  const [classification, setClassification] = useState<string>('');
  const [sustainingNote, setSustainingNote] = useState<string>('');
  const [sustainProgress, setSustainProgress] = useState(0);

  const noteStartRef = useRef<string | null>(null);
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isActive || !currentNote) {
      // Clear progress when not active
      setSustainingNote('');
      setSustainProgress(0);
      if (noteTimerRef.current) {
        clearTimeout(noteTimerRef.current);
        noteTimerRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      noteStartRef.current = null;
      return;
    }

    if (noteStartRef.current !== currentNote) {
      // New note detected
      noteStartRef.current = currentNote;
      setSustainingNote(currentNote);
      setSustainProgress(0);

      // Clear existing timer
      if (noteTimerRef.current) {
        clearTimeout(noteTimerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Start progress animation
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / 1500) * 100, 100);
        setSustainProgress(progress);
      }, 50);

      // Set timer for 1.5 seconds
      noteTimerRef.current = setTimeout(() => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setSustainProgress(100);
        updateRange(currentNote);
      }, 1500);
    }
  }, [currentNote, isActive]);

  const updateRange = (note: string) => {
    const midi = noteToMidi(note);
    if (midi < 0) return;

    setLowest((prev) => {
      if (!prev) {
        const newLow = note;
        const newHigh = highest || note;
        setClassification(classifyVoice(noteToMidi(newLow), noteToMidi(newHigh)));
        return note;
      }
      const prevMidi = noteToMidi(prev);
      if (midi < prevMidi) {
        const newLow = note;
        const newHigh = highest || note;
        setClassification(classifyVoice(noteToMidi(newLow), noteToMidi(newHigh)));
        return note;
      }
      return prev;
    });

    setHighest((prev) => {
      if (!prev) {
        const newLow = lowest || note;
        const newHigh = note;
        setClassification(classifyVoice(noteToMidi(newLow), noteToMidi(newHigh)));
        return note;
      }
      const prevMidi = noteToMidi(prev);
      if (midi > prevMidi) {
        const newLow = lowest || note;
        const newHigh = note;
        setClassification(classifyVoice(noteToMidi(newLow), noteToMidi(newHigh)));
        return note;
      }
      return prev;
    });
  };

  useEffect(() => {
    return () => {
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const lowMidi = lowest ? noteToMidi(lowest) : 0;
  const highMidi = highest ? noteToMidi(highest) : 0;
  const rangeSpan = lowMidi && highMidi ? highMidi - lowMidi : 0;

  return (
    <Card className="mt-4 bg-zinc-900/80 border-zinc-800 p-5 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Mic2 className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Vocal Range Finder</h3>
      </div>

      {/* Sustain progress bar */}
      {sustainingNote && isActive && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Sustaining: <span className="text-zinc-300 font-medium">{sustainingNote}</span></span>
            <span>{sustainProgress >= 100 ? 'Locked in!' : `${Math.round(sustainProgress)}%`}</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                sustainProgress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${sustainProgress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-600 mt-1">
            Hold note steady for 1.5 seconds to register
          </p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-center flex-1">
          <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 uppercase tracking-wide mb-1">
            <ArrowDown className="w-3 h-3 text-sky-400" />
            Lowest
          </div>
          <div className="text-3xl font-bold text-sky-400">{lowest || '--'}</div>
          {lowest && <div className="text-xs text-zinc-600 mt-0.5">{lowMidi} MIDI</div>}
        </div>

        <div className="text-center px-6 flex-1">
          <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 uppercase tracking-wide mb-1">
            <User className="w-3 h-3 text-amber-400" />
            Classification
          </div>
          <div className="text-xl font-bold text-amber-400">{classification || '--'}</div>
          {rangeSpan > 0 && (
            <div className="text-xs text-zinc-600 mt-0.5">{rangeSpan} semitones</div>
          )}
        </div>

        <div className="text-center flex-1">
          <div className="flex items-center justify-center gap-1 text-xs text-zinc-500 uppercase tracking-wide mb-1">
            <ArrowUp className="w-3 h-3 text-rose-400" />
            Highest
          </div>
          <div className="text-3xl font-bold text-rose-400">{highest || '--'}</div>
          {highest && <div className="text-xs text-zinc-600 mt-0.5">{highMidi} MIDI</div>}
        </div>
      </div>
    </Card>
  );
}
