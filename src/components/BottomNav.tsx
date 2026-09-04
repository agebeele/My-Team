import React from 'react';
import {
  CalendarDays,
  Users,
  Shield,
  Trophy,
  Sparkles,
  MessageSquare,
  Settings,
} from 'lucide-react';
import { AppUser, Language, UserRole } from '../types';
import { getT } from '../utils/translations';

interface BottomNavProps {
  currentTab?: string;
  activeTab?: string;
  setCurrentTab?: (tab: string) => void;
  setActiveTab?: (tab: string) => void;
  language: Language;
  userRole?: UserRole;
  currentUser?: AppUser;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  activeTab,
  setCurrentTab,
  setActiveTab,
  language,
  userRole,
  currentUser,
}) => {
  const t = getT(language);
  const selectedTab = currentTab || activeTab || 'calendar';
  const handleTabChange = (tabId: string) => {
    if (setCurrentTab) setCurrentTab(tabId);
    if (setActiveTab) setActiveTab(tabId);
  };
  const role = userRole || currentUser?.role || 'player';

  const tabs = [
    { id: 'calendar', label: t.nav.calendar, icon: CalendarDays },
    { id: 'convocatoria', label: t.nav.convocatoria, icon: Users },
    { id: 'lineup', label: t.nav.lineup, icon: Shield },
    { id: 'tables', label: t.nav.tables, icon: Trophy },
    { id: 'mvp', label: t.nav.mvp, icon: Sparkles, highlight: true },
    { id: 'wall', label: t.nav.wall, icon: MessageSquare },
  ];

  if (role === 'owner' || role === 'admin') {
    tabs.push({ id: 'admin', label: t.nav.admin, icon: Settings });
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141416]/95 backdrop-blur-lg border-t border-white/5 pb-safe">
      <nav className="flex items-center justify-around px-1 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-all ${
                isActive
                  ? tab.highlight
                    ? 'text-amber-400 font-bold'
                    : 'text-emerald-400 font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'
                  }`}
                />
                {tab.highlight && !isActive && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 truncate max-w-[54px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
