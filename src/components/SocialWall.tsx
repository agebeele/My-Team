import React, { useState } from 'react';
import {
  MessageSquare,
  Heart,
  Flame,
  ThumbsUp,
  Send,
  Plus,
  Crown,
  Shield,
  User,
  Sparkles,
  Tag,
  Share2,
} from 'lucide-react';
import { Post, AppUser, Language } from '../types';
import { getT } from '../utils/translations';

interface SocialWallProps {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  currentUser: AppUser;
  language: Language;
}

export const SocialWall: React.FC<SocialWallProps> = ({
  posts,
  setPosts,
  currentUser,
  language,
}) => {
  const t = getT(language);

  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<Post['category']>('Anuncio');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Comment inputs mapped by post id
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({
    post_01: true,
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const post: Post = {
      id: `post_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl,
      authorRole: currentUser.role,
      category: newCategory,
      title: newTitle,
      content: newContent,
      imageUrl: newImageUrl || undefined,
      createdAt: 'Justo ahora',
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
    setShowNewPostModal(false);
    setNewTitle('');
    setNewContent('');
    setNewImageUrl('');
  };

  const handleToggleReaction = (postId: string, reactionType: 'likes' | 'fire' | 'clap' | 'goal') => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        const currentReaction = p.reactions.userReactions[currentUser.id];
        const isSame = currentReaction === reactionType;

        const newReactions = { ...p.reactions };
        const updatedUserReactions = { ...p.reactions.userReactions };

        if (isSame) {
          // Remove reaction
          newReactions[reactionType] = Math.max(0, newReactions[reactionType] - 1);
          delete updatedUserReactions[currentUser.id];
        } else {
          // Decrement previous if existed
          if (currentReaction && currentReaction in newReactions) {
            newReactions[currentReaction as keyof typeof newReactions] = Math.max(
              0,
              (newReactions[currentReaction as keyof typeof newReactions] as number) - 1
            );
          }
          // Increment new
          newReactions[reactionType] = ((newReactions[reactionType] as number) || 0) + 1;
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

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: `c_${Date.now()}`,
              authorId: currentUser.id,
              authorName: currentUser.name,
              authorAvatar: currentUser.avatarUrl,
              authorRole: currentUser.role,
              text,
              createdAt: 'Hace un momento',
            },
          ],
        };
      })
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
  };

  const getRoleBadge = (role: string) => {
    if (role === 'owner') {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 inline-flex items-center gap-1">
          <Crown className="w-2.5 h-2.5" /> Dueño
        </span>
      );
    }
    if (role === 'admin') {
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 inline-flex items-center gap-1">
          <Shield className="w-2.5 h-2.5" /> Admin
        </span>
      );
    }
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 inline-flex items-center gap-1">
        <User className="w-2.5 h-2.5" /> Jugador
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#141416] p-5 rounded-xl border border-white/5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-400" />
            {t.wall.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            {t.wall.subtitle}
          </p>
        </div>

        <button
          id="btn-new-post"
          onClick={() => setShowNewPostModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t.wall.newPost}
        </button>
      </div>

      {/* Posts Feed */}
      <div className="space-y-5">
        {posts.map((post) => {
          const userReaction = post.reactions.userReactions[currentUser.id];
          const areCommentsOpen = expandedComments[post.id] ?? false;

          return (
            <article
              key={post.id}
              id={`wall-post-${post.id}`}
              className="bg-[#141416] rounded-xl border border-white/5 p-5 space-y-4 transition-all hover:border-white/10"
            >
              {/* Post Author Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">
                        {post.authorName}
                      </h4>
                      {getRoleBadge(post.authorRole)}
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {post.createdAt}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 text-gray-300 font-medium border border-white/10">
                  {post.category}
                </span>
              </div>

              {/* Title & Body Content */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
                  {post.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              {/* Attached Image if any */}
              {post.imageUrl && (
                <div className="rounded-lg overflow-hidden border border-white/10 max-h-96">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Reactions Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5 gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {/* Like Button */}
                  <button
                    onClick={() => handleToggleReaction(post.id, 'likes')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      userReaction === 'likes'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-black/40 hover:bg-white/5 text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${userReaction === 'likes' ? 'fill-rose-400 text-rose-400' : ''}`} />
                    <span>{post.reactions.likes}</span>
                  </button>

                  {/* Fire Button */}
                  <button
                    onClick={() => handleToggleReaction(post.id, 'fire')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      userReaction === 'fire'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-black/40 hover:bg-white/5 text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <Flame className={`w-3.5 h-3.5 ${userReaction === 'fire' ? 'fill-amber-400 text-amber-400' : ''}`} />
                    <span>{post.reactions.fire}</span>
                  </button>

                  {/* Clap Button */}
                  <button
                    onClick={() => handleToggleReaction(post.id, 'clap')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      userReaction === 'clap'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-black/40 hover:bg-white/5 text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <span>👏</span>
                    <span>{post.reactions.clap}</span>
                  </button>

                  {/* Goal Button */}
                  <button
                    onClick={() => handleToggleReaction(post.id, 'goal')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      userReaction === 'goal'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-black/40 hover:bg-white/5 text-gray-400 hover:text-white border border-white/5'
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
                      [post.id]: !areCommentsOpen,
                    }))
                  }
                  className="text-xs text-gray-400 hover:text-emerald-400 font-semibold transition-colors flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {post.comments.length} {t.wall.comments}
                </button>
              </div>

              {/* Comments Section */}
              {areCommentsOpen && (
                <div className="pt-3 border-t border-white/5 space-y-3">
                  {/* Comments List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {post.comments.length === 0 ? (
                      <p className="text-xs text-gray-500 italic py-1">
                        Sé el primero en comentar...
                      </p>
                    ) : (
                      post.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs"
                        >
                          <img
                            src={comment.authorAvatar}
                            alt={comment.authorName}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover mt-0.5 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-white">
                                {comment.authorName}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {comment.createdAt}
                              </span>
                            </div>
                            <p className="text-gray-300 mt-0.5">
                              {comment.text}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder={t.wall.writeComment}
                      value={commentInputs[post.id] || ''}
                      onChange={(e) =>
                        setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddComment(post.id);
                      }}
                      className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition-all font-bold"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Modal: Publish New Post */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141416] border border-white/10 w-full max-w-lg rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              {t.wall.newPost}
            </h3>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Título del Anuncio
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="ej. Horario de entrenamiento especial"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Categoría
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as Post['category'])}
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="Anuncio">Anuncio Oficial</option>
                  <option value="Partido">Partido</option>
                  <option value="Entrenamiento">Entrenamiento</option>
                  <option value="Celebración">Celebración</option>
                  <option value="Liga">Comunicado de la Liga</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Contenido
                </label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={t.wall.placeholder}
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  URL de Imagen (Opcional)
                </label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-sm"
                >
                  {t.wall.publish}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
