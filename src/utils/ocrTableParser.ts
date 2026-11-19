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
  { rank: 2, name: 'BAYERN MUNICH', pj: 28, g: 20, e: 7, p: 1, gf: 131, gc: 41, dg: 90, pts: 67 },
  { rank: 3, name: 'TOTTENHAM', pj: 28, g: 21, e: 3, p: 4, gf: 129, gc: 46, dg: 83, pts: 66 },
  { rank: 4, name: 'MILAN', pj: 28, g: 21, e: 1, p: 6, gf: 149, gc: 58, dg: 91, pts: 64 },
  { rank: 5, name: 'INT. DE MILAN', pj: 28, g: 20, e: 3, p: 5, gf: 138, gc: 58, dg: 80, pts: 63 },
  { rank: 6, name: 'MANCHESTER CITY', pj: 28, g: 20, e: 3, p: 5, gf: 100, gc: 44, dg: 56, pts: 63 },
  { rank: 7, name: 'PORTO', pj: 27, g: 20, e: 2, p: 5, gf: 111, gc: 44, dg: 67, pts: 62 },
  { rank: 8, name: 'SEVILLA', pj: 28, g: 19, e: 5, p: 4, gf: 102, gc: 40, dg: 62, pts: 62 },
  { rank: 9, name: 'FULLHAM', pj: 28, g: 20, e: 2, p: 6, gf: 96, gc: 44, dg: 52, pts: 62 },
  { rank: 10, name: 'ARSENAL', pj: 28, g: 19, e: 3, p: 6, gf: 83, gc: 41, dg: 42, pts: 60 },
  { rank: 11, name: 'FEYENOORD', pj: 24, g: 18, e: 2, p: 4, gf: 83, gc: 21, dg: 62, pts: 56 },
  { rank: 12, name: 'PSG', pj: 20, g: 17, e: 1, p: 2, gf: 105, gc: 29, dg: 76, pts: 52 },
  { rank: 13, name: 'AJAX', pj: 28, g: 16, e: 4, p: 8, gf: 81, gc: 57, dg: 24, pts: 52 },
  { rank: 14, name: 'BORUSSIA', pj: 28, g: 15, e: 3, p: 10, gf: 91, gc: 60, dg: 31, pts: 48 },
  { rank: 15, name: 'BENFICA', pj: 28, g: 15, e: 2, p: 11, gf: 78, gc: 55, dg: 23, pts: 47 },
  { rank: 16, name: 'PALERMO', pj: 28, g: 14, e: 4, p: 10, gf: 89, gc: 58, dg: 31, pts: 46 },
  { rank: 17, name: 'MANCHESTER UNITED', pj: 28, g: 15, e: 1, p: 12, gf: 70, gc: 60, dg: 10, pts: 46 },
  { rank: 18, name: 'LIVERPOOL', pj: 27, g: 14, e: 3, p: 10, gf: 70, gc: 44, dg: 26, pts: 45 },
  { rank: 19, name: 'NEW CASTLE', pj: 26, g: 13, e: 1, p: 12, gf: 67, gc: 66, dg: 1, pts: 40 },
  { rank: 20, name: 'MARSELLA', pj: 25, g: 13, e: 0, p: 12, gf: 74, gc: 59, dg: 15, pts: 39 },
  { rank: 21, name: 'FIORENTINA', pj: 26, g: 12, e: 2, p: 12, gf: 82, gc: 56, dg: 26, pts: 38 },
  { rank: 22, name: 'SPORTING', pj: 21, g: 12, e: 2, p: 7, gf: 65, gc: 43, dg: 22, pts: 38 },
  { rank: 23, name: 'AS MONACO', pj: 24, g: 8, e: 4, p: 12, gf: 51, gc: 58, dg: -7, pts: 28 },
  { rank: 24, name: 'LYON', pj: 27, g: 7, e: 7, p: 13, gf: 68, gc: 85, dg: -17, pts: 28 },
  { rank: 25, name: 'NAPOLI', pj: 19, g: 7, e: 2, p: 10, gf: 41, gc: 52, dg: -11, pts: 23 },
  { rank: 26, name: 'ATLETICO DE MADRID', pj: 28, g: 6, e: 3, p: 19, gf: 56, gc: 103, dg: -47, pts: 21 },
  { rank: 27, name: 'CHELSEA', pj: 21, g: 6, e: 2, p: 13, gf: 48, gc: 64, dg: -16, pts: 20 },
  { rank: 28, name: 'BARCELONA', pj: 15, g: 3, e: 1, p: 11, gf: 26, gc: 82, dg: -56, pts: 10 },
  { rank: 29, name: 'ATL CLUB', pj: 5, g: 3, e: 0, p: 2, gf: 17, gc: 9, dg: 8, pts: 9 },
  { rank: 30, name: 'JUVENTUS', pj: 11, g: 2, e: 2, p: 7, gf: 18, gc: 35, dg: -17, pts: 8 },
  { rank: 31, name: 'RAFA', pj: 12, g: 2, e: 2, p: 8, gf: 15, gc: 46, dg: -31, pts: 8 },
];

// Backward compatibility alias
export const FAMOUS_TEAMS_DATA = LEAGUE_31_TEAMS_DATA;

/**
 * Robust OCR and text parser for soccer standings tables.
 * Parses from the right side for trailing numeric stats so crest OCR artifacts
 * between rank and team name never discard the team name.
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
    'ptos',
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
      !lower.includes('ptos') &&
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

  const isPureHeaderLine = (line: string): boolean => {
    const lower = line.toLowerCase();
    return (
      (lower.includes('pos') || lower.includes('equipo') || lower.includes('club')) &&
      (lower.includes('pts') ||
        lower.includes('ptos') ||
        lower.includes('pj') ||
        lower.includes('jj') ||
        lower.includes('dif') ||
        lower.includes('jg'))
    );
  };

  const parseIntToken = (tok: string): number | null => {
    const cleaned = tok.replace(/^[(\[|]+|[)\].,|]+$/g, '');
    if (/^[+-]?\d{1,4}$/.test(cleaned)) {
      return parseInt(cleaned, 10);
    }
    return null;
  };

  // PASS 1: Single line containing Rank + Team Name + trailing numeric stats
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isPureHeaderLine(line)) continue;

    // Filter out empty tokens caused by leading/trailing table borders (|)
    const tokens = line.split(/[\s|\t,;]+/).filter(Boolean);
    if (tokens.length < 4) continue;

    // Collect trailing contiguous stats numbers from the right (up to 8 columns: PJ G E P GF GC DG PTS)
    const trailingNumbers: number[] = [];
    let statsStartIdx = tokens.length;

    for (let tIdx = tokens.length - 1; tIdx >= 1 && trailingNumbers.length < 8; tIdx--) {
      const rawTok = tokens[tIdx];
      // Treat standalone 'O' or 'o' inside the trailing numeric columns as 0
      const normalizedTok =
        rawTok === 'O' || rawTok === 'o' ? '0' : rawTok === '—' || rawTok === '--' ? '0' : rawTok;
      const numVal = parseIntToken(normalizedTok);
      if (numVal !== null) {
        trailingNumbers.unshift(numVal);
        statsStartIdx = tIdx;
      } else {
        break;
      }
    }

    if (trailingNumbers.length >= 3) {
      let parsedRank: number | null = null;
      let leftStartIdx = 0;

      if (statsStartIdx > 0) {
        const firstClean = tokens[0].replace(/[.#:\-)|(\[\]]/g, '');
        if (/^\d{1,2}$/.test(firstClean)) {
          const candidate = parseInt(firstClean, 10);
          if (candidate >= 1 && candidate <= 99) {
            parsedRank = candidate;
            leftStartIdx = 1;
          }
        }
      }

      // Extract name tokens between rank and trailing stats
      let nameRegion = tokens.slice(leftStartIdx, statsStartIdx);

      // Strip leading OCR crest artifacts (punctuation, single symbols, or short numbers before alphabetic words)
      const hasAlphabeticWord = nameRegion.some((w) => /[a-zA-ZáéíóúñÁÉÍÓÚÑ]{2,}/.test(w));
      if (hasAlphabeticWord) {
        while (
          nameRegion.length > 1 &&
          !/[a-zA-ZáéíóúñÁÉÍÓÚÑ]{2,}/.test(nameRegion[0])
        ) {
          nameRegion = nameRegion.slice(1);
        }
      }

      let teamName = nameRegion
        .join(' ')
        .replace(/[|_\-=~*©®•]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!teamName || teamName === '0' || teamName.length < 2) {
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

      if (trailingNumbers.length >= 8) {
        [pj, g, e, p, gf, gc, dg, pts] = trailingNumbers.slice(-8);
      } else if (trailingNumbers.length === 7) {
        [pj, g, e, p, gf, gc, pts] = trailingNumbers;
        dg = gf - gc;
      } else if (trailingNumbers.length === 6) {
        [pj, g, e, p, dg, pts] = trailingNumbers;
        gf = dg > 0 ? dg : 0;
        gc = dg < 0 ? Math.abs(dg) : 0;
      } else if (trailingNumbers.length === 5) {
        [pj, g, e, p, pts] = trailingNumbers;
        dg = 0;
      } else if (trailingNumbers.length === 4) {
        [pj, g, p, pts] = trailingNumbers;
        e = Math.max(0, pj - (g + p));
        dg = 0;
      } else if (trailingNumbers.length === 3) {
        [pj, dg, pts] = trailingNumbers;
        g = Math.floor(pts / 3);
        e = pts % 3;
        p = Math.max(0, pj - (g + e));
      }

      if (trailingNumbers.length < 8 && dg === 0 && (gf !== 0 || gc !== 0)) {
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
            rank: currentNumbers[0] || extractedTeams.length + 1,
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

  if (extractedTeams.length > 0) {
    const sorted = [...extractedTeams].sort(
      (a, b) => a.rank - b.rank || b.pts - a.pts || b.dg - a.dg || b.gf - a.gf
    );
    return {
      leagueName: detectedLeagueName,
      teams: sorted,
    };
  }

  return {
    leagueName: detectedLeagueName,
    teams: [],
  };
}

/**
 * Merge multiple parsed table results from multi-photo scans (e.g. Photo 1: 1-15, Photo 2: 16-31).
 * Preserves generic rows like "Equipo 24" / "0" by rank and maintains sequential ranking.
 */
export function mergeExtractedTables(results: ParsedTableResult[]): ParsedTableResult {
  if (!results || results.length === 0) {
    return { teams: [] };
  }

  const leagueName = results.find((r) => r.leagueName && r.leagueName.length > 2)?.leagueName;
  const teamMap = new Map<string, ExtractedTeamRaw>();

  for (const res of results) {
    for (const team of res.teams) {
      const normName = team.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isGeneric = !normName || normName === '0' || /^equipo\d+$/.test(normName);
      const key = isGeneric ? `rank_${team.rank}` : normName;

      if (!teamMap.has(key)) {
        teamMap.set(key, team);
      } else {
        const existing = teamMap.get(key)!;
        if (team.pj > existing.pj || team.pts > existing.pts) {
          teamMap.set(key, team);
        }
      }
    }
  }

  const combined = Array.from(teamMap.values()).sort((a, b) => {
    if (a.rank && b.rank && a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    return b.pts - a.pts || b.dg - a.dg || b.gf - a.gf;
  });

  const reRanked = combined.map((t, idx) => ({
    ...t,
    rank: t.rank > 0 ? t.rank : idx + 1,
  }));

  return {
    leagueName,
    teams: reRanked,
  };
}
