import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trophy,
  Users,
  Clock,
  ArrowRightLeft,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Calendar,
  MapPin,
  Download,
  Trash2,
  ChevronRight,
  Shield,
  Sparkles,
  Award,
  X,
  Share2,
  Check,
  Zap,
} from 'lucide-react';
import { Match, MatchEvent, MatchEventType, MatchModality, TeamInfo, Player, AppUser, Language } from '../types';
import { getT } from '../utils/translations';
import { downloadElementAsImage } from '../utils/imageDownloader';
import { getModalityInfo, ALL_MODALITIES } from '../utils/modalityHelper';

interface LiveMatchModeProps {
  team: TeamInfo;
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  currentUser: AppUser;
  language: Language;
  selectedMatchId?: string;
  onOpenMvp?: (matchId: string) => void;
  onNavigateToLineup?: (matchId: string) => void;
  onBackToCalendar?: () => void;
}

export const LiveMatchMode: React.FC<LiveMatchModeProps> = ({
  team,
  matches,
  setMatches,
  players,
  setPlayers,
  currentUser,
  language,
  selectedMatchId,
  onOpenMvp,
  onNavigateToLineup,
  onBackToCalendar,
}) => {
  const t = getT(language);
  const isOwnerOrAdmin = currentUser.role === 'owner';

  // 1. Resolve current active match
  const activeMatch =
    matches.find((m) => m.id === selectedMatchId) ||
    matches.find((m) => m.status === 'live') ||
    matches.find((m) => m.status === 'scheduled') ||
    matches[0];

  const currentMatch = activeMatch;

  // Modality calculation: Fut 5, 7, 9 -> 20m halves; Fut 11 -> 45m halves
  const modalityInfo = getModalityInfo(currentMatch?.modality);
  const halfMinutes = modalityInfo.halfMinutes;
  const totalMinutes = modalityInfo.totalMinutes;
  const halfSeconds = modalityInfo.halfSeconds;
  const totalSeconds = modalityInfo.totalSeconds;

  // 2. Real-Time Stopwatch Clock state
  // Calculate initial seconds based on match start timestamp if live
  const calculateInitialSeconds = () => {
    if (currentMatch && currentMatch.status === 'live' && currentMatch.matchStartTimestamp) {
      const elapsed = Math.floor((Date.now() - currentMatch.matchStartTimestamp) / 1000);
      return Math.max(0, Math.min(elapsed, totalSeconds + 10 * 60));
    }
    return 0;
  };

  const [timerSeconds, setTimerSeconds] = useState<number>(calculateInitialSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(
    currentMatch?.status === 'live'
  );
  const [period, setPeriod] = useState<'1T' | 'HT' | '2T' | 'FT'>(() => {
    if (!currentMatch) return '1T';
    if (currentMatch.status === 'finished') return 'FT';
    const currentMins = Math.floor(calculateInitialSeconds() / 60);
    return currentMins >= halfMinutes ? '2T' : '1T';
  });

  // Synchronize clock & period whenever currentMatch id or modality changes
  useEffect(() => {
    if (currentMatch) {
      if (currentMatch.status === 'finished') {
        setPeriod('FT');
        setTimerSeconds(totalSeconds);
        setIsTimerRunning(false);
      } else if (currentMatch.status === 'live') {
        const initSec = calculateInitialSeconds();
        setTimerSeconds(initSec);
        setIsTimerRunning(true);
        const mins = Math.floor(initSec / 60);
        setPeriod(mins >= halfMinutes ? '2T' : '1T');
      } else {
        setTimerSeconds(0);
        setPeriod('1T');
        setIsTimerRunning(false);
      }
    }
  }, [currentMatch?.id, currentMatch?.modality, currentMatch?.status]);

  // Keep timer ticking every second
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Format MM:SS
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentMinute = Math.max(1, Math.floor(timerSeconds / 60) + 1);

  // 3. Modals for event recording
  const [activeModal, setActiveModal] = useState<MatchEventType | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [isDownloadingSummary, setIsDownloadingSummary] = useState<boolean>(false);
  const summaryCardRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 4. Form states for new event
  // Goal form
  const [goalTeam, setGoalTeam] = useState<'us' | 'them'>('us');
  const [goalScorerId, setGoalScorerId] = useState<string>('');
  const [goalRivalScorer, setGoalRivalScorer] = useState<string>('');
  const [goalAssistId, setGoalAssistId] = useState<string>('none');
  const [goalMinute, setGoalMinute] = useState<number>(currentMinute);

  // Substitution form
  const [subOutId, setSubOutId] = useState<string>('');
  const [subInId, setSubInId] = useState<string>('');
  const [subMinute, setSubMinute] = useState<number>(currentMinute);

  // Card form
  const [cardPlayerId, setCardPlayerId] = useState<string>('');
  const [cardMinute, setCardMinute] = useState<number>(currentMinute);
  const [cardReason, setCardReason] = useState<string>('Falta táctica');

  // Track players currently on pitch vs on bench based on lineup and substitutions
  const getPitchPlayers = () => {
    if (!currentMatch) return { starters: [], bench: [] };

    // Initial starters from match lineup or first 11 called-up
    const starterIds = new Set<string>(
      currentMatch.lineup && currentMatch.lineup.length > 0
        ? currentMatch.lineup.map((l) => l.playerId)
        : players.filter((p) => p.isStarter).map((p) => p.id)
    );

    // Apply recorded substitutions to starterIds
    const events = currentMatch.events || [];
    events.forEach((ev) => {
      if (ev.type === 'substitution') {
        if (ev.playerOutId) starterIds.delete(ev.playerOutId);
        if (ev.playerInId) starterIds.add(ev.playerInId);
      } else if (ev.type === 'red_card' && ev.playerId) {
        starterIds.delete(ev.playerId);
      }
    });

    const starters = players.filter((p) => starterIds.has(p.id));
    const bench = players.filter(
      (p) => !starterIds.has(p.id) && (currentMatch.calledUpPlayerIds?.includes(p.id) ?? true)
    );

    return { starters, bench };
  };

  const { starters: onPitchPlayers, bench: benchPlayers } = getPitchPlayers();

  // Reset modal forms when opening
  const openEventModal = (type: MatchEventType) => {
    setActiveModal(type);
    const min = Math.max(1, Math.floor(timerSeconds / 60) + 1);
    if (type === 'goal') {
      setGoalTeam('us');
      setGoalScorerId(onPitchPlayers[0]?.id || players[0]?.id || '');
      setGoalRivalScorer(`Jugador de ${currentMatch.rival}`);
      setGoalAssistId('none');
      setGoalMinute(min);
    } else if (type === 'substitution') {
      setSubOutId(onPitchPlayers[0]?.id || '');
      setSubInId(benchPlayers[0]?.id || '');
      setSubMinute(min);
    } else if (type === 'yellow_card') {
      setCardPlayerId(onPitchPlayers[0]?.id || players[0]?.id || '');
      setCardMinute(min);
      setCardReason('Falta táctica');
    } else if (type === 'red_card') {
      setCardPlayerId(onPitchPlayers[0]?.id || players[0]?.id || '');
      setCardMinute(min);
      setCardReason('Doble amonestación (2da Amarilla)');
    }
  };

  // Handle Recording a Goal
  const handleRecordGoal = () => {
    if (!currentMatch) return;

    let newScoreUs = currentMatch.scoreUs ?? 0;
    let newScoreThem = currentMatch.scoreThem ?? 0;
    let scorerName = '';
    let assistName: string | undefined = undefined;

    if (goalTeam === 'us') {
      newScoreUs += 1;
      const scorer = players.find((p) => p.id === goalScorerId);
      scorerName = scorer?.name || 'Jugador de Rayos';

      if (goalAssistId !== 'none') {
        const assistPlayer = players.find((p) => p.id === goalAssistId);
        assistName = assistPlayer?.name;
      }

      // Increment player stats
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === goalScorerId) {
            return { ...p, goals: p.goals + 1 };
          }
          if (goalAssistId !== 'none' && p.id === goalAssistId) {
            return { ...p, assists: p.assists + 1 };
          }
          return p;
        })
      );
    } else {
      newScoreThem += 1;
      scorerName = goalRivalScorer.trim() || `Jugador de ${currentMatch.rival}`;
    }

    const newEvent: MatchEvent = {
      id: `ev_${Date.now()}`,
      type: 'goal',
      minute: Number(goalMinute) || currentMinute,
      period: period === '2T' ? '2T' : '1T',
      team: goalTeam,
      playerId: goalTeam === 'us' ? goalScorerId : undefined,
      playerName: scorerName,
      assistPlayerId: goalTeam === 'us' && goalAssistId !== 'none' ? goalAssistId : undefined,
      assistPlayerName: assistName,
      scoreSnapshot: { scoreUs: newScoreUs, scoreThem: newScoreThem },
      timestamp: Date.now(),
    };

    // Update match
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === currentMatch.id) {
          const updatedEvents = [...(m.events || []), newEvent];
          const updatedScorers =
            goalTeam === 'us'
              ? [
                  ...m.scorersUs,
                  {
                    playerId: goalScorerId,
                    playerName: scorerName,
                    minute: Number(goalMinute) || currentMinute,
                    assistPlayerName: assistName,
                  },
                ]
              : m.scorersUs;

          return {
            ...m,
            status: m.status === 'scheduled' ? 'live' : m.status,
            scoreUs: newScoreUs,
            scoreThem: newScoreThem,
            scorersUs: updatedScorers,
            events: updatedEvents,
          };
        }
        return m;
      })
    );

    setActiveModal(null);
    showToast(
      goalTeam === 'us'
        ? `⚽ ¡GOOOL de ${scorerName}! (${newScoreUs} - ${newScoreThem})`
        : `⚽ Gol de ${currentMatch.rival} (${newScoreUs} - ${newScoreThem})`
    );
  };

  // Handle Recording a Substitution
  const handleRecordSubstitution = () => {
    if (!currentMatch) return;
    const playerOut = players.find((p) => p.id === subOutId);
    const playerIn = players.find((p) => p.id === subInId);

    if (!playerOut || !playerIn) {
      alert('Por favor selecciona tanto el jugador que sale como el que entra.');
      return;
    }

    const newEvent: MatchEvent = {
      id: `ev_${Date.now()}`,
      type: 'substitution',
      minute: Number(subMinute) || currentMinute,
      period: period === '2T' ? '2T' : '1T',
      team: 'us',
      playerOutId: playerOut.id,
      playerOutName: playerOut.name,
      playerInId: playerIn.id,
      playerInName: playerIn.name,
      timestamp: Date.now(),
    };

    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === currentMatch.id) {
          return {
            ...m,
            events: [...(m.events || []), newEvent],
          };
        }
        return m;
      })
    );

    setActiveModal(null);
    showToast(`🔄 Cambio: Sale ${playerOut.name} ➡️ Entra ${playerIn.name}`);
  };

  // Handle Recording a Yellow or Red Card
  const handleRecordCard = (type: 'yellow_card' | 'red_card') => {
    if (!currentMatch) return;
    const player = players.find((p) => p.id === cardPlayerId);
    if (!player) return;

    const newEvent: MatchEvent = {
      id: `ev_${Date.now()}`,
      type,
      minute: Number(cardMinute) || currentMinute,
      period: period === '2T' ? '2T' : '1T',
      team: 'us',
      playerId: player.id,
      playerName: player.name,
      cardType: type === 'yellow_card' ? 'yellow' : 'red',
      note: cardReason,
      timestamp: Date.now(),
    };

    // Update player card counts
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === player.id) {
          return {
            ...p,
            yellowCards: type === 'yellow_card' ? p.yellowCards + 1 : p.yellowCards,
            redCards: type === 'red_card' ? p.redCards + 1 : p.redCards,
          };
        }
        return p;
      })
    );

    // Update match
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === currentMatch.id) {
          return {
            ...m,
            events: [...(m.events || []), newEvent],
          };
        }
        return m;
      })
    );

    setActiveModal(null);
    showToast(
      type === 'yellow_card'
        ? `🟨 Tarjeta Amarilla para ${player.name} (${cardReason})`
        : `🟥 Tarjeta Roja para ${player.name} (${cardReason})`
    );
  };

  // Undo / Delete Event
  const handleDeleteEvent = (eventToDelete: MatchEvent) => {
    if (!confirm('¿Deseas anular o eliminar este registro de la línea de tiempo?')) return;

    // If goal, revert score
    let scoreUsAdj = 0;
    let scoreThemAdj = 0;
    if (eventToDelete.type === 'goal') {
      if (eventToDelete.team === 'us') scoreUsAdj = -1;
      else scoreThemAdj = -1;

      // Revert player goals
      if (eventToDelete.playerId) {
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === eventToDelete.playerId ? { ...p, goals: Math.max(0, p.goals - 1) } : p
          )
        );
      }
    } else if (eventToDelete.type === 'yellow_card' && eventToDelete.playerId) {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === eventToDelete.playerId ? { ...p, yellowCards: Math.max(0, p.yellowCards - 1) } : p
        )
      );
    } else if (eventToDelete.type === 'red_card' && eventToDelete.playerId) {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === eventToDelete.playerId ? { ...p, redCards: Math.max(0, p.redCards - 1) } : p
        )
      );
    }

    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === currentMatch.id) {
          const updatedEvents = (m.events || []).filter((e) => e.id !== eventToDelete.id);
          const updatedScorers =
            eventToDelete.type === 'goal' && eventToDelete.team === 'us'
              ? m.scorersUs.filter(
                  (s) => !(s.playerId === eventToDelete.playerId && s.minute === eventToDelete.minute)
                )
              : m.scorersUs;

          return {
            ...m,
            scoreUs: Math.max(0, (m.scoreUs ?? 0) + scoreUsAdj),
            scoreThem: Math.max(0, (m.scoreThem ?? 0) + scoreThemAdj),
            scorersUs: updatedScorers,
            events: updatedEvents,
          };
        }
        return m;
      })
    );

    showToast('Evento eliminado del registro');
  };

  // Quick modality switch for the match
  const handleUpdateModality = (mod: MatchModality) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === currentMatch.id ? { ...m, modality: mod } : m))
    );
    const info = getModalityInfo(mod);
    showToast(`Modalidad: ${info.label} (${info.description})`);
  };

  // Period management actions
  const handleStart1T = () => {
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setPeriod('1T');
    setMatches((prev) =>
      prev.map((m) =>
        m.id === currentMatch.id
          ? {
              ...m,
              status: 'live',
              matchStartTimestamp: Date.now(),
              scoreUs: m.scoreUs ?? 0,
              scoreThem: m.scoreThem ?? 0,
            }
          : m
      )
    );
    showToast(`⏱️ ¡Silbatazo inicial! Comienza el 1er Tiempo (0 - ${halfMinutes} min)`);
  };

  const handleHalfTime = () => {
    setIsTimerRunning(false);
    setPeriod('HT');
    setTimerSeconds(halfSeconds);
    showToast(`⏸️ Fin del 1er Tiempo (${halfMinutes}:00). Descanso / Entretiempo`);
  };

  const handleStart2T = () => {
    setTimerSeconds(halfSeconds);
    setIsTimerRunning(true);
    setPeriod('2T');
    showToast(`⏱️ ¡Inicia el 2do Tiempo! (${halfMinutes}' a ${totalMinutes}')`);
  };

  const handleFinishMatch = () => {
    setIsTimerRunning(false);
    setPeriod('FT');
    setMatches((prev) =>
      prev.map((m) => (m.id === currentMatch.id ? { ...m, status: 'finished' } : m))
    );
    setShowSummaryModal(true);
  };

  // Download official match summary graphic card
  const handleDownloadSummary = async () => {
    if (!summaryCardRef.current || !currentMatch) return;
    setIsDownloadingSummary(true);
    try {
      await downloadElementAsImage(summaryCardRef.current, {
        fileName: `resumen_${team.shortName}_vs_${currentMatch.rival.replace(/\s+/g, '_')}_${currentMatch.date}.png`,
        backgroundColor: '#0A0A0B',
        scale: 2.5,
      });
      showToast('📸 ¡Resumen del partido guardado en tu galería!');
    } catch (err) {
      console.error(err);
      alert('No se pudo guardar la imagen del resumen.');
    } finally {
      setIsDownloadingSummary(false);
    }
  };

  const sortedEvents = [...(currentMatch?.events || [])].sort((a, b) => b.minute - a.minute);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500 text-black font-extrabold text-sm rounded-xl shadow-2xl border-2 border-white/20 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-black" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Controls & Match Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#242526] p-4 sm:p-5 rounded-2xl border border-[#CED0D4] dark:border-white/10 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <Activity className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-[#050505] dark:text-white uppercase tracking-tight">
                  Modo Partido en Tiempo Real
                </h2>
                {currentMatch.status === 'live' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] tracking-wider animate-pulse flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    EN VIVO
                  </span>
                )}
                {currentMatch.status === 'finished' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E4E6EB] dark:bg-gray-700 text-[#050505] dark:text-gray-300 font-extrabold text-[10px] tracking-wider">
                    FINALIZADO
                  </span>
                )}
              </div>
              <p className="text-xs text-[#65676B] dark:text-gray-400 font-medium">
                Registra goles, sustituciones, tarjetas en vivo y genera el resumen oficial del partido
              </p>
            </div>
          </div>
        </div>

        {/* Match Picker Dropdown if multiple */}
        <div className="flex items-center gap-2 flex-wrap">
          {matches.length > 1 && (
            <select
              value={currentMatch.id}
              onChange={(e) => {
                const selected = matches.find((m) => m.id === e.target.value);
                if (selected) {
                  // Switch match
                  setMatches((prev) => [...prev]);
                }
              }}
              className="bg-[#F0F2F5] dark:bg-black/60 border border-[#CED0D4] dark:border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-[#050505] dark:text-white focus:outline-none focus:border-[#1877F2]"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  vs {m.rival} ({m.date} - {m.status.toUpperCase()})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowSummaryModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-white/10 dark:hover:bg-white/15 text-[#050505] dark:text-white text-xs font-bold border border-[#CED0D4] dark:border-white/15 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            title="Ver Resumen Oficial del Partido"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Ver Resumen</span>
          </button>

          {onBackToCalendar && (
            <button
              onClick={onBackToCalendar}
              className="px-3 py-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-white/5 dark:hover:bg-white/10 text-[#65676B] dark:text-gray-400 hover:text-[#050505] dark:hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Volver al Calendario
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. SCOREBOARD & OFFICIAL MATCH CLOCK                       */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#CED0D4] dark:border-white/15 p-5 sm:p-7 shadow-xs relative overflow-hidden transition-colors">
        {/* Glow ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-rose-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Tournament & Stadium badge & Modality */}
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#65676B] dark:text-gray-400 mb-4 flex-wrap justify-center">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/20">
              <Shield className="w-3.5 h-3.5" />
              {team.leagueName}
            </span>
            <span className="flex items-center gap-1 text-[#65676B] dark:text-gray-400 bg-[#F0F2F5] dark:bg-white/5 px-2.5 py-1 rounded-full border border-[#CED0D4] dark:border-white/10">
              <MapPin className="w-3.5 h-3.5 text-[#65676B] dark:text-gray-500" />
              {currentMatch.stadium}
            </span>
            {/* Dynamic Modality Indicator */}
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-400/25 font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{modalityInfo.label}</span>
              <span className="text-amber-700/70 dark:text-amber-200/70 text-[10px]">({halfMinutes}m/T • {totalMinutes}m total)</span>
            </span>
          </div>

          {/* Quick Modality Switcher (Fut 5, Fut 7, Fut 9, Fut 11) */}
          {isOwnerOrAdmin && (
            <div className="mb-4 flex items-center gap-1.5 p-1 bg-[#F0F2F5] dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-xl flex-wrap justify-center">
              <span className="text-[10px] uppercase font-bold text-[#65676B] dark:text-gray-400 px-2">Modalidad:</span>
              {ALL_MODALITIES.map((mod) => {
                const isActive = (currentMatch.modality || 'fut11') === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => handleUpdateModality(mod.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#1877F2] text-white shadow-xs'
                        : 'bg-white dark:bg-white/5 text-[#050505] dark:text-gray-300 hover:bg-[#E4E6EB] dark:hover:bg-white/10'
                    }`}
                    title={mod.durationNote}
                  >
                    <span>{mod.name}</span>
                    <span className="ml-1 opacity-75 text-[10px]">
                      {mod.id === 'fut11' ? '45m' : '20m'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Teams and Scoreboard Grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Team 1: Our Team */}
            <div className="flex items-center md:justify-end gap-3 sm:gap-4 order-1 md:order-1 text-left md:text-right">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">
                  {currentMatch.isHome ? 'LOCAL' : 'VISITANTE'}
                </span>
                <h3 className="text-base sm:text-xl font-black text-[#050505] dark:text-white uppercase tracking-tight truncate">
                  {team.name}
                </h3>
                <span className="text-xs text-[#65676B] dark:text-gray-400 font-bold font-mono">
                  {team.shortName}
                </span>
              </div>
              <img
                src={team.logoUrl}
                alt={team.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md shrink-0 ring-1 ring-[#CED0D4] dark:ring-white/10"
              />
            </div>

            {/* Score Center & Stopwatch */}
            <div className="flex flex-col items-center justify-center order-3 md:order-2 bg-[#F0F2F5] dark:bg-black/60 border border-[#CED0D4] dark:border-white/10 rounded-2xl p-4 shadow-xs">
              {/* Score digits */}
              <div className="flex items-center justify-center gap-4 text-4xl sm:text-5xl font-black font-sport text-[#050505] dark:text-white tracking-widest">
                <span className="text-emerald-600 dark:text-emerald-400">{currentMatch.scoreUs ?? 0}</span>
                <span className="text-[#CED0D4] dark:text-gray-600 text-3xl font-normal">-</span>
                <span className="text-[#050505] dark:text-white">{currentMatch.scoreThem ?? 0}</span>
              </div>

              {/* Digital Match Clock */}
              <div className="mt-3 flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`font-mono text-xl sm:text-2xl font-black px-3 py-1 rounded-xl border flex items-center gap-2 ${
                      isTimerRunning
                        ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
                        : 'bg-white dark:bg-white/5 text-[#050505] dark:text-gray-300 border border-[#CED0D4] dark:border-white/10'
                    }`}
                  >
                    <Clock className={`w-4 h-4 ${isTimerRunning ? 'animate-spin' : ''}`} />
                    <span>{formatTimer(timerSeconds)}</span>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-white/10 text-[#050505] dark:text-white font-extrabold text-xs border border-[#CED0D4] dark:border-white/10">
                    {period}
                  </span>
                </div>

                {/* Clock quick adjustments */}
                {isOwnerOrAdmin && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      onClick={() => setTimerSeconds((s) => Math.max(0, s - 60))}
                      className="px-2 py-0.5 rounded bg-white dark:bg-white/5 hover:bg-[#E4E6EB] dark:hover:bg-white/10 text-[10px] text-[#65676B] dark:text-gray-400 font-mono border border-[#CED0D4] dark:border-white/10 cursor-pointer"
                      title="Restar 1 minuto"
                    >
                      -1'
                    </button>
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`p-1.5 rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-all ${
                        isTimerRunning
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/30'
                          : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30'
                      }`}
                      title={isTimerRunning ? 'Pausar tiempo' : 'Iniciar / Reanudar'}
                    >
                      {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setTimerSeconds((s) => s + 60)}
                      className="px-2 py-0.5 rounded bg-white dark:bg-white/5 hover:bg-[#E4E6EB] dark:hover:bg-white/10 text-[10px] text-[#65676B] dark:text-gray-400 font-mono border border-[#CED0D4] dark:border-white/10 cursor-pointer"
                      title="Sumar 1 minuto"
                    >
                      +1'
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Team 2: Rival Team */}
            <div className="flex items-center justify-start gap-3 sm:gap-4 order-2 md:order-3 text-left">
              <img
                src={currentMatch.rivalLogo}
                alt={currentMatch.rival}
                referrerPolicy="no-referrer"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-[#CED0D4] dark:border-white/20 shadow-md shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase text-[#65676B] dark:text-gray-400 tracking-wider block">
                  {!currentMatch.isHome ? 'LOCAL' : 'VISITANTE'}
                </span>
                <h3 className="text-base sm:text-xl font-black text-[#050505] dark:text-white uppercase tracking-tight truncate">
                  {currentMatch.rival}
                </h3>
                <span className="text-xs text-[#65676B] dark:text-gray-400 font-bold">Rival de Liga</span>
              </div>
            </div>
          </div>

          {/* Match Stage & Period Buttons */}
          {isOwnerOrAdmin && (
            <div className="mt-5 pt-4 border-t border-[#CED0D4] dark:border-white/10 w-full flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={handleStart1T}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === '1T' && isTimerRunning
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-white/5 dark:hover:bg-white/10 text-[#050505] dark:text-gray-300 border border-[#CED0D4] dark:border-white/10'
                }`}
              >
                ▶ Iniciar 1T (00:00)
              </button>

              <button
                onClick={handleHalfTime}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === 'HT'
                    ? 'bg-amber-400 text-black shadow-xs'
                    : 'bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-white/5 dark:hover:bg-white/10 text-[#050505] dark:text-gray-300 border border-[#CED0D4] dark:border-white/10'
                }`}
              >
                ⏸ Entretiempo ({halfMinutes}:00)
              </button>

              <button
                onClick={handleStart2T}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  period === '2T' && isTimerRunning
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-white/5 dark:hover:bg-white/10 text-[#050505] dark:text-gray-300 border border-[#CED0D4] dark:border-white/10'
                }`}
              >
                ▶ Iniciar 2T ({halfMinutes}:00)
              </button>

              <button
                onClick={handleFinishMatch}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Finalizar Partido ({totalMinutes}')</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. REAL-TIME EVENT ACTION BAR                              */}
      {/* ========================================================= */}
      {isOwnerOrAdmin && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#050505] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-500" />
              Registrar Incidencia en Vivo
            </h3>
            <span className="text-[11px] text-[#65676B] dark:text-gray-400 font-mono">
              Minuto actual: <strong className="text-emerald-600 dark:text-emerald-400">{currentMinute}'</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Goal Button */}
            <button
              id="btn-live-goal"
              onClick={() => openEventModal('goal')}
              className="p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 hover:border-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all text-left group cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">⚽</span>
                <span className="p-1 rounded-lg bg-emerald-500 text-white font-black text-[10px]">
                  + GOL
                </span>
              </div>
              <h4 className="text-sm font-black text-[#050505] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                Anotar Gol
              </h4>
              <p className="text-[10px] text-[#65676B] dark:text-gray-400 mt-0.5 font-medium">
                Goleador, asistencia y minuto
              </p>
            </button>

            {/* Substitution Button */}
            <button
              id="btn-live-sub"
              onClick={() => openEventModal('substitution')}
              className="p-4 rounded-2xl bg-blue-50 hover:bg-blue-100/70 dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-blue-950/40 border border-blue-300 dark:border-blue-500/40 hover:border-blue-400 hover:scale-[1.02] active:scale-[0.98] transition-all text-left group cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <ArrowRightLeft className="w-6 h-6 text-blue-500" />
                <span className="p-1 rounded-lg bg-blue-500 text-white font-black text-[10px]">
                  + CAMBIO
                </span>
              </div>
              <h4 className="text-sm font-black text-[#050505] dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300">
                Sustitución
              </h4>
              <p className="text-[10px] text-[#65676B] dark:text-gray-400 mt-0.5 font-medium">
                Entra suplente, sale titular
              </p>
            </button>

            {/* Yellow Card Button */}
            <button
              id="btn-live-yellow"
              onClick={() => openEventModal('yellow_card')}
              className="p-4 rounded-2xl bg-amber-50 hover:bg-amber-100/70 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-amber-950/40 border border-amber-300 dark:border-amber-500/40 hover:border-amber-400 hover:scale-[1.02] active:scale-[0.98] transition-all text-left group cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-5 h-7 rounded bg-amber-400 border border-amber-300 shadow-xs" />
                <span className="p-1 rounded-lg bg-amber-400 text-black font-black text-[10px]">
                  + AMARILLA
                </span>
              </div>
              <h4 className="text-sm font-black text-[#050505] dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-300">
                Tarjeta Amarilla
              </h4>
              <p className="text-[10px] text-[#65676B] dark:text-gray-400 mt-0.5 font-medium">
                Amonestación con motivo
              </p>
            </button>

            {/* Red Card Button */}
            <button
              id="btn-live-red"
              onClick={() => openEventModal('red_card')}
              className="p-4 rounded-2xl bg-rose-50 hover:bg-rose-100/70 dark:bg-gradient-to-br dark:from-rose-500/20 dark:to-rose-950/40 border border-rose-300 dark:border-rose-500/40 hover:border-rose-400 hover:scale-[1.02] active:scale-[0.98] transition-all text-left group cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-5 h-7 rounded bg-rose-600 border border-rose-400 shadow-xs" />
                <span className="p-1 rounded-lg bg-rose-500 text-white font-black text-[10px]">
                  + ROJA
                </span>
              </div>
              <h4 className="text-sm font-black text-[#050505] dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-300">
                Tarjeta Roja
              </h4>
              <p className="text-[10px] text-[#65676B] dark:text-gray-400 mt-0.5 font-medium">
                Expulsión directa o 2da amarilla
              </p>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MINUTO A MINUTO (EVENT TIMELINE) & ON PITCH SQUAD       */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Incidents Timeline (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#242526] rounded-2xl border border-[#CED0D4] dark:border-white/10 p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-[#CED0D4] dark:border-white/10 pb-3">
            <div>
              <h3 className="text-base font-black text-[#050505] dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1877F2]" />
                Minuto a Minuto del Partido
              </h3>
              <p className="text-xs text-[#65676B] dark:text-gray-400 font-medium">
                Registro cronológico oficial de incidencias en vivo
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#F0F2F5] dark:bg-white/5 text-[#050505] dark:text-gray-300 text-xs font-mono font-bold border border-[#CED0D4] dark:border-white/10">
              {currentMatch.events?.length || 0} Eventos
            </span>
          </div>

          {/* Timeline Feed */}
          {sortedEvents.length === 0 ? (
            <div className="p-8 text-center bg-[#F0F2F5] dark:bg-black/40 rounded-xl border border-[#CED0D4]/70 dark:border-white/5 space-y-2">
              <Clock className="w-10 h-10 text-[#65676B] dark:text-gray-600 mx-auto" />
              <h4 className="text-sm font-bold text-[#050505] dark:text-gray-400">
                Aún no hay incidencias registradas
              </h4>
              <p className="text-xs text-[#65676B] dark:text-gray-500 max-w-sm mx-auto">
                Usa los botones superiores para registrar goles, sustituciones o tarjetas a medida que ocurran en el terreno de juego.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedEvents.map((ev) => {
                const isUs = ev.team === 'us';

                return (
                  <div
                    key={ev.id}
                    className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                      ev.type === 'goal'
                        ? isUs
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30'
                          : 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30'
                        : ev.type === 'yellow_card'
                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30'
                        : ev.type === 'red_card'
                        ? 'bg-rose-50 dark:bg-rose-600/15 border-rose-400 dark:border-rose-600/40'
                        : 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30'
                    }`}
                  >
                    {/* Left: Minute Badge & Event Description */}
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Minute badge */}
                      <div className="px-2.5 py-1 rounded-lg bg-[#050505] text-white dark:bg-black/60 border border-white/10 font-mono font-black text-sm shrink-0">
                        {ev.minute}'
                      </div>

                      {/* Icon */}
                      <div className="pt-0.5 shrink-0">
                        {ev.type === 'goal' && <span className="text-xl">⚽</span>}
                        {ev.type === 'substitution' && (
                          <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                        )}
                        {ev.type === 'yellow_card' && (
                          <div className="w-4 h-6 rounded-xs bg-amber-400 border border-amber-300 shadow-xs" />
                        )}
                        {ev.type === 'red_card' && (
                          <div className="w-4 h-6 rounded-xs bg-rose-600 border border-rose-400 shadow-xs" />
                        )}
                      </div>

                      {/* Text details */}
                      <div className="min-w-0">
                        {ev.type === 'goal' && (
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-[#050505] dark:text-white">
                                {ev.playerName}
                              </span>
                              {ev.scoreSnapshot && (
                                <span className="px-2 py-0.5 rounded bg-white dark:bg-black/60 font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 border border-[#CED0D4] dark:border-white/10">
                                  {ev.scoreSnapshot.scoreUs} - {ev.scoreSnapshot.scoreThem}
                                </span>
                              )}
                            </div>
                            {ev.assistPlayerName && (
                              <p className="text-xs text-[#65676B] dark:text-gray-400 mt-0.5 font-medium">
                                Asistencia: <strong>{ev.assistPlayerName}</strong>
                              </p>
                            )}
                            <span className="text-[10px] text-[#65676B] dark:text-gray-500 uppercase font-semibold">
                              {isUs ? team.shortName : currentMatch.rival} • {ev.period}
                            </span>
                          </div>
                        )}

                        {ev.type === 'substitution' && (
                          <div>
                            <div className="flex items-center gap-2 text-xs font-bold text-[#050505] dark:text-white flex-wrap">
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                ⬆ {ev.playerInName}
                              </span>
                              <span className="text-[#65676B] dark:text-gray-500">por</span>
                              <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                ⬇ {ev.playerOutName}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#65676B] dark:text-gray-500 uppercase font-semibold">
                              Sustitución táctica • {ev.period}
                            </span>
                          </div>
                        )}

                        {(ev.type === 'yellow_card' || ev.type === 'red_card') && (
                          <div>
                            <span className="text-sm font-bold text-[#050505] dark:text-white block">
                              {ev.playerName}
                            </span>
                            {ev.note && (
                              <p className="text-xs text-[#65676B] dark:text-gray-400 mt-0.5 font-medium">
                                Motivo: {ev.note}
                              </p>
                            )}
                            <span className="text-[10px] text-[#65676B] dark:text-gray-500 uppercase font-semibold">
                              {ev.type === 'yellow_card' ? 'Amonestación' : 'Expulsión'} • {ev.period}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Delete action for owners */}
                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => handleDeleteEvent(ev)}
                        className="p-1.5 rounded-lg text-[#65676B] hover:text-rose-500 hover:bg-[#E4E6EB] dark:hover:bg-white/5 transition-colors shrink-0 ml-2 cursor-pointer"
                        title="Eliminar este evento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Squad Status: On-Pitch vs Bench (1 col) */}
        <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#CED0D4] dark:border-white/10 p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-[#CED0D4] dark:border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-black text-[#050505] dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1877F2]" />
                Plantilla en Tiempo Real
              </h3>
              <p className="text-xs text-[#65676B] dark:text-gray-400 font-medium">
                En cancha ({onPitchPlayers.length}) vs Banca ({benchPlayers.length})
              </p>
            </div>
            {onNavigateToLineup && (
              <button
                onClick={() => onNavigateToLineup(currentMatch.id)}
                className="text-[11px] text-[#1877F2] dark:text-emerald-400 hover:underline font-bold cursor-pointer"
              >
                Pizarra
              </button>
            )}
          </div>

          {/* On Pitch Players */}
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block mb-2">
              🟢 En Terreno de Juego ({onPitchPlayers.length})
            </span>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {onPitchPlayers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#F0F2F5] dark:bg-black/40 border border-[#CED0D4]/70 dark:border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-[#CED0D4] dark:ring-white/10"
                    />
                    <span className="font-mono font-bold text-[#1877F2] dark:text-gray-400">#{p.number}</span>
                    <span className="font-bold text-[#050505] dark:text-white truncate">{p.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/10">
                    {p.position}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bench Players */}
          <div>
            <span className="text-[10px] font-black uppercase text-[#65676B] dark:text-gray-400 tracking-wider block mb-2">
              ⚪ En la Banca / Suplentes ({benchPlayers.length})
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {benchPlayers.length === 0 ? (
                <p className="text-xs text-[#65676B] dark:text-gray-500 italic">No hay suplentes en banca</p>
              ) : (
                benchPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#F0F2F5]/70 dark:bg-black/20 border border-[#CED0D4]/50 dark:border-white/5 text-xs opacity-85 hover:opacity-100"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={p.avatarUrl}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-[#CED0D4] dark:ring-white/10"
                      />
                      <span className="font-mono text-[#65676B] dark:text-gray-500">#{p.number}</span>
                      <span className="text-[#050505] dark:text-gray-300 font-medium truncate">{p.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#65676B] dark:text-gray-400 font-bold px-1.5 py-0.5 rounded bg-[#E4E6EB] dark:bg-white/5">
                      {p.position}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: REGISTRAR GOL                                     */}
      {/* ========================================================= */}
      {activeModal === 'goal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#242526] border border-emerald-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#CED0D4] dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚽</span>
                <h3 className="text-base font-black text-[#050505] dark:text-white">Registrar Gol</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-[#65676B] hover:text-[#050505] dark:text-gray-400 dark:hover:text-white bg-[#F0F2F5] dark:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Team Picker */}
            <div>
              <label className="text-xs font-bold text-[#050505] dark:text-gray-200 block mb-1.5">
                ¿Qué equipo anotó?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGoalTeam('us')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    goalTeam === 'us'
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'bg-[#F0F2F5] dark:bg-black/40 border-[#CED0D4] dark:border-white/10 text-[#65676B] dark:text-gray-400'
                  }`}
                >
                  <img
                    src={team.logoUrl}
                    alt={team.shortName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span>{team.shortName} (Nosotros)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGoalTeam('them')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    goalTeam === 'them'
                      ? 'bg-rose-50 dark:bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300'
                      : 'bg-[#F0F2F5] dark:bg-black/40 border-[#CED0D4] dark:border-white/10 text-[#65676B] dark:text-gray-400'
                  }`}
                >
                  <img
                    src={currentMatch.rivalLogo}
                    alt={currentMatch.rival}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="truncate">{currentMatch.rival}</span>
                </button>
              </div>
            </div>

            {/* Scorer selection */}
            {goalTeam === 'us' ? (
              <>
                <div>
                  <label className="text-xs font-bold text-[#050505] dark:text-gray-200 block mb-1">
                    Goleador:
                  </label>
                  <select
                    value={goalScorerId}
                    onChange={(e) => setGoalScorerId(e.target.value)}
                    className="w-full bg-[#F0F2F5] dark:bg-black/60 border border-[#CED0D4] dark:border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#050505] dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.number} - {p.name} ({p.position})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#050505] dark:text-gray-200 block mb-1">
                    Pase / Asistencia (opcional):
                  </label>
                  <select
                    value={goalAssistId}
                    onChange={(e) => setGoalAssistId(e.target.value)}
                    className="w-full bg-[#F0F2F5] dark:bg-black/60 border border-[#CED0D4] dark:border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#050505] dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="none">Sin Asistencia (Jugada individual / Penal)</option>
                    {players
                      .filter((p) => p.id !== goalScorerId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.number} - {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label className="text-xs font-bold text-[#050505] dark:text-gray-200 block mb-1">
                  Nombre del anotador rival:
                </label>
                <input
                  type="text"
                  value={goalRivalScorer}
                  onChange={(e) => setGoalRivalScorer(e.target.value)}
                  placeholder="Ej. Martín Solares"
                  className="w-full bg-[#F0F2F5] dark:bg-black/60 border border-[#CED0D4] dark:border-white/15 rounded-xl px-3 py-2 text-xs text-[#050505] dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            {/* Minute */}
            <div>
              <label className="text-xs font-bold text-[#050505] dark:text-gray-200 block mb-1">
                Minuto del gol:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={goalMinute}
                  onChange={(e) => setGoalMinute(Number(e.target.value))}
                  className="w-24 bg-[#F0F2F5] dark:bg-black/60 border border-[#CED0D4] dark:border-white/15 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#050505] dark:text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-[#65676B] dark:text-gray-400">minutos de juego</span>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleRecordGoal}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Confirmar y Sumar al Marcador</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: REGISTRAR SUSTITUCIÓN                            */}
      {/* ========================================================= */}
      {activeModal === 'substitution' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-[#242526] border border-blue-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#CED0D4] dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-black text-[#050505] dark:text-white">Registrar Sustitución</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-[#65676B] hover:text-[#050505] dark:text-gray-400 dark:hover:text-white bg-[#F0F2F5] dark:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Player OUT */}
            <div>
              <label className="text-xs font-bold text-rose-600 dark:text-rose-400 block mb-1">
                ⬇ Jugador que SALE del terreno:
              </label>
              <select
                value={subOutId}
                onChange={(e) => setSubOutId(e.target.value)}
                className="w-full bg-[#F0F2F5] dark:bg-black/60 border border-[#CED0D4] dark:border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#050505] dark:text-white focus:outline-none focus:border-rose-500"
              >
                {onPitchPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} - {p.name} ({p.position})
                  </option>
                ))}
              </select>
            </div>

            {/* Player IN */}
            <div>
              <label className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                ⬆ Jugador que ENTRA desde la banca:
              </label>
              <select
                value={subInId}
                onChange={(e) => setSubInId(e.target.value)}
                className="w-full bg-[#F0F2F5] dark:bg-black/60 border border-[#CED0D4] dark:border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#050505] dark:text-white focus:outline-none focus:border-emerald-500"
              >
                {benchPlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} - {p.name} ({p.position})
                  </option>
                ))}
              </select>
            </div>

            {/* Minute */}
            <div>
              <label className="text-xs font-bold text-[#050505] dark:text-gray-200 block mb-1">
                Minuto del cambio:
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={subMinute}
                onChange={(e) => setSubMinute(Number(e.target.value))}
                className="w-24 bg-[#F0F2F5] dark:bg-black/60 border border-[#CED0D4] dark:border-white/15 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#050505] dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleRecordSubstitution}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Confirmar Cambio Táctico</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3 & 4: REGISTRAR TARJETAS (AMARILLA O ROJA)         */}
      {/* ========================================================= */}
      {(activeModal === 'yellow_card' || activeModal === 'red_card') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className={`relative w-full max-w-md bg-white dark:bg-[#242526] border rounded-2xl p-5 shadow-2xl space-y-4 ${
              activeModal === 'yellow_card' ? 'border-amber-400/40' : 'border-rose-500/40'
            }`}
          >
            <div className="flex items-center justify-between border-b border-[#CED0D4] dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-6 rounded-xs ${
                    activeModal === 'yellow_card' ? 'bg-amber-400' : 'bg-rose-600'
                  }`}
                />
                <h3 className="text-base font-black text-[#050505] dark:text-white">
                  {activeModal === 'yellow_card' ? 'Tarjeta Amarilla' : 'Tarjeta Roja'}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-[#65676B] hover:text-[#050505] dark:text-gray-400 dark:hover:text-white bg-[#F0F2F5] dark:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Player Selection */}
            <div>
              <label className="text-xs font-bold text-[#050505] dark:text-gray-200 block mb-1">
                Jugador sancionado:
              </label>
              <select
                value={cardPlayerId}
                onChange={(e) => setCardPlayerId(e.target.value)}
                className="w-full bg-[#F0F2F5] dark:bg-black/60 border border-[#CED0D4] dark:border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-[#050505] dark:text-white focus:outline-none focus:border-amber-400"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} - {p.name} ({p.position})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Reason Buttons */}
            <div>
              <label className="text-xs font-bold text-[#050505] dark:text-gray-200 block mb-1.5">
                Motivo de la sanción:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(activeModal === 'yellow_card'
                  ? [
                      'Falta táctica',
                      'Reclamos al árbitro',
                      'Mano voluntaria',
                      'Pérdida de tiempo',
                      'Conducta antideportiva',
                    ]
                  : [
                      'Doble amonestación (2da Amarilla)',
                      'Falta de último hombre',
                      'Conducta violenta',
                      'Insultos al cuerpo arbitral',
                    ]
                ).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCardReason(r)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      cardReason === r
                        ? activeModal === 'yellow_card'
                          ? 'bg-amber-400 text-black border-amber-300'
                          : 'bg-rose-600 text-white border-rose-400'
                        : 'bg-[#F0F2F5] dark:bg-white/5 text-[#65676B] dark:text-gray-400 border-[#CED0D4] dark:border-white/10 hover:text-[#050505] dark:hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Minute */}
            <div>
              <label className="text-xs font-bold text-[#050505] dark:text-gray-200 block mb-1">
                Minuto:
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={cardMinute}
                onChange={(e) => setCardMinute(Number(e.target.value))}
                className="w-24 bg-[#F0F2F5] dark:bg-black/60 border border-[#CED0D4] dark:border-white/15 rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#050505] dark:text-white focus:outline-none"
              />
            </div>

            {/* Submit */}
            <button
              onClick={() => handleRecordCard(activeModal as 'yellow_card' | 'red_card')}
              className={`w-full py-3 rounded-xl font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeModal === 'yellow_card'
                  ? 'bg-amber-400 hover:bg-amber-300 text-black'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              <span>Confirmar Sanción</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: RESUMEN OFICIAL DEL PARTIDO (DOWNLOADABLE CARD)   */}
      {/* ========================================================= */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#242526] border border-[#CED0D4] dark:border-white/15 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#CED0D4] dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-500 border border-amber-400/20">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#050505] dark:text-white">
                    Resumen Oficial del Encuentro
                  </h3>
                  <p className="text-xs text-[#65676B] dark:text-gray-400">
                    Ficha oficial lista para exportar y compartir en la galería
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-1.5 rounded-lg text-[#65676B] hover:text-[#050505] dark:text-gray-400 dark:hover:text-white bg-[#F0F2F5] dark:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* GRAPHIC RECAP POSTER (Capturable by html2canvas) */}
            <div
              ref={summaryCardRef}
              className="relative bg-gradient-to-b from-[#18181c] via-[#101012] to-[#0a0a0c] p-6 sm:p-8 rounded-2xl border-2 border-amber-400/30 shadow-2xl space-y-6 text-center overflow-hidden"
            >
              {/* Watermark Crest */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-5 pointer-events-none">
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  className="w-full h-full object-contain filter grayscale"
                />
              </div>

              {/* Poster Header */}
              <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 text-xs font-bold text-gray-400">
                <div className="flex items-center gap-2 text-left">
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    className="w-8 h-8 rounded-lg object-cover border border-emerald-400/40"
                  />
                  <div>
                    <span className="text-white font-extrabold uppercase block leading-tight">
                      {team.name}
                    </span>
                    <span className="text-[10px] text-emerald-400">
                      Temporada {team.season || '2026'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end mb-0.5">
                    <span className="text-amber-400 uppercase tracking-widest text-[10px] font-black">
                      {team.leagueName}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[9px] font-extrabold uppercase border border-amber-400/30">
                      {modalityInfo.label} ({halfMinutes}m/T)
                    </span>
                  </div>
                  <span className="text-gray-400 text-[11px] font-mono">
                    {currentMatch.date} • {currentMatch.stadium}
                  </span>
                </div>
              </div>

              {/* Match Result Scoreboard Display */}
              <div className="relative z-10 py-4 grid grid-cols-3 items-center gap-4">
                {/* Team 1 */}
                <div className="flex flex-col items-center">
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-400 shadow-xl"
                  />
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase mt-2 leading-tight">
                    {team.name}
                  </h4>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">
                    {currentMatch.isHome ? 'Local' : 'Visita'}
                  </span>
                </div>

                {/* Score */}
                <div className="flex flex-col items-center justify-center">
                  <div className="text-4xl sm:text-6xl font-black font-sport text-white tracking-widest flex items-center">
                    <span className="text-emerald-400">{currentMatch.scoreUs ?? 0}</span>
                    <span className="text-gray-600 mx-2">-</span>
                    <span>{currentMatch.scoreThem ?? 0}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-black text-xs uppercase tracking-wider mt-2 border border-emerald-500/30">
                    {currentMatch.status === 'finished' ? 'RESULTADO FINAL' : 'MARCADOR EN VIVO'}
                  </span>
                </div>

                {/* Rival Team */}
                <div className="flex flex-col items-center">
                  <img
                    src={currentMatch.rivalLogo}
                    alt={currentMatch.rival}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
                  />
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase mt-2 leading-tight">
                    {currentMatch.rival}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">
                    {!currentMatch.isHome ? 'Local' : 'Visita'}
                  </span>
                </div>
              </div>

              {/* Goals Summary Breakdown */}
              <div className="relative z-10 bg-black/50 rounded-xl p-4 border border-white/10 text-left space-y-3">
                <h5 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <span className="text-sm">⚽</span> Goles del Partido
                </h5>

                {currentMatch.events &&
                currentMatch.events.filter((e) => e.type === 'goal').length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Us goals */}
                    <div>
                      <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">
                        {team.shortName}:
                      </span>
                      <ul className="space-y-1">
                        {currentMatch.events
                          .filter((e) => e.type === 'goal' && e.team === 'us')
                          .map((g) => (
                            <li key={g.id} className="text-gray-200 flex items-center gap-1.5">
                              <span className="font-mono text-emerald-400 font-bold">{g.minute}'</span>
                              <strong className="text-white">{g.playerName}</strong>
                              {g.assistPlayerName && (
                                <span className="text-gray-500 text-[11px]">
                                  ({g.assistPlayerName})
                                </span>
                              )}
                            </li>
                          ))}
                        {currentMatch.events.filter((e) => e.type === 'goal' && e.team === 'us')
                          .length === 0 && (
                          <li className="text-gray-500 text-[11px] italic">Sin anotaciones</li>
                        )}
                      </ul>
                    </div>

                    {/* Rival goals */}
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                        {currentMatch.rival}:
                      </span>
                      <ul className="space-y-1">
                        {currentMatch.events
                          .filter((e) => e.type === 'goal' && e.team === 'them')
                          .map((g) => (
                            <li key={g.id} className="text-gray-200 flex items-center gap-1.5">
                              <span className="font-mono text-gray-400 font-bold">{g.minute}'</span>
                              <span>{g.playerName}</span>
                            </li>
                          ))}
                        {currentMatch.events.filter((e) => e.type === 'goal' && e.team === 'them')
                          .length === 0 && (
                          <li className="text-gray-500 text-[11px] italic">Sin anotaciones</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No hubo goles en el encuentro</p>
                )}
              </div>

              {/* Substitutions & Cards Summary */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {/* Substitutions */}
                <div className="bg-black/50 rounded-xl p-3 border border-white/10 text-xs">
                  <h6 className="text-[11px] font-black uppercase text-blue-400 flex items-center gap-1 mb-2">
                    <ArrowRightLeft className="w-3.5 h-3.5" /> Cambios Realizados
                  </h6>
                  <ul className="space-y-1.5 text-[11px]">
                    {currentMatch.events &&
                    currentMatch.events.filter((e) => e.type === 'substitution').length > 0 ? (
                      currentMatch.events
                        .filter((e) => e.type === 'substitution')
                        .map((s) => (
                          <li key={s.id} className="flex items-center gap-1 text-gray-300">
                            <span className="font-mono font-bold text-gray-400">{s.minute}'</span>
                            <span className="text-emerald-400 font-bold">⬆ {s.playerInName}</span>
                            <span className="text-gray-500">x</span>
                            <span className="text-rose-400">⬇ {s.playerOutName}</span>
                          </li>
                        ))
                    ) : (
                      <li className="text-gray-500 italic">Sin sustituciones</li>
                    )}
                  </ul>
                </div>

                {/* Cards */}
                <div className="bg-black/50 rounded-xl p-3 border border-white/10 text-xs">
                  <h6 className="text-[11px] font-black uppercase text-amber-400 flex items-center gap-1 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> Amonestaciones & Expulsiones
                  </h6>
                  <ul className="space-y-1.5 text-[11px]">
                    {currentMatch.events &&
                    currentMatch.events.filter(
                      (e) => e.type === 'yellow_card' || e.type === 'red_card'
                    ).length > 0 ? (
                      currentMatch.events
                        .filter((e) => e.type === 'yellow_card' || e.type === 'red_card')
                        .map((c) => (
                          <li key={c.id} className="flex items-center gap-1.5 text-gray-300">
                            <span className="font-mono font-bold text-gray-400">{c.minute}'</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                c.cardType === 'yellow'
                                  ? 'bg-amber-400 text-black'
                                  : 'bg-rose-600 text-white'
                              }`}
                            >
                              {c.cardType === 'yellow' ? 'Amarilla' : 'Roja'}
                            </span>
                            <strong className="text-white">{c.playerName}</strong>
                          </li>
                        ))
                    ) : (
                      <li className="text-gray-500 italic">Partido limpio, sin tarjetas</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Poster Footer Watermark */}
              <div className="relative z-10 pt-2 flex items-center justify-between border-t border-white/10 text-[10px] text-gray-500 font-mono">
                <span>TEAMGOL • REPORTE OFICIAL</span>
                <span>FECHA: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Action Buttons for the Summary */}
            <div className="flex items-center gap-3 pt-2">
              <button
                id="btn-download-match-summary"
                onClick={handleDownloadSummary}
                disabled={isDownloadingSummary}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-500 text-black font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4 text-black shrink-0" />
                <span>
                  {isDownloadingSummary
                    ? 'Guardando en Galería...'
                    : 'Descargar Resumen Gráfico (Guardar en Galería)'}
                </span>
              </button>

              {onOpenMvp && (
                <button
                  onClick={() => {
                    setShowSummaryModal(false);
                    onOpenMvp(currentMatch.id);
                  }}
                  className="px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm flex items-center gap-1.5 transition-all shadow-lg shrink-0 cursor-pointer"
                >
                  <Award className="w-4 h-4 text-black" />
                  <span>Votar MVP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
