import React, { useState, useRef } from 'react';
import {
  Plus,
  Sparkles,
  Trophy,
  Flame,
  Award,
  Shield,
  Camera,
  Upload,
  Image as ImageIcon,
  Check,
  X,
} from 'lucide-react';
import { AppUser, ClubStory } from '../types';
import { StoryViewerModal } from './StoryViewerModal';

interface StoriesReelProps {
  stories: ClubStory[];
  setStories: React.Dispatch<React.SetStateAction<ClubStory[]>>;
  currentUser: AppUser;
  onOpenQuickShare?: () => void;
}

export const StoriesReel: React.FC<StoriesReelProps> = ({
  stories,
  setStories,
  currentUser,
  onOpenQuickShare,
}) => {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newType, setNewType] = useState<ClubStory['type']>('custom');
  const [newImage, setNewImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenStory = (index: number) => {
    setSelectedStoryIndex(index);
  };

  const handleLikeStory = (storyId: string) => {
    setStories((prev) =>
      prev.map((s) => {
        if (s.id !== storyId) return s;
        const alreadyLiked = s.likedByUserIds?.includes(currentUser.id);
        const updatedLiked = alreadyLiked
          ? s.likedByUserIds.filter((id) => id !== currentUser.id)
          : [...(s.likedByUserIds || []), currentUser.id];

        return {
          ...s,
          likesCount: Math.max(0, s.likesCount + (alreadyLiked ? -1 : 1)),
          likedByUserIds: updatedLiked,
        };
      })
    );
  };

  const handleDeleteStory = (storyId: string) => {
    setStories((prev) => prev.filter((s) => s.id !== storyId));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (res) {
        setNewImage(res);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreateCustomStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImage || !newTitle.trim()) return;

    const newStory: ClubStory = {
      id: `story_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorUsername: currentUser.username || currentUser.name.split(' ')[0].toLowerCase(),
      authorAvatar: currentUser.avatarUrl,
      authorRole: currentUser.role,
      type: newType,
      title: newTitle.trim(),
      caption: newCaption.trim() || undefined,
      imageUrl: newImage,
      createdAt: Date.now(),
      likesCount: 0,
      likedByUserIds: [],
    };

    setStories([newStory, ...stories]);
    setShowAddStoryModal(false);
    setNewTitle('');
    setNewCaption('');
    setNewImage('');
  };

  // Find if current user already has active stories
  const userStories = stories.filter((s) => s.authorId === currentUser.id);

  return (
    <>
      <div className="bg-white dark:bg-[#1E1F24] rounded-2xl border border-[#CED0D4] dark:border-white/10 p-3 sm:p-4 shadow-xs overflow-hidden transition-colors">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#050505] dark:text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Historias del Club</span>
            </h3>
            <span className="text-[10px] text-[#65676B] dark:text-gray-400 font-medium">
              (Fotos de goleo, tabla y MVP)
            </span>
          </div>

          <span className="text-[11px] text-[#1877F2] dark:text-[#60A5FA] font-bold">
            {stories.length} activas
          </span>
        </div>

        {/* Horizontal Carousel */}
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-1.5 pt-1 scrollbar-none">
          
          {/* USER'S OWN STORY SLOT */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (userStories.length > 0) {
                    const firstUserIndex = stories.findIndex((s) => s.authorId === currentUser.id);
                    if (firstUserIndex !== -1) handleOpenStory(firstUserIndex);
                  } else {
                    setShowAddStoryModal(true);
                  }
                }}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 cursor-pointer transition-transform hover:scale-105 ${
                  userStories.length > 0
                    ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600'
                    : 'bg-gray-200 dark:bg-white/10'
                }`}
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover border-2 border-white dark:border-[#1E1F24] bg-white"
                />
              </button>

              {/* Add Story (+) button badge */}
              <button
                type="button"
                onClick={() => setShowAddStoryModal(true)}
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#1877F2] hover:bg-[#0866FF] text-white flex items-center justify-center border-2 border-white dark:border-[#1E1F24] shadow-xs cursor-pointer"
                title="Añadir nueva historia"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] font-bold text-[#050505] dark:text-gray-200 truncate max-w-[64px]">
              Tu historia
            </span>
          </div>

          {/* OTHER STORIES */}
          {stories.map((story, index) => {
            const isScorers = story.type === 'scorers';
            const isStandings = story.type === 'standings';
            const isMvp = story.type === 'mvp';

            const ringGradient = isMvp
              ? 'from-amber-400 via-yellow-500 to-amber-600'
              : isScorers
              ? 'from-emerald-400 via-teal-500 to-green-600'
              : isStandings
              ? 'from-blue-500 via-indigo-600 to-cyan-500'
              : 'from-rose-500 via-fuchsia-500 to-indigo-500';

            return (
              <div
                key={story.id}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => handleOpenStory(index)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr ${ringGradient} cursor-pointer transition-transform hover:scale-105 shadow-xs`}
                  >
                    <img
                      src={story.authorAvatar}
                      alt={story.authorName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full rounded-full object-cover border-2 border-white dark:border-[#1E1F24] bg-black"
                    />
                  </button>

                  {/* Category icon badge */}
                  <span className="absolute -bottom-0.5 -right-0.5 text-[9px] w-4.5 h-4.5 rounded-full bg-black/80 text-white flex items-center justify-center border border-white/50">
                    {isMvp ? '⭐' : isScorers ? '⚽' : isStandings ? '📊' : '📸'}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#050505] dark:text-gray-300 truncate max-w-[68px]">
                  {story.authorUsername ? `@${story.authorUsername}` : story.authorName.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULLSCREEN STORY VIEWER MODAL */}
      {selectedStoryIndex !== null && (
        <StoryViewerModal
          isOpen={selectedStoryIndex !== null}
          onClose={() => setSelectedStoryIndex(null)}
          stories={stories}
          initialStoryIndex={selectedStoryIndex}
          currentUser={currentUser}
          onLikeStory={handleLikeStory}
          onDeleteStory={handleDeleteStory}
        />
      )}

      {/* ADD NEW STORY MODAL */}
      {showAddStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E1F24] border border-[#CED0D4] dark:border-white/10 w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 text-[#050505] dark:text-white">
            <div className="flex items-center justify-between pb-2 border-b border-[#CED0D4] dark:border-white/10">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#1877F2]" />
                <h4 className="font-black text-sm text-[#050505] dark:text-white">
                  Publicar en mis Historias
                </h4>
              </div>
              <button
                onClick={() => setShowAddStoryModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomStory} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#65676B] dark:text-gray-400 mb-1">
                  Título de la Historia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. ¡Victoria del equipo! / Gol de tiro libre"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F0F2F5] dark:bg-white/5 border border-[#CED0D4] dark:border-white/10 rounded-xl font-bold focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#65676B] dark:text-gray-400 mb-1">
                  Pie de foto o Comentario
                </label>
                <textarea
                  rows={2}
                  placeholder="Escribe un mensaje para tus compañeros de equipo..."
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F0F2F5] dark:bg-white/5 border border-[#CED0D4] dark:border-white/10 rounded-xl focus:outline-none focus:border-[#1877F2] resize-none"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-[11px] font-bold text-[#65676B] dark:text-gray-400 mb-1">
                  Foto de la Historia *
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {newImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-[#CED0D4] dark:border-white/10 h-44 bg-black">
                    <img
                      src={newImage}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setNewImage('')}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-[#CED0D4] dark:border-white/20 hover:border-[#1877F2] bg-[#F0F2F5] dark:bg-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Upload className="w-6 h-6 text-[#1877F2]" />
                    <span className="font-bold text-xs text-[#050505] dark:text-white">
                      Subir foto desde tu celular o PC
                    </span>
                    <span className="text-[10px] text-[#65676B] dark:text-gray-400">
                      Formatos JPG, PNG, WebP
                    </span>
                  </button>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStoryModal(false)}
                  className="px-4 py-2 rounded-xl text-[#65676B] dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newImage || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Publicar Historia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
