import React, { useState } from 'react';
import {
  Shield,
  Bell,
  Globe,
  User,
  Crown,
  Settings,
  ChevronDown,
  Check,
  Smartphone,
  LogOut,
  Sparkles,
  Zap,
  Activity,
  Moon,
  Sun,
} from 'lucide-react';
import { AppUser, Language, TeamInfo, UserRole } from '../types';
import { getT } from '../utils/translations';

interface NavbarProps {
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
  language: Language;
  setLanguage: (lang: Language) => void;
  unreadAlertsCount?: number;
  onOpenNotifications?: () => void;
  onOpenAuthModal?: () => void;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  activeTab,
  setCurrentTab,
  setActiveTab,
  hasLiveMatch = false,
  currentUser,
  setCurrentUser,
  onLogout,
  users,
  allUsers,
  team,
  language,
  setLanguage,
  unreadAlertsCount = 0,
  onOpenNotifications = () => {},
  onOpenAuthModal,
  onOpenAuth,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const t = getT(language);

  const selectedTab = currentTab || activeTab || 'calendar';
  const handleTabChange = (tabId: string) => {
    if (setCurrentTab) setCurrentTab(tabId);
    if (setActiveTab) setActiveTab(tabId);
  };
  const userList = allUsers || users || [];
  const handleOpenAuth = onOpenAuth || onOpenAuthModal || (() => {});

  const getRoleBadge = (role: UserRole) => {
    if (role === 'owner') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#E7F3FF] text-[#1877F2] border border-[#1877F2]/30">
          <Crown className="w-3 h-3 text-[#1877F2]" />
          {t.roles.owner}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
        <User className="w-3 h-3 text-gray-500" />
        {t.roles.player}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#242526] border-b border-[#CED0D4] dark:border-white/10 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand & Team Info with Facebook Blue Style */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={team.logoUrl}
                alt={team.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border-2 border-[#1877F2] shadow-sm"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1877F2] text-[9px] text-white font-black shadow-xs">
                7
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-[#050505] dark:text-white flex items-center gap-1.5">
                  {team.shortName}
                </h1>
                <span className="inline-block text-[10px] uppercase tracking-wider font-extrabold text-[#1877F2] bg-[#E7F3FF] dark:bg-[#1877F2]/20 border border-[#1877F2]/20 px-2 py-0.5 rounded-full">
                  FÚTBOL 7
                </span>
                {hasLiveMatch && (
                  <button
                    onClick={() => handleTabChange('live_match')}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-black uppercase tracking-wider animate-pulse cursor-pointer shadow-xs hover:bg-rose-100 transition-colors"
                    title="Hay un partido de Fútbol 7 en juego. Clic para entrar al Modo Partido"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    <span>EN VIVO</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-[#65676B] dark:text-gray-400 truncate max-w-[180px] sm:max-w-xs font-medium">
                {team.leagueName}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs - Facebook Modern Style */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#F0F2F5] dark:bg-[#18191A] p-1 rounded-xl">
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
                selectedTab === 'tables'
                  ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-[#60A5FA] shadow-xs'
                  : 'text-[#65676B] dark:text-gray-300 hover:text-[#050505] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10'
              }`}
            >
              {t.nav.tables}
            </button>
            <button
              id="nav-btn-mvp"
              onClick={() => handleTabChange('mvp')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                selectedTab === 'mvp'
                  ? 'bg-white dark:bg-[#242526] text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-[#65676B] dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white/60 dark:hover:bg-white/10'
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
          </nav>

          {/* Right Action Bar - Facebook Circular Action Buttons */}
          <div className="flex items-center gap-2">

            {/* Language Switcher */}
            <button
              id="btn-lang-toggle"
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="w-9 h-9 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] text-[#050505] dark:text-white transition-colors flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer"
              title={language === 'es' ? 'Cambiar a English' : 'Switch to Spanish'}
            >
              <span className="uppercase text-[11px]">{language}</span>
            </button>

            {/* Notification Bell */}
            <button
              id="btn-notifications-bell"
              onClick={onOpenNotifications}
              className="relative w-9 h-9 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] text-[#050505] dark:text-white transition-colors flex items-center justify-center shadow-xs cursor-pointer"
              title="Notificaciones de partidos"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#E41E3F] text-[10px] font-bold text-white shadow-xs">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

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
                    {currentUser.name.split(' ')[0]}
                  </div>
                  {getRoleBadge(currentUser.role)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#65676B] dark:text-gray-400 hidden sm:block mr-1" />
              </button>

              {/* Profile / Switch Role Menu */}
              {showRoleMenu && (
                <div
                  id="menu-role-dropdown"
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#242526] border border-[#CED0D4] dark:border-white/10 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 mb-2 bg-[#F0F2F5] dark:bg-[#18191A] rounded-xl">
                    <p className="text-[11px] font-medium text-[#65676B] dark:text-gray-400">{t.roles.currentRole}:</p>
                    <p className="text-sm font-bold text-[#050505] dark:text-white">{currentUser.name}</p>
                    <p className="text-xs text-[#65676B] dark:text-gray-400 truncate">{currentUser.email}</p>
                    <div className="mt-1.5">{getRoleBadge(currentUser.role)}</div>
                  </div>

                  <p className="px-2 text-[10px] uppercase tracking-widest text-[#65676B] dark:text-gray-400 font-extrabold mb-1">
                    {t.roles.switchRole} / Demo:
                  </p>

                  <div className="space-y-1">
                    {userList.map((u) => {
                      const isCurrent = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          id={`switch-user-${u.id}`}
                          onClick={() => {
                            setCurrentUser(u);
                            setShowRoleMenu(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-[#E7F3FF] dark:bg-[#1877F2]/20 text-[#1877F2] dark:text-[#60A5FA] font-semibold'
                              : 'hover:bg-[#F0F2F5] dark:hover:bg-white/5 text-[#050505] dark:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div className="truncate">
                              <span className="font-bold block truncate">{u.name}</span>
                              <span className="text-[10px] text-[#65676B] capitalize">
                                {u.role === 'owner' ? t.roles.owner : t.roles.player}
                              </span>
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-[#1877F2] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <button
                      id="btn-social-auth-modal"
                      onClick={() => {
                        setShowRoleMenu(false);
                        handleOpenAuth();
                      }}
                      className="text-xs text-[#1877F2] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" />
                      Cambiar Cuenta
                    </button>

                    {currentUser.role === 'owner' && (
                      <button
                        onClick={() => {
                          handleTabChange('admin');
                          setShowRoleMenu(false);
                        }}
                        className="text-xs text-[#1877F2] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Configuración
                      </button>
                    )}
                  </div>

                  {onLogout && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <button
                        id="btn-navbar-logout"
                        onClick={() => {
                          setShowRoleMenu(false);
                          onLogout();
                        }}
                        className="w-full py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
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
    </header>
  );
};
