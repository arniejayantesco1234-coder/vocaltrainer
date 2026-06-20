'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { Link2, Users, BarChart3, Mic, TrendingUp, Play, Pause, Headphones } from 'lucide-react';

interface Coach {
  id: string;
  name: string;
}

interface SessionRow {
  id: string;
  created_at: string;
  overall_vocal_grade: string;
  pitch_accuracy: number;
  tone_quality: number;
  breath_support: number;
  vocal_agility: number;
  uncompromising_truth: string;
  critical_flaws: string[];
  actionable_prescription: string[];
  lowest_stable_note: string;
  highest_stable_note: string;
  voice_classification: string;
}

export default function CoachPage() {
  const [activeTab, setActiveTab] = useState('link');
  const [coachUuid, setCoachUuid] = useState('');
  const [linked, setLinked] = useState(false);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('coach_uuid');
    if (saved) {
      setCoachUuid(saved);
      setLinked(true);
      fetchCoachData(saved);
    }
  }, []);

  const fetchCoachData = async (uuid: string) => {
    setLoading(true);
    setError('');
    try {
      const { data: coachData } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', uuid)
        .maybeSingle();
      if (coachData) {
        setCoach(coachData as Coach);
      }

      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(14);
      if (sessionData) {
        setSessions(sessionData as SessionRow[]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load coach data');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!coachUuid.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: linkError } = await supabase
        .from('coach_links')
        .insert({ coach_uuid: coachUuid.trim() })
        .select()
        .single();
      if (linkError) throw linkError;
      localStorage.setItem('coach_uuid', coachUuid.trim());
      setLinked(true);
      await fetchCoachData(coachUuid.trim());
      setActiveTab('portal');
    } catch (e: any) {
      setError(e.message || 'Link failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleAudio = (sessionId: string) => {
    if (playingAudio === sessionId) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(sessionId);
    }
  };

  const avgMetric = (metric: keyof SessionRow) => {
    if (!sessions.length) return 0;
    const sum = sessions.reduce((s, x) => s + ((x[metric] as number) || 0), 0);
    return Math.round(sum / sessions.length);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Coach Sync</h1>
        <p className="text-zinc-400 mb-8">Link your profile to a coach and review shared data.</p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
            <TabsTrigger value="link" className="data-[state=active]:bg-zinc-800">
              <Link2 className="w-4 h-4 mr-2" />
              Link Coach
            </TabsTrigger>
            <TabsTrigger value="portal" className="data-[state=active]:bg-zinc-800">
              <Users className="w-4 h-4 mr-2" />
              Coach Portal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link">
            <Card className="bg-zinc-900 border-zinc-800 p-6 rounded-2xl max-w-md">
              <h3 className="text-lg font-semibold mb-3">Enter Coach UUID</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Paste the unique coach identifier provided by your vocal coach to sync your progress.
              </p>
              <Input
                value={coachUuid}
                onChange={(e) => setCoachUuid(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                className="bg-zinc-950 border-zinc-700 text-zinc-100 mb-4"
              />
              {error && (
                <div className="text-sm text-red-400 mb-3">{error}</div>
              )}
              <Button
                onClick={handleLink}
                disabled={loading || !coachUuid.trim()}
                className="bg-sky-500 hover:bg-sky-600 text-white w-full"
              >
                {loading ? 'Linking...' : 'Sync with Coach'}
              </Button>
              {linked && (
                <div className="mt-4 text-sm text-emerald-400">
                  Successfully linked to coach.
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="portal">
            {loading ? (
              <div className="text-zinc-400 animate-pulse">Loading portal...</div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-sky-900/40 flex items-center justify-center">
                    <Users className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">{coach?.name || 'Unknown Coach'}</div>
                    <div className="text-xs text-zinc-500 font-mono">{coachUuid}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <Card className="bg-zinc-900 border-zinc-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wide mb-1">
                      <BarChart3 className="w-3 h-3" />
                      Sessions
                    </div>
                    <div className="text-2xl font-bold">{sessions.length}</div>
                  </Card>
                  <Card className="bg-zinc-900 border-zinc-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wide mb-1">
                      <Mic className="w-3 h-3" />
                      Avg Pitch
                    </div>
                    <div className="text-2xl font-bold">{avgMetric('pitch_accuracy')}</div>
                  </Card>
                  <Card className="bg-zinc-900 border-zinc-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wide mb-1">
                      <TrendingUp className="w-3 h-3" />
                      Avg Tone
                    </div>
                    <div className="text-2xl font-bold">{avgMetric('tone_quality')}</div>
                  </Card>
                  <Card className="bg-zinc-900 border-zinc-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wide mb-1">
                      <Headphones className="w-3 h-3" />
                      Latest Grade
                    </div>
                    <div className="text-2xl font-bold">{sessions[0]?.overall_vocal_grade || 'N/A'}</div>
                  </Card>
                </div>

                <h3 className="text-lg font-semibold mb-3">7-Day Timeline</h3>
                <div className="space-y-3">
                  {sessions.map((s) => (
                    <Card
                      key={s.id}
                      className="bg-zinc-900 border-zinc-800 p-4 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-zinc-500">
                          {new Date(s.created_at).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-bold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300">
                            {s.overall_vocal_grade || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-zinc-300 mb-2">
                        {s.uncompromising_truth || 'No summary.'}
                      </div>

                      {s.voice_classification && (
                        <div className="text-xs text-zinc-500 mb-2">
                          Range: {s.lowest_stable_note} - {s.highest_stable_note} ({s.voice_classification})
                        </div>
                      )}

                      <div className="text-xs text-zinc-500 space-y-1 mb-3">
                        {s.critical_flaws?.map((f, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">-</span>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-xs text-emerald-400 space-y-1">
                        {s.actionable_prescription?.map((p, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span>+</span>
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3 mt-3 text-xs text-zinc-500">
                        <span>PA: <span className="text-zinc-300">{s.pitch_accuracy || 0}</span></span>
                        <span>TQ: <span className="text-zinc-300">{s.tone_quality || 0}</span></span>
                        <span>BS: <span className="text-zinc-300">{s.breath_support || 0}</span></span>
                        <span>VA: <span className="text-zinc-300">{s.vocal_agility || 0}</span></span>
                      </div>
                    </Card>
                  ))}
                  {sessions.length === 0 && (
                    <div className="text-zinc-500 text-sm">No sessions found.</div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
