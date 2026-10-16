import React from 'react';
import {
  Bell,
  X,
  Check,
  Crown,
  Shield,
  Calendar,
  Sparkles,
  Trash2,
  CheckCircle2,
  UserCheck,
  ExternalLink,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppNotification, AppUser, Player, TeamInfo } from '../types';

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
  onAcceptInvitationSuccess?: (playerName: string) => void;
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
  onAcceptInvitationSuccess,
}) => {
  if (!isOpen) return null;

  // Filter notifications for current user
  const userNotifications = notifications.filter(
    (n) => n.recipientUserId === currentUser.id || n.recipientUserId === 'all'
  );

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.recipientUserId === currentUser.id || n.recipientUserId === 'all'
          ? { ...n, read: true }
          : n
      )
    );
  };

  const handleClearNotifications = () => {
    setNotifications((prev) =>
      prev.filter(
        (n) => n.recipientUserId !== currentUser.id && n.recipientUserId !== 'all'
      )
    );
  };

  const handleAcceptInvitation = (notif: AppNotification) => {
    const dorsal = notif.invitationData?.dorsal || 10;
    const position = notif.invitationData?.position || 'DEL';
    const cleanPlayerName = currentUser.name.split(' (')[0].trim();

    // 1. Check if player with target playerId exists, or if dorsal exists, or create new player
    let targetPlayerId = notif.invitationData?.playerId;

    setPlayers((prev) => {
      // Check if existing player with that id or name exists
      const existing = prev.find(
        (p) => (targetPlayerId && p.id === targetPlayerId) || p.number === dorsal
      );

      if (existing) {
        targetPlayerId = existing.id;
        return prev.map((p) =>
          p.id === existing.id
            ? {
                ...p,
                name: cleanPlayerName,
                avatarUrl: currentUser.avatarUrl || p.avatarUrl,
                linkedUserId: currentUser.id,
                invitationStatus: 'confirmed' as const,
                isCalledUp: true,
              }
            : p
        );
      } else {
        const newPlayerId = `p_${Date.now()}`;
        targetPlayerId = newPlayerId;
        const newPlayer: Player = {
          id: newPlayerId,
          name: cleanPlayerName,
          nickname: notif.invitationData?.nickname || currentUser.username,
          number: dorsal,
          position: position,
          avatarUrl: currentUser.avatarUrl,
          goals: 0,
          assists: 0,
          matches: 0,
          yellowCards: 0,
          redCards: 0,
          isCalledUp: true,
          isStarter: false,
          mvpHistory: [],
          linkedUserId: currentUser.id,
          invitationStatus: 'confirmed' as const,
        };
        return [...prev, newPlayer];
      }
    });

    // 2. Link current user to playerId
    if (targetPlayerId) {
      const updatedUser: AppUser = {
        ...currentUser,
        playerId: targetPlayerId,
        role: 'player',
      };
      setCurrentUser(updatedUser);
    }

    // 3. Mark notification as accepted
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notif.id
          ? {
              ...n,
              status: 'accepted' as const,
              read: true,
              message: `¡Aceptaste la invitación! Eres jugador oficial de ${team.name} con el dorsal #${dorsal}.`,
            }
          : n
      )
    );

    // 4. Trigger celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // safe fallback
    }

    if (onAcceptInvitationSuccess) {
      onAcceptInvitationSuccess(cleanPlayerName);
    }
  };

  const handleDeclineInvitation = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notifId
          ? {
              ...n,
              status: 'declined' as const,
              read: true,
            }
          : n
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#1E1F24] border border-[#CED0D4] dark:border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#050505] dark:text-white animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-white dark:bg-[#242526] p-4 sm:p-5 border-b border-[#CED0D4] dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E7F3FF] dark:bg-[#1877F2]/20 text-[#1877F2] flex items-center justify-center relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E41E3F] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-[#050505] dark:text-white">
                Notificaciones del Club
              </h3>
              <p className="text-xs text-[#65676B] dark:text-gray-400">
                Invitaciones de plantilla, convocatorias y avisos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#F0F2F5] dark:bg-[#18191A] border-b border-[#CED0D4] dark:border-white/10 text-xs">
          <span className="text-[11px] font-bold text-[#65676B] dark:text-gray-400">
            {userNotifications.length} {userNotifications.length === 1 ? 'notificación' : 'notificaciones'}
          </span>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-bold text-[#1877F2] hover:underline cursor-pointer"
              >
                Marcar leídas
              </button>
            )}
            {userNotifications.length > 0 && (
              <button
                onClick={handleClearNotifications}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          {userNotifications.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto text-gray-400">
                <Bell className="w-7 h-7" />
              </div>
              <p className="font-bold text-sm text-[#050505] dark:text-white">
                No tienes notificaciones pendientes
              </p>
              <p className="text-xs text-[#65676B] dark:text-gray-400 max-w-xs mx-auto">
                Cuando el director técnico te envíe una invitación de plantilla o se convoque a un partido, aparecerá aquí directamente.
              </p>
            </div>
          ) : (
            userNotifications.map((notif) => {
              const isInvitation = notif.type === 'squad_invitation';
              const isPending = notif.status === 'pending';
              const isAccepted = notif.status === 'accepted';

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    !notif.read
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-[#1877F2]/40 shadow-xs'
                      : 'bg-[#F0F2F5] dark:bg-white/5 border-[#CED0D4] dark:border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Club or Sender Avatar */}
                    <div className="relative shrink-0">
                      <img
                        src={notif.senderAvatar || notif.teamLogo || team.logoUrl}
                        alt={notif.senderName}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover border-2 border-[#1877F2] bg-white shadow-xs"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#1877F2] text-white text-[9px]">
                        ⚽
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-xs text-[#050505] dark:text-white truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-[#65676B] dark:text-gray-400 shrink-0">
                          {new Date(notif.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-[#65676B] dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {notif.message}
                      </p>

                      {/* INVITATION ACTION BUTTONS */}
                      {isInvitation && (
                        <div className="pt-2">
                          {isPending && (
                            <div className="p-3 rounded-xl bg-white dark:bg-black/30 border border-[#CED0D4] dark:border-white/10 space-y-2.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-[#65676B] dark:text-gray-400">
                                  Dorsal asignado:
                                </span>
                                <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                  #{notif.invitationData?.dorsal || 10} • {notif.invitationData?.position || 'DEL'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleAcceptInvitation(notif)}
                                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Aceptar Convocatoria</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeclineInvitation(notif.id)}
                                  className="py-2 px-3 rounded-xl bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-[#050505] dark:text-white font-semibold text-xs transition-all cursor-pointer"
                                >
                                  Rechazar
                                </button>
                              </div>
                            </div>
                          )}

                          {isAccepted && (
                            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>¡Invitación aceptada! Eres jugador oficial del club.</span>
                            </div>
                          )}

                          {notif.status === 'declined' && (
                            <div className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 font-semibold text-[11px]">
                              Invitación rechazada.
                            </div>
                          )}
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
        <div className="p-3 bg-[#F0F2F5] dark:bg-[#18191A] border-t border-[#CED0D4] dark:border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
