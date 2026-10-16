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
  Smartphone,
  Download,
} from 'lucide-react';
import { AppUser, Language, UserRole } from '../types';
import { getT } from '../utils/translations';

interface BottomNavProps {
  currentTab?: string;
  activeTab?: string;
  setCurrentTab?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  hasLiveMatch?: boolean;
  userRole?: UserRole;
  currentUser?: AppUser;
  onOpenAndroidUsb?: () => void;
  onOpenInstallModal?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  language?: Language;
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
  onOpenAndroidUsb,
  onOpenInstallModal,
  theme,
  onToggleTheme,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const t = getT(language);
  const selectedTab = currentTab || activeTab || 'calendar';

  const handleTabChange = (tabId: string) => {
    if (tabId === 'android_usb') {
      if (onOpenAndroidUsb) onOpenAndroidUsb();
      if (setCurrentTab) setCurrentTab(tabId);
      if (setActiveTab) setActiveTab(tabId);
      setIsMoreMenuOpen(false);
      return;
    }
    if (setCurrentTab) setCurrentTab(tabId);
    if (setActiveTab) setActiveTab(tabId);
    setIsMoreMenuOpen(false);
  };

  const role = userRole || currentUser?.role || 'player';
  const isOwner = role === 'owner';

  // Primary tabs visible in dock
  const primaryTabs = [
    { id: 'calendar', label: t.nav.calendar, icon: CalendarDays, isLive: false, isUsb: false },
    { id: 'lineup', label: t.nav.lineup, icon: Shield, isLive: false, isUsb: false },
    {
      id: 'android_usb',
      label: 'Android USB',
      icon: Smartphone,
      isLive: false,
      isUsb: true,
    },
    {
      id: 'live_match',
      label: hasLiveMatch ? 'En Vivo' : t.nav.liveMatch || 'Modo Partido',
      icon: Zap,
      isLive: hasLiveMatch,
      isUsb: false,
    },
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

            {/* Featured Fast Install Button on Phone */}
            {onOpenInstallModal && (
              <button
                id="sheet-banner-install-app"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenInstallModal();
                }}
                className="w-full mb-2 p-3.5 rounded-2xl bg-gradient-to-r from-[#1877F2] to-[#0866FF] text-white flex items-center justify-between text-left shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs text-white shrink-0">
                    <Download className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black tracking-tight">
                        Instalar en el Teléfono
                      </span>
                      <span className="text-[10px] bg-white text-[#1877F2] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                        1-Clic
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-100 mt-0.5">
                      PWA / WebAPK Nativa y código QR instantáneo
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/80 shrink-0" />
              </button>
            )}

            {/* Featured Banner: Android USB & App Móvil */}
            {onOpenAndroidUsb && (
              <button
                id="sheet-banner-android-usb"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenAndroidUsb();
                }}
                className="w-full mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between text-left shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs text-white shrink-0">
                    <Smartphone className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black tracking-tight">
                        Panel Android USB
                      </span>
                      <span className="text-[10px] bg-amber-400 text-black px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                        1-Clic ADB
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-100 mt-0.5">
                      Guía paso a paso, ./gradlew installDebug y túnel USB
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/80 shrink-0" />
              </button>
            )}

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

              {/* Mobile Quick Toggles: Android USB & Dark Mode */}
              <div className="pt-2 border-t border-[#CED0D4] dark:border-white/10 grid grid-cols-2 gap-2">
                {onOpenAndroidUsb && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenAndroidUsb();
                    }}
                    className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-600/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 font-bold text-xs cursor-pointer shadow-xs"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-500 text-white">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span>Android USB</span>
                  </button>
                )}

                {onToggleTheme && (
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="p-3 rounded-2xl bg-[#F0F2F5] dark:bg-white/5 border border-[#CED0D4] dark:border-white/10 text-[#050505] dark:text-white flex items-center gap-2.5 font-bold text-xs cursor-pointer shadow-xs"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-400 text-black">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span>{theme === 'dark' ? 'Tema Claro' : 'Tema Oscuro'}</span>
                  </button>
                )}
              </div>
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
                className={`flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all relative cursor-pointer ${
                  isActive
                    ? tab.id === 'live_match'
                      ? 'text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40'
                      : tab.isUsb
                      ? 'text-emerald-700 dark:text-emerald-300 font-black bg-emerald-100 dark:bg-emerald-950/50'
                      : 'text-[#1877F2] dark:text-[#60A5FA] font-bold bg-[#E7F3FF] dark:bg-[#1877F2]/20'
                    : tab.isUsb
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                    : tab.isLive
                    ? 'text-rose-600 font-semibold'
                    : 'text-[#65676B] dark:text-gray-400 hover:text-[#050505] dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'
                    } ${tab.isLive ? 'text-rose-600' : ''} ${tab.isUsb ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
                  />
                  {tab.isLive && (
                    <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
                    </span>
                  )}
                  {tab.isUsb && !tab.isLive && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] tracking-tight mt-1 font-bold truncate">
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
