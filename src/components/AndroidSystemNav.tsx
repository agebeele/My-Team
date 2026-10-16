import React, { useState } from 'react';
import { ChevronLeft, Circle, Square } from 'lucide-react';

interface AndroidSystemNavProps {
  onBack?: () => void;
  onHome?: () => void;
  onOverview?: () => void;
}

export const AndroidSystemNav: React.FC<AndroidSystemNavProps> = ({
  onBack,
  onHome,
  onOverview,
}) => {
  const [navMode, setNavMode] = useState<'buttons' | 'gesture'>('buttons');

  return (
    <div className="w-full bg-[#0B132B] dark:bg-black text-gray-400 border-t border-white/5 py-1 select-none z-30 transition-colors">
      {navMode === 'buttons' ? (
        <div className="max-w-md mx-auto flex items-center justify-around h-7 px-8">
          {/* Back Button (Triangle / Chevron) */}
          <button
            onClick={onBack}
            className="w-10 h-7 flex items-center justify-center hover:text-white active:scale-90 transition-transform cursor-pointer"
            title="Atrás (Android Back)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Home Button (Circle) */}
          <button
            onClick={onHome}
            className="w-10 h-7 flex items-center justify-center hover:text-white active:scale-90 transition-transform cursor-pointer"
            title="Inicio (Android Home)"
          >
            <Circle className="w-4 h-4 fill-current opacity-70 hover:opacity-100" />
          </button>

          {/* Recents Button (Square) */}
          <button
            onClick={onOverview}
            className="w-10 h-7 flex items-center justify-center hover:text-white active:scale-90 transition-transform cursor-pointer"
            title="Panel de Tareas / Android USB"
          >
            <Square className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center py-1">
          <div
            onClick={onHome}
            className="w-32 h-1 bg-gray-400 dark:bg-gray-500 rounded-full cursor-pointer hover:bg-white transition-colors"
            title="Barra de gestos Android (Toca para ir a Inicio)"
          />
        </div>
      )}
    </div>
  );
};
