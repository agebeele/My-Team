import { StandingsRow } from '../types';

export interface ScanTableResponse {
  leagueName?: string;
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

// Sample realistic soccer team crests for extracted rival teams
export const RIVAL_CRESTS = [
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=150&q=80',
];

export async function scanLeagueTableWithGemini(
  imageBase64: string,
  mimeType: string,
  ourTeamName: string,
  ourTeamShortName: string,
  ourTeamLogo: string
): Promise<{ leagueName?: string; rows: StandingsRow[] }> {
  let data: ScanTableResponse | null = null;
  let lastError: Error | null = null;

  // Try server endpoint /api/ai/scan-table first, then /api/scan-table
  const endpoints = ['/api/ai/scan-table', '/api/scan-table'];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          teamName: `${ourTeamName} ${ourTeamShortName}`,
        }),
      });

      if (res.ok) {
        data = await res.json();
        break;
      } else {
        const errJson = await res.json().catch(() => ({}));
        lastError = new Error(errJson.error || `HTTP ${res.status}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!data || !data.teams || !Array.isArray(data.teams)) {
    throw new Error(
      lastError?.message ||
        'No se pudo extraer la tabla de la imagen. Verifica que la imagen sea nítida y muestre los nombres de los equipos y columnas (PJ, G, E, P, PTS).'
    );
  }

  const cleanOurName = ourTeamName.toLowerCase();
  const cleanOurShort = ourTeamShortName.toLowerCase();

  const rows: StandingsRow[] = data.teams.map((item, index) => {
    const itemName = item.name || `Equipo ${item.rank || index + 1}`;
    const cleanItemName = itemName.toLowerCase();

    // Check if this row is our team
    const isOurTeam =
      cleanItemName.includes(cleanOurName) ||
      cleanItemName.includes(cleanOurShort) ||
      cleanOurName.includes(cleanItemName) ||
      cleanItemName.includes('rayos') ||
      cleanItemName.includes('bayern') ||
      cleanItemName.includes('dream');

    return {
      id: `standing_ai_${Date.now()}_${index}`,
      rank: item.rank || index + 1,
      name: itemName,
      logo: isOurTeam ? ourTeamLogo || '/fc_bayern_logo.png' : RIVAL_CRESTS[index % RIVAL_CRESTS.length],
      pj: Number(item.pj) || 0,
      g: Number(item.g) || 0,
      e: Number(item.e) || 0,
      p: Number(item.p) || 0,
      gf: Number(item.gf) || 0,
      gc: Number(item.gc) || 0,
      dg: Number(item.dg ?? (item.gf - item.gc)) || 0,
      pts: Number(item.pts) || 0,
      isOurTeam,
    };
  });

  // Ensure rows are sorted by rank
  rows.sort((a, b) => a.rank - b.rank || b.pts - a.pts || b.dg - a.dg);

  return {
    leagueName: data.leagueName,
    rows,
  };
}
