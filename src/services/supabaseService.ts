import { getSupabaseClient, isSupabaseConfigured } from '../utils/supabaseClient';
import { Player, Match, Post, TeamInfo, StandingsRow, AppUser } from '../types';

// ==========================================
// 1. CAMELCASE <-> SNAKE_CASE MAPPERS
// ==========================================

export const mapTeamToDb = (team: TeamInfo) => ({
  id: team.id,
  name: team.name,
  short_name: team.shortName || team.name,
  logo_url: team.logoUrl || null,
  banner_url: team.bannerUrl || null,
  league_name: team.leagueName || 'Champions League',
  season: team.season || 'Temporada 2026',
  stadium: team.stadium || '',
  location: team.location || null,
  founded_year: team.foundedYear || '2021',
  primary_color: team.primaryColor || '#1877F2',
  secondary_color: team.secondaryColor || '#0866FF',
});

export const mapTeamFromDb = (row: any): TeamInfo => ({
  id: row.id,
  name: row.name,
  shortName: row.short_name || row.name,
  logoUrl: row.logo_url || '',
  bannerUrl: row.banner_url || '',
  leagueName: row.league_name || 'Champions League',
  season: row.season || 'Temporada 2026',
  stadium: row.stadium || '',
  location: row.location || '',
  foundedYear: row.founded_year || '2021',
  primaryColor: row.primary_color || '#1877F2',
  secondaryColor: row.secondary_color || '#0866FF',
});

export const mapPlayerToDb = (teamId: string, player: Player) => ({
  id: player.id,
  team_id: teamId,
  name: player.name,
  nickname: player.nickname || null,
  number: player.number !== undefined && player.number !== null ? String(player.number) : null,
  position: player.position,
  avatar_url: player.avatarUrl || null,
  goals: Number(player.goals) || 0,
  assists: Number(player.assists) || 0,
  matches: Number(player.matches) || 0,
  yellow_cards: Number(player.yellowCards) || 0,
  red_cards: Number(player.redCards) || 0,
  phone: player.phone || null,
  is_called_up: player.isCalledUp ?? true,
  is_starter: player.isStarter ?? false,
  mvp_history: Array.isArray(player.mvpHistory) ? player.mvpHistory : [],
});

export const mapPlayerFromDb = (row: any): Player => ({
  id: row.id,
  name: row.name,
  nickname: row.nickname || undefined,
  number: row.number !== null && row.number !== undefined ? row.number : '',
  position: row.position,
  avatarUrl: row.avatar_url || '',
  goals: Number(row.goals) || 0,
  assists: Number(row.assists) || 0,
  matches: Number(row.matches) || 0,
  yellowCards: Number(row.yellow_cards) || 0,
  redCards: Number(row.red_cards) || 0,
  phone: row.phone || undefined,
  isCalledUp: row.is_called_up ?? true,
  isStarter: row.is_starter ?? false,
  mvpHistory: Array.isArray(row.mvp_history) ? row.mvp_history : [],
});

export const mapMatchToDb = (teamId: string, match: Match) => ({
  id: match.id,
  team_id: teamId,
  rival: match.rival,
  rival_logo: match.rivalLogo || null,
  date: match.date,
  time: match.time,
  stadium: match.stadium,
  is_home: match.isHome ?? true,
  status: match.status || 'scheduled',
  modality: match.modality || 'fut7',
  score_us: match.scoreUs !== undefined && match.scoreUs !== null ? Number(match.scoreUs) : null,
  score_them: match.scoreThem !== undefined && match.scoreThem !== null ? Number(match.scoreThem) : null,
  scorers_us: Array.isArray(match.scorersUs) ? match.scorersUs : [],
  events: Array.isArray(match.events) ? match.events : [],
  called_up_player_ids: Array.isArray(match.calledUpPlayerIds) ? match.calledUpPlayerIds : [],
  lineup: Array.isArray(match.lineup) ? match.lineup : [],
  mvp_id: match.mvpId || null,
  mvp_player_name: match.mvpPlayerName || null,
  mvp_photo_url: match.mvpPhotoUrl || null,
  mvp_votes: match.mvpVotes || {},
  created_at_timestamp: match.createdAtTimestamp || null,
  match_start_timestamp: match.matchStartTimestamp || null,
  finished_at_timestamp: match.finishedAtTimestamp || null,
});

export const mapMatchFromDb = (row: any): Match => ({
  id: row.id,
  teamId: row.team_id,
  rival: row.rival,
  rivalLogo: row.rival_logo || undefined,
  date: row.date,
  time: row.time,
  stadium: row.stadium,
  isHome: row.is_home ?? true,
  status: row.status || 'scheduled',
  modality: row.modality || 'fut7',
  scoreUs: row.score_us !== null && row.score_us !== undefined ? Number(row.score_us) : null,
  scoreThem: row.score_them !== null && row.score_them !== undefined ? Number(row.score_them) : null,
  scorersUs: Array.isArray(row.scorers_us) ? row.scorers_us : [],
  events: Array.isArray(row.events) ? row.events : [],
  calledUpPlayerIds: Array.isArray(row.called_up_player_ids) ? row.called_up_player_ids : [],
  lineup: Array.isArray(row.lineup) ? row.lineup : [],
  mvpId: row.mvp_id || undefined,
  mvpPlayerName: row.mvp_player_name || undefined,
  mvpPhotoUrl: row.mvp_photo_url || undefined,
  mvpVotes: row.mvp_votes || {},
  createdAtTimestamp: row.created_at_timestamp ? Number(row.created_at_timestamp) : undefined,
  matchStartTimestamp: row.match_start_timestamp ? Number(row.match_start_timestamp) : undefined,
  finishedAtTimestamp: row.finished_at_timestamp ? Number(row.finished_at_timestamp) : undefined,
});

export const mapPostToDb = (post: Post) => ({
  id: post.id,
  team_id: post.teamId || null,
  league_name: post.leagueName || 'Champions League',
  is_league_official: post.isLeagueOfficial ?? false,
  author_id: post.authorId,
  author_name: post.authorName,
  author_avatar: post.authorAvatar || null,
  author_role: post.authorRole || 'player',
  category: post.category,
  title: post.title,
  content: post.content,
  image_url: post.imageUrl || null,
  media_type: post.mediaType || null,
  status: post.status || 'approved',
  created_at: post.createdAt || 'Justo ahora',
  reactions: post.reactions || {
    likes: 0,
    fire: 0,
    clap: 0,
    goal: 0,
    userReactions: {},
  },
  comments: post.comments || [],
});

export const mapPostFromDb = (row: any): Post => ({
  id: row.id,
  teamId: row.team_id || undefined,
  leagueName: row.league_name || 'Champions League',
  isLeagueOfficial: Boolean(row.is_league_official),
  authorId: row.author_id,
  authorName: row.author_name,
  authorAvatar: row.author_avatar || '',
  authorRole: row.author_role || 'player',
  category: row.category,
  title: row.title,
  content: row.content,
  imageUrl: row.image_url || undefined,
  mediaType: row.media_type || undefined,
  status: (row.status || 'approved') as Post['status'],
  createdAt: row.created_at || 'Justo ahora',
  reactions: row.reactions || {
    likes: 0,
    fire: 0,
    clap: 0,
    goal: 0,
    userReactions: {},
  },
  comments: Array.isArray(row.comments) ? row.comments : [],
});

export const mapUserToDb = (user: AppUser) => ({
  id: user.id,
  name: user.name,
  email: user.email.toLowerCase().trim(),
  username: user.username || null,
  password: user.password || null,
  role: user.role || 'player',
  avatar_url: user.avatarUrl || null,
  player_id: user.playerId || null,
  team_id: user.teamId || null,
  provider: user.provider || 'email',
});

export const mapUserFromDb = (row: any): AppUser => ({
  id: row.id,
  name: row.name,
  email: row.email,
  username: row.username || undefined,
  password: row.password || undefined,
  role: row.role || 'player',
  avatarUrl: row.avatar_url || '',
  playerId: row.player_id || undefined,
  teamId: row.team_id || undefined,
  provider: row.provider || 'email',
});

// ==========================================
// 2. TEAMS SERVICE
// ==========================================
export const supabaseFetchTeams = async (): Promise<TeamInfo[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('teams').select('*');
    if (error) {
      console.warn('[Supabase] fetchTeams error:', error.message);
      return null;
    }
    if (!data) return [];
    return data.map(mapTeamFromDb);
  } catch (err: any) {
    console.warn('[Supabase] fetchTeams exception:', err?.message || err);
    return null;
  }
};

export const supabaseUpsertTeam = async (team: TeamInfo): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = mapTeamToDb(team);
    const { error } = await client.from('teams').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error al guardar equipo:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Supabase] Excepción al guardar equipo:', err?.message || err);
    return false;
  }
};

export const supabaseDeleteTeam = async (teamId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('teams').delete().eq('id', teamId);
    return !error;
  } catch {
    return false;
  }
};

// ==========================================
// 3. PLAYERS SERVICE (PLANTEL)
// ==========================================
export const supabaseFetchPlayers = async (teamId: string): Promise<Player[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[Supabase] fetchPlayers error:', error.message);
      return null;
    }
    if (!data) return [];
    return data.map(mapPlayerFromDb);
  } catch (err: any) {
    console.warn('[Supabase] fetchPlayers exception:', err?.message || err);
    return null;
  }
};

export const supabaseUpsertPlayer = async (teamId: string, player: Player): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = mapPlayerToDb(teamId, player);
    const { error } = await client.from('players').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error al guardar jugador:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Supabase] Excepción al guardar jugador:', err?.message || err);
    return false;
  }
};

export const supabaseDeletePlayer = async (playerId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('players').delete().eq('id', playerId);
    if (error) {
      console.error('[Supabase] Error al eliminar jugador:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Supabase] Excepción al eliminar jugador:', err?.message || err);
    return false;
  }
};

// ==========================================
// 4. MATCHES SERVICE (PARTIDOS)
// ==========================================
export const supabaseFetchMatches = async (teamId: string): Promise<Match[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('matches')
      .select('*')
      .eq('team_id', teamId)
      .order('date', { ascending: false });

    if (error) {
      console.warn('[Supabase] fetchMatches error:', error.message);
      return null;
    }
    if (!data) return [];
    return data.map(mapMatchFromDb);
  } catch (err: any) {
    console.warn('[Supabase] fetchMatches exception:', err?.message || err);
    return null;
  }
};

export const supabaseUpsertMatch = async (teamId: string, match: Match): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = mapMatchToDb(teamId, match);
    const { error } = await client.from('matches').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error al guardar partido:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Supabase] Excepción al guardar partido:', err?.message || err);
    return false;
  }
};

export const supabaseDeleteMatch = async (matchId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('matches').delete().eq('id', matchId);
    if (error) {
      console.error('[Supabase] Error al eliminar partido:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Supabase] Excepción al eliminar partido:', err?.message || err);
    return false;
  }
};

// ==========================================
// 5. POSTS SERVICE (MURO SOCIAL)
// ==========================================
export const supabaseFetchPosts = async (teamId?: string): Promise<Post[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    let query = client.from('posts').select('*');
    if (teamId) {
      query = query.or(`team_id.eq.${teamId},is_league_official.eq.true`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[Supabase] fetchPosts error:', error.message);
      return null;
    }
    if (!data) return [];
    const mapped = data.map(mapPostFromDb);
    return mapped.reverse();
  } catch (err: any) {
    console.warn('[Supabase] fetchPosts exception:', err?.message || err);
    return null;
  }
};

export const supabaseUpsertPost = async (post: Post): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = mapPostToDb(post);
    const { error } = await client.from('posts').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('[Supabase] Error al guardar publicación:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Supabase] Excepción al guardar publicación:', err?.message || err);
    return false;
  }
};

export const supabaseDeletePost = async (postId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('posts').delete().eq('id', postId);
    if (error) {
      console.error('[Supabase] Error al eliminar publicación:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Supabase] Excepción al eliminar publicación:', err?.message || err);
    return false;
  }
};

// ==========================================
// 6. APP USERS SERVICE
// ==========================================
export const supabaseFetchUsers = async (): Promise<AppUser[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('app_users').select('*');
    if (error) {
      console.warn('[Supabase] fetchUsers error:', error.message);
      return null;
    }
    if (!data) return [];
    return data.map(mapUserFromDb);
  } catch (err: any) {
    console.warn('[Supabase] fetchUsers exception:', err?.message || err);
    return null;
  }
};

export const supabaseUpsertUser = async (user: AppUser): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = mapUserToDb(user);
    const { error } = await client.from('app_users').upsert(row, { onConflict: 'email' });
    if (error) {
      console.error('[Supabase] Error al guardar usuario:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Supabase] Excepción al guardar usuario:', err?.message || err);
    return false;
  }
};

// ==========================================
// 7. REALTIME SUBSCRIPTIONS
// ==========================================
export const subscribeToSupabaseTable = (
  table: 'posts' | 'players' | 'matches' | 'app_users' | 'teams',
  onPayload: (payload: any) => void
) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
    .channel(`realtime_${table}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
      },
      (payload) => {
        onPayload(payload);
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
};

export { isSupabaseConfigured };
