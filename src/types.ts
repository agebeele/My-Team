export type UserRole = 'owner' | 'player' | 'admin' | 'coach' | 'league_admin';

// All standard football / soccer positions
export type PlayerPosition =
  | 'POR'
  // Defensas
  | 'DFC'
  | 'LI'
  | 'LD'
  | 'CAI'
  | 'CAD'
  | 'DEF'
  // Mediocampistas
  | 'MCD'
  | 'MC'
  | 'MCO'
  | 'MI'
  | 'MD'
  | 'MED'
  // Delanteros
  | 'DC'
  | 'EI'
  | 'ED'
  | 'SD'
  | 'DEL';

// Base64 encoded Facebook-style default silhouette avatar (bulletproof across all browsers & iframes)
export const DEFAULT_FACEBOOK_AVATAR =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNFNEU2RUIiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjM2IiByPSIxNiIgZmlsbD0iIzhEOTQ5RSIvPjxwYXRoIGQ9Ik01MCA1OGMtMTcgMC0zNCA5LTM0IDI1djE3aDY4VjgzYzAtMTYtMTctMjUtMzQtMjV6IiBmaWxsPSIjOEQ5NDlFIi8+PC9zdmc+';

export interface PositionOption {
  value: PlayerPosition;
  label: string;
  category: 'POR' | 'DEF' | 'MED' | 'DEL';
}

export const ALL_POSITIONS: PositionOption[] = [
  // Portería
  { value: 'POR', label: 'Portero / Arquero (POR)', category: 'POR' },
  // Defensas
  { value: 'DFC', label: 'Defensa Central (DFC)', category: 'DEF' },
  { value: 'LI', label: 'Lateral Izquierdo (LI)', category: 'DEF' },
  { value: 'LD', label: 'Lateral Derecho (LD)', category: 'DEF' },
  { value: 'CAI', label: 'Carrilero Izquierdo (CAI)', category: 'DEF' },
  { value: 'CAD', label: 'Carrilero Derecho (CAD)', category: 'DEF' },
  { value: 'DEF', label: 'Defensa General (DEF)', category: 'DEF' },
  // Mediocampo
  { value: 'MCD', label: 'Mediocentro Defensivo (MCD)', category: 'MED' },
  { value: 'MC', label: 'Mediocentro (MC)', category: 'MED' },
  { value: 'MCO', label: 'Mediapunta / Enganche (MCO)', category: 'MED' },
  { value: 'MI', label: 'Medio Izquierdo (MI)', category: 'MED' },
  { value: 'MD', label: 'Medio Derecho (MD)', category: 'MED' },
  { value: 'MED', label: 'Mediocampista General (MED)', category: 'MED' },
  // Delantera
  { value: 'DC', label: 'Delantero Centro (DC)', category: 'DEL' },
  { value: 'EI', label: 'Extremo Izquierdo (EI)', category: 'DEL' },
  { value: 'ED', label: 'Extremo Derecho (ED)', category: 'DEL' },
  { value: 'SD', label: 'Segundo Delantero (SD)', category: 'DEL' },
  { value: 'DEL', label: 'Delantero General (DEL)', category: 'DEL' },
];

export function getPositionCategory(pos: PlayerPosition | string): 'POR' | 'DEF' | 'MED' | 'DEL' {
  if (pos === 'POR') return 'POR';
  if (['DFC', 'LI', 'LD', 'CAI', 'CAD', 'DEF'].includes(pos)) return 'DEF';
  if (['MCD', 'MC', 'MCO', 'MI', 'MD', 'MED'].includes(pos)) return 'MED';
  return 'DEL';
}

export function getPlayerPositionName(pos: PlayerPosition | string): string {
  const found = ALL_POSITIONS.find((p) => p.value === pos);
  if (found) {
    return found.label.split(' (')[0];
  }
  return pos;
}

export function getPositionBadgeClass(pos: PlayerPosition | string): string {
  const cat = getPositionCategory(pos);
  switch (cat) {
    case 'POR':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'DEF':
      return 'bg-sky-100 text-sky-800 border-sky-300';
    case 'MED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'DEL':
    default:
      return 'bg-rose-100 text-rose-800 border-rose-300';
  }
}

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
  number?: number | string;
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
  linkedUserId?: string;
  invitationStatus?: 'pending' | 'confirmed' | 'declined';
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
  location?: string;
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
  teamId?: string;
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
  finishedAtTimestamp?: number;
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
  teamId?: string; // ID of the team this post belongs to
  leagueName?: string; // League this post is associated with
  isLeagueOfficial?: boolean; // If true, official post from La Liga visible to all teams in league
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: UserRole;
  category: 'Anuncio' | 'Partido' | 'Entrenamiento' | 'Celebración' | 'Liga';
  title: string;
  content: string;
  imageUrl?: string;
  mediaType?: 'image' | 'video';
  status?: 'approved' | 'pending' | 'rejected';
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
  teamId?: string; // Affiliated team ID
  provider: 'google' | 'apple' | 'email' | 'guest';
  username?: string;
  password?: string;
  phone?: string;
  adminTitle?: string;
  bio?: string;
  position?: PlayerPosition;
  jerseyNumber?: number;
}

export type StoryType = 'custom' | 'match' | 'match_result' | 'mvp' | 'standings' | 'scorers' | 'convocatoria' | 'lineup' | 'player_card';
export type StoryTheme = 'neon' | 'dark' | 'gold' | 'minimal' | 'fire' | 'facebook' | 'champions_neon' | 'gold_mvp' | 'emerald_turf' | 'dark_minimal' | 'bayern_red';

export interface ClubStory {
  id: string;
  type: StoryType;
  title: string;
  caption?: string;
  imageUrl?: string;
  mediaUrl?: string;
  authorId: string;
  authorName: string;
  authorRole?: UserRole;
  authorAvatar?: string;
  authorUsername?: string;
  createdAt: string | number;
  theme?: StoryTheme;
  likesCount?: number;
  likedByUserIds?: string[];
  teamId?: string;
}

export interface AppNotification {
  id: string;
  recipientUserId: string;
  title: string;
  message: string;
  type: 'invitation' | 'match' | 'announcement' | 'alert' | 'mvp' | 'squad_invitation';
  read: boolean;
  createdAt: string;
  timestamp?: number | string;
  senderAvatar?: string;
  senderName?: string;
  teamLogo?: string;
  status?: 'pending' | 'accepted' | 'declined';
  invitationData?: {
    dorsal?: number;
    position?: PlayerPosition;
    nickname?: string;
    playerId?: string;
    teamId?: string;
    teamName?: string;
  };
}

export interface TeamInvitation {
  id: string;
  email: string;
  playerName: string;
  teamId?: string;
  teamName: string;
  teamLogo?: string;
  stadium?: string;
  sentAt: string;
  role: UserRole;
  status: 'sent' | 'accepted';
}

export type Language = 'es' | 'en';

export interface ArmbandTelemetryData {
  heartRate: number; // BPM
  spO2: number; // %
  accelX: number;
  accelY: number;
  accelZ: number;
  gForce: number; // total resultant G
  intensity: number; // 0 - 100%
  sprints: number;
  cadence: number; // steps / min
  calories: number;
  batteryLevel: number;
  timestamp: number;
}

export type ArmbandConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'simulated';

export interface TelemetrySessionRecord {
  id: string;
  playerId: string;
  playerName: string;
  matchId?: string;
  rivalName?: string;
  date: string;
  startTime: number;
  durationSeconds: number;
  avgBpm: number;
  maxBpm: number;
  sprintsCount: number;
  caloriesBurned: number;
  highIntensityMinutes: number;
}
