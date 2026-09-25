import React, { useState, useEffect } from 'react';
import {
  Match,
  TeamInfo,
  Player,
  Post,
  StandingsRow,
  AppUser,
  Language,
} from './types';
import {
  INITIAL_TEAM,
  INITIAL_PLAYERS,
  INITIAL_MATCHES,
  INITIAL_POSTS,
  INITIAL_STANDINGS,
  INITIAL_USERS,
} from './data/initialData';
import { loadInitialData, saveToStorage, saveDeviceSession, clearDeviceSession } from './utils/storage';
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

  // App Navigation & Language state
  const [activeTab, setActiveTab] = useState<string>('calendar');
  const [language, setLanguage] = useState<Language>('es');
  // If the device session was saved previously, load it; otherwise null so it goes directly to Login
  const [currentUser, setCurrentUser] = useState<AppUser | null>(initial.currentUser || null);

  // Selected sub-elements
  const [selectedMatchId, setSelectedMatchId] = useState<string | undefined>(undefined);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(
    initial.currentUser?.playerId || initial.players?.[0]?.id || 'p1'
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
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

  // Ensure clean light theme by removing any stored dark mode class
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('app_theme');
  }, []);

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
    });
  }, [team, players, matches, posts, standings, users]);

  // Update selected player when switching user if user has linked playerId
  useEffect(() => {
    if (currentUser?.playerId) {
      setSelectedPlayerId(currentUser.playerId);
    }
  }, [currentUser]);

  const currentPlayer = players.find((p) => p.id === selectedPlayerId) || players[0];

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

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#050505] flex flex-col selection:bg-[#1877F2] selection:text-white">
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
        onOpenAuth={() => setIsAuthModalOpen(true)}
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10">
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
          />
        )}

        {/* TAB 5: Standings & Golden Boot Scorers */}
        {(activeTab === 'standings' || activeTab === 'tables') && (
          <StandingsAndScorers
            standings={standings}
            players={players}
            team={team}
            currentUser={currentUser}
            language={language}
            onViewPlayerProfile={handleViewPlayerProfile}
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
            currentUser={currentUser}
            language={language}
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
          setJoinSuccessAlert(`¡Bienvenido al equipo, ${playerName}! Ya formas parte de ${team.name} y puedes ver todas las convocatorias y alineaciones.`);
          setTimeout(() => setJoinSuccessAlert(null), 7000);
        }}
      />
    </div>
  );
}
