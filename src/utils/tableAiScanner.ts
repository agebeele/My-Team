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
  'atl club': 'https://a.espncdn.com/i/teamlogos/soccer/500/93.png',
  'valencia': 'https://a.espncdn.com/i/teamlogos/soccer/500/94.png',
  'celta': 'https://a.espncdn.com/i/teamlogos/soccer/500/85.png',
  'celta de vigo': 'https://a.espncdn.com/i/teamlogos/soccer/500/85.png',

  // Germany
  'bayern': '/fc_bayern_logo.png',
  'bayern munich': '/fc_bayern_logo.png',
  'bayern münchen': '/fc_bayern_logo.png',
  'fc bayern': '/fc_bayern_logo.png',
  'borussia': 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
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
  'new castle': 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png',
  'fulham': 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png',
  'fullham': 'https://a.espncdn.com/i/teamlogos/soccer/500/370.png',
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
  'int.de milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
  'inter de milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
  'palermo': 'https://a.espncdn.com/i/teamlogos/soccer/500/105.png',
  'fiorentina': 'https://a.espncdn.com/i/teamlogos/soccer/500/109.png',
  'napoli': 'https://a.espncdn.com/i/teamlogos/soccer/500/114.png',
  'roma': 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
  'as roma': 'https://a.espncdn.com/i/teamlogos/soccer/500/104.png',
  'lazio': 'https://a.espncdn.com/i/teamlogos/soccer/500/112.png',
  'atalanta': 'https://a.espncdn.com/i/teamlogos/soccer/500/107.png',

  // France
  'psg': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
  'paris saint-germain': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
  'paris sg': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
  'marsella': 'https://a.espncdn.com/i/teamlogos/soccer/500/166.png',
  'marseille': 'https://a.espncdn.com/i/teamlogos/soccer/500/166.png',
  'as monaco': 'https://a.espncdn.com/i/teamlogos/soccer/500/174.png',
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
  'feyernoord': 'https://a.espncdn.com/i/teamlogos/soccer/500/140.png',
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
const SORTED_CREST_ENTRIES = Object.entries(CLUB_CRESTS).sort(
  (a, b) => b[0].length - a[0].length
);

export function getCrestForTeam(
  name: string,
  isOurTeam: boolean,
  ourTeamLogo?: string
): string {
  if (isOurTeam) {
    return ourTeamLogo || '/fc_bayern_logo.png';
  }

  const clean = name.toLowerCase().replace(/\s+/g, ' ').trim();

  // Explicit Bayern check
  if (clean.includes('bayern')) {
    return ourTeamLogo || '/fc_bayern_logo.png';
  }

  // Exact or word-boundary match sorted by specificity (longest key first)
  for (const [key, url] of SORTED_CREST_ENTRIES) {
    if (
      clean === key ||
      clean.includes(` ${key} `) ||
      clean.startsWith(`${key} `) ||
      clean.endsWith(` ${key}`)
    ) {
      return url;
    }
  }

  // Substring match for longer club names (len >= 4), also longest key first
  for (const [key, url] of SORTED_CREST_ENTRIES) {
    if (key.length >= 4 && clean.includes(key)) {
      return url;
    }
  }

  // Common/amateur/unmatched club name: return grey shield SVG
  return DEFAULT_GREY_SHIELD_SVG;
}

export const resolveTeamLogo = getCrestForTeam;

/**
 * Normalizes an uploaded image size for fast API transfer while keeping crisp table text.
 */
function prepareImageForApi(img: TableImageInput): Promise<TableImageInput> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(img);
    }
    const image = new Image();
    image.onload = () => {
      try {
        const maxDim = 1800;
        let w = image.naturalWidth || image.width || 800;
        let h = image.naturalHeight || image.height || 600;
        if (w <= maxDim && h <= maxDim && img.base64.length < 1_800_000) {
          return resolve(img);
        }
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(img);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(image, 0, 0, w, h);
        resolve({
          ...img,
          base64: canvas.toDataURL('image/jpeg', 0.9),
          mimeType: 'image/jpeg',
        });
      } catch {
        resolve(img);
      }
    };
    image.onerror = () => resolve(img);
    image.src = img.base64;
  });
}

/**
 * Pre-processes an image using an offscreen canvas for Tesseract OCR:
 * Upscales small screenshots to >= 1600px width and boosts grayscale contrast.
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
        const minTargetW = 1600;
        const maxDim = 2400;
        let w = img.naturalWidth || img.width || 800;
        let h = img.naturalHeight || img.height || 600;

        if (w < minTargetW) {
          const scale = Math.min(2.5, minTargetW / w);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
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
        ctx.filter = 'grayscale(100%) contrast(155%) brightness(105%)';
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
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
  onProgress?.('Inicializando motor de lectura OCR en dispositivo...');
  const worker = await createWorker('spa+eng');
  const results: ParsedTableResult[] = [];

  try {
    for (let i = 0; i < images.length; i++) {
      onProgress?.(`Optimizando y analizando foto ${i + 1} de ${images.length}...`);
      const img = images[i];
      const cleanImgData = await preprocessImageForOcr(img.base64);

      onProgress?.(`Extrayendo filas de la foto ${i + 1} de ${images.length}...`);
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
  const rawImageList: TableImageInput[] = Array.isArray(input)
    ? input
    : [{ base64: input, mimeType }];

  if (rawImageList.length === 0) {
    throw new Error('No se ha proporcionado ninguna imagen para escanear.');
  }

  onProgress?.(`Preparando ${rawImageList.length} foto${rawImageList.length > 1 ? 's' : ''} para análisis con Gemini Vision AI...`);
  const imageList = await Promise.all(rawImageList.map(prepareImageForApi));

  let data: ScanTableResponse | null = null;
  let usedEngine = 'unknown';
  let serverErrorMessage: string | null = null;

  onProgress?.(`Analizando ${imageList.length} foto${imageList.length > 1 ? 's' : ''} con Gemini Vision AI...`);

  const endpoints = ['/api/ai/scan-table', '/api/scan-table'];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: imageList,
          teamName: `${ourTeamName} ${ourTeamShortName}`.trim(),
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        continue;
      }

      const json = await res.json();
      if (res.ok && json && Array.isArray(json.teams) && json.teams.length > 0) {
        data = json;
        usedEngine = json.engine || 'Gemini Vision AI';
        break;
      }

      if (json?.error && !json?.requiresClientScan) {
        serverErrorMessage = json.error;
      } else if (json?.error && json?.requiresClientScan) {
        serverErrorMessage = json.error;
      }

      if (json?.requiresClientScan) {
        break;
      }
    } catch (err) {
      console.warn(`Endpoint ${endpoint} no disponible:`, err);
    }
  }

  // Fallback to browser OCR if backend AI key wasn't configured or endpoint unavailable
  if (!data || !data.teams || data.teams.length === 0) {
    onProgress?.('Analizando filas y columnas con escáner OCR en dispositivo...');
    const localParsed = await runClientSideOcr(imageList, onProgress);
    if (localParsed.teams && localParsed.teams.length >= 2) {
      data = {
        leagueName: localParsed.leagueName,
        teams: localParsed.teams,
        engine: 'OCR Local',
      };
      usedEngine = 'OCR Local';
    } else if (serverErrorMessage) {
      throw new Error(`Error de Gemini Vision: ${serverErrorMessage}`);
    } else if (localParsed.teams && localParsed.teams.length > 0) {
      data = {
        leagueName: localParsed.leagueName,
        teams: localParsed.teams,
        engine: 'OCR Local',
      };
      usedEngine = 'OCR Local';
    }
  }

  if (!data || !data.teams || data.teams.length === 0) {
    throw new Error(
      serverErrorMessage ||
        'No se pudieron identificar las filas de la tabla en las fotos proporcionadas. Verifica la claridad de las imágenes o pega el texto de la tabla.'
    );
  }

  const cleanOurName = ourTeamName.toLowerCase().trim();
  const cleanOurShort = ourTeamShortName.toLowerCase().trim();

  let ourTeamFound = false;

  const rows: StandingsRow[] = data.teams.map((item, index) => {
    const rankNum = Number(item.rank) > 0 ? Number(item.rank) : index + 1;
    let itemName = String(item.name || '').trim();
    if (!itemName || itemName === '0') {
      itemName = `Equipo ${rankNum}`;
    }
    const cleanItemName = itemName.toLowerCase().trim();

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
    const pj = Math.max(0, Number(item.pj) || 0);
    const g = Math.max(0, Number(item.g) || 0);
    const e = Math.max(0, Number(item.e) || 0);
    const p = Math.max(0, Number(item.p) || 0);
    const gf = Math.max(0, Number(item.gf) || 0);
    const gc = Math.max(0, Number(item.gc) || 0);
    const dg = Number.isFinite(Number(item.dg)) ? Number(item.dg) : gf - gc;
    const pts = Number.isFinite(Number(item.pts)) ? Number(item.pts) : g * 3 + e;

    return {
      id: `standing_${Date.now()}_${index}`,
      rank: rankNum,
      name: itemName,
      logo,
      pj,
      g,
      e,
      p,
      gf,
      gc,
      dg,
      pts,
      isOurTeam,
    };
  });

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
