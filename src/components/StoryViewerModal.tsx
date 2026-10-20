import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  Heart,
  Share2,
  Download,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { AppUser, ClubStory } from '../types';

interface StoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: ClubStory[];
  initialStoryIndex: number;
  currentUser: AppUser;
  onLikeStory: (storyId: string) => void;
  onDeleteStory?: (storyId: string) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  onClose,
  stories,
  initialStoryIndex,
  currentUser,
  onLikeStory,
  onDeleteStory,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialStoryIndex);
    setProgress(0);
  }, [initialStoryIndex]);

  const currentStory = stories[currentIndex];

  // 6 second timer per story
  useEffect(() => {
    if (!isOpen || !currentStory || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((idx) => idx + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2; // increments every 120ms (approx 6s total)
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isOpen, currentIndex, stories.length, isPaused, currentStory]);

  if (!isOpen || !currentStory) return null;

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const hasLiked = currentStory.likedByUserIds?.includes(currentUser.id);

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentStory.title,
          text: `${currentStory.title} compartida por @${currentStory.authorUsername || currentStory.authorName} en Dream Team`,
          url: window.location.href,
        });
      } catch {
        // cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('¡Enlace de la historia copiado al portapapeles!');
    }
  };

  const getStoryTypeBadge = (type: ClubStory['type']) => {
    switch (type) {
      case 'scorers':
        return { label: '⚽ Goleadores', bg: 'bg-emerald-500' };
      case 'standings':
        return { label: '📊 Tabla General', bg: 'bg-blue-600' };
      case 'mvp':
        return { label: '🌟 Jugador MVP', bg: 'bg-amber-500' };
      case 'lineup':
        return { label: '📋 Alineación Oficial', bg: 'bg-purple-600' };
      default:
        return { label: '📸 Historia de Club', bg: 'bg-[#1877F2]' };
    }
  };

  const badge = getStoryTypeBadge(currentStory.type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div className="relative w-full max-w-md h-[92vh] max-h-[820px] bg-[#121316] rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white border border-white/10">
        
        {/* Top Progress Bars (like Instagram Stories) */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {stories.map((s, idx) => (
            <div
              key={s.id}
              className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <img
              src={currentStory.authorAvatar}
              alt={currentStory.authorName}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white/80 shadow-md bg-black"
            />
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white text-sm">
                  {currentStory.authorName}
                </span>
                {currentStory.authorUsername && (
                  <span className="text-[11px] text-gray-300 font-mono">
                    @{currentStory.authorUsername}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[9px] font-black uppercase tracking-wider text-white px-2 py-0.5 rounded-full ${badge.bg}`}
                >
                  {badge.label}
                </span>
                <span className="text-[10px] text-gray-300 font-medium">
                  {new Date(currentStory.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(currentStory.authorId === currentUser.id || currentUser.role === 'owner') && onDeleteStory && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteStory(currentStory.id);
                  onClose();
                }}
                className="p-1.5 rounded-full bg-black/40 hover:bg-rose-600/80 text-white transition-colors cursor-pointer"
                title="Eliminar mi historia"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Story Media (Image) */}
        <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
          <img
            src={currentStory.imageUrl}
            alt={currentStory.title}
            className="w-full h-full object-contain"
          />

          {/* Left / Right touch zones for previous/next */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-0 top-16 bottom-20 w-1/3 z-20 opacity-0 hover:opacity-100 flex items-center justify-start pl-3 text-white/50 hover:text-white transition-opacity cursor-pointer"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-0 top-16 bottom-20 w-1/3 z-20 opacity-0 hover:opacity-100 flex items-center justify-end pr-3 text-white/50 hover:text-white transition-opacity cursor-pointer"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        {/* Story Caption and Footer Overlay */}
        <div className="p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-30 space-y-3">
          <div className="space-y-1">
            <h4 className="font-black text-sm text-white">
              {currentStory.title}
            </h4>
            {currentStory.caption && (
              <p className="text-xs text-gray-200 leading-relaxed">
                {currentStory.caption}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            {/* Reaction Heart Button */}
            <button
              type="button"
              onClick={() => onLikeStory(currentStory.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-transform active:scale-90 cursor-pointer ${
                hasLiked
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${hasLiked ? 'fill-white' : ''}`}
              />
              <span>{currentStory.likesCount || 0}</span>
            </button>

            {/* Actions: Download */}
            <div className="flex items-center gap-2">
              <a
                href={currentStory.imageUrl}
                download={`historia_${currentStory.type}.jpg`}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                title="Descargar imagen"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
