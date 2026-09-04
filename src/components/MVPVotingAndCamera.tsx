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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Match, Player, AppUser, Language, MVPRecord } from '../types';
import { getT } from '../utils/translations';

interface MVPVotingAndCameraProps {
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

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#141416] p-5 rounded-xl border border-white/5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            {t.mvp.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            {t.mvp.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Match selector */}
          <select
            value={activeMatchId}
            onChange={(e) => setActiveMatchId(e.target.value)}
            className="px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
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
              className="px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-bold transition-all flex items-center gap-1"
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
        className={`p-4 rounded-xl border transition-all ${
          is50MinElapsed
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : 'bg-[#141416] border-white/5 text-gray-400'
        }`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                is50MinElapsed ? 'bg-amber-400 text-black' : 'bg-white/5 text-gray-400 border border-white/10'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {t.mvp.rule50Min}: {is50MinElapsed ? '¡Habilitada!' : 'En Espera'}
              </h4>
              <p className="text-xs text-gray-400 max-w-xl">
                {t.mvp.rule50Desc} (Minutos transcurridos: {elapsedMinutes} min)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                is50MinElapsed
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10'
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
          <div className="bg-[#141416] p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  {t.mvp.activeVote} {activeMatch?.rival}
                </h3>
                <p className="text-xs text-gray-400">
                  {t.mvp.votePrompt}
                </p>
              </div>

              {hasVoted && (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
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
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-black/40 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs font-black text-amber-400 w-6">
                        #{player.number}
                      </span>
                      <img
                        src={player.avatarUrl}
                        alt={player.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {player.name}
                          </span>
                          {isCurrentLeader && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black font-bold text-[9px] uppercase tracking-wider">
                              Líder ★
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {player.position} • {player.goals} goles • {player.mvpHistory?.length || 0} premios MVP
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {votes} {t.mvp.votes}
                      </span>

                      <button
                        onClick={() => handleCastVote(player.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-amber-400 text-black shadow-sm'
                            : 'bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10'
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

        {/* Right Side: Camera & Official MVP Photo Cabinet */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#141416] p-5 rounded-xl border border-white/5 space-y-4 text-center">
            <div className="flex items-center justify-between text-left">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  Foto Oficial del Jugador Destacado
                </h3>
                <p className="text-xs text-gray-400">
                  Abre la cámara para capturar y archivar al MVP automáticamente
                </p>
              </div>
            </div>

            {/* Camera Preview Area / Captured Photo Card */}
            <div className="relative w-full aspect-[4/3] bg-black rounded-xl border border-white/10 overflow-hidden flex flex-col items-center justify-center">
              {/* Live Video Feed */}
              {isCameraActive && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Golden Overlay Frame */}
                  <div className="absolute inset-0 border-8 border-amber-500/40 pointer-events-none" />

                  {/* Countdown overlay */}
                  {countdown !== null && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs">
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
              )}

              {/* Already Captured / Stored Photo */}
              {!isCameraActive && capturedPhotoUrl && (
                <div className="relative w-full h-full">
                  <img
                    src={capturedPhotoUrl}
                    alt="MVP Oficial"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-amber-500 text-black px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Star className="w-3 h-3 fill-black" />
                    OFICIAL MVP
                  </div>
                </div>
              )}

              {/* Idle Placeholder when no camera & no photo yet */}
              {!isCameraActive && !capturedPhotoUrl && (
                <div className="p-6 text-center space-y-3">
                  <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-amber-400">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {leader.player ? `Destacado: ${leader.player.name}` : 'Sin jugador seleccionado'}
                    </h4>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                      Al terminar el partido, activa la cámara para tomar la foto con marco conmemorativo oficial.
                    </p>
                  </div>
                </div>
              )}
            </div>

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

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
              <button
                id="btn-open-camera-mvp"
                onClick={startCamera}
                disabled={isCameraActive}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                {capturedPhotoUrl ? t.mvp.retakePhoto : t.mvp.takeMvpPhoto}
              </button>

              {/* Alternative file upload */}
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 font-semibold text-xs border border-white/10 cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-emerald-400" />
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
    </div>
  );
};
