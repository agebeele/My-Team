import React, { useState, useRef } from 'react';
import {
  X,
  Share2,
  Download,
  Sparkles,
  Trophy,
  Flame,
  Check,
  Smartphone,
  Crown,
  Copy,
  Layers,
  ChevronRight,
  Shield,
  Star,
  Zap,
  Target,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import confetti from 'canvas-confetti';
import {
  AppUser,
  Player,
  TeamInfo,
  StandingsRow,
  Match,
  StoryType,
  StoryTheme,
} from '../types';

interface StoryShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  player?: Player;
  team: TeamInfo;
  standings: StandingsRow[];
  matches: Match[];
  players: Player[];
  initialType?: StoryType;
}

export const StoryShareModal: React.FC<StoryShareModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  player,
  team,
  standings,
  matches,
  players,
  initialType = 'standings',
}) => {
  const [selectedType, setSelectedType] = useState<StoryType>(initialType);
  const [theme, setTheme] = useState<StoryTheme>('bayern_red');
  const [activeSticker, setActiveSticker] = useState<string>('🔥 EN RACHA');
  const [customCaption, setCustomCaption] = useState<string>(
    '¡Orgulloso de representar a mi equipo! Vamos por todo ⚽🔥'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const storyCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Find user's player profile or fallback to passed player / first player
  const activePlayer =
    players.find((p) => p.id === currentUser.playerId) ||
    player ||
    players[0] || {
      id: 'p_default',
      name: currentUser.name,
      nickname: 'El Crack',
      number: currentUser.jerseyNumber || 10,
      position: currentUser.position || 'DEL',
      avatarUrl: currentUser.avatarUrl,
      goals: 19,
      assists: 8,
      matches: 28,
      yellowCards: 2,
      redCards: 0,
      mvpHistory: [],
    };

  // Find last finished or live match for MVP / Match result
  const lastMatch =
    matches.find((m) => m.status === 'live') ||
    [...matches].reverse().find((m) => m.status === 'finished') ||
    matches[0];

  // Top scorers from players or table
  const topScorers = [...players]
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);

  // Top standings slice (show top 6 + our team if not in top 6)
  const ourTeamRow = standings.find((r) => r.isOurTeam || r.name.toLowerCase().includes('bayern')) || standings[1];
  const topStandings = standings.slice(0, 6);

  const showToast = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 3000);
  };

  // Capture story card to high-res Blob
  const generateStoryImage = async (): Promise<Blob | null> => {
    if (!storyCardRef.current) return null;
    try {
      const canvas = await html2canvas(storyCardRef.current, {
        scale: 3, // Ultra-high resolution 1080x1920
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 0.95);
      });
    } catch (err) {
      console.error('Error generating story image:', err);
      return null;
    }
  };

  // Native share sheet (Instagram, WhatsApp, TikTok Stories)
  const handleShareToStories = async () => {
    setIsExporting(true);
    try {
      const blob = await generateStoryImage();
      if (!blob) {
        showToast('Error al generar imagen de la historia');
        setIsExporting(false);
        return;
      }

      const file = new File([blob], `historia_${currentUser.username || 'user'}_${selectedType}.png`, {
        type: 'image/png',
      });

      // Check if Web Share API with files is supported (iOS Safari, Android Chrome)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Historia de ${currentUser.name} - ${team.name}`,
          text: `${customCaption}\n\n⚽ @${currentUser.username || 'teamgol'} en ${team.name}`,
        });
        confetti({ particleCount: 40, spread: 60 });
        showToast('¡Listo para compartir en tus historias!');
      } else {
        // Fallback: download image directly and prompt user
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historia_${currentUser.username || 'user'}_${selectedType}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        confetti({ particleCount: 30, spread: 50 });
        showToast('📸 Foto HD descargada. ¡Súbela directamente a tus historias de Instagram o WhatsApp!');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share error:', err);
        showToast('Error al abrir menú de compartir');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Direct download HD 9:16
  const handleDownloadStory = async () => {
    setIsExporting(true);
    try {
      const blob = await generateStoryImage();
      if (!blob) {
        showToast('Error al generar imagen');
        setIsExporting(false);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historia_9x16_${currentUser.username || 'teamgol'}_${selectedType}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      confetti({ particleCount: 35, spread: 55 });
      showToast('✅ Historia 9:16 descargada en alta definición');
    } catch (err) {
      console.error('Download error:', err);
      showToast('Error al descargar');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy text & tags
  const handleCopyTags = () => {
    const text = `${customCaption}\n\n👤 Usuario: @${currentUser.username || 'futbolero'}\n⚽ Club: ${team.name}\n🏆 Liga: ${team.leagueName}\n#TeamGol #Futbol7 #Historias`;
    navigator.clipboard.writeText(text);
    showToast('📋 Texto y menciones copiadas');
  };

  // Theme styling classes
  const getThemeBackground = () => {
    switch (theme) {
      case 'champions_neon':
        return 'bg-gradient-to-b from-[#0A1128] via-[#001F54] to-[#034078] text-white';
      case 'gold_mvp':
        return 'bg-gradient-to-b from-[#141414] via-[#2A2312] to-[#0A0A0A] text-amber-200';
      case 'emerald_turf':
        return 'bg-gradient-to-b from-[#062c1d] via-[#0b4d34] to-[#041d13] text-white';
      case 'dark_minimal':
        return 'bg-gradient-to-b from-[#121212] via-[#1a1a1a] to-[#0a0a0a] text-white';
      case 'bayern_red':
      default:
        return 'bg-gradient-to-b from-[#8B0000] via-[#5C0612] to-[#2B0007] text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#1E1F20] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: 9:16 STORY PREVIEW (Instagram / TikTok / WhatsApp Format) */}
        <div className="flex-1 bg-[#0F1012] p-4 sm:p-6 flex flex-col items-center justify-center overflow-y-auto">
          <div className="flex items-center gap-2 mb-2 text-white/70 text-xs font-semibold uppercase tracking-wider">
            <Smartphone className="w-4 h-4 text-rose-500" />
            <span>Vista Previa de Historia (Formato Vertical 9:16)</span>
          </div>

          {/* THE 9:16 VERTICAL CANVAS CARD */}
          <div
            ref={storyCardRef}
            className={`w-[300px] sm:w-[330px] h-[533px] sm:h-[586px] rounded-3xl p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden border border-white/15 select-none ${getThemeBackground()}`}
            style={{
              boxShadow: '0 20px 50px -10px rgba(0,0,0,0.8), 0 0 30px rgba(230, 20, 50, 0.2)',
            }}
          >
            {/* Top Glow & Patterns */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

            {/* HEADER: USER BRANDING & TEAM INFO */}
            <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/15">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    crossOrigin="anonymous"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400 shadow-md bg-white"
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center text-[8px] text-white">
                    ✓
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black tracking-tight text-white drop-shadow-sm">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] bg-rose-500 text-white font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                      HISTORIA
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-amber-300 drop-shadow-sm">
                    @{currentUser.username || 'jugador_oficial'}
                  </p>
                </div>
              </div>

              {/* Club Shield */}
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  crossOrigin="anonymous"
                  className="w-5 h-5 rounded-full object-cover bg-white"
                />
                <span className="text-[10px] font-black text-white uppercase tracking-wider">
                  {team.shortName}
                </span>
              </div>
            </div>

            {/* DYNAMIC STORY CONTENT BASED ON SELECTED TYPE */}
            <div className="relative z-10 my-auto py-2">
              {/* STICKER / BADGE */}
              {activeSticker && (
                <div className="flex justify-center mb-2.5">
                  <span className="inline-flex items-center gap-1 bg-amber-400 text-black px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg transform -rotate-1 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 fill-black" />
                    {activeSticker}
                  </span>
                </div>
              )}

              {/* 1. STANDINGS TABLE STORY (31 EQUIPOS) */}
              {selectedType === 'standings' && (
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-[11px] uppercase tracking-widest text-amber-300 font-extrabold">
                      {team.leagueName}
                    </div>
                    <h3 className="text-lg font-black tracking-tight text-white uppercase">
                      Tabla de Posiciones
                    </h3>
                  </div>

                  {/* Top Standings Rows */}
                  <div className="bg-black/50 backdrop-blur-md rounded-2xl p-2.5 border border-white/10 space-y-1">
                    {topStandings.map((row) => {
                      const isOurClub = row.isOurTeam || row.name.toLowerCase().includes('bayern');
                      return (
                        <div
                          key={row.id}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isOurClub
                              ? 'bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-amber-500/20 text-amber-200 border border-amber-400/50 shadow-md ring-1 ring-amber-400/30'
                              : 'text-white/90 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 text-center font-black text-xs ${
                                row.rank === 1
                                  ? 'text-amber-400'
                                  : row.rank === 2
                                  ? 'text-rose-400'
                                  : 'text-white/60'
                              }`}
                            >
                              {row.rank}º
                            </span>
                            <img
                              src={row.logo}
                              alt={row.name}
                              crossOrigin="anonymous"
                              className="w-4 h-4 rounded-full object-contain bg-white/10 shrink-0"
                            />
                            <span className="truncate max-w-[110px] text-[11px]">
                              {row.name}
                            </span>
                            {isOurClub && (
                              <span className="text-[9px] bg-amber-400 text-black px-1 rounded font-black">
                                MI CLUB ⭐
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-white/60">{row.pj} PJ</span>
                            <span className="font-black text-white">{row.pts} PTS</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Footer */}
                  {ourTeamRow && (
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 text-center text-[11px] font-bold text-white flex items-center justify-around border border-white/15">
                      <div>
                        <span className="text-amber-300 block text-xs font-black">
                          #{ourTeamRow.rank}º LUGAR
                        </span>
                        <span className="text-[10px] text-white/70">Posición Oficial</span>
                      </div>
                      <div className="w-px h-6 bg-white/20" />
                      <div>
                        <span className="text-emerald-300 block text-xs font-black">
                          +{ourTeamRow.dg} DIF
                        </span>
                        <span className="text-[10px] text-white/70">Diferencia de Goles</span>
                      </div>
                      <div className="w-px h-6 bg-white/20" />
                      <div>
                        <span className="text-rose-300 block text-xs font-black">
                          {ourTeamRow.pts} PTS
                        </span>
                        <span className="text-[10px] text-white/70">Puntos Totales</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. TOP SCORERS STORY (TABLA DE GOLEO) */}
              {selectedType === 'scorers' && (
                <div className="space-y-2.5">
                  <div className="text-center">
                    <div className="text-[11px] uppercase tracking-widest text-amber-300 font-extrabold flex items-center justify-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      Bota de Oro • Goleo Individual
                    </div>
                    <h3 className="text-lg font-black tracking-tight text-white uppercase">
                      Líderes de Goleo
                    </h3>
                  </div>

                  <div className="bg-black/50 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-2">
                    {topScorers.map((scorer, idx) => (
                      <div
                        key={scorer.id}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold ${
                          idx === 0
                            ? 'bg-amber-500/20 border border-amber-400/50 text-amber-200'
                            : 'bg-white/5 text-white/90'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-amber-400 w-4">
                            #{idx + 1}
                          </span>
                          <img
                            src={scorer.avatarUrl}
                            alt={scorer.name}
                            crossOrigin="anonymous"
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20 bg-white"
                          />
                          <div>
                            <p className="text-[11px] font-black truncate max-w-[120px]">
                              {scorer.name}
                            </p>
                            <p className="text-[9px] text-white/60">
                              {scorer.position} • #{scorer.number}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-base font-black text-amber-300">
                            {scorer.goals}
                          </span>
                          <span className="text-[10px] text-white/70">GOLES</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gradient-to-r from-amber-500/30 to-rose-500/30 rounded-xl p-2 text-center text-xs font-bold text-white border border-amber-400/30">
                    ⚽ ¡El poder ofensivo de <span className="text-amber-300">{team.name}</span>!
                  </div>
                </div>
              )}

              {/* 3. MVP STORY AWARD */}
              {selectedType === 'mvp' && (
                <div className="space-y-2.5 text-center">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400 text-black text-[11px] font-black uppercase tracking-wider shadow-md">
                    <Crown className="w-3.5 h-3.5" />
                    JUGADOR MÁS VALIOSO (MVP)
                  </div>

                  <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden ring-4 ring-amber-400 shadow-2xl bg-black">
                    <img
                      src={activePlayer.avatarUrl}
                      alt={activePlayer.name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 right-1 bg-amber-400 text-black font-black text-[10px] px-1.5 py-0.5 rounded-md shadow">
                      9.8 ★
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight">
                      {activePlayer.name}
                    </h3>
                    <p className="text-xs font-bold text-amber-300">
                      «{activePlayer.nickname || 'El Protagonista'}» • #{activePlayer.number}
                    </p>
                  </div>

                  <div className="bg-black/40 backdrop-blur-md rounded-2xl p-2.5 border border-white/10 grid grid-cols-3 gap-1 text-center">
                    <div className="p-1">
                      <span className="block text-sm font-black text-amber-300">
                        {activePlayer.goals || 2}
                      </span>
                      <span className="text-[9px] text-white/70 uppercase">Goles</span>
                    </div>
                    <div className="p-1 border-x border-white/10">
                      <span className="block text-sm font-black text-emerald-300">
                        {activePlayer.assists || 1}
                      </span>
                      <span className="text-[9px] text-white/70 uppercase">Asistencias</span>
                    </div>
                    <div className="p-1">
                      <span className="block text-sm font-black text-rose-300">
                        14
                      </span>
                      <span className="text-[9px] text-white/70 uppercase">Votos Afición</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-white/80 italic font-medium">
                    «Distinción oficial de la jornada tras el pitazo final»
                  </p>
                </div>
              )}

              {/* 4. PLAYER TRADING CARD (MI FICHA) */}
              {selectedType === 'player_card' && (
                <div className="space-y-2 text-center">
                  <div className="bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-white/15 space-y-2">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="text-left">
                        <span className="text-[10px] text-amber-300 font-extrabold uppercase">
                          Ficha Oficial
                        </span>
                        <h4 className="text-sm font-black text-white">
                          {activePlayer.name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-amber-400">
                          #{activePlayer.number}
                        </span>
                        <span className="block text-[9px] text-white/60 font-bold">
                          {activePlayer.position}
                        </span>
                      </div>
                    </div>

                    <div className="relative mx-auto w-24 h-24 rounded-full overflow-hidden ring-2 ring-white/30 bg-black">
                      <img
                        src={activePlayer.avatarUrl}
                        alt={activePlayer.name}
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-center pt-1 border-t border-white/10">
                      <div>
                        <span className="block text-xs font-black text-white">
                          {activePlayer.matches}
                        </span>
                        <span className="text-[8px] text-white/60 uppercase">Partidos</span>
                      </div>
                      <div>
                        <span className="block text-xs font-black text-amber-300">
                          {activePlayer.goals}
                        </span>
                        <span className="text-[8px] text-white/60 uppercase">Goles</span>
                      </div>
                      <div>
                        <span className="block text-xs font-black text-emerald-300">
                          {activePlayer.assists}
                        </span>
                        <span className="text-[8px] text-white/60 uppercase">Pases Gol</span>
                      </div>
                      <div>
                        <span className="block text-xs font-black text-rose-300">
                          {activePlayer.mvpHistory?.length || 2}
                        </span>
                        <span className="text-[8px] text-white/60 uppercase">MVPs</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-amber-200">
                    Plantilla Oficial • {team.name}
                  </div>
                </div>
              )}

              {/* 5. MATCH RESULT STORY */}
              {selectedType === 'match_result' && (
                <div className="space-y-2.5 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-amber-300 font-extrabold">
                    Resultado Oficial de la Jornada
                  </div>

                  <div className="bg-black/50 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      {/* Us */}
                      <div className="flex flex-col items-center w-24">
                        <img
                          src={team.logoUrl}
                          alt={team.name}
                          crossOrigin="anonymous"
                          className="w-12 h-12 rounded-full object-cover bg-white ring-2 ring-amber-400 shadow-md"
                        />
                        <span className="text-xs font-black text-white mt-1 truncate">
                          {team.shortName}
                        </span>
                      </div>

                      {/* Score */}
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-black text-white font-mono">
                          {lastMatch?.scoreUs ?? 4}
                        </span>
                        <span className="text-xl font-bold text-amber-400">-</span>
                        <span className="text-3xl font-black text-white font-mono">
                          {lastMatch?.scoreThem ?? 2}
                        </span>
                      </div>

                      {/* Them */}
                      <div className="flex flex-col items-center w-24">
                        <img
                          src={lastMatch?.rivalLogo || 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png'}
                          alt={lastMatch?.rival || 'Rival'}
                          crossOrigin="anonymous"
                          className="w-12 h-12 rounded-full object-cover bg-white ring-2 ring-white/20 shadow-md"
                        />
                        <span className="text-xs font-black text-white mt-1 truncate">
                          {lastMatch?.rival || 'Rival'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-emerald-400 font-black">
                      ¡VICTORIA Y 3 PUNTOS CLAVE! 🔥
                    </div>
                  </div>

                  <p className="text-[10px] text-white/70">
                    Estadio: {lastMatch?.stadium || team.stadium}
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER: CAPTION & WATERMARK WITH ACTIVE USER HANDLE */}
            <div className="relative z-10 pt-2 border-t border-white/15">
              <p className="text-[11px] font-semibold text-white/90 text-center leading-tight line-clamp-2 mb-2">
                "{customCaption}"
              </p>

              <div className="flex items-center justify-between text-[10px] font-bold text-white/70 bg-black/40 px-3 py-1.5 rounded-full">
                <span className="flex items-center gap-1">
                  <span>⚽ Publicado por:</span>
                  <strong className="text-amber-300">@{currentUser.username || 'jugador'}</strong>
                </span>
                <span className="text-white/50">#TeamGol</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CONTROLS & EXPORT ACTIONS */}
        <div className="w-full md:w-[380px] p-5 sm:p-6 bg-white dark:bg-[#1E1F20] flex flex-col justify-between overflow-y-auto space-y-5">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-[#050505] dark:text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-rose-500" />
                Compartir en tus Historias
              </h3>
              <p className="text-xs text-[#65676B] dark:text-gray-400 mt-0.5">
                Formato 9:16 vertical diseñado para Instagram Stories, WhatsApp Status y TikTok bajo tu usuario: <strong className="text-rose-600 font-bold">@{currentUser.username || 'jugador'}</strong>.
              </p>
            </div>

            {/* Notification Toast */}
            {copyToast && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{copyToast}</span>
              </div>
            )}

            {/* 1. SELECT STORY TYPE */}
            <div>
              <label className="block text-xs font-bold text-[#050505] dark:text-gray-200 mb-1.5">
                Tipo de Foto para Historia:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'standings' as StoryType, label: 'Tabla Posiciones', icon: Layers },
                  { id: 'scorers' as StoryType, label: 'Tabla de Goleo', icon: Trophy },
                  { id: 'mvp' as StoryType, label: 'Premio MVP', icon: Crown },
                  { id: 'player_card' as StoryType, label: 'Mi Ficha Oficial', icon: Target },
                  { id: 'match_result' as StoryType, label: 'Resultado Partido', icon: Zap },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedType(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      selectedType === item.id
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'bg-[#F0F2F5] dark:bg-white/5 text-[#050505] dark:text-white hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. THEME SELECTOR */}
            <div>
              <label className="block text-xs font-bold text-[#050505] dark:text-gray-200 mb-1.5">
                Estilo Visual / Tema:
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'bayern_red' as StoryTheme, label: 'Rojo Club', color: 'bg-rose-700' },
                  { id: 'champions_neon' as StoryTheme, label: 'Champions', color: 'bg-blue-800' },
                  { id: 'gold_mvp' as StoryTheme, label: 'Oro VIP', color: 'bg-amber-600' },
                  { id: 'emerald_turf' as StoryTheme, label: 'Césped', color: 'bg-emerald-700' },
                  { id: 'dark_minimal' as StoryTheme, label: 'Dark', color: 'bg-neutral-800' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold text-white transition-all flex flex-col items-center gap-1 cursor-pointer ${t.color} ${
                      theme === t.id ? 'ring-2 ring-black dark:ring-white scale-105 shadow-md' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. STICKER SELECTOR */}
            <div>
              <label className="block text-xs font-bold text-[#050505] dark:text-gray-200 mb-1.5">
                Sticker Destacado:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  '🔥 EN RACHA',
                  '⭐ MVP OFICIAL',
                  '⚽ HAT-TRICK',
                  '👑 LÍDER DE LIGA',
                  '💪 +3 PUNTOS',
                  '🛡️ IMBATIBLE',
                ].map((st) => (
                  <button
                    key={st}
                    onClick={() => setActiveSticker(activeSticker === st ? '' : st)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                      activeSticker === st
                        ? 'bg-amber-400 text-black shadow-xs font-black'
                        : 'bg-[#F0F2F5] dark:bg-white/5 text-[#65676B] dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. CUSTOM CAPTION */}
            <div>
              <label className="block text-xs font-bold text-[#050505] dark:text-gray-200 mb-1">
                Frase / Comentario en tu Historia:
              </label>
              <input
                type="text"
                value={customCaption}
                onChange={(e) => setCustomCaption(e.target.value)}
                maxLength={90}
                placeholder="Escribe tu mensaje..."
                className="w-full px-3 py-2 rounded-xl text-xs border border-[#CED0D4] dark:border-white/10 bg-white dark:bg-[#2A2B2D] text-[#050505] dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-2 pt-3 border-t border-[#CED0D4] dark:border-white/10">
            {/* Direct Native Share Button */}
            <button
              onClick={handleShareToStories}
              disabled={isExporting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>{isExporting ? 'Generando Foto...' : 'Compartir a Mis Historias'}</span>
            </button>

            {/* Download HD Button */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadStory}
                disabled={isExporting}
                className="py-2.5 px-3 rounded-xl bg-[#F0F2F5] dark:bg-white/10 hover:bg-[#E4E6EB] text-[#050505] dark:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-rose-500" />
                <span>Descargar HD</span>
              </button>

              <button
                onClick={handleCopyTags}
                className="py-2.5 px-3 rounded-xl bg-[#F0F2F5] dark:bg-white/10 hover:bg-[#E4E6EB] text-[#050505] dark:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-blue-500" />
                <span>Copiar Texto</span>
              </button>
            </div>

            <p className="text-[10px] text-center text-[#65676B] dark:text-gray-400">
              Compatible con Instagram Stories, WhatsApp, Facebook, TikTok y Snapchat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
