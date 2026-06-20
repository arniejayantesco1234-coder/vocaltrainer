/*
# Voice Trainer App Schema

1. New Tables
- `sessions` — stores each practice session with audio blob reference and AI critique
- `session_metrics` — numeric scores per session for dashboard charts
- `coach_links` — links a student profile to a coach UUID
- `coaches` — coach profiles with UUID for student linking
2. Security
- Enable RLS on all tables.
- Allow anon + authenticated CRUD for single-tenant access (no explicit auth required by user).
*/

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_url text,
  overall_vocal_grade text,
  lowest_stable_note text,
  highest_stable_note text,
  voice_classification text,
  pitch_accuracy integer,
  tone_quality integer,
  breath_support integer,
  vocal_agility integer,
  critical_flaws jsonb DEFAULT '[]'::jsonb,
  uncompromising_truth text,
  actionable_prescription jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_value integer NOT NULL,
  recorded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coach_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL DEFAULT 'anonymous',
  coach_uuid uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
CREATE POLICY "anon_select_sessions" ON sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sessions" ON sessions;
CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
CREATE POLICY "anon_update_sessions" ON sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sessions" ON sessions;
CREATE POLICY "anon_delete_sessions" ON sessions FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_session_metrics" ON session_metrics;
CREATE POLICY "anon_select_session_metrics" ON session_metrics FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_session_metrics" ON session_metrics;
CREATE POLICY "anon_insert_session_metrics" ON session_metrics FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_session_metrics" ON session_metrics;
CREATE POLICY "anon_update_session_metrics" ON session_metrics FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_session_metrics" ON session_metrics;
CREATE POLICY "anon_delete_session_metrics" ON session_metrics FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_coach_links" ON coach_links;
CREATE POLICY "anon_select_coach_links" ON coach_links FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_coach_links" ON coach_links;
CREATE POLICY "anon_insert_coach_links" ON coach_links FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_coach_links" ON coach_links;
CREATE POLICY "anon_update_coach_links" ON coach_links FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_coach_links" ON coach_links;
CREATE POLICY "anon_delete_coach_links" ON coach_links FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_coaches" ON coaches;
CREATE POLICY "anon_select_coaches" ON coaches FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_coaches" ON coaches;
CREATE POLICY "anon_insert_coaches" ON coaches FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_coaches" ON coaches;
CREATE POLICY "anon_update_coaches" ON coaches FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_coaches" ON coaches;
CREATE POLICY "anon_delete_coaches" ON coaches FOR DELETE
  TO anon, authenticated USING (true);
