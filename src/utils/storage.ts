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
import { DEFAULT_GREY_SHIELD_SVG } from './ocrTableParser';

const STORAGE_KEYS = {
  TEAM: 'teamgol_team_data',
  ALL_TEAMS: 'teamgol_all_teams_data',
  PLAYERS: 'teamgol_players_data',
  PLAYERS_BY_TEAM: 'teamgol_players_by_team',
  MATCHES: 'teamgol_matches_data',
  MATCHES_BY_TEAM: 'teamgol_matches_by_team',
  STANDINGS: 'teamgol_standings_data',
  STANDINGS_BY_LEAGUE: 'teamgol_standings_by_league',
  POSTS: 'teamgol_posts_data',
  USERS: 'teamgol_users_data',
  CURRENT_USER: 'teamgol_current_user',
  LANGUAGE: 'teamgol_language',
  DEVICE_SESSION_SAVED: 'teamgol_device_session_saved',
  SENT_INVITATIONS: 'teamgol_sent_invitations',
};

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
  } catch {
    // ignore
  }

  // Only team_01 (Bayern Munich default) starts with INITIAL_PLAYERS
  if (teamId === 'team_01') {
    const starterIds = new Set(DEFAULT_LINEUP.map((p) => p.playerId));
    return INITIAL_PLAYERS.map((p) => ({
      ...p,
      isStarter: starterIds.has(p.id),
    }));
  }

  // Any newly created or separate team starts with an EMPTY squad (0 players)
  return [];
};

// Save squad for a specific team
export const savePlayersForTeam = (teamId: string, players: Player[]) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYERS_BY_TEAM);
    const map = raw ? JSON.parse(raw) : {};
    map[teamId] = players;
    localStorage.setItem(STORAGE_KEYS.PLAYERS_BY_TEAM, JSON.stringify(map));
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  } catch (err) {
    console.warn('Error saving players for team', err);
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

  // Only team_01 starts with initial matches
  if (teamId === 'team_01') {
    return INITIAL_MATCHES;
  }

  // Brand new teams start with an empty match schedule
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
  const normKey = (leagueName || 'Liga Premier Fútbol 7').trim().toLowerCase();
  let baseRows: StandingsRow[] | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STANDINGS_BY_LEAGUE);
    if (raw) {
      const map = JSON.parse(raw);
      if (map && map[normKey] && Array.isArray(map[normKey]) && map[normKey].length > 0) {
        baseRows = map[normKey];
      }
    }
  } catch {
    // ignore
  }

  // If no stored standings exist for this league yet:
  if (!baseRows || baseRows.length === 0) {
    if (normKey === 'liga premier fútbol 7') {
      baseRows = INITIAL_STANDINGS;
    } else {
      // For a new or different league, start with a clean table for this league
      const initialRow: StandingsRow = {
        id: `st_${activeTeam?.id || Date.now()}_1`,
        rank: 1,
        name: activeTeam?.name || 'Mi Equipo',
        logo: activeTeam?.logoUrl || DEFAULT_GREY_SHIELD_SVG,
        pj: 0,
        g: 0,
        e: 0,
        p: 0,
        gf: 0,
        gc: 0,
        dg: 0,
        pts: 0,
        isOurTeam: true,
      };
      return [initialRow];
    }
  }

  // Ensure activeTeam is represented in the table and marked as our team
  let rows = baseRows.map((row: StandingsRow) => ({
    ...row,
    isOurTeam: activeTeam
      ? row.name.trim().toLowerCase() === activeTeam.name.trim().toLowerCase() ||
        row.name.trim().toLowerCase() === activeTeam.shortName.trim().toLowerCase()
      : row.name.toUpperCase().includes('BAYERN'),
  }));

  if (activeTeam) {
    const teamInTable = rows.some(
      (r) =>
        r.name.trim().toLowerCase() === activeTeam.name.trim().toLowerCase() ||
        r.name.trim().toLowerCase() === activeTeam.shortName.trim().toLowerCase()
    );
    if (!teamInTable) {
      rows.push({
        id: `st_${activeTeam.id || Date.now()}`,
        rank: rows.length + 1,
        name: activeTeam.name,
        logo: activeTeam.logoUrl || DEFAULT_GREY_SHIELD_SVG,
        pj: 0,
        g: 0,
        e: 0,
        p: 0,
        gf: 0,
        gc: 0,
        dg: 0,
        pts: 0,
        isOurTeam: true,
      });
    }
  }

  return rows;
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
    const loadedStandings = getStandingsForLeague(loadedTeam.leagueName, loadedTeam);

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
                teamId: u.teamId || 'team_01',
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
      localStorage.setItem(STORAGE_KEYS.ALL_TEAMS, JSON.stringify(state.allTeams));
    }
    if (state.posts) localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(state.posts));
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
