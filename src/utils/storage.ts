import { Player, TeamInfo, Match, StandingsRow, Post, AppUser, Language } from '../types';

export const STORAGE_KEYS = {
  TEAM: 'teamgol_team',
  ALL_TEAMS: 'teamgol_all_teams',
  PLAYERS: 'teamgol_players',
  PLAYERS_BY_TEAM: 'teamgol_players_by_team',
  MATCHES: 'teamgol_matches',
  MATCHES_BY_TEAM: 'teamgol_matches_by_team',
  STANDINGS: 'teamgol_standings',
  STANDINGS_BY_LEAGUE: 'teamgol_standings_by_league',
  POSTS: 'teamgol_posts',
  USERS: 'teamgol_users',
  CURRENT_USER: 'teamgol_current_user',
  LANGUAGE: 'teamgol_language',
  DEVICE_SESSION_SAVED: 'teamgol_device_session_saved',
} as const;

export const INITIAL_TEAM: TeamInfo | null = null;
export const INITIAL_TEAMS: TeamInfo[] = [];
export const INITIAL_PLAYERS: Player[] = [];
export const INITIAL_POSTS: Post[] = [];
export const INITIAL_MATCHES: Match[] = [];
export const INITIAL_USERS: AppUser[] = [];
export const INITIAL_STANDINGS: StandingsRow[] = [];

// Constantes de ligas
export const INITIAL_STANDINGS_LIGA_MEXICANA: StandingsRow[] = [];
export const INITIAL_STANDINGS_LIGA_ESP: StandingsRow[] = [];
export const INITIAL_STANDINGS_LIGA_FRA: StandingsRow[] = [];
export const INITIAL_STANDINGS_COPA_MUNDO: StandingsRow[] = [];

export const DEFAULT_LINEUP: any[] = [];

// --- HELPERS SEGUROS (CUOTA 5MB + LECTURA NULL) ---
export const safeGetItem = <T>(key: string, defaultValue: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === 'undefined' || raw === 'null') return defaultValue;
    const parsed = JSON.parse(raw);
    return parsed ?? defaultValue;
  } catch (err) {
    console.warn(`[Storage] Error parseando ${key}, usando valor por defecto`, err);
    return defaultValue;
  }
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError' || err?.code === 22) {
      try {
        localStorage.removeItem(STORAGE_KEYS.POSTS);
        localStorage.removeItem(STORAGE_KEYS.ALL_TEAMS);
        localStorage.removeItem(STORAGE_KEYS.USERS);
        localStorage.removeItem(STORAGE_KEYS.PLAYERS_BY_TEAM);
        localStorage.setItem(key, value);
      } catch {
        console.warn(`[Storage] Omitiendo caché local para '${key}' debido al límite de 5MB.`);
      }
    }
  }
};

// --- DATOS INICIALES Y SESIONES ---
export const loadInitialData = () => {
  return loadFromStorage();
};

export const saveDeviceSession = (user: AppUser | null) => {
  if (user) {
    safeSetItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    safeSetItem(STORAGE_KEYS.DEVICE_SESSION_SAVED, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.DEVICE_SESSION_SAVED);
  }
};

export const isDeviceSessionSaved = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.DEVICE_SESSION_SAVED) === 'true';
};

export const clearDeviceSession = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.DEVICE_SESSION_SAVED);
};

// --- FUNCIONES DE JUGADORES ---
export const getPlayersForTeam = (teamId: string): Player[] => {
  if (!teamId) return [];
  try {
    const map = safeGetItem<Record<string, Player[]>>(STORAGE_KEYS.PLAYERS_BY_TEAM, {});
    if (map && typeof map === 'object' && Array.isArray(map[teamId])) {
      return map[teamId];
    }
    const fallback = safeGetItem<Player[]>(STORAGE_KEYS.PLAYERS, []);
    return Array.isArray(fallback) ? fallback : [];
  } catch {
    return [];
  }
};

export const savePlayersForTeam = (teamId: string, players: Player[]) => {
  if (!teamId) return;
  try {
    const rawMap = safeGetItem<Record<string, Player[]>>(STORAGE_KEYS.PLAYERS_BY_TEAM, {});
    rawMap[teamId] = players;
    safeSetItem(STORAGE_KEYS.PLAYERS_BY_TEAM, JSON.stringify(rawMap));
    safeSetItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  } catch (err) {
    console.warn('Error saving players for team', err);
  }
};

// --- FUNCIONES DE PARTIDOS ---
export const getMatchesForTeam = (teamId: string): Match[] => {
  if (!teamId) return [];
  try {
    const map = safeGetItem<Record<string, Match[]>>(STORAGE_KEYS.MATCHES_BY_TEAM, {});
    if (map && typeof map === 'object' && Array.isArray(map[teamId])) {
      return map[teamId];
    }
    const fallback = safeGetItem<Match[]>(STORAGE_KEYS.MATCHES, []);
    return Array.isArray(fallback) ? fallback : [];
  } catch {
    return [];
  }
};

export const saveMatchesForTeam = (teamId: string, matches: Match[]) => {
  if (!teamId) return;
  try {
    const rawMap = safeGetItem<Record<string, Match[]>>(STORAGE_KEYS.MATCHES_BY_TEAM, {});
    rawMap[teamId] = matches;
    safeSetItem(STORAGE_KEYS.MATCHES_BY_TEAM, JSON.stringify(rawMap));
    safeSetItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  } catch (err) {
    console.warn('Error saving matches for team', err);
  }
};

// --- FUNCIONES DE TABLA DE POSICIONES (STANDINGS) ---
export const getStandingsForLeague = (leagueName: string): StandingsRow[] => {
  if (!leagueName) return [];
  try {
    const map = safeGetItem<Record<string, StandingsRow[]>>(STORAGE_KEYS.STANDINGS_BY_LEAGUE, {});
    if (map && typeof map === 'object' && Array.isArray(map[leagueName])) {
      return map[leagueName];
    }
    const fallback = safeGetItem<StandingsRow[]>(STORAGE_KEYS.STANDINGS, []);
    return Array.isArray(fallback) ? fallback : [];
  } catch {
    return [];
  }
};

export const saveStandingsForLeague = (leagueName: string, standings: StandingsRow[]) => {
  if (!leagueName) return;
  try {
    const rawMap = safeGetItem<Record<string, StandingsRow[]>>(STORAGE_KEYS.STANDINGS_BY_LEAGUE, {});
    rawMap[leagueName] = standings;
    safeSetItem(STORAGE_KEYS.STANDINGS_BY_LEAGUE, JSON.stringify(rawMap));
    safeSetItem(STORAGE_KEYS.STANDINGS, JSON.stringify(standings));
  } catch (err) {
    console.warn('Error saving standings for league', err);
  }
};

// --- MÉTODOS DE ESTADO GENERAL ---
export const saveToStorage = (state: {
  team?: TeamInfo;
  allTeams?: TeamInfo[];
  players?: Player[];
  matches?: Match[];
  posts?: Post[];
  standings?: StandingsRow[];
  users?: AppUser[];
  currentUser?: AppUser | null;
  language?: Language;
}) => {
  try {
    if (state.team) {
      safeSetItem(STORAGE_KEYS.TEAM, JSON.stringify(state.team));
      if (state.players) {
        savePlayersForTeam(state.team.id, state.players);
      }
      if (state.matches) {
        saveMatchesForTeam(state.team.id, state.matches);
      }
      if (state.standings) {
        saveStandingsForLeague(state.team.leagueName, state.standings);
      }
    }
    if (state.allTeams) {
      safeSetItem(STORAGE_KEYS.ALL_TEAMS, JSON.stringify(state.allTeams));
    }
    if (state.posts) {
      safeSetItem(STORAGE_KEYS.POSTS, JSON.stringify(state.posts));
    }
    if (state.users) {
      safeSetItem(STORAGE_KEYS.USERS, JSON.stringify(state.users));
    }
    if (state.currentUser) {
      saveDeviceSession(state.currentUser);
    }
    if (state.language) {
      safeSetItem(STORAGE_KEYS.LANGUAGE, state.language);
    }
  } catch (err) {
    console.warn('[Storage] Error saving state to storage', err);
  }
};

export const safeGetStateItem = <T>(key: string, defaultValue: T): T => {
  return safeGetItem<T>(key, defaultValue);
};

export const saveStateItem = <T>(key: string, value: T) => {
  safeSetItem(key, JSON.stringify(value));
};

export const loadFromStorage = () => {
  try {
    const team = safeGetItem<TeamInfo | null>(STORAGE_KEYS.TEAM, null);
    const currentUser = safeGetItem<AppUser | null>(STORAGE_KEYS.CURRENT_USER, null);
    const users = safeGetItem<AppUser[]>(STORAGE_KEYS.USERS, []);
    const allTeams = safeGetItem<TeamInfo[]>(STORAGE_KEYS.ALL_TEAMS, []);
    const posts = safeGetItem<Post[]>(STORAGE_KEYS.POSTS, []);
    const language = (localStorage.getItem(STORAGE_KEYS.LANGUAGE) as Language) || 'es';

    let players: Player[] = [];
    let matches: Match[] = [];
    let standings: StandingsRow[] = [];

    if (team && typeof team === 'object' && team.id) {
      players = getPlayersForTeam(team.id);
      matches = getMatchesForTeam(team.id);
      if (team.leagueName) {
        standings = getStandingsForLeague(team.leagueName);
      }
    }

    return {
      team,
      currentUser,
      users,
      allTeams,
      posts,
      players,
      matches,
      standings,
      language
    };
  } catch (err) {
    console.warn('[Storage] Error cargando desde localStorage', err);
    return {};
  }
};