import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Middleware de CORS manual (sin depender del paquete cors)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const PORT = Number(process.env.PORT) || 3000;

// Permite peticiones desde tu frontend
app.use(express.json({ limit: '50mb' }));

// --- BASE DE DATOS SQLITE ---
const db = new sqlite3.Database('./equipo.db', (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('Conectado exitosamente a SQLite.');
    inicializarBD();
  }
});

let currentVersion = Date.now();

const INITIAL_SERVER_TEAM = {
  id: 'team_01',
  name: 'FC Bayern Munich',
  shortName: 'BAYERN',
  logoUrl: '/fc_bayern_logo.png',
  bannerUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
  leagueName: 'Liga Premier Fútbol 7',
  season: 'Temporada 2026',
  stadium: 'Cancha Sintética San Pedro',
  location: 'Av. Vasconcelos #300, Col. Del Valle, San Pedro Garza García, N.L.',
  foundedYear: '2021',
  primaryColor: '#1877F2',
  secondaryColor: '#0866FF',
};

const INITIAL_SERVER_PLAYERS = [
  { id: 'p_1', teamId: 'team_01', name: 'Brandon García', nickname: 'Lucho', number: '6', position: 'MCD', isCalledUp: true, isStarter: true, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_2', teamId: 'team_01', name: 'Daniel Usuga', nickname: 'Parce', number: '88', position: 'DFC', isCalledUp: true, isStarter: true, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_3', teamId: 'team_01', name: 'Ivan Hernandez', nickname: 'Nito', number: '99', position: 'ED', isCalledUp: true, isStarter: false, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_4', teamId: 'team_01', name: 'Oskar Batalla', nickname: 'Batalla', number: '9', position: 'DEL', isCalledUp: true, isStarter: true, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_5', teamId: 'team_01', name: 'Angel Tamayo', nickname: 'Cucu', number: '1', position: 'POR', isCalledUp: true, isStarter: true, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_6', teamId: 'team_01', name: 'Raul Aguayo', nickname: 'Rulo', number: '11', position: 'DFC', isCalledUp: true, isStarter: true, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_7', teamId: 'team_01', name: 'Hugo Aguayo', nickname: 'Hugo', number: '22', position: 'DEL', isCalledUp: true, isStarter: false, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_8', teamId: 'team_01', name: 'Angel Ivan', nickname: 'Arturito', number: '', position: 'MCD', isCalledUp: true, isStarter: false, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_9', teamId: 'team_01', name: 'Axiel', nickname: 'Tortas', number: '15', position: 'MED', isCalledUp: true, isStarter: false, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_10', teamId: 'team_01', name: 'Eliu', nickname: 'Eliu', number: '', position: 'DFC', isCalledUp: true, isStarter: false, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_11', teamId: 'team_01', name: 'Angel Terron', nickname: 'Terron', number: '21', position: 'MCO', isCalledUp: true, isStarter: true, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_12', teamId: 'team_01', name: 'Emilio Garcia', nickname: 'Champi', number: '7', position: 'EI', isCalledUp: true, isStarter: true, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_13', teamId: 'team_01', name: 'Carlos', nickname: 'Cafe', number: '', position: 'ED', isCalledUp: true, isStarter: false, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_14', teamId: 'team_01', name: 'Oskar Hernandez', nickname: 'Oskarin', number: '', position: 'MED', isCalledUp: true, isStarter: false, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_15', teamId: 'team_01', name: 'Moises Treviño', nickname: 'Pitbull', number: '33', position: 'DFC', isCalledUp: true, isStarter: false, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_16', teamId: 'team_01', name: 'Fernando', nickname: '', number: '', position: 'DEL', isCalledUp: true, isStarter: false, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
  { id: 'p_17', teamId: 'team_01', name: 'Luis', nickname: 'Pepino', number: '', position: 'DFC', isCalledUp: true, isStarter: false, goals: 0, assists: 0, matches: 0, yellowCards: 0, redCards: 0 },
];

const INITIAL_SERVER_USERS = [
  {
    id: 'u_admin',
    name: 'Administrador (Admin)',
    email: 'agbl141201@gmail.com',
    username: 'admin',
    password: 'root',
    role: 'owner',
    playerId: 'p_1',
    teamId: 'team_01',
    provider: 'email',
  },
  {
    id: 'u_league_admin',
    name: 'Administrador de Liga',
    email: 'admin@dreamteam.com',
    username: 'admin@dreamteam.com',
    password: 'admin',
    role: 'league_admin',
    avatarUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=200&q=80',
    provider: 'email',
  },
];

function inicializarBD() {
  db.serialize(() => {
    // 1. Tabla de estado centralizado (cache rápido de sincronización)
    db.run(`CREATE TABLE IF NOT EXISTS app_store (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER
    )`);

    // 2. Tabla relacional de partidos
    db.run(`CREATE TABLE IF NOT EXISTS partidos (
      id TEXT PRIMARY KEY,
      team_id TEXT,
      rival TEXT,
      fecha TEXT,
      hora TEXT,
      cancha TEXT,
      payload TEXT,
      updated_at INTEGER
    )`);

    // 3. Tabla relacional de publicaciones y anuncios
    db.run(`CREATE TABLE IF NOT EXISTS publicaciones (
      id TEXT PRIMARY KEY,
      team_id TEXT,
      autor_id TEXT,
      autor_nombre TEXT,
      autor_rol TEXT,
      es_oficial_liga INTEGER,
      categoria TEXT,
      titulo TEXT,
      contenido TEXT,
      payload TEXT,
      updated_at INTEGER
    )`);

    // 4. Tabla relacional de equipos
    db.run(`CREATE TABLE IF NOT EXISTS equipos (
      id TEXT PRIMARY KEY,
      nombre TEXT,
      payload TEXT,
      updated_at INTEGER
    )`);

    // 5. Tabla relacional de usuarios
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      payload TEXT,
      updated_at INTEGER
    )`);

    // 6. Tabla clásica de jugadores
    db.run(`CREATE TABLE IF NOT EXISTS jugadores (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      posicion TEXT NOT NULL,
      numero INTEGER,
      edad INTEGER,
      telefono TEXT,
      estado TEXT DEFAULT 'Activo',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Comprobar si app_store ya tiene datos; si no, poblarlo
    db.get(`SELECT COUNT(*) as count FROM app_store`, (err, row: any) => {
      if (!err && row && row.count === 0) {
        console.log('Sembrando datos iniciales en SQLite...');
        const stmt = db.prepare(`INSERT OR REPLACE INTO app_store (key, value, updated_at) VALUES (?, ?, ?)`);
        stmt.run('team', JSON.stringify(INITIAL_SERVER_TEAM), Date.now());
        stmt.run('allTeams', JSON.stringify([INITIAL_SERVER_TEAM]), Date.now());
        stmt.run('players', JSON.stringify(INITIAL_SERVER_PLAYERS), Date.now());
        stmt.run('users', JSON.stringify(INITIAL_SERVER_USERS), Date.now());
        stmt.run('matches', JSON.stringify([]), Date.now());
        stmt.run('posts', JSON.stringify([
          {
            id: 'post_init_01',
            teamId: 'team_01',
            leagueName: 'Liga Premier Fútbol 7',
            isLeagueOfficial: false,
            authorId: 'u_admin',
            authorName: 'Administrador (Admin)',
            authorRole: 'owner',
            category: 'Anuncio',
            title: '¡Bienvenidos al FC Bayern Munich!',
            content: 'Plataforma oficial del equipo sincronizada en tiempo real para todos los jugadores y cuerpo técnico.',
            status: 'approved',
            createdAt: 'Hace un momento',
            reactions: { likes: 0, fire: 0, clap: 0, goal: 0, userReactions: {} },
            comments: []
          }
        ]), Date.now());
        stmt.run('standings', JSON.stringify([]), Date.now());
        stmt.finalize();
      }
    });
  });
}

// --- ENDPOINTS DE LA API ---

app.get('/api/ping', (_req, res) => {
  res.json({ mensaje: '¡Servidor funcionando!' });
});

// Sincronización general en tiempo real (GET /api/sync)
app.get('/api/sync', (_req, res) => {
  db.all(`SELECT key, value, updated_at FROM app_store`, (err, rows: any[]) => {
    if (err) {
      return res.status(500).json({ error: 'Error leyendo de SQLite' });
    }

    const result: any = { success: true, version: currentVersion };
    if (rows && rows.length > 0) {
      rows.forEach((r) => {
        try {
          result[r.key] = JSON.parse(r.value);
        } catch {
          result[r.key] = r.value;
        }
      });
    } else {
      result.team = INITIAL_SERVER_TEAM;
      result.allTeams = [INITIAL_SERVER_TEAM];
      result.players = INITIAL_SERVER_PLAYERS;
      result.users = INITIAL_SERVER_USERS;
      result.matches = [];
      result.posts = [];
      result.standings = [];
    }

    res.json(result);
  });
});

// Guardar cambios desde cualquier dispositivo (POST /api/sync)
app.post('/api/sync', (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Datos no válidos' });
  }

  currentVersion = Date.now();

  // Read current store first to merge safely without overwriting other teams' players or users!
  db.all(`SELECT key, value FROM app_store`, (err, rows: any[]) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const currentData: any = {};
    if (rows) {
      rows.forEach((r) => {
        try {
          currentData[r.key] = JSON.parse(r.value);
        } catch {
          currentData[r.key] = r.value;
        }
      });
    }

    // 1. Teams: Merge allTeams so new teams are appended and Bayern is NEVER lost
    let mergedAllTeams: any[] = currentData.allTeams || [INITIAL_SERVER_TEAM];
    if (updates.allTeams && Array.isArray(updates.allTeams)) {
      updates.allTeams.forEach((newT: any) => {
        mergedAllTeams = [...mergedAllTeams.filter((t: any) => t.id !== newT.id), newT];
      });
    }
    if (updates.team && updates.team.id) {
      mergedAllTeams = [...mergedAllTeams.filter((t: any) => t.id !== updates.team.id), updates.team];
    }
    // Always ensure Bayern Munich is present in allTeams
    if (!mergedAllTeams.some((t: any) => t.id === 'team_01')) {
      mergedAllTeams = [INITIAL_SERVER_TEAM, ...mergedAllTeams];
    }

    // 2. Users: Merge users by email so admin is NEVER lost
    let mergedUsers: any[] = currentData.users || INITIAL_SERVER_USERS;
    if (updates.users && Array.isArray(updates.users)) {
      updates.users.forEach((newU: any) => {
        mergedUsers = [...mergedUsers.filter((u: any) => u.email.toLowerCase() !== newU.email.toLowerCase()), newU];
      });
    }
    // Always ensure admin and league_admin are present
    if (!mergedUsers.some((u: any) => u.email.toLowerCase() === 'agbl141201@gmail.com')) {
      mergedUsers = [...mergedUsers, INITIAL_SERVER_USERS[0]];
    }
    if (!mergedUsers.some((u: any) => u.email.toLowerCase() === 'admin@dreamteam.com')) {
      mergedUsers = [...mergedUsers, INITIAL_SERVER_USERS[1]];
    }

    // 3. Players: Merge players by teamId so one team's updates NEVER erase another team's squad!
    let mergedPlayers: any[] = currentData.players || INITIAL_SERVER_PLAYERS;
    mergedPlayers = mergedPlayers.map((p: any) => ({
      ...p,
      teamId: p.teamId || 'team_01',
    }));

    if (updates.players && Array.isArray(updates.players)) {
      const targetTeamId = updates.team?.id || updates.players[0]?.teamId || 'team_01';
      const taggedPlayers = updates.players.map((p: any) => ({
        ...p,
        teamId: p.teamId || targetTeamId,
      }));

      // Keep players from other teams + updated players from target team
      mergedPlayers = [
        ...mergedPlayers.filter((p: any) => p.teamId !== targetTeamId),
        ...taggedPlayers,
      ];
    }

    // If Bayern squad is somehow missing, restore the 17 players
    const bayernPlayersCount = mergedPlayers.filter((p: any) => p.teamId === 'team_01').length;
    if (bayernPlayersCount === 0) {
      mergedPlayers = [...mergedPlayers, ...INITIAL_SERVER_PLAYERS];
    }

    // 4. Matches: Merge by teamId
    let mergedMatches: any[] = currentData.matches || [];
    if (updates.matches && Array.isArray(updates.matches)) {
      const targetTeamId = updates.team?.id || updates.matches[0]?.teamId || 'team_01';
      const taggedMatches = updates.matches.map((m: any) => ({
        ...m,
        teamId: m.teamId || targetTeamId,
      }));
      mergedMatches = [
        ...mergedMatches.filter((m: any) => m.teamId !== targetTeamId),
        ...taggedMatches,
      ];
    }

    // 5. Posts: Merge posts by id
    let mergedPosts: any[] = currentData.posts || [];
    if (updates.posts && Array.isArray(updates.posts)) {
      updates.posts.forEach((newP: any) => {
        mergedPosts = [newP, ...mergedPosts.filter((p: any) => p.id !== newP.id)];
      });
    }

    // Write merged state to SQLite app_store and relational tables
    db.serialize(() => {
      const stmt = db.prepare(`INSERT OR REPLACE INTO app_store (key, value, updated_at) VALUES (?, ?, ?)`);
      stmt.run('allTeams', JSON.stringify(mergedAllTeams), currentVersion);
      stmt.run('users', JSON.stringify(mergedUsers), currentVersion);
      stmt.run('players', JSON.stringify(mergedPlayers), currentVersion);
      stmt.run('matches', JSON.stringify(mergedMatches), currentVersion);
      stmt.run('posts', JSON.stringify(mergedPosts), currentVersion);
      if (updates.standings) {
        stmt.run('standings', JSON.stringify(updates.standings), currentVersion);
      }
      stmt.finalize();

      // Upsert individual matches into relational table 'partidos'
      if (updates.matches && Array.isArray(updates.matches)) {
        const targetTeamId = updates.team?.id || updates.matches[0]?.teamId || 'team_01';
        const taggedMatches = updates.matches.map((m: any) => ({
          ...m,
          teamId: m.teamId || targetTeamId,
        }));

        if (taggedMatches.length > 0) {
          const placeholders = taggedMatches.map(() => '?').join(',');
          db.run(
            `DELETE FROM partidos WHERE team_id = ? AND id NOT IN (${placeholders})`,
            [targetTeamId, ...taggedMatches.map((m: any) => m.id)]
          );
        } else {
          db.run(`DELETE FROM partidos WHERE team_id = ?`, [targetTeamId]);
        }

        const matchStmt = db.prepare(`INSERT OR REPLACE INTO partidos (id, team_id, rival, fecha, hora, cancha, payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        taggedMatches.forEach((m: any) => {
          matchStmt.run(
            m.id,
            m.teamId || targetTeamId,
            m.rival || '',
            m.date || '',
            m.time || '',
            m.stadium || '',
            JSON.stringify(m),
            currentVersion
          );
        });
        matchStmt.finalize();
      }

      // Upsert individual posts into relational table 'publicaciones'
      if (updates.posts && Array.isArray(updates.posts)) {
        const postStmt = db.prepare(`INSERT OR REPLACE INTO publicaciones (id, team_id, autor_id, autor_nombre, autor_rol, es_oficial_liga, categoria, titulo, contenido, payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        mergedPosts.forEach((p: any) => {
          postStmt.run(
            p.id,
            p.teamId || null,
            p.authorId || null,
            p.authorName || '',
            p.authorRole || 'player',
            p.isLeagueOfficial || p.authorRole === 'league_admin' ? 1 : 0,
            p.category || 'Anuncio',
            p.title || '',
            p.content || '',
            JSON.stringify(p),
            currentVersion
          );
        });
        postStmt.finalize();
      }

      res.json({ success: true, version: currentVersion });
    });
  });
});

// Endpoint de Partidos (relacional)
app.get('/api/partidos', (req, res) => {
  const { teamId } = req.query;
  const sql = teamId
    ? `SELECT payload FROM partidos WHERE team_id = ? ORDER BY fecha DESC, hora DESC`
    : `SELECT payload FROM partidos ORDER BY fecha DESC, hora DESC`;
  const params = teamId ? [teamId] : [];

  db.all(sql, params, (err, rows: any[]) => {
    if (!err && rows && rows.length > 0) {
      try {
        return res.json(rows.map((r) => JSON.parse(r.payload)));
      } catch {}
    }
    // fallback a app_store
    db.get(`SELECT value FROM app_store WHERE key = 'matches'`, (err2, row: any) => {
      if (!err2 && row && row.value) {
        try {
          const list = JSON.parse(row.value);
          const filtered = teamId ? list.filter((m: any) => m.teamId === teamId) : list;
          return res.json(filtered);
        } catch {}
      }
      res.json([]);
    });
  });
});

// Eliminar un partido directamente por ID
app.delete('/api/partidos/:id', (req, res) => {
  const matchId = req.params.id;
  currentVersion = Date.now();
  db.serialize(() => {
    db.run(`DELETE FROM partidos WHERE id = ?`, [matchId]);
    db.get(`SELECT value FROM app_store WHERE key = 'matches'`, (err, row: any) => {
      if (!err && row && row.value) {
        try {
          const list = JSON.parse(row.value).filter((m: any) => m.id !== matchId);
          db.run(
            `INSERT OR REPLACE INTO app_store (key, value, updated_at) VALUES ('matches', ?, ?)`,
            [JSON.stringify(list), currentVersion]
          );
        } catch {}
      }
    });
  });
  res.json({ success: true, deletedId: matchId, version: currentVersion });
});

// Endpoint de Publicaciones / Muro (relacional)
app.get('/api/publicaciones', (_req, res) => {
  db.all(`SELECT payload FROM publicaciones ORDER BY updated_at DESC`, [], (err, rows: any[]) => {
    if (!err && rows && rows.length > 0) {
      try {
        return res.json(rows.map((r) => JSON.parse(r.payload)));
      } catch {}
    }
    // fallback a app_store
    db.get(`SELECT value FROM app_store WHERE key = 'posts'`, (err2, row: any) => {
      if (!err2 && row && row.value) {
        try {
          return res.json(JSON.parse(row.value));
        } catch {}
      }
      res.json([]);
    });
  });
});

// Endpoint de Jugadores
app.get('/api/jugadores', (_req, res) => {
  db.get(`SELECT value FROM app_store WHERE key = 'players'`, (err, row: any) => {
    if (!err && row && row.value) {
      try {
        return res.json(JSON.parse(row.value));
      } catch {
        // fallback
      }
    }
    db.all('SELECT * FROM jugadores ORDER BY creado_en DESC', [], (err2, rows) => {
      if (err2) return res.status(400).json({ error: err2.message });
      res.json(rows);
    });
  });
});

// Crear o actualizar un jugador
app.post('/api/jugadores', (req, res) => {
  const nuevo = req.body;
  if (!nuevo || !nuevo.name && !nuevo.nombre) {
    return res.status(400).json({ error: 'Nombre de jugador requerido' });
  }

  db.get(`SELECT value FROM app_store WHERE key = 'players'`, (err, row: any) => {
    let players = INITIAL_SERVER_PLAYERS;
    if (!err && row && row.value) {
      try {
        players = JSON.parse(row.value);
      } catch {
        // fallback
      }
    }

    const playerId = nuevo.id || `p_${Date.now()}`;
    const playerObj = {
      id: playerId,
      name: nuevo.name || nuevo.nombre,
      nickname: nuevo.nickname || nuevo.apodo || '',
      number: String(nuevo.number || nuevo.numero || ''),
      position: nuevo.position || nuevo.posicion || 'MED',
      phone: nuevo.phone || nuevo.telefono || '',
      goals: Number(nuevo.goals || 0),
      assists: Number(nuevo.assists || 0),
      matches: Number(nuevo.matches || 0),
      isCalledUp: nuevo.isCalledUp ?? true,
      isStarter: nuevo.isStarter ?? false,
    };

    const updated = [...players.filter((p: any) => p.id !== playerId), playerObj];
    currentVersion = Date.now();
    db.run(
      `INSERT OR REPLACE INTO app_store (key, value, updated_at) VALUES ('players', ?, ?)`,
      [JSON.stringify(updated), currentVersion],
      (saveErr) => {
        if (saveErr) return res.status(500).json({ error: saveErr.message });
        res.json({ success: true, player: playerObj, players: updated, version: currentVersion });
      }
    );
  });
});

// Endpoint de IA / Escaneo de Tablas
app.post('/api/ai/scan-table', async (req, res) => {
  try {
    const { images, imageBase64, mimeType = 'image/jpeg', teamName = '' } = req.body;

    const imageList: { base64: string; mimeType: string }[] = [];
    if (Array.isArray(images) && images.length > 0) {
      for (const item of images) {
        if (item.base64 || item.url) {
          imageList.push({
            base64: item.base64 || item.url,
            mimeType: item.mimeType || 'image/jpeg',
          });
        }
      }
    } else if (imageBase64) {
      imageList.push({ base64: imageBase64, mimeType });
    }

    if (imageList.length === 0) {
      return res.status(400).json({ error: 'No se recibió ninguna foto de la tabla para analizar.' });
    }

    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      imageList.forEach((img, idx) => {
        const rawData = img.base64.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(rawData, 'base64');
        const ext = img.mimeType?.includes('png') ? 'png' : 'jpg';
        fs.writeFileSync(path.join(uploadDir, `scan_table_${idx + 1}.${ext}`), buffer);
      });
    } catch (saveErr) {
      console.warn('Advertencia guardando imágenes en disco:', saveErr);
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const promptText = `Eres un asistente de inteligencia artificial experto en digitalización de tablas y estadísticas de ligas de fútbol (fútbol 7, fútbol rápido, fútbol soccer).
Analiza detalladamente las ${imageList.length} imágenes adjuntas, que corresponden a la tabla de clasificación o posiciones de la liga.
Extrae absolutamente TODAS las filas de la tabla combinadas en orden estricto de posición (desde la posición 1 hasta la última).
Para cada equipo extrae:
- rank: Posición numérica consecutiva
- name: Nombre oficial del equipo
- pj: Partidos jugados
- g: Partidos ganados
- e: Partidos empatados
- p: Partidos perdidos
- gf: Goles a favor
- gc: Goles en contra
- dg: Diferencia de goles
- pts: Puntos totales

El equipo del usuario es o contiene: "${teamName}".
NO inventes datos: respeta fielmente los números de cada equipo que aparecen en las imágenes.
Asegúrate de calcular los valores faltantes si alguna columna estuviera borrosa o cortada.
Devuelve el nombre de la liga o torneo si es visible, y la lista completa de todos los equipos en orden de posición.`;

        const parts: any[] = imageList.map((img) => ({
          inlineData: {
            mimeType: img.mimeType || 'image/jpeg',
            data: img.base64.replace(/^data:[^;]+;base64,/, ''),
          },
        }));
        parts.push({ text: promptText });

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                leagueName: { type: Type.STRING },
                teams: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      rank: { type: Type.INTEGER },
                      name: { type: Type.STRING },
                      pj: { type: Type.INTEGER },
                      g: { type: Type.INTEGER },
                      e: { type: Type.INTEGER },
                      p: { type: Type.INTEGER },
                      gf: { type: Type.INTEGER },
                      gc: { type: Type.INTEGER },
                      dg: { type: Type.INTEGER },
                      pts: { type: Type.INTEGER },
                    },
                    required: ['rank', 'name', 'pj', 'g', 'e', 'p', 'gf', 'gc', 'dg', 'pts'],
                  },
                },
              },
              required: ['teams'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.teams && Array.isArray(parsed.teams) && parsed.teams.length > 0) {
          return res.json({
            ...parsed,
            engine: 'gemini-vision',
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini vision no disponible, delegando al motor OCR:', geminiError?.message);
      }
    }

    return res.json({
      requiresClientScan: true,
      message: 'Escaneo visual directo activado en cliente.',
    });
  } catch (error: any) {
    console.error('Error en endpoint de escaneo:', error);
    return res.status(500).json({ error: error.message || 'Error procesando la tabla' });
  }
});

// --- INICIALIZACIÓN DEL SERVIDOR ---
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      const distIndex = path.resolve(__dirname, 'dist', 'index.html');
      if (fs.existsSync(distIndex)) {
        res.sendFile(distIndex);
      } else {
        res.json({ status: 'API Online', message: 'Backend listo en Render' });
      }
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();