import { StandingsRow } from '../types';
import { createWorker } from 'tesseract.js';
import {
  parseStandingsFromOcrText,
  mergeExtractedTables,
  ParsedTableResult,
  DEFAULT_GREY_SHIELD_SVG,
} from './ocrTableParser';

export { DEFAULT_GREY_SHIELD_SVG };

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

/**
 * High-definition official crests for European, Latin American & International football clubs.
 */
export const CLUB_CRESTS: Record<string, string> = {
  // Spain
  'real madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
  'madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
  'barcelona': 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
  'barca': 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
  'barça': 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
  'atletico madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png',
  'atlético madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png',
  'atletico de madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png',
  'atleti': 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png',
  'sevilla': 'https://a.espncdn.com/i/teamlogos/soccer/500/243.png',
  'betis': 'https://a.espncdn.com/i/teamlogos/soccer/500/244.png',
  'real betis': 'https://a.espncdn.com/i/teamlogos/soccer/500/244.png',
  'real sociedad': 'https://a.espncdn.com/i/teamlogos/soccer/500/89.png',
  'villarreal': 'https://a.espncdn.com/i/teamlogos/soccer/500/102.png',
  'athletic club': 'https://a.espncdn.com/i/teamlogos/soccer/500/93.png',
  'athletic bilbao': 'https://a.espncdn.com/i/teamlogos/soccer/500/93.png',
  'valencia': 'https://a.espncdn.com/i/teamlogos/soccer/500/94.png',
  'celta': 'https://a.espncdn.com/i/teamlogos/soccer/500/85.png',
  'celta de vigo': 'https://a.espncdn.com/i/teamlogos/soccer/500/85.png',

  // Germany
  'bayern': '/fc_bayern_logo.png',
  'bayern munich': '/fc_bayern_logo.png',
  'bayern münchen': '/fc_bayern_logo.png',
  'fc bayern': '/fc_bayern_logo.png',
  'borussia dortmund': 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
  'dortmund': 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
  'bvb': 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
  'bayer leverkusen': 'https://a.espncdn.com/i/teamlogos/soccer/500/131.png',
  'leverkusen': 'https://a.espncdn.com/i/teamlogos/soccer/500/131.png',
  'rb leipzig': 'https://a.espncdn.com/i/teamlogos/soccer/500/11420.png',
  'leipzig': 'https://a.espncdn.com/i/teamlogos/soccer/500/11420.png',
  'eintracht frankfurt': 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png',
  'frankfurt': 'https://a.espncdn.com/i/teamlogos/soccer/500/125.png',

  // England
  'manchester city': 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
  'man city': 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
  'man. city': 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
  'arsenal': 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
  'liverpool': 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png',
  'chelsea': 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png',
  'tottenham': 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png',
  'spurs': 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png',
  'manchester united': 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png',
  'man united': 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png',
  'man. united': 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png',
  'aston villa': 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png',
  'newcastle': 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png',
  'fulham': 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png',
  'brighton': 'https://a.espncdn.com/i/teamlogos/soccer/500/331.png',
  'west ham': 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png',

  // Italy
  'juventus': 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png',
  'juve': 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png',
  'milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png',
  'ac milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png',
  'inter': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
  'inter milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
  'int. de milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
  'inter de milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
  'napoli': 'https://a.espncdn.com/i/teamlogos/soccer/500/114.png',
  'roma': 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
  'as roma': 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
  'lazio': 'https://a.espncdn.com/i/teamlogos/soccer/500/112.png',
  'atalanta': 'https://a.espncdn.com/i/teamlogos/soccer/500/107.png',

  // France
  'psg': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
  'paris saint-germain': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
  'paris sg': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
  'marseille': 'https://a.espncdn.com/i/teamlogos/soccer/500/166.png',
  'monaco': 'https://a.espncdn.com/i/teamlogos/soccer/500/174.png',
  'lyon': 'https://a.espncdn.com/i/teamlogos/soccer/500/167.png',

  // Portugal & Netherlands
  'porto': 'https://a.espncdn.com/i/teamlogos/soccer/500/437.png',
  'fc porto': 'https://a.espncdn.com/i/teamlogos/soccer/500/437.png',
  'benfica': 'https://a.espncdn.com/i/teamlogos/soccer/500/439.png',
  'sporting': 'https://a.espncdn.com/i/teamlogos/soccer/500/440.png',
  'sporting cp': 'https://a.espncdn.com/i/teamlogos/soccer/500/440.png',
  'ajax': 'https://a.espncdn.com/i/teamlogos/soccer/500/139.png',
  'feyenoord': 'https://a.espncdn.com/i/teamlogos/soccer/500/140.png',
  'psv': 'https://a.espncdn.com/i/teamlogos/soccer/500/148.png',
  'psv eindhoven': 'https://a.espncdn.com/i/teamlogos/soccer/500/148.png',

  // Latin America & Mexico
  'america': 'https://a.espncdn.com/i/teamlogos/soccer/500/222.png',
  'américa': 'https://a.espncdn.com/i/teamlogos/soccer/500/222.png',
  'club america': 'https://a.espncdn.com/i/teamlogos/soccer/500/222.png',
  'chivas': 'https://a.espncdn.com/i/teamlogos/soccer/500/217.png',
  'guadalajara': 'https://a.espncdn.com/i/teamlogos/soccer/500/217.png',
  'cruz azul': 'https://a.espncdn.com/i/teamlogos/soccer/500/215.png',
  'pumas': 'https://a.espncdn.com/i/teamlogos/soccer/500/227.png',
  'unam': 'https://a.espncdn.com/i/teamlogos/soccer/500/227.png',
  'tigres': 'https://a.espncdn.com/i/teamlogos/soccer/500/232.png',
  'monterrey': 'https://a.espncdn.com/i/teamlogos/soccer/500/225.png',
  'rayados': 'https://a.espncdn.com/i/teamlogos/soccer/500/225.png',
  'santos': 'https://a.espncdn.com/i/teamlogos/soccer/500/229.png',
  'santos laguna': 'https://a.espncdn.com/i/teamlogos/soccer/500/229.png',
  'toluca': 'https://a.espncdn.com/i/teamlogos/soccer/500/230.png',
  'pachuca': 'https://a.espncdn.com/i/teamlogos/soccer/500/226.png',
  'leon': 'https://a.espncdn.com/i/teamlogos/soccer/500/223.png',
  'león': 'https://a.espncdn.com/i/teamlogos/soccer/500/223.png',
  'atlas': 'https://a.espncdn.com/i/teamlogos/soccer/500/214.png',
  'puebla': 'https://a.espncdn.com/i/teamlogos/soccer/500/228.png',
  'tijuana': 'https://a.espncdn.com/i/teamlogos/soccer/500/1069.png',
  'xolos': 'https://a.espncdn.com/i/teamlogos/soccer/500/1069.png',
  'boca': 'https://a.espncdn.com/i/teamlogos/soccer/500/5.png',
  'boca juniors': 'https://a.espncdn.com/i/teamlogos/soccer/500/5.png',
  'river': 'https://a.espncdn.com/i/teamlogos/soccer/500/16.png',
  'river plate': 'https://a.espncdn.com/i/teamlogos/soccer/500/16.png',
  'flamengo': 'https://a.espncdn.com/i/teamlogos/soccer/500/6001.png',
  'palmeiras': 'https://a.espncdn.com/i/teamlogos/soccer/500/6002.png',
};

/**
 * Resolves a team logo according to the team name:
 * 1. If it's our team (Bayern Munich / user club), returns official team logo.
 * 2. If it's a known international or professional club, returns the official club crest.
 * 3. For any common, generic or amateur name ("los que tienen nombre comun deja un escudo gris"),
 *    returns an elegant, clean grey shield SVG.
 */
export function getCrestForTeam(
  name: string,
  isOurTeam: boolean,
  ourTeamLogo?: string
): string {
  if (isOurTeam) {
    return ourTeamLogo || '/fc_bayern_logo.png';
  }

  const clean = name.toLowerCase().trim();

  // Explicit Bayern check
  if (clean.includes('bayern')) {
    return ourTeamLogo || '/fc_bayern_logo.png';
  }

  // Exact or contains match against known club crests
  for (const [key, url] of Object.entries(CLUB_CRESTS)) {
    // Word boundary or substring match
    if (clean === key || clean.includes(` ${key} `) || clean.startsWith(`${key} `) || clean.endsWith(` ${key}`)) {
      return url;
    }
  }

  // Substring match for longer club names (len > 4)
  for (const [key, url] of Object.entries(CLUB_CRESTS)) {
    if (key.length >= 4 && clean.includes(key)) {
      return url;
    }
  }

  // Common/amateur/unmatched club name: return grey shield SVG
  return DEFAULT_GREY_SHIELD_SVG;
}

export const resolveTeamLogo = getCrestForTeam;

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
 * Client-side browser OCR using Tesseract.js across all provided photos
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
      onProgress?.(`Optimizando y analizando foto ${i + 1} de ${images.length}...`);
      const img = images[i];
      const cleanImgData = await preprocessImageForOcr(img.base64);

      onProgress?.(`Escaneando filas y estadísticas de foto ${i + 1} de ${images.length}...`);
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

  // If server had no data or delegated, run browser OCR directly on device
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
      'No se pudieron identificar las filas de la tabla en las fotos proporcionadas. Puedes cargar los 31 equipos con 1 clic o agregarlos manualmente.'
    );
  }

  const cleanOurName = ourTeamName.toLowerCase().trim();
  const cleanOurShort = ourTeamShortName.toLowerCase().trim();

  let ourTeamFound = false;

  const rows: StandingsRow[] = data.teams.map((item, index) => {
    const itemName = item.name || `Equipo ${item.rank || index + 1}`;
    const cleanItemName = itemName.toLowerCase().trim();

    // Check if this row is our team (Bayern Munich or user team)
    let isOurTeam = false;
    if (
      !ourTeamFound &&
      (cleanItemName.includes('bayern') ||
        (cleanOurName.length > 2 && cleanItemName.includes(cleanOurName)) ||
        (cleanOurShort.length > 1 && cleanItemName.includes(cleanOurShort)) ||
        (cleanItemName.length > 2 && cleanOurName.includes(cleanItemName)) ||
        cleanItemName.includes('dream team'))
    ) {
      isOurTeam = true;
      ourTeamFound = true;
    }

    const logo = getCrestForTeam(itemName, isOurTeam, ourTeamLogo);

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

  // If our team was not matched by name, check if any row is Bayern Munich
  if (!ourTeamFound && rows.length > 0) {
    const bayernIndex = rows.findIndex((r) => r.name.toLowerCase().includes('bayern'));
    if (bayernIndex >= 0) {
      rows[bayernIndex].isOurTeam = true;
      rows[bayernIndex].logo = ourTeamLogo || '/fc_bayern_logo.png';
    }
  }

  return {
    leagueName: data.leagueName,
    rows,
    engine: usedEngine,
  };
}
