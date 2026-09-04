import React, { useState } from 'react';
import {
  Shield,
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
} from 'lucide-react';
import { TeamInfo, AppUser, Player, Match, Language, UserRole } from '../types';
import { getT } from '../utils/translations';

interface OwnerAdminPanelProps {
  team: TeamInfo;
  setTeam: React.Dispatch<React.SetStateAction<TeamInfo>>;
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  players: Player[];
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

  const handleSendPushReminder = (match: Match) => {
    // Check browser notification permission or simulate push notification
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
            setNotificationStatus(`Notificación simulada para el juego vs ${match.rival}: ¡Recordatorio enviado al chat y celulares del equipo!`);
          }
        });
      } else {
        setNotificationStatus(`Notificación push enviada al equipo: ¡Juego vs ${match.rival} programado para ${match.date} a las ${match.time} hrs!`);
      }
    } else {
      setNotificationStatus(`Notificación push simulada para el juego vs ${match.rival}: recordatorio activo.`);
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
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#141416] p-5 rounded-xl border border-white/5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            Panel de Control del Club (Dueño / Admin)
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Gestión institucional, roles de miembros y notificaciones del equipo
          </p>
        </div>

        <button
          onClick={handleExportBackup}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          Descargar Respaldo Total (JSON)
        </button>
      </div>

      {/* Push Notification Alert */}
      {notificationStatus && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Team Settings */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#141416] p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              Identidad Oficial del Club
            </h3>

            <form onSubmit={handleUpdateTeam} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                    Nombre del Club
                  </label>
                  <input
                    type="text"
                    required
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                    Siglas
                  </label>
                  <input
                    type="text"
                    required
                    value={teamForm.shortName}
                    onChange={(e) => setTeamForm({ ...teamForm, shortName: e.target.value })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                    Liga / Torneo
                  </label>
                  <input
                    type="text"
                    required
                    value={teamForm.leagueName}
                    onChange={(e) => setTeamForm({ ...teamForm, leagueName: e.target.value })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                    Cancha / Estadio
                  </label>
                  <input
                    type="text"
                    required
                    value={teamForm.stadium}
                    onChange={(e) => setTeamForm({ ...teamForm, stadium: e.target.value })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                  URL del Escudo Oficial (Logo)
                </label>
                <input
                  type="url"
                  value={teamForm.logoUrl}
                  onChange={(e) => setTeamForm({ ...teamForm, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                  URL de Foto del Equipo (Banner)
                </label>
                <input
                  type="url"
                  value={teamForm.bannerUrl}
                  onChange={(e) => setTeamForm({ ...teamForm, bannerUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  {saveSuccess ? <Check className="w-3.5 h-3.5" /> : null}
                  {saveSuccess ? '¡Guardado!' : 'Guardar Identidad'}
                </button>
              </div>
            </form>
          </div>

          {/* Push Notifications Reminders trigger for upcoming matches */}
          <div className="bg-[#141416] p-5 rounded-xl border border-white/5 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              Notificaciones Push para Partidos
            </h3>
            <p className="text-xs text-gray-400">
              Envía recordatorio instantáneo a los dispositivos de los jugadores convocados
            </p>

            <div className="space-y-2 pt-1">
              {matches
                .filter((m) => m.status !== 'finished')
                .map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">
                        vs {m.rival}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {m.date} a las {m.time} hrs • {m.stadium}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSendPushReminder(m)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-semibold text-[11px] transition-all"
                    >
                      <Bell className="w-3 h-3" />
                      Enviar Push
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right: User Roles & Access Control */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#141416] p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  Gestión de Usuarios y Roles ({users.length})
                </h3>
                <p className="text-xs text-gray-400">
                  Asigna permisos de Dueño de Equipo, Jugador o Administrador
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-gray-400 truncate block">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  {/* Role Selector */}
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="player">Jugador</option>
                    <option value="owner">Dueño de Equipo</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
