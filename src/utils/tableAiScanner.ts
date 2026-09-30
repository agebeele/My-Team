import { StandingsRow } from '../types';
import { createWorker } from 'tesseract.js';
import { parseStandingsFromOcrText, mergeExtractedTables, ParsedTableResult } from './ocrTableParser';

export interface TableImageInput {
  base64: string;
  mimeType?: string;
  name?: string;
}

export interface ScanTableResponse {
  leagueName?: string;
  engine?: string;
  teams: {
    rank: number;
    name: string;
    pj: number;
    g: number;
    e: number;
    p: number;
    gf: number;
    gc: number;
    dg: number;
    pts: number;
  }[];
}

// Famous European and Latin American club crests
export const CLUB_CRESTS: Record<string, string> = {
  'real madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
  'bayern': '/fc_bayern_logo.png',
  'bayern munich': '/fc_bayern_logo.png',
  'fc bayern': '/fc_bayern_logo.png',
  'tottenham': 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png',
  'milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png',
  'inter': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
  'int. de milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
  'manchester city': 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
  'porto': 'https://a.espncdn.com/i/teamlogos/soccer/500/437.png',
  'sevilla': 'https://a.espncdn.com/i/teamlogos/soccer/500/243.png',
  'fulham': 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png',
  'arsenal': 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
  'feyenoord': 'https://a.espncdn.com/i/teamlogos/soccer/500/140.png',
  'psg': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
  'ajax': 'https://a.espncdn.com/i/teamlogos/soccer/500/139.png',
  'roma': 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
  'benfica': 'https://a.espncdn.com/i/teamlogos/soccer/500/439.png',
  'barcelona': 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
  'chelsea': 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png',
  'liverpool': 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png',
  'juventus': 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png',
  'dortmund': 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
  'atletico madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png',
};

export const RIVAL_CRESTS = [
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=150&q=80',
];

function getCrestForTeam(name: string, isOurTeam: boolean, ourTeamLogo: string, index: number): string {
  if (isOurTeam) {
    return ourTeamLogo || '/fc_bayern_logo.png';
  }
  const clean = name.toLowerCase().trim();
  for (const [key, url] of Object.entries(CLUB_CRESTS)) {
    if (clean.includes(key)) {
      return url;
    }
  }
  return RIVAL_CRESTS[index % RIVAL_CRESTS.length];
}

/**
 * Pre-processes an image using an offscreen canvas to normalize dimensions,
 * remove transparency, and ensure optimal OCR recognition
 */
function preprocessImageForOcr(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(imageSrc);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 2048;
        let w = img.naturalWidth || img.width || 800;
        let h = img.naturalHeight || img.height || 600;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(imageSrc);
        }
        // Fill white background for clear contrast against any transparent areas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch {
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

/**
 * Client-side browser OCR fallback using Tesseract.js
 */
async function runClientSideOcr(
  images: TableImageInput[],
  onProgress?: (msg: string) => void
): Promise<ParsedTableResult> {
  onProgress?.('Inicializando motor inteligente de lectura OCR...');
  const worker = await createWorker('spa+eng');
  const results: ParsedTableResult[] = [];

  try {
    for (let i = 0; i < images.length; i++) {
      onProgress?.(`Preparando y optimizando foto ${i + 1} de ${images.length}...`);
      const img = images[i];
      const cleanImgData = await preprocessImageForOcr(img.base64);

      onProgress?.(`Escaneando filas y números de foto ${i + 1} de ${images.length}...`);
      const ret = await worker.recognize(cleanImgData);
      const text = ret.data?.text || '';
      const parsed = parseStandingsFromOcrText(text);
      if (parsed.teams.length > 0) {
        results.push(parsed);
      }
    }
  } finally {
    await worker.terminate();
  }

  return mergeExtractedTables(results);
}

export async function scanLeagueTableWithGemini(
  input: string | TableImageInput[],
  mimeType: string,
  ourTeamName: string,
  ourTeamShortName: string,
  ourTeamLogo: string,
  onProgress?: (msg: string) => void
): Promise<{ leagueName?: string; rows: StandingsRow[]; engine?: string }> {
  // Normalize input into TableImageInput array
  const imageList: TableImageInput[] = Array.isArray(input)
    ? input
    : [{ base64: input, mimeType }];

  if (imageList.length === 0) {
    throw new Error('No se ha proporcionado ninguna imagen para escanear.');
  }

  let data: ScanTableResponse | null = null;
  let usedEngine = 'unknown';

  onProgress?.(`Conectando con el servidor de análisis (${imageList.length} foto${imageList.length > 1 ? 's' : ''})...`);

  // Try server endpoint
  try {
    const res = await fetch('/api/ai/scan-table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: imageList,
        teamName: `${ourTeamName} ${ourTeamShortName}`.trim(),
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.teams && Array.isArray(json.teams) && json.teams.length > 0) {
        data = json;
        usedEngine = json.engine || 'server-ai';
      }
    }
  } catch (err) {
    console.warn('Servidor no disponible para escaneo directo, utilizando motor local:', err);
  }

  // If server had no data or was unreachable, run browser OCR directly on device
  if (!data || !data.teams || data.teams.length === 0) {
    onProgress?.('Analizando texto y columnas con escáner inteligente en dispositivo...');
    const localParsed = await runClientSideOcr(imageList, onProgress);
    if (localParsed.teams && localParsed.teams.length > 0) {
      data = {
        leagueName: localParsed.leagueName,
        teams: localParsed.teams,
        engine: 'client-ocr',
      };
      usedEngine = 'client-ocr';
    }
  }

  if (!data || !data.teams || data.teams.length === 0) {
    throw new Error(
      'No se pudieron identificar las filas de la tabla en las fotos proporcionadas. Asegúrate de que los números y nombres de los equipos se vean con nitidez e iluminación suficiente.'
    );
  }

  const cleanOurName = ourTeamName.toLowerCase().trim();
  const cleanOurShort = ourTeamShortName.toLowerCase().trim();

  let ourTeamFound = false;

  const rows: StandingsRow[] = data.teams.map((item, index) => {
    const itemName = item.name || `Equipo ${item.rank || index + 1}`;
    const cleanItemName = itemName.toLowerCase().trim();

    // Check if this row is our team
    let isOurTeam = false;
    if (
      !ourTeamFound &&
      (cleanItemName.includes('bayern') ||
        (cleanOurName.length > 2 && cleanItemName.includes(cleanOurName)) ||
        (cleanOurShort.length > 1 && cleanItemName.includes(cleanOurShort)) ||
        (cleanItemName.length > 2 && cleanOurName.includes(cleanItemName)) ||
        cleanItemName.includes('rayos') ||
        cleanItemName.includes('dream team'))
    ) {
      isOurTeam = true;
      ourTeamFound = true;
    }

    const logo = getCrestForTeam(itemName, isOurTeam, ourTeamLogo, index);

    return {
      id: `standing_${Date.now()}_${index}`,
      rank: item.rank || index + 1,
      name: itemName,
      logo,
      pj: Number(item.pj) || 0,
      g: Number(item.g) || 0,
      e: Number(item.e) || 0,
      p: Number(item.p) || 0,
      gf: Number(item.gf) || 0,
      gc: Number(item.gc) || 0,
      dg: Number(item.dg ?? (Number(item.gf) || 0) - (Number(item.gc) || 0)) || 0,
      pts: Number(item.pts ?? (Number(item.g) || 0) * 3 + (Number(item.e) || 0)) || 0,
      isOurTeam,
    };
  });

  // Sort rows strictly by rank, then PTS descending
  rows.sort((a, b) => a.rank - b.rank || b.pts - a.pts || b.dg - a.dg);

  return {
    leagueName: data.leagueName,
    rows,
    engine: usedEngine,
  };
}
