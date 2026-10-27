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
  INITIAL_TEAMS,
} from './data/initialData';
import {
  loadInitialData,
  saveToStorage,
  saveDeviceSession,
  clearDeviceSession,
  getPlayersForTeam,
  getMatchesForTeam,
  getStandingsForLeague,
  savePlayersForTeam,
  saveMatchesForTeam,
  saveStandingsForLeague,
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
import { AuthModal } from './components/AuthModal';
import { LoginScreen } from './components/LoginScreen';
import { AppSplashAnimation } from './components/AppSplashAnimation';
import { WelcomeModal } from './components/WelcomeModal';
import { SupabaseConnectModal } from './components/SupabaseConnectModal';
import { isSupabaseConfigured } from './utils/supabaseClient';
import {
  supabaseFetchPlayers,
  supabaseFetchMatches,
  supabaseFetchPosts,
  supabaseFetchUsers,
  supabaseUpsertPlayer,
  supabaseUpsertMatch,
  supabaseUpsertPost,
  supabaseUpsertUser,
  subscribeToSupabaseTable,
} from './utils/supabaseService';
import { fetchBackendSync, pushBackendSync } from './utils/backendSync';
import { TeamInvitation } from './types';

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
  const [allTeams, setAllTeams] = useState<TeamInfo[]>(initial.allTeams || INITIAL_TEAMS);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [welcomeInvitation, setWelcomeInvitation] = useState<TeamInvitation | null>(null);

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
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseVersion, setSupabaseVersion] = useState(0);

  // Real-time synchronization with Supabase when configured
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isMounted = true;

    const syncFromSupabase = async () => {
      try {
        const [cloudPlayers, cloudMatches, cloudPosts, cloudUsers] = await Promise.all([
          supabaseFetchPlayers(team.id),
          supabaseFetchMatches(team.id),
          supabaseFetchPosts(team.id),
          supabaseFetchUsers(),
        ]);

        if (!isMounted) return;

        if (cloudPlayers && cloudPlayers.length > 0) {
          setPlayers(cloudPlayers);
        }
        if (cloudMatches && cloudMatches.length > 0) {
          setMatches(cloudMatches);
        }
        if (cloudPosts && cloudPosts.length > 0) {
          setPosts(cloudPosts);
        }
        if (cloudUsers && cloudUsers.length > 0) {
          setUsers(cloudUsers);
        }
      } catch (err) {
        console.warn('Error syncing from Supabase:', err);
      }
    };

    syncFromSupabase();

    // Subscribe to real-time events across tables
    const unsubPosts = subscribeToSupabaseTable('posts', () => {
      supabaseFetchPosts(team.id).then((fresh) => {
        if (isMounted && fresh) setPosts(fresh);
      });
    });

    const unsubPlayers = subscribeToSupabaseTable('players', () => {
      supabaseFetchPlayers(team.id).then((fresh) => {
        if (isMounted && fresh && fresh.length > 0) setPlayers(fresh);
      });
    });

    const unsubMatches = subscribeToSupabaseTable('matches', () => {
      supabaseFetchMatches(team.id).then((fresh) => {
        if (isMounted && fresh) setMatches(fresh);
      });
    });

    const unsubUsers = subscribeToSupabaseTable('app_users', () => {
      supabaseFetchUsers().then((fresh) => {
        if (isMounted && fresh && fresh.length > 0) setUsers(fresh);
      });
    });

    return () => {
      isMounted = false;
      unsubPosts();
      unsubPlayers();
      unsubMatches();
      unsubUsers();
    };
  }, [team.id, supabaseVersion]);

  // Wrapper mutators that sync changes to SQLite backend and Supabase in real-time
  const handleSetPosts: React.Dispatch<React.SetStateAction<Post[]>> = (action) => {
    setPosts((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      pushBackendSync({ posts: next });
      if (isSupabaseConfigured()) {
        next.forEach((p) => {
          supabaseUpsertPost(p);
        });
      }
      return next;
    });
  };

  const handleSetPlayers: React.Dispatch<React.SetStateAction<Player[]>> = (action) => {
    setPlayers((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      pushBackendSync({ players: next });
      if (isSupabaseConfigured()) {
        next.forEach((pl) => {
          supabaseUpsertPlayer(team.id, pl);
        });
      }
      return next;
    });
  };

  const handleSetMatches: React.Dispatch<React.SetStateAction<Match[]>> = (action) => {
    setMatches((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      pushBackendSync({ matches: next });
      if (isSupabaseConfigured()) {
        next.forEach((m) => {
          supabaseUpsertMatch(team.id, m);
        });
      }
      return next;
    });
  };

  const handleSetUsers: React.Dispatch<React.SetStateAction<AppUser[]>> = (action) => {
    setUsers((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      pushBackendSync({ users: next });
      if (isSupabaseConfigured()) {
        next.forEach((u) => {
          supabaseUpsertUser(u);
        });
      }
      return next;
    });
  };

  // Continuous real-time SQLite sync across all connected phones and laptops
  useEffect(() => {
    let isMounted = true;

    const doSync = async () => {
      const data = await fetchBackendSync();
      if (!isMounted || !data) return;

      if (data.team) {
        setTeam((prev) => (prev.id === data.team?.id ? { ...prev, ...data.team } : data.team || prev));
      }
      if (data.allTeams && data.allTeams.length > 0) {
        setAllTeams(data.allTeams);
      }
      if (data.players && data.players.length > 0) {
        setPlayers(data.players);
      }
      if (data.matches) {
        setMatches(data.matches);
      }
      if (data.posts && data.posts.length > 0) {
        setPosts(data.posts);
      }
      if (data.users && data.users.length > 0) {
        setUsers(data.users);
      }
      if (data.standings && data.standings.length > 0) {
        setStandings(data.standings);
      }
    };

    doSync();
    // Poll every 3 seconds to keep all devices in sync without page reloads
    const timer = setInterval(doSync, 3000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // Clean light theme
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

  // Handler to switch active team cleanly with distinct data segregation
  const handleSwitchTeam = (newTeam: TeamInfo) => {
    if (!newTeam) return;

    // 1. Save data for current team before leaving
    if (team?.id) {
      savePlayersForTeam(team.id, players);
      saveMatchesForTeam(team.id, matches);
      saveStandingsForLeague(team.leagueName, standings);
    }

    // 2. Load target team's data
    const targetPlayers = getPlayersForTeam(newTeam.id);
    const targetMatches = getMatchesForTeam(newTeam.id);
    const targetStandings = getStandingsForLeague(newTeam.leagueName, newTeam);

    setTeam(newTeam);
    setPlayers(targetPlayers);
    setMatches(targetMatches);
    setStandings(targetStandings);

    try {
      localStorage.setItem('teamgol_team_data', JSON.stringify(newTeam));
    } catch {
      // ignore
    }
  };

  // Auto-save changes to storage
  useEffect(() => {
    saveToStorage({
      team,
      allTeams,
      players,
      matches,
      posts,
      standings,
      users,
      currentUser,
      language,
    });
  }, [team, allTeams, players, matches, posts, standings, users, currentUser, language]);

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
          allTeams={allTeams}
          setAllTeams={setAllTeams}
          allUsers={users}
          setUsers={handleSetUsers}
          players={players}
          setPlayers={handleSetPlayers}
          setMatches={handleSetMatches}
          setStandings={setStandings}
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
            setAllTeams((prev) => [newTeam, ...prev.filter((t) => t.id !== newTeam.id)]);
            setActiveTab('owner_admin');
          }}
          onInvitationSent={(invitation) => {
            setWelcomeInvitation(invitation);
            setIsWelcomeModalOpen(true);
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
        allTeams={allTeams}
        onSwitchTeam={handleSwitchTeam}
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
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
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
            setMatches={handleSetMatches}
            team={team}
            players={players}
            currentUser={currentUser}
            language={language}
            onOpenMvp={handleOpenMvpForMatch}
            onStartLiveMatch={handleStartLiveMatch}
          />
        )}

        {/* TAB 1.5: Live Match Mode */}
        {activeTab === 'live_match' && (
          <LiveMatchMode
            matches={matches}
            setMatches={handleSetMatches}
            players={players}
            setPlayers={handleSetPlayers}
            team={team}
            currentUser={currentUser}
            language={language}
            selectedMatchId={selectedMatchId}
            onBackToCalendar={() => setActiveTab('calendar')}
            onOpenMvp={(matchId) => {
              setSelectedMatchId(matchId);
              setActiveTab('mvp');
            }}
          />
        )}

        {/* TAB 2: Convocatoria Squad Graphic Generator & Roster */}
        {activeTab === 'convocatoria' && (
          <ConvocatoriaGraphic
            team={team}
            setTeam={setTeam}
            players={players}
            setPlayers={handleSetPlayers}
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
            setMatches={handleSetMatches}
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
            setMatches={handleSetMatches}
            players={players}
            setPlayers={handleSetPlayers}
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
            setStandings={setStandings}
            players={players}
            team={team}
            setTeam={setTeam}
            currentUser={currentUser}
            language={language}
            onViewPlayerProfile={handleViewPlayerProfile}
          />
        )}

        {/* TAB 6: Social Wall & Club Announcements */}
        {activeTab === 'wall' && (
          <SocialWall
            posts={posts}
            setPosts={handleSetPosts}
            team={team}
            currentUser={currentUser}
            language={language}
          />
        )}

        {/* TAB 7: Player Profile & MVP Trophy Cabinet */}
        {activeTab === 'profile' && currentPlayer && (
          <PlayerProfileView
            player={currentPlayer}
            setPlayers={handleSetPlayers}
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
            setUsers={handleSetUsers}
            players={players}
            setPlayers={handleSetPlayers}
            matches={matches}
            standings={standings}
            setStandings={setStandings}
            currentUser={currentUser}
            setCurrentUser={(u) => {
              setCurrentUser(u);
              saveDeviceSession(u);
            }}
            language={language}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Dock Bar */}
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
        setUsers={handleSetUsers}
        players={players}
        setPlayers={handleSetPlayers}
        team={team}
        language={language}
        invitedTeamName={invitedTeamName}
        onJoinSuccess={(playerName) => {
          setJoinSuccessAlert(`¡Bienvenido al equipo, ${playerName}! Ya formas parte de ${team.name} y puedes ver todas las convocatorias y alineaciones.`);
          setTimeout(() => setJoinSuccessAlert(null), 7000);
        }}
      />

      {/* Official Welcome Celebration Modal when invitation is accepted */}
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        team={team}
        invitation={welcomeInvitation}
        onNavigate={(tab) => setActiveTab(tab)}
      />

      {/* Supabase Cloud Connection & Sync Modal */}
      <SupabaseConnectModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConnected={() => setSupabaseVersion((v) => v + 1)}
      />
    </div>
  );
}
