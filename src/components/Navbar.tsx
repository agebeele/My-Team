import React, { useState, useEffect } from 'react';
import {
  Shield,
  Bell,
  User,
  Crown,
  ChevronDown,
  Check,
  CheckCircle2,
  LogOut,
  Sparkles,
  Zap,
  Moon,
  Sun,
  X,
  MapPin,
  Plus,
  ArrowRight,
  Database,
} from 'lucide-react';
import { AppUser, Language, TeamInfo, UserRole, TeamInvitation, TeamJoinRequest } from '../types';
import { getT } from '../utils/translations';
import { APP_NAME, APP_LOGO_URL } from '../assets/branding';
import { INITIAL_TEAMS } from '../data/initialData';

interface NavbarProps {
  onOpenSupabaseModal?: () => void;
  currentTab?: string;
  activeTab?: string;
  setCurrentTab?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  hasLiveMatch?: boolean;
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  onLogout?: () => void;
  users?: AppUser[];
  allUsers?: AppUser[];
  team: TeamInfo;
  allTeams?: TeamInfo[];
  onSwitchTeam?: (team: TeamInfo) => void;
  language: Language;
  setLanguage?: (lang: Language) => void;
  unreadAlertsCount?: number;
  onOpenNotifications?: () => void;
  onOpenAuthModal?: () => void;
  onOpenAuth?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  joinRequests?: TeamJoinRequest[];
  onAcceptJoinRequest?: (req: TeamJoinRequest) => void;
  onRejectJoinRequest?: (reqId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  activeTab,
  setCurrentTab,
  setActiveTab,
  hasLiveMatch = false,
  currentUser,
  onLogout,
  team,
  allTeams = INITIAL_TEAMS,
  onSwitchTeam,
  language,
  unreadAlertsCount = 0,
  onOpenNotifications = () => {},
  onOpenSupabaseModal,
  theme = 'light',
  onToggleTheme,
  joinRequests = [],
  onAcceptJoinRequest,
  onRejectJoinRequest,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showTeamSwitcherModal, setShowTeamSwitcherModal] = useState(false);
  const [sentInvitations, setSentInvitations] = useState<TeamInvitation[]>(() => {
    try {
      const stored = localStorage.getItem('teamgol_sent_invitations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem('teamgol_sent_invitations');
        if (stored) setSentInvitations(JSON.parse(stored));
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const myPendingInvitations = sentInvitations.filter(
    (inv) => inv.email.toLowerCase() === currentUser?.email.toLowerCase() && inv.status === 'sent'
  );

  const pendingTeamRequests = currentUser?.role === 'owner'
    ? joinRequests.filter((r) => r.teamId === team.id && r.status === 'pending')
    : [];

  const totalUnreadCount = unreadAlertsCount + myPendingInvitations.length + pendingTeamRequests.length;

  const handleAcceptInvite = (inv: TeamInvitation) => {
    const updated = sentInvitations.map((i) =>
      i.id === inv.id ? { ...i, status: 'accepted' as const } : i
    );
    setSentInvitations(updated);
    try {
      localStorage.setItem('teamgol_sent_invitations', JSON.stringify(updated));
    } catch {}

    const targetTeam = allTeams.find((t) => t.id === inv.teamId || t.name === inv.teamName);
    if (targetTeam && onSwitchTeam) {
      onSwitchTeam(targetTeam);
    }
    setShowNotificationsMenu(false);
  };

  const handleDeclineInvite = (invId: string) => {
    const updated = sentInvitations.filter((i) => i.id !== invId);
    setSentInvitations(updated);
    try {
      localStorage.setItem('teamgol_sent_invitations', JSON.stringify(updated));
    } catch {}
  };

  const t = getT(language);

  const selectedTab = currentTab || activeTab || 'calendar';
  const handleTabChange = (tabId: string) => {
    if (setCurrentTab) setCurrentTab(tabId);
    if (setActiveTab) setActiveTab(tabId);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'league_admin':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-full">
            <Shield className="w-3 h-3 text-purple-600" />
            <span>Oficial de Liga</span>
          </span>
        );
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
            <Crown className="w-3 h-3 text-amber-600" />
            <span>DT / Dueño</span>
          </span>
        );
      case 'player':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full">
            <User className="w-3 h-3 text-blue-600" />
            <span>Jugador</span>
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#242526]/95 backdrop-blur-md border-b border-[#CED0D4] dark:border-white/10 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Left Brand & Active Club */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Team Crest */}
            <div className="relative shrink-0">
              <img
                src={team.logoUrl}
                alt={team.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-cover ring-2 ring-[#1877F2]/40 shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[9px] font-black shadow-xs">
                7
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-[#050505] dark:text-white flex items-center gap-1">
                  <span>{currentUser.role === 'league_admin' ? 'Panel de Liga' : team.shortName}</span>
                </h1>
                {hasLiveMatch && currentUser.role !== 'league_admin' && (
                  <button
                    onClick={() => handleTabChange('live_match')}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-wider animate-pulse cursor-pointer shadow-xs hover:bg-rose-100 transition-colors"
                    title="Hay un partido de Fútbol 7 en juego"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    <span>EN VIVO</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-[#65676B] dark:text-gray-400 truncate max-w-[150px] sm:max-w-xs font-medium">
                {team.leagueName || 'Liga Premier Fútbol 7'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#F0F2F5] dark:bg-[#18191A] p-1 rounded-xl">
            {currentUser.role === 'league_admin' ? (
              <>
                <button
                  id="nav-btn-wall"
                  onClick={() => handleTabChange('wall')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedTab === 'wall'
                      ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-[#60A5FA] shadow-xs'
                      : 'text-[#65676B] dark:text-gray-300 hover:text-[#050505] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  📰 {t.nav.wall}
                </button>
                <button
                  id="nav-btn-tables"
                  onClick={() => handleTabChange('tables')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedTab === 'tables' || selectedTab === 'standings'
                      ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-[#60A5FA] shadow-xs'
                      : 'text-[#65676B] dark:text-gray-300 hover:text-[#050505] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  🏆 {t.nav.tables}
                </button>
              </>
            ) : !currentUser.teamId && currentUser.role === 'player' ? (
              <>
                <button
                  id="nav-btn-leagues"
                  onClick={() => handleTabChange('leagues')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedTab === 'leagues'
                      ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-[#60A5FA] shadow-xs'
                      : 'text-[#65676B] dark:text-gray-300 hover:text-[#050505] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  🏆 Ligas y Equipos
                </button>
                <button
                  id="nav-btn-wall"
                  onClick={() => handleTabChange('wall')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedTab === 'wall'
                      ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-[#60A5FA] shadow-xs'
                      : 'text-[#65676B] dark:text-gray-300 hover:text-[#050505] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  📰 Muro de la Liga
                </button>
              </>
            ) : (
              <>
                <button
                  id="nav-btn-calendar"
                  onClick={() => handleTabChange('calendar')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedTab === 'calendar'
                      ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-[#60A5FA] shadow-xs'
                      : 'text-[#65676B] dark:text-gray-300 hover:text-[#050505] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  {t.nav.calendar}
                </button>
                <button
                  id="nav-btn-live-match"
                  onClick={() => handleTabChange('live_match')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedTab === 'live_match'
                      ? 'bg-white dark:bg-[#242526] text-rose-600 shadow-xs'
                      : hasLiveMatch
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 animate-pulse'
                      : 'text-[#65676B] dark:text-gray-300 hover:text-[#050505] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  <Zap
                    className={`w-3.5 h-3.5 ${
                      hasLiveMatch ? 'text-rose-600 fill-rose-600' : 'text-[#65676B] dark:text-gray-400'
                    }`}
                  />
                  <span>{t.nav.liveMatch || 'Modo Partido'}</span>
                  {hasLiveMatch && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                  )}
                </button>
                <button
                  id="nav-btn-convocatoria"
                  onClick={() => handleTabChange('convocatoria')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedTab === 'convocatoria'
                      ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-[#60A5FA] shadow-xs'
                      : 'text-[#65676B] dark:text-gray-300 hover:text-[#050505] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  {t.nav.convocatoria}
                </button>
                <button
                  id="nav-btn-lineup"
                  onClick={() => handleTabChange('lineup')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedTab === 'lineup'
                      ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-[#60A5FA] shadow-xs'
                      : 'text-[#65676B] dark:text-gray-300 hover:text-[#050505] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  {t.nav.lineup}
                </button>
                <button
                  id="nav-btn-tables"
                  onClick={() => handleTabChange('tables')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedTab === 'tables' || selectedTab === 'standings'
                      ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-[#60A5FA] shadow-xs'
                      : 'text-[#65676B] dark:text-gray-300 hover:text-[#050505] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  {t.nav.tables}
                </button>
                <button
                  id="nav-btn-mvp"
                  onClick={() => handleTabChange('mvp')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedTab === 'mvp'
                      ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-[#60A5FA] shadow-xs'
                      : 'text-[#65676B] dark:text-gray-300 hover:text-[#050505] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {t.nav.mvp}
                </button>
                <button
                  id="nav-btn-wall"
                  onClick={() => handleTabChange('wall')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    selectedTab === 'wall'
                      ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-[#60A5FA] shadow-xs'
                      : 'text-[#65676B] dark:text-gray-300 hover:text-[#050505] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
                >
                  {t.nav.wall}
                </button>
                {currentUser.role === 'owner' && (
                  <button
                    id="nav-btn-admin"
                    onClick={() => handleTabChange('admin')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedTab === 'admin'
                        ? 'bg-white text-[#1877F2] shadow-xs'
                        : 'text-[#1877F2] hover:bg-white/60'
                    }`}
                  >
                    Configuración
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            {/* Global Dark / Light Theme Toggle Switch */}
            {onToggleTheme && (
              <button
                id="btn-theme-toggle"
                onClick={onToggleTheme}
                className="w-9 h-9 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] text-[#050505] dark:text-amber-400 transition-colors flex items-center justify-center shadow-xs cursor-pointer"
                title={theme === 'dark' ? 'Cambiar a Tema Claro' : 'Cambiar a Tema Oscuro'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-[#050505]" />
                )}
              </button>
            )}

            {/* Notification Bell with In-App Invitations Popover */}
            <div className="relative">
              <button
                id="btn-notifications-bell"
                onClick={() => {
                  setShowNotificationsMenu(!showNotificationsMenu);
                  setShowRoleMenu(false);
                }}
                className="relative w-9 h-9 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] text-[#050505] dark:text-white transition-colors flex items-center justify-center shadow-xs cursor-pointer"
                title="Notificaciones e invitaciones oficiales"
              >
                <Bell className="w-4 h-4" />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#E41E3F] text-[10px] font-bold text-white shadow-xs animate-pulse">
                    {totalUnreadCount}
                  </span>
                )}
              </button>

              {/* In-App Notifications Dropdown */}
              {showNotificationsMenu && (
                <div
                  id="menu-notifications-dropdown"
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#242526] border border-[#CED0D4] dark:border-white/10 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-[#050505] dark:text-white"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#CED0D4] dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#1877F2]" />
                      <h4 className="text-sm font-black">Centro de Notificaciones</h4>
                    </div>
                    {totalUnreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[10px] font-black">
                        {totalUnreadCount} nuevas
                      </span>
                    )}
                  </div>

                  <div className="py-2 space-y-3 max-h-80 overflow-y-auto">
                    {/* 1. Pending Player Join Requests for this Team's DT */}
                    {pendingTeamRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-300 dark:border-amber-700/60 space-y-2.5"
                      >
                        <div className="flex items-start gap-2.5">
                          <img
                            src={req.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                            alt={req.userName}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-amber-400 shrink-0 bg-white"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-[#050505] dark:text-white block truncate">
                                {req.userName}
                              </span>
                              {req.number && (
                                <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded font-mono font-bold">
                                  #{req.number}
                                </span>
                              )}
                              {req.position && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                                  {req.position}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#65676B] dark:text-gray-300 mt-0.5 leading-snug">
                              Solicita unirse al plantel oficial de <strong>{team.name}</strong>.
                            </p>
                            <span className="text-[10px] text-gray-400 mt-0.5 block truncate">
                              {req.userEmail}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (onAcceptJoinRequest) onAcceptJoinRequest(req);
                              setShowNotificationsMenu(false);
                            }}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aceptar Jugador</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onRejectJoinRequest) onRejectJoinRequest(req.id);
                            }}
                            className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors cursor-pointer"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* 2. Team invitations sent to this player */}
                    {myPendingInvitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/60 space-y-2.5"
                      >
                        <div className="flex items-start gap-2.5">
                          {inv.teamLogo ? (
                            <img
                              src={inv.teamLogo}
                              alt={inv.teamName}
                              className="w-9 h-9 rounded-xl object-cover ring-1 ring-blue-300 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-blue-500 text-white font-black flex items-center justify-center shrink-0 text-xs">
                              ⚽
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs text-[#050505] dark:text-white block">
                              Convocatoria Oficial de Equipo
                            </span>
                            <p className="text-[11px] text-[#65676B] dark:text-gray-300 mt-0.5 leading-snug">
                              Has sido convocado para unirte al club <span className="font-bold text-blue-600 dark:text-blue-400">{inv.teamName}</span> en la cancha {inv.stadium || 'local'}.
                            </p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {inv.sentAt}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAcceptInvite(inv)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aceptar y Unirme</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineInvite(inv.id)}
                            className="py-1.5 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-[#65676B] dark:text-gray-300 font-bold text-xs transition-colors cursor-pointer"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))}

                    {pendingTeamRequests.length === 0 && myPendingInvitations.length === 0 && (
                      <div className="py-6 text-center space-y-1">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
                        <p className="text-xs font-bold text-[#050505] dark:text-white">Al día</p>
                        <p className="text-[11px] text-[#65676B] dark:text-gray-400">
                          No tienes notificaciones pendientes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role & Profile Switcher Dropdown */}
            <div className="relative">
              <button
                id="btn-profile-dropdown"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-[#E4E6EB] dark:hover:bg-[#3A3B3C] transition-all cursor-pointer"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-[#1877F2]"
                />
                <div className="hidden sm:block text-left pr-1.5">
                  <div className="text-xs font-bold text-[#050505] dark:text-white truncate max-w-[110px]">
                    {(currentUser.name || 'Usuario').split(' ')[0]}
                  </div>
                  {getRoleBadge(currentUser.role)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#65676B] dark:text-gray-400 hidden sm:block mr-1" />
              </button>

              {/* Profile Menu */}
              {showRoleMenu && (
                <div
                  id="menu-role-dropdown"
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#242526] border border-[#CED0D4] dark:border-white/10 shadow-2xl p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {/* Current Active Account Header */}
                  <div className="p-3 bg-[#F0F2F5] dark:bg-[#18191A] rounded-xl border border-gray-100 dark:border-white/5 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-[#1877F2] shadow-xs"
                      />
                      <div className="truncate min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#050505] dark:text-white truncate">
                          {currentUser.name}
                        </p>
                        {currentUser.adminTitle && currentUser.role === 'owner' && (
                          <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 truncate">
                            ⭐ {currentUser.adminTitle}
                          </p>
                        )}
                        <p className="text-[11px] text-[#65676B] dark:text-gray-400 truncate">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/60 dark:border-white/10">
                      <span className="text-[10px] text-[#65676B] dark:text-gray-400 font-semibold">
                        Club actual:
                      </span>
                      <span className="text-xs font-bold text-[#1877F2] truncate max-w-[120px]">
                        {team.name}
                      </span>
                    </div>
                  </div>

                  {/* Direct Actions for Active User */}
                  <div className="mt-2 space-y-1">
                    <button
                      id="btn-menu-my-profile"
                      onClick={() => {
                        handleTabChange('profile');
                        setShowRoleMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs font-semibold text-[#050505] dark:text-white hover:bg-[#F0F2F5] dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#1877F2]" />
                      <span>Ver mi perfil y estadísticas</span>
                    </button>

                    <button
                      id="btn-menu-switch-team"
                      onClick={() => {
                        setShowRoleMenu(false);
                        setShowTeamSwitcherModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs font-semibold text-[#1877F2] hover:bg-[#E7F3FF] dark:hover:bg-[#1877F2]/10 transition-colors cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-[#1877F2]" />
                      <span>Cambiar de Equipo ({allTeams.length} registrados)</span>
                    </button>

                    {currentUser.role === 'owner' && (
                      <button
                        id="btn-menu-owner-admin"
                        onClick={() => {
                          handleTabChange('owner_admin');
                          setShowRoleMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs font-semibold text-amber-900 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
                      >
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span>Panel de Administración & Perfil DT</span>
                      </button>
                    )}

                    {currentUser.role === 'league_admin' && onOpenSupabaseModal && (
                      <button
                        id="btn-menu-supabase-modal"
                        onClick={() => {
                          setShowRoleMenu(false);
                          onOpenSupabaseModal();
                        }}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                      >
                        <Database className="w-4 h-4 text-emerald-600" />
                        <div className="flex items-center justify-between flex-1">
                          <span>Base de Datos Supabase</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Logout Action */}
                  {onLogout && (
                    <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-white/10">
                      <button
                        id="btn-navbar-logout"
                        onClick={() => {
                          setShowRoleMenu(false);
                          onLogout();
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-200 shadow-xs"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Team Switcher Modal */}
      {showTeamSwitcherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#242526] border border-[#CED0D4] dark:border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#050505] dark:text-white animate-in zoom-in-95 duration-200 max-h-[85vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#CED0D4] dark:border-white/10 flex items-center justify-between bg-[#F0F2F5] dark:bg-[#18191A]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#1877F2]/10 text-[#1877F2]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    Equipos Registrados en el Sistema
                  </h3>
                  <p className="text-xs text-[#65676B] dark:text-gray-400">
                    Selecciona un club para ver su plantilla, partidos y tabla de liga
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTeamSwitcherModal(false)}
                className="p-1.5 rounded-lg bg-white dark:bg-[#3A3B3C] hover:bg-[#E4E6EB] text-[#65676B] dark:text-gray-300 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Teams List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
              {allTeams.map((t) => {
                const isActive = t.id === team.id;
                return (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-[#E7F3FF] dark:bg-[#1877F2]/20 border-[#1877F2] ring-2 ring-[#1877F2]/30 shadow-xs'
                        : 'bg-white dark:bg-[#18191A] border-[#CED0D4] dark:border-white/10 hover:border-[#1877F2]/50 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={t.logoUrl}
                        alt={t.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-[#CED0D4] dark:border-white/10 shadow-xs shrink-0 bg-white"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-[#050505] dark:text-white truncate">
                            {t.name}
                          </h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-50 text-[#1877F2] border border-[#1877F2]/20 shrink-0">
                            {t.shortName}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#65676B] dark:text-gray-400 font-medium truncate">
                          {t.leagueName}
                        </p>
                        <p className="text-[10px] text-[#65676B] dark:text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>{t.stadium}</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#1877F2] bg-white dark:bg-[#242526] px-3 py-1.5 rounded-xl border border-[#1877F2]/40 shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                          <span>Activo</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (onSwitchTeam) {
                              onSwitchTeam(t);
                            }
                            setShowTeamSwitcherModal(false);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                        >
                          <span>Seleccionar</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#F0F2F5] dark:bg-[#18191A] border-t border-[#CED0D4] dark:border-white/10 flex items-center justify-between text-xs text-[#65676B] dark:text-gray-400">
              <span>Cada equipo tiene su propia plantilla y partidos independientes.</span>
              <button
                type="button"
                onClick={() => setShowTeamSwitcherModal(false)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#242526] hover:bg-gray-100 dark:hover:bg-white/10 text-[#050505] dark:text-white font-bold border border-[#CED0D4] dark:border-white/10 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
