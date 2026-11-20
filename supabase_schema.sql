-- ========================================================
-- ESQUEMA COMPLETO Y ACTUALIZADO DE BASE DE DATOS TEAMGOL
-- Compatible con RLS, Realtime y el mapeo exacto del Frontend
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

-- 2. TABLA DE USUARIOS DE LA APLICACIÓN (APP_USERS)
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  username TEXT,
  password TEXT,
  role TEXT DEFAULT 'player', -- Soporta: 'owner' | 'player' | 'fan' | 'admin' | 'coach' | 'league_admin'
  avatar_url TEXT,
  player_id TEXT,
  team_id TEXT,
  team_ids JSONB DEFAULT '[]'::JSONB,
  provider TEXT DEFAULT 'email',
  team_join_status TEXT DEFAULT 'none',
  requested_team_id TEXT,
  requested_team_name TEXT,
  position TEXT,
  jersey_number INTEGER,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE JUGADORES (PLAYERS)
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
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

-- Migraciones idempotentes para multi-equipo en players y app_users
ALTER TABLE players ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_team_user ON players (team_id, user_id) WHERE user_id IS NOT NULL;

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS team_ids JSONB DEFAULT '[]'::JSONB;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS team_join_status TEXT DEFAULT 'none';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS requested_team_id TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS requested_team_name TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS jersey_number INTEGER;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Backfill automático de team_ids para usuarios que ya tenían team_id asignado
UPDATE app_users
SET team_ids = jsonb_build_array(team_id)
WHERE team_id IS NOT NULL
  AND (team_ids IS NULL OR team_ids = '[]'::JSONB);

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
  is_lineup_saved BOOLEAN DEFAULT false,
  player_confirmations JSONB DEFAULT '{}'::JSONB,
  fan_attendance JSONB DEFAULT '[]'::JSONB,
  fan_mvp_votes JSONB DEFAULT '{}'::JSONB,
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

ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_lineup_saved BOOLEAN DEFAULT false;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS player_confirmations JSONB DEFAULT '{}'::JSONB;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS fan_attendance JSONB DEFAULT '[]'::JSONB;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS fan_mvp_votes JSONB DEFAULT '{}'::JSONB;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS mvp_photo_url TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS created_at_timestamp BIGINT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_start_timestamp BIGINT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS finished_at_timestamp BIGINT;

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

ALTER TABLE posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{"likes":0,"fire":0,"clap":0,"goal":0,"userReactions":{}}'::JSONB;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::JSONB;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS created_at_iso TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE posts ADD COLUMN IF NOT EXISTS inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Backfill de created_at_iso en publicaciones existentes y creación de índice más reciente -> más antigua
UPDATE posts
SET created_at_iso = CASE
  WHEN created_at ~ '^\d{4}-\d{2}-\d{2}T' THEN created_at::TIMESTAMPTZ
  WHEN id ~ '(\d{13})' THEN to_timestamp((substring(id from '(\d{13})'))::BIGINT / 1000.0)
  ELSE COALESCE(inserted_at, NOW())
END
WHERE created_at_iso IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_newest_first
  ON posts (created_at_iso DESC NULLS LAST, inserted_at DESC NULLS LAST);

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

ALTER TABLE standings ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE standings ADD COLUMN IF NOT EXISTS is_our_team BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_standings_league_stats
  ON standings (league_name, pts DESC, dg DESC, gf DESC, rank ASC);

-- 7. TABLA DE SOLICITUDES DE INGRESO A EQUIPOS (JOIN_REQUESTS)
CREATE TABLE IF NOT EXISTS join_requests (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  team_name TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,
  player_email TEXT,
  player_name TEXT,
  player_position TEXT DEFAULT 'MED',
  player_number INTEGER,
  player_avatar TEXT,
  request_type TEXT DEFAULT 'player', -- 'player' | 'fan'
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migraciones y corrección de restricciones en join_requests
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS player_avatar TEXT;
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'player';
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE join_requests ALTER COLUMN player_email DROP NOT NULL;
ALTER TABLE join_requests ALTER COLUMN player_name DROP NOT NULL;

-- Eliminar tabla duplicada obsoleta si aún existe
DROP TABLE IF EXISTS team_join_requests;

-- 8. TABLA DE INVITACIONES OFICIALES (TEAM_INVITATIONS)
CREATE TABLE IF NOT EXISTS team_invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  player_name TEXT,
  team_id TEXT NOT NULL,
  team_name TEXT,
  team_logo TEXT,
  stadium TEXT,
  role TEXT DEFAULT 'player',
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Public access join_requests" ON join_requests;
CREATE POLICY "Public access join_requests" ON join_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access team_invitations" ON team_invitations;
CREATE POLICY "Public access team_invitations" ON team_invitations FOR ALL USING (true) WITH CHECK (true);

-- ========================================================
-- TIEMPO REAL (REALTIME)
-- ========================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts, players, matches, app_users, teams, standings, join_requests, team_invitations;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE standings;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE posts;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN others THEN NULL;
  END;
END $$;
