-- ========================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS TEAMGOL PARA SUPABASE
-- Pega este código completo en: Supabase -> SQL Editor -> Run
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA DE EQUIPOS (TEAMS)
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  logo_url TEXT,
  banner_url TEXT,
  league_name TEXT DEFAULT 'Liga Premier Fútbol 7',
  season TEXT DEFAULT 'Temporada 2026',
  stadium TEXT DEFAULT 'Cancha Sintética San Pedro',
  location TEXT,
  founded_year TEXT DEFAULT '2021',
  primary_color TEXT DEFAULT '#1877F2',
  secondary_color TEXT DEFAULT '#0866FF',
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
  league_name TEXT DEFAULT 'Liga Premier Fútbol 7',
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

-- Migraciones idempotentes por si las tablas ya existían antes
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
-- Permite lectura y escritura abierta mediante la clave Anon pública
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
-- Permite que los cambios se reflejen de inmediato en todos los celulares
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

-- ========================================================
-- DATOS INICIALES SEMILLA (SEED DATA)
-- Carga inicial del FC Bayern Munich, administrador y 17 jugadores
-- ========================================================

-- Equipo FC Bayern Munich
INSERT INTO teams (id, name, short_name, logo_url, banner_url, league_name, stadium, primary_color, secondary_color)
VALUES (
  'team_01',
  'FC Bayern Munich',
  'BAYERN',
  '/fc_bayern_logo.png',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
  'Liga Premier Fútbol 7',
  'Cancha Sintética San Pedro',
  '#1877F2',
  '#0866FF'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  logo_url = EXCLUDED.logo_url;

-- Administrador oficial
INSERT INTO app_users (id, name, email, username, password, role, player_id, team_id, provider)
VALUES (
  'u_admin',
  'Administrador (Admin)',
  'agbl141201@gmail.com',
  'admin',
  'root',
  'owner',
  'p_1',
  'team_01',
  'email'
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  team_id = EXCLUDED.team_id;

-- 17 Jugadores del Bayern Munich
INSERT INTO players (id, team_id, name, nickname, number, position, is_starter, is_called_up)
VALUES
  ('p_1', 'team_01', 'Brandon García', 'Lucho', '6', 'MCD', true, true),
  ('p_2', 'team_01', 'Daniel Usuga', 'Parce', '88', 'DFC', true, true),
  ('p_3', 'team_01', 'Ivan Hernandez', 'Nito', '99', 'ED', false, true),
  ('p_4', 'team_01', 'Oskar Batalla', 'Batalla', '9', 'DEL', true, true),
  ('p_5', 'team_01', 'Angel Tamayo', 'Cucu', '1', 'POR', true, true),
  ('p_6', 'team_01', 'Raul Aguayo', 'Rulo', '11', 'DFC', true, true),
  ('p_7', 'team_01', 'Hugo Aguayo', 'Hugo', '22', 'DEL', false, true),
  ('p_8', 'team_01', 'Angel Ivan', 'Arturito', '', 'MCD', false, true),
  ('p_9', 'team_01', 'Axiel', 'Tortas', '15', 'MED', false, true),
  ('p_10', 'team_01', 'Eliu', 'Eliu', '', 'DFC', false, true),
  ('p_11', 'team_01', 'Angel Terron', 'Terron', '21', 'MCO', true, true),
  ('p_12', 'team_01', 'Emilio Garcia', 'Champi', '7', 'EI', true, true),
  ('p_13', 'team_01', 'Carlos', 'Cafe', '', 'ED', false, true),
  ('p_14', 'team_01', 'Oskar Hernandez', 'Oskarin', '', 'MED', false, true),
  ('p_15', 'team_01', 'Moises Treviño', 'Pitbull', '33', 'DFC', false, true),
  ('p_16', 'team_01', 'Fernando', '', '', 'DEL', false, true),
  ('p_17', 'team_01', 'Luis', 'Pepino', '', 'DFC', false, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  nickname = EXCLUDED.nickname,
  number = EXCLUDED.number,
  position = EXCLUDED.position;

-- Publicación inicial de bienvenida
INSERT INTO posts (id, team_id, league_name, is_league_official, author_id, author_name, author_role, category, title, content, status, created_at)
VALUES (
  'post_init_01',
  'team_01',
  'Liga Premier Fútbol 7',
  false,
  'u_admin',
  'Administrador (Admin)',
  'owner',
  'Anuncio',
  '¡Bienvenidos a la plataforma oficial del FC Bayern Munich!',
  'Plantilla oficial sincronizada en tiempo real. Todos los jugadores pueden revisar sus estadísticas, confirmar convocatoria y votar por el MVP de la jornada.',
  'approved',
  'Hace un momento'
)
ON CONFLICT (id) DO NOTHING;
