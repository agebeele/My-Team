import React, { useState, useEffect, useRef } from 'react';

import {
  Match,
  TeamInfo,
  Player,
  Post,
  StandingsRow,
  AppUser,
  Language,
  TeamJoinRequest,
  TeamInvitation,
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
import { LeagueExplorerAndJoin } from './components/LeagueExplorerAndJoin';
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
import { fetchBackendSync, pushBackendSync, pushBackendSyncImmediate } from './utils/backendSync';

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
  const deletedMatchIdsRef = useRef<Set<string>>(new Set());
  const [joinRequests, setJoinRequests] = useState<TeamJoinRequest[]>(() => {
    try {
      const stored = localStorage.getItem('teamgol_join_requests');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

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
      try {
        localStorage.setItem('teamgol_posts_data', JSON.stringify(next));
      } catch {}
      pushBackendSyncImmediate({ posts: next });
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
      // Detect deleted matches and send DELETE request to backend
      const nextIds = new Set(next.map((m) => m.id));
      prev.forEach((oldM) => {
        if (!nextIds.has(oldM.id)) {
          deletedMatchIdsRef.current.add(oldM.id);
          fetch(`/api/partidos/${oldM.id}`, { method: 'DELETE' }).catch(() => {});
        }
      });

      const tagged = next.map((m) => ({ ...m, teamId: m.teamId || team.id }));
      saveMatchesForTeam(team.id, tagged);
      try {
        localStorage.setItem('teamgol_matches_data', JSON.stringify(tagged));
      } catch {}
      pushBackendSyncImmediate({ matches: tagged, team });
      if (isSupabaseConfigured()) {
        tagged.forEach((m) => {
          supabaseUpsertMatch(team.id, m);
        });
      }
      return tagged;
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

  const handleSetTeam: React.Dispatch<React.SetStateAction<TeamInfo>> = (action) => {
    setTeam((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      setAllTeams((prevAll) => {
        const updated = prevAll.map((t) => (t.id === next.id ? next : t));
        if (!updated.some((t) => t.id === next.id)) {
          updated.push(next);
        }
        pushBackendSync({ team: next, allTeams: updated });
        return updated;
      });
      try {
        localStorage.setItem('teamgol_team_data', JSON.stringify(next));
      } catch {
        // ignore
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

      if (data.allTeams && data.allTeams.length > 0) {
        setAllTeams(data.allTeams);
        // Only update current team metadata (colors, name, stadium) if it still exists
        setTeam((prev) => {
          const match = data.allTeams?.find((t) => t.id === prev.id);
          return match ? { ...prev, ...match } : prev;
        });
      }

      if (data.players && data.players.length > 0) {
        // Filter players specifically for the currently active team
        const currentSquad = data.players.filter((p: any) => !p.teamId || p.teamId === team.id);
        if (currentSquad.length > 0) {
          setPlayers(currentSquad);
        }
      }

      if (data.matches) {
        const currentMatches = data.matches.filter(
          (m: any) => (!m.teamId || m.teamId === team.id) && !deletedMatchIdsRef.current.has(m.id)
        );
        setMatches((prev) => {
          const map = new Map<string, Match>();
          currentMatches.forEach((m: any) => {
            if (!deletedMatchIdsRef.current.has(m.id)) {
              map.set(m.id, m);
            }
          });
          // Preserve newly added local matches that might still be in-flight
          prev.forEach((m) => {
            if (!map.has(m.id) && !deletedMatchIdsRef.current.has(m.id)) {
              map.set(m.id, m);
            }
          });
          return Array.from(map.values());
        });
      }

      if (data.posts && data.posts.length > 0) {
        setPosts((prev) => {
          const map = new Map<string, Post>();
          data.posts.forEach((p: any) => map.set(p.id, p));
          // Preserve newly created local posts so they never flash or disappear
          prev.forEach((p) => {
            if (!map.has(p.id)) {
              map.set(p.id, p);
            }
          });
          return Array.from(map.values());
        });
      }
      if (data.users && data.users.length > 0) {
        setUsers(data.users);
        // If current user was accepted into a team, refresh their local state immediately
        if (currentUser && currentUser.role === 'player' && !currentUser.teamId) {
          const freshMe = data.users.find(
            (u: any) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()
          );
          if (freshMe && freshMe.teamId) {
            setCurrentUser(freshMe);
            saveDeviceSession(freshMe);
            const teamAssigned = data.allTeams?.find((t: any) => t.id === freshMe.teamId);
            if (teamAssigned) {
              setTeam(teamAssigned);
              setActiveTab('calendar');
            }
          }
        }
      }
      if (data.standings && data.standings.length > 0) {
        setStandings(data.standings);
      }
      if (data.joinRequests) {
        setJoinRequests(data.joinRequests);
        try {
          localStorage.setItem('teamgol_join_requests', JSON.stringify(data.joinRequests));
        } catch {}
      }
    };

    doSync();
    // Poll every 3 seconds to keep all devices in sync without page reloads
    const timer = setInterval(doSync, 3000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [team.id]);

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

  // Restrict navigation for league_admin to wall and tables
  useEffect(() => {
    if (currentUser?.role === 'league_admin') {
      const allowed = ['wall', 'tables', 'standings', 'profile'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('wall');
      }
    }
  }, [currentUser?.role, activeTab]);

  // Restrict navigation for unassigned player (without team) to leagues explorer and league wall
  useEffect(() => {
    if (currentUser?.role === 'player' && !currentUser?.teamId) {
      const allowed = ['leagues', 'wall'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('leagues');
      }
    }
  }, [currentUser?.role, currentUser?.teamId, activeTab]);

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

  const handleAcceptJoinRequest = async (req: TeamJoinRequest) => {
    // 1. Update requests
    const updatedRequests = joinRequests.map((r) =>
      r.id === req.id ? { ...r, status: 'accepted' as const, respondedAt: new Date().toISOString() } : r
    );
    setJoinRequests(updatedRequests);
    try {
      localStorage.setItem('teamgol_join_requests', JSON.stringify(updatedRequests));
    } catch {}

    // 2. Add player to the squad
    const newPlayerId = `p_${Date.now()}`;
    const newPlayer: Player = {
      id: newPlayerId,
      name: req.playerName,
      number: req.playerNumber || Math.floor(Math.random() * 80) + 10,
      position: req.playerPosition || 'MED',
      avatarUrl: req.playerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      goals: 0,
      assists: 0,
      matches: 0,
      yellowCards: 0,
      redCards: 0,
      isCalledUp: true,
      isStarter: false,
      teamId: req.teamId,
    };
    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    savePlayersForTeam(req.teamId, updatedPlayers);

    // 3. Update users list
    const updatedUsers = users.map((u) => {
      if (u.id === req.userId || u.email.toLowerCase() === req.playerEmail.toLowerCase()) {
        return {
          ...u,
          teamId: req.teamId,
          teamJoinStatus: 'accepted' as const,
          playerId: newPlayerId,
        };
      }
      return u;
    });
    setUsers(updatedUsers);

    // 4. Update SQLite backend
    try {
      await fetch(`/api/solicitudes/${req.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted', teamId: req.teamId, teamName: req.teamName }),
      });
    } catch (err) {
      console.warn('Error updating join request in backend:', err);
    }

    pushBackendSyncImmediate({
      joinRequests: updatedRequests,
      players: updatedPlayers,
      users: updatedUsers,
    });
  };

  const handleRejectJoinRequest = async (requestId: string) => {
    const updatedRequests = joinRequests.map((r) =>
      r.id === requestId ? { ...r, status: 'rejected' as const, respondedAt: new Date().toISOString() } : r
    );
    setJoinRequests(updatedRequests);
    try {
      localStorage.setItem('teamgol_join_requests', JSON.stringify(updatedRequests));
    } catch {}

    const req = joinRequests.find((r) => r.id === requestId);
    let updatedUsers = users;
    if (req) {
      updatedUsers = users.map((u) => {
        if (u.id === req.userId || u.email.toLowerCase() === req.playerEmail.toLowerCase()) {
          return {
            ...u,
            teamJoinStatus: 'rejected' as const,
          };
        }
        return u;
      });
      setUsers(updatedUsers);
    }

    try {
      await fetch(`/api/solicitudes/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });
    } catch (err) {
      console.warn('Error rejecting join request in backend:', err);
    }

    pushBackendSyncImmediate({
      joinRequests: updatedRequests,
      users: updatedUsers,
    });
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
            if (user.role === 'league_admin') {
              setActiveTab('wall');
            } else if (user.role === 'player' && !user.teamId) {
              setActiveTab('leagues');
            } else {
              const userTeamId =
                user.teamId ||
                (user.email.toLowerCase() === 'agbl141201@gmail.com' || user.username?.toLowerCase() === 'admin'
                  ? 'team_01'
                  : null);

              if (userTeamId) {
                const targetTeam =
                  allTeams.find((t) => t.id === userTeamId) ||
                  (userTeamId === 'team_01' ? INITIAL_TEAM : undefined);
                if (targetTeam) {
                  handleSwitchTeam(targetTeam);
                }
              }
            }
            if (rememberDevice) {
              saveDeviceSession(user);
            }
          }}
          onTeamCreated={(newTeam) => {
            handleSwitchTeam(newTeam);
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
        joinRequests={joinRequests}
        onAcceptJoinRequest={handleAcceptJoinRequest}
        onRejectJoinRequest={handleRejectJoinRequest}
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
        {/* Unassigned Player View: only League Explorer and League Wall until admitted */}
        {currentUser?.role === 'player' && !currentUser?.teamId ? (
          activeTab === 'wall' ? (
            <SocialWall
              posts={posts}
              setPosts={handleSetPosts}
              team={team}
              currentUser={currentUser}
              language={language}
            />
          ) : (
            <LeagueExplorerAndJoin
              currentUser={currentUser}
              setCurrentUser={(u) => {
                setCurrentUser(u);
                saveDeviceSession(u);
              }}
              allTeams={allTeams}
              allUsers={users}
              setUsers={handleSetUsers}
              joinRequests={joinRequests}
              setJoinRequests={setJoinRequests}
              onViewLeagueWall={() => setActiveTab('wall')}
              language={language}
            />
          )
        ) : (
          <>
            {/* TAB 0: Ligas y Equipos Catalog */}
            {activeTab === 'leagues' && (
              <LeagueExplorerAndJoin
                currentUser={currentUser}
                setCurrentUser={(u) => {
                  setCurrentUser(u);
                  saveDeviceSession(u);
                }}
                allTeams={allTeams}
                allUsers={users}
                setUsers={handleSetUsers}
                joinRequests={joinRequests}
                setJoinRequests={setJoinRequests}
                onViewLeagueWall={() => setActiveTab('wall')}
                language={language}
              />
            )}

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
                setTeam={handleSetTeam}
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
                joinRequests={joinRequests}
                onAcceptJoinRequest={handleAcceptJoinRequest}
                onRejectJoinRequest={handleRejectJoinRequest}
              />
            )}
          </>
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
