import React, { useEffect, useState } from 'react';
import { X, Download, Instagram, Sparkles, RefreshCw, RectangleVertical, Square } from 'lucide-react';
import { Match, Player, TeamInfo } from '../types';
import { FlyerFormat, FlyerMode, renderInstagramFlyerCanvas } from '../utils/instagramFlyerGenerator';
import { downloadCanvasOrBlob, triggerBrowserFileDownload } from '../utils/graphicPresets';

interface InstagramFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: FlyerMode;
  team: TeamInfo;
  match?: Match;
  mvpPlayer?: Player;
  fanMvpVotesCount?: number;
}

export const InstagramFlyerModal: React.FC<InstagramFlyerModalProps> = ({
  isOpen,
  onClose,
  mode,
  team,
  match,
  mvpPlayer,
  fanMvpVotesCount = 0,
}) => {
  const [format, setFormat] = useState<FlyerFormat>('story');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [exportBlob, setExportBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const generate = async () => {
      setIsGenerating(true);
      try {
        const canvas = await renderInstagramFlyerCanvas({
          format,
          mode,
          team,
          match,
          mvpPlayer,
          fanMvpVotesCount,
        });
        const exported = await downloadCanvasOrBlob(canvas, 'preview.png', false);
        if (active && exported) {
          setPreviewUrl(exported.dataUrl || exported.blobUrl);
          setExportBlob(exported.blob);
        }
      } finally {
        if (active) setIsGenerating(false);
      }
    };

    generate();
    return () => {
      active = false;
    };
  }, [isOpen, format, mode, team, match, mvpPlayer, fanMvpVotesCount]);

  if (!isOpen) return null;

  const cleanTeam = (team.shortName || team.name || 'club').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const modeSlug = mode === 'matchday' ? 'matchday' : mode === 'result' ? 'resultado' : 'mvp_aficion';
  const fileName = `flyer_ig_${cleanTeam}_${modeSlug}_${format}.png`;

  const handleDownload = () => {
    if (!previewUrl) return;
    const blob = exportBlob || new Blob([], { type: 'image/png' });
    triggerBrowserFileDownload(blob, previewUrl, fileName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#CED0D4] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#CED0D4] flex items-center justify-between bg-gradient-to-r from-fuchsia-500/10 via-rose-500/10 to-amber-500/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#050505] flex items-center gap-1.5">
                <span>Generador de Flyer para Instagram</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h3>
              <p className="text-xs text-[#65676B] font-medium">
                {mode === 'matchday'
                  ? 'Arte oficial Matchday (Próximo Partido)'
                  : mode === 'result'
                  ? 'Arte oficial Resultado Final'
                  : 'Arte ganador MVP de la Afición'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Switcher */}
        <div className="px-4 sm:px-5 pt-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-[#F0F2F5] p-1 rounded-xl border border-[#CED0D4]">
            <button
              type="button"
              onClick={() => setFormat('story')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                format === 'story' ? 'bg-white text-[#1877F2] shadow-xs' : 'text-[#65676B]'
              }`}
            >
              <RectangleVertical className="w-3.5 h-3.5" />
              <span>Story (9:16 • 1080×1920)</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat('post')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                format === 'post' ? 'bg-white text-[#1877F2] shadow-xs' : 'text-[#65676B]'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Post Feed (4:5 • 1080×1350)</span>
            </button>
          </div>

          <span className="text-[11px] font-bold text-[#65676B]">
            Listo para descargar en PNG HD
          </span>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex items-center justify-center bg-[#0B1120]/5">
          {isGenerating || !previewUrl ? (
            <div className="py-16 text-center space-y-2">
              <RefreshCw className="w-8 h-8 text-[#1877F2] animate-spin mx-auto" />
              <p className="text-xs font-bold text-[#65676B]">Renderizando diseño oficial...</p>
            </div>
          ) : (
            <img
              src={previewUrl}
              alt="Flyer Instagram"
              className={`rounded-2xl shadow-xl border border-[#CED0D4] object-contain ${
                format === 'story' ? 'max-h-[54vh]' : 'max-h-[52vh]'
              }`}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F0F2F5] border-t border-[#CED0D4] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#65676B] hover:bg-[#E4E6EB] cursor-pointer"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating || !previewUrl}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-rose-600 to-amber-500 hover:opacity-95 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Flyer PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
