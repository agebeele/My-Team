-- ========================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS TEAMGOL PARA SUPABASE
-- Estratificado sin ningún tipo de datos semilla (0 filas)
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA DE EQUIPOS (TEAMS)
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  logo_url TEXT,
  banner_url TEXT,
  league_name TEXT,
  season TEXT,
  stadium TEXT,
  location TEXT,
  founded_year TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE JUGADORES (PLAYERS)
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nickname TEXT,
  number TEXT,
  position TEXT NOT NULL,
  avatar_url TEXT,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  matches INTEGER DEFAULT 0,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  phone TEXT,
  is_called_up BOOLEAN DEFAULT true,
  is_starter BOOLEAN DEFAULT false,
  mvp_history JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE USUARIOS DE LA APLICACIÓN (APP_USERS)
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT,
  password TEXT,
  role TEXT DEFAULT 'player',
  avatar_url TEXT,
  player_id TEXT,
  team_id TEXT,
  provider TEXT DEFAULT 'email',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE PARTIDOS (MATCHES)
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  rival TEXT NOT NULL,
  rival_logo TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  stadium TEXT NOT NULL,
  is_home BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'scheduled',
  modality TEXT DEFAULT 'fut7',
  score_us INTEGER,
  score_them INTEGER,
  scorers_us JSONB DEFAULT '[]'::JSONB,
  events JSONB DEFAULT '[]'::JSONB,
  called_up_player_ids JSONB DEFAULT '[]'::JSONB,
  lineup JSONB DEFAULT '[]'::JSONB,
  mvp_id TEXT,
  mvp_player_name TEXT,
  mvp_photo_url TEXT,
  mvp_votes JSONB DEFAULT '{}'::JSONB,
  created_at_timestamp BIGINT,
  match_start_timestamp BIGINT,
  finished_at_timestamp BIGINT,
  match_report_pdf TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE PUBLICACIONES / MURO (POSTS)
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  team_id TEXT,
  league_name TEXT,
  is_league_official BOOLEAN DEFAULT false,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  author_role TEXT DEFAULT 'player',
  category TEXT DEFAULT 'Anuncio',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  media_type TEXT,
  status TEXT DEFAULT 'approved',
  created_at TEXT DEFAULT 'Justo ahora',
  reactions JSONB DEFAULT '{"likes":0,"fire":0,"clap":0,"goal":0,"userReactions":{}}'::JSONB,
  comments JSONB DEFAULT '[]'::JSONB,
  created_at_iso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migraciones idempotentes
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{"likes":0,"fire":0,"clap":0,"goal":0,"userReactions":{}}'::JSONB;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::JSONB;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_at_iso TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE posts ADD COLUMN IF NOT EXISTS inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE matches ADD COLUMN IF NOT EXISTS mvp_photo_url TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS created_at_timestamp BIGINT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_start_timestamp BIGINT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS finished_at_timestamp BIGINT;

-- 6. TABLA DE CLASIFICACIÓN / TABLAS DE LIGA (STANDINGS)
CREATE TABLE IF NOT EXISTS standings (
  id TEXT PRIMARY KEY,
  league_name TEXT NOT NULL,
  rank INTEGER NOT NULL,
  name TEXT NOT NULL,
  logo TEXT,
  pj INTEGER DEFAULT 0,
  g INTEGER DEFAULT 0,
  e INTEGER DEFAULT 0,
  p INTEGER DEFAULT 0,
  gf INTEGER DEFAULT 0,
  gc INTEGER DEFAULT 0,
  dg INTEGER DEFAULT 0,
  pts INTEGER DEFAULT 0,
  is_our_team BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY)
-- ========================================================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access teams" ON teams;
CREATE POLICY "Public access teams" ON teams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access players" ON players;
CREATE POLICY "Public access players" ON players FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access app_users" ON app_users;
CREATE POLICY "Public access app_users" ON app_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access matches" ON matches;
CREATE POLICY "Public access matches" ON matches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access posts" ON posts;
CREATE POLICY "Public access posts" ON posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access standings" ON standings;
CREATE POLICY "Public access standings" ON standings FOR ALL USING (true) WITH CHECK (true);

-- ========================================================
-- TIEMPO REAL (REALTIME)
-- ========================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts, players, matches, app_users, teams, standings;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;