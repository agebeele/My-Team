import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  XCircle,
  Trophy,
  Share2,
  Users,
  Shield,
  Clock,
  Sparkles,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  AppNotification,
  AppUser,
  Player,
  TeamInfo,
  Language,
} from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  team: TeamInfo;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  onOpenStoryShare?: (type: 'mvp' | 'standings' | 'scorers' | 'player_card') => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  setNotifications,
  currentUser,
  setCurrentUser,
  team,
  players,
  setPlayers,
  onOpenStoryShare,
}) => {
  const [filter, setFilter] = useState<'all' | 'invitations' | 'unread'>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter notifications for current user (or general club notifications)
  const userNotifications = notifications.filter(
    (n) =>
      n.recipientUserId === currentUser.id ||
      (currentUser.username && n.recipientUsername === currentUser.username) ||
      n.recipientUserId === 'all'
  );

  const displayedNotifications = userNotifications.filter((n) => {
    if (filter === 'invitations') return n.type === 'team_invitation';
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.recipientUserId === currentUser.id ||
        (currentUser.username && n.recipientUsername === currentUser.username)
          ? { ...n, isRead: true }
          : n
      )
    );
    showToast('Todas las notificaciones marcadas como leídas');
  };

  const handleAcceptInvitation = (notif: AppNotification) => {
    // 1. Update notification status
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, status: 'accepted', isRead: true } : n))
    );

    // 2. Check if player already in roster
    const existingPlayerIndex = players.findIndex(
      (p) =>
        p.id === currentUser.playerId ||
        p.name.toLowerCase() === currentUser.name.toLowerCase()
    );

    let updatedPlayerId = currentUser.playerId;

    if (existingPlayerIndex >= 0) {
      // Update existing player with invited dorsal and position
      setPlayers((prev) => {
        const copy = [...prev];
        copy[existingPlayerIndex] = {
          ...copy[existingPlayerIndex],
          isCalledUp: true,
          number: notif.suggestedNumber || copy[existingPlayerIndex].number,
          position: notif.suggestedPosition || copy[existingPlayerIndex].position,
        };
        return copy;
      });
      updatedPlayerId = players[existingPlayerIndex].id;
    } else {
      // Create new official player in roster
      const newPlayerId = `p_${Date.now()}`;
      const newPlayer: Player = {
        id: newPlayerId,
        name: currentUser.name,
        nickname: currentUser.username ? `@${currentUser.username}` : 'El Fichaje',
        number: notif.suggestedNumber || currentUser.jerseyNumber || 11,
        position: notif.suggestedPosition || currentUser.position || 'DEL',
        avatarUrl: currentUser.avatarUrl,
        goals: 0,
        assists: 0,
        matches: 0,
        yellowCards: 0,
        redCards: 0,
        isCalledUp: true,
        isStarter: false,
        mvpHistory: [],
      };
      setPlayers((prev) => [...prev, newPlayer]);
      updatedPlayerId = newPlayerId;
    }

    // 3. Link currentUser to player
    setCurrentUser({
      ...currentUser,
      playerId: updatedPlayerId,
      position: notif.suggestedPosition || currentUser.position,
      jerseyNumber: notif.suggestedNumber || currentUser.jerseyNumber,
    });

    confetti({ particleCount: 50, spread: 70 });
    showToast(`🎉 ¡Invitación aceptada! Ya estás activo en la plantilla oficial de ${notif.teamName}.`);
  };

  const handleRejectInvitation = (notif: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, status: 'rejected', isRead: true } : n))
    );
    showToast('Has declinado la invitación al equipo.');
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora mismo';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1E1F20] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#CED0D4] dark:border-white/10 flex items-center justify-between bg-[#F0F2F5]/50 dark:bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2.5 rounded-2xl bg-rose-500 text-white shadow-md">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-400 text-black text-[10px] font-black">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-[#050505] dark:text-white">
                Centro de Notificaciones
              </h3>
              <p className="text-xs text-[#65676B] dark:text-gray-400">
                Invitaciones de plantilla, convocatorias y distinciones MVP
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-[#050505] dark:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toast */}
        {actionMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Filter Pills & Mark All as Read */}
        <div className="px-4 py-2.5 border-b border-[#CED0D4] dark:border-white/10 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#1877F2] text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-white/5 text-[#65676B] dark:text-gray-300'
              }`}
            >
              Todas ({userNotifications.length})
            </button>
            <button
              onClick={() => setFilter('invitations')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                filter === 'invitations'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-white/5 text-[#65676B] dark:text-gray-300'
              }`}
            >
              Invitaciones
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                filter === 'unread'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-white/5 text-[#65676B] dark:text-gray-300'
              }`}
            >
              No Leídas ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[#1877F2] hover:underline text-[11px] cursor-pointer"
            >
              Leer todas
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {displayedNotifications.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#050505] dark:text-white">
                No tienes notificaciones por ahora
              </p>
              <p className="text-xs text-[#65676B] dark:text-gray-400 max-w-xs mx-auto">
                Cuando el director técnico te mande una invitación al equipo o seas convocado a un partido, aparecerán aquí.
              </p>
            </div>
          ) : (
            displayedNotifications.map((notif) => {
              const isInvitation = notif.type === 'team_invitation';
              const isMvp = notif.type === 'mvp_award';

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    !notif.isRead
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 shadow-xs'
                      : 'bg-white dark:bg-white/5 border-[#CED0D4] dark:border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Sender / Team Icon */}
                    <div className="relative shrink-0">
                      <img
                        src={notif.senderAvatar || notif.teamLogo}
                        alt={notif.senderName}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-500 shadow-xs bg-white"
                      />
                      {isInvitation && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center text-[9px] font-black">
                          ★
                        </span>
                      )}
                      {isMvp && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-black">
                          👑
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-black text-[#050505] dark:text-white truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[10px] text-[#65676B] dark:text-gray-400 shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(notif.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-[#050505]/80 dark:text-gray-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* INVITATION SPECIFICS & ACCEPT / REJECT BUTTONS */}
                      {isInvitation && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 space-y-2">
                          <div className="flex items-center gap-3 text-[11px] font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-2 rounded-xl">
                            <span>Club: <strong>{notif.teamName}</strong></span>
                            {notif.suggestedNumber && (
                              <span>Dorsal: <strong>#{notif.suggestedNumber}</strong></span>
                            )}
                            {notif.suggestedPosition && (
                              <span>Posición: <strong>{notif.suggestedPosition}</strong></span>
                            )}
                          </div>

                          {notif.status === 'pending' || !notif.status ? (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => handleAcceptInvitation(notif)}
                                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Aceptar e Incorporarme</span>
                              </button>
                              <button
                                onClick={() => handleRejectInvitation(notif)}
                                className="py-2 px-3 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-white/10 text-[#050505] dark:text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-4 h-4 text-rose-500" />
                                <span>Declinar</span>
                              </button>
                            </div>
                          ) : notif.status === 'accepted' ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Invitación Aceptada • Ya formas parte de la plantilla</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Invitación declinada</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* MVP ACTION BUTTON */}
                      {isMvp && onOpenStoryShare && (
                        <div className="mt-2.5">
                          <button
                            onClick={() => {
                              onClose();
                              onOpenStoryShare('mvp');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-black text-xs font-black shadow-xs cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Compartir Premio MVP en Historias</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#F0F2F5] dark:bg-white/5 border-t border-[#CED0D4] dark:border-white/10 text-center">
          <p className="text-[11px] text-[#65676B] dark:text-gray-400 font-medium">
            Las notificaciones se sincronizan en tiempo real dentro de tu cuenta en la app.
          </p>
        </div>
      </div>
    </div>
  );
};
