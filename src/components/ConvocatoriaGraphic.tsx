import React, { useState, useRef } from 'react';
import {
  Users,
  Download,
  Share2,
  Plus,
  Trash2,
  Upload,
  Check,
  Sparkles,
  Shield,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Palette,
  RotateCcw,
  ExternalLink,
  Copy,
  X,
  Camera,
} from 'lucide-react';
import {
  Match,
  TeamInfo,
  Player,
  AppUser,
  Language,
  PlayerPosition,
  getPositionCategory,
  ALL_POSITIONS,
  DEFAULT_FACEBOOK_AVATAR,
} from '../types';
import { getT } from '../utils/translations';
import {
  STADIUM_BACKGROUND_PRESETS,
  COLOR_THEME_PRESETS,
  loadCanvasImageSafe,
  downloadCanvasOrBlob,
  CanvasExportResult,
  triggerBrowserFileDownload,
} from '../utils/graphicPresets';
import { copyImageToClipboard } from '../utils/lineupPosterGenerator';
import { CameraCaptureModal } from './CameraCaptureModal';

interface ConvocatoriaGraphicProps {
  team: TeamInfo;
  setTeam: React.Dispatch<React.SetStateAction<TeamInfo>>;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  matches: Match[];
  currentUser: AppUser;
  language: Language;
  selectedMatchId?: string;
}

export const ConvocatoriaGraphic: React.FC<ConvocatoriaGraphicProps> = ({
  team,
  setTeam,
  players,
  setPlayers,
  matches,
  currentUser,
  language,
  selectedMatchId,
}) => {
  const t = getT(language);
  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';

  const [activeMatchId, setActiveMatchId] = useState<string>(
    selectedMatchId || matches[0]?.id || ''
  );

  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);

  // New Player state
  const [newPlayer, setNewPlayer] = useState<{
    name: string;
    nickname: string;
    number: number;
    position: PlayerPosition;
    avatarUrl: string;
  }>({
    name: '',
    nickname: '',
    number: 10,
    position: 'DEL',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  });
  const [showPlayerCameraModal, setShowPlayerCameraModal] = useState(false);
  const playerFileInputRef = useRef<HTMLInputElement>(null);

  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const side = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
        const sx = ((img.naturalWidth || img.width) - side) / 2;
        const sy = ((img.naturalHeight || img.height) - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, 500, 500);
        const squareData = canvas.toDataURL('image/jpeg', 0.92);
        setNewPlayer((prev) => ({ ...prev, avatarUrl: squareData }));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Edit Team state
  const [teamForm, setTeamForm] = useState({
    name: team.name,
    shortName: team.shortName,
    leagueName: team.leagueName,
    logoUrl: team.logoUrl,
    bannerUrl: team.bannerUrl,
  });

  const posterRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Stadium background & team color customization
  const [selectedBg, setSelectedBg] = useState<string>(
    STADIUM_BACKGROUND_PRESETS[0].url
  );
  const [primaryColor, setPrimaryColor] = useState<string>(
    team.primaryColor || '#1877F2'
  );
  const [secondaryColor, setSecondaryColor] = useState<string>(
    team.secondaryColor || '#0866FF'
  );
  const [colorsSaved, setColorsSaved] = useState(false);
  const [showStyleControls, setShowStyleControls] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<CanvasExportResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Save customized colors to team
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

  const currentMatch = matches.find((m) => m.id === activeMatchId) || matches[0];

  // Called up player toggles
  const togglePlayerCalledUp = (playerId: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, isCalledUp: !p.isCalledUp } : p))
    );
  };

  const selectAllPlayers = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, isCalledUp: true })));
  };

  const clearAllPlayers = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, isCalledUp: false })));
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.name.trim()) return;

    const created: Player = {
      id: `p_${Date.now()}`,
      name: newPlayer.name,
      nickname: newPlayer.nickname || undefined,
      number: Number(newPlayer.number),
      position: newPlayer.position,
      avatarUrl: newPlayer.avatarUrl,
      goals: 0,
      assists: 0,
      matches: 0,
      yellowCards: 0,
      redCards: 0,
      isCalledUp: true,
      isStarter: false,
      mvpHistory: [],
    };

    setPlayers((prev) => [...prev, created]);
    setShowAddPlayerModal(false);
    setNewPlayer({
      name: '',
      nickname: '',
      number: 11,
      position: 'DEL',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    });
  };

  const handleDeletePlayer = (playerId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar a este jugador de la plantilla?')) {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }
  };

  const handleSaveTeamIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    setTeam((prev) => ({
      ...prev,
      name: teamForm.name,
      shortName: teamForm.shortName,
      leagueName: teamForm.leagueName,
      logoUrl: teamForm.logoUrl,
      bannerUrl: teamForm.bannerUrl,
    }));
    setShowEditTeamModal(false);
  };

  // Group called-up players by position for official flyer layout
  const calledUpPlayers = players.filter((p) => p.isCalledUp);
  const effectiveSquad = calledUpPlayers.length > 0 ? calledUpPlayers : players;
  const goalkeepers = effectiveSquad.filter((p) => getPositionCategory(p.position) === 'POR');
  const defenders = effectiveSquad.filter((p) => getPositionCategory(p.position) === 'DEF');
  const midfielders = effectiveSquad.filter((p) => getPositionCategory(p.position) === 'MED');
  const forwards = effectiveSquad.filter((p) => getPositionCategory(p.position) === 'DEL');

  // Helper for drawing rounded rectangle with native roundRect or arcTo fallback
  const safeRoundRect = (
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    if (typeof (c as any).roundRect === 'function') {
      c.beginPath();
      (c as any).roundRect(x, y, w, h, r);
      return;
    }
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };

  // Generate PNG image using pure Canvas drawing from vector & DOM coordinates
  const handleDownloadGraphic = async () => {
    setIsGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      const width = 1080;
      const height = 1520; // High-definition portrait flyer with MVP Spotlight & full squad
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Base solid dark
      ctx.fillStyle = '#05070B';
      ctx.fillRect(0, 0, width, height);

      // Layer 1: Draw Stadium / Pitch / Players background image
      const bgImg = await loadCanvasImageSafe(selectedBg);
      if (bgImg) {
        ctx.save();
        ctx.drawImage(bgImg, 0, 0, width, height);
        ctx.restore();
      }

      // Layer 2: Rich dark gradient overlay with brand color aura
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(5, 7, 11, 0.90)');
      grad.addColorStop(0.3, 'rgba(5, 7, 11, 0.72)');
      grad.addColorStop(0.85, 'rgba(5, 7, 11, 0.95)');
      grad.addColorStop(1, 'rgba(5, 7, 11, 0.98)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Top brand color glow behind logo
      const radialGlow = ctx.createRadialGradient(width / 2, 110, 10, width / 2, 110, 380);
      radialGlow.addColorStop(0, `${primaryColor}45`);
      radialGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, 450);

      // Layer 3: Draw Team Logo with circular frame
      const logoImg = await loadCanvasImageSafe(team.logoUrl);
      const logoX = width / 2;
      const logoY = 90;
      const logoR = 48;

      ctx.save();
      // Glowing outer ring
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(logoX, logoY, logoR + 2, 0, Math.PI * 2);
      ctx.stroke();

      if (logoImg) {
        ctx.beginPath();
        ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logoImg, logoX - logoR, logoY - logoR, logoR * 2, logoR * 2);
      } else {
        // Stylish fallback shield
        ctx.fillStyle = primaryColor;
        ctx.beginPath();
        ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(team.shortName.charAt(0) || 'T', logoX, logoY);
      }
      ctx.restore();

      // Team Name & League Header
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 46px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(team.name.toUpperCase(), width / 2, 185);

      ctx.fillStyle = secondaryColor || '#60A5FA';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText(team.leagueName.toUpperCase(), width / 2, 218);

      // Golden geometric line
      ctx.strokeStyle = `${primaryColor}60`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, 235);
      ctx.lineTo(width - 100, 235);
      ctx.stroke();

      // Match Banner Block
      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
      safeRoundRect(ctx, 80, 255, width - 160, 130, 20);
      ctx.fill();
      ctx.strokeStyle = `${primaryColor}80`;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
      ctx.fillText('PRÓXIMO ENCUENTRO OFICIAL', width / 2, 285);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        `${team.shortName}  VS  ${currentMatch ? currentMatch.rival.toUpperCase() : 'RIVAL'}`,
        width / 2,
        328
      );

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '17px system-ui, -apple-system, sans-serif';
      const matchDetails = currentMatch
        ? `📅 ${currentMatch.date}  •  ⏰ ${currentMatch.time} hrs  •  📍 ${currentMatch.stadium}`
        : 'Horario y Estadio por confirmar';
      ctx.fillText(matchDetails, width / 2, 362);

      // ----------------------------------------------------
      // MVP / DESTACADO SPOTLIGHT CARD (prominent photo and recognition)
      // ----------------------------------------------------
      let spotlightPlayer: Player | undefined;
      if (currentMatch?.mvpId) {
        spotlightPlayer = players.find((p) => p.id === currentMatch.mvpId);
      }
      if (!spotlightPlayer && currentMatch?.mvpPlayerName) {
        spotlightPlayer = players.find(
          (p) =>
            p.name.trim().toLowerCase() === currentMatch.mvpPlayerName?.trim().toLowerCase() ||
            (p.nickname && p.nickname.trim().toLowerCase() === currentMatch.mvpPlayerName?.trim().toLowerCase())
        );
      }
      if (!spotlightPlayer) {
        spotlightPlayer =
          effectiveSquad.find((p) => p.mvpHistory && p.mvpHistory.length > 0) ||
          effectiveSquad.find((p) => p.isStarter) ||
          effectiveSquad[0];
      }

      const spotlightPhotoCandidate =
        currentMatch?.mvpPhotoUrl ||
        spotlightPlayer?.mvpHistory?.[0]?.photoUrl ||
        spotlightPlayer?.avatarUrl ||
        '';

      const mvpCardY = 405;
      const mvpCardH = 120;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      safeRoundRect(ctx, 80, mvpCardY, width - 160, mvpCardH, 20);
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Golden Header ribbon inside MVP card
      const mvpBadgeGrad = ctx.createLinearGradient(80, mvpCardY, width - 80, mvpCardY);
      mvpBadgeGrad.addColorStop(0, '#B45309');
      mvpBadgeGrad.addColorStop(0.5, '#F59E0B');
      mvpBadgeGrad.addColorStop(1, '#B45309');
      ctx.fillStyle = mvpBadgeGrad;
      safeRoundRect(ctx, 80, mvpCardY, width - 160, 26, 12);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = '900 12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        currentMatch?.status === 'finished' ? '★ MVP OFICIAL DEL PARTIDO ★' : '★ FIGURA A SEGUIR / JUGADOR DESTACADO ★',
        width / 2,
        mvpCardY + 18
      );

      // MVP Photo drawing
      const photoCenterX = 150;
      const photoCenterY = mvpCardY + 72;
      const photoRadius = 38;

      const mvpImg = await loadCanvasImageSafe(spotlightPhotoCandidate);
      ctx.save();
      ctx.beginPath();
      ctx.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#1E293B';
      ctx.fill();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.clip();

      if (mvpImg) {
        const iRatio = Math.max((photoRadius * 2) / mvpImg.width, (photoRadius * 2) / mvpImg.height);
        const iW = mvpImg.width * iRatio;
        const iH = mvpImg.height * iRatio;
        ctx.drawImage(mvpImg, photoCenterX - iW / 2, photoCenterY - iH / 2, iW, iH);
      } else {
        ctx.fillStyle = '#0284C7';
        ctx.fillRect(photoCenterX - photoRadius, photoCenterY - photoRadius, photoRadius * 2, photoRadius * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 20px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(spotlightPlayer?.name ? spotlightPlayer.name.charAt(0) : '#10', photoCenterX, photoCenterY);
      }
      ctx.restore();

      // MVP Player Info next to photo
      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 24px system-ui, -apple-system, sans-serif';
      const sName = spotlightPlayer?.name || 'Jugador Destacado';
      ctx.fillText(sName, 210, mvpCardY + 62);

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      const sNick = spotlightPlayer?.nickname ? ` "${spotlightPlayer.nickname}"` : '';
      ctx.fillText(
        `Dorsal #${spotlightPlayer?.number || '10'}  •  ${spotlightPlayer?.position || 'JUG'}${sNick}`,
        210,
        mvpCardY + 86
      );

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      const sStats = `${spotlightPlayer?.goals || 0} Goles oficiales  •  ${spotlightPlayer?.mvpHistory?.length || 0} MVPs`;
      ctx.fillText(sStats, 210, mvpCardY + 107);

      // ----------------------------------------------------
      // Big Title: CONVOCATORIA OFICIAL
      // ----------------------------------------------------
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 44px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`★ CONVOCATORIA OFICIAL (${effectiveSquad.length}) ★`, width / 2, 570);

      // Columns for positions
      const colLeftX = 140;
      const colRightX = width / 2 + 60;

      const drawPositionGroup = (
        title: string,
        groupPlayers: Player[],
        startX: number,
        startY: number
      ) => {
        ctx.textAlign = 'left';
        ctx.fillStyle = primaryColor;
        ctx.font = '900 22px system-ui, -apple-system, sans-serif';
        ctx.fillText(title, startX, startY);

        let y = startY + 34;
        if (groupPlayers.length === 0) {
          ctx.fillStyle = '#64748b';
          ctx.font = 'italic 16px system-ui, -apple-system, sans-serif';
          ctx.fillText('Sin futbolistas en esta línea', startX + 15, y);
        } else {
          groupPlayers.forEach((p) => {
            // Jersey badge
            ctx.fillStyle = primaryColor;
            safeRoundRect(ctx, startX, y - 20, 42, 26, 6);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(String(p.number), startX + 21, y - 2);

            // Player name
            ctx.textAlign = 'left';
            ctx.font = 'bold 19px system-ui, -apple-system, sans-serif';
            ctx.fillStyle = '#f8fafc';
            const displayName = p.name + (p.nickname ? ` "${p.nickname}"` : '');
            ctx.fillText(displayName, startX + 54, y - 2);
            y += 38;
          });
        }
      };

      // Left Column: Porteros + Defensas
      drawPositionGroup('PORTEROS', goalkeepers, colLeftX, 630);
      drawPositionGroup('DEFENSAS', defenders, colLeftX, 760);

      // Right Column: Mediocampistas + Delanteros
      drawPositionGroup('MEDIOCAMPISTAS', midfielders, colRightX, 630);
      drawPositionGroup('DELANTEROS', forwards, colRightX, 880);

      // Bottom sponsor / footer bar
      ctx.fillStyle = 'rgba(10, 15, 26, 0.95)';
      ctx.fillRect(0, height - 90, width, 90);
      ctx.fillStyle = secondaryColor || '#60A5FA';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('¡VAMOS POR LOS TRES PUNTOS!  #JuntosPorLaGloria', width / 2, height - 48);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px system-ui, -apple-system, sans-serif';
      ctx.fillText(`Diseñado en TeamGol App  •  ${team.name}`, width / 2, height - 20);

      // Export as PNG using safe Blob Downloader
      const fileName = `Convocatoria_${team.shortName}_vs_${currentMatch?.rival || 'Partido'}.png`;
      const res = await downloadCanvasOrBlob(canvas, fileName);
      if (res) {
        setGeneratedResult(res);
      }
    } catch (err) {
      console.error('Error generating image flyer:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#242526] p-5 rounded-2xl border border-[#CED0D4] dark:border-white/10 shadow-xs transition-colors">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#050505] dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1877F2]" />
            {t.convocatoria.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#65676B] dark:text-gray-400 mt-0.5 font-medium">
            {t.convocatoria.subtitle}
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
                vs {m.rival} ({m.date})
              </option>
            ))}
          </select>

          {/* Download Graphic Button */}
          <button
            id="btn-download-convocatoria"
            onClick={handleDownloadGraphic}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isGenerating ? 'Generando...' : t.convocatoria.downloadGraphic}
          </button>

          {/* Team Identity Button (Owner) */}
          {isOwnerOrAdmin && (
            <button
              onClick={() => setShowEditTeamModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300 font-bold text-xs border border-[#CED0D4] dark:border-white/10 transition-all cursor-pointer shadow-xs"
              title="Actualizar Escudo, Foto y Nombre del Club"
            >
              <Shield className="w-4 h-4 text-[#1877F2]" />
              {t.convocatoria.teamDetails}
            </button>
          )}

          {/* Toggle Styles & Colors Button (Admin Only) */}
          {isOwnerOrAdmin && (
            <button
              onClick={() => setShowStyleControls(!showStyleControls)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                showStyleControls
                  ? 'bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]'
                  : 'bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300 border-[#CED0D4] dark:border-white/10'
              }`}
              title="Personalizar fondo de estadio y jugar con los colores del club"
            >
              <Palette className="w-4 h-4 text-emerald-500" />
              <span>Estadio & Colores</span>
            </button>
          )}
        </div>
      </div>

      {/* Non-Admin Player Notice Banner */}
      {!isOwnerOrAdmin && (
        <div className="bg-[#E7F3FF] dark:bg-[#1877F2]/10 border border-[#1877F2]/30 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-black text-[#050505] dark:text-white">
              Modo Jugador: Visualización Oficial de la Convocatoria
            </h4>
            <p className="text-[11px] sm:text-xs text-[#65676B] dark:text-gray-300 font-medium">
              Puedes consultar la lista de futbolistas citados para este encuentro y descargar el póster oficial en alta resolución. La convocatoria sólo puede ser modificada por el cuerpo técnico o administración.
            </p>
          </div>
        </div>
      )}

      {/* Accordion: Customize Stadium Background & Colors (Admin Only) */}
      {isOwnerOrAdmin && showStyleControls && (
        <div className="bg-white dark:bg-[#242526] p-4 rounded-2xl border border-[#CED0D4] dark:border-white/10 shadow-xs mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#CED0D4] dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-bold text-[#050505] dark:text-white">
                Personalizar Fondo de Estadio y Colores del Escudo
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPrimaryColor(team.primaryColor || '#1877F2');
                  setSecondaryColor(team.secondaryColor || '#0866FF');
                  setSelectedBg(STADIUM_BACKGROUND_PRESETS[0].url);
                }}
                className="text-xs text-gray-500 hover:text-[#1877F2] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Background Stadium Selectors */}
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                <span>Fondo de Estadio / Campo / Jugadores</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {STADIUM_BACKGROUND_PRESETS.map((preset) => {
                  const isSelected = selectedBg === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedBg(preset.url)}
                      className={`relative rounded-xl overflow-hidden text-left p-1 border transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-400/40'
                          : 'border-[#CED0D4] dark:border-white/10 hover:border-gray-400'
                      }`}
                    >
                      <div className="h-12 rounded-lg overflow-hidden relative mb-1">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30" />
                        {isSelected && (
                          <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-[9px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-[#050505] dark:text-white block truncate">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors Selectors */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-emerald-500" />
                <span>Colores del Club (Para Convocatoria y Alineación)</span>
              </label>

              {/* Theme chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {COLOR_THEME_PRESETS.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setPrimaryColor(theme.primary);
                      setSecondaryColor(theme.secondary);
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F0F2F5] dark:bg-black/30 border border-[#CED0D4] dark:border-white/10 text-[11px] font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 cursor-pointer"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/40"
                      style={{ backgroundColor: theme.primary }}
                    />
                    <span>{theme.name}</span>
                  </button>
                ))}
              </div>

              {/* Color inputs */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex items-center gap-2 p-1.5 rounded-xl border border-[#CED0D4] dark:border-white/10 bg-[#F0F2F5] dark:bg-black/20">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">
                      Color Primario
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200 uppercase">
                      {primaryColor}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-1.5 rounded-xl border border-[#CED0D4] dark:border-white/10 bg-[#F0F2F5] dark:bg-black/20">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">
                      Color Secundario
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200 uppercase">
                      {secondaryColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save colors to club */}
              {isOwnerOrAdmin && (
                <button
                  type="button"
                  onClick={handleSaveColorsToClub}
                  className="w-full py-1.5 px-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] text-xs font-bold flex items-center justify-center gap-1.5 border border-[#1877F2]/30 cursor-pointer"
                >
                  {colorsSaved ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Shield className="w-3.5 h-3.5" />}
                  <span>{colorsSaved ? '¡Guardado en el perfil del club!' : 'Guardar estos colores en el club'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Live Visual Graphic Preview */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Vista Previa de la Gráfica Oficial
            </span>
            <span className="text-xs text-emerald-400 font-bold">
              {calledUpPlayers.length} Convocados
            </span>
          </div>

          {/* Graphic Container */}
          <div
            ref={posterRef}
            id="convocatoria-poster"
            className="w-full max-w-lg rounded-2xl border-2 p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between"
            style={{
              borderColor: `${primaryColor}60`,
              backgroundColor: '#07090E',
            }}
          >
            {/* Background Stadium Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={selectedBg}
                alt="Estadio"
                crossOrigin="anonymous"
                className="w-full h-full object-cover brightness-[0.30] contrast-125 scale-105"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, rgba(5,7,11,0.85) 0%, rgba(5,7,11,0.65) 40%, rgba(5,7,11,0.92) 100%)`,
                }}
              />
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
                style={{ backgroundColor: primaryColor }}
              />
            </div>

            {/* Foreground Content */}
            <div className="relative z-10">
              {/* Team Logo & Header */}
              <div className="flex flex-col items-center text-center mb-4">
                <div className="relative mb-2">
                  <div
                    className="absolute -inset-1 rounded-full blur-md opacity-70 animate-pulse"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <img
                    src={team.logoUrl || DEFAULT_FACEBOOK_AVATAR}
                    alt={team.name}
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_FACEBOOK_AVATAR;
                    }}
                    className="relative w-14 h-14 rounded-full object-cover border-2 shadow-xl bg-black/60"
                    style={{ borderColor: primaryColor }}
                  />
                </div>

                <h3 className="text-lg sm:text-xl font-black text-white tracking-wider truncate uppercase drop-shadow-md">
                  {team.name}
                </h3>
                <p
                  className="text-xs font-bold uppercase tracking-widest mt-0.5 drop-shadow-sm"
                  style={{ color: secondaryColor || '#60A5FA' }}
                >
                  {team.leagueName}
                </p>
              </div>

              {/* Match info chip */}
              {currentMatch && (
                <div
                  className="bg-black/60 backdrop-blur-md rounded-xl p-3 mb-4 text-center shadow-lg border"
                  style={{ borderColor: `${primaryColor}40` }}
                >
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                    ★ PARTIDO OFICIAL ★
                  </div>
                  <div className="text-base font-bold text-white my-0.5">
                    {team.shortName} <span className="text-gray-400">VS</span> {currentMatch.rival.toUpperCase()}
                  </div>
                  <div className="text-[11px] text-gray-300 flex items-center justify-center gap-2 flex-wrap font-medium">
                    <span>📅 {currentMatch.date}</span>
                    <span>•</span>
                    <span>⏰ {currentMatch.time} hrs</span>
                    <span>•</span>
                    <span className="truncate">📍 {currentMatch.stadium}</span>
                  </div>
                </div>
              )}

              {/* Callup Title Banner */}
              <div className="text-center mb-4">
                <span
                  className="inline-block px-4 py-1 rounded-full border text-xs font-black tracking-widest uppercase shadow-md"
                  style={{
                    backgroundColor: `${primaryColor}25`,
                    borderColor: primaryColor,
                    color: '#F59E0B',
                  }}
                >
                  ★ CONVOCATORIA OFICIAL ★
                </span>
              </div>

              {/* Squad lists by position */}
              <div className="grid grid-cols-2 gap-4 text-left">
                {/* Left Column: POR & DEF */}
                <div className="space-y-4">
                  <div>
                    <h5
                      className="text-[11px] font-black uppercase tracking-wider mb-2 border-b pb-1"
                      style={{
                        color: primaryColor,
                        borderColor: `${primaryColor}30`,
                      }}
                    >
                      Porteros ({goalkeepers.length})
                    </h5>
                    <div className="space-y-1.5">
                      {goalkeepers.length === 0 ? (
                        <p className="text-[11px] text-gray-500 italic">Sin convocados</p>
                      ) : (
                        goalkeepers.map((p) => (
                          <div key={p.id} className="flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded-md text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {p.number}
                            </span>
                            <span className="text-xs font-semibold text-gray-200 truncate">
                              {p.name}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h5
                      className="text-[11px] font-black uppercase tracking-wider mb-2 border-b pb-1"
                      style={{
                        color: primaryColor,
                        borderColor: `${primaryColor}30`,
                      }}
                    >
                      Defensas ({defenders.length})
                    </h5>
                    <div className="space-y-1.5">
                      {defenders.length === 0 ? (
                        <p className="text-[11px] text-gray-500 italic">Sin convocados</p>
                      ) : (
                        defenders.map((p) => (
                          <div key={p.id} className="flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded-md text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {p.number}
                            </span>
                            <span className="text-xs font-semibold text-gray-200 truncate">
                              {p.name}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: MED & DEL */}
                <div className="space-y-4">
                  <div>
                    <h5
                      className="text-[11px] font-black uppercase tracking-wider mb-2 border-b pb-1"
                      style={{
                        color: primaryColor,
                        borderColor: `${primaryColor}30`,
                      }}
                    >
                      Medios ({midfielders.length})
                    </h5>
                    <div className="space-y-1.5">
                      {midfielders.length === 0 ? (
                        <p className="text-[11px] text-gray-500 italic">Sin convocados</p>
                      ) : (
                        midfielders.map((p) => (
                          <div key={p.id} className="flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded-md text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {p.number}
                            </span>
                            <span className="text-xs font-semibold text-gray-200 truncate">
                              {p.name}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h5
                      className="text-[11px] font-black uppercase tracking-wider mb-2 border-b pb-1"
                      style={{
                        color: primaryColor,
                        borderColor: `${primaryColor}30`,
                      }}
                    >
                      Delanteros ({forwards.length})
                    </h5>
                    <div className="space-y-1.5">
                      {forwards.length === 0 ? (
                        <p className="text-[11px] text-gray-500 italic">Sin convocados</p>
                      ) : (
                        forwards.map((p) => (
                          <div key={p.id} className="flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded-md text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {p.number}
                            </span>
                            <span className="text-xs font-semibold text-gray-200 truncate">
                              {p.name}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Poster Footer Stamp */}
            <div className="relative z-10 mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-400 font-medium">
              <span>📍 {team.stadium}</span>
              <span
                className="font-black uppercase tracking-wider"
                style={{ color: secondaryColor || '#60A5FA' }}
              >
                #{team.shortName || 'TeamGol'} • VamosPorLaVictoria
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Roster Controls & Player Registration */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#242526] p-5 rounded-2xl border border-[#CED0D4] dark:border-white/10 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#050505] dark:text-white">
                  {isOwnerOrAdmin
                    ? `${t.convocatoria.rosterTitle} (${players.length})`
                    : `Convocados Oficiales (${calledUpPlayers.length})`}
                </h3>
                <p className="text-xs text-[#65676B] dark:text-gray-400 font-medium">
                  {isOwnerOrAdmin
                    ? 'Marca los jugadores que jugarán este partido'
                    : 'Lista oficial definida por el cuerpo técnico para este encuentro'}
                </p>
              </div>

              {isOwnerOrAdmin && (
                <button
                  id="btn-add-player-roster"
                  onClick={() => setShowAddPlayerModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.convocatoria.addPlayer}
                </button>
              )}
            </div>

            {/* Quick bulk actions (Admin Only) */}
            {isOwnerOrAdmin && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={selectAllPlayers}
                  className="px-2.5 py-1 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-white/5 dark:hover:bg-white/10 text-[#050505] dark:text-gray-300 border border-[#CED0D4] dark:border-white/10 text-xs font-bold cursor-pointer"
                >
                  {t.convocatoria.allCalled}
                </button>
                <button
                  onClick={clearAllPlayers}
                  className="px-2.5 py-1 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-white/5 dark:hover:bg-white/10 text-[#65676B] dark:text-gray-400 border border-[#CED0D4] dark:border-white/10 text-xs font-bold cursor-pointer"
                >
                  {t.convocatoria.clearAll}
                </button>
              </div>
            )}

            {/* Players list with toggle checkboxes */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {players.map((player) => (
                <div
                  key={player.id}
                  id={`player-row-${player.id}`}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    player.isCalledUp
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30'
                      : 'bg-[#F0F2F5] dark:bg-black/40 border-[#CED0D4]/70 dark:border-white/5 hover:border-[#1877F2]/40'
                  }`}
                >
                  <div
                    onClick={isOwnerOrAdmin ? () => togglePlayerCalledUp(player.id) : undefined}
                    className={`flex items-center gap-3 ${isOwnerOrAdmin ? 'cursor-pointer' : 'cursor-default'} flex-1 min-w-0`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                        player.isCalledUp
                          ? 'bg-[#1877F2] text-white shadow-xs'
                          : 'border border-[#CED0D4] dark:border-white/10 bg-white dark:bg-black/50'
                      }`}
                    >
                      {player.isCalledUp && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-[#CED0D4] dark:ring-white/10"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-[#1877F2] dark:text-emerald-400">
                          #{player.number}
                        </span>
                        <span className="text-xs font-bold text-[#050505] dark:text-white truncate">
                          {player.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#65676B] dark:text-gray-400 font-medium">
                        {player.position} • {player.goals} goles • {player.mvpHistory?.length || 0} MVPs
                      </span>
                    </div>
                  </div>

                  {isOwnerOrAdmin && (
                    <button
                      onClick={() => handleDeletePlayer(player.id)}
                      className="p-1 text-[#65676B] hover:text-rose-500 transition-colors ml-2 cursor-pointer"
                      title="Eliminar de plantilla"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add New Player to Roster */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#242526] border border-[#CED0D4] dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 text-[#050505] dark:text-white">
            <h3 className="text-lg font-black text-[#050505] dark:text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#1877F2]" />
              {t.convocatoria.addPlayer}
            </h3>

            <form onSubmit={handleAddPlayer} className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  placeholder="ej. Santiago Giménez"
                  className="w-full px-3 py-2 bg-[#F0F2F5] dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-sm font-medium focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1">
                    Número de Camiseta
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={newPlayer.number}
                    onChange={(e) => setNewPlayer({ ...newPlayer, number: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-[#F0F2F5] dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-sm font-medium focus:outline-none focus:border-[#1877F2]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1">
                    Posición
                  </label>
                  <select
                    value={newPlayer.position}
                    onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value as PlayerPosition })}
                    className="w-full px-3 py-2 bg-[#F0F2F5] dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-xs font-medium focus:outline-none focus:border-[#1877F2] cursor-pointer"
                  >
                    <optgroup label="🧤 Portería">
                      {ALL_POSITIONS.filter((p) => p.category === 'POR').map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🛡️ Defensas">
                      {ALL_POSITIONS.filter((p) => p.category === 'DEF').map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="⚡ Mediocampistas">
                      {ALL_POSITIONS.filter((p) => p.category === 'MED').map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="⚽ Delanteros">
                      {ALL_POSITIONS.filter((p) => p.category === 'DEL').map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1">
                  Apodo / Sobrenombre (Opcional)
                </label>
                <input
                  type="text"
                  value={newPlayer.nickname}
                  onChange={(e) => setNewPlayer({ ...newPlayer, nickname: e.target.value })}
                  placeholder="ej. Bebote"
                  className="w-full px-3 py-2 bg-[#F0F2F5] dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-sm font-medium focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              {/* Photo Options with Live Camera & Gallery */}
              <div className="p-3 bg-[#F0F2F5] dark:bg-black/40 rounded-xl border border-[#CED0D4] dark:border-white/10 space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={newPlayer.avatarUrl || DEFAULT_FACEBOOK_AVATAR}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_FACEBOOK_AVATAR;
                    }}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[#1877F2]/40 bg-white"
                  />
                  <div className="flex-1">
                    <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1">
                      Foto de Perfil
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setShowPlayerCameraModal(true)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Tomar Foto</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => playerFileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/10 text-[#050505] dark:text-white text-xs font-bold border border-[#CED0D4] dark:border-white/10 flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-[#1877F2]" />
                        <span>Galería</span>
                      </button>

                      <input
                        ref={playerFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleDeviceFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                <input
                  type="url"
                  value={newPlayer.avatarUrl}
                  onChange={(e) => setNewPlayer({ ...newPlayer, avatarUrl: e.target.value })}
                  placeholder="O ingresa URL de foto..."
                  className="w-full px-3 py-1.5 bg-white dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-lg text-[#050505] dark:text-white text-xs font-medium focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#CED0D4] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddPlayerModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300 text-xs font-bold border border-[#CED0D4] dark:border-white/10 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Registrar Jugador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Team Identity (Owner / Logo / Banner) */}
      {showEditTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#242526] border border-[#CED0D4] dark:border-white/10 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 text-[#050505] dark:text-white">
            <h3 className="text-lg font-black text-[#050505] dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#1877F2]" />
              {t.convocatoria.teamDetails}
            </h3>

            <form onSubmit={handleSaveTeamIdentity} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1">
                    {t.convocatoria.teamName}
                  </label>
                  <input
                    type="text"
                    required
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F0F2F5] dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-sm font-medium focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1">
                    {t.convocatoria.shortName}
                  </label>
                  <input
                    type="text"
                    required
                    value={teamForm.shortName}
                    onChange={(e) => setTeamForm({ ...teamForm, shortName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F0F2F5] dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-sm font-medium focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1">
                  {t.convocatoria.league}
                </label>
                <input
                  type="text"
                  required
                  value={teamForm.leagueName}
                  onChange={(e) => setTeamForm({ ...teamForm, leagueName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F0F2F5] dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-sm font-medium focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1 flex items-center justify-between">
                  <span>{t.convocatoria.uploadLogo} (URL)</span>
                </label>
                <input
                  type="url"
                  value={teamForm.logoUrl}
                  onChange={(e) => setTeamForm({ ...teamForm, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F0F2F5] dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-xs font-medium focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#65676B] dark:text-gray-400 font-bold mb-1 flex items-center justify-between">
                  <span>{t.convocatoria.uploadBanner} (URL)</span>
                </label>
                <input
                  type="url"
                  value={teamForm.bannerUrl}
                  onChange={(e) => setTeamForm({ ...teamForm, bannerUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F0F2F5] dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-xs font-medium focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#CED0D4] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditTeamModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-300 text-xs font-bold border border-[#CED0D4] dark:border-white/10 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Generated Convocatoria Graphic Action Center */}
      {generatedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#18191A] text-white rounded-3xl border border-emerald-500/40 shadow-2xl overflow-hidden p-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Check className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-black text-white">
                    ¡Gráfica de Convocatoria Generada!
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Formato HD 1080 × 1350 px (Instagram / WhatsApp)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGeneratedResult(null)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Generated Thumbnail */}
            <div className="relative max-h-72 rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
              <img
                src={generatedResult.blobUrl || generatedResult.dataUrl}
                alt="Convocatoria Generada"
                className="max-h-72 w-auto object-contain"
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  const fileName = `Convocatoria_${team.shortName}_vs_${currentMatch?.rival || 'Partido'}.png`;
                  triggerBrowserFileDownload(generatedResult.blob, generatedResult.blobUrl || generatedResult.dataUrl, fileName);
                }}
                className="py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer text-center"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(generatedResult.blobUrl, '_blank')}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Abrir Pestaña</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (generatedResult.blob) {
                    const ok = await copyImageToClipboard(generatedResult.blob);
                    if (ok) {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 3000);
                    }
                  }
                }}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copied ? '¡Copiada!' : 'Copiar'}</span>
              </button>
            </div>

            <p className="text-[10px] text-gray-400 leading-tight text-center">
              💡 Si la descarga automática no inició, pulsa <strong>"Abrir Pestaña"</strong> para verla en pantalla completa y guardar la imagen en tu dispositivo.
            </p>
          </div>
        </div>
      )}
      {/* CAMERA MODAL FOR CONVOCATORIA QUICK ADD */}
      <CameraCaptureModal
        isOpen={showPlayerCameraModal}
        onClose={() => setShowPlayerCameraModal(false)}
        onCapture={(dataUrl) => {
          setNewPlayer((prev) => ({ ...prev, avatarUrl: dataUrl }));
        }}
        title="Tomar Foto del Jugador"
        subtitle="Centra el rostro del jugador dentro del círculo"
        playerName={newPlayer.name}
        dorsal={newPlayer.number}
      />
    </div>
  );
};
