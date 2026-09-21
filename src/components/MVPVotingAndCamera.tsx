import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Camera,
  Trophy,
  CheckCircle2,
  Clock,
  RotateCcw,
  Upload,
  User,
  Star,
  Flame,
  AlertTriangle,
  Award,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Match, Player, AppUser, Language, MVPRecord, TeamInfo } from '../types';
import { getT } from '../utils/translations';
import { downloadElementAsImage } from '../utils/imageDownloader';
import { PhotoPreviewModal } from './PhotoPreviewModal';

interface MVPVotingAndCameraProps {
  team: TeamInfo;
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  currentUser: AppUser;
  language: Language;
  selectedMatchId?: string;
  onViewPlayerProfile?: (playerId: string) => void;
}

export const MVPVotingAndCamera: React.FC<MVPVotingAndCameraProps> = ({
  team,
  matches,
  setMatches,
  players,
  setPlayers,
  currentUser,
  language,
  selectedMatchId,
  onViewPlayerProfile,
}) => {
  const t = getT(language);

  // Pick default match (either the live one, or selected, or finished)
  const defaultMatch =
    matches.find((m) => m.id === selectedMatchId) ||
    matches.find((m) => m.status === 'live') ||
    matches[0];

  const [activeMatchId, setActiveMatchId] = useState<string>(defaultMatch?.id || '');
  const activeMatch = matches.find((m) => m.id === activeMatchId) || defaultMatch;

  // Selected player in voting
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);

  // Camera & Automatic Photo state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  // Gallery download states
  const [isDownloadingMvp, setIsDownloadingMvp] = useState(false);
  const [mvpToast, setMvpToast] = useState<string | null>(null);
  const framedMvpCardRef = useRef<HTMLDivElement>(null);
  const [photoPreview, setPhotoPreview] = useState<{
    isOpen: boolean;
    imageUrl: string;
    fileName: string;
    title: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<any>(null);

  // Elapsed minutes since kickoff
  const now = Date.now();
  const elapsedMinutes = activeMatch
    ? Math.floor((now - activeMatch.matchStartTimestamp) / (1000 * 60))
    : 0;
  const is50MinElapsed = elapsedMinutes >= 50 || activeMatch?.status === 'finished';

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Check existing MVP on match change
  useEffect(() => {
    if (activeMatch?.mvpPhotoUrl) {
      setCapturedPhotoUrl(activeMatch.mvpPhotoUrl);
      setSelectedCandidateId(activeMatch.mvpId || '');
    } else {
      setCapturedPhotoUrl(null);
      setIsSavedSuccessfully(false);
    }
  }, [activeMatchId]);

  const handleSimulate50Min = () => {
    if (!activeMatch) return;
    setMatches((prev) =>
      prev.map((m) =>
        m.id === activeMatch.id
          ? {
              ...m,
              matchStartTimestamp: Date.now() - 55 * 60 * 1000,
              status: m.status === 'scheduled' ? 'live' : m.status,
            }
          : m
      )
    );
  };

  const handleCastVote = (playerId: string) => {
    if (!activeMatch) return;
    setSelectedCandidateId(playerId);

    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== activeMatch.id) return m;
        const currentVotes = { ...(m.mvpVotes || {}) };
        currentVotes[playerId] = (currentVotes[playerId] || 0) + 1;
        return {
          ...m,
          mvpVotes: currentVotes,
        };
      })
    );
    setHasVoted(true);
  };

  // Find current top candidate
  const getLeaderCandidate = (): { player: Player | undefined; votes: number } => {
    if (!activeMatch?.mvpVotes) {
      const p = players.find((pl) => pl.id === selectedCandidateId) || players[0];
      return { player: p, votes: 1 };
    }
    let maxVotes = -1;
    let leaderId = selectedCandidateId || players[0]?.id;
    Object.entries(activeMatch.mvpVotes).forEach(([pId, vCount]) => {
      const count = Number(vCount) || 0;
      if (count > maxVotes) {
        maxVotes = count;
        leaderId = pId;
      }
    });
    const player = players.find((p) => p.id === leaderId);
    return { player, votes: Math.max(maxVotes, 1) };
  };

  const leader = getLeaderCandidate();

  // Start Camera Feed
  const startCamera = async () => {
    setCameraError(null);
    setCapturedPhotoUrl(null);
    setIsSavedSuccessfully(false);
    setIsCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Automatic countdown capture: 3 -> 2 -> 1 -> SNAP!
      startAutoCountdown();
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        'No se pudo acceder a la cámara automáticamente. Puedes usar el botón de subir foto o permitir permisos.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  };

  const startAutoCountdown = () => {
    let count = 3;
    setCountdown(count);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countdownIntervalRef.current);
        setCountdown(null);
        takeSnapshot();
      }
    }, 1000);
  };

  // Capture frame from video stream onto canvas with MVP Badge Overlay
  const takeSnapshot = () => {
    if (!videoRef.current || !activeMatch) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw camera image
    ctx.drawImage(video, 0, 0, width, height);

    // Overlay stylish soccer card frame
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 14;
    ctx.strokeRect(0, 0, width, height);

    // Top MVP Ribbon Banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, width, 80);

    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★ JUGADOR DESTACADO (MVP DEL PARTIDO) ★', width / 2, 42);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`RIVAL: ${activeMatch.rival.toUpperCase()}  •  FECHA: ${activeMatch.date}`, width / 2, 68);

    // Bottom Player Details Banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, height - 70, width, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    const candidateName = leader.player?.name || 'JUGADOR MVP';
    ctx.fillText(`${candidateName.toUpperCase()} #${leader.player?.number || ''}`, width / 2, height - 38);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText('Oficialmente registrado en perfil TeamGol', width / 2, height - 16);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhotoUrl(dataUrl);
    stopCamera();

    // Fire Confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Automatically save to Player's MVP trophy cabinet & Match record
    saveMvpToProfile(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeMatch) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setCapturedPhotoUrl(base64);
      saveMvpToProfile(base64);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    };
    reader.readAsDataURL(file);
  };

  const saveMvpToProfile = (photoUrl: string) => {
    if (!activeMatch || !leader.player) return;

    const mvpRecord: MVPRecord = {
      id: `mvp_${Date.now()}`,
      matchId: activeMatch.id,
      rival: activeMatch.rival,
      date: activeMatch.date,
      photoUrl: photoUrl,
      votesCount: leader.votes,
    };

    // Update player profile
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === leader.player?.id) {
          return {
            ...p,
            mvpHistory: [mvpRecord, ...(p.mvpHistory || [])],
          };
        }
        return p;
      })
    );

    // Update match record
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id === activeMatch.id) {
          return {
            ...m,
            mvpId: leader.player?.id,
            mvpPlayerName: leader.player?.name,
            mvpPhotoUrl: photoUrl,
          };
        }
        return m;
      })
    );

    setIsSavedSuccessfully(true);
  };

  const handleDownloadMvpCard = async () => {
    if (!framedMvpCardRef.current) return;
    setIsDownloadingMvp(true);

    const cleanPlayerName = (leader.player?.name || 'jugador').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const cleanRival = (activeMatch?.rival || 'rival').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `mvp_${cleanPlayerName}_vs_${cleanRival}_${activeMatch?.date || 'partido'}.png`;

    const res = await downloadElementAsImage(framedMvpCardRef.current, {
      fileName,
      backgroundColor: '#0c0a09',
      scale: 2.5,
    });

    setIsDownloadingMvp(false);
    if (res) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
      setPhotoPreview({
        isOpen: true,
        imageUrl: res,
        fileName,
        title: `Distinción MVP: ${leader.player?.name || 'Jugador del Partido'}`,
      });
      setMvpToast(`¡Foto oficial con marco de MVP lista para guardar!`);
      setTimeout(() => setMvpToast(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification when MVP is saved */}
      {mvpToast && (
        <div className="fixed top-20 right-4 z-50 bg-amber-400 text-black px-4 py-3 rounded-xl shadow-2xl font-bold text-xs sm:text-sm flex items-center gap-2 border border-black/20 animate-fade-in">
          <Star className="w-5 h-5 shrink-0 fill-black" />
          <span>{mvpToast}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#242526] p-5 rounded-2xl border border-[#CED0D4] dark:border-white/10 shadow-xs transition-colors">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#050505] dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            {t.mvp.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#65676B] dark:text-gray-400 mt-0.5 font-medium">
            {t.mvp.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Match selector */}
          <select
            value={activeMatchId}
            onChange={(e) => setActiveMatchId(e.target.value)}
            className="px-3 py-2 bg-[#F0F2F5] dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-xs font-bold focus:outline-none focus:border-[#1877F2]"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                vs {m.rival} ({m.date}) - {m.status.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Simulate 50min elapsed helper */}
          {!is50MinElapsed && (
            <button
              onClick={handleSimulate50Min}
              className="px-3 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Simular que transcurrieron 50m para probar la votación"
            >
              <Clock className="w-3.5 h-3.5" />
              Simular 50 min
            </button>
          )}
        </div>
      </div>

      {/* 50-Minute Rule Status Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all shadow-xs ${
          is50MinElapsed
            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-300'
            : 'bg-white dark:bg-[#242526] border-[#CED0D4] dark:border-white/10 text-[#65676B] dark:text-gray-400'
        }`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                is50MinElapsed ? 'bg-amber-400 text-black shadow-xs' : 'bg-[#F0F2F5] dark:bg-white/5 text-[#65676B] dark:text-gray-400 border border-[#CED0D4] dark:border-white/10'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#050505] dark:text-white">
                {t.mvp.rule50Min}: {is50MinElapsed ? '¡Habilitada!' : 'En Espera'}
              </h4>
              <p className="text-xs text-[#65676B] dark:text-gray-400 max-w-xl font-medium">
                {t.mvp.rule50Desc} (Minutos transcurridos: {elapsedMinutes} min)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                is50MinElapsed
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
                  : 'bg-[#F0F2F5] text-[#65676B] dark:bg-white/5 dark:text-gray-400 border border-[#CED0D4] dark:border-white/10'
              }`}
            >
              {is50MinElapsed ? '✓ Votación Disponible' : `Bloqueada (${50 - elapsedMinutes}m restantes)`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Candidates Voting Booth */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-[#242526] p-5 rounded-2xl border border-[#CED0D4] dark:border-white/10 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#050505] dark:text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  {t.mvp.activeVote} {activeMatch?.rival}
                </h3>
                <p className="text-xs text-[#65676B] dark:text-gray-400 font-medium">
                  {t.mvp.votePrompt}
                </p>
              </div>

              {hasVoted && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t.mvp.voted}
                </span>
              )}
            </div>

            {/* Candidate cards list */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {players.map((player) => {
                const votes = (activeMatch?.mvpVotes && activeMatch.mvpVotes[player.id]) || 0;
                const isSelected = selectedCandidateId === player.id;
                const isCurrentLeader = leader.player?.id === player.id && votes > 0;

                return (
                  <div
                    key={player.id}
                    id={`mvp-candidate-${player.id}`}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-[#F0F2F5] dark:bg-black/40 border-[#CED0D4]/70 dark:border-white/5 hover:border-[#1877F2]/40 dark:hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400 w-6">
                        #{player.number}
                      </span>
                      <img
                        src={player.avatarUrl}
                        alt={player.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-[#CED0D4] dark:ring-white/10"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#050505] dark:text-white truncate">
                            {player.name}
                          </span>
                          {isCurrentLeader && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black font-bold text-[9px] uppercase tracking-wider shadow-xs">
                              Líder ★
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#65676B] dark:text-gray-400 font-medium">
                          {player.position} • {player.goals} goles • {player.mvpHistory?.length || 0} premios MVP
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        {votes} {t.mvp.votes}
                      </span>

                      <button
                        onClick={() => handleCastVote(player.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-black shadow-xs'
                            : 'bg-white hover:bg-[#E4E6EB] dark:bg-white/5 dark:hover:bg-white/10 text-[#050505] dark:text-gray-200 border border-[#CED0D4] dark:border-white/10'
                        }`}
                      >
                        {isSelected ? 'Elegido' : t.mvp.voteAction}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Camera & Official Framed MVP Commemorative Card */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white dark:bg-[#242526] p-4 sm:p-5 rounded-2xl border border-[#CED0D4] dark:border-white/10 space-y-4 shadow-xs">
            <div className="flex items-center justify-between text-left">
              <div>
                <h3 className="text-base font-black text-[#050505] dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Marco Oficial del MVP
                </h3>
                <p className="text-xs text-[#65676B] dark:text-gray-400 font-medium">
                  Foto conmemorativa con logos de ambos equipos y reconocimiento oficial
                </p>
              </div>
            </div>

            {/* Framed Commemorative MVP Card */}
            <div
              ref={framedMvpCardRef}
              id="framed-mvp-card"
              className="relative bg-gradient-to-b from-[#1c1917] via-[#09090b] to-[#18181b] p-4 sm:p-5 rounded-2xl border-4 border-amber-500/80 shadow-[0_0_35px_rgba(245,158,11,0.25)] overflow-hidden space-y-3.5 text-center"
            >
              {/* Inner Golden Trim & Decorative Corners */}
              <div className="absolute inset-1.5 border border-amber-400/30 rounded-xl pointer-events-none" />
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-400 pointer-events-none" />

              {/* Top MVP Ribbon Banner */}
              <div className="relative z-10 pt-1">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 text-black font-black text-xs uppercase tracking-widest shadow-md">
                  <Star className="w-3.5 h-3.5 fill-black" />
                  <span>MVP DEL PARTIDO</span>
                  <Star className="w-3.5 h-3.5 fill-black" />
                </div>
                <p className="text-[10px] text-amber-200/80 font-bold uppercase tracking-wider mt-1">
                  {team.leagueName || 'Liga de Fútbol'} • Reconocimiento Oficial
                </p>
              </div>

              {/* Logos of the 2 Teams that faced each other */}
              <div className="relative z-10 bg-black/70 backdrop-blur-sm p-3 rounded-xl border border-amber-400/30 flex items-center justify-between gap-2 shadow-inner">
                {/* Team 1: Our Team */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-emerald-500/50 shadow-sm shrink-0"
                  />
                  <div className="min-w-0 text-left flex-1">
                    <h5 className="text-xs font-bold text-white leading-tight break-words">
                      {team.name}
                    </h5>
                    <span className="text-[9px] uppercase font-bold text-emerald-400 block mt-0.5">
                      {activeMatch?.isHome ? 'Local' : 'Visitante'}
                    </span>
                  </div>
                </div>

                {/* Center Score or VS */}
                <div className="flex flex-col items-center justify-center px-2 py-1 bg-black/60 rounded-lg border border-amber-400/20 shrink-0 min-w-[60px]">
                  {activeMatch && activeMatch.scoreUs !== null && activeMatch.scoreThem !== null ? (
                    <span className="text-sm font-black font-sport text-white tracking-wider">
                      <span className="text-emerald-400">{activeMatch.scoreUs}</span> - <span>{activeMatch.scoreThem}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-black text-amber-400 tracking-widest">
                      VS
                    </span>
                  )}
                  <span className="text-[9px] text-gray-400 font-medium">
                    {activeMatch?.date || ''}
                  </span>
                </div>

                {/* Team 2: Rival Team */}
                <div className="flex items-center justify-end gap-2.5 flex-1 min-w-0 text-right">
                  <div className="min-w-0 text-right flex-1">
                    <h5 className="text-xs font-bold text-white leading-tight break-words">
                      {activeMatch?.rival || 'Rival'}
                    </h5>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block mt-0.5">
                      {!activeMatch?.isHome ? 'Local' : 'Visitante'}
                    </span>
                  </div>
                  <img
                    src={activeMatch?.rivalLogo}
                    alt={activeMatch?.rival}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-white/20 shadow-sm shrink-0"
                  />
                </div>
              </div>

              {/* Photo Area inside the Frame */}
              <div className="relative z-10 w-full aspect-[4/3] rounded-xl overflow-hidden border-2 border-amber-400/40 shadow-xl bg-black flex items-center justify-center">
                {/* Live Video Feed */}
                {isCameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Golden Overlay Frame */}
                    <div className="absolute inset-0 border-4 border-amber-500/50 pointer-events-none" />

                    {/* Countdown overlay */}
                    {countdown !== null && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs">
                        <span className="text-6xl font-black font-sport text-amber-400 animate-ping">
                          {countdown}
                        </span>
                        <span className="text-xs font-bold text-white mt-2">
                          {t.mvp.cameraCountdown} {countdown}s
                        </span>
                      </div>
                    )}

                    {/* Bottom manual snap control */}
                    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
                      <button
                        onClick={takeSnapshot}
                        className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-lg flex items-center gap-1.5"
                      >
                        <Camera className="w-4 h-4" />
                        {t.mvp.snapPhoto}
                      </button>
                      <button
                        onClick={stopCamera}
                        className="px-3 py-2 rounded-lg bg-black/80 hover:bg-black text-white font-semibold text-xs border border-white/10"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <img
                      src={
                        capturedPhotoUrl ||
                        leader.player?.avatarUrl ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'
                      }
                      alt="MVP Oficial"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-amber-400 text-black px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-lg">
                      <Star className="w-3 h-3 fill-black" />
                      OFICIAL MVP
                    </div>
                  </>
                )}
              </div>

              {/* Bottom Player Details Plaque: Full Name, Number & Position */}
              <div className="relative z-10 bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-500/20 p-3 rounded-xl border border-amber-400/40 shadow-md">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">
                  Reconocimiento al Jugador Destacado
                </span>
                <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-wide mt-0.5 break-words">
                  {leader.player?.name || 'Jugador MVP'}
                </h4>
                <div className="flex items-center justify-center gap-3 mt-1 text-xs text-amber-200 flex-wrap">
                  {leader.player?.number && (
                    <span className="font-bold bg-amber-400 text-black px-2 py-0.5 rounded text-[10px]">
                      Dorsal #{leader.player.number}
                    </span>
                  )}
                  {leader.player?.position && (
                    <span className="font-semibold text-gray-300 text-xs">
                      Posición: <strong className="text-white">{leader.player.position}</strong>
                    </span>
                  )}
                  <span className="font-bold text-emerald-400 text-xs">
                    ★ {leader.votes} {leader.votes === 1 ? 'voto' : 'votos'}
                  </span>
                </div>
              </div>
            </div>

            {/* Gallery Download Button */}
            <button
              id="btn-download-mvp-card"
              onClick={handleDownloadMvpCard}
              disabled={isDownloadingMvp}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-black shrink-0" />
              <span>
                {isDownloadingMvp
                  ? 'Guardando en Galería...'
                  : 'Descargar Foto de MVP (Guardar en Galería)'}
              </span>
            </button>

            {/* Error Message if camera failed */}
            {cameraError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Success notification */}
            {isSavedSuccessfully && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.mvp.savedToProfile}</span>
                </div>
                {leader.player && onViewPlayerProfile && (
                  <button
                    onClick={() => onViewPlayerProfile(leader.player!.id)}
                    className="font-bold underline ml-2"
                  >
                    Ver Perfil
                  </button>
                )}
              </div>
            )}

            {/* Camera & Upload action buttons */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
              <button
                id="btn-open-camera-mvp"
                onClick={startCamera}
                disabled={isCameraActive}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-white/10 dark:hover:bg-white/20 text-[#050505] dark:text-white font-bold text-xs border border-[#CED0D4] dark:border-white/10 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Camera className="w-4 h-4 text-amber-500" />
                {capturedPhotoUrl ? t.mvp.retakePhoto : t.mvp.takeMvpPhoto}
              </button>

              {/* Alternative file upload */}
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-white/5 dark:hover:bg-white/10 text-[#050505] dark:text-gray-200 font-bold text-xs border border-[#CED0D4] dark:border-white/10 cursor-pointer transition-all shadow-xs">
                <Upload className="w-4 h-4 text-[#1877F2] dark:text-emerald-400" />
                <span>Subir Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* MVP Card HD Preview Modal */}
      {photoPreview && (
        <PhotoPreviewModal
          isOpen={photoPreview.isOpen}
          onClose={() => setPhotoPreview(null)}
          title={photoPreview.title}
          subtitle="Marco oficial de distinción MVP con estrellas y escudo"
          imageUrl={photoPreview.imageUrl}
          fileName={photoPreview.fileName}
        />
      )}
    </div>
  );
};
