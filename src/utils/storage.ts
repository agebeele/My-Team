import {
  TeamInfo,
  Player,
  Match,
  StandingsRow,
  Post,
  AppUser,
  Language,
} from '../types';
import {
  INITIAL_TEAM,
  INITIAL_PLAYERS,
  INITIAL_MATCHES,
  INITIAL_STANDINGS,
  INITIAL_POSTS,
  INITIAL_USERS,
  DEFAULT_LINEUP,
} from '../data/initialData';

const STORAGE_KEYS = {
  TEAM: 'teamgol_team_data',
  PLAYERS: 'teamgol_players_data',
  MATCHES: 'teamgol_matches_data',
  STANDINGS: 'teamgol_standings_data',
  POSTS: 'teamgol_posts_data',
  USERS: 'teamgol_users_data',
  CURRENT_USER: 'teamgol_current_user',
  LANGUAGE: 'teamgol_language',
  DEVICE_SESSION_SAVED: 'teamgol_device_session_saved',
};

export const loadInitialState = () => {
  try {
    const savedTeam = localStorage.getItem(STORAGE_KEYS.TEAM);
    const savedPlayers = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    const savedMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
    const savedStandings = localStorage.getItem(STORAGE_KEYS.STANDINGS);
    const savedPosts = localStorage.getItem(STORAGE_KEYS.POSTS);
    const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    const savedCurrentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    const savedLang = localStorage.getItem(STORAGE_KEYS.LANGUAGE) as Language | null;

    const loadedTeam = savedTeam ? (JSON.parse(savedTeam) as TeamInfo) : INITIAL_TEAM;
    if (loadedTeam.primaryColor === '#10B981') {
      loadedTeam.primaryColor = '#1877F2';
      loadedTeam.secondaryColor = '#0866FF';
    }

    const loadedMatches = savedMatches ? (JSON.parse(savedMatches) as Match[]) : INITIAL_MATCHES;
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

    const loadedPlayers = savedPlayers ? (JSON.parse(savedPlayers) as Player[]) : INITIAL_PLAYERS;
    // Ensure only the 7 starting players in DEFAULT_LINEUP have isStarter = true
    const starterIds = new Set(DEFAULT_LINEUP.map((p) => p.playerId));
    const normalizedPlayers = loadedPlayers.map((p) => ({
      ...p,
      isStarter: starterIds.has(p.id),
    }));

    const loadedUsersRaw = savedUsers ? (JSON.parse(savedUsers) as AppUser[]) : INITIAL_USERS;
    // Normalize users to guarantee requested admin account
    const hasAdmin = loadedUsersRaw.some(
      (u) => u.email.toLowerCase() === 'agbl141201@gmail.com' || u.username === 'admin'
    );
    const normalizedUsers: AppUser[] = hasAdmin
      ? loadedUsersRaw.map((u) =>
          u.email.toLowerCase() === 'agbl141201@gmail.com' || u.username === 'admin'
            ? {
                ...u,
                id: 'u_admin',
                name: 'Administrador (Admin)',
                email: 'agbl141201@gmail.com',
                username: 'admin',
                password: 'root',
                role: 'owner' as const,
              }
            : u
        )
      : [INITIAL_USERS[0], ...loadedUsersRaw];

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
        }
      } catch {
        initialCurrentUser = null;
      }
    }

    return {
      team: loadedTeam,
      players: normalizedPlayers,
      matches: normalizedMatches,
      standings: savedStandings ? (JSON.parse(savedStandings) as StandingsRow[]) : INITIAL_STANDINGS,
      posts: savedPosts ? (JSON.parse(savedPosts) as Post[]) : INITIAL_POSTS,
      users: normalizedUsers,
      currentUser: initialCurrentUser,
      isDeviceAuthenticated: !!initialCurrentUser,
      language: savedLang || 'es',
    };
  } catch (err) {
    console.error('Failed to parse localStorage:', err);
    return {
      team: INITIAL_TEAM,
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

export const saveToStorage = (state: {
  team?: TeamInfo;
  players?: Player[];
  matches?: Match[];
  posts?: Post[];
  standings?: StandingsRow[];
  users?: AppUser[];
  currentUser?: AppUser | null;
  language?: Language;
}) => {
  try {
    if (state.team) localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(state.team));
    if (state.players) localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(state.players));
    if (state.matches) localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(state.matches));
    if (state.posts) localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(state.posts));
    if (state.standings) localStorage.setItem(STORAGE_KEYS.STANDINGS, JSON.stringify(state.standings));
    if (state.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(state.users));
    if (state.currentUser !== undefined) {
      if (state.currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(state.currentUser));
        localStorage.setItem(STORAGE_KEYS.DEVICE_SESSION_SAVED, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem(STORAGE_KEYS.DEVICE_SESSION_SAVED);
      }
    }
    if (state.language) localStorage.setItem(STORAGE_KEYS.LANGUAGE, state.language);
  } catch (err) {
    console.warn('Error saving state to localStorage', err);
  }
};

export const saveStateItem = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error persisting ${key} to storage`, err);
  }
};

export { STORAGE_KEYS };
