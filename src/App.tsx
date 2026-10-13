import React, { useState, useEffect } from 'react';
import {
  Match,
  TeamInfo,
  Player,
  Post,
  StandingsRow,
  AppUser,
  AppNotification,
  StoryType,
  Language,
} from './types';
import {
  INITIAL_TEAM,
  INITIAL_PLAYERS,
  INITIAL_MATCHES,
  INITIAL_POSTS,
  INITIAL_STANDINGS,
  INITIAL_USERS,
  INITIAL_NOTIFICATIONS,
} from './data/initialData';
import {
  loadInitialData,
  saveToStorage,
  saveDeviceSession,
  clearDeviceSession,
} from './utils/storage';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { MatchCalendar } from './components/MatchCalendar';
import { ConvocatoriaGraphic } from './components/ConvocatoriaGraphic';
import { TacticalPitch } from './components/TacticalPitch';
import { MVPVotingAndCamera } from './components/MVPVotingAndCamera';
import { StandingsAndScorers } from './components/StandingsAndScorers';
import { SocialWall } from './components/SocialWall';
import { PlayerProfileView } from './components/PlayerProfileView';
import { OwnerAdminPanel } from './components/OwnerAdminPanel';
import { LiveMatchMode } from './components/LiveMatchMode';
import { IoTTelemetryHub } from './components/IoTTelemetryHub';
import { AuthModal } from './components/AuthModal';
import { LoginScreen } from './components/LoginScreen';
import { AppSplashAnimation } from './components/AppSplashAnimation';
import { StoryShareModal } from './components/StoryShareModal';
import { NotificationsModal } from './components/NotificationsModal';
import { UserProfileModal } from './components/UserProfileModal';
import {
  Smartphone,
  Apple,
  Wifi,
  Battery,
  Signal,
  Maximize2,
  Sparkles,
  Download,
  Check,
  Sun,
  Moon,
} from 'lucide-react';

export default function App() {
  // Persistence state
  const initial = loadInitialData();

  const [showSplash, setShowSplash] = useState(true);
  const [team, setTeam] = useState<TeamInfo>(initial.team || INITIAL_TEAM);
  const [players, setPlayers] = useState<Player[]>(initial.players || INITIAL_PLAYERS);
  const [matches, setMatches] = useState<Match[]>(initial.matches || INITIAL_MATCHES);
  const [posts, setPosts] = useState<Post[]>(initial.posts || INITIAL_POSTS);
  const [standings, setStandings] = useState<StandingsRow[]>(initial.standings || INITIAL_STANDINGS);
  const [users, setUsers] = useState<AppUser[]>(initial.users || INITIAL_USERS);
  const [notifications, setNotifications] = useState<AppNotification[]>(
    initial.notifications || INITIAL_NOTIFICATIONS
  );

  // App Navigation & Language state
  const [activeTab, setActiveTab] = useState<string>('calendar');
  const [language, setLanguage] = useState<Language>('es');
  // Device session user
  const [currentUser, setCurrentUser] = useState<AppUser | null>(initial.currentUser || null);

  // Selected sub-elements
  const [selectedMatchId, setSelectedMatchId] = useState<string | undefined>(undefined);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    initial.currentUser?.playerId || initial.players?.[0]?.id || 'p1'
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Story sharing modal state
  const [isStoryShareModalOpen, setIsStoryShareModalOpen] = useState(false);
  const [storyShareInitialType, setStoryShareInitialType] = useState<StoryType>('standings');

  // Notifications modal state
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  // User profile modal state
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);

  // Device Frame Mode for authentic iOS / Android app experience
  const [deviceMode, setDeviceMode] = useState<'mobile_ios' | 'mobile_android' | 'responsive'>(
    'mobile_ios'
  );
  const [showInstallPwaGuide, setShowInstallPwaGuide] = useState(false);

  const [invitedTeam, setInvitedTeam] = useState<{ id?: string; name: string; logoUrl?: string } | null>(() => {
    try {
      const stored = localStorage.getItem('teamgol_invited_team');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });
  const [invitedTeamName, setInvitedTeamName] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('teamgol_invited_team');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.name || null;
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [joinSuccessAlert, setJoinSuccessAlert] = useState<string | null>(null);

  // Global Dark Mode Theme state and synchronization
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem('app_theme');
      if (stored === 'dark' || stored === 'light') return stored;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // fallback
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('app_theme', 'dark');
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('app_theme', 'light');
      } catch {}
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Detect invite link in URL: ?joinTeam=...&teamName=...&teamLogo=...
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const joinTeamId = params.get('joinTeam');
      const teamNameParam = params.get('teamName');
      const teamLogoParam = params.get('teamLogo');

      if (joinTeamId || teamNameParam) {
        const targetTeamName = teamNameParam ? decodeURIComponent(teamNameParam) : team.name;
        const targetTeamLogo = teamLogoParam
          ? decodeURIComponent(teamLogoParam)
          : team.id === joinTeamId
          ? team.logoUrl
          : '';
        const inviteObj = {
          id: joinTeamId || undefined,
          name: targetTeamName,
          logoUrl: targetTeamLogo || undefined,
        };
        setInvitedTeam(inviteObj);
        setInvitedTeamName(targetTeamName);
        try {
          localStorage.setItem('teamgol_invited_team', JSON.stringify(inviteObj));
        } catch {
          // ignore
        }
        setIsAuthModalOpen(true);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [team.name, team.id, team.logoUrl]);

  // Auto-save changes to storage
  useEffect(() => {
    saveToStorage({
      team,
      players,
      matches,
      posts,
      standings,
      users,
      notifications,
    });
  }, [team, players, matches, posts, standings, users, notifications]);

  // Update selected player when switching user if user has linked playerId
  useEffect(() => {
    if (currentUser?.playerId) {
      setSelectedPlayerId(currentUser.playerId);
    }
  }, [currentUser]);

  const currentPlayer = players.find((p) => p.id === selectedPlayerId) || players[0];

  // Calculate unread notifications for active user
  const unreadNotificationsCount = currentUser
    ? notifications.filter(
        (n) =>
          !n.isRead &&
          (n.recipientUserId === currentUser.id ||
            (currentUser.username && n.recipientUsername === currentUser.username) ||
            n.recipientUserId === 'all')
      ).length
    : 0;

  const handleOpenMvpForMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setActiveTab('mvp');
  };

  const handleStartLiveMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setActiveTab('live_match');
  };

  const handleViewPlayerProfile = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setActiveTab('profile');
  };

  const handleOpenStoryShare = (type: StoryType = 'standings') => {
    setStoryShareInitialType(type);
    setIsStoryShareModalOpen(true);
  };

  // If no saved device session exists, prompt user to log in or register directly
  if (!currentUser) {
    return (
      <>
        {showSplash && (
          <AppSplashAnimation
            onComplete={() => setShowSplash(false)}
            teamName={invitedTeam?.name || team?.shortName || team?.name}
          />
        )}
        <LoginScreen
          team={team}
          setTeam={setTeam}
          allUsers={users}
          setUsers={setUsers}
          players={players}
          setPlayers={setPlayers}
          language={language}
          invitedTeam={invitedTeam}
          invitedTeamName={invitedTeamName}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onLoginSuccess={(user, rememberDevice) => {
            setCurrentUser(user);
            if (rememberDevice) {
              saveDeviceSession(user);
            }
          }}
          onTeamCreated={(newTeam) => {
            setTeam(newTeam);
            setActiveTab('owner_admin');
          }}
        />
      </>
    );
  }

  // The Main App Inner Content (rendered in mobile frame or full screen)
  const appContent = (
    <div
      data-theme={theme}
      className={`min-h-full bg-app-bg text-app-text flex flex-col selection:bg-[#1877F2] selection:text-white relative transition-colors duration-200 ${
        theme === 'dark' ? 'dark' : ''
      }`}
    >
      {/* Mobile OS Status Bar (Simulated native iOS / Android Bar) */}
      <div className="bg-black text-white px-5 pt-2 pb-1.5 flex items-center justify-between text-[11px] font-bold select-none shrink-0 z-50">
        <span className="font-mono tracking-tight font-black">09:41</span>

        {/* Dynamic Island / Camera Punch Hole */}
        {deviceMode === 'mobile_ios' ? (
          <div className="w-24 h-4 bg-black rounded-full border border-white/20 flex items-center justify-center px-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
            <span className="text-[9px] text-white/80 font-black">TeamGol</span>
          </div>
        ) : (
          <div className="w-3.5 h-3.5 rounded-full bg-black ring-1 ring-white/30" />
        )}

        <div className="flex items-center gap-1.5 text-white/90">
          <Signal className="w-3 h-3" />
          <Wifi className="w-3 h-3" />
          <span className="text-[10px] font-mono font-bold">5G</span>
          <div className="flex items-center">
            <span className="text-[9px] mr-0.5">98%</span>
            <Battery className="w-3.5 h-3.5 fill-white text-white" />
          </div>
        </div>
      </div>

      {showSplash && (
        <AppSplashAnimation
          onComplete={() => setShowSplash(false)}
          teamName={team?.shortName || team?.name}
        />
      )}

      {/* Top Main Navigation Bar */}
      <Navbar
        team={team}
        currentUser={currentUser}
        setCurrentUser={(u) => {
          setCurrentUser(u);
          saveDeviceSession(u);
        }}
        onLogout={() => {
          clearDeviceSession();
          setCurrentUser(null);
        }}
        allUsers={users}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasLiveMatch={matches.some((m) => m.status === 'live')}
        language={language}
        setLanguage={setLanguage}
        unreadAlertsCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onOpenStoryShare={() => handleOpenStoryShare('standings')}
        onOpenProfileModal={() => setIsUserProfileModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Welcome Join Alert Banner if joined via invite */}
      {joinSuccessAlert && (
        <div className="bg-emerald-500 text-white px-4 py-2.5 text-center text-xs font-bold shadow-md animate-in slide-in-from-top duration-200 flex items-center justify-center gap-2">
          <span>⚽ {joinSuccessAlert}</span>
          <button
            onClick={() => setJoinSuccessAlert(null)}
            className="text-white/80 hover:text-white underline text-[11px] ml-2 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 md:pb-12">
        {/* TAB 1: Match Calendar & PDF Match Reports */}
        {activeTab === 'calendar' && (
          <MatchCalendar
            matches={matches}
            setMatches={setMatches}
            team={team}
            players={players}
            currentUser={currentUser}
            language={language}
            onOpenMvp={handleOpenMvpForMatch}
            onStartLiveMatch={handleStartLiveMatch}
            onNavigateToConvocatoria={(matchId) => {
              setSelectedMatchId(matchId);
              setActiveTab('convocatoria');
            }}
            onNavigateToLineup={(matchId) => {
              setSelectedMatchId(matchId);
              setActiveTab('lineup');
            }}
          />
        )}

        {/* TAB 1.5: Live Match Mode (Modo Partido) */}
        {(activeTab === 'live_match' || activeTab === 'match_mode') && (
          <LiveMatchMode
            team={team}
            matches={matches}
            setMatches={setMatches}
            players={players}
            setPlayers={setPlayers}
            currentUser={currentUser}
            language={language}
            selectedMatchId={selectedMatchId}
            onOpenMvp={handleOpenMvpForMatch}
            onNavigateToLineup={(matchId) => {
              setSelectedMatchId(matchId);
              setActiveTab('lineup');
            }}
            onBackToCalendar={() => setActiveTab('calendar')}
          />
        )}

        {/* TAB 2: Convocatoria Squad Graphic Generator & Roster */}
        {activeTab === 'convocatoria' && (
          <ConvocatoriaGraphic
            team={team}
            setTeam={setTeam}
            players={players}
            setPlayers={setPlayers}
            matches={matches}
            currentUser={currentUser}
            language={language}
            selectedMatchId={selectedMatchId}
          />
        )}

        {/* TAB 3: Interactive Tactical Pitch Lineup */}
        {activeTab === 'lineup' && (
          <TacticalPitch
            team={team}
            setTeam={setTeam}
            players={players}
            matches={matches}
            setMatches={setMatches}
            currentUser={currentUser}
            language={language}
            selectedMatchId={selectedMatchId}
          />
        )}

        {/* TAB 4: MVP Voting (50min rule) & Automatic Camera */}
        {activeTab === 'mvp' && (
          <MVPVotingAndCamera
            team={team}
            matches={matches}
            setMatches={setMatches}
            players={players}
            setPlayers={setPlayers}
            currentUser={currentUser}
            language={language}
            selectedMatchId={selectedMatchId}
            onViewPlayerProfile={handleViewPlayerProfile}
            onOpenStoryShare={handleOpenStoryShare}
          />
        )}

        {/* TAB 5: Standings & Golden Boot Scorers */}
        {(activeTab === 'standings' || activeTab === 'tables') && (
          <StandingsAndScorers
            standings={standings}
            setStandings={setStandings}
            players={players}
            team={team}
            setTeam={setTeam}
            currentUser={currentUser}
            language={language}
            onViewPlayerProfile={handleViewPlayerProfile}
            onOpenStoryShare={handleOpenStoryShare}
          />
        )}

        {/* TAB 6: Social Wall & Club Announcements */}
        {activeTab === 'wall' && (
          <SocialWall
            posts={posts}
            setPosts={setPosts}
            currentUser={currentUser}
            language={language}
          />
        )}

        {/* TAB 7: Player Profile & MVP Trophy Cabinet */}
        {activeTab === 'profile' && currentPlayer && (
          <PlayerProfileView
            player={currentPlayer}
            setPlayers={setPlayers}
            team={team}
            currentUser={currentUser}
            language={language}
            onOpenStoryShare={handleOpenStoryShare}
          />
        )}

        {/* TAB 8: Team Owner & Admin Panel */}
        {(activeTab === 'admin' || activeTab === 'owner_admin') && (
          <OwnerAdminPanel
            team={team}
            setTeam={setTeam}
            users={users}
            setUsers={setUsers}
            players={players}
            setPlayers={setPlayers}
            matches={matches}
            standings={standings}
            setStandings={setStandings}
            currentUser={currentUser}
            setCurrentUser={(u) => {
              setCurrentUser(u);
              saveDeviceSession(u);
            }}
            language={language}
            notifications={notifications}
            setNotifications={setNotifications}
            onOpenStoryShare={handleOpenStoryShare}
          />
        )}

        {/* TAB 9: Brazalete Deportivo Inteligente (ESP32 IoT Hub) */}
        {activeTab === 'iot' && (
          <IoTTelemetryHub
            team={team}
            players={players}
            currentUser={currentUser}
            onViewPlayerProfile={handleViewPlayerProfile}
          />
        )}
      </main>

      {/* Mobile Bottom Dock Bar (iOS & Android friendly) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasLiveMatch={matches.some((m) => m.status === 'live')}
        currentUser={currentUser}
        language={language}
        unreadAlertsCount={unreadNotificationsCount}
        onOpenStoryShare={() => handleOpenStoryShare('standings')}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
        onOpenProfileModal={() => setIsUserProfileModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Mobile Home Indicator Swipe Bar */}
      <div className="py-1 bg-white/95 dark:bg-[#242526]/95 border-t border-gray-100 dark:border-white/5 select-none shrink-0">
        <div className="w-32 h-1 bg-black/30 dark:bg-white/30 rounded-full mx-auto" />
      </div>

      {/* 9:16 Social Stories Share Modal */}
      <StoryShareModal
        isOpen={isStoryShareModalOpen}
        onClose={() => setIsStoryShareModalOpen(false)}
        currentUser={currentUser}
        player={currentPlayer}
        team={team}
        standings={standings}
        matches={matches}
        players={players}
        initialType={storyShareInitialType}
      />

      {/* In-App Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={notifications}
        setNotifications={setNotifications}
        currentUser={currentUser}
        setCurrentUser={(u) => {
          setCurrentUser(u);
          saveDeviceSession(u);
        }}
        team={team}
        players={players}
        setPlayers={setPlayers}
        onOpenStoryShare={handleOpenStoryShare}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
        currentUser={currentUser}
        setCurrentUser={(u) => {
          setCurrentUser(u);
          saveDeviceSession(u);
        }}
        allUsers={users}
        setUsers={setUsers}
        team={team}
        player={currentPlayer}
        onOpenStoryShare={handleOpenStoryShare}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Auth & Join Team Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setInvitedTeamName(null);
        }}
        currentUser={currentUser}
        setCurrentUser={(u) => {
          setCurrentUser(u);
          if (u) {
            saveDeviceSession(u);
          } else {
            clearDeviceSession();
          }
        }}
        allUsers={users}
        setUsers={setUsers}
        players={players}
        setPlayers={setPlayers}
        team={team}
        language={language}
        invitedTeamName={invitedTeamName}
        onJoinSuccess={(playerName) => {
          setJoinSuccessAlert(
            `¡Bienvenido al equipo, ${playerName}! Ya formas parte de ${team.name} y puedes ver todas las convocatorias y alineaciones.`
          );
          setTimeout(() => setJoinSuccessAlert(null), 7000);
        }}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0C0F17] flex flex-col items-center justify-start antialiased font-sans selection:bg-[#1877F2] selection:text-white">
      {/* Top Mobile Viewport Controls (Desktop & Tablet Bar) */}
      <header className="w-full bg-[#141824] border-b border-white/10 px-4 py-2.5 z-50 flex items-center justify-between text-xs text-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 flex items-center justify-center font-black text-white text-[10px]">
            TG
          </div>
          <span className="font-black text-sm tracking-tight text-white hidden sm:inline">
            TeamGol App
          </span>
          <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
            iOS & Android Ready
          </span>
        </div>

        {/* Viewport Format Switcher */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setDeviceMode('mobile_ios')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              deviceMode === 'mobile_ios'
                ? 'bg-white text-black shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iPhone 15</span>
          </button>

          <button
            onClick={() => setDeviceMode('mobile_android')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              deviceMode === 'mobile_android'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>

          <button
            onClick={() => setDeviceMode('responsive')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              deviceMode === 'responsive'
                ? 'bg-[#1877F2] text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pantalla Completa</span>
          </button>
        </div>

        {/* Global Dark Theme Toggle & PWA Install Action */}
        <div className="flex items-center gap-2">
          {/* Global Dark Mode Switcher */}
          <button
            id="btn-desktop-theme-toggle"
            onClick={handleToggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold text-xs shadow-xs transition-all cursor-pointer transform hover:scale-105"
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-300" />
                <span>Modo Oscuro</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowInstallPwaGuide(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-xs shadow-md hover:scale-105 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Instalar App</span>
          </button>
        </div>
      </header>

      {/* PWA Install Modal Guide */}
      {showInstallPwaGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1E1F20] text-[#050505] dark:text-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Instalar App en Android & iOS</h3>
                  <p className="text-xs text-gray-500">Acceso directo como app nativa sin tiendas</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallPwaGuide(false)}
                className="text-gray-400 hover:text-black dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 font-black text-rose-600">
                  <Apple className="w-4 h-4" />
                  <span>En iPhone / iPad (Safari):</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  1. Abre esta web en el navegador <strong>Safari</strong>.<br />
                  2. Toca el botón <strong>Compartir</strong> (ícono de caja con flecha arriba).<br />
                  3. Selecciona <strong>«Agregar a la pantalla de inicio»</strong>.<br />
                  4. ¡Listo! Se abrirá como app nativa a pantalla completa.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 font-black text-emerald-600">
                  <Smartphone className="w-4 h-4" />
                  <span>En Android (Google Chrome):</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  1. Abre el menú de tres puntos (⋮) en la esquina superior derecha.<br />
                  2. Toca <strong>«Instalar aplicación»</strong> o <strong>«Agregar a la pantalla principal»</strong>.<br />
                  3. Confirma y disfruta de la app nativa con notificaciones.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallPwaGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#1877F2] text-white font-bold text-xs shadow-md cursor-pointer hover:bg-blue-600 transition-all"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}

      {/* Main Container: Mobile Frame vs Responsive Full-Screen */}
      <div className="w-full flex-1 flex items-center justify-center p-0 md:p-6 overflow-hidden">
        {deviceMode === 'responsive' ? (
          <div className="w-full min-h-screen shadow-2xl overflow-hidden bg-app-bg text-app-text transition-colors duration-200">
            {appContent}
          </div>
        ) : (
          <div
            className={`w-full max-w-[430px] h-[92vh] sm:h-[870px] bg-black shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative ${
              deviceMode === 'mobile_ios'
                ? 'rounded-[50px] border-[10px] border-[#252830] ring-1 ring-white/20'
                : 'rounded-[40px] border-[10px] border-[#181A20] ring-1 ring-white/10'
            }`}
          >
            {/* Scrollable Inside Viewport */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
              {appContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
