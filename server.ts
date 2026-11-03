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

const PORT = 3000;

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

// --- DATOS INICIALES VACÍOS (Sin autorrecuperación de datos estáticos) ---
const INITIAL_SERVER_TEAM: any = {};
const INITIAL_SERVER_PLAYERS: any[] = [];
const INITIAL_SERVER_USERS: any[] = [];

function inicializarBD() {
  db.serialize(() => {
    db.run(`PRAGMA foreign_keys = ON;`);

    // 1. LIGAS (Dueño de la Liga)
    db.run(`CREATE TABLE IF NOT EXISTS ligas (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      correo TEXT UNIQUE NOT NULL,
      contrasena TEXT NOT NULL,
      rol TEXT DEFAULT 'league_admin',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. EQUIPOS (Pertenecen a una Liga)
    db.run(`CREATE TABLE IF NOT EXISTS equipos (
      id TEXT PRIMARY KEY,
      nombre_equipo TEXT NOT NULL,
      logo TEXT,
      direccion TEXT,
      liga_id TEXT NOT NULL,
      admin_id TEXT NOT NULL,
      color_primario TEXT DEFAULT '#1877F2',
      color_secundario TEXT DEFAULT '#000000',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (liga_id) REFERENCES ligas(id) ON DELETE CASCADE,
      FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`);

    // 3. USUARIOS Y JUGADORES
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      correo TEXT UNIQUE NOT NULL,
      contrasena TEXT NOT NULL,
      posicion TEXT DEFAULT 'MED',
      dorsal INTEGER,
      rol TEXT DEFAULT 'player',
      equipo_id TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE SET NULL
    )`);

    // 4. NOTIFICACIONES / SOLICITUDES DE UNIRSE A EQUIPO
    db.run(`CREATE TABLE IF NOT EXISTS notificaciones (
      id TEXT PRIMARY KEY,
      usuario_id TEXT NOT NULL,
      equipo_id TEXT NOT NULL,
      tipo TEXT DEFAULT 'solicitud_ingreso',
      estado TEXT DEFAULT 'pendiente',
      mensaje TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE
    )`);

    // 5. PARTIDOS (Calendario y Marcador)
    db.run(`CREATE TABLE IF NOT EXISTS partidos (
      id TEXT PRIMARY KEY,
      liga_id TEXT NOT NULL,
      equipo_local_id TEXT NOT NULL,
      equipo_visita_id TEXT NOT NULL,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      ubicacion TEXT,
      goles_local INTEGER DEFAULT 0,
      goles_visita INTEGER DEFAULT 0,
      estado TEXT DEFAULT 'programado',
      mvp_jugador_id TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (liga_id) REFERENCES ligas(id) ON DELETE CASCADE,
      FOREIGN KEY (equipo_local_id) REFERENCES equipos(id) ON DELETE CASCADE,
      FOREIGN KEY (equipo_visita_id) REFERENCES equipos(id) ON DELETE CASCADE,
      FOREIGN KEY (mvp_jugador_id) REFERENCES usuarios(id) ON DELETE SET NULL
    )`);

    // 6. MODO EN VIVO (Eventos por Partido: Goles, Tarjetas, Cambios, Lesiones)
    db.run(`CREATE TABLE IF NOT EXISTS partido_eventos (
      id TEXT PRIMARY KEY,
      partido_id TEXT NOT NULL,
      equipo_id TEXT NOT NULL,
      jugador_id TEXT NOT NULL,
      jugador_sale_id TEXT,
      tipo_evento TEXT NOT NULL,
      minuto INTEGER,
      tiempo TEXT DEFAULT '1T',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
      FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
      FOREIGN KEY (jugador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (jugador_sale_id) REFERENCES usuarios(id) ON DELETE SET NULL
    )`);

    // 7. CONVOCATORIAS Y ALINEACIONES (Pizarra Táctica)
    db.run(`CREATE TABLE IF NOT EXISTS alineaciones (
      id TEXT PRIMARY KEY,
      partido_id TEXT NOT NULL,
      equipo_id TEXT NOT NULL,
      jugador_id TEXT NOT NULL,
      posicion_x REAL,
      posicion_y REAL,
      es_titular INTEGER DEFAULT 0,
      formacion TEXT DEFAULT '1-2-3-1',
      FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
      FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
      FOREIGN KEY (jugador_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`);

    // 8. VOTACIONES DE MVP
    db.run(`CREATE TABLE IF NOT EXISTS votaciones_mvp (
      id TEXT PRIMARY KEY,
      partido_id TEXT NOT NULL,
      votante_id TEXT NOT NULL,
      candidato_id TEXT NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(partido_id, votante_id),
      FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
      FOREIGN KEY (votante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (candidato_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`);

    // 9. PUBLICACIONES Y COMUNICADOS
    db.run(`CREATE TABLE IF NOT EXISTS publicaciones (
      id TEXT PRIMARY KEY,
      autor_id TEXT NOT NULL,
      equipo_id TEXT,
      liga_id TEXT,
      titulo TEXT NOT NULL,
      contenido TEXT NOT NULL,
      img TEXT,
      es_oficial_liga INTEGER DEFAULT 0,
      estado TEXT DEFAULT 'aprobado',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
      FOREIGN KEY (liga_id) REFERENCES ligas(id) ON DELETE CASCADE
    )`);
    
    // ÍNDICES DE RENDIMIENTO
    db.run(`CREATE INDEX IF NOT EXISTS idx_usuarios_equipo ON usuarios(equipo_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_notif_equipo ON notificaciones(equipo_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_partidos_liga ON partidos(liga_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_eventos_partido ON partido_eventos(partido_id);`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_alineaciones_partido ON alineaciones(partido_id);`);

    // Tablas de soporte para sincronización rápida
    db.run(`CREATE TABLE IF NOT EXISTS app_store (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS solicitudes_equipo (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      user_email TEXT,
      team_id TEXT,
      team_name TEXT,
      payload TEXT,
      created_at INTEGER,
      updated_at INTEGER
    )`);

    // Columnas de soporte para sincronización híbrida
    const addCol = (tbl: string, col: string, def: string) => {
      db.run(`ALTER TABLE ${tbl} ADD COLUMN ${col} ${def}`, () => {
        // Ignorar si la columna ya existe
      });
    };
    addCol('partidos', 'team_id', 'TEXT');
    addCol('partidos', 'rival', 'TEXT');
    addCol('partidos', 'cancha', 'TEXT');
    addCol('partidos', 'payload', 'TEXT');
    addCol('partidos', 'updated_at', 'INTEGER');

    addCol('publicaciones', 'team_id', 'TEXT');
    addCol('publicaciones', 'autor_nombre', 'TEXT');
    addCol('publicaciones', 'autor_rol', 'TEXT');
    addCol('publicaciones', 'categoria', 'TEXT');
    addCol('publicaciones', 'payload', 'TEXT');
    addCol('publicaciones', 'updated_at', 'INTEGER');

    // Sembrar ligas si está vacía
    db.get(`SELECT COUNT(*) as count FROM ligas`, (err, row: any) => {
      if (!err && row && row.count === 0) {
        const insLiga = db.prepare('INSERT OR REPLACE INTO ligas (id, nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?, ?)');
        insLiga.run('liga_01', 'Champions League', 'admin@dreamteam.com', 'admin', 'league_admin');
        insLiga.run('liga_02', 'Liga Mexicana', 'mexicana@dreamteam.com', 'admin', 'league_admin');
        insLiga.run('liga_03', 'Liga Española', 'espanola@dreamteam.com', 'admin', 'league_admin');
        insLiga.run('liga_04', 'Liga Francesa', 'francesa@dreamteam.com', 'admin', 'league_admin');
        insLiga.run('liga_05', 'Copa del Mundo', 'mundial@dreamteam.com', 'admin', 'league_admin');
        insLiga.finalize();
      }
    });

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
            leagueName: 'Champions League',
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

// ==========================================
// 1. ENDPOINTS DE SOLICITUDES / NOTIFICACIONES
// ==========================================

// Obtener equipos disponibles para jugadores sin equipo
app.get('/api/equipos-disponibles', (_req, res) => {
  const sql = `
    SELECT e.id, e.nombre_equipo, e.logo, e.direccion, l.nombre AS nombre_liga
    FROM equipos e
    JOIN ligas l ON e.liga_id = l.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Jugador solicita unirse a un equipo
app.post('/api/notificaciones/solicitar', (req, res) => {
  const { usuarioId, equipoId, mensaje } = req.body;
  if (!usuarioId || !equipoId) {
    return res.status(400).json({ error: 'Faltan datos obligatorios (usuarioId, equipoId).' });
  }

  const notifId = `notif_${Date.now()}`;
  const sql = `
    INSERT INTO notificaciones (id, usuario_id, equipo_id, tipo, estado, mensaje)
    VALUES (?, ?, ?, 'solicitud_ingreso', 'pendiente', ?)
  `;

  db.run(sql, [notifId, usuarioId, equipoId, mensaje || 'Desea unirse al equipo'], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    // Also update app_store cache for real-time frontend sync
    currentVersion = Date.now();
    db.get(`SELECT nombre, correo, avatarUrl, posicion, jerseyNumber FROM usuarios WHERE id = ?`, [usuarioId], (_errU, uRow: any) => {
      db.get(`SELECT nombre_equipo FROM equipos WHERE id = ?`, [equipoId], (_errE, eRow: any) => {
        const reqObj = {
          id: notifId,
          userId: usuarioId,
          userName: uRow?.nombre || '',
          playerName: uRow?.nombre || '',
          userEmail: uRow?.correo || '',
          playerEmail: uRow?.correo || '',
          userAvatar: uRow?.avatarUrl || '',
          playerAvatar: uRow?.avatarUrl || '',
          position: uRow?.posicion || 'MED',
          playerPosition: uRow?.posicion || 'MED',
          number: uRow?.dorsal || 10,
          playerNumber: uRow?.dorsal || 10,
          teamId: equipoId,
          teamName: eRow?.nombre_equipo || '',
          status: 'pending',
          createdAt: new Date().toISOString(),
          requestedAt: new Date().toISOString(),
          mensaje: mensaje || 'Desea unirse al plantel',
        };

        db.get(`SELECT value FROM app_store WHERE key = 'joinRequests'`, (_errS, sRow: any) => {
          let list: any[] = [];
          if (sRow && sRow.value) {
            try { list = JSON.parse(sRow.value); } catch {}
          }
          list = [reqObj, ...list.filter((r) => r.id !== notifId && r.userId !== usuarioId)];
          db.run(`INSERT OR REPLACE INTO app_store (key, value, updated_at) VALUES ('joinRequests', ?, ?)`, [JSON.stringify(list), currentVersion]);
        });
      });
    });

    res.json({ success: true, notificacionId: notifId, estado: 'pendiente' });
  });
});

// Obtener notificaciones pendientes para el Admin de un Equipo
app.get('/api/notificaciones/equipo/:equipoId', (req, res) => {
  const { equipoId } = req.params;
  const sql = `
    SELECT n.id AS notificacion_id, u.id AS usuario_id, u.nombre, u.correo, u.posicion, n.mensaje, n.creado_en
    FROM notificaciones n
    JOIN usuarios u ON n.usuario_id = u.id
    WHERE n.equipo_id = ? AND n.estado = 'pendiente'
    ORDER BY n.creado_en DESC
  `;

  db.all(sql, [equipoId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Admin resuelve solicitud (Aceptar o Rechazar)
app.put('/api/notificaciones/responder', (req, res) => {
  const { notificacionId, usuarioId, equipoId, accion } = req.body; // accion: 'aceptar' | 'rechazar'

  if (!notificacionId || !['aceptar', 'rechazar'].includes(accion)) {
    return res.status(400).json({ error: 'Acción no válida.' });
  }

  const nuevoEstado = accion === 'aceptar' ? 'aceptada' : 'rechazada';

  db.serialize(() => {
    // 1. Actualizar estado de la notificación
    db.run(`UPDATE notificaciones SET estado = ? WHERE id = ?`, [nuevoEstado, notificacionId]);

    // 2. Si se acepta, asignar el equipo_id al jugador
    if (accion === 'aceptar' && usuarioId && equipoId) {
      db.run(`UPDATE usuarios SET equipo_id = ? WHERE id = ?`, [equipoId, usuarioId]);
    }

    // 3. Keep app_store joinRequests and users in sync
    currentVersion = Date.now();
    db.get(`SELECT value FROM app_store WHERE key = 'joinRequests'`, (_errJ, jRow: any) => {
      if (jRow && jRow.value) {
        try {
          const jList = JSON.parse(jRow.value).map((r: any) =>
            r.id === notificacionId ? { ...r, status: accion === 'aceptar' ? 'accepted' : 'rejected' } : r
          );
          db.run(`INSERT OR REPLACE INTO app_store (key, value, updated_at) VALUES ('joinRequests', ?, ?)`, [JSON.stringify(jList), currentVersion]);
        } catch {}
      }
    });

    if (accion === 'aceptar' && usuarioId && equipoId) {
      db.get(`SELECT value FROM app_store WHERE key = 'users'`, (_errU, uRow: any) => {
        if (uRow && uRow.value) {
          try {
            const uList = JSON.parse(uRow.value).map((u: any) =>
              u.id === usuarioId ? { ...u, teamId: equipoId, teamJoinStatus: 'accepted' } : u
            );
            db.run(`INSERT OR REPLACE INTO app_store (key, value, updated_at) VALUES ('users', ?, ?)`, [JSON.stringify(uList), currentVersion]);
          } catch {}
        }
      });
    }

    res.json({ success: true, estado: nuevoEstado });
  });
});

// ==========================================
// 2. ENDPOINTS DE MODO PARTIDO (EN VIVO)
// ==========================================

// Cambiar estado del partido ('1T', 'entretiempo', '2T', 'finalizado')
app.put('/api/partidos/:id/estado', (req, res) => {
  const partidoId = req.params.id;
  const { estado } = req.body;

  db.run(`UPDATE partidos SET estado = ? WHERE id = ?`, [estado, partidoId], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, partidoId, estado });
  });
});

// Registrar un evento en vivo (Gol, Tarjeta, Cambio, Lesión)
app.post('/api/partidos/evento', (req, res) => {
  const { partidoId, equipoId, jugadorId, jugadorSaleId, tipoEvento, minuto, tiempo } = req.body;
  
  if (!partidoId || !equipoId || !jugadorId || !tipoEvento) {
    return res.status(400).json({ error: 'Datos de evento incompletos.' });
  }

  const eventoId = `evt_${Date.now()}`;

  db.serialize(() => {
    // 1. Insertar evento
    const sqlInsert = `
      INSERT INTO partido_eventos (id, partido_id, equipo_id, jugador_id, jugador_sale_id, tipo_evento, minuto, tiempo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.run(sqlInsert, [eventoId, partidoId, equipoId, jugadorId, jugadorSaleId || null, tipoEvento, minuto || 0, tiempo || '1T']);

    // 2. Si es Gol, incrementar el marcador del partido
    if (tipoEvento === 'gol') {
      db.get(`SELECT equipo_local_id FROM partidos WHERE id = ?`, [partidoId], (err, row: any) => {
        if (!err && row) {
          const esLocal = row.equipo_local_id === equipoId;
          const campoGol = esLocal ? 'goles_local' : 'goles_visita';
          db.run(`UPDATE partidos SET ${campoGol} = ${campoGol} + 1 WHERE id = ?`, [partidoId]);
        }
      });
    }

    res.json({ success: true, eventoId });
  });
});

// ==========================================
// 3. TABLAS DE POSICIONES Y GOLEO (PICHICHI)
// ==========================================

// Tabla de Goleadores (Pichichi) de una Liga
app.get('/api/tablas/goleadores/:ligaId', (req, res) => {
  const { ligaId } = req.params;
  const sql = `
    SELECT u.id AS jugador_id, u.nombre AS jugador_nombre, u.dorsal, e.nombre_equipo, COUNT(pe.id) AS goles
    FROM partido_eventos pe
    JOIN usuarios u ON pe.jugador_id = u.id
    JOIN equipos e ON pe.equipo_id = e.id
    WHERE e.liga_id = ? AND pe.tipo_evento = 'gol'
    GROUP BY u.id
    ORDER BY goles DESC
  `;

  db.all(sql, [ligaId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Tabla de Posiciones de la Liga
app.get('/api/tablas/posiciones/:ligaId', (req, res) => {
  const { ligaId } = req.params;
  const sql = `
    SELECT 
        e.id AS equipo_id,
        e.nombre_equipo,
        e.logo,
        COUNT(p.id) AS PJ,
        SUM(CASE 
            WHEN (p.equipo_local_id = e.id AND p.goles_local > p.goles_visita) OR (p.equipo_visita_id = e.id AND p.goles_visita > p.goles_local) THEN 3
            WHEN p.goles_local = p.goles_visita AND p.id IS NOT NULL THEN 1 ELSE 0 END) AS PTS
    FROM equipos e
    LEFT JOIN partidos p ON (e.id = p.equipo_local_id OR e.id = p.equipo_visita_id) AND p.estado = 'finalizado'
    WHERE e.liga_id = ?
    GROUP BY e.id
    ORDER BY PTS DESC
  `;

  db.all(sql, [ligaId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ==========================================
// 4. VOTACIÓN DE MVP
// ==========================================

// Emitir voto para MVP del partido
app.post('/api/partidos/votar-mvp', (req, res) => {
  const { partidoId, votanteId, candidatoId } = req.body;
  const votoId = `voto_${Date.now()}`;

  const sql = `INSERT INTO votaciones_mvp (id, partido_id, votante_id, candidato_id) VALUES (?, ?, ?, ?)`;
  
  db.run(sql, [votoId, partidoId, votanteId, candidatoId], function (err) {
    if (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Ya has emitido tu voto para este partido.' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, mensaje: 'Voto registrado exitosamente.' });
  });
});

// Obtener conteo y ganador MVP
app.get('/api/partidos/:id/resultado-mvp', (req, res) => {
  const partidoId = req.params.id;
  const sql = `
    SELECT u.id, u.nombre, u.dorsal, COUNT(v.id) AS votos
    FROM votaciones_mvp v
    JOIN usuarios u ON v.candidato_id = u.id
    WHERE v.partido_id = ?
    GROUP BY u.id
    ORDER BY votos DESC
  `;

  db.all(sql, [partidoId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ranking: rows, ganador: rows[0] || null });
  });
});

// ==========================================
// 5. MURO DE PUBLICACIONES OFICIALES DE LA LIGA
// ==========================================
app.get('/api/publicaciones/liga', (_req, res) => {
  const sql = `
    SELECT * FROM publicaciones 
    WHERE es_oficial_liga = 1 
    ORDER BY creado_en DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Endpoints para sincronización compartida de Supabase entre diferentes dispositivos
app.get('/api/supabase-config', (_req, res) => {
  db.get(`SELECT value FROM app_store WHERE key = 'supabase_config'`, (err, row: any) => {
    let creds = {
      url: process.env.VITE_SUPABASE_URL || '',
      anonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
    };
    if (!err && row && row.value) {
      try {
        const parsed = JSON.parse(row.value);
        if (parsed.url) creds.url = parsed.url;
        if (parsed.anonKey) creds.anonKey = parsed.anonKey;
      } catch {}
    }
    res.json({
      url: creds.url,
      anonKey: creds.anonKey,
      isConfigured: Boolean(creds.url && creds.anonKey && creds.url.startsWith('http')),
    });
  });
});

app.post('/api/supabase-config', (req, res) => {
  const { url, anonKey } = req.body;
  const config = { url: (url || '').trim(), anonKey: (anonKey || '').trim() };
  currentVersion = Date.now();
  db.run(
    `INSERT OR REPLACE INTO app_store (key, value, updated_at) VALUES ('supabase_config', ?, ?)`,
    [JSON.stringify(config), currentVersion],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, isConfigured: Boolean(config.url && config.anonKey) });
    }
  );
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
      result.joinRequests = [];
    }

    if (!result.joinRequests) {
      result.joinRequests = [];
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

    // 6. Join Requests: Merge by id
    let mergedJoinRequests: any[] = currentData.joinRequests || [];
    if (updates.joinRequests && Array.isArray(updates.joinRequests)) {
      updates.joinRequests.forEach((newR: any) => {
        mergedJoinRequests = [newR, ...mergedJoinRequests.filter((r: any) => r.id !== newR.id)];
      });
    }

    // Write merged state to SQLite app_store and relational tables
    db.serialize(() => {
      const stmt = db.prepare(`INSERT OR REPLACE INTO app_store (key, value, updated_at) VALUES (?, ?, ?)`);
      if (updates.team) {
        stmt.run('team', JSON.stringify(updates.team), currentVersion);
        db.run(
          `INSERT OR REPLACE INTO equipos (id, nombre_equipo, logo, direccion, liga_id, admin_id, color_primario, color_secundario)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            updates.team.id || 'team_01',
            updates.team.name || 'FC Bayern Munich',
            updates.team.logoUrl || '',
            updates.team.stadium || updates.team.location || '',
            'liga_01',
            'u_admin',
            updates.team.primaryColor || '#1877F2',
            updates.team.secondaryColor || '#0866FF'
          ],
          () => {}
        );
      }
      stmt.run('allTeams', JSON.stringify(mergedAllTeams), currentVersion);
      stmt.run('users', JSON.stringify(mergedUsers), currentVersion);
      stmt.run('players', JSON.stringify(mergedPlayers), currentVersion);
      stmt.run('matches', JSON.stringify(mergedMatches), currentVersion);
      stmt.run('posts', JSON.stringify(mergedPosts), currentVersion);
      stmt.run('joinRequests', JSON.stringify(mergedJoinRequests), currentVersion);
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
            [targetTeamId, ...taggedMatches.map((m: any) => m.id)],
            () => {}
          );
        } else {
          db.run(`DELETE FROM partidos WHERE team_id = ?`, [targetTeamId], () => {});
        }

        try {
          const matchStmt = db.prepare(`
            INSERT OR REPLACE INTO partidos (
              id, liga_id, equipo_local_id, equipo_visita_id, fecha, hora, ubicacion, team_id, rival, cancha, payload, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          taggedMatches.forEach((m: any) => {
            matchStmt.run(
              m.id,
              m.leagueId || 'liga_01',
              m.teamId || targetTeamId,
              m.rivalId || 'rival_default',
              m.date || '',
              m.time || '',
              m.stadium || m.location || '',
              m.teamId || targetTeamId,
              m.rival || '',
              m.stadium || '',
              JSON.stringify(m),
              currentVersion
            );
          });
          matchStmt.finalize();
        } catch (e) {
          console.warn('Error saving matches in SQLite table:', e);
        }
      }

      // Upsert individual posts into relational table 'publicaciones'
      if (updates.posts && Array.isArray(updates.posts)) {
        try {
          const postStmt = db.prepare(`
            INSERT OR REPLACE INTO publicaciones (
              id, autor_id, equipo_id, team_id, liga_id, autor_nombre, autor_rol, categoria, titulo, contenido, img, es_oficial_liga, estado, payload, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          mergedPosts.forEach((p: any) => {
            postStmt.run(
              p.id,
              p.authorId || 'u_admin',
              p.teamId || null,
              p.teamId || null,
              p.leagueId || 'liga_01',
              p.authorName || '',
              p.authorRole || 'player',
              p.category || 'Anuncio',
              p.title || '',
              p.content || '',
              p.imageUrl || null,
              p.isLeagueOfficial || p.authorRole === 'league_admin' ? 1 : 0,
              p.status || 'aprobado',
              JSON.stringify(p),
              currentVersion
            );
          });
          postStmt.finalize();
        } catch (e) {
          console.warn('Error saving posts in SQLite table:', e);
        }
      }

      // Upsert individual join requests into 'solicitudes_equipo'
      if (updates.joinRequests && Array.isArray(updates.joinRequests)) {
        const reqStmt = db.prepare(`INSERT OR REPLACE INTO solicitudes_equipo (id, user_id, user_name, user_email, team_id, team_name, status, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        mergedJoinRequests.forEach((r: any) => {
          reqStmt.run(
            r.id,
            r.userId,
            r.userName || '',
            r.userEmail || '',
            r.teamId,
            r.teamName || '',
            r.status || 'pending',
            JSON.stringify(r),
            Date.now(),
            currentVersion
          );
        });
        reqStmt.finalize();
      }

      res.json({
        success: true,
        version: currentVersion,
        posts: mergedPosts,
        matches: mergedMatches,
        joinRequests: mergedJoinRequests,
        users: mergedUsers,
        players: mergedPlayers,
        allTeams: mergedAllTeams,
      });
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

// Eliminar una publicación directamente por ID
app.delete('/api/publicaciones/:id', (req, res) => {
  const postId = req.params.id;
  currentVersion = Date.now();
  db.serialize(() => {
    db.run(`DELETE FROM publicaciones WHERE id = ?`, [postId]);
    db.get(`SELECT value FROM app_store WHERE key = 'posts'`, (err, row: any) => {
      if (!err && row && row.value) {
        try {
          const list = JSON.parse(row.value).filter((p: any) => p.id !== postId);
          db.run(
            `INSERT OR REPLACE INTO app_store (key, value, updated_at) VALUES ('posts', ?, ?)`,
            [JSON.stringify(list), currentVersion]
          );
        } catch {}
      }
    });
  });
  res.json({ success: true, deletedId: postId, version: currentVersion });
});

// Endpoint de Solicitudes de Ingreso a Equipos
app.get('/api/solicitudes', (_req, res) => {
  db.all(`SELECT payload FROM solicitudes_equipo ORDER BY updated_at DESC`, [], (err, rows: any[]) => {
    if (!err && rows && rows.length > 0) {
      try {
        return res.json(rows.map((r) => JSON.parse(r.payload)));
      } catch {}
    }
    db.get(`SELECT value FROM app_store WHERE key = 'joinRequests'`, (err2, row: any) => {
      if (!err2 && row && row.value) {
        try {
          return res.json(JSON.parse(row.value));
        } catch {}
      }
      res.json([]);
    });
  });
});

// Crear o actualizar solicitud de ingreso
app.post('/api/solicitudes', (req, res) => {
  const request = req.body;
  if (!request || !request.userId || !request.teamId) {
    return res.status(400).json({ error: 'Datos de solicitud incompletos' });
  }

  const reqId = request.id || `req_${Date.now()}`;
  const reqObj = {
    ...request,
    id: reqId,
    status: request.status || 'pending',
    createdAt: request.createdAt || new Date().toISOString(),
  };

  currentVersion = Date.now();
  db.serialize(() => {
    db.run(
      `INSERT OR REPLACE INTO solicitudes_equipo (id, user_id, user_name, user_email, team_id, team_name, status, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reqObj.id,
        reqObj.userId,
        reqObj.userName || '',
        reqObj.userEmail || '',
        reqObj.teamId,
        reqObj.teamName || '',
        reqObj.status,
        JSON.stringify(reqObj),
        Date.now(),
        currentVersion,
      ]
    );

    db.get(`SELECT value FROM app_store WHERE key = 'joinRequests'`, (err, row: any) => {
      let list: any[] = [];
      if (!err && row && row.value) {
        try {
          list = JSON.parse(row.value);
        } catch {}
      }
      list = [reqObj, ...list.filter((r) => r.id !== reqObj.id)];
      db.run(
        `INSERT OR REPLACE INTO app_store (key, value, updated_at) VALUES ('joinRequests', ?, ?)`,
        [JSON.stringify(list), currentVersion]
      );
    });
  });

  res.json({ success: true, request: reqObj, version: currentVersion });
});

// Resolver solicitud (Aceptar o Rechazar)
app.put('/api/solicitudes/:id', (req, res) => {
  const reqId = req.params.id;
  const { status } = req.body; // 'accepted' | 'rejected'

  if (!status || !['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Estado no válido' });
  }

  currentVersion = Date.now();
  db.serialize(() => {
    db.get(`SELECT payload FROM solicitudes_equipo WHERE id = ?`, [reqId], (err, row: any) => {
      let targetReq: any = null;
      if (!err && row && row.payload) {
        try {
          targetReq = JSON.parse(row.payload);
        } catch {}
      }

      if (targetReq) {
        targetReq.status = status;
        targetReq.resolvedAt = new Date().toISOString();

        db.run(
          `UPDATE solicitudes_equipo SET status = ?, payload = ?, updated_at = ? WHERE id = ?`,
          [status, JSON.stringify(targetReq), currentVersion, reqId]
        );
      }

      db.get(`SELECT value FROM app_store WHERE key = 'joinRequests'`, (_err2, row2: any) => {
        let list: any[] = [];
        if (row2 && row2.value) {
          try {
            list = JSON.parse(row2.value);
          } catch {}
        }
        list = list.map((r) => (r.id === reqId ? { ...r, status, resolvedAt: new Date().toISOString() } : r));
        db.run(
          `INSERT OR REPLACE INTO app_store (key, value, updated_at) VALUES ('joinRequests', ?, ?)`,
          [JSON.stringify(list), currentVersion]
        );
      });
    });
  });

  res.json({ success: true, id: reqId, status, version: currentVersion });
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
