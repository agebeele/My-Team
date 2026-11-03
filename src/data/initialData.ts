import { Player, TeamInfo, Match, StandingsRow, Post, AppUser } from '../types';

// Se deja en null/vacío para que no fuerce datos semilla de ningún equipo
export const INITIAL_TEAM: TeamInfo | null = null;

export const INITIAL_TEAMS: TeamInfo[] = [];

export const INITIAL_PLAYERS: Player[] = [];

export const INITIAL_POSTS: Post[] = [];

export const INITIAL_MATCHES: Match[] = [];

export const INITIAL_USERS: AppUser[] = [];

export const INITIAL_STANDINGS: StandingsRow[] = [];

export const INITIAL_STANDINGS_LIGA_MEXICANA: StandingsRow[] = [];
export const INITIAL_STANDINGS_LIGA_ESP: StandingsRow[] = [];
export const INITIAL_STANDINGS_LIGA_FRA: StandingsRow[] = [];