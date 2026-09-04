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
} from 'lucide-react';
import { AppUser, Language, TeamInfo, UserRole } from '../types';
import { getT } from '../utils/translations';

interface NavbarProps {
  currentTab?: string;
  activeTab?: string;
  setCurrentTab?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
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
  currentUser,
  setCurrentUser,
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
    switch (role) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
            <Crown className="w-3 h-3 text-amber-400" />
            {t.roles.owner}
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25">
            <Shield className="w-3 h-3 text-purple-400" />
            {t.roles.admin}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
            <User className="w-3 h-3 text-emerald-400" />
            {t.roles.player}
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#141416]/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand & Team Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={team.logoUrl}
                alt={team.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-black font-black">
                ⚡
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  {team.shortName}
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-semibold text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                  {team.foundedYear}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate max-w-[180px] sm:max-w-xs">
                {team.leagueName}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#0A0A0B]/80 p-1 rounded-lg border border-white/5">
            <button
              id="nav-btn-calendar"
              onClick={() => handleTabChange('calendar')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedTab === 'calendar'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.nav.calendar}
            </button>
            <button
              id="nav-btn-convocatoria"
              onClick={() => handleTabChange('convocatoria')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedTab === 'convocatoria'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.nav.convocatoria}
            </button>
            <button
              id="nav-btn-lineup"
              onClick={() => handleTabChange('lineup')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedTab === 'lineup'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.nav.lineup}
            </button>
            <button
              id="nav-btn-tables"
              onClick={() => handleTabChange('tables')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedTab === 'tables'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.nav.tables}
            </button>
            <button
              id="nav-btn-mvp"
              onClick={() => handleTabChange('mvp')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                selectedTab === 'mvp'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold'
                  : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {t.nav.mvp}
            </button>
            <button
              id="nav-btn-wall"
              onClick={() => handleTabChange('wall')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedTab === 'wall'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.nav.wall}
            </button>
            {(currentUser.role === 'owner' || currentUser.role === 'admin') && (
              <button
                id="nav-btn-admin"
                onClick={() => handleTabChange('admin')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  selectedTab === 'admin'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-purple-300 hover:text-white hover:bg-purple-500/10'
                }`}
              >
                {t.nav.admin}
              </button>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              id="btn-lang-toggle"
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title={language === 'es' ? 'Cambiar a English' : 'Switch to Spanish'}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="uppercase">{language}</span>
            </button>

            {/* Notification Bell */}
            <button
              id="btn-notifications-bell"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
              title="Notificaciones de partidos"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-[#141416]">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Role & Profile Switcher Dropdown */}
            <div className="relative">
              <button
                id="btn-profile-dropdown"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-emerald-500/40"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-white truncate max-w-[110px]">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  {getRoleBadge(currentUser.role)}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
              </button>

              {/* Profile / Switch Role Menu */}
              {showRoleMenu && (
                <div
                  id="menu-role-dropdown"
                  className="absolute right-0 mt-2 w-72 rounded-xl bg-[#141416] border border-white/10 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-2 py-1.5 border-b border-white/5 mb-2">
                    <p className="text-xs font-medium text-gray-400">{t.roles.currentRole}:</p>
                    <p className="text-sm font-bold text-white">{currentUser.name}</p>
                    <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                    <div className="mt-1.5">{getRoleBadge(currentUser.role)}</div>
                  </div>

                  <p className="px-2 text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">
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
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                            isCurrent
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : 'hover:bg-white/5 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              referrerPolicy="no-referrer"
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <div className="truncate">
                              <span className="font-semibold block truncate">{u.name}</span>
                              <span className="text-[10px] text-gray-400 capitalize">
                                {u.role === 'owner' ? t.roles.owner : u.role === 'admin' ? t.roles.admin : t.roles.player}
                              </span>
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                    <button
                      id="btn-social-auth-modal"
                      onClick={() => {
                        setShowRoleMenu(false);
                        handleOpenAuth();
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                    >
                      <User className="w-3.5 h-3.5" />
                      {t.auth.login} / Social
                    </button>

                    {(currentUser.role === 'owner' || currentUser.role === 'admin') && (
                      <button
                        onClick={() => {
                          handleTabChange('admin');
                          setShowRoleMenu(false);
                        }}
                        className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        {t.nav.admin}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
