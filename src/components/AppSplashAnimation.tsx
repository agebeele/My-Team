import React, { useEffect, useState } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { APP_NAME, APP_LOGO_URL, APP_TAGLINE } from '../assets/branding';

interface AppSplashAnimationProps {
  onComplete: () => void;
  teamName?: string;
  minDurationMs?: number;
}

export const AppSplashAnimation: React.FC<AppSplashAnimationProps> = ({
  onComplete,
  teamName,
  minDurationMs = 1800,
}) => {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 400);
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onComplete]);

  const handleSkip = () => {
    setFadingOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 150);
  };

  if (!visible) return null;

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1528] via-[#0F1E36] to-[#08101E] text-white select-none cursor-pointer overflow-hidden transition-all duration-400 ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute w-96 h-96 rounded-full bg-[#1877F2]/25 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-10 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none animate-pulse" />

      {/* Central Badge & Logo */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className="relative transform transition-transform duration-500 hover:scale-105">
          {/* Outer glowing ring */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-amber-400 via-[#1877F2] to-amber-400 opacity-60 blur-xs animate-spin" style={{ animationDuration: '10s' }} />

          {/* Logo Frame */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-b from-white/30 to-white/5 backdrop-blur-md shadow-2xl border border-white/20 flex items-center justify-center overflow-hidden">
            <img
              src={APP_LOGO_URL || '/icon-192.jpg'}
              alt={APP_NAME}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/icon-192.jpg';
              }}
            />
          </div>

          {/* Floating Champion Badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-[10px] tracking-wider uppercase shadow-lg border border-amber-300 flex items-center gap-1 whitespace-nowrap">
            <Trophy className="w-3 h-3 text-black" />
            <span>FUT 7 ÉLITE</span>
          </div>
        </div>

        {/* App Title */}
        <div className="mt-7 space-y-1.5 animate-in fade-in zoom-in-95 duration-500">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent drop-shadow-md">
            {APP_NAME}
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-blue-200/90 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{APP_TAGLINE}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </p>

          {teamName && (
            <div className="pt-2 text-[11px] font-medium text-slate-400">
              Cargando club: <span className="text-white font-bold">{teamName}</span>
            </div>
          )}
        </div>

        {/* Progress / Kickoff indicator */}
        <div className="mt-6 w-36 h-1 rounded-full bg-white/10 overflow-hidden relative">
          <div className="w-16 h-full bg-gradient-to-r from-transparent via-[#1877F2] to-amber-400 rounded-full animate-bounce" />
        </div>

        {/* Click to skip hint */}
        <span className="mt-4 text-[10px] text-slate-400 font-medium tracking-wider uppercase opacity-75">
          Toca para continuar
        </span>
      </div>
    </div>
  );
};
