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
 * Robust OCR text parser for football / soccer league standings tables
 * Handles multiple layouts, Spanish and English headers, varied column counts
 */
export function parseStandingsFromOcrText(rawText: string): ParsedTableResult {
  if (!rawText || typeof rawText !== 'string') {
    return { teams: [] };
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let detectedLeagueName: string | undefined = undefined;
  const candidateTeams: ExtractedTeamRaw[] = [];

  // Common header words to ignore as team rows
  const headerKeywords = [
    'equipo',
    'pos',
    'posicion',
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
    'clasificacion',
    'tabla general',
    'posiciones',
    'w',
    'd',
    'l',
    'gf',
    'ga',
    'gd',
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Try to detect league/tournament name from top lines
    if (i < 6 && !detectedLeagueName) {
      if (
        (lower.includes('liga') ||
          lower.includes('torneo') ||
          lower.includes('campeonato') ||
          lower.includes('fútbol') ||
          lower.includes('futbol') ||
          lower.includes('champions') ||
          lower.includes('premier') ||
          lower.includes('copa')) &&
        !lower.includes('pts') &&
        !lower.includes('pj') &&
        line.length > 5
      ) {
        detectedLeagueName = line
          .replace(/tabla (de )?posiciones/gi, '')
          .replace(/tabla general/gi, '')
          .replace(/clasificaci[oó]n/gi, '')
          .replace(/[-|:]/g, ' ')
          .trim();
      }
    }

    // Skip pure header rows
    const isHeaderLine =
      (lower.includes('pos') || lower.includes('equipo') || lower.includes('club')) &&
      (lower.includes('pts') || lower.includes('pj') || lower.includes('jj') || lower.includes('g'));

    if (isHeaderLine) continue;

    // Check if line contains numbers
    const tokens = line.split(/[\s|\t,;]+/);
    const numericIndices: number[] = [];
    const numbers: number[] = [];

    tokens.forEach((tok, idx) => {
      // Check for integer or signed integer (like +15, -4)
      const cleanTok = tok.replace(/^[(\[]|[)\]]$/g, '');
      if (/^[+-]?\d{1,4}$/.test(cleanTok)) {
        numericIndices.push(idx);
        numbers.push(parseInt(cleanTok, 10));
      }
    });

    // A valid table row typically has at least 3 numbers (e.g. PJ, G, PTS or PJ, GF, PTS)
    if (numbers.length >= 3) {
      // Check if the very first token is a rank number (e.g., "1", "1.", "#1", "01")
      let parsedRank: number | null = null;
      let startTextIdx = 0;

      const firstTokClean = tokens[0].replace(/[.#:]/g, '');
      if (/^\d{1,2}$/.test(firstTokClean) && numericIndices.includes(0)) {
        parsedRank = parseInt(firstTokClean, 10);
        startTextIdx = 1;
        // Remove rank from numbers array so numbers represents stats
        numbers.shift();
        numericIndices.shift();
      }

      // Collect team name tokens (non-numeric tokens before the main stats cluster)
      const nameTokens: string[] = [];
      const statsNumbers: number[] = [];

      tokens.slice(startTextIdx).forEach((tok) => {
        const cleanTok = tok.replace(/^[(\[]|[)\]]$/g, '');
        if (/^[+-]?\d{1,4}$/.test(cleanTok)) {
          statsNumbers.push(parseInt(cleanTok, 10));
        } else {
          // If stats already started and we see a short noise token, skip or append
          if (statsNumbers.length === 0) {
            nameTokens.push(tok);
          }
        }
      });

      let teamName = nameTokens.join(' ').replace(/[|_\-=~*]+/g, ' ').trim();
      teamName = teamName.replace(/^\d+[\s.-]+/, '').trim(); // Remove leading rank if stuck in name

      // If team name is too short or empty, provide a generic fallback
      if (teamName.length < 2) {
        teamName = `Equipo ${parsedRank || candidateTeams.length + 1}`;
      }

      // Skip rows that look like summary headers or noise
      const lowerName = teamName.toLowerCase();
      if (headerKeywords.some((hw) => lowerName === hw || lowerName === `${hw}s`)) {
        continue;
      }

      // Map stats numbers based on available count
      let pj = 0;
      let g = 0;
      let e = 0;
      let p = 0;
      let gf = 0;
      let gc = 0;
      let dg = 0;
      let pts = 0;

      if (statsNumbers.length >= 8) {
        // [PJ, G, E, P, GF, GC, DG, PTS]
        [pj, g, e, p, gf, gc, dg, pts] = statsNumbers.slice(0, 8);
      } else if (statsNumbers.length === 7) {
        // [PJ, G, E, P, GF, GC, PTS]
        [pj, g, e, p, gf, gc, pts] = statsNumbers.slice(0, 7);
        dg = gf - gc;
      } else if (statsNumbers.length === 6) {
        // [PJ, G, E, P, DG, PTS]
        [pj, g, e, p, dg, pts] = statsNumbers.slice(0, 6);
        gf = dg > 0 ? dg : 0;
        gc = dg < 0 ? Math.abs(dg) : 0;
      } else if (statsNumbers.length === 5) {
        // [PJ, G, E, P, PTS]
        [pj, g, e, p, pts] = statsNumbers.slice(0, 5);
      } else if (statsNumbers.length === 4) {
        // [PJ, G, P, PTS]
        [pj, g, p, pts] = statsNumbers.slice(0, 4);
        e = Math.max(0, pj - (g + p));
      } else if (statsNumbers.length === 3) {
        // [PJ, DG, PTS]
        [pj, dg, pts] = statsNumbers.slice(0, 3);
        g = Math.floor(pts / 3);
        e = pts % 3;
        p = Math.max(0, pj - (g + e));
      }

      // Re-verify calculations
      if (dg === 0 && (gf !== 0 || gc !== 0)) {
        dg = gf - gc;
      }
      if (pts === 0 && (g > 0 || e > 0)) {
        pts = g * 3 + e;
      }

      candidateTeams.push({
        rank: parsedRank || candidateTeams.length + 1,
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

  // Ensure consecutive ranks
  const sorted = [...candidateTeams].sort((a, b) => {
    if (a.rank && b.rank && a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    return b.pts - a.pts || b.dg - a.dg || b.gf - a.gf;
  });

  const normalizedTeams = sorted.map((t, i) => ({
    ...t,
    rank: i + 1,
  }));

  return {
    leagueName: detectedLeagueName,
    teams: normalizedTeams,
  };
}

/**
 * Merge multiple parsed table results from multi-photo scans
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
        // Keep the record with higher games played or higher points
        const existing = teamMap.get(key)!;
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
