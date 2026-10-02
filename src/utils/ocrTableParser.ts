export interface ExtractedTeamRaw {
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
}

export interface ParsedTableResult {
  leagueName?: string;
  teams: ExtractedTeamRaw[];
}

/**
 * Modern, high-resolution vector SVG of an elegant grey soccer crest shield.
 * Used for common, amateur or unmatched team names.
 */
export const DEFAULT_GREY_SHIELD_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="gShield" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2364748b"/><stop offset="50%" stop-color="%23475569"/><stop offset="100%" stop-color="%23334155"/></linearGradient><linearGradient id="gInner" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23334155"/><stop offset="100%" stop-color="%231e293b"/></linearGradient></defs><path d="M50 6 L86 20 C86 64 50 94 50 94 C50 94 14 64 14 20 Z" fill="url(%23gShield)" stroke="%2394a3b8" stroke-width="2.5"/><path d="M50 12 L80 24 C80 60 50 86 50 86 C50 86 20 60 20 24 Z" fill="url(%23gInner)" stroke="%23475569" stroke-width="1.5"/><circle cx="50" cy="46" r="14" fill="%23475569" stroke="%23cbd5e1" stroke-width="1.5"/><path d="M50 36 L52.5 43.5 L60 43.5 L54 48 L56.5 55.5 L50 51 L43.5 55.5 L46 48 L40 43.5 L47.5 43.5 Z" fill="%23cbd5e1"/></svg>`;

/**
 * Official 31 Teams League Dataset:
 * Ranks 1 to 31 with consistent math (PJ, G, E, P, GF, GC, DG, PTS).
 * Bayern Munich is our team.
 */
export const LEAGUE_31_TEAMS_DATA: ExtractedTeamRaw[] = [
  { rank: 1, name: 'REAL MADRID', pj: 28, g: 24, e: 3, p: 1, gf: 104, gc: 35, dg: 69, pts: 75 },
  { rank: 2, name: 'BAYERN MUNICH', pj: 28, g: 21, e: 4, p: 3, gf: 131, gc: 41, dg: 90, pts: 67 },
  { rank: 3, name: 'MANCHESTER CITY', pj: 28, g: 21, e: 3, p: 4, gf: 110, gc: 42, dg: 68, pts: 66 },
  { rank: 4, name: 'ARSENAL', pj: 28, g: 21, e: 1, p: 6, gf: 102, gc: 40, dg: 62, pts: 64 },
  { rank: 5, name: 'LIVERPOOL', pj: 28, g: 20, e: 3, p: 5, gf: 100, gc: 44, dg: 56, pts: 63 },
  { rank: 6, name: 'PARIS SAINT-GERMAIN', pj: 28, g: 20, e: 3, p: 5, gf: 105, gc: 49, dg: 56, pts: 63 },
  { rank: 7, name: 'INT. DE MILAN', pj: 28, g: 20, e: 2, p: 6, gf: 98, gc: 44, dg: 54, pts: 62 },
  { rank: 8, name: 'BARCELONA', pj: 28, g: 19, e: 5, p: 4, gf: 102, gc: 48, dg: 54, pts: 62 },
  { rank: 9, name: 'BORUSSIA DORTMUND', pj: 28, g: 19, e: 4, p: 5, gf: 96, gc: 46, dg: 50, pts: 61 },
  { rank: 10, name: 'BAYER LEVERKUSEN', pj: 28, g: 19, e: 3, p: 6, gf: 91, gc: 42, dg: 49, pts: 60 },
  { rank: 11, name: 'ATLETICO MADRID', pj: 28, g: 18, e: 4, p: 6, gf: 88, gc: 43, dg: 45, pts: 58 },
  { rank: 12, name: 'JUVENTUS', pj: 28, g: 18, e: 3, p: 7, gf: 85, gc: 42, dg: 43, pts: 57 },
  { rank: 13, name: 'MILAN', pj: 28, g: 17, e: 4, p: 7, gf: 89, gc: 52, dg: 37, pts: 55 },
  { rank: 14, name: 'TOTTENHAM', pj: 28, g: 17, e: 3, p: 8, gf: 84, gc: 51, dg: 33, pts: 54 },
  { rank: 15, name: 'CHELSEA', pj: 28, g: 16, e: 4, p: 8, gf: 81, gc: 50, dg: 31, pts: 52 },
  { rank: 16, name: 'ASTON VILLA', pj: 28, g: 16, e: 3, p: 9, gf: 77, gc: 52, dg: 25, pts: 51 },
  { rank: 17, name: 'NAPOLI', pj: 28, g: 15, e: 5, p: 8, gf: 74, gc: 53, dg: 21, pts: 50 },
  { rank: 18, name: 'ROMA', pj: 28, g: 15, e: 3, p: 10, gf: 75, gc: 58, dg: 17, pts: 48 },
  { rank: 19, name: 'PORTO', pj: 28, g: 14, e: 5, p: 9, gf: 70, gc: 54, dg: 16, pts: 47 },
  { rank: 20, name: 'BENFICA', pj: 28, g: 14, e: 4, p: 10, gf: 68, gc: 55, dg: 13, pts: 46 },
  { rank: 21, name: 'SPORTING CP', pj: 28, g: 13, e: 6, p: 9, gf: 67, gc: 56, dg: 11, pts: 45 },
  { rank: 22, name: 'AJAX', pj: 28, g: 13, e: 4, p: 11, gf: 65, gc: 58, dg: 7, pts: 43 },
  { rank: 23, name: 'SEVILLA', pj: 28, g: 12, e: 6, p: 10, gf: 62, gc: 57, dg: 5, pts: 42 },
  { rank: 24, name: 'NEWCASTLE', pj: 28, g: 12, e: 5, p: 11, gf: 63, gc: 61, dg: 2, pts: 41 },
  { rank: 25, name: 'REAL SOCIEDAD', pj: 28, g: 11, e: 6, p: 11, gf: 59, gc: 60, dg: -1, pts: 39 },
  { rank: 26, name: 'ATHLETIC CLUB', pj: 28, g: 10, e: 7, p: 11, gf: 55, gc: 58, dg: -3, pts: 37 },
  { rank: 27, name: 'FULHAM', pj: 28, g: 10, e: 5, p: 13, gf: 52, gc: 62, dg: -10, pts: 35 },
  { rank: 28, name: 'VILLARREAL', pj: 28, g: 9, e: 6, p: 13, gf: 50, gc: 64, dg: -14, pts: 33 },
  { rank: 29, name: 'FEYENOORD', pj: 28, g: 8, e: 6, p: 14, gf: 48, gc: 66, dg: -18, pts: 30 },
  { rank: 30, name: 'PSV EINDHOVEN', pj: 28, g: 7, e: 5, p: 16, gf: 44, gc: 72, dg: -28, pts: 26 },
  { rank: 31, name: 'HALCONES FC', pj: 28, g: 4, e: 4, p: 20, gf: 35, gc: 85, dg: -50, pts: 16 },
];

// Backward compatibility alias
export const FAMOUS_TEAMS_DATA = LEAGUE_31_TEAMS_DATA;

/**
 * Robust OCR and text parser for soccer standings tables.
 * Can parse from 1 to 50+ teams accurately across single or multi-photo text.
 */
export function parseStandingsFromOcrText(rawText: string): ParsedTableResult {
  if (!rawText || typeof rawText !== 'string') {
    return { teams: [] };
  }

  const cleanRaw = rawText.replace(/\r/g, '');
  const lines = cleanRaw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let detectedLeagueName: string | undefined = undefined;

  // Header keywords to ignore as teams
  const headerKeywords = [
    'equipo',
    'pos',
    'posicion',
    'posiciones',
    'club',
    'pj',
    'jj',
    'jg',
    'je',
    'jp',
    'pts',
    'puntos',
    'dif',
    'dg',
    'goles',
    'gf',
    'gc',
    'clasificacion',
    'tabla general',
    'tabla de posiciones',
  ];

  // League title detection
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const lower = lines[i].toLowerCase();
    if (
      (lower.includes('liga') ||
        lower.includes('torneo') ||
        lower.includes('campeonato') ||
        lower.includes('champions') ||
        lower.includes('premier') ||
        lower.includes('copa') ||
        lower.includes('clasificacion') ||
        lower.includes('posiciones')) &&
      !lower.includes('pj') &&
      !lower.includes('pts') &&
      lines[i].length > 4
    ) {
      detectedLeagueName = lines[i]
        .replace(/tabla (de )?posiciones/gi, '')
        .replace(/tabla general/gi, '')
        .replace(/clasificaci[oó]n/gi, '')
        .replace(/[-|:]/g, ' ')
        .trim();
      break;
    }
  }

  const extractedTeams: ExtractedTeamRaw[] = [];

  // Helper to test if line is purely table headers
  const isPureHeaderLine = (line: string): boolean => {
    const lower = line.toLowerCase();
    return (
      (lower.includes('pos') || lower.includes('equipo') || lower.includes('club')) &&
      (lower.includes('pts') || lower.includes('pj') || lower.includes('jj') || lower.includes('dif') || lower.includes('g'))
    );
  };

  // PASS 1: Single line containing Name and all numeric stats
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isPureHeaderLine(line)) continue;

    // Tokens split by spaces or pipes/tabs
    const tokens = line.split(/[\s|\t,;]+/);
    const numericIndices: number[] = [];
    const numbers: number[] = [];

    tokens.forEach((tok, idx) => {
      const cleanTok = tok.replace(/^[(\[]|[)\]]$/g, '');
      if (/^[+-]?\d{1,4}$/.test(cleanTok)) {
        numericIndices.push(idx);
        numbers.push(parseInt(cleanTok, 10));
      }
    });

    if (numbers.length >= 3) {
      let parsedRank: number | null = null;
      let startTextIdx = 0;

      const firstTokClean = tokens[0].replace(/[.#:\-)]/g, '');
      if (/^\d{1,2}$/.test(firstTokClean) && numericIndices.includes(0)) {
        parsedRank = parseInt(firstTokClean, 10);
        startTextIdx = 1;
        numbers.shift();
        numericIndices.shift();
      }

      // Collect name tokens and numeric stats
      const nameTokens: string[] = [];
      const statsNumbers: number[] = [];

      tokens.slice(startTextIdx).forEach((tok) => {
        const cleanTok = tok.replace(/^[(\[]|[)\]]$/g, '');
        if (/^[+-]?\d{1,4}$/.test(cleanTok)) {
          statsNumbers.push(parseInt(cleanTok, 10));
        } else {
          if (statsNumbers.length === 0) {
            nameTokens.push(tok);
          }
        }
      });

      let teamName = nameTokens.join(' ').replace(/[|_\-=~*]+/g, ' ').trim();
      teamName = teamName.replace(/^\d+[\s.-]+/, '').trim();

      if (teamName.length < 2) {
        teamName = `Equipo ${parsedRank || extractedTeams.length + 1}`;
      }

      const lowerName = teamName.toLowerCase();
      if (headerKeywords.some((hw) => lowerName === hw || lowerName === `${hw}s`)) {
        continue;
      }

      let pj = 0;
      let g = 0;
      let e = 0;
      let p = 0;
      let gf = 0;
      let gc = 0;
      let dg = 0;
      let pts = 0;

      if (statsNumbers.length >= 8) {
        [pj, g, e, p, gf, gc, dg, pts] = statsNumbers.slice(0, 8);
      } else if (statsNumbers.length === 7) {
        [pj, g, e, p, gf, gc, pts] = statsNumbers.slice(0, 7);
        dg = gf - gc;
      } else if (statsNumbers.length === 6) {
        [pj, g, e, p, dg, pts] = statsNumbers.slice(0, 6);
        gf = dg > 0 ? dg : 0;
        gc = dg < 0 ? Math.abs(dg) : 0;
      } else if (statsNumbers.length === 5) {
        [pj, g, e, p, pts] = statsNumbers.slice(0, 5);
        dg = 0;
      } else if (statsNumbers.length === 4) {
        [pj, g, p, pts] = statsNumbers.slice(0, 4);
        e = Math.max(0, pj - (g + p));
        dg = 0;
      } else if (statsNumbers.length === 3) {
        [pj, dg, pts] = statsNumbers.slice(0, 3);
        g = Math.floor(pts / 3);
        e = pts % 3;
        p = Math.max(0, pj - (g + e));
      }

      if (dg === 0 && (gf !== 0 || gc !== 0)) {
        dg = gf - gc;
      }
      if (pts === 0 && (g > 0 || e > 0)) {
        pts = g * 3 + e;
      }

      extractedTeams.push({
        rank: parsedRank || extractedTeams.length + 1,
        name: teamName,
        pj: Math.max(0, pj),
        g: Math.max(0, g),
        e: Math.max(0, e),
        p: Math.max(0, p),
        gf: Math.max(0, gf),
        gc: Math.max(0, gc),
        dg,
        pts: Math.max(0, pts),
      });
    }
  }

  // PASS 2: Alternating lines (Line i = Team Name, Line i+1 = Numbers)
  if (extractedTeams.length < 3) {
    for (let i = 0; i < lines.length - 1; i++) {
      const currentLine = lines[i];
      const nextLine = lines[i + 1];

      if (isPureHeaderLine(currentLine) || isPureHeaderLine(nextLine)) continue;

      const currentNumbers = (currentLine.match(/[+-]?\d+/g) || []).map(Number);
      const nextNumbers = (nextLine.match(/[+-]?\d+/g) || []).map(Number);

      if (currentNumbers.length <= 1 && nextNumbers.length >= 3) {
        let teamName = currentLine.replace(/^\d+[\s.-]+/, '').trim();
        if (teamName.length >= 2 && !headerKeywords.includes(teamName.toLowerCase())) {
          let [pj, g, e, p, gf, gc, dg, pts] = [0, 0, 0, 0, 0, 0, 0, 0];

          if (nextNumbers.length >= 8) {
            [pj, g, e, p, gf, gc, dg, pts] = nextNumbers.slice(0, 8);
          } else if (nextNumbers.length >= 6) {
            [pj, g, e, p, dg, pts] = nextNumbers.slice(0, 6);
          } else {
            [pj, g, pts] = [nextNumbers[0] || 0, nextNumbers[1] || 0, nextNumbers[nextNumbers.length - 1] || 0];
          }

          extractedTeams.push({
            rank: extractedTeams.length + 1,
            name: teamName,
            pj: Math.max(0, pj),
            g: Math.max(0, g),
            e: Math.max(0, e),
            p: Math.max(0, p),
            gf: Math.max(0, gf),
            gc: Math.max(0, gc),
            dg: dg || gf - gc,
            pts: pts || g * 3 + e,
          });
          i++; // Skip the numbers line
        }
      }
    }
  }

  // Re-sort extracted teams by rank, points, or goal difference
  if (extractedTeams.length > 0) {
    const sorted = [...extractedTeams].sort(
      (a, b) => a.rank - b.rank || b.pts - a.pts || b.dg - a.dg || b.gf - a.gf
    );
    return {
      leagueName: detectedLeagueName,
      teams: sorted.map((t, idx) => ({ ...t, rank: idx + 1 })),
    };
  }

  return {
    leagueName: detectedLeagueName,
    teams: [],
  };
}

/**
 * Merge multiple parsed table results from multi-photo scans (e.g. Photo 1: 1-16, Photo 2: 17-31).
 * Deduplicates by cleaned team name and maintains overall sequential ranking 1..N.
 */
export function mergeExtractedTables(results: ParsedTableResult[]): ParsedTableResult {
  if (!results || results.length === 0) {
    return { teams: [] };
  }

  const leagueName = results.find((r) => r.leagueName && r.leagueName.length > 2)?.leagueName;
  const teamMap = new Map<string, ExtractedTeamRaw>();

  for (const res of results) {
    for (const team of res.teams) {
      const key = team.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!teamMap.has(key)) {
        teamMap.set(key, team);
      } else {
        const existing = teamMap.get(key)!;
        // Keep row with higher matches played or more complete stats
        if (team.pj > existing.pj || team.pts > existing.pts) {
          teamMap.set(key, team);
        }
      }
    }
  }

  const combined = Array.from(teamMap.values());
  combined.sort((a, b) => {
    if (a.rank && b.rank && a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    return b.pts - a.pts || b.dg - a.dg || b.gf - a.gf;
  });

  const reRanked = combined.map((t, idx) => ({
    ...t,
    rank: idx + 1,
  }));

  return {
    leagueName,
    teams: reRanked,
  };
}
