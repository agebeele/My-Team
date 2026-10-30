import React, { useState } from 'react';
import {
  Shield,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Search,
  Users,
  Trophy,
  Crown,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { AppUser, TeamInfo, TeamJoinRequest, Language, PlayerPosition } from '../types';
import { getT } from '../utils/translations';
import { pushBackendSyncImmediate } from '../utils/backendSync';

interface LeagueExplorerAndJoinProps {
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  allTeams: TeamInfo[];
  allUsers: AppUser[];
  setUsers?: React.Dispatch<React.SetStateAction<AppUser[]>>;
  joinRequests: TeamJoinRequest[];
  setJoinRequests: React.Dispatch<React.SetStateAction<TeamJoinRequest[]>>;
  onViewLeagueWall?: () => void;
  language: Language;
}

const LEAGUES = [
  { id: 'Champions League', name: 'Champions League', icon: '🏆', badge: 'UEFA Fut 7' },
  { id: 'Liga Mexicana', name: 'Liga Mexicana', icon: '🇲🇽', badge: 'Liga MX Fut 7' },
  { id: 'Liga Española', name: 'Liga Española', icon: '🇪🇸', badge: 'LaLiga Fut 7' },
  { id: 'Liga Francesa', name: 'Liga Francesa', icon: '🇫🇷', badge: 'Ligue 1 Fut 7' },
  { id: 'Copa del Mundo', name: 'Copa del Mundo', icon: '🌍', badge: 'Mundial Fut 7' },
];

export const LeagueExplorerAndJoin: React.FC<LeagueExplorerAndJoinProps> = ({
  currentUser,
  setCurrentUser,
  allTeams,
  allUsers,
  setUsers,
  joinRequests,
  setJoinRequests,
  onViewLeagueWall,
  language,
}) => {
  const [selectedLeague, setSelectedLeague] = useState<string>(
    currentUser.requestedLeague || 'Champions League'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Find active join request for this user
  const activeRequest = joinRequests.find(
    (r) => r.userId === currentUser.id && r.status === 'pending'
  );

  // Filter teams for selected league
  const leagueTeams = allTeams.filter((t) => {
    const tLeague = (t.leagueName || '').trim().toLowerCase();
    const selLeague = selectedLeague.trim().toLowerCase();
    return tLeague === selLeague;
  });

  const filteredTeams = leagueTeams.filter((t) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.stadium.toLowerCase().includes(q) ||
      (t.location && t.location.toLowerCase().includes(q))
    );
  });

  // Handle request to join a team
  const handleRequestJoin = async (targetTeam: TeamInfo) => {
    const newRequest: TeamJoinRequest = {
      id: `req_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userAvatar: currentUser.avatarUrl,
      position: currentUser.position || 'MED',
      number: currentUser.jerseyNumber || 10,
      phone: currentUser.phone,
      teamId: targetTeam.id,
      teamName: targetTeam.name,
      teamLeague: targetTeam.leagueName,
      teamLogo: targetTeam.logoUrl,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updatedRequests = [newRequest, ...joinRequests.filter((r) => r.userId !== currentUser.id)];
    setJoinRequests(updatedRequests);

    const updatedUser: AppUser = {
      ...currentUser,
      teamJoinStatus: 'pending',
      requestedTeamId: targetTeam.id,
      requestedTeamName: targetTeam.name,
      requestedLeague: targetTeam.leagueName,
    };
    setCurrentUser(updatedUser);

    if (setUsers) {
      setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    }

    try {
      localStorage.setItem('teamgol_current_user', JSON.stringify(updatedUser));
    } catch {}

    // Send to backend SQLite
    await fetch('/api/solicitudes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRequest),
    }).catch(() => {});

    pushBackendSyncImmediate({
      joinRequests: updatedRequests,
      users: allUsers.map((u) => (u.id === currentUser.id ? updatedUser : u)),
    });

    setActionSuccessToast(
      `¡Solicitud enviada al Director Técnico de ${targetTeam.name}! Te notificaremos cuando seas aceptado en el plantel.`
    );
    setTimeout(() => setActionSuccessToast(null), 6000);
  };

  // Handle cancel pending join request
  const handleCancelRequest = async () => {
    if (!activeRequest) return;

    const updatedRequests = joinRequests.filter((r) => r.id !== activeRequest.id);
    setJoinRequests(updatedRequests);

    const updatedUser: AppUser = {
      ...currentUser,
      teamJoinStatus: 'none',
      requestedTeamId: undefined,
      requestedTeamName: undefined,
      requestedLeague: undefined,
    };
    setCurrentUser(updatedUser);

    if (setUsers) {
      setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    }

    try {
      localStorage.setItem('teamgol_current_user', JSON.stringify(updatedUser));
    } catch {}

    pushBackendSyncImmediate({
      joinRequests: updatedRequests,
      users: allUsers.map((u) => (u.id === currentUser.id ? updatedUser : u)),
    });

    setActionSuccessToast('Solicitud cancelada. Ahora puedes elegir otro equipo.');
    setTimeout(() => setActionSuccessToast(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in">
      {/* Toast alert */}
      {actionSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccessToast}</span>
          </div>
          <button
            onClick={() => setActionSuccessToast(null)}
            className="text-white/80 hover:text-white font-black text-sm shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Player Profile & Status Header */}
      <div className="bg-white dark:bg-[#242526] rounded-3xl border border-[#CED0D4] dark:border-white/10 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-[#1877F2]/40 bg-white shadow-sm shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#050505] dark:text-white tracking-tight">
                  {currentUser.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                  Jugador Fut 7
                </span>
                {currentUser.jerseyNumber && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-400 text-black">
                    #{currentUser.jerseyNumber}
                  </span>
                )}
                {currentUser.position && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800">
                    {currentUser.position}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#65676B] dark:text-gray-400 mt-0.5">
                {currentUser.email} • Pendiente de asignación a un club oficial
              </p>
            </div>
          </div>

          {onViewLeagueWall && (
            <button
              onClick={onViewLeagueWall}
              className="px-4 py-2.5 rounded-xl bg-[#E7F3FF] hover:bg-[#D0E7FF] text-[#1877F2] font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 border border-[#1877F2]/30"
            >
              <Trophy className="w-4 h-4 text-[#1877F2]" />
              <span>Ver Muro de Publicaciones de la Liga</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Callout Banner */}
        {activeRequest ? (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-spin" />
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className="font-bold block text-amber-900 dark:text-amber-100">
                  Solicitud en Revisión para unirte a: {activeRequest.teamName}
                </span>
                <span>
                  Tu ficha de jugador fue enviada al Director Técnico de <strong>{activeRequest.teamName}</strong> ({activeRequest.teamLeague || 'Fútbol 7'}).
                  En cuanto el DT acepte tu solicitud, se desbloquearán automáticamente todos los módulos de tu equipo (partidos, alineación oficial, estadísticas y convocatorias).
                </span>
              </div>
            </div>
            <button
              onClick={handleCancelRequest}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-black/40 border border-amber-400 text-amber-900 dark:text-amber-200 hover:bg-amber-100 font-bold text-xs shrink-0 cursor-pointer transition-all self-start sm:self-center"
            >
              Cancelar Solicitud
            </button>
          </div>
        ) : currentUser.teamJoinStatus === 'rejected' ? (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-700/50 text-rose-950 dark:text-rose-200 flex items-start gap-3 shadow-xs">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <span className="font-bold block text-rose-900 dark:text-rose-100">
                Solicitud anterior rechazada
              </span>
              <span>
                El cuerpo técnico del club anterior no pudo incorporar nuevos jugadores en este momento. Selecciona a continuación otro equipo de cualquiera de las 5 ligas disponibles y pulsa <strong>"Solicitar unirse"</strong>.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-blue-950 dark:text-blue-200 flex items-start gap-3 shadow-xs">
            <Sparkles className="w-5 h-5 text-[#1877F2] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <span className="font-bold block text-[#1877F2] dark:text-[#60A5FA]">
                Paso 1: Elige tu Liga y Solicita Unirte a tu Club
              </span>
              <span>
                Explora las 5 ligas oficiales a continuación. Encuentra el equipo donde juegas y pulsa <strong>"Solicitar unirse"</strong>. El Director Técnico recibirá una notificación inmediata para aceptar tu ingreso.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5 League Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-base sm:text-lg font-black text-[#050505] dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#1877F2]" />
            <span>Ligas Oficiales de Fútbol 7</span>
          </h2>
          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar por equipo o cancha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#242526] border border-[#CED0D4] dark:border-white/10 text-xs text-[#050505] dark:text-white placeholder-[#65676B] focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
            />
            <Search className="w-4 h-4 text-[#65676B] absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {LEAGUES.map((league) => {
            const isSelected = selectedLeague === league.id;
            const teamsInLeague = allTeams.filter(
              (t) => (t.leagueName || '').trim().toLowerCase() === league.id.toLowerCase()
            ).length;

            return (
              <button
                key={league.id}
                onClick={() => setSelectedLeague(league.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#1877F2] text-white border-[#1877F2] shadow-md ring-2 ring-[#1877F2]/30 scale-[1.02]'
                    : 'bg-white dark:bg-[#242526] text-[#050505] dark:text-white border-[#CED0D4] dark:border-white/10 hover:border-[#1877F2]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xl">{league.icon}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#F0F2F5] dark:bg-white/10 text-[#65676B] dark:text-gray-300'
                    }`}
                  >
                    {teamsInLeague} clubes
                  </span>
                </div>
                <div>
                  <div className="font-black text-xs sm:text-sm tracking-tight">{league.name}</div>
                  <div
                    className={`text-[10px] font-medium ${
                      isSelected ? 'text-white/80' : 'text-[#65676B] dark:text-gray-400'
                    }`}
                  >
                    {league.badge}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Teams Grid for Selected League */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-[#050505] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span>Clubes en {selectedLeague}</span>
            <span className="text-xs font-normal text-[#65676B] dark:text-gray-400">
              ({filteredTeams.length} encontrados)
            </span>
          </h3>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="bg-white dark:bg-[#242526] rounded-2xl p-8 border border-[#CED0D4] dark:border-white/10 text-center space-y-2">
            <Shield className="w-10 h-10 text-gray-400 mx-auto" />
            <p className="text-sm font-bold text-[#050505] dark:text-white">
              No se encontraron equipos en esta liga
            </p>
            <p className="text-xs text-[#65676B] dark:text-gray-400">
              Prueba cambiando el término de búsqueda o selecciona otra liga.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((t) => {
              const isThisTeamPending =
                activeRequest && activeRequest.teamId === t.id;
              const hasOtherPending =
                activeRequest && activeRequest.teamId !== t.id;

              return (
                <div
                  key={t.id}
                  className={`bg-white dark:bg-[#242526] rounded-2xl border p-4.5 flex flex-col justify-between gap-4 transition-all shadow-xs hover:shadow-md ${
                    isThisTeamPending
                      ? 'border-amber-400 ring-2 ring-amber-400/30'
                      : 'border-[#CED0D4] dark:border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={t.logoUrl}
                      alt={t.name}
                      className="w-14 h-14 rounded-2xl object-cover border border-[#CED0D4] dark:border-white/10 bg-white p-1 shadow-xs shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-black text-sm sm:text-base text-[#050505] dark:text-white truncate">
                          {t.name}
                        </h4>
                      </div>
                      <span className="inline-block mt-0.5 text-[10px] font-bold text-[#1877F2] bg-[#E7F3FF] dark:bg-[#1877F2]/20 px-2 py-0.5 rounded-md">
                        {t.leagueName}
                      </span>
                      <div className="text-xs text-[#65676B] dark:text-gray-400 font-medium flex items-center gap-1 mt-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#1877F2] shrink-0" />
                        <span className="truncate">{t.stadium}</span>
                      </div>
                      {t.location && (
                        <p className="text-[11px] text-[#65676B] dark:text-gray-400 truncate mt-0.5">
                          {t.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Section */}
                  <div className="pt-3 border-t border-[#CED0D4]/70 dark:border-white/10 flex items-center justify-between gap-2">
                    <div className="text-[11px] font-bold text-[#65676B] dark:text-gray-400 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Fútbol 7 Oficial</span>
                    </div>

                    {isThisTeamPending ? (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center gap-1.5 shadow-xs">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>Solicitud Enviada</span>
                      </span>
                    ) : hasOtherPending ? (
                      <button
                        onClick={() => handleRequestJoin(t)}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-[#1877F2] hover:text-white text-[#65676B] dark:text-gray-300 font-bold text-xs transition-all cursor-pointer"
                        title="Cambiar tu solicitud a este equipo"
                      >
                        Cambiar a este equipo
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRequestJoin(t)}
                        className="px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:shadow-md"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Solicitar unirse</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
