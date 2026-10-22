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

function inicializarBD() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS jugadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      posicion TEXT NOT NULL,
      numero INTEGER,
      edad INTEGER,
      telefono TEXT,
      estado TEXT DEFAULT 'Activo',
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });
}

// --- ENDPOINTS DE LA API ---

app.get('/api/ping', (_req, res) => {
  res.json({ mensaje: '¡Servidor funcionando!' });
});

// Endpoint de Jugadores que le faltaba a tu servidor
app.get('/api/jugadores', (_req, res) => {
  db.all('SELECT * FROM jugadores ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
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