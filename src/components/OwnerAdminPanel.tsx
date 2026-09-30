import React, { useState, useRef } from 'react';
import {
  Crown,
  User,
  Settings,
  Bell,
  Download,
  Plus,
  Trash2,
  Check,
  Calendar,
  AlertCircle,
  Users,
  Share2,
  Copy,
  ExternalLink,
  MessageCircle,
  Search,
  Shield,
  Phone,
  Hash,
  Pencil,
  X,
  Camera,
  Upload,
  Sparkles,
  Trophy,
  Image as ImageIcon,
} from 'lucide-react';
import {
  TeamInfo,
  AppUser,
  Player,
  Match,
  StandingsRow,
  Language,
  UserRole,
  PlayerPosition,
  DEFAULT_FACEBOOK_AVATAR,
  ALL_POSITIONS,
  getPositionBadgeClass,
} from '../types';
import { getT } from '../utils/translations';
import { CameraCaptureModal } from './CameraCaptureModal';
import { TableAiScannerModal } from './TableAiScannerModal';

interface OwnerAdminPanelProps {
  team: TeamInfo;
  setTeam: React.Dispatch<React.SetStateAction<TeamInfo>>;
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  matches: Match[];
  standings?: StandingsRow[];
  setStandings?: React.Dispatch<React.SetStateAction<StandingsRow[]>>;
  currentUser: AppUser;
  setCurrentUser?: (user: AppUser) => void;
  language: Language;
}

export const OwnerAdminPanel: React.FC<OwnerAdminPanelProps> = ({
  team,
  setTeam,
  users,
  setUsers,
  players,
  setPlayers,
  matches,
  standings,
  setStandings,
  currentUser,
  setCurrentUser,
  language,
}) => {
  const t = getT(language);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);
  const [isAiTableModalOpen, setIsAiTableModalOpen] = useState(false);

  // Team identity form
  const [teamForm, setTeamForm] = useState({
    name: team.name,
    shortName: team.shortName,
    leagueName: team.leagueName,
    stadium: team.stadium,
    logoUrl: team.logoUrl,
    bannerUrl: team.bannerUrl,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLogoUrlInput, setShowLogoUrlInput] = useState(false);
  const [showBannerUrlInput, setShowBannerUrlInput] = useState(false);

  // Admin Profile Form state
  const [adminProfileForm, setAdminProfileForm] = useState({
    name: currentUser.name || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    adminTitle: currentUser.adminTitle || 'Director Técnico & Dueño',
    bio: currentUser.bio || '',
    avatarUrl: currentUser.avatarUrl || DEFAULT_FACEBOOK_AVATAR,
  });
  const [adminProfileSuccess, setAdminProfileSuccess] = useState<string | null>(null);

  // File Upload Refs
  const teamLogoFileInputRef = useRef<HTMLInputElement>(null);
  const teamBannerFileInputRef = useRef<HTMLInputElement>(null);
  const adminAvatarFileInputRef = useRef<HTMLInputElement>(null);

  // New Player Form state
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNickname, setNewPlayerNickname] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState<string>('');
  const [newPlayerPosition, setNewPlayerPosition] = useState<PlayerPosition>('MED');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');
  const [newPlayerPhoto, setNewPlayerPhoto] = useState('');
  const [playerFormError, setPlayerFormError] = useState<string | null>(null);
  const [playerFormSuccess, setPlayerFormSuccess] = useState<string | null>(null);

  // Player search and deletion modal
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

  // Edit Player Modal state
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    nickname: string;
    number: string;
    position: PlayerPosition;
    phone: string;
    avatarUrl: string;
  }>({
    name: '',
    nickname: '',
    number: '',
    position: 'MED',
    phone: '',
    avatarUrl: '',
  });
  // Camera Modal State & File Upload Refs
  const [cameraModalTarget, setCameraModalTarget] = useState<'new' | 'edit' | 'admin' | null>(null);
  const newPlayerFileInputRef = useRef<HTMLInputElement>(null);
  const editPlayerFileInputRef = useRef<HTMLInputElement>(null);

  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit') => {
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
        if (target === 'new') {
          setNewPlayerPhoto(squareData);
        } else {
          setEditForm((prev) => ({ ...prev, avatarUrl: squareData }));
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Team Logo file upload from device
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 450;
        canvas.height = 450;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const side = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
        const sx = ((img.naturalWidth || img.width) - side) / 2;
        const sy = ((img.naturalHeight || img.height) - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, 450, 450);
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        setTeamForm((prev) => ({ ...prev, logoUrl: dataUrl }));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Team Banner file upload from device
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 450;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 1200, 450);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setTeamForm((prev) => ({ ...prev, bannerUrl: dataUrl }));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Admin Avatar file upload from device
  const handleAdminAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const side = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
        const sx = ((img.naturalWidth || img.width) - side) / 2;
        const sy = ((img.naturalHeight || img.height) - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setAdminProfileForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Save Admin Profile
  const handleSaveAdminProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = adminProfileForm.name.trim() || currentUser.name;
    const updatedUser: AppUser = {
      ...currentUser,
      name: cleanName,
      email: adminProfileForm.email.trim() || currentUser.email,
      phone: adminProfileForm.phone.trim() || undefined,
      adminTitle: adminProfileForm.adminTitle.trim() || undefined,
      bio: adminProfileForm.bio.trim() || undefined,
      avatarUrl: adminProfileForm.avatarUrl || currentUser.avatarUrl,
    };

    if (setCurrentUser) {
      setCurrentUser(updatedUser);
    }
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    setAdminProfileSuccess('¡Perfil de administrador actualizado correctamente!');
    setTimeout(() => setAdminProfileSuccess(null), 4000);
  };

  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Invite link state
  const [copiedInvite, setCopiedInvite] = useState(false);

  const inviteUrl = `${window.location.origin}${window.location.pathname}?joinTeam=${encodeURIComponent(
    team.id || 'team-1'
  )}&teamName=${encodeURIComponent(team.name)}&teamLogo=${encodeURIComponent(team.logoUrl || '')}`;

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 3000);
    });
  };

  const handleShareWhatsApp = () => {
    const text = `⚽ ¡Hola! Te invito a unirte a nuestro equipo *${team.name}* en TeamGol. Regístrate en este enlace para formar parte de la plantilla oficial y ver convocatorias, alineaciones tácticas y partidos:\n\n${inviteUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleUpdateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    setTeam((prev) => ({
      ...prev,
      ...teamForm,
    }));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  // Add new player to the team
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    setPlayerFormError(null);

    const cleanName = newPlayerName.trim();
    if (!cleanName) {
      setPlayerFormError('El nombre del jugador es obligatorio.');
      return;
    }

    const dorsal = parseInt(newPlayerNumber.trim(), 10);
    if (!newPlayerNumber.trim() || isNaN(dorsal) || dorsal < 1 || dorsal > 99) {
      setPlayerFormError('Por favor ingresa un dorsal válido entre 1 y 99.');
      return;
    }

    // Check if dorsal is already in use
    const dorsalTaken = players.some((p) => p.number === dorsal);
    if (dorsalTaken) {
      setPlayerFormError(`El dorsal #${dorsal} ya está asignado a otro jugador.`);
      return;
    }

    const defaultAvatar =
      newPlayerPhoto.trim() || DEFAULT_FACEBOOK_AVATAR;

    const newId = `p_${Date.now()}`;
    const newPlayer: Player = {
      id: newId,
      name: cleanName,
      nickname: newPlayerNickname.trim() || undefined,
      number: dorsal,
      position: newPlayerPosition,
      avatarUrl: defaultAvatar,
      goals: 0,
      assists: 0,
      matches: 0,
      yellowCards: 0,
      redCards: 0,
      phone: newPlayerPhone.trim() || undefined,
      isCalledUp: true,
      isStarter: false,
      mvpHistory: [],
    };

    if (typeof setPlayers === 'function') {
      setPlayers((prev) => [...prev, newPlayer]);
    }

    // Also create corresponding user account for the player
    const newUser: AppUser = {
      id: `u_${newId}`,
      name: `${cleanName} (Jugador)`,
      email: `${cleanName.toLowerCase().replace(/\s+/g, '.')}@teamgol.com`,
      role: 'player',
      avatarUrl: defaultAvatar,
      playerId: newId,
      provider: 'email',
    };
    if (typeof setUsers === 'function') {
      setUsers((prev) => [...prev, newUser]);
    }

    setPlayerFormSuccess(`¡Jugador ${cleanName} (#${dorsal}) agregado a la plantilla!`);
    setTimeout(() => setPlayerFormSuccess(null), 4000);

    // Reset inputs cleanly
    setNewPlayerName('');
    setNewPlayerNickname('');
    setNewPlayerNumber('');
    setNewPlayerPhone('');
    setNewPlayerPhoto('');
  };

  // Open player edit modal
  const handleOpenEditPlayer = (player: Player) => {
    setPlayerToEdit(player);
    setEditForm({
      name: player.name,
      nickname: player.nickname || '',
      number: player.number.toString(),
      position: player.position,
      phone: player.phone || '',
      avatarUrl: player.avatarUrl || DEFAULT_FACEBOOK_AVATAR,
    });
    setEditFormError(null);
  };

  // Save edited player details
  const handleSaveEditPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerToEdit) return;

    const cleanName = editForm.name.trim();
    if (!cleanName) {
      setEditFormError('El nombre del jugador es obligatorio.');
      return;
    }

    const dorsal = parseInt(editForm.number.trim(), 10);
    if (!editForm.number.trim() || isNaN(dorsal) || dorsal < 1 || dorsal > 99) {
      setEditFormError('Por favor ingresa un dorsal válido entre 1 y 99.');
      return;
    }

    // Check if dorsal is already in use by another player
    const dorsalTaken = players.some((p) => p.id !== playerToEdit.id && p.number === dorsal);
    if (dorsalTaken) {
      setEditFormError(`El dorsal #${dorsal} ya está asignado a otro jugador.`);
      return;
    }

    const finalAvatar = editForm.avatarUrl.trim() || DEFAULT_FACEBOOK_AVATAR;

    // Update in players list
    if (typeof setPlayers === 'function') {
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === playerToEdit.id
            ? {
                ...p,
                name: cleanName,
                nickname: editForm.nickname.trim() || undefined,
                number: dorsal,
                position: editForm.position,
                phone: editForm.phone.trim() || undefined,
                avatarUrl: finalAvatar,
              }
            : p
        )
      );
    }

    // Update linked user account if exists
    if (typeof setUsers === 'function') {
      setUsers((prev) =>
        prev.map((u) =>
          u.playerId === playerToEdit.id
            ? {
                ...u,
                name: `${cleanName} (Jugador)`,
                avatarUrl: finalAvatar,
              }
            : u
        )
      );
    }

    setPlayerFormSuccess(`¡Jugador ${cleanName} (#${dorsal}) actualizado exitosamente!`);
    setTimeout(() => setPlayerFormSuccess(null), 4000);
    setPlayerToEdit(null);
  };

  // Confirm delete player
  const handleConfirmDeletePlayer = () => {
    if (!playerToDelete) return;
    const deletedName = playerToDelete.name;
    const deletedId = playerToDelete.id;

    // Remove from players list
    if (typeof setPlayers === 'function') {
      setPlayers((prev) => prev.filter((p) => p.id !== deletedId));
    }

    // Remove linked user account if exists (do not delete if user is owner)
    if (typeof setUsers === 'function') {
      setUsers((prev) => prev.filter((u) => u.playerId !== deletedId || u.role === 'owner'));
    }

    setNotificationStatus(`Jugador ${deletedName} ha sido eliminado de la plantilla.`);
    setTimeout(() => setNotificationStatus(null), 4000);
    setPlayerToDelete(null);
  };

  const handleSendPushReminder = (match: Match) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`⚽ ¡Recordatorio de Partido! ${team.shortName} vs ${match.rival}`, {
          body: `Fecha: ${match.date} a las ${match.time} hrs en ${match.stadium}. ¡Puntualidad obligatoria!`,
          icon: team.logoUrl,
        });
        setNotificationStatus(`Notificación push enviada a la plantilla para el juego vs ${match.rival}`);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(`⚽ ¡Recordatorio de Partido! ${team.shortName} vs ${match.rival}`, {
              body: `Fecha: ${match.date} a las ${match.time} hrs. ¡Nos vemos en la cancha!`,
              icon: team.logoUrl,
            });
            setNotificationStatus(`Notificación push enviada exitosamente.`);
          } else {
            setNotificationStatus(`Recordatorio enviado a los celulares del equipo para el juego vs ${match.rival}`);
          }
        });
      } else {
        setNotificationStatus(`Notificación push enviada: ¡Juego vs ${match.rival} programado para ${match.date}!`);
      }
    } else {
      setNotificationStatus(`Notificación push activa para el juego vs ${match.rival}`);
    }

    setTimeout(() => setNotificationStatus(null), 5000);
  };

  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      team,
      players,
      matches,
      users,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TeamGol_${team.shortName}_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered players list for management
  const filteredPlayers = players.filter((p) => {
    const query = playerSearchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      (p.nickname && p.nickname.toLowerCase().includes(query)) ||
      p.number.toString().includes(query) ||
      p.position.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#CED0D4] shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#050505] tracking-tight flex items-center gap-2">
            <Crown className="w-6 h-6 text-[#1877F2]" />
            Panel de Configuración del Club (Perfil de Dueño)
          </h2>
          <p className="text-xs sm:text-sm text-[#65676B] mt-0.5 font-medium">
            Gestión de identidad, altas y bajas de jugadores, enlace de invitación y roles
          </p>
        </div>

        <button
          onClick={handleExportBackup}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#050505] border border-[#CED0D4] text-xs font-bold transition-all self-start sm:self-auto cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4 text-[#1877F2]" />
          Descargar Respaldo Total (JSON)
        </button>
      </div>

      {/* Push Notification Alert Toast */}
      {notificationStatus && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
          <Bell className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificationStatus}</span>
        </div>
      )}

      {/* SECTION 1: TEAM INVITATION LINK FOR NEW PLAYERS */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#CED0D4] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#CED0D4]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#E7F3FF] text-[#1877F2]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#050505]">
                Enlace de Invitación al Equipo
              </h3>
              <p className="text-xs text-[#65676B]">
                Envía este enlace a nuevos jugadores para que se unan a <span className="font-bold text-[#1877F2]">{team.name}</span> y tengan acceso a todo el contenido del club
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyInviteLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {copiedInvite ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedInvite ? '¡Copiado!' : 'Copiar Enlace'}</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="font-mono text-xs text-[#050505] truncate font-medium">
            {inviteUrl}
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0 self-start sm:self-auto">
            Activo y Listo para Compartir
          </span>
        </div>

        <p className="text-[11px] text-[#65676B] leading-relaxed">
          💡 <span className="font-bold">¿Cómo funciona?</span> Cuando un jugador nuevo ingrese a través de este enlace, la app detectará la invitación de <span className="font-bold">{team.name}</span> y le permitirá registrar su perfil o iniciar sesión, integrándose inmediatamente a la plantilla con acceso completo a convocatorias, alineaciones tácticas y calendario.
        </p>
      </div>

      {/* SECTION 2: SQUAD MANAGEMENT (ADD AND DELETE PLAYERS) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#CED0D4] shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#CED0D4]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#050505]">
                Gestión de Plantilla: Agregar y Eliminar Jugadores
              </h3>
              <p className="text-xs text-[#65676B]">
                Administra los integrantes oficiales de tu equipo ({players.length} futbolistas registrados)
              </p>
            </div>
          </div>
        </div>

        {/* Feedback alerts for squad actions */}
        {playerFormSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{playerFormSuccess}</span>
          </div>
        )}

        {playerFormError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{playerFormError}</span>
          </div>
        )}

        {/* FORM: Add new player */}
        <div className="p-4 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#050505] flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-[#1877F2]" />
            Inscribir Nuevo Jugador al Equipo
          </h4>

          <form onSubmit={handleAddPlayer} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-[#65676B] mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Rodrigo Morales"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#CED0D4] rounded-xl text-xs font-medium text-[#050505] focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#65676B] mb-1">
                  Apodo (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. Rodri"
                  value={newPlayerNickname}
                  onChange={(e) => setNewPlayerNickname(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#CED0D4] rounded-xl text-xs font-medium text-[#050505] focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#65676B] mb-1">
                  Dorsal (#) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Ej. 6"
                  required
                  value={newPlayerNumber}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    if (val === '' || (/^\d+$/.test(val) && parseInt(val, 10) <= 99)) {
                      setNewPlayerNumber(val);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#CED0D4] rounded-xl text-xs font-bold text-[#050505] font-mono focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-[#65676B] mb-1">
                  Posición *
                </label>
                <select
                  value={newPlayerPosition}
                  onChange={(e) => setNewPlayerPosition(e.target.value as PlayerPosition)}
                  className="w-full px-3 py-2 bg-white border border-[#CED0D4] rounded-xl text-xs font-bold text-[#050505] focus:outline-none focus:border-[#1877F2] cursor-pointer"
                >
                  <optgroup label="🧤 Portería">
                    {ALL_POSITIONS.filter((p) => p.category === 'POR').map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🛡️ Defensas (Centrales, Laterales, Carrileros)">
                    {ALL_POSITIONS.filter((p) => p.category === 'DEF').map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="⚡ Mediocampistas (MCD, MC, MCO, MI, MD)">
                    {ALL_POSITIONS.filter((p) => p.category === 'MED').map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="⚽ Delanteros (Extremos, Centro, Segundos)">
                    {ALL_POSITIONS.filter((p) => p.category === 'DEL').map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-[#65676B] mb-1">
                  Teléfono (WhatsApp)
                </label>
                <input
                  type="tel"
                  placeholder="55-1234-5678"
                  value={newPlayerPhone}
                  onChange={(e) => setNewPlayerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#CED0D4] rounded-xl text-xs font-medium text-[#050505] focus:outline-none focus:border-[#1877F2]"
                />
              </div>
            </div>

            {/* Avatar section with real-time visual preview & Camera Capture */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-[#F8FAFC] border border-[#CED0D4] rounded-2xl shadow-xs">
              <div className="relative shrink-0 mx-auto md:mx-0">
                <img
                  src={newPlayerPhoto.trim() || DEFAULT_FACEBOOK_AVATAR}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_FACEBOOK_AVATAR;
                  }}
                  className="w-16 h-16 rounded-full object-cover ring-3 ring-[#1877F2]/30 shadow-md bg-[#E4E6EB]"
                />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#050505] text-white text-xs font-mono font-bold flex items-center justify-center border-2 border-white shadow-xs">
                  {newPlayerNumber || '?'}
                </span>
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="block text-xs font-black text-[#050505]">
                    Foto de Perfil del Futbolista
                  </label>
                  {newPlayerPhoto && (
                    <button
                      type="button"
                      onClick={() => setNewPlayerPhoto('')}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Quitar foto (Usar silueta de Facebook)
                    </button>
                  )}
                </div>

                {/* Camera & Upload Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCameraModalTarget('new')}
                    className="px-3.5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Tomar Foto con Cámara</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => newPlayerFileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-[#050505] text-xs font-bold border border-[#CED0D4] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-[#1877F2]" />
                    <span>Subir desde Galería</span>
                  </button>

                  <input
                    ref={newPlayerFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleDeviceFileUpload(e, 'new')}
                    className="hidden"
                  />
                </div>

                <div className="pt-1">
                  <input
                    type="url"
                    placeholder="O pega una URL de foto..."
                    value={newPlayerPhoto}
                    onChange={(e) => setNewPlayerPhoto(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#CED0D4] rounded-lg text-xs font-medium text-[#050505] focus:outline-none focus:border-[#1877F2]"
                  />
                  <p className="text-[10.5px] mt-1 text-[#65676B] font-medium">
                    {newPlayerPhoto.trim()
                      ? '✓ Foto asignada. Se guardará automáticamente en el perfil del jugador y en las actas de partido.'
                      : 'ℹ️ Puedes tomar la foto ahora con tu cámara o se asignará la silueta oficial de Facebook.'}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap self-stretch md:self-center"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Agregar a la Plantilla</span>
              </button>
            </div>
          </form>
        </div>

        {/* Current Players List with Search and Delete */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#050505]">
                Futbolistas en el plantel actual ({filteredPlayers.length}):
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#65676B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={playerSearchQuery}
                onChange={(e) => setPlayerSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, dorsal o posición..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-xs font-medium text-[#050505] focus:outline-none focus:border-[#1877F2]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredPlayers.map((player) => {
              const posBadge = getPositionBadgeClass(player.position);

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB]/70 border border-[#CED0D4] transition-all gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <img
                        src={player.avatarUrl || DEFAULT_FACEBOOK_AVATAR}
                        alt={player.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_FACEBOOK_AVATAR;
                        }}
                        className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-[#CED0D4] bg-[#E4E6EB]"
                      />
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#050505] text-white text-[10px] font-mono font-bold flex items-center justify-center border border-white">
                        {player.number}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-[#050505] truncate">
                          {player.name}
                        </span>
                        {player.nickname && (
                          <span className="text-[10px] text-[#65676B] font-medium">
                            "{player.nickname}"
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${posBadge}`}
                        >
                          {player.position}
                        </span>
                        <span className="text-[10px] text-[#65676B]">
                          {player.matches} PJ • {player.goals} Goles • {player.assists} Asist
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons: Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      id={`btn-edit-player-${player.id}`}
                      onClick={() => handleOpenEditPlayer(player)}
                      className="p-2 rounded-xl text-[#65676B] hover:text-[#1877F2] hover:bg-[#E7F3FF] transition-colors cursor-pointer"
                      title={`Editar datos de ${player.name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      id={`btn-delete-player-${player.id}`}
                      onClick={() => setPlayerToDelete(player)}
                      className="p-2 rounded-xl text-[#65676B] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title={`Eliminar a ${player.name} del equipo`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredPlayers.length === 0 && (
              <div className="col-span-2 text-center py-6 text-xs text-[#65676B]">
                No se encontraron jugadores que coincidan con la búsqueda.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: MI PERFIL DE ADMINISTRADOR (DIRECTOR TÉCNICO & DUEÑO) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#CED0D4] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#CED0D4]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#050505]">
                Mi Perfil de Administrador (Director Técnico & Dueño)
              </h3>
              <p className="text-xs text-[#65676B]">
                Edita tus datos personales, foto de perfil, cargo oficial y contacto visible para el equipo
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full self-start sm:self-auto flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            Propietario Principal
          </span>
        </div>

        {/* Feedback alert */}
        {adminProfileSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{adminProfileSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSaveAdminProfile} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-xl bg-[#F0F2F5] border border-[#CED0D4]">
            {/* Avatar preview */}
            <div className="relative shrink-0 mx-auto sm:mx-0">
              <img
                src={adminProfileForm.avatarUrl || DEFAULT_FACEBOOK_AVATAR}
                alt={adminProfileForm.name}
                className="w-20 h-20 rounded-full object-cover border-3 border-amber-400 shadow-md bg-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_FACEBOOK_AVATAR;
                }}
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow-xs">
                <Crown className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Photo upload options */}
            <div className="space-y-2 flex-1 text-center sm:text-left">
              <input
                type="file"
                ref={adminAvatarFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAdminAvatarUpload}
              />
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => adminAvatarFileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir foto desde dispositivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCameraModalTarget('admin')}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-[#050505] border border-[#CED0D4] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#1877F2]" />
                  <span>Tomar con cámara</span>
                </button>
              </div>
              <p className="text-[11px] text-[#65676B]">
                Sube tu foto de perfil desde el carrete o galería de tu celular o PC.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
                Nombre de Administrador / DT *
              </label>
              <input
                type="text"
                required
                value={adminProfileForm.name}
                onChange={(e) => setAdminProfileForm({ ...adminProfileForm, name: e.target.value })}
                placeholder="Ej. Benjamín López"
                className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-[#050505] text-xs font-bold focus:outline-none focus:border-[#1877F2]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
                Cargo / Título Oficial
              </label>
              <input
                type="text"
                value={adminProfileForm.adminTitle}
                onChange={(e) => setAdminProfileForm({ ...adminProfileForm, adminTitle: e.target.value })}
                placeholder="Ej. Director Técnico & Dueño"
                className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-[#050505] text-xs font-bold focus:outline-none focus:border-[#1877F2]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={adminProfileForm.email}
                onChange={(e) => setAdminProfileForm({ ...adminProfileForm, email: e.target.value })}
                placeholder="dt@equipo.com"
                className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-[#050505] text-xs font-medium focus:outline-none focus:border-[#1877F2]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
                Teléfono / WhatsApp de Contacto
              </label>
              <input
                type="tel"
                value={adminProfileForm.phone}
                onChange={(e) => setAdminProfileForm({ ...adminProfileForm, phone: e.target.value })}
                placeholder="+52 55 1234 5678"
                className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-[#050505] text-xs font-medium focus:outline-none focus:border-[#1877F2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
              Filosofía Táctica / Nota del Míster
            </label>
            <textarea
              rows={2}
              value={adminProfileForm.bio}
              onChange={(e) => setAdminProfileForm({ ...adminProfileForm, bio: e.target.value })}
              placeholder="Ej. Esquema táctico dinámico, presión en bloque medio y transiciones rápidas."
              className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-[#050505] text-xs font-medium focus:outline-none focus:border-[#1877F2] resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar Perfil de Administrador</span>
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Team Settings */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#CED0D4] shadow-xs space-y-4">
            <h3 className="text-base font-black text-[#050505] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#1877F2]" />
              Identidad Oficial del Club
            </h3>

            <form onSubmit={handleUpdateTeam} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
                    Nombre del Club
                  </label>
                  <input
                    type="text"
                    required
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-[#050505] text-xs font-medium focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
                    Siglas
                  </label>
                  <input
                    type="text"
                    required
                    value={teamForm.shortName}
                    onChange={(e) => setTeamForm({ ...teamForm, shortName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-[#050505] text-xs font-medium focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
                    Liga / Torneo
                  </label>
                  <input
                    type="text"
                    required
                    value={teamForm.leagueName}
                    onChange={(e) => setTeamForm({ ...teamForm, leagueName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-[#050505] text-xs font-medium focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
                    Cancha / Estadio
                  </label>
                  <input
                    type="text"
                    required
                    value={teamForm.stadium}
                    onChange={(e) => setTeamForm({ ...teamForm, stadium: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-[#050505] text-xs font-medium focus:outline-none focus:border-[#1877F2]"
                  />
                </div>
              </div>

              {/* Escudo / Logo con opción de subir imagen */}
              <div className="p-3.5 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] space-y-3">
                <label className="block text-[11px] font-bold uppercase text-[#050505]">
                  Escudo Oficial del Equipo (Logo)
                </label>

                <div className="flex items-center gap-3.5">
                  <div className="relative shrink-0">
                    <img
                      src={teamForm.logoUrl || '/fc_bayern_logo.png'}
                      alt={teamForm.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#1877F2] bg-white shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/fc_bayern_logo.png';
                      }}
                    />
                    <span className="absolute -bottom-1 -right-1 bg-[#1877F2] text-white p-1 rounded-full shadow-xs">
                      <Shield className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Hidden File Input for Logo */}
                    <input
                      type="file"
                      ref={teamLogoFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => teamLogoFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Cargar imagen desde dispositivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTeamForm((prev) => ({ ...prev, logoUrl: '/fc_bayern_logo.png' }))}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Usar escudo oficial FC Bayern München"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Usar FC Bayern München</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowLogoUrlInput(!showLogoUrlInput)}
                      className="text-[11px] text-[#1877F2] hover:underline cursor-pointer block pt-0.5"
                    >
                      {showLogoUrlInput ? 'Ocultar campo de enlace URL' : 'O ingresar enlace URL web'}
                    </button>
                  </div>
                </div>

                {showLogoUrlInput && (
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/logo.png"
                    value={teamForm.logoUrl}
                    onChange={(e) => setTeamForm({ ...teamForm, logoUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#CED0D4] rounded-xl text-[#050505] text-xs font-medium focus:outline-none focus:border-[#1877F2]"
                  />
                )}
              </div>

              {/* Portada / Banner con opción de subir imagen */}
              <div className="p-3.5 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] space-y-3">
                <label className="block text-[11px] font-bold uppercase text-[#050505]">
                  Foto de Portada del Club (Banner)
                </label>

                {teamForm.bannerUrl && (
                  <div className="w-full h-24 rounded-xl overflow-hidden border border-[#CED0D4] shadow-xs relative">
                    <img
                      src={teamForm.bannerUrl}
                      alt="Banner del equipo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Hidden File Input for Banner */}
                <input
                  type="file"
                  ref={teamBannerFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerUpload}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => teamBannerFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-[#050505] border border-[#CED0D4] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#1877F2]" />
                    <span>Cargar portada desde dispositivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBannerUrlInput(!showBannerUrlInput)}
                    className="text-[11px] text-[#1877F2] hover:underline cursor-pointer"
                  >
                    {showBannerUrlInput ? 'Ocultar enlace URL' : 'O ingresar enlace URL'}
                  </button>
                </div>

                {showBannerUrlInput && (
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/portada.jpg"
                    value={teamForm.bannerUrl}
                    onChange={(e) => setTeamForm({ ...teamForm, bannerUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#CED0D4] rounded-xl text-[#050505] text-xs font-medium focus:outline-none focus:border-[#1877F2]"
                  />
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {saveSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                  {saveSuccess ? '¡Guardado!' : 'Guardar Identidad del Club'}
                </button>
              </div>
            </form>
          </div>

          {/* AI League Standings Scanner Card */}
          {setStandings && (
            <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 text-white p-5 rounded-2xl shadow-md border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white/10 text-amber-300">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                      <span>Tabla de la Liga con IA</span>
                      <span className="text-[10px] font-bold bg-amber-400 text-black px-2 py-0.5 rounded-full">
                        Gemini Vision
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-200">
                      Sube fotos o capturas de la tabla del torneo para actualizar puntos y estadísticas automáticamente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-3 border border-white/10 text-xs flex items-center justify-between">
                <div>
                  <span className="text-gray-300 text-[11px] block">Torneo Actual:</span>
                  <span className="font-bold text-white">{team.leagueName}</span>
                </div>
                {standings && standings.length > 0 && (
                  <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-1 rounded-lg">
                    {standings.length} equipos registrados
                  </span>
                )}
              </div>

              <button
                type="button"
                id="btn-admin-scan-table-ai"
                onClick={() => setIsAiTableModalOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-black" />
                <span>Escanear Foto de Tabla con IA</span>
              </button>

              {/* Standings Table Preview in Admin Panel */}
              {standings && standings.length > 0 && (
                <div className="bg-black/40 rounded-xl border border-white/10 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-gray-300 font-bold uppercase tracking-wider pb-1 border-b border-white/10">
                    <span>Equipos en la Tabla ({standings.length})</span>
                    <span>PJ / PTS</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-white/5 space-y-1 pr-1">
                    {standings.map((st) => (
                      <div
                        key={st.id}
                        className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-xs ${
                          st.isOurTeam
                            ? 'bg-[#1877F2]/25 text-white font-bold border border-[#1877F2]/40'
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] w-4 text-center font-bold text-gray-400">
                            #{st.rank}
                          </span>
                          {st.logo && (st.logo.startsWith('http') || st.logo.startsWith('/') || st.logo.startsWith('data:')) ? (
                            <img
                              src={st.logo}
                              alt={st.name}
                              className="w-5 h-5 rounded-full object-cover shrink-0 bg-white"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/fc_bayern_logo.png';
                              }}
                            />
                          ) : (
                            <span className="text-sm">{st.logo || '🛡️'}</span>
                          )}
                          <span className="truncate font-medium">{st.name}</span>
                          {st.isOurTeam && (
                            <span className="text-[9px] bg-[#1877F2] text-white px-1.5 py-0.5 rounded font-black shrink-0">
                              TU CLUB
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 font-mono shrink-0">
                          <span className="text-[10px] text-gray-400">{st.pj} PJ</span>
                          <span className="font-black text-amber-400">{st.pts} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Push Notifications Reminders trigger for upcoming matches */}
          <div className="bg-white p-5 rounded-2xl border border-[#CED0D4] shadow-xs space-y-3">
            <h3 className="text-base font-black text-[#050505] flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              Notificaciones Push para Partidos
            </h3>
            <p className="text-xs text-[#65676B] font-medium">
              Envía recordatorio instantáneo a los dispositivos de los jugadores convocados
            </p>

            <div className="space-y-2 pt-1">
              {matches
                .filter((m) => m.status !== 'finished')
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#F0F2F5] border border-[#CED0D4]/60 text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#050505] block">
                        vs {m.rival}
                      </span>
                      <span className="text-[10px] text-[#65676B]">
                        {m.date} a las {m.time} hrs • {m.stadium}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSendPushReminder(m)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                    >
                      <Bell className="w-3 h-3" />
                      Enviar Push
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right: User Accounts & Roles (Dueño vs Jugador) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#CED0D4] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#050505] flex items-center gap-2">
                  <Crown className="w-4 h-4 text-[#1877F2]" />
                  Usuarios y Roles del Club ({users.length})
                </h3>
                <p className="text-xs text-[#65676B] font-medium">
                  Asigna permisos de Dueño de Equipo o Jugador
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F0F2F5] border border-[#CED0D4]/60 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-[#CED0D4]"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[#050505] block truncate">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-[#65676B] truncate block">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  {/* Role Selector (Owner vs Player only) */}
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-[#CED0D4] text-xs font-bold text-[#050505] focus:outline-none focus:border-[#1877F2] shadow-xs cursor-pointer"
                  >
                    <option value="owner">Dueño de Equipo</option>
                    <option value="player">Jugador</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Confirmation to delete player */}
      {playerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#CED0D4] w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-[#050505]">
                ¿Eliminar a este jugador?
              </h4>
              <p className="text-xs text-[#65676B] leading-relaxed">
                Estás a punto de eliminar a <span className="font-bold text-[#050505]">{playerToDelete.name}</span> (Dorsal #{playerToDelete.number}) de la plantilla oficial. Se retirará de futuras convocatorias y alineaciones.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#CED0D4]">
              <button
                type="button"
                id="btn-cancel-delete-player"
                onClick={() => setPlayerToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#65676B] hover:bg-[#F0F2F5] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-player"
                onClick={handleConfirmDeletePlayer}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                Eliminar Jugador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit player details */}
      {playerToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#CED0D4] w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#CED0D4]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#E7F3FF] text-[#1877F2] flex items-center justify-center">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#050505]">
                    Editar Jugador
                  </h4>
                  <p className="text-[11px] text-[#65676B]">
                    Modifica los datos del jugador y su dorsal en el plantel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlayerToEdit(null)}
                className="p-2 rounded-xl text-[#65676B] hover:bg-[#F0F2F5] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditPlayer} className="space-y-4">
              {/* Avatar Preview & Camera/Upload Options */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-[#CED0D4] shadow-xs">
                <div className="relative shrink-0 mx-auto sm:mx-0">
                  <img
                    src={editForm.avatarUrl.trim() || DEFAULT_FACEBOOK_AVATAR}
                    alt={editForm.name || 'Preview'}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_FACEBOOK_AVATAR;
                    }}
                    className="w-16 h-16 rounded-full object-cover ring-3 ring-[#1877F2]/30 shadow-md bg-[#E4E6EB]"
                  />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#050505] text-white text-xs font-mono font-bold flex items-center justify-center border-2 border-white shadow-xs">
                    {editForm.number || '?'}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-2 w-full">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-xs font-black text-[#050505] block truncate">
                      {editForm.name || 'Nombre del futbolista'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          avatarUrl: DEFAULT_FACEBOOK_AVATAR,
                        }))
                      }
                      className="text-[11px] font-bold text-[#1877F2] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Usar silueta de Facebook</span>
                    </button>
                  </div>

                  {/* Camera & Upload Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setCameraModalTarget('edit')}
                      className="px-3 py-1.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Tomar Foto con Cámara</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => editPlayerFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-[#050505] text-xs font-bold border border-[#CED0D4] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4 text-[#1877F2]" />
                      <span>Subir desde Galería</span>
                    </button>

                    <input
                      ref={editPlayerFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleDeviceFileUpload(e, 'edit')}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#65676B] mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-xs font-medium text-[#050505] focus:outline-none focus:border-[#1877F2] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#65676B] mb-1">
                    Apodo (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. El Tanque"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-xs font-medium text-[#050505] focus:outline-none focus:border-[#1877F2] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#65676B] mb-1">
                    Dorsal (#) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Ej. 6"
                    required
                    value={editForm.number}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      if (val === '' || (/^\d+$/.test(val) && parseInt(val, 10) <= 99)) {
                        setEditForm({ ...editForm, number: val });
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-xs font-bold text-[#050505] font-mono focus:outline-none focus:border-[#1877F2] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#65676B] mb-1">
                    Posición en Cancha *
                  </label>
                  <select
                    value={editForm.position}
                    onChange={(e) =>
                      setEditForm({ ...editForm, position: e.target.value as PlayerPosition })
                    }
                    className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-xs font-bold text-[#050505] focus:outline-none focus:border-[#1877F2] focus:bg-white cursor-pointer"
                  >
                    <optgroup label="🧤 Portería">
                      {ALL_POSITIONS.filter((p) => p.category === 'POR').map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🛡️ Defensas (Centrales, Laterales, Carrileros)">
                      {ALL_POSITIONS.filter((p) => p.category === 'DEF').map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="⚡ Mediocampistas (MCD, MC, MCO, MI, MD)">
                      {ALL_POSITIONS.filter((p) => p.category === 'MED').map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="⚽ Delanteros (Extremos, Centro, Segundos)">
                      {ALL_POSITIONS.filter((p) => p.category === 'DEL').map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#65676B] mb-1">
                    Teléfono (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    placeholder="55-1234-5678"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-xs font-medium text-[#050505] focus:outline-none focus:border-[#1877F2] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#65676B] mb-1">
                    URL de Foto o Avatar
                  </label>
                  <input
                    type="url"
                    placeholder="https://... (o vacío para avatar de Facebook)"
                    value={editForm.avatarUrl}
                    onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-xs font-medium text-[#050505] focus:outline-none focus:border-[#1877F2] focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#CED0D4]">
                <button
                  type="button"
                  id="btn-cancel-edit-player"
                  onClick={() => setPlayerToEdit(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#65676B] hover:bg-[#F0F2F5] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-save-edit-player"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1877F2] hover:bg-[#0866FF] text-white transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CAMERA CAPTURE MODAL FOR PLAYERS */}
      <CameraCaptureModal
        isOpen={cameraModalTarget !== null}
        onClose={() => setCameraModalTarget(null)}
        onCapture={(dataUrl) => {
          if (cameraModalTarget === 'new') {
            setNewPlayerPhoto(dataUrl);
          } else if (cameraModalTarget === 'edit') {
            setEditForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
          } else if (cameraModalTarget === 'admin') {
            setAdminProfileForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
          }
        }}
        title={
          cameraModalTarget === 'admin'
            ? 'Tomar Foto de Perfil del Administrador / DT'
            : cameraModalTarget === 'new'
            ? 'Tomar Foto para Nuevo Jugador'
            : `Tomar Foto para ${editForm.name || 'el Jugador'}`
        }
        subtitle="Centra el rostro dentro del círculo para la credencial oficial"
        playerName={cameraModalTarget === 'admin' ? adminProfileForm.name : cameraModalTarget === 'new' ? newPlayerName : editForm.name}
        dorsal={cameraModalTarget === 'admin' ? 'DT' : cameraModalTarget === 'new' ? newPlayerNumber : editForm.number}
      />

      {/* AI Table Scanner Modal */}
      {setStandings && (
        <TableAiScannerModal
          isOpen={isAiTableModalOpen}
          onClose={() => setIsAiTableModalOpen(false)}
          team={team}
          onApplyStandings={(newRows, updatedLeague) => {
            setStandings(newRows);
            if (updatedLeague) {
              setTeam((prev) => ({ ...prev, leagueName: updatedLeague }));
            }
            setNotificationStatus('¡Tabla de la liga actualizada exitosamente con IA!');
            setTimeout(() => setNotificationStatus(null), 4000);
          }}
        />
      )}
    </div>
  );
};
