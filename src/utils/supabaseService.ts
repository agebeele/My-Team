import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { Player, Match, Post, TeamInfo, StandingsRow, AppUser } from '../types';

// ==========================================
// PLAYERS SERVICE
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
      console.warn('Supabase fetchPlayers error:', error);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
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
    }));
  } catch (err) {
    console.warn('Supabase fetchPlayers exception:', err);
    return null;
  }
};

export const supabaseUpsertPlayer = async (teamId: string, player: Player): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
      id: player.id,
      team_id: teamId,
      name: player.name,
      nickname: player.nickname || null,
      number: player.number !== undefined && player.number !== null ? String(player.number) : null,
      position: player.position,
      avatar_url: player.avatarUrl || null,
      goals: player.goals || 0,
      assists: player.assists || 0,
      matches: player.matches || 0,
      yellow_cards: player.yellowCards || 0,
      red_cards: player.redCards || 0,
      phone: player.phone || null,
      is_called_up: player.isCalledUp ?? true,
      is_starter: player.isStarter ?? false,
      mvp_history: player.mvpHistory || [],
    };

    const { error } = await client.from('players').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase upsertPlayer error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsertPlayer exception:', err);
    return false;
  }
};

export const supabaseDeletePlayer = async (playerId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('players').delete().eq('id', playerId);
    return !error;
  } catch {
    return false;
  }
};

// ==========================================
// POSTS SERVICE (MURO SOCIAL)
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
      console.warn('Supabase fetchPosts error:', error);
      return null;
    }

    if (!data) return [];

    const mapped = data.map((row: any) => ({
      id: row.id,
      teamId: row.team_id || undefined,
      leagueName: row.league_name || 'Liga Premier Fútbol 7',
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
    }));

    // Return reversed or sorted by id so latest are first
    return mapped.reverse();
  } catch (err) {
    console.warn('Supabase fetchPosts exception:', err);
    return null;
  }
};

export const supabaseUpsertPost = async (post: Post): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const fullRow = {
      id: post.id,
      team_id: post.teamId || null,
      league_name: post.leagueName || 'Liga Premier Fútbol 7',
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
    };

    const { error } = await client.from('posts').upsert(fullRow, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase upsertPost fullRow error, trying core columns fallback:', error);
      // Fallback: If table is missing media_type, reactions or comments columns
      const coreRow = {
        id: post.id,
        team_id: post.teamId || null,
        league_name: post.leagueName || 'Liga Premier Fútbol 7',
        is_league_official: post.isLeagueOfficial ?? false,
        author_id: post.authorId,
        author_name: post.authorName,
        author_avatar: post.authorAvatar || null,
        author_role: post.authorRole || 'player',
        category: post.category,
        title: post.title,
        content: post.content,
        image_url: post.imageUrl || null,
        status: post.status || 'approved',
        created_at: post.createdAt || 'Justo ahora',
      };
      const retry = await client.from('posts').upsert(coreRow, { onConflict: 'id' });
      if (retry.error) {
        console.error('Supabase upsertPost fallback error:', retry.error);
        return false;
      }
      return true;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsertPost exception:', err);
    return false;
  }
};

export const supabaseDeletePost = async (postId: string): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('posts').delete().eq('id', postId);
    return !error;
  } catch {
    return false;
  }
};

// ==========================================
// MATCHES SERVICE
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
      console.warn('Supabase fetchMatches error:', error);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      rival: row.rival,
      rivalLogo: row.rival_logo,
      date: row.date,
      time: row.time,
      stadium: row.stadium,
      isHome: row.is_home ?? true,
      status: row.status || 'scheduled',
      modality: row.modality || 'fut7',
      scoreUs: row.score_us,
      scoreThem: row.score_them,
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
    }));
  } catch (err) {
    console.warn('Supabase fetchMatches exception:', err);
    return null;
  }
};

export const supabaseUpsertMatch = async (teamId: string, match: Match): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
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
      score_us: match.scoreUs ?? null,
      score_them: match.scoreThem ?? null,
      scorers_us: match.scorersUs || [],
      events: match.events || [],
      called_up_player_ids: match.calledUpPlayerIds || [],
      lineup: match.lineup || [],
      mvp_id: match.mvpId || null,
      mvp_player_name: match.mvpPlayerName || null,
      mvp_photo_url: match.mvpPhotoUrl || null,
      mvp_votes: match.mvpVotes || {},
      created_at_timestamp: match.createdAtTimestamp || null,
      match_start_timestamp: match.matchStartTimestamp || null,
      finished_at_timestamp: match.finishedAtTimestamp || null,
    };

    const { error } = await client.from('matches').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase upsertMatch error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsertMatch exception:', err);
    return false;
  }
};

// ==========================================
// APP USERS SERVICE
// ==========================================
export const supabaseFetchUsers = async (): Promise<AppUser[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.from('app_users').select('*');
    if (error) {
      console.warn('Supabase fetchUsers error:', error);
      return null;
    }
    if (!data) return [];

    return data.map((row: any) => ({
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
    }));
  } catch (err) {
    console.warn('Supabase fetchUsers exception:', err);
    return null;
  }
};

export const supabaseUpsertUser = async (user: AppUser): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const row = {
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
    };

    const { error } = await client.from('app_users').upsert(row, { onConflict: 'email' });
    if (error) {
      console.warn('Supabase upsertUser error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsertUser exception:', err);
    return false;
  }
};

// ==========================================
// REALTIME SUBSCRIPTIONS
// ==========================================
export const subscribeToSupabaseTable = (
  table: 'posts' | 'players' | 'matches' | 'app_users',
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
