'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Calendar, Award } from 'lucide-react';

interface SessionRow {
  id: string;
  created_at: string;
  pitch_accuracy: number;
  tone_quality: number;
  breath_support: number;
  vocal_agility: number;
  overall_vocal_grade: string;
  uncompromising_truth: string;
  lowest_stable_note: string;
  highest_stable_note: string;
  voice_classification: string;
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(30);
      if (!error && data) {
        setSessions(data as SessionRow[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Filter to last 7 days for rolling window
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const chartData = useMemo(() => {
    return sessions
      .filter((s) => new Date(s.created_at) >= sevenDaysAgo)
      .map((s) => ({
        date: new Date(s.created_at).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        fullDate: s.created_at,
        pitch_accuracy: s.pitch_accuracy || 0,
        tone_quality: s.tone_quality || 0,
        breath_support: s.breath_support || 0,
        vocal_agility: s.vocal_agility || 0,
        grade: s.overall_vocal_grade,
      }));
  }, [sessions]);

  const regressions = useMemo(() => {
    const metrics = ['pitch_accuracy', 'tone_quality', 'breath_support', 'vocal_agility'] as const;
    const results: { metric: string; diff: number; prev: number; curr: number; label: string }[] = [];
    if (sessions.length >= 2) {
      const prev = sessions[sessions.length - 2];
      const curr = sessions[sessions.length - 1];
      const labels: Record<string, string> = {
        pitch_accuracy: 'Pitch Accuracy',
        tone_quality: 'Tone Quality',
        breath_support: 'Breath Support',
        vocal_agility: 'Vocal Agility',
      };
      for (const m of metrics) {
        const diff = (curr[m] || 0) - (prev[m] || 0);
        results.push({ metric: m, diff, prev: prev[m] || 0, curr: curr[m] || 0, label: labels[m] });
      }
    }
    return results;
  }, [sessions]);

  const latestSession = sessions[sessions.length - 1];
  const previousSession = sessions.length >= 2 ? sessions[sessions.length - 2] : null;

  const hasRegression = regressions.some((r) => r.diff < 0);
  const hasProgress = regressions.some((r) => r.diff >= 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400 flex items-center gap-2">
          <Activity className="w-5 h-5 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">Progress Dashboard</h1>
            <p className="text-zinc-400">7-day rolling vocal metrics timeline</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Calendar className="w-4 h-4" />
            {sevenDaysAgo.toLocaleDateString()} - {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Summary stats */}
        {latestSession && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="bg-zinc-900 border-zinc-800 p-4 rounded-xl">
              <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Latest Grade</div>
              <div className={`text-2xl font-bold ${
                (latestSession.overall_vocal_grade || '').startsWith('A') ? 'text-emerald-400' :
                (latestSession.overall_vocal_grade || '').startsWith('F') ? 'text-red-400' :
                'text-amber-400'
              }`}>
                {latestSession.overall_vocal_grade || 'N/A'}
              </div>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800 p-4 rounded-xl">
              <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Pitch Accuracy</div>
              <div className="text-2xl font-bold text-sky-400">{latestSession.pitch_accuracy || 0}</div>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800 p-4 rounded-xl">
              <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Tone Quality</div>
              <div className="text-2xl font-bold text-violet-400">{latestSession.tone_quality || 0}</div>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800 p-4 rounded-xl">
              <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Breath Support</div>
              <div className="text-2xl font-bold text-amber-400">{latestSession.breath_support || 0}</div>
            </Card>
          </div>
        )}

        {/* Regression alerts */}
        {hasRegression && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-800/50 flex items-start gap-3 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-red-300">Regression Alert</div>
              <div className="text-sm text-red-200/80">
                One or more metrics declined since your last session. Review the critical flaws and
                execute the prescribed exercises before your next attempt.
              </div>
            </div>
          </div>
        )}

        {/* Metric change cards */}
        {regressions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {regressions.map((r) => {
              const isDrop = r.diff < 0;
              const isGain = r.diff >= 1;
              if (!isDrop && !isGain) return null;
              return (
                <Card
                  key={r.metric}
                  className={`p-4 rounded-xl border ${
                    isDrop
                      ? 'bg-red-950/30 border-red-800/50 text-red-200'
                      : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isDrop ? (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    ) : (
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{r.label}</div>
                      <div className="text-sm opacity-90">
                        {isDrop
                          ? `Dropped by ${Math.abs(r.diff)} points from ${r.prev} to ${r.curr}. Anatomical failure detected — likely weak diaphragmatic engagement or throat constriction.`
                          : `Improved by ${r.diff.toFixed(1)} points from ${r.prev} to ${r.curr}. Keep the pressure on.`}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Main chart */}
        <Card className="bg-zinc-900 border-zinc-800 p-4 rounded-2xl mb-8">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPitch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBreath" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="date" stroke="#a1a1aa" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} stroke="#a1a1aa" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#e4e4e7' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="pitch_accuracy"
                  name="Pitch Accuracy"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPitch)"
                />
                <Area
                  type="monotone"
                  dataKey="tone_quality"
                  name="Tone Quality"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTone)"
                />
                <Area
                  type="monotone"
                  dataKey="breath_support"
                  name="Breath Support"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBreath)"
                />
                <Line
                  type="monotone"
                  dataKey="vocal_agility"
                  name="Vocal Agility"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Session history */}
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Session History
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions
            .slice()
            .reverse()
            .map((s) => (
              <Card
                key={s.id}
                className="bg-zinc-900 border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-zinc-500">
                    {new Date(s.created_at).toLocaleString()}
                  </div>
                  <div
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      (s.overall_vocal_grade || '').startsWith('A')
                        ? 'bg-emerald-900/40 text-emerald-300'
                        : (s.overall_vocal_grade || '').startsWith('F')
                        ? 'bg-red-900/40 text-red-300'
                        : 'bg-amber-900/40 text-amber-300'
                    }`}
                  >
                    {s.overall_vocal_grade || 'N/A'}
                  </div>
                </div>
                <div className="text-sm text-zinc-300 line-clamp-3">
                  {s.uncompromising_truth || 'No critique available.'}
                </div>
                {s.voice_classification && (
                  <div className="text-xs text-zinc-500 mt-2">
                    Range: {s.lowest_stable_note} - {s.highest_stable_note} ({s.voice_classification})
                  </div>
                )}
                <div className="flex gap-4 mt-3 text-xs text-zinc-500">
                  <span>PA: <span className="text-zinc-300">{s.pitch_accuracy || 0}</span></span>
                  <span>TQ: <span className="text-zinc-300">{s.tone_quality || 0}</span></span>
                  <span>BS: <span className="text-zinc-300">{s.breath_support || 0}</span></span>
                  <span>VA: <span className="text-zinc-300">{s.vocal_agility || 0}</span></span>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
