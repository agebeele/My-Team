export type UserRole = 'owner' | 'player' | 'admin';

export type PlayerPosition = 'POR' | 'DEF' | 'MED' | 'DEL';

export type MatchModality = 'fut5' | 'fut7' | 'fut9' | 'fut11';

export interface MVPRecord {
  id: string;
  matchId: string;
  rival: string;
  date: string;
  photoUrl: string;
  votesCount: number;
}

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  number: number;
  position: PlayerPosition;
  avatarUrl: string;
  goals: number;
  assists: number;
  matches: number;
  yellowCards: number;
  redCards: number;
  phone?: string;
  isCalledUp?: boolean;
  isStarter?: boolean;
  mvpHistory: MVPRecord[];
}

export interface TeamInfo {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  bannerUrl: string;
  leagueName: string;
  season?: string;
  stadium: string;
  foundedYear: string;
  primaryColor: string;
  secondaryColor: string;
}

export type MatchEventType = 'goal' | 'substitution' | 'yellow_card' | 'red_card';

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  minute: number;
  period: '1T' | '2T';
  team: 'us' | 'them';
  playerId?: string;
  playerName?: string;
  assistPlayerId?: string;
  assistPlayerName?: string;
  playerInId?: string;
  playerInName?: string;
  playerOutId?: string;
  playerOutName?: string;
  cardType?: 'yellow' | 'red';
  note?: string;
  scoreSnapshot?: { scoreUs: number; scoreThem: number };
  timestamp: number;
}

export interface MatchScorer {
  playerId: string;
  playerName: string;
  minute: number;
  assistPlayerName?: string;
}

export interface LineupPosition {
  playerId: string;
  x: number; // percentage 0 - 100 on field
  y: number; // percentage 0 - 100 on field
  roleName?: string;
}

export interface Match {
  id: string;
  rival: string;
  rivalLogo: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  stadium: string;
  isHome: boolean;
  status: 'scheduled' | 'live' | 'finished';
  scoreUs: number | null;
  scoreThem: number | null;
  scorersUs: MatchScorer[];
  calledUpPlayerIds: string[];
  modality?: MatchModality;
  lineup: LineupPosition[];
  events?: MatchEvent[];
  mvpId?: string;
  mvpPlayerName?: string;
  mvpPhotoUrl?: string;
  mvpVotes?: Record<string, number>;
  createdAtTimestamp: number;
  matchStartTimestamp: number;
}

export interface StandingsRow {
  id: string;
  rank: number;
  name: string;
  logo: string;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
  isOurTeam?: boolean;
}

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: UserRole;
  category: 'Anuncio' | 'Partido' | 'Entrenamiento' | 'Celebración' | 'Liga';
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  reactions: {
    likes: number;
    fire: number;
    clap: number;
    goal: number;
    userReactions: Record<string, string>; // userId -> reactionType
  };
  comments: PostComment[];
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  playerId?: string;
  provider: 'google' | 'apple' | 'email' | 'guest';
}

export type Language = 'es' | 'en';
