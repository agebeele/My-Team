import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg', teamName = '' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        fallback: true,
        message: 'No GEMINI_API_KEY configured',
        teams: null,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const promptText = `Eres un asistente de inteligencia artificial experto en digitalización de tablas y estadísticas de ligas de fútbol.
Analiza detalladamente la imagen adjunta, que contiene una tabla de clasificación de la liga.
Extrae todas las filas de la tabla: rank, name, pj, g, e, p, gf, gc, dg, pts.
El equipo del usuario es: "${teamName}".`;

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
            },
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
    return res.status(200).json(parsed);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error processing image' });
  }
}
