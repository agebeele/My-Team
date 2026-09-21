import React, { useState, useRef } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Plus,
  FileDown,
  Bell,
  CheckCircle2,
  Sparkles,
  Edit2,
  Trash2,
  AlertCircle,
  ExternalLink,
  Shield,
  Activity,
  Zap,
  Download,
  Image as ImageIcon,
  Users,
  X,
} from 'lucide-react';
import { Match, MatchModality, TeamInfo, Player, AppUser, Language } from '../types';
import { getT } from '../utils/translations';
import { exportMatchToPdf } from '../utils/pdfExport';
import { downloadElementAsImage } from '../utils/imageDownloader';
import { getModalityInfo, ALL_MODALITIES } from '../utils/modalityHelper';
import { generateMatchPosterCanvas } from '../utils/matchPosterGenerator';
import { PhotoPreviewModal } from './PhotoPreviewModal';

interface MatchCalendarProps {
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  team: TeamInfo;
  players: Player[];
  currentUser: AppUser;
  language: Language;
  onNavigateToMvp?: (matchId: string) => void;
  onOpenMvp?: (matchId: string) => void;
  onNavigateToLineup?: (matchId: string) => void;
  onNavigateToConvocatoria?: (matchId: string) => void;
  onStartLiveMatch?: (matchId: string) => void;
  activeReminders?: string[];
  toggleMatchReminder?: (match: Match) => void;
}

export const MatchCalendar: React.FC<MatchCalendarProps> = ({
  matches,
  setMatches,
  team,
  players,
  currentUser,
  language,
  onNavigateToMvp,
  onOpenMvp,
  onNavigateToLineup = (_matchId: string) => {},
  onNavigateToConvocatoria = (_matchId: string) => {},
  onStartLiveMatch,
  activeReminders = [],
  toggleMatchReminder = (_match: Match) => {},
}) => {
  const t = getT(language);
  const isOwner = currentUser.role === 'owner' || currentUser.role === 'admin';
  const handleGoToMvp = onOpenMvp || onNavigateToMvp || (() => {});

  const [filter, setFilter] = useState<'all' | 'scheduled' | 'finished'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [showResultModal, setShowResultModal] = useState<Match | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  // Form states for creating / editing match
  const [formData, setFormData] = useState({
    rival: '',
    rivalLogo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=150&q=80',
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    stadium: 'Cancha 1 - Polideportivo',
    isHome: true,
    modality: 'fut11' as MatchModality,
  });

  // Form states for registering score
  const [resultScoreUs, setResultScoreUs] = useState<number>(0);
  const [resultScoreThem, setResultScoreThem] = useState<number>(0);
  const [scorersList, setScorersList] = useState<Array<{ playerId: string; playerName: string; minute: number }>>([]);
  const [selectedScorerPlayerId, setSelectedScorerPlayerId] = useState<string>(players[0]?.id || '');
  const [scorerMinute, setScorerMinute] = useState<number>(15);

  // Gallery image download states
  const [downloadingMatchId, setDownloadingMatchId] = useState<string | null>(null);
  const [exportingPdfId, setExportingPdfId] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [calendarToast, setCalendarToast] = useState<string | null>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  // Photo Preview Modal state
  const [photoPreview, setPhotoPreview] = useState<{
    isOpen: boolean;
    imageUrl: string;
    blob?: Blob | null;
    fileName: string;
    title: string;
  } | null>(null);

  const handleDownloadMatchImage = async (match: Match) => {
    setDownloadingMatchId(match.id);
    try {
      const res = await generateMatchPosterCanvas(match, team, players);
      if (res) {
        const cleanRival = match.rival.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const cleanTeam = team.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const fileName = `partido_${cleanTeam}_vs_${cleanRival}_${match.date}.png`;

        setPhotoPreview({
          isOpen: true,
          imageUrl: res.blobUrl || res.dataUrl,
          blob: res.blob,
          fileName,
          title: `Tarjeta Oficial: ${team.shortName} vs ${match.rival}`,
        });
      }
    } catch (err) {
      console.error('Error generating match photo flyer:', err);
    } finally {
      setDownloadingMatchId(null);
    }
  };

  const handleExportPdf = async (match: Match) => {
    setExportingPdfId(match.id);
    try {
      await exportMatchToPdf(match, team, players);
    } catch (err) {
      console.error('Error exporting match PDF:', err);
    } finally {
      setExportingPdfId(null);
    }
  };

  const handleDownloadAllCalendar = async () => {
    if (!calendarContainerRef.current) return;
    setIsDownloadingAll(true);
    const cleanTeam = team.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `calendario_partidos_${cleanTeam}.png`;

    const res = await downloadElementAsImage(calendarContainerRef.current, {
      fileName,
      backgroundColor: '#0A0A0B',
      scale: 2,
    });

    setIsDownloadingAll(false);
    if (res) {
      setCalendarToast(`¡Calendario completo guardado en tu galería!`);
      setTimeout(() => setCalendarToast(null), 3500);
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (filter === 'scheduled') return m.status === 'scheduled' || m.status === 'live';
    if (filter === 'finished') return m.status === 'finished';
    return true;
  });

  // Calculate if MVP voting is available based on match modality duration (25m for fut 5,7,9; 50m for fut 11)
  const isMvpVoteAvailable = (match: Match): boolean => {
    if (match.status === 'finished') return true;
    const now = Date.now();
    const elapsedMinutes = (now - match.matchStartTimestamp) / (1000 * 60);
    const minRequired = getModalityInfo(match.modality).mvpAvailableMinutes;
    return elapsedMinutes >= minRequired;
  };

  const getMinutesElapsed = (match: Match): number => {
    const now = Date.now();
    return Math.floor((now - match.matchStartTimestamp) / (1000 * 60));
  };

  const handleCreateOrUpdateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rival.trim()) return;

    const matchDateTime = new Date(`${formData.date}T${formData.time}:00`).getTime();

    if (editingMatch) {
      setMatches((prev) =>
        prev.map((m) =>
          m.id === editingMatch.id
            ? {
                ...m,
                rival: formData.rival,
                rivalLogo: formData.rivalLogo,
                date: formData.date,
                time: formData.time,
                stadium: formData.stadium,
                isHome: formData.isHome,
                modality: formData.modality,
                matchStartTimestamp: matchDateTime || m.matchStartTimestamp,
              }
            : m
        )
      );
      setEditingMatch(null);
    } else {
      const newMatch: Match = {
        id: `m_${Date.now()}`,
        rival: formData.rival,
        rivalLogo: formData.rivalLogo,
        date: formData.date,
        time: formData.time,
        stadium: formData.stadium,
        isHome: formData.isHome,
        modality: formData.modality,
        status: 'scheduled',
        scoreUs: null,
        scoreThem: null,
        scorersUs: [],
        calledUpPlayerIds: players.map((p) => p.id),
        lineup: [],
        createdAtTimestamp: Date.now(),
        matchStartTimestamp: matchDateTime || Date.now(),
      };
      setMatches((prev) => [newMatch, ...prev]);
    }

    setShowAddModal(false);
    setFormData({
      rival: '',
      rivalLogo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=150&q=80',
      date: new Date().toISOString().split('T')[0],
      time: '20:00',
      stadium: 'Cancha 1 - Polideportivo',
      isHome: true,
      modality: 'fut11',
    });
  };

  const handleDeleteMatch = (match: Match) => {
    setMatchToDelete(match);
  };

  const handleConfirmDelete = () => {
    if (!matchToDelete) return;
    const rivalName = matchToDelete.rival;
    setMatches((prev) => prev.filter((m) => m.id !== matchToDelete.id));
    setCalendarToast(`Partido vs ${rivalName} eliminado correctamente.`);
    setTimeout(() => setCalendarToast(null), 3500);
    setMatchToDelete(null);
  };

  const handleOpenResultModal = (match: Match) => {
    setShowResultModal(match);
    setResultScoreUs(match.scoreUs ?? 0);
    setResultScoreThem(match.scoreThem ?? 0);
    setScorersList(match.scorersUs || []);
  };

  const handleAddScorer = () => {
    const pl = players.find((p) => p.id === selectedScorerPlayerId);
    if (!pl) return;
    setScorersList((prev) => [
      ...prev,
      { playerId: pl.id, playerName: pl.name, minute: scorerMinute },
    ]);
  };

  const handleRemoveScorer = (idx: number) => {
    setScorersList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveResult = () => {
    if (!showResultModal) return;
    setMatches((prev) =>
      prev.map((m) =>
        m.id === showResultModal.id
          ? {
              ...m,
              scoreUs: resultScoreUs,
              scoreThem: resultScoreThem,
              scorersUs: scorersList,
              status: 'finished',
            }
          : m
      )
    );
    setShowResultModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification when image is saved */}
      {calendarToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-500 text-black px-4 py-3 rounded-xl shadow-2xl font-bold text-xs sm:text-sm flex items-center gap-2 border border-white animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{calendarToast}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#242526] p-5 rounded-2xl border border-[#CED0D4] dark:border-white/10 shadow-xs transition-colors">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#050505] dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#1877F2]" />
            {t.calendar.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#65676B] dark:text-gray-400 mt-0.5 font-medium">
            {t.calendar.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Download Entire Calendar Graphic Button */}
          <button
            onClick={handleDownloadAllCalendar}
            disabled={isDownloadingAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-white/10 dark:hover:bg-white/15 text-[#050505] dark:text-white border border-[#CED0D4] dark:border-white/10 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            title="Descargar rol completo de partidos en tu galería"
          >
            <Download className="w-3.5 h-3.5 text-[#1877F2] dark:text-emerald-400" />
            <span>{isDownloadingAll ? 'Descargando...' : 'Guardar Calendario'}</span>
          </button>

          {/* Filter Pills */}
          <div className="flex bg-[#F0F2F5] dark:bg-[#18191A] p-1 rounded-xl border border-[#CED0D4] dark:border-white/10 text-xs font-bold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-[#60A5FA] shadow-xs font-black'
                  : 'text-[#65676B] dark:text-gray-400 hover:text-[#050505] dark:hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('scheduled')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'scheduled'
                  ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-[#60A5FA] shadow-xs font-black'
                  : 'text-[#65676B] dark:text-gray-400 hover:text-[#050505] dark:hover:text-white'
              }`}
            >
              Próximos
            </button>
            <button
              onClick={() => setFilter('finished')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filter === 'finished'
                  ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-[#60A5FA] shadow-xs font-black'
                  : 'text-[#65676B] dark:text-gray-400 hover:text-[#050505] dark:hover:text-white'
              }`}
            >
              Finalizados
            </button>
          </div>

          {/* New Match Button (Owner) */}
          {isOwner && (
            <button
              id="btn-new-match"
              onClick={() => {
                setEditingMatch(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t.calendar.newMatch}
            </button>
          )}
        </div>
      </div>

      {/* Live Match Alert Banner */}
      {matches.some((m) => m.status === 'live') && (
        <div className="bg-gradient-to-r from-rose-950/60 via-rose-900/40 to-black border border-rose-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-pulse">
          <div className="flex items-center gap-3 text-left w-full sm:w-auto">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
            <div>
              <p className="text-sm font-black text-white flex items-center gap-2">
                <span>PARTIDO EN JUEGO</span>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-500/30 text-rose-300 font-mono">
                  {matches.find((m) => m.status === 'live')?.rival}
                </span>
              </p>
              <p className="text-xs text-rose-200/80">
                Registra goles, cambios y tarjetas en tiempo real en el Modo Partido.
              </p>
            </div>
          </div>
          {isOwner && onStartLiveMatch && (
            <button
              onClick={() => {
                const liveM = matches.find((m) => m.status === 'live');
                if (liveM) onStartLiveMatch(liveM.id);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-rose-500/20 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Entrar al Modo Partido</span>
            </button>
          )}
        </div>
      )}

      {/* Match Cards List */}
      <div ref={calendarContainerRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredMatches.map((match) => {
          const modalityInfo = getModalityInfo(match.modality);
          const mvpActive = isMvpVoteAvailable(match);
          const minutesElapsed = getMinutesElapsed(match);
          const isReminded = activeReminders.includes(match.id);

              return (
            <div
              key={match.id}
              id={`match-card-${match.id}`}
              className="relative bg-white dark:bg-[#242526] rounded-2xl border border-[#CED0D4] dark:border-white/10 p-5 shadow-xs transition-all hover:border-[#1877F2]/40 space-y-4 text-[#050505] dark:text-white"
            >
              {/* Match Header: Status & Actions */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {match.status === 'live' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      {t.calendar.statusLive} ({minutesElapsed}')
                    </span>
                  ) : match.status === 'finished' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F0F2F5] dark:bg-white/5 text-[#65676B] dark:text-gray-300 border border-[#CED0D4] dark:border-white/10">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      {t.calendar.statusFinished}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E7F3FF] dark:bg-emerald-500/10 text-[#1877F2] dark:text-emerald-400 border border-[#1877F2]/20 dark:border-emerald-500/20">
                      <Clock className="w-3.5 h-3.5 text-[#1877F2] dark:text-emerald-400" />
                      {t.calendar.statusScheduled}
                    </span>
                  )}

                  {/* Modality & Duration Badge */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-400/10 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-400/20">
                    <Zap className="w-2.5 h-2.5" />
                    <span>{modalityInfo.label}</span>
                    <span className="text-amber-700/80 dark:text-amber-200/70 font-mono">({modalityInfo.halfMinutes}m/T)</span>
                  </span>

                  <span className="text-xs font-semibold text-[#65676B] dark:text-gray-400">
                    {match.date} • {match.time} hrs
                  </span>
                </div>

                {/* Owner controls: Edit / Delete */}
                {isOwner && (
                  <div className="flex items-center gap-1">
                    <button
                      id={`btn-edit-match-${match.id}`}
                      onClick={() => {
                        setEditingMatch(match);
                        setFormData({
                          rival: match.rival,
                          rivalLogo: match.rivalLogo,
                          date: match.date,
                          time: match.time,
                          stadium: match.stadium,
                          isHome: match.isHome,
                          modality: match.modality || 'fut7',
                        });
                        setShowAddModal(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-[#F0F2F5] text-[#65676B] hover:text-[#050505] transition-colors cursor-pointer"
                      title="Editar partido"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`btn-delete-match-${match.id}`}
                      onClick={() => handleDeleteMatch(match)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-[#65676B] hover:text-rose-600 transition-colors cursor-pointer"
                      title="Eliminar partido"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Teams & Scoreboard Visual - Full Names & Badges */}
              <div className="bg-[#F0F2F5] dark:bg-[#18191A] p-4 rounded-xl border border-[#E4E6EB] dark:border-white/10 flex items-center justify-between gap-3">
                {/* Our Team - Full Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=150&q=80';
                    }}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-[#1877F2]/30 shrink-0 shadow-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-black text-[#050505] dark:text-white leading-snug break-words">
                      {team.name}
                    </h4>
                    <span className="text-[10px] uppercase font-bold text-[#1877F2] dark:text-[#60A5FA] tracking-wider block mt-0.5">
                      {match.isHome ? t.calendar.local : t.calendar.visitor}
                    </span>
                  </div>
                </div>

                {/* Center Score or VS */}
                <div className="flex flex-col items-center justify-center px-2.5 sm:px-3 py-1.5 bg-white dark:bg-[#242526] rounded-xl border border-[#CED0D4] dark:border-white/10 shrink-0 min-w-[65px] sm:min-w-[75px] shadow-xs">
                  {match.scoreUs !== null && match.scoreThem !== null ? (
                    <div className="text-xl sm:text-2xl font-black font-sport tracking-wider text-[#050505] dark:text-white flex items-center">
                      <span className="text-[#1877F2] dark:text-emerald-400">{match.scoreUs}</span>
                      <span className="text-[#65676B] dark:text-gray-500 mx-1">-</span>
                      <span>{match.scoreThem}</span>
                    </div>
                  ) : (
                    <div className="text-base sm:text-lg font-black font-sport tracking-widest text-[#65676B] dark:text-gray-400">
                      VS
                    </div>
                  )}
                  <span className="text-[10px] text-[#65676B] dark:text-gray-400 font-bold mt-0.5">
                    {match.time}
                  </span>
                </div>

                {/* Rival Team - Full Name */}
                <div className="flex items-center justify-end gap-3 flex-1 min-w-0 text-right">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-black text-[#050505] dark:text-white leading-snug break-words">
                      {match.rival}
                    </h4>
                    <span className="text-[10px] uppercase font-bold text-[#65676B] dark:text-gray-400 tracking-wider block mt-0.5">
                      {!match.isHome ? t.calendar.local : t.calendar.visitor}
                    </span>
                  </div>
                  <img
                    src={match.rivalLogo}
                    alt={match.rival}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=150&q=80';
                    }}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-[#CED0D4] dark:border-white/10 shrink-0 shadow-xs"
                  />
                </div>
              </div>

              {/* Stadium & Scorers info */}
              <div className="flex items-center justify-between text-xs text-[#65676B] dark:text-gray-400">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#65676B] dark:text-gray-500 shrink-0" />
                  <span className="truncate font-medium">{match.stadium}</span>
                </div>

                {match.scorersUs.length > 0 && (
                  <div className="text-[11px] text-[#050505] dark:text-gray-300 font-semibold truncate ml-2">
                    ⚽ {match.scorersUs.map((s) => `${s.playerName.split(' ')[0]} (${s.minute}')`).join(', ')}
                  </div>
                )}
              </div>

              {/* 50-Minute MVP Rule Banner if active */}
              {/* MVP Section: Admin voting flow vs Player read-only badge */}
              {isOwner ? (
                mvpActive ? (
                  <div className="bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 animate-spin" />
                      <div>
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                          {match.mvpPlayerName
                            ? `MVP: ${match.mvpPlayerName}`
                            : '¡Votación de MVP Abierta! (+50m transcurridos)'}
                        </p>
                        <p className="text-[10px] text-amber-700/80 dark:text-amber-200/80">
                          {match.mvpPlayerName
                            ? 'Foto oficial capturada y archivada en su perfil'
                            : 'Vota al jugador destacado y toma su foto oficial con la cámara'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleGoToMvp(match.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shrink-0 shadow-xs transition-all cursor-pointer"
                    >
                      {match.mvpPlayerName ? 'Ver MVP' : t.calendar.voteMvp}
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#F0F2F5] dark:bg-black/40 border border-[#CED0D4] dark:border-white/5 rounded-xl p-2.5 text-[11px] text-[#65676B] dark:text-gray-400 flex items-center justify-between">
                    <span>Votación MVP: disponible a los 50 min de partido</span>
                    <span className="font-mono text-[#1877F2] dark:text-emerald-400 font-bold">{minutesElapsed > 0 ? `${minutesElapsed} min jugados` : 'Previa'}</span>
                  </div>
                )
              ) : (
                match.mvpPlayerName && (
                  <div className="bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 rounded-xl p-2.5 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>MVP Oficial: {match.mvpPlayerName}</span>
                  </div>
                )
              )}

              {/* Action Buttons: Strict RBAC for Players vs Owner */}
              <div className="flex items-center justify-between pt-3 border-t border-[#CED0D4] dark:border-white/5 gap-2 flex-wrap">
                {!isOwner ? (
                  /* Player Role: ONLY Recordatorio, Alineación, and Guardar Foto buttons */
                  <div className="flex items-center gap-2 flex-wrap w-full">
                    {/* 1. Recordatorio */}
                    <button
                      id={`btn-reminder-${match.id}`}
                      onClick={() => toggleMatchReminder(match)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        isReminded
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] border border-[#CED0D4]'
                      }`}
                      title="Activar recordatorio para el partido"
                    >
                      <Bell className={`w-3.5 h-3.5 ${isReminded ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                      <span>{isReminded ? 'Recordatorio Activo' : 'Recordatorio'}</span>
                    </button>

                    {/* 2. Alineación */}
                    <button
                      id={`btn-goto-lineup-${match.id}`}
                      onClick={() => onNavigateToLineup(match.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all cursor-pointer shadow-xs"
                      title="Ver alineación del partido"
                    >
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Alineación</span>
                    </button>

                    {/* 3. Guardar Foto */}
                    <button
                      id={`btn-download-img-${match.id}`}
                      onClick={() => handleDownloadMatchImage(match)}
                      disabled={downloadingMatchId === match.id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#E7F3FF] hover:bg-[#DBEAFE] text-[#1877F2] text-xs font-bold border border-[#1877F2]/30 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                      title="Descargar imagen oficial del partido"
                    >
                      <Download className="w-3.5 h-3.5 text-[#1877F2]" />
                      <span>{downloadingMatchId === match.id ? 'Guardando...' : 'Guardar Foto'}</span>
                    </button>
                  </div>
                ) : (
                  /* Owner Role: Full administrative tool suite */
                  <>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Download Match Photo / Image to Gallery Button */}
                      <button
                        id={`btn-download-img-${match.id}`}
                        onClick={() => handleDownloadMatchImage(match)}
                        disabled={downloadingMatchId === match.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#E7F3FF] dark:bg-[#1877F2]/20 hover:bg-[#DBEAFE] text-[#1877F2] dark:text-[#60A5FA] text-xs font-bold border border-[#1877F2]/30 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                        title="Descargar imagen del partido a tu galería"
                      >
                        <Download className="w-3.5 h-3.5 text-[#1877F2] dark:text-[#60A5FA]" />
                        <span>{downloadingMatchId === match.id ? 'Guardando...' : 'Guardar Foto'}</span>
                      </button>

                      {/* Push Notification Button */}
                      <button
                        id={`btn-reminder-${match.id}`}
                        onClick={() => toggleMatchReminder(match)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                          isReminded
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                            : 'bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-white/5 dark:hover:bg-white/10 text-[#050505] dark:text-gray-300 border border-[#CED0D4] dark:border-white/10'
                        }`}
                      >
                        <Bell className={`w-3.5 h-3.5 ${isReminded ? 'fill-emerald-500 text-emerald-500' : ''}`} />
                        {isReminded ? t.calendar.notified : t.calendar.notifyMe}
                      </button>

                      {/* Export PDF Button */}
                      <button
                        id={`btn-export-pdf-${match.id}`}
                        onClick={() => handleExportPdf(match)}
                        disabled={exportingPdfId === match.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-white/5 dark:hover:bg-white/10 text-[#050505] dark:text-white text-xs font-bold border border-[#CED0D4] dark:border-white/10 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                        title={t.calendar.exportPdf}
                      >
                        <FileDown className="w-3.5 h-3.5 text-[#1877F2] dark:text-emerald-400" />
                        <span>{exportingPdfId === match.id ? 'Generando...' : 'PDF'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Jump to Convocatoria flyer */}
                      <button
                        id={`btn-goto-convocatoria-${match.id}`}
                        onClick={() => onNavigateToConvocatoria(match.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E7F3FF] hover:bg-[#D0E7FF] text-[#1877F2] text-xs font-bold border border-[#1877F2]/30 transition-all cursor-pointer shadow-xs"
                        title="Ver afiche oficial de convocatoria para este partido"
                      >
                        <Users className="w-3.5 h-3.5 text-[#1877F2]" />
                        <span>Convocatoria</span>
                      </button>

                      {/* Jump to Lineup Pitch */}
                      <button
                        id={`btn-goto-lineup-${match.id}`}
                        onClick={() => onNavigateToLineup(match.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition-all cursor-pointer shadow-xs"
                        title="Ver y armar alineación táctica 7v7 en la cancha"
                      >
                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Alineación</span>
                      </button>

                      {/* Enter Live Match Mode */}
                      {onStartLiveMatch && (
                        <button
                          id={`btn-live-match-${match.id}`}
                          onClick={() => onStartLiveMatch(match.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                            match.status === 'live'
                              ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-md'
                              : match.status === 'finished'
                              ? 'bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] border border-[#CED0D4]'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                          }`}
                          title={
                            match.status === 'live'
                              ? 'Modo Partido en Vivo'
                              : match.status === 'finished'
                              ? 'Ver Resumen del Partido'
                              : 'Iniciar Modo Partido en Vivo'
                          }
                        >
                          <Zap
                            className={`w-3.5 h-3.5 ${
                              match.status === 'live' ? 'fill-white text-white' : 'text-rose-500'
                            }`}
                          />
                          <span>
                            {match.status === 'live'
                              ? 'Modo Partido'
                              : match.status === 'finished'
                              ? 'Resumen'
                              : 'Modo Partido'}
                          </span>
                        </button>
                      )}

                      {/* Owner: Record Score */}
                      <button
                        onClick={() => handleOpenResultModal(match)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] border border-[#CED0D4] text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        <Trophy className="w-3 h-3 text-amber-500" />
                        {t.calendar.recordResult}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Schedule / Edit Match */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#242526] border border-[#CED0D4] dark:border-white/10 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 text-[#050505] dark:text-white">
            <h3 className="text-lg font-black text-[#050505] dark:text-white">
              {editingMatch ? t.calendar.editMatch : t.calendar.newMatch}
            </h3>

            <form onSubmit={handleCreateOrUpdateMatch} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1">
                  Nombre del Rival
                </label>
                <input
                  type="text"
                  required
                  value={formData.rival}
                  onChange={(e) => setFormData({ ...formData, rival: e.target.value })}
                  placeholder="ej. Halcones FC, Toros FC..."
                  className="w-full px-3 py-2.5 bg-[#F0F2F5] dark:bg-[#18191A] border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-sm font-medium focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1">
                    {t.calendar.date}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F0F2F5] dark:bg-[#18191A] border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-sm font-medium focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1">
                    {t.calendar.time}
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F0F2F5] dark:bg-[#18191A] border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-sm font-medium focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1">
                  {t.calendar.stadium}
                </label>
                <input
                  type="text"
                  required
                  value={formData.stadium}
                  onChange={(e) => setFormData({ ...formData, stadium: e.target.value })}
                  placeholder="Cancha 2 - Deportivo Norte"
                  className="w-full px-3 py-2.5 bg-[#F0F2F5] dark:bg-[#18191A] border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-sm font-medium focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1">
                  Condición de Local / Visitante
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isHome: true })}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                      formData.isHome
                        ? 'bg-[#E7F3FF] dark:bg-[#1877F2]/20 border-[#1877F2] text-[#1877F2] dark:text-[#60A5FA]'
                        : 'bg-[#F0F2F5] dark:bg-black/50 border-[#CED0D4] dark:border-white/10 text-[#65676B] dark:text-gray-400'
                    }`}
                  >
                    {t.calendar.local} (Casa)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isHome: false })}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                      !formData.isHome
                        ? 'bg-[#E7F3FF] dark:bg-[#1877F2]/20 border-[#1877F2] text-[#1877F2] dark:text-[#60A5FA]'
                        : 'bg-[#F0F2F5] dark:bg-black/50 border-[#CED0D4] dark:border-white/10 text-[#65676B] dark:text-gray-400'
                    }`}
                  >
                    {t.calendar.visitor} (Fuera)
                  </button>
                </div>
              </div>

              {/* Modalidad de Juego */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1">
                  Modalidad de Juego (Duración por tiempo)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_MODALITIES.map((mod) => {
                    const isSelected = (formData.modality || 'fut7') === mod.id;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, modality: mod.id })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
                          isSelected
                            ? 'bg-[#E7F3FF] dark:bg-[#1877F2]/20 border-[#1877F2] text-[#050505] dark:text-white'
                            : 'bg-[#F0F2F5] dark:bg-black/50 border-[#CED0D4] dark:border-white/10 text-[#65676B] dark:text-gray-400 hover:text-[#050505] dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-black ${isSelected ? 'text-[#1877F2] dark:text-[#60A5FA]' : 'text-[#050505] dark:text-gray-300'}`}>
                            {mod.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-white dark:bg-white/10 font-mono font-bold text-[#65676B] dark:text-gray-300 border border-[#CED0D4]/60 dark:border-transparent">
                            {mod.halfMinutes}m/T
                          </span>
                        </div>
                        <p className="text-[10px] text-[#65676B] dark:text-gray-400 mt-0.5 font-medium">
                          {mod.durationNote}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#CED0D4] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-white/5 dark:hover:bg-white/10 text-[#050505] dark:text-gray-300 text-xs font-bold border border-[#CED0D4] dark:border-white/10 cursor-pointer shadow-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingMatch ? 'Actualizar' : 'Programar Partido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Match Result & Scorers */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#242526] border border-[#CED0D4] dark:border-white/10 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-[#050505] dark:text-white">
            <h3 className="text-lg font-black text-[#050505] dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              {t.calendar.recordResult}
            </h3>

            <div className="p-4 bg-[#F0F2F5] dark:bg-[#18191A] rounded-2xl border border-[#CED0D4] dark:border-white/10 text-center">
              <p className="text-xs text-[#65676B] dark:text-gray-400 font-semibold mb-2">Marcador Final Oficial</p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <span className="block text-xs font-black text-[#1877F2] dark:text-[#60A5FA] truncate max-w-[100px]">
                    {team.shortName}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={resultScoreUs}
                    onChange={(e) => setResultScoreUs(parseInt(e.target.value) || 0)}
                    className="w-16 h-14 bg-white dark:bg-[#242526] border-2 border-[#1877F2] rounded-xl text-center text-2xl font-black text-[#050505] dark:text-white font-sport mt-1 shadow-xs"
                  />
                </div>

                <span className="text-2xl font-black text-[#65676B] dark:text-gray-500">-</span>

                <div className="text-center">
                  <span className="block text-xs font-black text-[#65676B] dark:text-gray-400 truncate max-w-[100px]">
                    {showResultModal.rival}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={resultScoreThem}
                    onChange={(e) => setResultScoreThem(parseInt(e.target.value) || 0)}
                    className="w-16 h-14 bg-white dark:bg-[#242526] border-2 border-[#CED0D4] dark:border-white/10 rounded-xl text-center text-2xl font-black text-[#050505] dark:text-white font-sport mt-1 shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Goal Scorers Registration */}
            <div className="space-y-2">
              <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold">
                {t.calendar.scorers} ({team.shortName})
              </label>

              <div className="flex gap-2">
                <select
                  value={selectedScorerPlayerId}
                  onChange={(e) => setSelectedScorerPlayerId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#F0F2F5] dark:bg-[#18191A] border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-xs font-semibold focus:outline-none focus:border-[#1877F2]"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.number} {p.name} ({p.position})
                    </option>
                  ))}
                </select>

                <div className="w-24 flex items-center bg-[#F0F2F5] dark:bg-[#18191A] border border-[#CED0D4] dark:border-white/10 rounded-xl px-2">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={scorerMinute}
                    onChange={(e) => setScorerMinute(parseInt(e.target.value) || 1)}
                    className="w-full bg-transparent text-[#050505] dark:text-white text-xs font-bold text-center focus:outline-none"
                  />
                  <span className="text-[10px] text-[#65676B] dark:text-gray-500 font-bold">'</span>
                </div>

                <button
                  type="button"
                  onClick={handleAddScorer}
                  className="px-3.5 py-2 bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  + Gol
                </button>
              </div>

              {/* Scorers List */}
              <div className="space-y-1 mt-2">
                {scorersList.map((sc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0F2F5] dark:bg-black/50 text-xs border border-[#CED0D4] dark:border-white/5"
                  >
                    <span className="text-[#050505] dark:text-white font-semibold">
                      ⚽ {sc.playerName} <span className="text-[#1877F2] dark:text-[#60A5FA] font-bold">({sc.minute}')</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveScorer(idx)}
                      className="text-[#65676B] hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#CED0D4] dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowResultModal(null)}
                className="px-4 py-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-white/5 dark:hover:bg-white/10 text-[#050505] dark:text-gray-300 text-xs font-bold border border-[#CED0D4] dark:border-white/10 cursor-pointer shadow-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveResult}
                className="px-5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {t.calendar.saveResult}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Match Confirmation Modal */}
      {matchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#CED0D4] w-full max-w-sm rounded-2xl shadow-2xl p-6 text-[#050505] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-[#050505]">
                ¿Eliminar partido?
              </h3>
              <p className="text-xs text-[#65676B]">
                ¿Estás seguro de que deseas eliminar el partido contra{' '}
                <span className="font-bold text-[#050505]">{matchToDelete.rival}</span> (
                {matchToDelete.date})? Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMatchToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-match"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Match Photo HD Preview Modal */}
      {photoPreview && (
        <PhotoPreviewModal
          isOpen={photoPreview.isOpen}
          onClose={() => setPhotoPreview(null)}
          title={photoPreview.title}
          subtitle="Tarjeta oficial en alta definición con escudos, resultado y MVP"
          imageUrl={photoPreview.imageUrl}
          blob={photoPreview.blob}
          fileName={photoPreview.fileName}
        />
      )}
    </div>
  );
};
