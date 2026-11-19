import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { images, imageBase64, mimeType = 'image/jpeg', teamName = '' } = req.body || {};

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
      return res.status(400).json({ error: 'No image provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        requiresClientScan: true,
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

    const responseSchema = {
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
    };

    const perImageResults = await Promise.all(
      imageList.map(async (img, idx) => {
        const promptText = `Eres un experto en digitalización de tablas de clasificación de ligas de fútbol.
Analiza la imagen ${idx + 1} de ${imageList.length} adjunta.
Extrae ABSOLUTAMENTE TODAS las filas visibles en esta imagen, desde la primera fila arriba hasta la última fila abajo, SIN OMITIR NI RESUMIR NINGUNA FILA.

Guía de columnas (de izquierda a derecha en la mayoría de tablas):
1. POS -> rank
2. Escudo/Logo (ignorar)
3. EQUIPO -> name (si la celda dice "0" o está vacía, escribe "Equipo " + rank)
4. JJ/PJ -> pj
5. JG/G -> g
6. JE/E -> e
7. JP/P -> p
8. GF -> gf
9. GC -> gc
10. DIF/DG -> dg
11. PTOS/PTS -> pts

Si esta imagen es una continuación (por ejemplo filas 16 a 31) sin encabezados arriba, usa ese mismo orden de columnas.
El equipo del usuario es: "${teamName}".`;

        const cleanBase64 = img.base64.replace(/^data:[^;]+;base64,/, '');
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: img.mimeType || 'image/jpeg',
                  data: cleanBase64,
                },
              },
              { text: promptText },
            ],
          },
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
            responseMimeType: 'application/json',
            responseSchema,
          },
        });
        return JSON.parse((response.text ?? '{}').trim()) as { leagueName?: string; teams?: any[] };
      })
    );

    let detectedLeagueName = '';
    const mergedMap = new Map<string, any>();

    for (const page of perImageResults) {
      if (!detectedLeagueName && page.leagueName && page.leagueName.trim().length > 2) {
        detectedLeagueName = page.leagueName.trim();
      }
      if (Array.isArray(page.teams)) {
        for (const item of page.teams) {
          const rank = Number(item.rank) || 0;
          let rawName = String(item.name ?? '').trim();
          if (!rawName || rawName === '0' || rawName === '-') {
            rawName = rank > 0 ? `Equipo ${rank}` : `Equipo ${mergedMap.size + 1}`;
          }
          const normName = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
          const isGenericName = !normName || normName === '0' || /^equipo\d+$/.test(normName);
          const dedupKey = isGenericName
            ? `rank_${rank || mergedMap.size + 1}`
            : `${normName}_${rank || ''}`;

          if (!mergedMap.has(dedupKey)) {
            mergedMap.set(dedupKey, {
              rank: rank || mergedMap.size + 1,
              name: rawName,
              pj: Math.max(0, Number(item.pj) || 0),
              g: Math.max(0, Number(item.g) || 0),
              e: Math.max(0, Number(item.e) || 0),
              p: Math.max(0, Number(item.p) || 0),
              gf: Math.max(0, Number(item.gf) || 0),
              gc: Math.max(0, Number(item.gc) || 0),
              dg: Number.isFinite(Number(item.dg)) ? Number(item.dg) : (Number(item.gf) || 0) - (Number(item.gc) || 0),
              pts: Number.isFinite(Number(item.pts)) ? Number(item.pts) : (Number(item.g) || 0) * 3 + (Number(item.e) || 0),
            });
          }
        }
      }
    }

    const teams = Array.from(mergedMap.values()).sort(
      (a, b) => (a.rank || 999) - (b.rank || 999) || b.pts - a.pts || b.dg - a.dg
    );

    return res.status(200).json({
      leagueName: detectedLeagueName || undefined,
      teams,
      engine: 'gemini-vision',
    });
  } catch (error: any) {
    return res.status(error?.status || 500).json({ error: error.message || 'Error processing image' });
  }
}
