/**
 * Auto-migration: ensures save_slots and missing columns exist.
 * Probes the table on startup and logs a clear message if it's missing.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

let migrationDone = false

export async function ensureSaveSlots(): Promise<void> {
  if (migrationDone) return

  try {
    // Probe: try to select 0 rows from save_slots
    const res = await fetch(`${SUPABASE_URL}/rest/v1/save_slots?limit=0`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    })

    if (res.ok || res.status === 406) {
      // 200 or 406 (PGRST116 = no rows) both mean the table exists
      migrationDone = true
      return
    }

    // Table missing — try to create it via the SQL endpoint
    const created = await tryCreateTable()
    if (created) {
      migrationDone = true
    } else {
      console.error(
        '%c[Cartographer] ⚠ save_slots table is missing!\n' +
        'Run this in your Supabase SQL editor (Dashboard → SQL Editor):\n\n' +
        getMigrationSQL(),
        'color: orange; font-weight: bold'
      )
    }
  } catch (e) {
    console.warn('[Cartographer] Migration probe failed:', e)
  }
}

async function tryCreateTable(): Promise<boolean> {
  // Try Supabase's pg REST endpoint (requires service role, may not work with anon)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql: getMigrationSQL() }),
  })
  return res.ok
}

function getMigrationSQL(): string {
  return `
-- Add missing columns to game_sessions
DO $$ BEGIN
  BEGIN ALTER TABLE game_sessions ADD COLUMN mode TEXT DEFAULT 'open_world'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE game_sessions ADD COLUMN total_credits INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE game_sessions ADD COLUMN story_outcomes JSONB DEFAULT '[]'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE game_sessions ADD COLUMN unlocked_types JSONB DEFAULT '[]'; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- Add missing columns to celestial_bodies
DO $$ BEGIN
  BEGIN ALTER TABLE celestial_bodies ADD COLUMN parent_id UUID; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE celestial_bodies ADD COLUMN orbit_radius FLOAT DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE celestial_bodies ADD COLUMN orbit_speed FLOAT DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE celestial_bodies ADD COLUMN orbit_angle FLOAT DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE celestial_bodies ADD COLUMN rotation_speed FLOAT DEFAULT 0.01; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE celestial_bodies ADD COLUMN axial_tilt FLOAT DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE celestial_bodies ADD COLUMN mass FLOAT DEFAULT 0.001; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE celestial_bodies ADD COLUMN merge_scale FLOAT DEFAULT 1; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE celestial_bodies ADD COLUMN merge_count INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE celestial_bodies ADD COLUMN orbit_inclination FLOAT DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- Create save_slots table
CREATE TABLE IF NOT EXISTS save_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL CHECK (slot_index BETWEEN 1 AND 3),
  label TEXT NOT NULL DEFAULT 'Save',
  mode TEXT NOT NULL DEFAULT 'open_world',
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

DO $$ BEGIN
  CREATE POLICY "Allow public access to save_slots" ON save_slots FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`.trim()
}
