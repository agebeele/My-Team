import React, { useState, useRef } from 'react';
import {
  MessageSquare,
  Heart,
  Flame,
  Send,
  Plus,
  Crown,
  User,
  ShieldCheck,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  AlertCircle,
  FileText,
  Check,
  X,
} from 'lucide-react';
import { Post, AppUser, Language, TeamInfo } from '../types';
import { getT } from '../utils/translations';
import { isSupabaseConfigured } from '../utils/supabaseClient';
import { supabaseUpsertPost, supabaseDeletePost } from '../utils/supabaseService';
import { formatDisplayTime, getCurrentTimestampIso } from '../utils/dateUtils';

interface SocialWallProps {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  currentUser: AppUser;
  language: Language;
  team?: TeamInfo;
}

export const SocialWall: React.FC<SocialWallProps> = ({
  posts,
  setPosts,
  currentUser,
  language,
  team,
}) => {
  const t = getT(language);

  // New Post Modal & Form state
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<Post['category']>('Anuncio');
  const [attachedMediaUrl, setAttachedMediaUrl] = useState<string | null>(null);
  const [attachedMediaType, setAttachedMediaType] = useState<'image' | 'video' | null>(null);
  const [attachedMediaName, setAttachedMediaName] = useState<string | null>(null);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  // Post Authorization Modal state (Admin only)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authSuccessToast, setAuthSuccessToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comment inputs mapped by post id
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({
    post_01: true,
  });

  // Filter posts so that:
  // 1. Official league posts (isLeagueOfficial || category === 'Liga') from this league appear for all teams in the league.
  // 2. Team-specific posts (teamId === team.id) appear for this team.
  // 3. Posts belonging to other teams (e.g. Bayern Munich) do NOT appear on another team's wall.
  const currentTeamId = team?.id || 'team_01';
  const currentLeague = (team?.leagueName || 'Liga Premier Fútbol 7').trim().toLowerCase();

  const relevantPosts = posts.filter((p) => {
    // 1. ALL league admin and official league posts appear across ALL teams!
    const isOfficialLeaguePost =
      p.isLeagueOfficial ||
      p.category === 'Liga' ||
      p.authorRole === 'league_admin' ||
      !p.teamId;

    if (isOfficialLeaguePost) {
      return true;
    }

    if (p.teamId && p.teamId !== currentTeamId) {
      return false;
    }

    if (p.teamId === currentTeamId) {
      return true;
    }

    return currentTeamId === 'team_01';
  });

  const pendingPosts = relevantPosts.filter((p) => p.status === 'pending');
  const approvedPosts = relevantPosts.filter((p) => p.status === 'approved' || !p.status);
  const myPendingPosts = relevantPosts.filter(
    (p) => p.authorId === currentUser.id && p.status === 'pending'
  );

  const handleMediaFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      alert('Por favor selecciona un archivo de imagen o video válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAttachedMediaUrl(result);
        setAttachedMediaType(isVideo ? 'video' : 'image');
        setAttachedMediaName(file.name);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAttachedMedia = () => {
    setAttachedMediaUrl(null);
    setAttachedMediaType(null);
    setAttachedMediaName(null);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const isOwner = currentUser.role === 'owner' || currentUser.role === 'league_admin';
    const isLeagueOfficialPost = newCategory === 'Liga' || currentUser.role === 'league_admin';
    const postStatus: Post['status'] = isOwner ? 'approved' : 'pending';

    const post: Post = {
      id: `post_${Date.now()}`,
      teamId: isLeagueOfficialPost ? undefined : (team?.id || 'team_01'),
      leagueName: team?.leagueName || 'Liga Premier Fútbol 7',
      isLeagueOfficial: isLeagueOfficialPost,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl,
      authorRole: currentUser.role,
      category: newCategory,
      title: newTitle.trim(),
      content: newContent.trim(),
      imageUrl: attachedMediaUrl || undefined,
      mediaType: attachedMediaType || undefined,
      status: postStatus,
      createdAt: getCurrentTimestampIso(),
      reactions: {
        likes: 0,
        fire: 0,
        clap: 0,
        goal: 0,
        userReactions: {},
      },
      comments: [],
    };

    setPosts([post, ...posts]);
    if (isSupabaseConfigured()) {
      supabaseUpsertPost(post);
    }
    setShowNewPostModal(false);
    setNewTitle('');
    setNewContent('');
    handleRemoveAttachedMedia();

    if (isOwner) {
      setFormFeedback('¡Publicación aprobada y agregada al muro oficial!');
    } else {
      setFormFeedback(
        '¡Publicación enviada a revisión! El Administrador/DT la autorizará para que aparezca en el muro.'
      );
    }
    setTimeout(() => setFormFeedback(null), 6000);
  };

  const handleApprovePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: 'approved' as const } : p))
    );
    const postToApprove = posts.find((p) => p.id === postId);
    if (postToApprove && isSupabaseConfigured()) {
      supabaseUpsertPost({ ...postToApprove, status: 'approved' });
    }
    setAuthSuccessToast('¡Publicación autorizada y visible en el muro!');
    setTimeout(() => setAuthSuccessToast(null), 4000);
  };

  const handleRejectPost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (isSupabaseConfigured()) {
      supabaseDeletePost(postId);
    }
    setAuthSuccessToast('Publicación rechazada y eliminada.');
    setTimeout(() => setAuthSuccessToast(null), 4000);
  };

  const handleApproveAll = () => {
    setPosts((prev) =>
      prev.map((p) => (p.status === 'pending' ? { ...p, status: 'approved' as const } : p))
    );
    if (isSupabaseConfigured()) {
      pendingPosts.forEach((p) => {
        supabaseUpsertPost({ ...p, status: 'approved' });
      });
    }
    setAuthSuccessToast(`¡${pendingPosts.length} publicaciones autorizadas con éxito!`);
    setTimeout(() => setAuthSuccessToast(null), 4000);
    setShowAuthModal(false);
  };

  const handleToggleReaction = (
    postId: string,
    reactionType: 'likes' | 'fire' | 'clap' | 'goal'
  ) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const currentReaction = p.reactions.userReactions[currentUser.id];
        const isSame = currentReaction === reactionType;

        const newReactions = { ...p.reactions };
        const updatedUserReactions = { ...p.reactions.userReactions };

        type ReactionNumKey = 'likes' | 'fire' | 'clap' | 'goal';
        if (isSame) {
          // Remove reaction
          const key = reactionType as ReactionNumKey;
          if (key in newReactions) {
            newReactions[key] = Math.max(0, (newReactions[key] || 0) - 1);
          }
          delete updatedUserReactions[currentUser.id];
        } else {
          // Decrement previous if existed
          if (currentReaction && currentReaction in newReactions) {
            const prevKey = currentReaction as ReactionNumKey;
            newReactions[prevKey] = Math.max(0, (newReactions[prevKey] || 0) - 1);
          }
          // Increment new
          const key = reactionType as ReactionNumKey;
          if (key in newReactions) {
            newReactions[key] = (newReactions[key] || 0) + 1;
          }
          updatedUserReactions[currentUser.id] = reactionType;
        }

        return {
          ...p,
          reactions: {
            ...newReactions,
            userReactions: updatedUserReactions,
          },
        };
      })
    );
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const newComment = {
      id: `c_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl,
      authorRole: currentUser.role,
      text,
      createdAt: getCurrentTimestampIso(),
    };

    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== postId) return p;
        const postWithComment = {
          ...p,
          comments: [...p.comments, newComment],
        };
        if (isSupabaseConfigured()) {
          supabaseUpsertPost(postWithComment);
        }
        return postWithComment;
      });
      return updated;
    });

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
  };

  const getRoleBadge = (role: string) => {
    if (role === 'league_admin') {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold border border-purple-300 inline-flex items-center gap-1">
          <Shield className="w-2.5 h-2.5 text-purple-600" /> Oficial de Liga
        </span>
      );
    }
    if (role === 'owner') {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 font-bold border border-amber-300 inline-flex items-center gap-1">
          <Crown className="w-2.5 h-2.5" /> Dueño / DT
        </span>
      );
    }
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-[#1877F2] font-bold border border-blue-200 inline-flex items-center gap-1">
        <User className="w-2.5 h-2.5" /> Jugador
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Card with New Post & Admin Authorization Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#CED0D4] shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#050505] tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#1877F2]" />
            {t.wall.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#65676B] mt-0.5 font-medium">
            Muro de anuncios, celebraciones y comunicados de los integrantes del club
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Admin Authorization Button */}
          {currentUser.role === 'owner' && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="relative inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Autorizar Publicaciones</span>
              {pendingPosts.length > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full bg-white text-amber-800 text-[10px] font-black animate-pulse">
                  {pendingPosts.length}
                </span>
              ) : (
                <span className="text-[10px] opacity-80">(0)</span>
              )}
            </button>
          )}

          {/* New Post Button */}
          <button
            id="btn-new-post"
            onClick={() => setShowNewPostModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t.wall.newPost}
          </button>
        </div>
      </div>

      {/* Action feedback toast */}
      {formFeedback && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#1877F2] shrink-0" />
          <span>{formFeedback}</span>
        </div>
      )}

      {authSuccessToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{authSuccessToast}</span>
        </div>
      )}

      {/* If current user is a player and has pending posts */}
      {currentUser.role === 'player' && myPendingPosts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Tus publicaciones en proceso de autorización ({myPendingPosts.length}):</span>
          </div>
          <div className="space-y-2">
            {myPendingPosts.map((pending) => (
              <div
                key={pending.id}
                className="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-1 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#050505]">{pending.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                    Pendiente de aprobación por DT/Admin
                  </span>
                </div>
                <p className="text-[#65676B] line-clamp-2">{pending.content}</p>
                {pending.imageUrl && (
                  <span className="text-[10px] text-blue-600 font-semibold inline-flex items-center gap-1">
                    {pending.mediaType === 'video' ? <VideoIcon className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                    Multimedia adjunto ({pending.mediaType === 'video' ? 'Video' : 'Foto'})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Feed: Approved Posts */}
      <div className="space-y-5">
        {approvedPosts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#CED0D4] p-8 space-y-2">
            <FileText className="w-10 h-10 text-[#65676B] mx-auto opacity-50" />
            <h3 className="text-sm font-bold text-[#050505]">Aún no hay publicaciones aprobadas</h3>
            <p className="text-xs text-[#65676B]">
              Sé el primero en publicar un anuncio o foto para tu equipo.
            </p>
          </div>
        ) : (
          approvedPosts.map((post) => {
            const userReaction = post.reactions.userReactions[currentUser.id];
            const areCommentsOpen = expandedComments[post.id] ?? false;
            const isVideoMedia =
              post.mediaType === 'video' ||
              post.imageUrl?.startsWith('data:video') ||
              post.imageUrl?.endsWith('.mp4') ||
              post.imageUrl?.endsWith('.webm');

            return (
              <article
                key={post.id}
                id={`wall-post-${post.id}`}
                className="bg-white rounded-2xl border border-[#CED0D4] p-5 space-y-4 shadow-xs transition-all hover:border-[#1877F2]/40"
              >
                {/* Post Author Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorAvatar}
                      alt={post.authorName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-[#CED0D4]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#050505]">
                          {post.authorName}
                        </h4>
                        {getRoleBadge(post.authorRole)}
                      </div>
                      <span className="text-[11px] text-[#65676B] font-medium">
                        {formatDisplayTime(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#F0F2F5] text-[#65676B] font-bold border border-[#CED0D4]/70">
                    {post.category}
                  </span>
                </div>

                {/* Title & Body Content */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#050505] mb-1.5">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#050505] leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {/* Attached Media: Image or Video */}
                {post.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-[#CED0D4] max-h-96 bg-black/5 flex items-center justify-center">
                    {isVideoMedia ? (
                      <video
                        controls
                        playsInline
                        src={post.imageUrl}
                        className="w-full max-h-96 object-contain bg-black rounded-xl"
                      />
                    ) : (
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        referrerPolicy="no-referrer"
                        className="w-full max-h-96 object-cover"
                      />
                    )}
                  </div>
                )}

                {/* Reactions Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-[#CED0D4]/70 gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {/* Like Button */}
                    <button
                      onClick={() => handleToggleReaction(post.id, 'likes')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        userReaction === 'likes'
                          ? 'bg-rose-50 text-rose-600 border border-rose-300'
                          : 'bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#65676B] border border-[#CED0D4]/60'
                      }`}
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          userReaction === 'likes' ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                      <span>{post.reactions.likes}</span>
                    </button>

                    {/* Fire Button */}
                    <button
                      onClick={() => handleToggleReaction(post.id, 'fire')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        userReaction === 'fire'
                          ? 'bg-amber-50 text-amber-700 border border-amber-300'
                          : 'bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#65676B] border border-[#CED0D4]/60'
                      }`}
                    >
                      <Flame
                        className={`w-3.5 h-3.5 ${
                          userReaction === 'fire' ? 'fill-amber-500 text-amber-500' : ''
                        }`}
                      />
                      <span>{post.reactions.fire}</span>
                    </button>

                    {/* Clap Button */}
                    <button
                      onClick={() => handleToggleReaction(post.id, 'clap')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        userReaction === 'clap'
                          ? 'bg-blue-50 text-[#1877F2] border border-[#1877F2]/30'
                          : 'bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#65676B] border border-[#CED0D4]/60'
                      }`}
                    >
                      <span>👏</span>
                      <span>{post.reactions.clap}</span>
                    </button>

                    {/* Goal Button */}
                    <button
                      onClick={() => handleToggleReaction(post.id, 'goal')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        userReaction === 'goal'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#65676B] border border-[#CED0D4]/60'
                      }`}
                    >
                      <span>⚽</span>
                      <span>{post.reactions.goal}</span>
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      setExpandedComments((prev) => ({
                        ...prev,
                        [post.id]: !prev[post.id],
                      }))
                    }
                    className="text-xs text-[#65676B] hover:text-[#050505] font-semibold cursor-pointer"
                  >
                    {post.comments.length} {post.comments.length === 1 ? 'comentario' : 'comentarios'}
                  </button>
                </div>

                {/* Comments Section */}
                {areCommentsOpen && (
                  <div className="pt-3 border-t border-[#CED0D4]/40 space-y-3">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2.5 items-start text-xs">
                        <img
                          src={comment.authorAvatar}
                          alt={comment.authorName}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-[#CED0D4]"
                        />
                        <div className="flex-1 bg-[#F0F2F5] p-2.5 rounded-xl border border-[#CED0D4]/60 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#050505]">
                              {comment.authorName}
                            </span>
                            <span className="text-[10px] text-[#65676B]">
                              {formatDisplayTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-[#050505] leading-relaxed">{comment.text}</p>
                        </div>
                      </div>
                    ))}

                    {/* Comment Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-[#CED0D4]"
                      />
                      <div className="flex-1 flex items-center gap-1 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl px-3 py-1.5">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                          placeholder="Escribe un comentario..."
                          className="w-full bg-transparent text-xs text-[#050505] placeholder-[#65676B] focus:outline-none"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="text-[#1877F2] hover:text-[#0866FF] p-1 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* Modal: Publish New Post (with Image/Video Upload, NO URL input) */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#CED0D4] w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 text-[#050505]">
            <div className="flex items-center justify-between border-b border-[#CED0D4] pb-3">
              <h3 className="text-lg font-black text-[#050505] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#1877F2]" />
                {t.wall.newPost}
              </h3>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {currentUser.role === 'player' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Como jugador, tu publicación será enviada al panel de autorización del DT/Admin antes de aparecer en el muro.
                </span>
              </div>
            )}

            <form onSubmit={handleCreatePost} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#65676B] mb-1">
                  Título del Mensaje *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="ej. Confirmación de asistencia o festejo"
                  className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-[#050505] text-sm font-medium focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#65676B] mb-1">
                  Categoría
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as Post['category'])}
                  className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-[#050505] text-sm font-medium focus:outline-none focus:border-[#1877F2]"
                >
                  <option value="Anuncio">Anuncio Oficial</option>
                  <option value="Partido">Partido</option>
                  <option value="Entrenamiento">Entrenamiento</option>
                  <option value="Celebración">Celebración</option>
                  <option value="Liga">Comunicado de la Liga</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#65676B] mb-1">
                  Contenido *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Escribe el mensaje para el equipo..."
                  className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-[#050505] text-xs font-medium focus:outline-none focus:border-[#1877F2] resize-none"
                />
              </div>

              {/* Botón para agregar Imagen o Video (Quita el input de URL) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#65676B] mb-1.5">
                  Foto o Video Adjunto
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,video/*"
                  onChange={handleMediaFileSelect}
                  className="hidden"
                />

                {!attachedMediaUrl ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] border border-[#CED0D4] text-xs font-bold text-[#050505] transition-all cursor-pointer shadow-xs"
                    >
                      <ImageIcon className="w-4 h-4 text-[#1877F2]" />
                      <VideoIcon className="w-4 h-4 text-purple-600" />
                      <span>Agregar Foto o Video desde tu Dispositivo</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-[#F0F2F5] rounded-xl border border-[#CED0D4] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#050505] flex items-center gap-1.5 truncate max-w-xs">
                        {attachedMediaType === 'video' ? (
                          <VideoIcon className="w-4 h-4 text-purple-600" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-[#1877F2]" />
                        )}
                        <span>{attachedMediaName || (attachedMediaType === 'video' ? 'Video adjunto' : 'Foto adjunta')}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveAttachedMedia}
                        className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar</span>
                      </button>
                    </div>

                    <div className="rounded-lg overflow-hidden border border-[#CED0D4] max-h-48 bg-black/5 flex items-center justify-center">
                      {attachedMediaType === 'video' ? (
                        <video
                          controls
                          playsInline
                          src={attachedMediaUrl}
                          className="max-h-48 w-full object-contain bg-black"
                        />
                      ) : (
                        <img
                          src={attachedMediaUrl}
                          alt="Vista previa"
                          className="max-h-48 w-full object-cover"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#CED0D4]">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] border border-[#CED0D4] text-[#050505] text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>{currentUser.role === 'owner' ? 'Publicar Directo' : 'Enviar a Aprobación'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Panel de Autorización de Publicaciones (Admin / DT) con Vista Previa */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#CED0D4] w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-4 text-[#050505] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#CED0D4] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#050505]">
                    Autorización de Publicaciones de Jugadores
                  </h3>
                  <p className="text-xs text-[#65676B]">
                    Revisa con vista previa completa y autoriza qué contenido se publicará en el muro oficial
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {pendingPosts.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-[#050505]">
                    ¡Todo al día! No hay publicaciones pendientes
                  </h4>
                  <p className="text-xs text-[#65676B]">
                    Todas las publicaciones de jugadores han sido revisadas y autorizadas.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs">
                    <span className="font-bold text-amber-900">
                      Tienes {pendingPosts.length} publicación(es) esperando tu visto bueno
                    </span>
                    {pendingPosts.length > 1 && (
                      <button
                        onClick={handleApproveAll}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                      >
                        Aprobar Todas ({pendingPosts.length})
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {pendingPosts.map((post) => {
                      const isVideoMedia =
                        post.mediaType === 'video' ||
                        post.imageUrl?.startsWith('data:video') ||
                        post.imageUrl?.endsWith('.mp4');

                      return (
                        <div
                          key={post.id}
                          className="bg-[#F0F2F5] rounded-xl p-4 border border-[#CED0D4] space-y-3"
                        >
                          {/* Author header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={post.authorAvatar}
                                alt={post.authorName}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-full object-cover ring-1 ring-[#CED0D4]"
                              />
                              <div>
                                <span className="font-bold text-xs text-[#050505] block">
                                  {post.authorName}
                                </span>
                                <span className="text-[10px] text-[#65676B]">
                                  {post.createdAt} • Categoría: <span className="font-semibold text-blue-600">{post.category}</span>
                                </span>
                              </div>
                            </div>

                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Pendiente
                            </span>
                          </div>

                          {/* Post Content */}
                          <div className="bg-white p-3 rounded-xl border border-[#CED0D4]/70 space-y-2">
                            <h4 className="font-black text-sm text-[#050505]">
                              {post.title}
                            </h4>
                            <p className="text-xs text-[#050505] leading-relaxed whitespace-pre-wrap">
                              {post.content}
                            </p>

                            {/* Attached Preview */}
                            {post.imageUrl && (
                              <div className="rounded-lg overflow-hidden border border-[#CED0D4] max-h-56 bg-black/5 flex items-center justify-center">
                                {isVideoMedia ? (
                                  <video
                                    controls
                                    playsInline
                                    src={post.imageUrl}
                                    className="max-h-56 w-full object-contain bg-black"
                                  />
                                ) : (
                                  <img
                                    src={post.imageUrl}
                                    alt="Vista previa adjunta"
                                    className="max-h-56 w-full object-cover"
                                  />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Approval Actions */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => handleRejectPost(post.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Rechazar</span>
                            </button>
                            <button
                              onClick={() => handleApprovePost(post.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>✓ Aprobar y Publicar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-[#CED0D4] flex justify-end">
              <button
                onClick={() => setShowAuthModal(false)}
                className="px-4 py-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] text-xs font-bold cursor-pointer"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
