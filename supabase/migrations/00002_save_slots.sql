-- Add missing columns to game_sessions
ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'open_world',
  ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS story_outcomes JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS unlocked_types JSONB DEFAULT '[]';

-- Add missing orbital/merge columns to celestial_bodies
ALTER TABLE celestial_bodies
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES celestial_bodies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS orbit_radius FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS orbit_speed FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS orbit_angle FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rotation_speed FLOAT DEFAULT 0.01,
  ADD COLUMN IF NOT EXISTS axial_tilt FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mass FLOAT DEFAULT 0.001,
  ADD COLUMN IF NOT EXISTS merge_scale FLOAT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS merge_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS orbit_inclination FLOAT DEFAULT 0;

-- Save slots table: up to 3 named saves per session
CREATE TABLE IF NOT EXISTS save_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL CHECK (slot_index BETWEEN 1 AND 3),
  label TEXT NOT NULL DEFAULT 'Save',
  mode TEXT NOT NULL,
  coins INTEGER DEFAULT 0,
  chapter INTEGER DEFAULT 1,
  turn_count INTEGER DEFAULT 0,
  total_credits INTEGER DEFAULT 0,
  story_outcomes JSONB DEFAULT '[]',
  unlocked_types JSONB DEFAULT '[]',
  bodies_snapshot JSONB DEFAULT '[]',
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, slot_index)
);

ALTER TABLE save_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to save_slots" ON save_slots FOR ALL USING (true) WITH CHECK (true);
