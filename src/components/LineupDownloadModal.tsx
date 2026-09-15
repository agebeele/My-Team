import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Share2,
  X,
  Sparkles,
  Shield,
  Palette,
  Image as ImageIcon,
  Check,
  Calendar,
  MapPin,
  Clock,
  RotateCcw,
  ExternalLink,
  Copy,
} from 'lucide-react';
import {
  TeamInfo,
  Match,
  Player,
  Language,
  LineupPosition,
  DEFAULT_FACEBOOK_AVATAR,
} from '../types';
import {
  STADIUM_BACKGROUND_PRESETS,
  COLOR_THEME_PRESETS,
  StadiumPreset,
  CanvasExportResult,
  triggerBrowserFileDownload,
} from '../utils/graphicPresets';
import { downloadElementAsImage } from '../utils/imageDownloader';
import {
  generateLineupCanvasPoster,
  copyImageToClipboard,
} from '../utils/lineupPosterGenerator';

interface LineupDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamInfo;
  setTeam?: React.Dispatch<React.SetStateAction<TeamInfo>>;
  activeMatch: Match;
  formation: string;
  starterPlayers: { slot: LineupPosition; player?: Player }[];
  benchPlayers: Player[];
  language: Language;
}

export const LineupDownloadModal: React.FC<LineupDownloadModalProps> = ({
  isOpen,
  onClose,
  team,
  setTeam,
  activeMatch,
  formation,
  starterPlayers,
  benchPlayers,
  language,
}) => {
  const posterRef = useRef<HTMLDivElement>(null);

  // Background state
  const [selectedBg, setSelectedBg] = useState<string>(
    STADIUM_BACKGROUND_PRESETS[0].url
  );
  const [customBgInput, setCustomBgInput] = useState<string>('');
  const [showCustomBg, setShowCustomBg] = useState<boolean>(false);

  // Color customization state - defaults to team colors
  const [primaryColor, setPrimaryColor] = useState<string>(
    team.primaryColor || '#1877F2'
  );
  const [secondaryColor, setSecondaryColor] = useState<string>(
    team.secondaryColor || '#0866FF'
  );

  // Sync with team if team changes
  useEffect(() => {
    if (team.primaryColor) setPrimaryColor(team.primaryColor);
    if (team.secondaryColor) setSecondaryColor(team.secondaryColor);
  }, [team.primaryColor, team.secondaryColor]);

  // Loading & success states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [colorsSaved, setColorsSaved] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<CanvasExportResult | null>(null);
  const [activePreviewView, setActivePreviewView] = useState<'live' | 'generated'>('live');

  if (!isOpen) return null;

  // Handle saving colors back to official club configuration
  const handleSaveColorsToClub = () => {
    if (typeof setTeam === 'function') {
      setTeam((prev) => ({
        ...prev,
        primaryColor,
        secondaryColor,
      }));
      setColorsSaved(true);
      setTimeout(() => setColorsSaved(false), 3000);
    }
  };

  // Handle Download Action (Generates via pure Canvas for guaranteed, untainted HD poster)
  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const fileName = `Alineacion_${team.shortName || 'Equipo'}_vs_${activeMatch.rival.replace(
        /\s+/g,
        '_'
      )}_${formation}.png`;

      // 1. Primary: High-definition pure HTML5 Canvas (guaranteed CORS safety and no taint)
      const res = await generateLineupCanvasPoster({
        team,
        activeMatch,
        formation,
        starterPlayers,
        benchPlayers,
        primaryColor,
        secondaryColor,
        selectedBg,
      });

      if (res) {
        setGeneratedResult(res);
        setActivePreviewView('generated');
        setDownloadSuccess(true);
      } else if (posterRef.current) {
        // 2. Fallback: DOM capture via html2canvas with safe Blob URL
        const domRes = await downloadElementAsImage(posterRef.current, {
          fileName,
          scale: 2,
          backgroundColor: '#05070B',
        });
        if (domRes) {
          setDownloadSuccess(true);
        }
      }
    } catch (err) {
      console.error('Error downloading lineup graphic:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy generated image directly to clipboard
  const handleCopy = async () => {
    if (!generatedResult?.blob) return;
    const ok = await copyImageToClipboard(generatedResult.blob);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // Open generated image in new tab (bypasses any iframe download blocking)
  const handleOpenInNewTab = () => {
    if (!generatedResult?.blobUrl) return;
    window.open(generatedResult.blobUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#18191A] text-white rounded-3xl border border-white/10 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#242526]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0 border border-white/20"
              style={{ backgroundColor: primaryColor }}
            >
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Descargar Alineación Oficial</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-amber-400 border border-amber-400/30">
                  HD Poster
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Personaliza el fondo de estadio, los colores del escudo y descarga en alta calidad
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Preview, Right Controls */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Live HD Graphic Poster Container */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* View Selector & Header */}
            <div className="w-full flex items-center justify-between mb-2 px-1 text-xs">
              {generatedResult ? (
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setActivePreviewView('generated')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activePreviewView === 'generated'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Foto HD Generada</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewView('live')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activePreviewView === 'live'
                        ? 'bg-white/20 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>Editor de Alineación</span>
                  </button>
                </div>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gráfica Oficial para Redes (4:5)
                </span>
              )}
              <span className="text-gray-300 font-mono text-[11px] bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                {formation} • 7v7
              </span>
            </div>

            {/* Generated HD Photo View (Guaranteed to stay right here in view!) */}
            {activePreviewView === 'generated' && generatedResult ? (
              <div
                className="w-full max-w-[460px] aspect-[4/5] rounded-2xl relative overflow-hidden flex flex-col items-center justify-center shadow-2xl border-2 bg-[#05070B] animate-fadeIn"
                style={{ borderColor: primaryColor }}
              >
                <img
                  src={generatedResult.blobUrl || generatedResult.dataUrl}
                  alt="Alineación Oficial Generada"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl border border-emerald-500/40 text-[11px] font-black text-emerald-400 flex items-center gap-1.5 shadow-lg">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Foto Lista (1080 × 1350 px)</span>
                </div>
              </div>
            ) : (
              /* Poster Render Target (Live Editor View) */
              <div
                ref={posterRef}
                id="lineup-official-poster"
                className="w-full max-w-[460px] aspect-[4/5] rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-2xl border-2 select-none"
                style={{
                  borderColor: `${primaryColor}60`,
                  backgroundColor: '#07090E',
                }}
              >
                {/* Layer 1: Stadium / Pitch / Players Background Image */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={selectedBg}
                    alt="Estadio Fondo"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover brightness-[0.45] contrast-125 scale-105"
                  />
                  {/* Gradient Vignette over background */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#05070B] via-transparent to-[#05070B]/85"
                    style={{
                      background: `radial-gradient(circle at 50% 20%, ${primaryColor}25 0%, transparent 65%), linear-gradient(180deg, #05070BE6 0%, #05070B66 40%, #05070BF0 100%)`,
                    }}
                  />
                </div>

                {/* Layer 2: Field Markings Subtle Overlay in Upper Half */}
                <div className="absolute inset-x-4 top-28 bottom-20 z-1 border border-white/20 rounded-xl pointer-events-none opacity-40">
                  {/* Center Circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-white/30" />
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/25" />
                  {/* Penalty Area Rival */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-16 border-b border-x border-white/25 rounded-b-lg" />
                  {/* Penalty Area Our Goal */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-16 border-t border-x border-white/25 rounded-t-lg" />
                </div>

                {/* Layer 3: Poster Header with Team Logo & Match Details */}
                <div className="relative z-10 pt-4 px-4 pb-2 text-center flex flex-col items-center">
                  {/* Club Logo with Aura */}
                  <div className="relative mb-1.5 group">
                    <div
                      className="absolute -inset-1.5 rounded-full blur-md opacity-75 animate-pulse"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <img
                      src={team.logoUrl || DEFAULT_FACEBOOK_AVATAR}
                      alt={team.name}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_FACEBOOK_AVATAR;
                      }}
                      className="relative w-14 h-14 rounded-full object-cover border-2 shadow-xl bg-[#141416]"
                      style={{ borderColor: primaryColor }}
                    />
                  </div>

                  {/* Team Name & League */}
                  <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider leading-tight drop-shadow-md">
                    {team.name}
                  </h1>
                  <p
                    className="text-[11px] font-bold uppercase tracking-widest mt-0.5 drop-shadow-sm"
                    style={{ color: secondaryColor || '#60A5FA' }}
                  >
                    {team.leagueName}
                  </p>

                  {/* Match Banner VS */}
                  <div className="mt-2 w-full bg-black/60 backdrop-blur-md rounded-xl py-1.5 px-3 border border-white/10 flex items-center justify-between gap-2 shadow-lg">
                    <div className="text-left min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider block text-amber-400">
                        Partido Oficial
                      </span>
                      <span className="text-xs font-bold text-white truncate block">
                        {team.shortName} <span className="text-gray-400">VS</span> {activeMatch.rival}
                      </span>
                    </div>

                    <div className="text-right text-[10px] text-gray-300 font-medium shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <Calendar className="w-2.5 h-2.5 text-amber-400" />
                        <span>{activeMatch.date}</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end text-gray-400">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{activeMatch.time} hrs</span>
                      </div>
                    </div>
                  </div>

                  {/* Formation Badge */}
                  <div className="mt-1.5">
                    <span
                      className="inline-block px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase border shadow-md"
                      style={{
                        backgroundColor: `${primaryColor}30`,
                        borderColor: primaryColor,
                        color: '#ffffff',
                      }}
                    >
                      ★ ALINEACIÓN TITULAR ({formation}) ★
                    </span>
                  </div>
                </div>

                {/* Layer 4: Tactical Starters on Pitch */}
                <div className="relative z-10 flex-1 px-4 py-2">
                  <div className="relative w-full h-full">
                    {starterPlayers.map(({ slot, player }, idx) => {
                      const isPor = slot.roleName === 'POR';
                      const playerColor = isPor ? '#F59E0B' : primaryColor;

                      return (
                        <div
                          key={idx}
                          style={{
                            left: `${slot.x}%`,
                            top: `${slot.y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          className="absolute flex flex-col items-center pointer-events-none"
                        >
                          {/* Player Circular Node */}
                          <div
                            className="relative w-10 h-10 rounded-full flex items-center justify-center shadow-2xl border-2 ring-2 ring-black/80"
                            style={{
                              borderColor: playerColor,
                              backgroundColor: playerColor,
                            }}
                          >
                            <img
                              src={player?.avatarUrl || DEFAULT_FACEBOOK_AVATAR}
                              alt={player?.name || 'Jugador'}
                              crossOrigin="anonymous"
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_FACEBOOK_AVATAR;
                              }}
                              className="w-full h-full rounded-full object-cover p-0.5 bg-black/40"
                            />

                            {/* Jersey number badge */}
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black text-white font-mono font-black text-[9px] flex items-center justify-center border border-white/60 shadow-md">
                              {player ? player.number : '?'}
                            </span>
                          </div>

                          {/* Player Name Pill */}
                          <div className="mt-0.5 bg-black/85 backdrop-blur-xs px-1.5 py-0.5 rounded-md border border-white/20 shadow-md text-center max-w-[85px] truncate">
                            <span className="text-[9px] font-black text-white truncate block">
                              {player?.name ? player.name.split(' ')[0] : slot.roleName}
                            </span>
                            <span
                              className="text-[7.5px] font-bold tracking-wider uppercase block -mt-0.5"
                              style={{ color: playerColor }}
                            >
                              {slot.roleName}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Layer 5: Bench / Suplentes & Poster Footer */}
                <div className="relative z-10 bg-black/85 backdrop-blur-md border-t border-white/15 px-3 py-2">
                  {/* Bench listing */}
                  <div className="flex items-center gap-1.5 overflow-x-hidden text-[9px]">
                    <span className="font-black text-amber-400 uppercase shrink-0">
                      Banca:
                    </span>
                    <div className="truncate text-gray-300 font-medium">
                      {benchPlayers.length > 0
                        ? benchPlayers
                            .map((p) => `#${p.number} ${p.name.split(' ')[0]}`)
                            .join('  •  ')
                        : 'Plantilla completa en cancha'}
                    </div>
                  </div>

                  {/* Footer Brand Line */}
                  <div className="mt-1 flex items-center justify-between text-[8px] text-gray-400 font-semibold border-t border-white/10 pt-1">
                    <span className="truncate">📍 {activeMatch.stadium}</span>
                    <span className="font-bold tracking-wider uppercase text-white">
                      #{team.shortName || 'TeamGol'} • VamosPorLaVictoria
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Direct Save Bar Underneath Preview */}
            {generatedResult && (
              <div className="w-full max-w-[460px] mt-3 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const fileName = `Alineacion_${team.shortName || 'Equipo'}_vs_${activeMatch.rival.replace(
                        /\s+/g,
                        '_'
                      )}_${formation}.png`;
                      triggerBrowserFileDownload(generatedResult.blob, generatedResult.blobUrl, fileName);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Archivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
                    title="Abrir a pantalla completa"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>Abrir en Pestaña</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
                    title="Copiar imagen al portapapeles"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{copied ? 'Copiada' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 text-center">
                  💡 Tip: También puedes mantener presionada la imagen para guardarla en la galería de tu teléfono.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Customization Controls (Stadium Background + Team Colors) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Control Group 1: Background Preset Selector ("de fondo que este un estadio, campo, jugadores, etc.") */}
            <div className="bg-[#242526] p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>Fondo de Estadio / Campo</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomBg(!showCustomBg)}
                  className="text-[11px] text-[#1877F2] font-bold hover:underline cursor-pointer"
                >
                  {showCustomBg ? 'Ver presets' : 'URL personalizada'}
                </button>
              </div>

              {/* Preset Thumbnails */}
              {!showCustomBg ? (
                <div className="grid grid-cols-2 gap-2">
                  {STADIUM_BACKGROUND_PRESETS.map((preset) => {
                    const isSelected = selectedBg === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedBg(preset.url)}
                        className={`relative rounded-xl overflow-hidden text-left p-1.5 border transition-all cursor-pointer group ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/40 bg-white/5'
                            : 'border-white/10 hover:border-white/30 bg-black/20'
                        }`}
                      >
                        <div className="h-16 rounded-lg overflow-hidden relative mb-1.5">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          {isSelected && (
                            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-[10px]">
                              ✓
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-white block truncate leading-tight">
                          {preset.name}
                        </span>
                        <span className="text-[9px] text-gray-400 block truncate">
                          {preset.description}
                        </span>
                      </button>
                    );
                  })}

                  {/* Team Banner option */}
                  {team.bannerUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedBg(team.bannerUrl)}
                      className={`relative rounded-xl overflow-hidden text-left p-1.5 border transition-all cursor-pointer group ${
                        selectedBg === team.bannerUrl
                          ? 'border-amber-400 ring-2 ring-amber-400/40 bg-white/5'
                          : 'border-white/10 hover:border-white/30 bg-black/20'
                      }`}
                    >
                      <div className="h-16 rounded-lg overflow-hidden relative mb-1.5">
                        <img
                          src={team.bannerUrl}
                          alt="Banner del Club"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        {selectedBg === team.bannerUrl && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-white block truncate leading-tight">
                        Banner del Club
                      </span>
                      <span className="text-[9px] text-gray-400 block truncate">
                        Foto oficial de tu equipo
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="Pega enlace de foto de estadio (ej. Unsplash)"
                    value={customBgInput}
                    onChange={(e) => {
                      setCustomBgInput(e.target.value);
                      if (e.target.value.trim()) setSelectedBg(e.target.value.trim());
                    }}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#1877F2]"
                  />
                  <p className="text-[10px] text-gray-400">
                    Ingresa una URL de imagen con permiso de carga pública para usar de fondo.
                  </p>
                </div>
              )}
            </div>

            {/* Control Group 2: Play with Team Logo Colors ("Utiliza igual los colores del logo para jugar con la convocatoia o alineacion") */}
            <div className="bg-[#242526] p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  <span>Jugar con los Colores del Club</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPrimaryColor(team.primaryColor || '#1877F2');
                    setSecondaryColor(team.secondaryColor || '#0866FF');
                  }}
                  className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  title="Restaurar a colores guardados"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restaurar</span>
                </button>
              </div>

              {/* Quick Theme Presets */}
              <div>
                <span className="text-[10px] font-bold text-gray-400 block mb-1.5">
                  Paletas Rápidas:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_THEME_PRESETS.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        setPrimaryColor(theme.primary);
                        setSecondaryColor(theme.secondary);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 hover:border-white/30 text-xs text-gray-200 transition-all cursor-pointer"
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span className="text-[11px] font-medium">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Color Principal (Camiseta/Aura)
                  </label>
                  <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-2 py-1.5">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono font-bold uppercase text-white">
                      {primaryColor}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Color Secundario (Detalles)
                  </label>
                  <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-2 py-1.5">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono font-bold uppercase text-white">
                      {secondaryColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Colors to Team button */}
              {setTeam && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSaveColorsToClub}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {colorsSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Shield className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{colorsSaved ? '¡Colores guardados en el club!' : 'Guardar estos colores en el perfil del club'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons: Download & Share */}
            <div className="space-y-3 pt-2">
              <button
                id="btn-download-lineup-hd"
                type="button"
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full py-3.5 px-5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 shadow-xl hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                <Download className="w-5 h-5" />
                <span>
                  {isGenerating
                    ? 'Generando Gráfica HD...'
                    : downloadSuccess
                    ? '✓ ¡Generada! Descargando...'
                    : 'Descargar Gráfica Oficial (PNG HD)'}
                </span>
              </button>

              {/* Generated Image Action Center (Ensures users can ALWAYS save, open in new tab, or copy) */}
              {generatedResult && (
                <div className="bg-black/50 border border-emerald-500/40 rounded-2xl p-3.5 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      ¡Gráfica lista para guardar!
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">1080 × 1350 px</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Open in New Tab Button (Bypasses iframe download restriction) */}
                    <button
                      type="button"
                      onClick={handleOpenInNewTab}
                      className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span>Abrir en Pestaña</span>
                    </button>

                    {/* Copy Image Button */}
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{copied ? '¡Copiada!' : 'Copiar Imagen'}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-gray-300 leading-tight">
                    💡 <strong>Tip:</strong> Si tu navegador no descargó el archivo automáticamente, pulsa <strong>"Abrir en Pestaña"</strong> para ver la imagen en alta calidad y hacer clic derecho o mantener presionado para guardarla en tu galería.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-center text-[11px] text-gray-400 justify-center">
                <span>✓ Con logo oficial</span>
                <span>•</span>
                <span>✓ Fondo de estadio épico</span>
                <span>•</span>
                <span>✓ Formato Instagram / WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
