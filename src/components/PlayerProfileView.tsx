import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Trophy,
  Award,
  Calendar,
  Flame,
  Shield,
  Star,
  Camera,
  Edit2,
  Check,
  ChevronLeft,
  Download,
  CreditCard,
  QrCode,
  CheckCircle2,
  RefreshCw,
  Upload,
  X,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Player, TeamInfo, AppUser, Language, DEFAULT_FACEBOOK_AVATAR, getPlayerPositionName } from '../types';
import { getT } from '../utils/translations';
import { downloadElementAsImage } from '../utils/imageDownloader';

interface PlayerProfileViewProps {
  player: Player;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  team: TeamInfo;
  currentUser: AppUser;
  language: Language;
  onBack?: () => void;
}

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({
  player,
  setPlayers,
  team,
  currentUser,
  language,
  onBack,
}) => {
  const t = getT(language);
  const isOwnerOrAdmin = currentUser.role === 'owner';
  const isSelf = currentUser.playerId === player.id;
  // Players can always edit their profile photo via camera and alias directly
  const canEdit = true;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: player.name,
    nickname: player.nickname || '',
    number: player.number,
    avatarUrl: player.avatarUrl,
  });

  // Quick alias inline edit modal/state
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [tempAlias, setTempAlias] = useState(player.nickname || '');

  // Digital Credential Modal state
  const [isCredentialOpen, setIsCredentialOpen] = useState(false);
  const [isDownloadingCredential, setIsDownloadingCredential] = useState(false);
  const credentialCardRef = useRef<HTMLDivElement>(null);

  // Camera & Photo modal states
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync formData when player prop changes
  useEffect(() => {
    setFormData({
      name: player.name,
      nickname: player.nickname || '',
      number: player.number,
      avatarUrl: player.avatarUrl,
    });
    setTempAlias(player.nickname || '');
  }, [player]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Camera Controls
  const startCamera = async (facing: 'user' | 'environment' = cameraFacingMode) => {
    stopCamera();
    setCameraError(null);
    setCapturedPhotoUrl(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Error starting camera:', err);
      setCameraError(
        'No se pudo acceder a la cámara del dispositivo. Verifica los permisos del navegador o sube una foto desde tu galería.'
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
  };

  const switchCameraFacing = () => {
    const nextFacing = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(nextFacing);
    if (isCameraActive) {
      startCamera(nextFacing);
    }
  };

  const triggerSnapWithCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          takeSnapshot();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (cameraFacingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhotoUrl(dataUrl);
    stopCamera();
  };

  const handleSaveCapturedAvatar = () => {
    if (!capturedPhotoUrl) return;

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === player.id
          ? {
              ...p,
              avatarUrl: capturedPhotoUrl,
            }
          : p
      )
    );
    setFormData((prev) => ({ ...prev, avatarUrl: capturedPhotoUrl }));
    setIsCameraModalOpen(false);
    stopCamera();
    showToast('¡Foto de perfil actualizada exitosamente con la cámara!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setCapturedPhotoUrl(result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCloseCameraModal = () => {
    stopCamera();
    setIsCameraModalOpen(false);
    setCapturedPhotoUrl(null);
    setCameraError(null);
  };

  // Quick Alias Save
  const handleSaveAlias = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAlias = tempAlias.trim();
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === player.id
          ? {
              ...p,
              nickname: cleanAlias || undefined,
            }
          : p
      )
    );
    setFormData((prev) => ({ ...prev, nickname: cleanAlias }));
    setIsEditingAlias(false);
    showToast('¡Alias actualizado exitosamente!');
  };

  // Profile Form Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === player.id
          ? {
              ...p,
              name: formData.name,
              nickname: formData.nickname || undefined,
              number: Number(formData.number),
              avatarUrl: formData.avatarUrl,
            }
          : p
      )
    );
    setIsEditing(false);
    showToast('¡Datos del jugador actualizados!');
  };

  // Download Digital Credential to Gallery
  const handleDownloadCredential = async () => {
    if (!credentialCardRef.current) return;
    setIsDownloadingCredential(true);

    const cleanPlayer = player.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `credencial_digital_${cleanPlayer}_dorsal_${player.number}.png`;

    const res = await downloadElementAsImage(credentialCardRef.current, {
      fileName,
      backgroundColor: '#09090b',
      scale: 2.5,
    });

    setIsDownloadingCredential(false);
    if (res) {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
      showToast('¡Credencial digital guardada en tu galería!');
    }
  };

  const getPositionLabel = (pos: string) => {
    return getPlayerPositionName(pos);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#1877F2] text-white px-4 py-3 rounded-2xl shadow-2xl font-bold text-xs sm:text-sm flex items-center gap-2 border border-white/20 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top action row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] text-xs font-semibold text-[#050505] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a la plantilla
          </button>
        ) : (
          <div />
        )}

        {/* Digital Credential Trigger Button */}
        <button
          id="btn-open-credential"
          onClick={() => setIsCredentialOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold shadow-xs transition-all cursor-pointer transform hover:scale-[1.02]"
        >
          <CreditCard className="w-4 h-4 text-white shrink-0" />
          <span>Ver Credencial Digital</span>
          <span className="text-[10px] bg-white text-[#1877F2] px-1.5 py-0.5 rounded-full font-black uppercase">
            Fut 7
          </span>
        </button>
      </div>

      {/* Main Profile Header Card */}
      <div className="relative bg-white rounded-2xl border border-[#CED0D4] p-6 sm:p-8 overflow-hidden shadow-xs">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar with Camera Overlay Trigger */}
          <div className="relative shrink-0 group">
            <img
              src={player.avatarUrl || DEFAULT_FACEBOOK_AVATAR}
              alt={player.name}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.src = DEFAULT_FACEBOOK_AVATAR;
              }}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover ring-4 ring-[#1877F2]/20 shadow-md bg-[#E4E6EB]"
            />

            {/* Number Badge */}
            <span className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#1877F2] text-white font-mono font-bold text-sm flex items-center justify-center shadow-md border-2 border-white">
              #{player.number}
            </span>

            {/* Camera Direct Action Button on Avatar */}
            <button
              id="btn-edit-photo-camera-corner"
              onClick={() => {
                setIsCameraModalOpen(true);
                startCamera();
              }}
              className="absolute top-0 right-0 w-9 h-9 rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] flex items-center justify-center shadow-md border-2 border-white transition-transform active:scale-95 cursor-pointer"
              title="Tomar foto con cámara del dispositivo"
            >
              <Camera className="w-4 h-4 text-[#050505]" />
            </button>

            {/* Hover overlay for desktop */}
            <button
              id="btn-edit-photo-camera-hover"
              onClick={() => {
                setIsCameraModalOpen(true);
                startCamera();
              }}
              className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white transition-opacity cursor-pointer backdrop-blur-xs"
              title="Tomar foto con cámara del dispositivo"
            >
              <Camera className="w-6 h-6 text-white animate-pulse" />
              <span className="text-[10px] font-bold">Tomar Foto</span>
            </button>
          </div>

          {/* Info Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1.5 justify-center sm:justify-start">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E7F3FF] text-[#1877F2] border border-[#1877F2]/20 text-xs font-bold uppercase tracking-wider">
                    {getPositionLabel(player.position)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F0F2F5] text-[#65676B] text-[11px] font-bold">
                    Fútbol 7
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-[#050505] tracking-tight break-words">
                  {player.name}
                </h1>

                {/* Nickname / Alias with direct edit */}
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 flex-wrap">
                  <span className="text-sm font-bold text-[#65676B]">
                    {player.nickname ? `"${player.nickname}"` : 'Sin alias'}
                  </span>
                  <button
                    id="btn-quick-edit-alias"
                    onClick={() => {
                      setTempAlias(player.nickname || '');
                      setIsEditingAlias(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#1877F2] text-xs font-bold transition-colors cursor-pointer border border-[#CED0D4]"
                    title="Editar alias"
                  >
                    <Edit2 className="w-3 h-3 text-[#1877F2]" />
                    <span>{player.nickname ? 'Cambiar Alias' : '+ Agregar Alias'}</span>
                  </button>
                </div>

                <p className="text-xs text-[#65676B] mt-1.5">
                  {team.name} • {team.leagueName} • {team.season || 'Temporada 2026'}
                </p>
              </div>

              <div className="flex items-center gap-2 self-center sm:self-start flex-wrap mt-2 sm:mt-0">
                {/* Camera Button */}
                <button
                  id="btn-camera-header"
                  onClick={() => {
                    setIsCameraModalOpen(true);
                    startCamera();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E7F3FF] hover:bg-[#D8EAFF] text-[#1877F2] text-xs font-bold transition-all cursor-pointer shadow-xs border border-[#1877F2]/20"
                  title="Tomar foto con cámara"
                >
                  <Camera className="w-4 h-4 text-[#1877F2]" />
                  <span>Cámara</span>
                </button>

                {/* Credential Button */}
                <button
                  id="btn-credential-header"
                  onClick={() => setIsCredentialOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] text-xs font-bold transition-all cursor-pointer shadow-xs"
                  title="Ver credencial digital"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#050505]" />
                  <span>Credencial</span>
                </button>

                {/* General Edit button */}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] text-xs font-semibold transition-all cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#65676B]" />
                  {isEditing ? 'Cancelar' : 'Editar Datos'}
                </button>
              </div>
            </div>

            {/* Quick Stat Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-[#F0F2F5] p-3 rounded-xl border border-[#CED0D4]/60 text-center">
                <span className="text-2xl font-black text-[#050505] block">
                  {player.goals}
                </span>
                <span className="text-[10px] font-bold text-[#65676B] uppercase tracking-wider">
                  {t.playerProfile.goals}
                </span>
              </div>

              <div className="bg-[#F0F2F5] p-3 rounded-xl border border-[#CED0D4]/60 text-center">
                <span className="text-2xl font-black text-[#1877F2] block">
                  {player.assists}
                </span>
                <span className="text-[10px] font-bold text-[#65676B] uppercase tracking-wider">
                  {t.playerProfile.assists}
                </span>
              </div>

              <div className="bg-[#F0F2F5] p-3 rounded-xl border border-[#CED0D4]/60 text-center">
                <span className="text-2xl font-black text-[#050505] block">
                  {player.matches}
                </span>
                <span className="text-[10px] font-bold text-[#65676B] uppercase tracking-wider">
                  {t.playerProfile.matches}
                </span>
              </div>

              <div className="bg-[#F0F2F5] p-3 rounded-xl border border-[#CED0D4]/60 text-center">
                <span className="text-2xl font-black text-[#F57C00] block">
                  {player.mvpHistory?.length || 0}
                </span>
                <span className="text-[10px] font-bold text-[#65676B] uppercase tracking-wider">
                  {t.playerProfile.mvpAwards}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Inline Quick Alias Edit Box */}
        {isEditingAlias && (
          <form
            onSubmit={handleSaveAlias}
            className="mt-4 pt-4 border-t border-[#CED0D4] flex items-center gap-2 max-w-md"
          >
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase text-[#1877F2] mb-1">
                Alias / Apodo del Jugador
              </label>
              <input
                type="text"
                value={tempAlias}
                onChange={(e) => setTempAlias(e.target.value)}
                placeholder="Ej. El Tanque, La Joya, El Capi"
                className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-xs text-[#050505] font-semibold focus:outline-none focus:border-[#1877F2]"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-1.5 self-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#1877F2] text-white font-bold text-xs hover:bg-[#0866FF] transition-colors"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setIsEditingAlias(false)}
                className="px-3 py-2 rounded-xl bg-[#E4E6EB] text-[#050505] text-xs font-semibold hover:bg-[#D8DADF]"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Inline General Edit Form */}
        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 pt-6 border-t border-[#CED0D4] grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-xs text-[#050505] font-semibold focus:outline-none focus:border-[#1877F2]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
                Apodo / Alias
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Apodo en la cancha"
                className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-xs text-[#050505] font-semibold focus:outline-none focus:border-[#1877F2]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
                Número de Dorsal
              </label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-xs text-[#050505] font-semibold focus:outline-none focus:border-[#1877F2]"
              />
            </div>

            <div className="sm:col-span-3 flex items-center justify-between pt-2 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCameraModalOpen(true);
                  startCamera();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E7F3FF] text-[#1877F2] border border-[#1877F2]/30 text-xs font-bold hover:bg-[#D8EAFF]"
              >
                <Camera className="w-4 h-4" />
                <span>Tomar nueva foto con cámara</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 rounded-xl bg-[#E4E6EB] text-[#050505] text-xs font-semibold hover:bg-[#D8DADF]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-bold hover:bg-[#0866FF]"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Trophy Cabinet: Saved MVP Photos with Date & Rival */}
      <div className="bg-white rounded-2xl border border-[#CED0D4] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#050505] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#F57C00]" />
              {t.mvp.trophyCabinet}
            </h3>
            <p className="text-xs text-[#65676B]">
              Fotos conmemorativas automáticas de partidos de Fútbol 7 ganados como MVP
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] text-xs font-bold border border-[#FDE68A]">
            {player.mvpHistory?.length || 0} Premios
          </span>
        </div>

        {!player.mvpHistory || player.mvpHistory.length === 0 ? (
          <div className="p-8 text-center bg-[#F0F2F5] rounded-xl border border-[#CED0D4]/60 space-y-2">
            <Award className="w-10 h-10 text-[#65676B] mx-auto" />
            <h4 className="text-sm font-bold text-[#050505]">
              Aún no cuenta con fotos conmemorativas MVP
            </h4>
            <p className="text-xs text-[#65676B] max-w-sm mx-auto">
              Al concluir cada encuentro de Fútbol 7 y ser votado como el jugador destacado, se capturará su fotografía oficial y se almacenará en este vitrina.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {player.mvpHistory.map((rec) => (
              <div
                key={rec.id}
                className="bg-[#F0F2F5] rounded-xl border border-[#CED0D4]/60 overflow-hidden group hover:border-[#1877F2] transition-all shadow-xs"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-black">
                  <img
                    src={rec.photoUrl}
                    alt={`MVP vs ${rec.rival}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-[#1877F2] text-white font-bold text-[10px] uppercase flex items-center gap-1 shadow-md">
                    <Star className="w-3 h-3 fill-white" />
                    OFICIAL MVP
                  </div>
                </div>

                <div className="p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#050505] uppercase truncate">
                      vs {rec.rival}
                    </span>
                    <span className="font-mono text-[#1877F2] font-bold text-[11px]">
                      {rec.votesCount} votos
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#65676B]">
                    <Calendar className="w-3.5 h-3.5 text-[#65676B]" />
                    <span>{rec.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CAMERA SNAPSHOT FOR PROFILE PHOTO                 */}
      {/* ========================================================= */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white border border-[#CED0D4] rounded-2xl p-5 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#CED0D4] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#E7F3FF] text-[#1877F2] border border-[#1877F2]/20">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#050505]">
                    Actualizar Foto de Perfil
                  </h3>
                  <p className="text-[11px] text-[#65676B]">
                    Usa la cámara del dispositivo o carga un archivo
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseCameraModal}
                className="p-1.5 rounded-full text-[#65676B] hover:text-[#050505] hover:bg-[#F0F2F5] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewport or Captured Image */}
            <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden border border-[#CED0D4] flex items-center justify-center">
              {isCameraActive && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      cameraFacingMode === 'user' ? 'scale-x-[-1]' : ''
                    }`}
                  />

                  {/* Circular Avatar Framing Guide */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-56 h-56 rounded-full border-2 border-dashed border-[#1877F2] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
                  </div>

                  {/* Countdown overlay */}
                  {countdown !== null && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs">
                      <span className="text-7xl font-black font-sport text-white animate-ping">
                        {countdown}
                      </span>
                    </div>
                  )}

                  {/* Live Controls Bar */}
                  <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 px-4">
                    <button
                      onClick={switchCameraFacing}
                      className="p-2.5 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 shadow-lg cursor-pointer"
                      title="Girar cámara"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    <button
                      onClick={triggerSnapWithCountdown}
                      className="px-5 py-2.5 rounded-full bg-[#1877F2] hover:bg-[#0866FF] text-white font-extrabold text-xs shadow-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Tomar Foto (3s)
                    </button>

                    <button
                      onClick={takeSnapshot}
                      className="p-2.5 rounded-full bg-white/30 hover:bg-white/40 text-white border border-white/30 cursor-pointer"
                      title="Captura instantánea"
                    >
                      ⚡
                    </button>
                  </div>
                </>
              )}

              {/* Display Captured Snapshot for Review */}
              {!isCameraActive && capturedPhotoUrl && (
                <div className="relative w-full h-full">
                  <img
                    src={capturedPhotoUrl}
                    alt="Foto capturada"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#1877F2] text-white font-bold text-[10px] uppercase shadow-md flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Foto Lista
                  </div>
                </div>
              )}

              {/* Error or Idle Fallback */}
              {!isCameraActive && !capturedPhotoUrl && (
                <div className="p-6 text-center space-y-3">
                  {cameraError ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                      {cameraError}
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#F0F2F5] border border-[#CED0D4] flex items-center justify-center mx-auto text-[#1877F2]">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}

                  <button
                    onClick={() => startCamera()}
                    className="px-4 py-2 rounded-xl bg-[#1877F2] text-white font-bold text-xs hover:bg-[#0866FF] shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Iniciar Cámara
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] text-xs font-semibold cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#65676B]" />
                  <span>Subir Archivo</span>
                </button>

                {capturedPhotoUrl && (
                  <button
                    onClick={() => startCamera()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] text-xs font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Repetir</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCloseCameraModal}
                  className="px-3 py-2 rounded-xl bg-[#E4E6EB] text-[#050505] text-xs font-semibold hover:bg-[#D8DADF]"
                >
                  Cerrar
                </button>
                {capturedPhotoUrl && (
                  <button
                    onClick={handleSaveCapturedAvatar}
                    className="px-4 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-bold hover:bg-[#0866FF] shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Foto</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: OFFICIAL DIGITAL PLAYER CREDENTIAL / PASS         */}
      {/* ========================================================= */}
      {isCredentialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md bg-white border border-[#CED0D4] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 my-6">
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between border-b border-[#CED0D4] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1877F2]" />
                <h3 className="text-sm sm:text-base font-black text-[#050505]">
                  Credencial Oficial de Fútbol 7
                </h3>
              </div>
              <button
                onClick={() => setIsCredentialOpen(false)}
                className="p-1.5 rounded-full text-[#65676B] hover:text-[#050505] hover:bg-[#F0F2F5] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Credential Card To Download */}
            <div
              ref={credentialCardRef}
              id="player-credential-card"
              className="relative bg-gradient-to-b from-[#0e2a47] via-[#103158] to-[#0a1e35] border-4 border-[#1877F2] rounded-2xl p-5 shadow-2xl overflow-hidden space-y-4 text-center text-white"
            >
              {/* Top Lanyard Slot Graphic */}
              <div className="w-14 h-2 rounded-full bg-black/60 border border-white/20 mx-auto" />

              {/* Inner Decorative Trim */}
              <div className="absolute inset-2 border border-white/15 rounded-xl pointer-events-none" />
              <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-[#1877F2] pointer-events-none" />
              <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-[#1877F2] pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-[#1877F2] pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-[#1877F2] pointer-events-none" />

              {/* Team & League Header */}
              <div className="relative z-10 flex items-center justify-between border-b border-white/20 pb-3 gap-2">
                <div className="flex items-center gap-2.5 text-left">
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-xl object-cover border border-white/30 shadow-md bg-white"
                  />
                  <div>
                    <h4 className="text-xs font-black text-white leading-tight uppercase">
                      {team.name}
                    </h4>
                    <p className="text-[10px] text-[#60A5FA] font-bold uppercase tracking-wider">
                      LIGA FÚTBOL 7 • 7v7
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#1877F2] text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                    {team.season || 'Temporada 2026'}
                  </span>
                  <span className="block text-[8px] text-blue-200 uppercase mt-0.5 font-semibold">
                    Acreditación Oficial
                  </span>
                </div>
              </div>

              {/* Player Photo + Badge */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative">
                  <img
                    src={player.avatarUrl || DEFAULT_FACEBOOK_AVATAR}
                    alt={player.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_FACEBOOK_AVATAR;
                    }}
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-white shadow-2xl bg-[#E4E6EB]"
                  />
                  {/* Number Badge */}
                  <span className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-[#1877F2] text-white font-mono font-black text-lg flex items-center justify-center shadow-xl border-2 border-white">
                    #{player.number}
                  </span>
                </div>

                {/* Full Name & Alias */}
                <div className="mt-3.5">
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide break-words leading-tight">
                    {player.name}
                  </h3>
                  {player.nickname ? (
                    <p className="text-xs font-extrabold text-[#93C5FD] mt-0.5">
                      "{player.nickname}"
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Official Credential Fields Grid */}
              <div className="relative z-10 bg-black/40 rounded-xl p-3 border border-white/15 grid grid-cols-2 gap-2 text-left text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-blue-200 block">
                    Posición
                  </span>
                  <span className="font-extrabold text-white text-xs">
                    {getPositionLabel(player.position)}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-blue-200 block">
                    Dorsal
                  </span>
                  <span className="font-mono font-bold text-[#60A5FA] text-xs">
                    Número #{player.number}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-blue-200 block">
                    Equipo
                  </span>
                  <span className="font-bold text-white text-xs truncate block">
                    {team.shortName || team.name}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-bold text-blue-200 block">
                    Temporada
                  </span>
                  <span className="font-bold text-[#93C5FD] text-xs">
                    {team.season || '2026'}
                  </span>
                </div>
              </div>

              {/* Barcode & Verification Seal */}
              <div className="relative z-10 pt-1 flex items-center justify-between gap-3 text-left">
                <div>
                  <div className="flex items-center gap-1 font-mono text-[9px] text-blue-200 tracking-wider">
                    <span>FOLIO:</span>
                    <strong className="text-white">
                      FUT7-{team.shortName?.slice(0, 3) || 'TG'}-{player.id.toUpperCase()}-2026
                    </strong>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {/* Simulated vector barcode */}
                    <div className="flex items-center gap-0.5 h-6 opacity-80">
                      {[3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4].map((w, i) => (
                        <div
                          key={i}
                          className="bg-white h-full"
                          style={{ width: `${w}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/10 border border-white/20 text-white">
                  <ShieldCheck className="w-5 h-5 text-[#60A5FA]" />
                  <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5">
                    FUT 7 OFICIAL
                  </span>
                </div>
              </div>
            </div>

            {/* Gallery Download Button */}
            <button
              id="btn-download-credential-gallery"
              onClick={handleDownloadCredential}
              disabled={isDownloadingCredential}
              className="w-full py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4 text-white shrink-0" />
              <span>
                {isDownloadingCredential
                  ? 'Guardando en Galería...'
                  : 'Descargar Credencial (Guardar en Galería)'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
