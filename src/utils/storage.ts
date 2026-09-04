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

    return {
      team: savedTeam ? (JSON.parse(savedTeam) as TeamInfo) : INITIAL_TEAM,
      players: savedPlayers ? (JSON.parse(savedPlayers) as Player[]) : INITIAL_PLAYERS,
      matches: savedMatches ? (JSON.parse(savedMatches) as Match[]) : INITIAL_MATCHES,
      standings: savedStandings ? (JSON.parse(savedStandings) as StandingsRow[]) : INITIAL_STANDINGS,
      posts: savedPosts ? (JSON.parse(savedPosts) as Post[]) : INITIAL_POSTS,
      users: savedUsers ? (JSON.parse(savedUsers) as AppUser[]) : INITIAL_USERS,
      currentUser: savedCurrentUser ? (JSON.parse(savedCurrentUser) as AppUser) : INITIAL_USERS[0],
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
      currentUser: INITIAL_USERS[0],
      language: 'es' as Language,
    };
  }
};

export const loadInitialData = loadInitialState;

export const saveToStorage = (state: {
  team?: TeamInfo;
  players?: Player[];
  matches?: Match[];
  posts?: Post[];
  standings?: StandingsRow[];
  users?: AppUser[];
  currentUser?: AppUser;
  language?: Language;
}) => {
  try {
    if (state.team) localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(state.team));
    if (state.players) localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(state.players));
    if (state.matches) localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(state.matches));
    if (state.posts) localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(state.posts));
    if (state.standings) localStorage.setItem(STORAGE_KEYS.STANDINGS, JSON.stringify(state.standings));
    if (state.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(state.users));
    if (state.currentUser) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(state.currentUser));
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
