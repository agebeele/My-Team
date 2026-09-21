import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Shield, Zap } from 'lucide-react';
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 500); // Give time for exit animation
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onComplete]);

  const handleSkip = () => {
    setVisible(false);
    setTimeout(onComplete, 200);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          onClick={handleSkip}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1528] via-[#0F1E36] to-[#08101E] text-white select-none cursor-pointer overflow-hidden"
        >
          {/* Ambient stadium lights background glow */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute w-96 h-96 rounded-full bg-[#1877F2]/25 blur-3xl pointer-events-none"
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-10 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none"
          />

          {/* Central Animated Badge & Logo */}
          <div className="relative z-10 flex flex-col items-center text-center px-6">
            <motion.div
              initial={{ scale: 0.4, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: 0.1,
              }}
              className="relative"
            >
              {/* Outer glowing ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-amber-400 via-[#1877F2] to-amber-400 opacity-60 blur-xs"
              />

              {/* Logo Frame */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-b from-white/30 to-white/5 backdrop-blur-md shadow-2xl border border-white/20 flex items-center justify-center overflow-hidden">
                <img
                  src={APP_LOGO_URL}
                  alt={APP_NAME}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>

              {/* Floating Champion Badge */}
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-[10px] tracking-wider uppercase shadow-lg border border-amber-300 flex items-center gap-1 whitespace-nowrap"
              >
                <Trophy className="w-3 h-3 text-black" />
                <span>FUT 7 ÉLITE</span>
              </motion.div>
            </motion.div>

            {/* App Title Animation */}
            <motion.div
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-7 space-y-1.5"
            >
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent drop-shadow-md">
                {APP_NAME}
              </h1>
              <p className="text-xs sm:text-sm font-semibold tracking-wide text-blue-200/90 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{APP_TAGLINE}</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </p>

              {teamName && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="pt-2 text-[11px] font-medium text-slate-400"
                >
                  Cargando club: <span className="text-white font-bold">{teamName}</span>
                </motion.div>
              )}
            </motion.div>

            {/* Progress / Kickoff indicator */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 140, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.9, ease: 'easeOut' }}
              className="mt-6 h-1 rounded-full bg-gradient-to-r from-[#1877F2] via-amber-400 to-[#1877F2] overflow-hidden"
            >
              <motion.div
                animate={{ x: [-140, 140] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-full bg-white/80 rounded-full blur-xs"
              />
            </motion.div>

            {/* Click to skip hint */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ delay: 0.8, duration: 1.5, repeat: Infinity }}
              className="mt-4 text-[10px] text-slate-400 font-medium tracking-wider uppercase"
            >
              Toca para continuar
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
