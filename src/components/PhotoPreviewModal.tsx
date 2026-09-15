import React, { useState } from 'react';
import { Download, ExternalLink, Copy, Check, X, Sparkles } from 'lucide-react';
import { triggerBrowserFileDownload } from '../utils/graphicPresets';
import { copyImageToClipboard } from '../utils/lineupPosterGenerator';

export interface PhotoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  imageUrl: string;
  blob?: Blob | null;
  fileName: string;
}

export const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle = 'Foto oficial en alta definición lista para guardar o compartir',
  imageUrl,
  blob,
  fileName,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const dummyBlob = blob || new Blob([], { type: 'image/png' });
    triggerBrowserFileDownload(dummyBlob, imageUrl, fileName);
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 3000);
  };

  const handleOpenInNewTab = () => {
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    if (blob) {
      const ok = await copyImageToClipboard(blob);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#18191A] text-white rounded-3xl border border-white/10 shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#242526]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shadow-md text-black shrink-0 font-bold">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-amber-400 border border-amber-400/30">
                  HD
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: High Definition Image Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center">
          <div className="relative max-w-full max-h-[56vh] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black/60 flex items-center justify-center">
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-[56vh] object-contain rounded-2xl"
            />
            <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/40 text-[10px] font-black text-emerald-400 flex items-center gap-1 shadow-lg">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Foto Generada</span>
            </div>
          </div>

          {/* Direct User-Initiated Action Buttons */}
          <div className="w-full mt-4 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-98 cursor-pointer"
              >
                <Download className="w-4 h-4 text-black" />
                <span>{isDownloaded ? '¡Descargada!' : 'Descargar Archivo'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/15 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-blue-400" />
                <span>Abrir en Pestaña</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/15 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span>{copied ? '¡Foto Copiada!' : 'Copiar Imagen'}</span>
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
              <p className="text-[11px] text-gray-300 leading-tight">
                💡 <strong>¿En teléfono o tablet?</strong> Mantén presionada la imagen arriba y selecciona <strong>"Guardar en Fotos"</strong> o <strong>"Descargar imagen"</strong> para guardarla de inmediato en tu galería.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
