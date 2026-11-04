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

// Constantes de ligas vacías
export const INITIAL_STANDINGS_LIGA_MEXICANA: StandingsRow[] = [];
export const INITIAL_STANDINGS_LIGA_ESP: StandingsRow[] = [];
export const INITIAL_STANDINGS_LIGA_FRA: StandingsRow[] = [];
export const INITIAL_STANDINGS_COPA_MUNDO: StandingsRow[] = [];

// Alineación por defecto vacía para evitar fallos de importación
export const DEFAULT_LINEUP: any[] = [];

// Retrieve players for a specific team
export const getPlayersForTeam = (teamId: string): Player[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYERS_BY_TEAM);
    if (raw) {
      const map = JSON.parse(raw);
      if (map && map[teamId] && Array.isArray(map[teamId])) {
        return map[teamId];
      }
    }
    return [];
  } catch {
    return [];
  }
};

// Save squad for a specific team con manejo de cuota y limpieza de imágenes pesadas
export const savePlayersForTeam = (teamId: string, players: Player[]) => {
  if (!teamId) return;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYERS_BY_TEAM);
    const map = raw ? JSON.parse(raw) : {};
    map[teamId] = players;

    safeSetItem(STORAGE_KEYS.PLAYERS_BY_TEAM, JSON.stringify(map));
    safeSetItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError' || err?.code === 22) {
      console.warn('[Storage] Liberando caché pesada al guardar plantilla de jugadores...');
      
      // Limpiamos publicaciones e historial global para liberar espacio
      localStorage.removeItem(STORAGE_KEYS.POSTS);
      localStorage.removeItem(STORAGE_KEYS.ALL_TEAMS);

      // Reintentamos guardar únicamente los jugadores del equipo actual
      try {
        localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
      } catch (retryErr) {
        console.error('[Storage] No se pudo guardar la lista reducida de jugadores', retryErr);
      }
    } else {
      console.warn('Error saving players for team', err);
    }
  }
};

// Retrieve matches for a specific team
export const getMatchesForTeam = (teamId: string): Match[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MATCHES_BY_TEAM);
    if (raw) {
      const map = JSON.parse(raw);
      if (map && map[teamId] && Array.isArray(map[teamId])) {
        return map[teamId];
      }
    }
  } catch {
    // ignore
  }

  // All teams start with an empty match schedule
  return [];
};

// Save matches for a specific team
export const saveMatchesForTeam = (teamId: string, matches: Match[]) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MATCHES_BY_TEAM);
    const map = raw ? JSON.parse(raw) : {};
    map[teamId] = matches;
    localStorage.setItem(STORAGE_KEYS.MATCHES_BY_TEAM, JSON.stringify(map));
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
  } catch (err) {
    console.warn('Error saving matches for team', err);
  }
};

// Retrieve standings for a specific league name
export const getStandingsForLeague = (leagueName: string, activeTeam?: TeamInfo): StandingsRow[] => {
  const normKey = (leagueName || 'Champions League').trim().toLowerCase();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STANDINGS_BY_LEAGUE);
    if (raw) {
      const map = JSON.parse(raw);
      if (map && map[normKey] && Array.isArray(map[normKey]) && map[normKey].length > 0) {
        return map[normKey];
      }
    }
  } catch {
    // ignore
  }

  // Si no hay tabla guardada, inicia con una tabla vacía
  return [];
};

// Save standings for a specific league
export const saveStandingsForLeague = (leagueName: string, standings: StandingsRow[]) => {
  const normKey = (leagueName || 'Liga Premier Fútbol 7').trim().toLowerCase();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STANDINGS_BY_LEAGUE);
    const map = raw ? JSON.parse(raw) : {};
    map[normKey] = standings;
    localStorage.setItem(STORAGE_KEYS.STANDINGS_BY_LEAGUE, JSON.stringify(map));
    localStorage.setItem(STORAGE_KEYS.STANDINGS, JSON.stringify(standings));
  } catch (err) {
    console.warn('Error saving standings for league', err);
  }
};

export const loadInitialState = () => {
  try {
    const savedAllTeams = localStorage.getItem(STORAGE_KEYS.ALL_TEAMS);
    const savedTeam = localStorage.getItem(STORAGE_KEYS.TEAM);
    const savedPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
    const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    const savedCurrentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    const savedLang = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as Language | null;

    let loadedAllTeams: TeamInfo[] = INITIAL_TEAMS;
    if (savedAllTeams) {
      try {
        const parsed = JSON.parse(savedAllTeams) as TeamInfo[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedAllTeams = parsed;
        }
      } catch {
        loadedAllTeams = INITIAL_TEAMS;
      }
    }

    let loadedTeam: TeamInfo = loadedAllTeams[0] || INITIAL_TEAM;
    if (savedTeam) {
      try {
        const parsedTeam = JSON.parse(savedTeam) as TeamInfo;
        if (parsedTeam && parsedTeam.name) {
          loadedTeam = parsedTeam;
          // Ensure this team is included in allTeams
          const exists = loadedAllTeams.some((t) => t.id === loadedTeam.id);
          if (!exists) {
            loadedAllTeams = [loadedTeam, ...loadedAllTeams];
          } else {
            loadedAllTeams = loadedAllTeams.map((t) => (t.id === loadedTeam.id ? loadedTeam : t));
          }
        }
      } catch {
        loadedTeam = loadedAllTeams[0] || INITIAL_TEAM;
      }
    }

    // Load team-specific players and matches
    const normalizedPlayers = getPlayersForTeam(loadedTeam.id);
    const loadedMatches = getMatchesForTeam(loadedTeam.id);
    const normalizedMatches = loadedMatches.map((m) => {
      let lineup = m.lineup;
      if (!lineup || lineup.length !== 7) {
        lineup = DEFAULT_LINEUP;
      }
      return {
        ...m,
        modality: 'fut7' as const,
        lineup,
      };
    });

    // Load league-specific standings
const loadedStandings = getStandingsForLeague(loadedTeam?.leagueName, loadedTeam);

// Leer usuarios guardados sin forzar ninguna cuenta de administrador
const loadedUsersRaw = savedUsers ? (JSON.parse(savedUsers) as AppUser[]) : INITIAL_USERS;
const normalizedUsers: AppUser[] = loadedUsersRaw;

const savedDeviceAuth = localStorage.getItem(STORAGE_KEYS.DEVICE_SESSION_SAVED);
const isDeviceSessionSaved = savedDeviceAuth === 'true';

    // Only restore session if this device was explicitly authenticated & saved
    let initialCurrentUser: AppUser | null = null;
    if (savedCurrentUser && isDeviceSessionSaved) {
      try {
        const parsed = JSON.parse(savedCurrentUser) as AppUser;
        const found = normalizedUsers.find(
          (u) =>
            u.id === parsed.id ||
            u.email.toLowerCase() === parsed.email?.toLowerCase() ||
            (parsed.role === 'owner' && (u.username === 'admin' || u.role === 'owner'))
        );
        if (found) {
          initialCurrentUser = found;
        } else if (parsed && parsed.id && parsed.name) {
          initialCurrentUser = parsed;
        }
      } catch {
        initialCurrentUser = null;
      }
    }

    // Posts with backward compatibility
    let loadedPosts: Post[] = INITIAL_POSTS;
    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts) as Post[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedPosts = parsed;
        }
      } catch {
        loadedPosts = INITIAL_POSTS;
      }
    }

    return {
      team: loadedTeam,
      allTeams: loadedAllTeams,
      players: normalizedPlayers,
      matches: normalizedMatches,
      standings: loadedStandings,
      posts: loadedPosts,
      users: normalizedUsers,
      currentUser: initialCurrentUser,
      isDeviceAuthenticated: !!initialCurrentUser,
      language: savedLang || 'es',
    };
  } catch (err) {
    console.error('Failed to parse localStorage:', err);
    return {
      team: INITIAL_TEAM,
      allTeams: INITIAL_TEAMS,
      players: INITIAL_PLAYERS,
      matches: INITIAL_MATCHES,
      standings: INITIAL_STANDINGS,
      posts: INITIAL_POSTS,
      users: INITIAL_USERS,
      currentUser: null,
      isDeviceAuthenticated: false,
      language: 'es' as Language,
    };
  }
};

export const loadInitialData = loadInitialState;

export const saveDeviceSession = (user: AppUser) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.DEVICE_SESSION_SAVED, 'true');
  } catch (err) {
    console.warn('Could not save device session', err);
  }
};

export const clearDeviceSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.DEVICE_SESSION_SAVED);
  } catch (err) {
    console.warn('Could not clear device session', err);
  }
};

// Helper para guardar de forma segura con reintento y limpieza de cuota
const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (err: any) {
    if (err?.name === 'QuotaExceededError' || err?.code === 22) {
      console.warn(`[Storage] Cuota excedida guardando ${key}. Limpiando datos secundarios...`);
      // Limpiamos listas globales grandes que se regeneran desde Supabase/Backend
      localStorage.removeItem(STORAGE_KEYS.POSTS);
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.ALL_TEAMS);
      
      // Reintentamos guardar el dato prioritario
      try {
        localStorage.setItem(key, value);
      } catch (retryErr) {
        console.error(`[Storage] Imposible guardar ${key} incluso tras liberar espacio`, retryErr);
      }
    } else {
      console.warn(`Error guardando ${key} a localStorage`, err);
    }
  }
};

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
    safeSetItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(state.currentUser));
    safeSetItem(STORAGE_KEYS.DEVICE_SESSION_SAVED, 'true');
  }
  if (state.language) {
    safeSetItem(STORAGE_KEYS.LANGUAGE, state.language);
  }
};

export const saveStateItem = <T>(key: string, value: T) => {
  safeSetItem(key, JSON.stringify(value));
};