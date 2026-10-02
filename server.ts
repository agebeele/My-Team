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
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

app.post('/api/ai/scan-table', async (req, res) => {
  try {
    const { images, imageBase64, mimeType = 'image/jpeg', teamName = '' } = req.body;

    // Normalize images list
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

    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini API Key is available, try Gemini 3.8 Flash Vision
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
Analiza detalladamente las ${imageList.length} imágenes adjuntas, que corresponden a la tabla de clasificación o posiciones de la liga (pueden ser partes consecutivas de la tabla o capturas de varias secciones, por ejemplo posiciones 1 a 16 en una foto y 17 a 31 en otra).
Extrae absolutamente TODAS las filas de la tabla combinadas en orden estricto de posición (desde la posición 1 hasta la última, por ejemplo 31 equipos).
Para cada equipo extrae:
- rank: Posición numérica consecutiva (1, 2, 3... hasta 31+)
- name: Nombre oficial del equipo tal como aparece
- pj: Partidos jugados (o JJ)
- g: Partidos ganados (o JG, PG)
- e: Partidos empatados (o JE, PE)
- p: Partidos perdidos (o JP, PP)
- gf: Goles a favor
- gc: Goles en contra
- dg: Diferencia de goles (gf - gc)
- pts: Puntos totales

El equipo del usuario es o contiene: "${teamName}".
NO inventes datos: respeta fielmente los números de cada equipo que aparecen en las imágenes.
Asegúrate de calcular los valores faltantes si alguna columna estuviera borrosa o cortada (dg = gf - gc, pts = g*3 + e).
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

    // Tell the client to run client-side OCR directly on device
    return res.json({
      requiresClientScan: true,
      message: 'Escaneo visual directo activado en cliente.',
    });
  } catch (error: any) {
    console.error('Error en endpoint de escaneo:', error);
    return res.status(500).json({ error: error.message || 'Error procesando la tabla' });
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
