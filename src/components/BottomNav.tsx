import React, { useState } from 'react';
import {
  CalendarDays,
  Shield,
  MoreHorizontal,
  Users,
  Trophy,
  Sparkles,
  MessageSquare,
  Settings,
  X,
  ChevronRight,
  Zap,
  Activity,
} from 'lucide-react';
import { AppUser, Language, UserRole } from '../types';
import { getT } from '../utils/translations';

interface BottomNavProps {
  currentTab?: string;
  activeTab?: string;
  setCurrentTab?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  hasLiveMatch?: boolean;
  language: Language;
  userRole?: UserRole;
  currentUser?: AppUser;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  activeTab,
  setCurrentTab,
  setActiveTab,
  hasLiveMatch = false,
  language,
  userRole,
  currentUser,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const t = getT(language);
  const selectedTab = currentTab || activeTab || 'calendar';

  const handleTabChange = (tabId: string) => {
    if (setCurrentTab) setCurrentTab(tabId);
    if (setActiveTab) setActiveTab(tabId);
    setIsMoreMenuOpen(false);
  };

  const role = userRole || currentUser?.role || 'player';
  const isOwner = role === 'owner';

  // Primary tabs visible in dock
  const primaryTabs = [
    { id: 'calendar', label: t.nav.calendar, icon: CalendarDays, isLive: false },
    {
      id: 'live_match',
      label: hasLiveMatch ? 'En Vivo' : t.nav.liveMatch || 'Modo Partido',
      icon: Zap,
      isLive: hasLiveMatch,
    },
    { id: 'lineup', label: t.nav.lineup, icon: Shield, isLive: false },
  ];

  // Secondary items shown inside the "Más" sheet
  const secondaryMenuItems = [
    {
      id: 'live_match',
      label: 'Modo Partido (En Vivo)',
      description: 'Cronómetro, goles, sustituciones y tarjetas',
      icon: Zap,
      badge: hasLiveMatch ? 'EN VIVO' : null,
      color: 'rose',
      highlight: hasLiveMatch,
    },
    {
      id: 'convocatoria',
      label: t.nav.convocatoria,
      description: 'Generador de afiche oficial de citados',
      icon: Users,
      badge: null,
      color: 'emerald',
    },
    {
      id: 'tables',
      label: t.nav.tables,
      description: 'Tabla de clasificación y goleadores',
      icon: Trophy,
      badge: null,
      color: 'amber',
    },
    {
      id: 'mvp',
      label: t.nav.mvp,
      description: 'Votación en vivo y foto al minuto 25',
      icon: Sparkles,
      badge: 'Min 25',
      color: 'amber',
      highlight: true,
    },
    {
      id: 'wall',
      label: t.nav.wall,
      description: 'Noticias, comunicados y comentarios',
      icon: MessageSquare,
      badge: null,
      color: 'blue',
    },
    {
      id: 'iot',
      label: 'Brazalete IoT (ESP32)',
      description: 'Telemetría en vivo, pulso cardíaco y aceleración',
      icon: Activity,
      badge: 'IoT',
      color: 'emerald',
      highlight: true,
    },
  ];

  if (isOwner) {
    secondaryMenuItems.push({
      id: 'admin',
      label: 'Configuración de Equipo',
      description: 'Gestión de club, agregar o eliminar jugadores',
      icon: Settings,
      badge: 'Dueño',
      color: 'blue',
    });
  }

  // Check if current active tab is one of the secondary items
  const activeSecondaryItem = secondaryMenuItems.find((item) => item.id === selectedTab);
  const isSecondaryActive = !!activeSecondaryItem;

  return (
    <>
      {/* Slide-up "Más" Sheet Modal */}
      {isMoreMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            id="more-menu-backdrop"
            onClick={() => setIsMoreMenuOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div
            id="more-menu-drawer"
            className="relative bg-white dark:bg-[#242526] border-t border-[#CED0D4] dark:border-white/10 rounded-t-2xl p-5 shadow-2xl z-10 max-h-[80vh] overflow-y-auto text-[#050505] dark:text-white"
          >
            {/* Handle bar */}
            <div className="w-12 h-1 bg-[#CED0D4] dark:bg-white/20 rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E4E6EB] dark:border-white/10">
              <div>
                <h3 className="text-base font-black text-[#050505] dark:text-white tracking-tight">
                  Más Secciones del Club (Fútbol 7)
                </h3>
                <p className="text-xs text-[#65676B] dark:text-gray-400">
                  Acceso rápido a estadísticas, convocatorias y anuncios
                </p>
              </div>
              <button
                id="btn-close-more-sheet"
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-full bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-white hover:bg-[#D8DADF] dark:hover:bg-[#4E4F50] cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid of menu options */}
            <div className="space-y-2 pb-6">
              {secondaryMenuItems.map((item) => {
                const Icon = item.icon;
                const isItemActive = selectedTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sheet-item-${item.id}`}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isItemActive
                        ? 'bg-[#E7F3FF] dark:bg-[#1877F2]/20 border-[#1877F2]/40 text-[#1877F2] dark:text-[#60A5FA]'
                        : 'bg-white dark:bg-[#18191A] border-[#CED0D4] dark:border-white/10 hover:bg-[#F0F2F5] dark:hover:bg-white/5 text-[#050505] dark:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          isItemActive
                            ? 'bg-[#1877F2] text-white'
                            : item.highlight
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                            : 'bg-[#E4E6EB] dark:bg-[#3A3B3C] text-[#050505] dark:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#050505] dark:text-white block">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#65676B] dark:text-gray-400 block mt-0.5">
                          {item.description}
                        </span>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 ${
                        isItemActive ? 'text-[#1877F2] dark:text-[#60A5FA]' : 'text-[#65676B] dark:text-gray-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main 3-Tab Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#242526]/95 backdrop-blur-lg border-t border-[#CED0D4] dark:border-white/10 pb-safe shadow-lg transition-colors">
        <nav className="flex items-center justify-around px-3 py-2 max-w-md mx-auto">
          {/* Tab 1: Partidos (Calendario) */}
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`mobile-tab-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all relative cursor-pointer ${
                  isActive
                    ? tab.id === 'live_match'
                      ? 'text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40'
                      : 'text-[#1877F2] dark:text-[#60A5FA] font-bold bg-[#E7F3FF] dark:bg-[#1877F2]/20'
                    : tab.isLive
                    ? 'text-rose-600 font-semibold'
                    : 'text-[#65676B] dark:text-gray-400 hover:text-[#050505] dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'
                    } ${tab.isLive ? 'text-rose-600' : ''}`}
                  />
                  {tab.isLive && (
                    <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] tracking-tight mt-1 font-bold truncate">
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* Tab 3: Más / Menú */}
          <button
            id="mobile-tab-more"
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all relative cursor-pointer ${
              isSecondaryActive || isMoreMenuOpen
                ? 'text-[#1877F2] dark:text-[#60A5FA] font-bold bg-[#E7F3FF] dark:bg-[#1877F2]/20'
                : 'text-[#65676B] dark:text-gray-400 hover:text-[#050505] dark:hover:text-white'
            }`}
          >
            <div className="relative">
              {activeSecondaryItem ? (
                <activeSecondaryItem.icon className="w-5 h-5 scale-110 stroke-[2.5]" />
              ) : (
                <MoreHorizontal className="w-5 h-5 stroke-2" />
              )}
              {/* Notification dot indicator when secondary tab is active */}
              {isSecondaryActive && (
                <span className="absolute -top-1 -right-1.5 flex h-2 w-2 rounded-full bg-[#1877F2]" />
              )}
            </div>
            <span className="text-[11px] tracking-tight mt-1 font-bold truncate max-w-[80px]">
              {activeSecondaryItem ? activeSecondaryItem.label : language === 'en' ? 'More' : 'Más'}
            </span>
          </button>
        </nav>
      </div>
    </>
  );
};
