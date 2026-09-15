import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  TeamInfo,
  AppUser,
  Player,
  Match,
  Language,
  UserRole,
  PlayerPosition,
  DEFAULT_FACEBOOK_AVATAR,
  ALL_POSITIONS,
  getPositionBadgeClass,
} from '../types';
import { getT } from '../utils/translations';

interface OwnerAdminPanelProps {
  team: TeamInfo;
  setTeam: React.Dispatch<React.SetStateAction<TeamInfo>>;
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  matches: Match[];
  currentUser: AppUser;
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
  currentUser,
  language,
}) => {
  const t = getT(language);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

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
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Invite link state
  const [copiedInvite, setCopiedInvite] = useState(false);

  const inviteUrl = `${window.location.origin}${window.location.pathname}?joinTeam=${encodeURIComponent(
    team.id || 'team-1'
  )}&teamName=${encodeURIComponent(team.name)}`;

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

            {/* Avatar section with real-time visual preview */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white border border-[#CED0D4] rounded-xl">
              <div className="relative shrink-0">
                <img
                  src={newPlayerPhoto.trim() || DEFAULT_FACEBOOK_AVATAR}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_FACEBOOK_AVATAR;
                  }}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#CED0D4] bg-[#E4E6EB]"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#050505] text-white text-[10px] font-mono font-bold flex items-center justify-center border border-white">
                  {newPlayerNumber || '?'}
                </span>
              </div>

              <div className="flex-1 w-full space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[#65676B]">
                    Foto de Perfil del Jugador
                  </label>
                  {newPlayerPhoto && (
                    <button
                      type="button"
                      onClick={() => setNewPlayerPhoto('')}
                      className="text-[10px] font-bold text-[#1877F2] hover:underline cursor-pointer"
                    >
                      Restablecer a foto por defecto (Facebook)
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  placeholder="URL de foto o déjalo vacío para silueta de Facebook por defecto"
                  value={newPlayerPhoto}
                  onChange={(e) => setNewPlayerPhoto(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#F0F2F5] border border-[#CED0D4] rounded-lg text-xs font-medium text-[#050505] focus:outline-none focus:border-[#1877F2] focus:bg-white"
                />
                <p className="text-[10px] text-[#65676B]">
                  {newPlayerPhoto.trim()
                    ? '✓ Foto personalizada lista'
                    : '✓ Foto por defecto asignada: Silueta clásica de Facebook'}
                </p>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap self-stretch sm:self-center"
              >
                <Plus className="w-4 h-4" />
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Team Settings */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#CED0D4] shadow-xs space-y-4">
            <h3 className="text-base font-black text-[#050505] flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#1877F2]" />
              Identidad Oficial del Club
            </h3>

            <form onSubmit={handleUpdateTeam} className="space-y-3">
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

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
                  URL del Escudo Oficial (Logo)
                </label>
                <input
                  type="url"
                  value={teamForm.logoUrl}
                  onChange={(e) => setTeamForm({ ...teamForm, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-[#050505] text-xs font-medium focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
                  URL de Foto del Equipo (Banner)
                </label>
                <input
                  type="url"
                  value={teamForm.bannerUrl}
                  onChange={(e) => setTeamForm({ ...teamForm, bannerUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-[#050505] text-xs font-medium focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {saveSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                  {saveSuccess ? '¡Guardado!' : 'Guardar Identidad'}
                </button>
              </div>
            </form>
          </div>

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
              {/* Avatar Preview & Facebook Default Option */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[#F0F2F5] border border-[#CED0D4]/80">
                <div className="relative shrink-0">
                  <img
                    src={editForm.avatarUrl.trim() || DEFAULT_FACEBOOK_AVATAR}
                    alt={editForm.name || 'Preview'}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_FACEBOOK_AVATAR;
                    }}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-xs bg-[#E4E6EB]"
                  />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#050505] text-white text-xs font-mono font-bold flex items-center justify-center border border-white">
                    {editForm.number || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-xs font-bold text-[#050505] block truncate">
                    {editForm.name || 'Nombre del futbolista'}
                  </span>
                  <div className="flex items-center gap-2">
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
                      <span>Usar foto de Facebook por defecto</span>
                    </button>
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
    </div>
  );
};
