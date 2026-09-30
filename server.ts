import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.post('/api/ai/scan-table', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', teamName = '' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen para analizar.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const promptText = `Eres un asistente de inteligencia artificial experto en digitalización de tablas y estadísticas de ligas de fútbol (fútbol 7, fútbol rápido, fútbol soccer).
Analiza detalladamente la imagen adjunta, que contiene una tabla de clasificación o posiciones de la liga.
Extrae todas las filas de la tabla con los siguientes datos para cada equipo:
- rank: Posición numérica (1, 2, 3...)
- name: Nombre del equipo tal como aparece
- pj: Partidos jugados (o JJ)
- g: Partidos ganados (o JG, PG)
- e: Partidos empatados (o JE, PE)
- p: Partidos perdidos (o JP, PP)
- gf: Goles a favor
- gc: Goles en contra
- dg: Diferencia de goles (gf - gc)
- pts: Puntos totales

El equipo del usuario es o contiene: "${teamName}".
Asegúrate de calcular los valores faltantes si alguna columna estuviera borrosa o cortada (dg = gf - gc).
Devuelve el nombre de la liga o torneo si es visible, y la lista completa de equipos en orden de posición.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            leagueName: {
              type: Type.STRING,
              description: 'Nombre de la liga o torneo',
            },
            teams: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rank: { type: Type.INTEGER, description: 'Posición en la tabla' },
                  name: { type: Type.STRING, description: 'Nombre del equipo' },
                  pj: { type: Type.INTEGER, description: 'Partidos jugados' },
                  g: { type: Type.INTEGER, description: 'Partidos ganados' },
                  e: { type: Type.INTEGER, description: 'Partidos empatados' },
                  p: { type: Type.INTEGER, description: 'Partidos perdidos' },
                  gf: { type: Type.INTEGER, description: 'Goles a favor' },
                  gc: { type: Type.INTEGER, description: 'Goles en contra' },
                  dg: { type: Type.INTEGER, description: 'Diferencia de goles' },
                  pts: { type: Type.INTEGER, description: 'Puntos' },
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
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error procesando tabla con Gemini:', error);
    return res.status(500).json({ error: error.message || 'Error procesando la tabla con IA' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
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
