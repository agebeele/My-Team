import { Player, TeamInfo, Match, StandingsRow, Post, AppUser } from '../types';

// En lugar de null, exportamos un objeto de equipo vacío
export const INITIAL_TEAM: TeamInfo = {
  id: '',
  name: '',
  shortName: '',
  logoUrl: '',
  bannerUrl: '',
  leagueName: '',
  season: '',
  stadium: '',
  location: '',
  foundedYear: '',
  primaryColor: '#1877F2',
  secondaryColor: '#0866FF',
};

export const INITIAL_TEAMS: TeamInfo[] = [];
export const INITIAL_PLAYERS: Player[] = [];
export const INITIAL_POSTS: Post[] = [];
export const INITIAL_MATCHES: Match[] = [];
export const INITIAL_USERS: AppUser[] = [];
export const INITIAL_STANDINGS: StandingsRow[] = [];

export const INITIAL_STANDINGS_LIGA_MEXICANA: StandingsRow[] = [];
export const INITIAL_STANDINGS_LIGA_ESP: StandingsRow[] = [];
export const INITIAL_STANDINGS_LIGA_FRA: StandingsRow[] = [];
export const INITIAL_STANDINGS_COPA_MUNDO: StandingsRow[] = [];

export const DEFAULT_LINEUP: any[] = [];