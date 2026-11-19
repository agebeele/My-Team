import { StandingsRow } from '../types';
import { createWorker, PSM } from 'tesseract.js';
import {
  parseStandingsFromOcrText,
  mergeExtractedTables,
  ParsedTableResult,
  ExtractedTeamRaw,
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
 * Loads an image string/dataURL into an offscreen HTMLCanvasElement scaled for crisp OCR.
 */
function loadImageToOcrCanvas(
  imageSrc: string,
  targetMinWidth = 1800,
  maxDim = 3600
): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return resolve(null);
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const natW = img.naturalWidth || img.width || 800;
        const natH = img.naturalHeight || img.height || 600;
        let scale = natW < targetMinWidth ? Math.min(3, Math.max(2, Math.ceil(1600 / natW))) : 1;
        let w = Math.round(natW * scale);
        let h = Math.round(natH * scale);

        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.max(1, Math.round(w * ratio));
          h = Math.max(1, Math.round(h * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ canvas, ctx, width: w, height: h });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageSrc;
  });
}

function groupTrueBands(flags: boolean[], minGap = 3): [number, number][] {
  const bands: [number, number][] = [];
  let start = -1;
  for (let i = 0; i < flags.length; i++) {
    if (flags[i]) {
      if (start === -1) start = i;
    } else if (start !== -1) {
      if (bands.length > 0 && start - bands[bands.length - 1][1] <= minGap) {
        bands[bands.length - 1][1] = i - 1;
      } else {
        bands.push([start, i - 1]);
      }
      start = -1;
    }
  }
  if (start !== -1) bands.push([start, flags.length - 1]);
  return bands;
}

function isNeutralDarkPixel(r: number, g: number, b: number): boolean {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum < 115 && mx - mn < 48;
}

interface DetectedTableStructure {
  hLines: [number, number][];
  allRowBands: [number, number][];
  dataRows: [number, number][];
  colBands: [number, number][];
  headerTopY: number;
  medianRowHeight: number;
}

/**
 * Detects neutral-dark horizontal & vertical grid lines from a sports table image.
 * Distinguishes dark grid borders from colored columns (e.g. blue rank column) and dark header rows.
 */
function detectTableGridStructure(
  pixels: Uint8ClampedArray,
  w: number,
  h: number
): DetectedTableStructure | null {
  const rowDark = new Array<boolean>(h).fill(false);
  for (let y = 0; y < h; y++) {
    let dark = 0;
    const rowOff = y * w * 4;
    for (let x = 0; x < w; x++) {
      const i = rowOff + x * 4;
      if (isNeutralDarkPixel(pixels[i], pixels[i + 1], pixels[i + 2])) dark++;
    }
    if (dark / w > 0.5) rowDark[y] = true;
  }

  const hLines = groupTrueBands(rowDark, 3);
  if (hLines.length < 3) return null;

  const rowHeights: number[] = [];
  for (let r = 0; r < hLines.length - 1; r++) {
    const gap = hLines[r + 1][0] - hLines[r][1];
    if (gap >= 14) rowHeights.push(gap);
  }
  if (rowHeights.length === 0) return null;

  const sortedHeights = [...rowHeights].sort((a, b) => a - b);
  const medianRowHeight = sortedHeights[Math.floor(sortedHeights.length / 2)] || 60;

  const allRowBands: [number, number][] = [];
  // Recover first row if cropped right above its data (no top border line above row 16, etc.)
  if (hLines[0][0] >= medianRowHeight * 0.55 && hLines[0][0] <= medianRowHeight * 1.45) {
    allRowBands.push([2, hLines[0][0] - 2]);
  }
  for (let r = 0; r < hLines.length - 1; r++) {
    const y1 = hLines[r][1] + 2;
    const y2 = hLines[r + 1][0] - 2;
    if (y2 - y1 >= Math.max(16, medianRowHeight * 0.4)) {
      allRowBands.push([y1, y2]);
    }
  }
  // Recover bottom row if cropped without bottom border
  const lastH = hLines[hLines.length - 1][1];
  if (h - lastH >= medianRowHeight * 0.55 && h - lastH <= medianRowHeight * 1.45) {
    allRowBands.push([lastH + 2, h - 2]);
  }

  if (allRowBands.length < 2) return null;

  const yTop = allRowBands[0][0];
  const yBot = allRowBands[allRowBands.length - 1][1];
  const tableH = Math.max(1, yBot - yTop);

  const colDark = new Array<boolean>(w).fill(false);
  for (let x = 0; x < w; x++) {
    let dark = 0;
    for (let y = yTop; y <= yBot; y++) {
      const i = (y * w + x) * 4;
      if (isNeutralDarkPixel(pixels[i], pixels[i + 1], pixels[i + 2])) dark++;
    }
    if (dark / tableH > 0.44) colDark[x] = true;
  }

  const vLines = groupTrueBands(colDark, 3);
  const colBands: [number, number][] = [];
  if (vLines.length >= 2) {
    if (vLines[0][0] > 18) colBands.push([2, vLines[0][0] - 2]);
    for (let c = 0; c < vLines.length - 1; c++) {
      const x1 = vLines[c][1] + 2;
      const x2 = vLines[c + 1][0] - 2;
      if (x2 - x1 >= 16) colBands.push([x1, x2]);
    }
    if (w - vLines[vLines.length - 1][1] > 18) {
      colBands.push([vLines[vLines.length - 1][1] + 2, w - 2]);
    }
  }

  // Filter out table header row(s) where >=50% of columns after col 0 have dark/colored background
  let dataRows = allRowBands;
  if (colBands.length >= 3) {
    const filtered = allRowBands.filter(([ry1, ry2]) => {
      let darkCols = 0;
      const checkCols = colBands.slice(1);
      for (const [cx1, cx2] of checkCols) {
        let sumLum = 0;
        let cnt = 0;
        for (let y = ry1; y <= ry2; y += 2) {
          for (let x = cx1; x <= cx2; x += 2) {
            const i = (y * w + x) * 4;
            sumLum += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
            cnt++;
          }
        }
        if (sumLum / Math.max(1, cnt) < 165) darkCols++;
      }
      return darkCols < Math.max(2, Math.floor(checkCols.length * 0.5));
    });
    if (filtered.length >= 2) {
      dataRows = filtered;
    }
  }

  return {
    hLines,
    allRowBands,
    dataRows,
    colBands,
    headerTopY: hLines[0][0],
    medianRowHeight,
  };
}

/**
 * Masks the club crest on the left side of a team-name cell so colorful/tall logo shapes
 * don't interfere with Tesseract's baseline or character segmentation for the team name.
 */
function getEffectiveNameStartX(
  pixels: Uint8ClampedArray,
  w: number,
  ry1: number,
  ry2: number,
  cx1: number,
  cx2: number
): number {
  const rh = ry2 - ry1 + 1;
  const cw = cx2 - cx1 + 1;
  const searchMax = Math.min(cw, Math.round(rh * 1.35));
  if (searchMax < 20) return cx1;

  const colHasInk = new Array<boolean>(searchMax).fill(false);
  const colHasTallOrColor = new Array<boolean>(searchMax).fill(false);

  for (let dx = 0; dx < searchMax; dx++) {
    const x = cx1 + dx;
    let minY = ry2;
    let maxY = ry1;
    let inkCount = 0;
    let colorCount = 0;
    for (let y = ry1 + 2; y <= ry2 - 2; y++) {
      const i = (y * w + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (lum < 220 || sat > 28) {
        inkCount++;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      if (sat > 35) colorCount++;
    }
    if (inkCount >= 3) colHasInk[dx] = true;
    if (colorCount >= 4 || maxY - minY > rh * 0.52) colHasTallOrColor[dx] = true;
  }

  let crestEnd = 0;
  let sawIcon = false;
  let emptyRun = 0;
  for (let dx = 0; dx < searchMax; dx++) {
    if (colHasInk[dx]) {
      sawIcon = true;
      emptyRun = 0;
    } else if (sawIcon) {
      emptyRun++;
      if (emptyRun >= 8) {
        const hasCrestSignal = colHasTallOrColor.slice(0, dx - emptyRun + 1).some(Boolean);
        if (hasCrestSignal) {
          crestEnd = dx - emptyRun + 2;
        }
        break;
      }
    }
  }

  if (crestEnd === 0) {
    const fallbackMax = Math.min(searchMax, Math.round(rh * 1.05));
    if (colHasTallOrColor.slice(0, fallbackMax).filter(Boolean).length >= 10) {
      let lastCrestX = 0;
      for (let dx = 0; dx < fallbackMax; dx++) {
        if (colHasTallOrColor[dx]) lastCrestX = dx;
      }
      crestEnd = lastCrestX + 2;
    }
  }

  return Math.min(cx2 - 8, cx1 + crestEnd);
}

/**
 * Renders one or more cells from a single row onto a clean, white-padded RGB canvas,
 * automatically inverting white-on-dark/blue cells to crisp black-on-white.
 */
function renderRowCellsToCanvas(
  pixels: Uint8ClampedArray,
  srcW: number,
  ry1: number,
  ry2: number,
  cols: [number, number][],
  stripCrest = false
): HTMLCanvasElement {
  const padX = 28;
  const padY = 18;
  const rh = ry2 - ry1 + 1;

  const effCols: [number, number][] = cols.map(([x1, x2], idx) =>
    stripCrest && idx === 0 ? [getEffectiveNameStartX(pixels, srcW, ry1, ry2, x1, x2), x2] : [x1, x2]
  );

  const outW = effCols.reduce((acc, [x1, x2]) => acc + Math.max(10, x2 - x1 + 1) + padX * 2, 0) + 20;
  const outH = rh + padY * 2;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;
  const outData = ctx.createImageData(outW, outH);
  const dst = outData.data;
  dst.fill(255);

  let dx0 = 10;
  for (const [cx1, cx2] of effCols) {
    let sumLum = 0;
    let total = 0;
    let darkPx = 0;
    for (let y = ry1; y <= ry2; y++) {
      for (let x = cx1; x <= cx2; x++) {
        const si = (y * srcW + x) * 4;
        const lum = 0.299 * pixels[si] + 0.587 * pixels[si + 1] + 0.114 * pixels[si + 2];
        sumLum += lum;
        if (lum < 155) darkPx++;
        total++;
      }
    }
    const avgLum = sumLum / Math.max(1, total);
    const isInverted = avgLum < 150 || darkPx / Math.max(1, total) > 0.52;

    for (let y = ry1; y <= ry2; y++) {
      for (let x = cx1; x <= cx2; x++) {
        const si = (y * srcW + x) * 4;
        const lum = 0.299 * pixels[si] + 0.587 * pixels[si + 1] + 0.114 * pixels[si + 2];
        let val = 255;
        if (isInverted) {
          val = lum > 160 ? 0 : 255;
        } else {
          val = lum < 215 ? Math.max(0, Math.round(lum * 0.45)) : 255;
        }
        const dy = padY + (y - ry1);
        const dx = dx0 + padX + (x - cx1);
        const di = (dy * outW + dx) * 4;
        dst[di] = val;
        dst[di + 1] = val;
        dst[di + 2] = val;
        dst[di + 3] = 255;
      }
    }
    dx0 += Math.max(10, cx2 - cx1 + 1) + padX * 2;
  }

  ctx.putImageData(outData, 0, 0);
  return canvas;
}

function stitchRowCanvasesVertically(rowCanvases: HTMLCanvasElement[]): HTMLCanvasElement {
  const maxW = Math.max(1, ...rowCanvases.map((c) => c.width));
  const totalH = Math.max(1, rowCanvases.reduce((acc, c) => acc + c.height, 0));
  const big = document.createElement('canvas');
  big.width = maxW;
  big.height = totalH;
  const ctx = big.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, maxW, totalH);
  let yOff = 0;
  for (const rc of rowCanvases) {
    ctx.drawImage(rc, 0, yOff);
    yOff += rc.height;
  }
  return big;
}

/**
 * Pre-processes a borderless or fallback image using an offscreen canvas for Tesseract OCR.
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
        const minTargetW = 1800;
        const maxDim = 2800;
        let w = img.naturalWidth || img.width || 800;
        let h = img.naturalHeight || img.height || 600;

        if (w < minTargetW) {
          const scale = Math.min(3, minTargetW / w);
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
        if (!ctx) return resolve(imageSrc);
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

function buildExtractedTeamFromGridRow(
  rankStr: string,
  nameStr: string,
  statsStr: string,
  statsColCount: number,
  fallbackRank: number
): ExtractedTeamRaw | null {
  const rankClean = rankStr.replace(/\D+/g, '');
  const parsedRank = rankClean ? parseInt(rankClean, 10) : fallbackRank;
  const rank = parsedRank > 0 && parsedRank <= 200 ? parsedRank : fallbackRank;

  let cleanName = nameStr
    .replace(/^[©®•*()\[\]|_~\-=+\\\/]+\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const lowerName = cleanName.toLowerCase();
  if (
    lowerName === 'equipo' ||
    lowerName === 'club' ||
    lowerName === 'pos' ||
    lowerName === 'posicion'
  ) {
    return null;
  }

  if (!cleanName || cleanName === '0' || cleanName === '-' || /^[^a-zA-Z0-9]+$/.test(cleanName)) {
    cleanName = `Equipo ${rank}`;
  }

  const statTokens = statsStr
    .replace(/[—–]/g, '-')
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => {
      if (tok === 'O' || tok === 'o') return 0;
      const m = tok.match(/^-?\d+$/);
      return m ? parseInt(tok, 10) : null;
    })
    .filter((v): v is number => v !== null);

  if (statTokens.length < 3) {
    return null;
  }

  let pj = 0,
    g = 0,
    e = 0,
    p = 0,
    gf = 0,
    gc = 0,
    dg = 0,
    pts = 0;

  if (statTokens.length >= 8) {
    [pj, g, e, p, gf, gc, dg, pts] = statTokens.slice(-8);
  } else if (statTokens.length === 7) {
    [pj, g, e, p, gf, gc, pts] = statTokens;
    dg = gf - gc;
  } else if (statTokens.length === 6) {
    [pj, g, e, p, dg, pts] = statTokens;
    gf = dg > 0 ? dg : 0;
    gc = dg < 0 ? Math.abs(dg) : 0;
  } else if (statTokens.length === 5) {
    [pj, g, e, p, pts] = statTokens;
  } else if (statTokens.length === 4) {
    [pj, g, p, pts] = statTokens;
    e = Math.max(0, pj - (g + p));
  } else {
    [pj, dg, pts] = statTokens;
    g = Math.floor(pts / 3);
    e = pts % 3;
    p = Math.max(0, pj - (g + e));
  }

  // Restore missing minus sign on negative DG if OCR dropped thin '-' dash
  if (statsColCount >= 8 && gf - gc < 0 && dg > 0 && dg === gc - gf) {
    dg = -dg;
  } else if (statTokens.length < 8 && dg === 0 && (gf !== 0 || gc !== 0)) {
    dg = gf - gc;
  }

  if (pts === 0 && (g > 0 || e > 0)) {
    pts = g * 3 + e;
  }

  return {
    rank,
    name: cleanName,
    pj: Math.max(0, pj),
    g: Math.max(0, g),
    e: Math.max(0, e),
    p: Math.max(0, p),
    gf: Math.max(0, gf),
    gc: Math.max(0, gc),
    dg,
    pts: Math.max(0, pts),
  };
}

/**
 * Client-side browser OCR using grid-aware table segmentation + Tesseract.js across all provided photos.
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
      onProgress?.(`Detectando filas y columnas de la foto ${i + 1} de ${images.length}...`);
      const img = images[i];
      const loaded = await loadImageToOcrCanvas(img.base64);
      let imageResult: ParsedTableResult = { teams: [] };

      if (loaded) {
        const { ctx, width: w, height: h } = loaded;
        const pixels = ctx.getImageData(0, 0, w, h).data;
        const grid = detectTableGridStructure(pixels, w, h);

        if (grid && grid.dataRows.length >= 2 && grid.colBands.length >= 4) {
          onProgress?.(`Extrayendo ${grid.dataRows.length} filas detectadas en foto ${i + 1}...`);

          // Optional league title above first horizontal grid line
          let detectedLeagueName: string | undefined;
          if (grid.headerTopY > grid.medianRowHeight * 1.25) {
            try {
              const titleCanvas = document.createElement('canvas');
              titleCanvas.width = w;
              titleCanvas.height = Math.max(20, grid.headerTopY - 4);
              const tCtx = titleCanvas.getContext('2d');
              if (tCtx) {
                tCtx.drawImage(loaded.canvas, 0, 0, w, titleCanvas.height, 0, 0, w, titleCanvas.height);
                await worker.setParameters({
                  tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
                  tessedit_char_whitelist: '',
                });
                const titleRet = await worker.recognize(titleCanvas);
                const titleLines = (titleRet.data?.text || '')
                  .split('\n')
                  .map((s) => s.trim())
                  .filter((s) => s.length > 4);
                const candidate = titleLines.find((l) =>
                  /liga|torneo|campeonato|champions|premier|copa|clasificaci|posiciones/i.test(l)
                );
                if (candidate) {
                  detectedLeagueName = candidate.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ0-9\s.-]/g, ' ').replace(/\s+/g, ' ').trim();
                }
              }
            } catch {
              // ignore optional title detection failure
            }
          }

          const col0Width = grid.colBands[0][1] - grid.colBands[0][0];
          const col1Width = grid.colBands[1][1] - grid.colBands[1][0];
          const hasRankCol = col0Width < col1Width * 0.55 && grid.colBands.length >= 5;

          const rankCol = hasRankCol ? grid.colBands[0] : null;
          const nameCol = hasRankCol ? grid.colBands[1] : grid.colBands[0];
          const statsCols = hasRankCol ? grid.colBands.slice(2) : grid.colBands.slice(1);

          const rowCount = grid.dataRows.length;

          let rLines: string[] = [];
          if (rankCol) {
            const rankBlock = stitchRowCanvasesVertically(
              grid.dataRows.map(([ry1, ry2]) => renderRowCellsToCanvas(pixels, w, ry1, ry2, [rankCol]))
            );
            await worker.setParameters({
              tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
              tessedit_char_whitelist: '0123456789\n',
            });
            const rRet = await worker.recognize(rankBlock);
            rLines = (rRet.data?.text || '')
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean);

            if (rLines.length !== rowCount) {
              await worker.setParameters({
                tessedit_pageseg_mode: PSM.SINGLE_WORD,
                tessedit_char_whitelist: '0123456789',
              });
              rLines = [];
              for (const [ry1, ry2] of grid.dataRows) {
                const cellCanvas = renderRowCellsToCanvas(pixels, w, ry1, ry2, [rankCol]);
                const ret = await worker.recognize(cellCanvas);
                rLines.push((ret.data?.text || '').trim());
              }
            }
          }

          const nameBlock = stitchRowCanvasesVertically(
            grid.dataRows.map(([ry1, ry2]) => renderRowCellsToCanvas(pixels, w, ry1, ry2, [nameCol], true))
          );
          await worker.setParameters({
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
            tessedit_char_whitelist: '',
          });
          const nRet = await worker.recognize(nameBlock);
          let nLines = (nRet.data?.text || '')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);

          if (nLines.length !== rowCount) {
            await worker.setParameters({
              tessedit_pageseg_mode: PSM.SINGLE_LINE,
              tessedit_char_whitelist: '',
            });
            nLines = [];
            for (const [ry1, ry2] of grid.dataRows) {
              const cellCanvas = renderRowCellsToCanvas(pixels, w, ry1, ry2, [nameCol], true);
              const ret = await worker.recognize(cellCanvas);
              nLines.push((ret.data?.text || '').replace(/\n/g, ' ').trim());
            }
          }

          const statsBlock = stitchRowCanvasesVertically(
            grid.dataRows.map(([ry1, ry2]) => renderRowCellsToCanvas(pixels, w, ry1, ry2, statsCols))
          );
          await worker.setParameters({
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
            tessedit_char_whitelist: '0123456789- \n',
          });
          const sRet = await worker.recognize(statsBlock);
          let sLines = (sRet.data?.text || '')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);

          if (sLines.length !== rowCount) {
            await worker.setParameters({
              tessedit_pageseg_mode: PSM.SINGLE_LINE,
              tessedit_char_whitelist: '0123456789- ',
            });
            sLines = [];
            for (const [ry1, ry2] of grid.dataRows) {
              const cellCanvas = renderRowCellsToCanvas(pixels, w, ry1, ry2, statsCols);
              const ret = await worker.recognize(cellCanvas);
              sLines.push((ret.data?.text || '').replace(/\n/g, ' ').trim());
            }
          }

          const extractedTeams: ExtractedTeamRaw[] = [];
          for (let rIdx = 0; rIdx < rowCount; rIdx++) {
            const teamRow = buildExtractedTeamFromGridRow(
              rLines[rIdx] || '',
              nLines[rIdx] || '',
              sLines[rIdx] || '',
              statsCols.length,
              rIdx + 1
            );
            if (teamRow) {
              extractedTeams.push(teamRow);
            }
          }

          if (extractedTeams.length > 0) {
            imageResult = {
              leagueName: detectedLeagueName,
              teams: extractedTeams,
            };
          }
        } else if (grid && grid.dataRows.length >= 2) {
          // Horizontal lines only (no vertical dividers) -> pad each row cleanly
          onProgress?.(`Extrayendo filas horizontales de la foto ${i + 1}...`);
          const fullRowCanvases = grid.dataRows.map(([ry1, ry2]) =>
            renderRowCellsToCanvas(pixels, w, ry1, ry2, [[2, w - 2]], false)
          );
          const stacked = stitchRowCanvasesVertically(fullRowCanvases);
          await worker.setParameters({
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
            tessedit_char_whitelist: '',
          });
          const ret = await worker.recognize(stacked);
          imageResult = parseStandingsFromOcrText(ret.data?.text || '');
        }
      }

      // Fallback for borderless tables or if grid OCR yielded < 2 rows
      if (imageResult.teams.length < 2) {
        onProgress?.(`Analizando texto completo de la foto ${i + 1} de ${images.length}...`);
        const cleanImgData = await preprocessImageForOcr(img.base64);

        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          tessedit_char_whitelist: '',
        });
        const blockRet = await worker.recognize(cleanImgData);
        const blockParsed = parseStandingsFromOcrText(blockRet.data?.text || '');

        let bestParsed = blockParsed;
        if (bestParsed.teams.length < 2) {
          await worker.setParameters({
            tessedit_pageseg_mode: PSM.AUTO,
            tessedit_char_whitelist: '',
          });
          const autoRet = await worker.recognize(cleanImgData);
          const autoParsed = parseStandingsFromOcrText(autoRet.data?.text || '');
          if (autoParsed.teams.length > bestParsed.teams.length) {
            bestParsed = autoParsed;
          }
        }

        if (bestParsed.teams.length > imageResult.teams.length) {
          imageResult = bestParsed;
        }
      }

      if (imageResult.teams.length > 0) {
        results.push(imageResult);
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

  // Fallback to browser OCR if backend AI key wasn't configured, endpoint unavailable, or only 1 row returned
  if (!data || !data.teams || data.teams.length <= 1) {
    onProgress?.('Analizando filas y columnas con escáner OCR en dispositivo...');
    const localParsed = await runClientSideOcr(imageList, onProgress);
    const prevCount = data?.teams?.length || 0;
    if (localParsed.teams && localParsed.teams.length > prevCount) {
      data = {
        leagueName: localParsed.leagueName || data?.leagueName,
        teams: localParsed.teams,
        engine: 'OCR Local',
      };
      usedEngine = 'OCR Local';
    } else if (prevCount === 0 && serverErrorMessage) {
      throw new Error(`Error de Gemini Vision: ${serverErrorMessage}`);
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
