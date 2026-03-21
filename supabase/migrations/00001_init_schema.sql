CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  mode TEXT DEFAULT 'open_world',
  coins INTEGER DEFAULT 100,
  chapter INTEGER DEFAULT 1,
  turn_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS celestial_bodies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  z FLOAT DEFAULT 0,
  equilibrium FLOAT DEFAULT 50,
  state TEXT DEFAULT 'stable',
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Allow public access for this no-auth setup)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to game_sessions" ON game_sessions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE celestial_bodies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public access to celestial_bodies" ON celestial_bodies FOR ALL USING (true) WITH CHECK (true);
