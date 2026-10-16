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
  INITIAL_TEAMS,
  INITIAL_PLAYERS,
  INITIAL_MATCHES,
  INITIAL_STANDINGS,
  INITIAL_POSTS,
  INITIAL_USERS,
  DEFAULT_LINEUP,
} from '../data/initialData';

const STORAGE_KEYS = {
  TEAM: 'teamgol_team_data',
  ALL_TEAMS: 'teamgol_all_teams_data',
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
    const savedAllTeams = localStorage.getItem(STORAGE_KEYS.ALL_TEAMS);
    const savedTeam = localStorage.getItem(STORAGE_KEYS.TEAM);
    const savedPlayers = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    const savedMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
    const savedStandings = localStorage.getItem(STORAGE_KEYS.STANDINGS);
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

    let loadedStandings = INITIAL_STANDINGS;
    if (savedStandings) {
      try {
        const parsed = JSON.parse(savedStandings) as StandingsRow[];
        const isOldData =
          parsed.length < 25 ||
          parsed.some((r) => r.name.toLowerCase().includes('frontera') || r.name.toLowerCase().includes('fenix'));
        if (!isOldData && parsed.length >= 28) {
          loadedStandings = parsed;
        } else {
          localStorage.setItem(STORAGE_KEYS.STANDINGS, JSON.stringify(INITIAL_STANDINGS));
        }
      } catch {
        loadedStandings = INITIAL_STANDINGS;
      }
    } else {
      localStorage.setItem(STORAGE_KEYS.STANDINGS, JSON.stringify(INITIAL_STANDINGS));
    }

    return {
      team: loadedTeam,
      allTeams: loadedAllTeams,
      players: normalizedPlayers,
      matches: normalizedMatches,
      standings: loadedStandings,
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
      localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(state.team));
    }
    if (state.allTeams) {
      localStorage.setItem(STORAGE_KEYS.ALL_TEAMS, JSON.stringify(state.allTeams));
    } else if (state.team) {
      // Sync into allTeams
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.ALL_TEAMS);
        let list: TeamInfo[] = stored ? JSON.parse(stored) : INITIAL_TEAMS;
        if (!Array.isArray(list)) list = INITIAL_TEAMS;
        const exists = list.some((t) => t.id === state.team!.id);
        if (exists) {
          list = list.map((t) => (t.id === state.team!.id ? state.team! : t));
        } else {
          list = [state.team!, ...list];
        }
        localStorage.setItem(STORAGE_KEYS.ALL_TEAMS, JSON.stringify(list));
      } catch {
        // ignore
      }
    }
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
