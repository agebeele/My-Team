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
import { LeagueAdminProfileView } from './components/LeagueAdminProfileView';
import { FanProfileView } from './components/FanProfileView';
import confetti from 'canvas-confetti';
import { isSupabaseConfigured, initSupabaseFromServer, supabase } from './utils/supabaseClient';
import {
  supabaseFetchPlayers,
  supabaseFetchPlayersByUser,
  supabaseFetchMatches,
  supabaseFetchPosts,
  supabaseFetchUsers,
  supabaseFetchTeams,
  supabaseUpsertPlayer,
  supabaseDeletePlayer,
  supabaseUpsertMatch,
  supabaseDeleteMatch,
  supabaseUpsertPost,
  supabaseDeletePost,
  supabaseUpsertUser,
  supabaseUpsertTeam,
  supabaseFetchJoinRequests,
  supabaseUpsertJoinRequest,
  supabaseDeleteJoinRequest,
  supabaseFetchTeamInvitations,
  supabaseUpsertTeamInvitation,
  subscribeToSupabaseTable,
} from './services/supabaseService';
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
  const [currentUser, setCurrentUser] = useState<AppUser | null>(initial.currentUser || null);
  const [teamInvitations, setTeamInvitations] = useState<TeamInvitation[]>(() => {
    try {
      const stored = localStorage.getItem('teamgol_sent_invitations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [userPlayerCards, setUserPlayerCards] = useState<Player[]>([]);

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
  const [joinFanTeam, setJoinFanTeam] = useState<{ id: string; name: string; logoUrl?: string } | null>(null);
  const handledUrlInviteRef = useRef(false);
  const [joinDecisionAlert, setJoinDecisionAlert] = useState<{
    type: 'accepted' | 'rejected';
    teamName: string;
    message: string;
  } | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseVersion, setSupabaseVersion] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentUserRef = useRef<AppUser | null>(currentUser);
  currentUserRef.current = currentUser;
  const allTeamsRef = useRef<TeamInfo[]>(allTeams);
  allTeamsRef.current = allTeams;
  const playersRef = useRef<Player[]>(players);
  playersRef.current = players;

  // Sync player acceptance/rejection immediately (supports both first team & additional clubs)
  const checkAndApplyPlayerJoinDecision = async (
    latestUsers?: AppUser[],
    latestRequests?: TeamJoinRequest[],
    latestTeams?: TeamInfo[]
  ) => {
    const me = currentUserRef.current;
    if (!me || (me.role !== 'player' && me.role !== 'fan')) return;

    const teamsPool = latestTeams && latestTeams.length > 0 ? latestTeams : allTeamsRef.current;
    const freshMe = latestUsers?.find(
      (u) => u.id === me.id || (u.email && me.email && u.email.toLowerCase() === me.email.toLowerCase())
    );

    const matchingReqs = (latestRequests || []).filter(
      (r) =>
        r.userId === me.id ||
        (r.playerEmail && me.email && r.playerEmail.toLowerCase() === me.email.toLowerCase()) ||
        (r.userEmail && me.email && r.userEmail.toLowerCase() === me.email.toLowerCase())
    );

    const acceptedReqs = matchingReqs.filter((r) => r.status === 'accepted');
    const rejectedReqs = matchingReqs.filter((r) => r.status === 'rejected');

    const myExistingTeamIds = new Set<string>([
      ...(Array.isArray(me.teamIds) ? me.teamIds.filter(Boolean) : []),
      ...(me.teamId ? [me.teamId] : []),
    ]);

    const freshTeamIds = Array.from(
      new Set([
        ...(Array.isArray(freshMe?.teamIds) ? freshMe.teamIds.filter(Boolean) : []),
        ...(freshMe?.teamId ? [freshMe.teamId] : []),
      ])
    );

    // Find if a brand-new club was just added via freshMe.teamIds or an accepted join_request
    const newlyAcceptedTeamIdFromUser = freshTeamIds.find((tid) => !myExistingTeamIds.has(tid));
    const newlyAcceptedReq = acceptedReqs.find((r) => r.teamId && !myExistingTeamIds.has(r.teamId));
    const firstAcceptedTeamId = !me.teamId
      ? freshMe?.teamId || acceptedReqs[0]?.teamId
      : undefined;

    const targetAcceptedTeamId =
      newlyAcceptedTeamIdFromUser || newlyAcceptedReq?.teamId || firstAcceptedTeamId;

    // 1. Player was ACCEPTED into a first or additional team
    if (targetAcceptedTeamId) {
      const targetTeam = teamsPool.find((t) => t.id === targetAcceptedTeamId);
      const mergedTeamIds = Array.from(
        new Set([...Array.from(myExistingTeamIds), ...freshTeamIds, targetAcceptedTeamId])
      );

      const updatedMe: AppUser = {
        ...me,
        ...(freshMe || {}),
        teamId: targetAcceptedTeamId,
        teamIds: mergedTeamIds,
        teamJoinStatus: 'accepted',
        playerId: freshMe?.playerId || me.playerId,
      };

      setCurrentUser(updatedMe);
      saveDeviceSession(updatedMe);

      if (targetTeam) {
        setTeam(targetTeam);
        try {
          localStorage.setItem('teamgol_team_data', JSON.stringify(targetTeam));
        } catch {}
        setStandings(getStandingsForLeague(targetTeam.leagueName, targetTeam));
      }

      if (updatedMe.playerId) {
        setSelectedPlayerId(updatedMe.playerId);
      }

      // Immediately load accepted team's squad, matches and posts so all player options work right away
      if (isSupabaseConfigured()) {
        try {
          const [teamPlayers, teamMatches, teamPosts] = await Promise.all([
            supabaseFetchPlayers(targetAcceptedTeamId),
            supabaseFetchMatches(targetAcceptedTeamId),
            supabaseFetchPosts(targetAcceptedTeamId),
          ]);
          if (teamPlayers && teamPlayers.length > 0) {
            setPlayers(teamPlayers);
            savePlayersForTeam(targetAcceptedTeamId, teamPlayers);
            if (me.role === 'player') {
              const matchedPl = teamPlayers.find(
                (p) =>
                  p.linkedUserId === me.id ||
                  p.id === updatedMe.playerId ||
                  (p.name && me.name && p.name.toLowerCase().trim() === me.name.toLowerCase().trim())
              );
              if (matchedPl) {
                setSelectedPlayerId(matchedPl.id);
                const withPlayer = { ...updatedMe, playerId: matchedPl.id };
                setCurrentUser(withPlayer);
                saveDeviceSession(withPlayer);
              }
            }
          }
          if (teamMatches) {
            setMatches(teamMatches);
            saveMatchesForTeam(targetAcceptedTeamId, teamMatches);
          }
          if (teamPosts) {
            setPosts(teamPosts);
          }
        } catch (err) {
          console.warn('Error loading accepted team data from Supabase:', err);
        }
      } else {
        const localPlayers = getPlayersForTeam(targetAcceptedTeamId);
        if (localPlayers.length > 0) setPlayers(localPlayers);
        const localMatches = getMatchesForTeam(targetAcceptedTeamId);
        if (localMatches.length > 0) setMatches(localMatches);
      }

      setActiveTab('calendar');

      const teamLabel = targetTeam?.name || newlyAcceptedReq?.teamName || 'tu nuevo club';
      const bannerKey = `accepted_${targetAcceptedTeamId}`;
      try {
        const storageKey = `dreamteam_shown_decision_${me.id}`;
        if (localStorage.getItem(storageKey) !== bannerKey) {
          localStorage.setItem(storageKey, bannerKey);
          confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
        }
      } catch {}

      setJoinDecisionAlert({
        type: 'accepted',
        teamName: teamLabel,
        message:
          me.role === 'fan'
            ? `¡Fuiste aceptado en la Porra Oficial de ${teamLabel}! Ya puedes confirmar asistencia, votar en el MVP de la Afición y publicar en el muro.`
            : `¡Fuiste aceptado en ${teamLabel}! Tu ficha fue añadida y ya puedes cambiar entre tus clubes desde el encabezado.`,
      });
      return;
    }

    // 2. Player was REJECTED from a requested club (preserve any existing teamIds!)
    let latestShownKey = '';
    try {
      latestShownKey = localStorage.getItem(`dreamteam_shown_decision_${me.id}`) || '';
    } catch {}

    const unnotifiedRejection = rejectedReqs.find(
      (r) => `rejected_${r.id}` !== latestShownKey
    );
    const rejectedViaUser =
      freshMe &&
      freshMe.teamJoinStatus === 'rejected' &&
      me.teamJoinStatus !== 'rejected' &&
      !myExistingTeamIds.size;

    if (unnotifiedRejection || rejectedViaUser) {
      const updatedMe: AppUser = {
        ...me,
        ...(freshMe || {}),
        // Preserve active club & memberships if user already belongs to other clubs
        teamId: me.teamId || freshMe?.teamId,
        teamIds: Array.from(myExistingTeamIds),
        teamJoinStatus: myExistingTeamIds.size > 0 ? 'accepted' : 'rejected',
      };
      setCurrentUser(updatedMe);
      saveDeviceSession(updatedMe);

      const teamLabel = unnotifiedRejection?.teamName || freshMe?.requestedTeamName || 'el club';
      const bannerKey = `rejected_${unnotifiedRejection?.id || teamLabel}`;
      try {
        localStorage.setItem(`dreamteam_shown_decision_${me.id}`, bannerKey);
      } catch {}

      setJoinDecisionAlert({
        type: 'rejected',
        teamName: teamLabel,
        message: `Tu solicitud para unirte a ${teamLabel} fue rechazada. Puedes elegir otro equipo disponible en las ligas.`,
      });
    }
  };

  // Manual refresh function to refresh all data without logging out
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      let latestTeams = allTeamsRef.current;
      let latestUsers: AppUser[] | undefined;
      let latestRequests: TeamJoinRequest[] | undefined;

      // 1. Refresh from SQLite backend
      const backendData = await fetchBackendSync();
      if (backendData) {
        if (backendData.allTeams && Array.isArray(backendData.allTeams) && backendData.allTeams.length > 0) {
          latestTeams = backendData.allTeams;
          setAllTeams(backendData.allTeams);
          const currentT = backendData.allTeams.find((t: any) => t.id === team.id);
          if (currentT) setTeam(currentT);
        }
        if (backendData.players && Array.isArray(backendData.players)) {
          const teamPlayers = backendData.players.filter((p: any) => !p.teamId || p.teamId === team.id);
          setPlayers(teamPlayers);
        }
        if (backendData.matches && Array.isArray(backendData.matches)) {
          const currentMatches = backendData.matches.filter(
            (m: any) => (!m.teamId || m.teamId === team.id) && !deletedMatchIdsRef.current.has(m.id)
          );
          setMatches(currentMatches);
        }
        if (backendData.posts && Array.isArray(backendData.posts)) {
          setPosts(backendData.posts);
        }
        if (backendData.users && Array.isArray(backendData.users)) {
          latestUsers = backendData.users;
          setUsers(backendData.users);
        }
        if (backendData.joinRequests && Array.isArray(backendData.joinRequests)) {
          latestRequests = backendData.joinRequests;
          setJoinRequests(backendData.joinRequests);
          try {
            localStorage.setItem('teamgol_join_requests', JSON.stringify(backendData.joinRequests));
          } catch {}
        }
      }

      // 2. Refresh from Supabase if configured
      if (isSupabaseConfigured()) {
        const [cloudPlayers, cloudMatches, cloudPosts, cloudUsers, cloudTeams, cloudRequests, cloudInvitations, myPlayerCards] = await Promise.all([
          supabaseFetchPlayers(team.id),
          supabaseFetchMatches(team.id),
          supabaseFetchPosts(team.id),
          supabaseFetchUsers(),
          supabaseFetchTeams(),
          supabaseFetchJoinRequests(),
          currentUser?.email
            ? supabaseFetchTeamInvitations(currentUser.email)
            : Promise.resolve([] as TeamInvitation[]),
          currentUser?.id
            ? supabaseFetchPlayersByUser(currentUser.id)
            : Promise.resolve([] as Player[]),
        ]);

        if (cloudInvitations && cloudInvitations.length > 0) {
          setTeamInvitations(cloudInvitations);
        }
        if (myPlayerCards && myPlayerCards.length > 0) {
          setUserPlayerCards(myPlayerCards);
        }

        if (cloudTeams && cloudTeams.length > 0) {
          latestTeams = cloudTeams;
          setAllTeams(cloudTeams);
          const cur = cloudTeams.find((t) => t.id === team.id);
          if (cur) setTeam(cur);
        }
        if (cloudPlayers && cloudPlayers.length > 0) setPlayers(cloudPlayers);
        if (cloudMatches && cloudMatches.length > 0) setMatches(cloudMatches);
        if (cloudPosts && cloudPosts.length > 0) setPosts(cloudPosts);
        if (cloudUsers && cloudUsers.length > 0) {
          latestUsers = cloudUsers;
          setUsers(cloudUsers);
        }

        const pendingFromUsers: TeamJoinRequest[] = (cloudUsers || [])
          .filter((u) => u.teamJoinStatus === 'pending' && (
            u.requestedTeamId === team.id ||
            (u.requestedTeamName && u.requestedTeamName.toLowerCase().trim() === team.name.toLowerCase().trim())
          ))
          .map((u) => ({
            id: `req_user_${u.id}`,
            userId: u.id,
            userName: u.name,
            playerName: u.name,
            userEmail: u.email,
            playerEmail: u.email,
            userAvatar: u.avatarUrl,
            playerAvatar: u.avatarUrl,
            position: u.position || 'MED',
            playerPosition: u.position || 'MED',
            number: u.jerseyNumber || 10,
            playerNumber: u.jerseyNumber || 10,
            phone: u.phone,
            teamId: u.requestedTeamId || team.id,
            teamName: u.requestedTeamName || team.name,
            requestType: u.role === 'fan' ? ('fan' as const) : ('player' as const),
            status: 'pending' as const,
            createdAt: new Date().toISOString(),
          }));

        setJoinRequests((prev) => {
          const baseList = cloudRequests !== null && cloudRequests !== undefined ? cloudRequests : prev;
          const existingEmails = new Set(baseList.map((r) => (r.playerEmail || '').toLowerCase()));
          const existingUserIds = new Set(baseList.map((r) => r.userId));
          const needed = pendingFromUsers.filter(
            (ur) => !existingEmails.has(ur.playerEmail.toLowerCase()) && !existingUserIds.has(ur.userId)
          );
          const combined = [...baseList, ...needed];
          latestRequests = combined;
          try {
            localStorage.setItem('teamgol_join_requests', JSON.stringify(combined));
          } catch {}
          return combined;
        });
      }

      await checkAndApplyPlayerJoinDecision(latestUsers, latestRequests, latestTeams);
    } catch (err) {
      console.warn('Error during manual refresh:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 450);
    }
  };

  // Initialize shared Supabase configuration from central backend safely
  useEffect(() => {
    let isMounted = true;

    initSupabaseFromServer()
      .then((creds) => {
        if (isMounted && creds) {
          setSupabaseVersion((v) => v + 1);
        }
      })
      .catch((err) => {
        console.warn('Supabase init skipped or server unavailable:', err);
      });

    // Fallback timer: garantiza que el splash screen desaparezca si la red es lenta
    const timer = setTimeout(() => {
      if (isMounted) {
        setShowSplash(false);
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // Real-time synchronization with Supabase when configured
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isMounted = true;
    let unsubInvitations: (() => void) | undefined;

    const syncFromSupabase = async () => {
      try {
        const [cloudPlayers, cloudMatches, cloudPosts, cloudUsers, cloudTeams, cloudRequests, cloudInvitations, myPlayerCards] = await Promise.all([
          supabaseFetchPlayers(team.id),
          supabaseFetchMatches(team.id),
          supabaseFetchPosts(team.id),
          supabaseFetchUsers(),
          supabaseFetchTeams(),
          supabaseFetchJoinRequests(),
          currentUser?.email
            ? supabaseFetchTeamInvitations(currentUser.email)
            : Promise.resolve([] as TeamInvitation[]),
          currentUser?.id
            ? supabaseFetchPlayersByUser(currentUser.id)
            : Promise.resolve([] as Player[]),
        ]);

        if (!isMounted) return;

        if (cloudInvitations && cloudInvitations.length > 0) {
          setTeamInvitations(cloudInvitations);
        }
        if (myPlayerCards && myPlayerCards.length > 0) {
          setUserPlayerCards(myPlayerCards);
          const cardTeamIds = myPlayerCards.map((p) => p.teamId).filter(Boolean) as string[];
          const meNow = currentUserRef.current;
          if (meNow && cardTeamIds.length > 0) {
            const currentSet = new Set([...(meNow.teamIds || []), ...(meNow.teamId ? [meNow.teamId] : [])]);
            const hasNew = cardTeamIds.some((id) => !currentSet.has(id));
            if (hasNew) {
              const merged = Array.from(new Set([...Array.from(currentSet), ...cardTeamIds]));
              const updated = { ...meNow, teamIds: merged, teamId: meNow.teamId || merged[0] };
              setCurrentUser(updated);
              saveDeviceSession(updated);
            }
          }
        }

        if (cloudTeams && cloudTeams.length > 0) {
          setAllTeams(cloudTeams);
          const currentCloudTeam = cloudTeams.find((t) => t.id === team.id);
          if (currentCloudTeam) {
            setTeam(currentCloudTeam);
          }
        }
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

        const pendingFromUsers: TeamJoinRequest[] = (cloudUsers || [])
          .filter((u) => u.teamJoinStatus === 'pending' && (
            u.requestedTeamId === team.id ||
            (u.requestedTeamName && u.requestedTeamName.toLowerCase().trim() === team.name.toLowerCase().trim())
          ))
          .map((u) => ({
            id: `req_user_${u.id}`,
            userId: u.id,
            userName: u.name,
            playerName: u.name,
            userEmail: u.email,
            playerEmail: u.email,
            userAvatar: u.avatarUrl,
            playerAvatar: u.avatarUrl,
            position: u.position || 'MED',
            playerPosition: u.position || 'MED',
            number: u.jerseyNumber || 10,
            playerNumber: u.jerseyNumber || 10,
            phone: u.phone,
            teamId: u.requestedTeamId || team.id,
            teamName: u.requestedTeamName || team.name,
            requestType: u.role === 'fan' ? ('fan' as const) : ('player' as const),
            status: 'pending' as const,
            createdAt: new Date().toISOString(),
            requestedAt: new Date().toISOString(),
          }));

        setJoinRequests((prev) => {
          const baseList = cloudRequests !== null && cloudRequests !== undefined ? cloudRequests : prev;
          const existingEmails = new Set(baseList.map((r) => (r.playerEmail || '').toLowerCase()));
          const existingUserIds = new Set(baseList.map((r) => r.userId));
          const needed = pendingFromUsers.filter(
            (ur) => !existingEmails.has(ur.playerEmail.toLowerCase()) && !existingUserIds.has(ur.userId)
          );
          const combined = [...baseList, ...needed];
          try {
            localStorage.setItem('teamgol_join_requests', JSON.stringify(combined));
          } catch {}
          return combined;
        });

        await checkAndApplyPlayerJoinDecision(
          cloudUsers || undefined,
          cloudRequests || undefined,
          cloudTeams || undefined
        );
      } catch (err) {
        console.warn('Error syncing from Supabase:', err);
      }
    };

    syncFromSupabase();

    // Subscribe to real-time events across tables
    const unsubTeams = subscribeToSupabaseTable('teams', () => {
      supabaseFetchTeams().then((fresh) => {
        if (isMounted && fresh && fresh.length > 0) {
          setAllTeams(fresh);
          const currentFresh = fresh.find((t) => t.id === team.id);
          if (currentFresh) setTeam(currentFresh);
        }
      });
    });

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
        if (isMounted && fresh && fresh.length > 0) {
          setUsers(fresh);
          checkAndApplyPlayerJoinDecision(fresh, undefined, allTeamsRef.current);
          const freshPending: TeamJoinRequest[] = fresh
            .filter((u) => u.teamJoinStatus === 'pending' && (
              u.requestedTeamId === team.id ||
              (u.requestedTeamName && u.requestedTeamName.toLowerCase().trim() === team.name.toLowerCase().trim())
            ))
            .map((u) => ({
              id: `req_user_${u.id}`,
              userId: u.id,
              userName: u.name,
              playerName: u.name,
              userEmail: u.email,
              playerEmail: u.email,
              userAvatar: u.avatarUrl,
              playerAvatar: u.avatarUrl,
              position: u.position || 'MED',
              playerPosition: u.position || 'MED',
              number: u.jerseyNumber || 10,
              playerNumber: u.jerseyNumber || 10,
              phone: u.phone,
              teamId: u.requestedTeamId || team.id,
              teamName: u.requestedTeamName || team.name,
              requestType: u.role === 'fan' ? ('fan' as const) : ('player' as const),
              status: 'pending' as const,
              createdAt: new Date().toISOString(),
              requestedAt: new Date().toISOString(),
            }));

          if (freshPending.length > 0) {
            setJoinRequests((prev) => {
              const existingEmails = new Set(prev.map((r) => (r.playerEmail || '').toLowerCase()));
              const existingUserIds = new Set(prev.map((r) => r.userId));
              const additions = freshPending.filter(
                (fp) => !existingEmails.has(fp.playerEmail.toLowerCase()) && !existingUserIds.has(fp.userId)
              );
              if (additions.length > 0) {
                const updated = [...prev, ...additions];
                try {
                  localStorage.setItem('teamgol_join_requests', JSON.stringify(updated));
                } catch {}
                return updated;
              }
              return prev;
            });
          }
        }
      });
    });

    const unsubJoinRequests = subscribeToSupabaseTable('join_requests', () => {
      supabaseFetchJoinRequests().then((fresh) => {
        if (isMounted && fresh) {
          setJoinRequests(fresh);
          try {
            localStorage.setItem('teamgol_join_requests', JSON.stringify(fresh));
          } catch {}
          checkAndApplyPlayerJoinDecision(undefined, fresh, allTeamsRef.current);
        }
      });
    });

    unsubInvitations = subscribeToSupabaseTable('team_invitations', () => {
      if (currentUser?.email) {
        supabaseFetchTeamInvitations(currentUser.email).then((invs) => {
          if (isMounted) {
            setTeamInvitations(invs);
          }
        });
      }
    });

    return () => {
      isMounted = false;
      unsubTeams();
      unsubPosts();
      unsubPlayers();
      unsubMatches();
      unsubUsers();
      unsubJoinRequests();
      if (typeof unsubInvitations === 'function') unsubInvitations();
    };
  }, [team.id, supabaseVersion, currentUser?.email, currentUser?.id]);

  // Wrapper mutators that sync changes to SQLite backend and Supabase in real-time
  const handleSetPosts: React.Dispatch<React.SetStateAction<Post[]>> = (action) => {
    setPosts((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      try {
        localStorage.setItem('teamgol_posts_data', JSON.stringify(next));
      } catch {}
      // Detect deleted posts
      const nextIds = new Set(next.map((p) => p.id));
      prev.forEach((oldP) => {
        if (!nextIds.has(oldP.id)) {
          fetch(`/api/publicaciones/${oldP.id}`, { method: 'DELETE' }).catch(() => {});
          if (isSupabaseConfigured()) {
            supabaseDeletePost(oldP.id);
          }
        }
      });
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
      pushBackendSyncImmediate({ players: next });
      if (isSupabaseConfigured()) {
        const nextIds = new Set(next.map((p) => p.id));
        prev.forEach((oldP) => {
          if (!nextIds.has(oldP.id)) {
            supabaseDeletePlayer(oldP.id);
          }
        });
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
      // Detect deleted matches and send DELETE request to backend & Supabase
      const nextIds = new Set(next.map((m) => m.id));
      prev.forEach((oldM) => {
        if (!nextIds.has(oldM.id)) {
          deletedMatchIdsRef.current.add(oldM.id);
          fetch(`/api/partidos/${oldM.id}`, { method: 'DELETE' }).catch(() => {});
          if (isSupabaseConfigured()) {
            supabaseDeleteMatch(oldM.id);
          }
        }
      });

      const tagged = next.map((m) => ({ ...m, teamId: m.teamId || team.id }));
      saveMatchesForTeam(team.id, tagged);
      try {
        localStorage.setItem('teamgol_matches_data', JSON.stringify(tagged));
      } catch {}
      pushBackendSyncImmediate({ matches: tagged });
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
      try {
        localStorage.setItem('teamgol_team_data', JSON.stringify(next));
      } catch {}

      setAllTeams((prevAll) => {
        const updated = prevAll.map((t) => (t.id === next.id ? next : t));
        if (!updated.some((t) => t.id === next.id)) {
          updated.push(next);
        }
        try {
          localStorage.setItem('teamgol_all_teams_data', JSON.stringify(updated));
        } catch {}
        pushBackendSyncImmediate({ team: next, allTeams: updated });
        return updated;
      });

      if (isSupabaseConfigured()) {
        supabaseUpsertTeam(next);
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
        // Only update current team metadata (colors, name, stadium, league) if it exists
        setTeam((prev) => {
          const match =
            data.team && data.team.id === prev.id
              ? data.team
              : data.allTeams?.find((t: any) => t.id === prev.id);
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

      if (data.matches && Array.isArray(data.matches)) {
        const currentMatches = data.matches.filter(
          (m: any) => (!m.teamId || m.teamId === team.id) && !deletedMatchIdsRef.current.has(m.id)
        );
        setMatches(currentMatches);
        saveMatchesForTeam(team.id, currentMatches);
      }

      if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
        setPosts(data.posts);
      }
      if (data.users && data.users.length > 0) {
        setUsers(data.users);
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

      if (data.users || data.joinRequests) {
        checkAndApplyPlayerJoinDecision(
          data.users,
          data.joinRequests,
          data.allTeams
        );
      }
    };

    doSync();
    // Poll every 3 seconds to keep all devices in sync without page reloads
    const timer = setInterval(doSync, 3000);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [team.id, currentUser?.id]);

  // Clean light theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('app_theme');
  }, []);

  // Detect invite link in URL: ?joinTeam=... or ?joinFan=<team_id>
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const joinTeamId = params.get('joinTeam');
      const joinFanId = params.get('joinFan');
      const teamNameParam = params.get('teamName');
      const teamLogoParam = params.get('teamLogo');

      if (joinFanId) {
        const matched = allTeams.find((t) => t.id === joinFanId) || (team.id === joinFanId ? team : undefined);
        const fanObj = {
          id: joinFanId,
          name: teamNameParam
            ? decodeURIComponent(teamNameParam)
            : matched?.name || 'Club Oficial',
          logoUrl: teamLogoParam
            ? decodeURIComponent(teamLogoParam)
            : matched?.logoUrl,
        };
        setJoinFanTeam(fanObj);
        if (!handledUrlInviteRef.current) {
          handledUrlInviteRef.current = true;
          setIsAuthModalOpen(true);
        }
      } else if (joinTeamId || teamNameParam) {
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
        if (!handledUrlInviteRef.current) {
          handledUrlInviteRef.current = true;
          setIsAuthModalOpen(true);
        }
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [team.name, team.id, team.logoUrl, allTeams]);

  // Handler to switch active team cleanly with distinct data segregation & instant reload
  const handleSwitchTeam = async (newTeam: TeamInfo, options?: { skipUserUpdate?: boolean }) => {
    if (!newTeam) return;

    // 1. Save data for current team before leaving
    if (team?.id) {
      savePlayersForTeam(team.id, players);
      saveMatchesForTeam(team.id, matches);
      saveStandingsForLeague(team.leagueName, standings);
    }

    // 2. Load target team's local data immediately
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

    // 3. Update active team on currentUser while preserving all teamIds
    const activeUser = currentUserRef.current;
    if (activeUser && !options?.skipUserUpdate) {
      const mergedTeamIds = Array.from(
        new Set([
          ...(Array.isArray(activeUser.teamIds) ? activeUser.teamIds.filter(Boolean) : []),
          ...(activeUser.teamId ? [activeUser.teamId] : []),
          newTeam.id,
        ])
      );
      const matchedCard = targetPlayers.find(
        (p) =>
          p.linkedUserId === activeUser.id ||
          (p.name && activeUser.name && p.name.toLowerCase().trim() === activeUser.name.toLowerCase().trim())
      );
      if (matchedCard) {
        setSelectedPlayerId(matchedCard.id);
      }
      const updatedUser: AppUser = {
        ...activeUser,
        teamId: newTeam.id,
        teamIds: mergedTeamIds,
        playerId: matchedCard?.id || activeUser.playerId,
      };
      setCurrentUser(updatedUser);
      saveDeviceSession(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
      if (isSupabaseConfigured()) {
        supabaseUpsertUser(updatedUser);
      }
    }

    // 4. Immediately reload fresh squad, matches, and posts from Supabase if configured
    if (isSupabaseConfigured() && !options?.skipUserUpdate) {
      try {
        const [cloudPlayers, cloudMatches, cloudPosts] = await Promise.all([
          supabaseFetchPlayers(newTeam.id),
          supabaseFetchMatches(newTeam.id),
          supabaseFetchPosts(newTeam.id),
        ]);
        if (cloudPlayers) {
          setPlayers(cloudPlayers);
          savePlayersForTeam(newTeam.id, cloudPlayers);
          if (activeUser) {
            const matchedPl = cloudPlayers.find(
              (p) =>
                p.linkedUserId === activeUser.id ||
                (p.name && activeUser.name && p.name.toLowerCase().trim() === activeUser.name.toLowerCase().trim())
            );
            if (matchedPl) {
              setSelectedPlayerId(matchedPl.id);
              const withPl = {
                ...activeUser,
                teamId: newTeam.id,
                teamIds: Array.from(new Set([...(activeUser.teamIds || []), newTeam.id])),
                playerId: matchedPl.id,
              };
              setCurrentUser(withPl);
              saveDeviceSession(withPl);
            }
          }
        }
        if (cloudMatches) {
          setMatches(cloudMatches);
          saveMatchesForTeam(newTeam.id, cloudMatches);
        }
        if (cloudPosts) {
          setPosts(cloudPosts);
        }
      } catch (err) {
        console.warn('Error reloading team data on switch:', err);
      }
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

  // Restrict navigation for unassigned player or fan (without any team) to leagues explorer and league wall
  useEffect(() => {
    const hasAnyTeam = Boolean(
      currentUser?.teamId || (Array.isArray(currentUser?.teamIds) && currentUser.teamIds.length > 0)
    );
    if ((currentUser?.role === 'player' || currentUser?.role === 'fan') && !hasAnyTeam) {
      const allowed = ['leagues', 'wall'];
      if (!allowed.includes(activeTab)) {
        setActiveTab('leagues');
      }
    } else if (currentUser?.role === 'fan' && (activeTab === 'live_match' || activeTab === 'admin' || activeTab === 'owner_admin')) {
      setActiveTab('calendar');
    }
  }, [currentUser?.role, currentUser?.teamId, currentUser?.teamIds, activeTab]);

  const currentPlayer =
    players.find((p) => p.id === selectedPlayerId) ||
    (currentUser
      ? players.find(
          (p) =>
            p.linkedUserId === currentUser.id ||
            (p.name && currentUser.name && p.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim())
        )
      : undefined) ||
    players[0];

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
    // 1. Update all matching pending requests for this user/team
    const nowIso = new Date().toISOString();
    const updatedRequests = joinRequests.map((r) => {
      const sameUser =
        r.id === req.id ||
        (r.teamId === req.teamId &&
          r.status === 'pending' &&
          (r.userId === req.userId ||
            (r.playerEmail && req.playerEmail && r.playerEmail.toLowerCase() === req.playerEmail.toLowerCase())));
      return sameUser ? { ...r, status: 'accepted' as const, respondedAt: nowIso } : r;
    });
    setJoinRequests(updatedRequests);
    try {
      localStorage.setItem('teamgol_join_requests', JSON.stringify(updatedRequests));
    } catch {}

    const requestingUser = users.find(
      (u) =>
        u.id === req.userId ||
        (req.playerEmail && u.email.toLowerCase() === req.playerEmail.toLowerCase())
    );
    const isFanRequest = req.requestType === 'fan' || requestingUser?.role === 'fan';

    let newPlayer: Player | undefined;
    let updatedTargetPlayers = players;
    let newPlayerId: string | undefined;

    // 2. For player requests only, create (or reuse) an independent Player card for (team_id, user_id).
    // For fan requests ('fan'), NEVER create a record in players.
    if (!isFanRequest) {
      const targetTeamPlayers =
        req.teamId === team.id ? players : getPlayersForTeam(req.teamId);
      const existingCard = targetTeamPlayers.find(
        (p) => p.linkedUserId === req.userId && (!p.teamId || p.teamId === req.teamId)
      );
      newPlayerId = existingCard?.id || `p_${Date.now()}`;
      newPlayer = {
        id: newPlayerId,
        name: req.playerName,
        number: req.playerNumber || existingCard?.number || Math.floor(Math.random() * 80) + 10,
        position: req.playerPosition || existingCard?.position || 'MED',
        avatarUrl: req.playerAvatar || existingCard?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        goals: existingCard?.goals || 0,
        assists: existingCard?.assists || 0,
        matches: existingCard?.matches || 0,
        yellowCards: existingCard?.yellowCards || 0,
        redCards: existingCard?.redCards || 0,
        isCalledUp: true,
        isStarter: existingCard?.isStarter || false,
        mvpHistory: existingCard?.mvpHistory || [],
        linkedUserId: req.userId,
        invitationStatus: 'confirmed',
        teamId: req.teamId,
      };

      updatedTargetPlayers = [
        ...targetTeamPlayers.filter((p) => p.id !== newPlayerId),
        newPlayer,
      ];
      if (req.teamId === team.id) {
        setPlayers(updatedTargetPlayers);
      }
      savePlayersForTeam(req.teamId, updatedTargetPlayers);
    }

    // 3. Add req.teamId to app_users.team_ids without removing previous memberships, and set as active teamId
    let matchedUpdatedUser: AppUser | undefined;
    const updatedUsers = users.map((u) => {
      if (u.id === req.userId || (req.playerEmail && u.email.toLowerCase() === req.playerEmail.toLowerCase())) {
        const mergedTeamIds = Array.from(
          new Set([
            ...(Array.isArray(u.teamIds) ? u.teamIds.filter(Boolean) : []),
            ...(u.teamId ? [u.teamId] : []),
            req.teamId,
          ])
        );
        matchedUpdatedUser = {
          ...u,
          teamId: req.teamId,
          teamIds: mergedTeamIds,
          teamJoinStatus: 'accepted' as const,
          ...(newPlayerId ? { playerId: newPlayerId } : {}),
        };
        return matchedUpdatedUser;
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
      players: !isFanRequest && req.teamId === team.id ? updatedTargetPlayers : players,
      users: updatedUsers,
    });

    // 5. Update Supabase in real-time (upsert user BEFORE player so FK players.user_id satisfies)
    if (isSupabaseConfigured()) {
      const acceptedReq: TeamJoinRequest = {
        ...req,
        requestType: isFanRequest ? 'fan' : 'player',
        status: 'accepted',
        respondedAt: nowIso,
      };
      if (matchedUpdatedUser) {
        await supabaseUpsertUser(matchedUpdatedUser);
      }
      if (!isFanRequest && newPlayer) {
        await supabaseUpsertPlayer(req.teamId, newPlayer);
      }
      await supabaseUpsertJoinRequest(acceptedReq);
    }
  };

  // Accept an official team invitation while preserving previous multi-team memberships
  const handleAcceptTeamInvitation = async (inv: TeamInvitation) => {
    const me = currentUserRef.current;
    if (!me) return;

    const targetTeam = allTeamsRef.current.find(
      (t) => (inv.teamId && t.id === inv.teamId) || t.name.toLowerCase() === inv.teamName.toLowerCase()
    );
    const targetTeamId = inv.teamId || targetTeam?.id;
    if (!targetTeamId) return;

    const existingTeamPlayers =
      targetTeamId === team.id ? players : getPlayersForTeam(targetTeamId);
    const existingCard = existingTeamPlayers.find(
      (p) => p.linkedUserId === me.id && (!p.teamId || p.teamId === targetTeamId)
    );
    const newPlayerId = existingCard?.id || `p_${Date.now()}`;
    const newPlayer: Player = {
      id: newPlayerId,
      name: me.name,
      number: existingCard?.number || me.jerseyNumber || 10,
      position: existingCard?.position || me.position || 'MED',
      avatarUrl: existingCard?.avatarUrl || me.avatarUrl,
      goals: existingCard?.goals || 0,
      assists: existingCard?.assists || 0,
      matches: existingCard?.matches || 0,
      yellowCards: existingCard?.yellowCards || 0,
      redCards: existingCard?.redCards || 0,
      isCalledUp: true,
      isStarter: existingCard?.isStarter || false,
      mvpHistory: existingCard?.mvpHistory || [],
      linkedUserId: me.id,
      invitationStatus: 'confirmed',
      teamId: targetTeamId,
    };

    const updatedSquad = [...existingTeamPlayers.filter((p) => p.id !== newPlayerId), newPlayer];
    savePlayersForTeam(targetTeamId, updatedSquad);
    if (targetTeamId === team.id) {
      setPlayers(updatedSquad);
    }

    const mergedTeamIds = Array.from(
      new Set([
        ...(Array.isArray(me.teamIds) ? me.teamIds.filter(Boolean) : []),
        ...(me.teamId ? [me.teamId] : []),
        targetTeamId,
      ])
    );

    const updatedMe: AppUser = {
      ...me,
      teamId: targetTeamId,
      teamIds: mergedTeamIds,
      teamJoinStatus: 'accepted',
      playerId: newPlayerId,
    };

    setCurrentUser(updatedMe);
    saveDeviceSession(updatedMe);
    setSelectedPlayerId(newPlayerId);
    setUsers((prev) => prev.map((u) => (u.id === me.id ? updatedMe : u)));

    const updatedInvs = teamInvitations.map((i) =>
      i.id === inv.id ? { ...i, status: 'accepted' as const } : i
    );
    setTeamInvitations(updatedInvs);

    if (isSupabaseConfigured()) {
      await supabaseUpsertUser(updatedMe);
      await supabaseUpsertPlayer(targetTeamId, newPlayer);
      await supabaseUpsertTeamInvitation({ ...inv, status: 'accepted' });
    }

    if (targetTeam) {
      await handleSwitchTeam(targetTeam);
    }
    setActiveTab('calendar');
    setJoinSuccessAlert(`¡Te has unido a ${targetTeam?.name || inv.teamName}! Puedes alternar entre tus equipos desde el encabezado.`);
    setTimeout(() => setJoinSuccessAlert(null), 6000);
  };

  const handleRejectJoinRequest = async (requestId: string) => {
    const nowIso = new Date().toISOString();
    const req = joinRequests.find((r) => r.id === requestId);
    const updatedRequests = joinRequests.map((r) => {
      const sameUser =
        r.id === requestId ||
        (req &&
          r.teamId === req.teamId &&
          r.status === 'pending' &&
          (r.userId === req.userId ||
            (r.playerEmail && req.playerEmail && r.playerEmail.toLowerCase() === req.playerEmail.toLowerCase())));
      return sameUser ? { ...r, status: 'rejected' as const, respondedAt: nowIso } : r;
    });
    setJoinRequests(updatedRequests);
    try {
      localStorage.setItem('teamgol_join_requests', JSON.stringify(updatedRequests));
    } catch {}

    let updatedUsers = users;
    let rejectedUser: AppUser | undefined;
    if (req) {
      updatedUsers = users.map((u) => {
        if (u.id === req.userId || (req.playerEmail && u.email.toLowerCase() === req.playerEmail.toLowerCase())) {
          const uMod: AppUser = {
            ...u,
            teamJoinStatus: 'rejected' as const,
            requestedTeamName: req.teamName || u.requestedTeamName,
          };
          rejectedUser = uMod;
          return uMod;
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

    // Update Supabase in real-time
    if (isSupabaseConfigured()) {
      const rejectedReq: TeamJoinRequest = {
        ...(req || { id: requestId, teamId: team.id, teamName: team.name, userId: '', playerEmail: '', playerName: '' }),
        status: 'rejected',
        respondedAt: nowIso,
      } as TeamJoinRequest;
      supabaseUpsertJoinRequest(rejectedReq);
      if (rejectedUser) {
        supabaseUpsertUser(rejectedUser);
      }
    }
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
          setTeam={handleSetTeam}
          allTeams={allTeams}
          setAllTeams={setAllTeams}
          allUsers={users}
          setUsers={handleSetUsers}
          players={players}
          setPlayers={handleSetPlayers}
          matches={matches}
          setMatches={handleSetMatches}
          setStandings={setStandings}
          language={language}
          invitedTeam={invitedTeam}
          invitedTeamName={invitedTeamName}
          joinFanTeam={joinFanTeam}
          joinRequests={joinRequests}
          setJoinRequests={setJoinRequests}
          onLoginSuccess={(user, rememberDevice) => {
            setCurrentUser(user);
            currentUserRef.current = user;
            const hasAnyTeam = Boolean(
              user.teamId || (Array.isArray(user.teamIds) && user.teamIds.length > 0)
            );
            if (user.role === 'league_admin') {
              setActiveTab('wall');
            } else if ((user.role === 'player' || user.role === 'fan') && !hasAnyTeam) {
              setActiveTab('leagues');
            } else {
              const isAdmin =
                user.email.toLowerCase() === 'agbl141201@gmail.com' ||
                user.username?.toLowerCase() === 'admin';
              const userTeamId = isAdmin
                ? 'team_01'
                : user.teamId || (user.teamIds && user.teamIds[0]) || null;

              if (isAdmin) {
                // FC Bayern Munich must strictly be loaded for agbl141201@gmail.com
                const bayernMatch =
                  allTeams.find((t) => t.id === 'team_01' && t.name.toLowerCase().includes('bayern')) ||
                  allTeams.find((t) => t.name.toLowerCase().includes('bayern')) ||
                  INITIAL_TEAM;
                handleSwitchTeam(bayernMatch);
              } else if (userTeamId) {
                const targetTeam = allTeams.find((t) => t.id === userTeamId);
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

  // Compute all clubs where currentUser has an active player card, membership in teamIds, or owner role
  const currentUserTeamIds = new Set<string>([
    ...(Array.isArray(currentUser.teamIds) ? currentUser.teamIds.filter(Boolean) : []),
    ...(currentUser.teamId ? [currentUser.teamId] : []),
    ...userPlayerCards.map((p) => p.teamId).filter(Boolean) as string[],
  ]);
  const userTeamsList = allTeams.filter((t) => currentUserTeamIds.has(t.id));
  if (team?.id && currentUserTeamIds.has(team.id) && !userTeamsList.some((t) => t.id === team.id)) {
    userTeamsList.unshift(team);
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
        userTeams={userTeamsList}
        onSwitchTeam={(t) => handleSwitchTeam(t)}
        onJoinAnotherTeam={() => setActiveTab('leagues')}
        currentUser={currentUser}
        setCurrentUser={(u) => {
          setCurrentUser(u);
          saveDeviceSession(u);
        }}
        onLogout={() => {
          clearDeviceSession();
          currentUserRef.current = null;
          setCurrentUser(null);
          setUserPlayerCards([]);
          setJoinDecisionAlert(null);
          handleSwitchTeam(INITIAL_TEAM, { skipUserUpdate: true });
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
        teamInvitations={teamInvitations}
        onAcceptTeamInvitation={handleAcceptTeamInvitation}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
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

      {/* Real-time Join Request Decision Notification Banner (Accepted or Rejected) */}
      {joinDecisionAlert && (
        <div
          id="banner-join-decision-alert"
          className={`px-4 py-3 text-white text-xs sm:text-sm font-bold shadow-lg animate-in slide-in-from-top duration-200 flex items-center justify-between gap-3 ${
            joinDecisionAlert.type === 'accepted'
              ? 'bg-gradient-to-r from-emerald-600 to-green-600'
              : 'bg-gradient-to-r from-rose-600 to-red-600'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3 flex-wrap">
            <span>
              {joinDecisionAlert.type === 'accepted' ? '🎉 ' : '⚠️ '}
              {joinDecisionAlert.message}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {joinDecisionAlert.type === 'accepted' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    setJoinDecisionAlert(null);
                  }}
                  className="px-3 py-1 rounded-lg bg-white text-emerald-700 font-black text-xs shadow-xs hover:bg-emerald-50 cursor-pointer"
                >
                  Ver Mi Perfil
                </button>
              )}
              <button
                type="button"
                onClick={() => setJoinDecisionAlert(null)}
                className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-white text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10">
        {/* Club Community Strip with Official Fans Counter */}
        {currentUser.role !== 'league_admin' && currentUserTeamIds.size > 0 && (() => {
          const officialFansCount = users.filter(
            (u) =>
              u.role === 'fan' &&
              (u.teamId === team.id || (Array.isArray(u.teamIds) && u.teamIds.includes(team.id)))
          ).length;
          return (
            <div className="mb-4 px-4 py-2.5 rounded-2xl bg-white border border-[#CED0D4] shadow-xs flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-lg object-cover border border-[#CED0D4] bg-white shrink-0"
                />
                <span className="text-xs sm:text-sm font-black text-[#050505] truncate">
                  {team.name}
                </span>
                <span className="text-[11px] font-bold text-[#65676B] hidden sm:inline">
                  • {team.leagueName}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0F2F5] text-[#050505] border border-[#CED0D4] text-[11px] font-bold">
                  ⚽ {players.length} Jugadores
                </span>
                <span
                  id="club-official-fans-counter"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-black"
                >
                  📣 {officialFansCount} Aficionados Oficiales
                </span>
              </div>
            </div>
          );
        })()}

        {/* Unassigned Player or Fan View: only League Explorer and League Wall until admitted to at least one club */}
        {(currentUser?.role === 'player' || currentUser?.role === 'fan') && currentUserTeamIds.size === 0 ? (
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
              onSwitchToTeam={(t) => {
                handleSwitchTeam(t);
                setActiveTab('calendar');
              }}
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
                onSwitchToTeam={(t) => {
                  handleSwitchTeam(t);
                  setActiveTab('calendar');
                }}
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
                onNavigateToLineup={(matchId) => {
                  setSelectedMatchId(matchId);
                  setActiveTab('lineup');
                }}
                onNavigateToConvocatoria={(matchId) => {
                  setSelectedMatchId(matchId);
                  setActiveTab('convocatoria');
                }}
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
                setTeam={handleSetTeam}
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
                setTeam={handleSetTeam}
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
                setTeam={handleSetTeam}
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

            {/* TAB 7: League Admin Profile OR Player Profile & MVP Trophy Cabinet */}
            {activeTab === 'profile' && currentUser.role === 'league_admin' && (
              <LeagueAdminProfileView
                currentUser={currentUser}
                setCurrentUser={(u) => {
                  setCurrentUser(u);
                  saveDeviceSession(u);
                }}
                users={users}
                setUsers={handleSetUsers}
                setPosts={handleSetPosts}
                onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              />
            )}

            {activeTab === 'profile' && currentUser.role === 'fan' && (
              <FanProfileView
                currentUser={currentUser}
                setCurrentUser={(u) => {
                  setCurrentUser(u);
                  saveDeviceSession(u);
                }}
                users={users}
                setUsers={handleSetUsers}
                team={team}
                allTeams={allTeams}
              />
            )}

            {activeTab === 'profile' && currentUser.role !== 'league_admin' && currentUser.role !== 'fan' && (() => {
              const effectivePlayer: Player | undefined = currentPlayer || (currentUser.role === 'player' ? {
                id: currentUser.playerId || `p_user_${currentUser.id}`,
                name: currentUser.name,
                number: currentUser.jerseyNumber || 10,
                position: currentUser.position || 'MED',
                avatarUrl: currentUser.avatarUrl,
                goals: 0,
                assists: 0,
                matches: 0,
                yellowCards: 0,
                redCards: 0,
                isCalledUp: true,
                isStarter: false,
                mvpHistory: [],
                linkedUserId: currentUser.id,
                teamId: currentUser.teamId,
              } : undefined);
              if (!effectivePlayer) return null;
              return (
                <PlayerProfileView
                  player={effectivePlayer}
                  setPlayers={handleSetPlayers}
                  team={team}
                  currentUser={currentUser}
                  setCurrentUser={(u) => {
                    setCurrentUser(u);
                    saveDeviceSession(u);
                  }}
                  users={users}
                  setUsers={handleSetUsers}
                  language={language}
                />
              );
            })()}

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
          setJoinFanTeam(null);
          if (window.location.search.includes('joinFan=') || window.location.search.includes('joinTeam=')) {
            window.history.replaceState({}, '', window.location.pathname);
          }
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
        joinFanTeam={joinFanTeam}
        onFanJoinRequest={(fanReq) => {
          setJoinRequests((prev) => {
            const next = [fanReq, ...prev.filter((r) => r.id !== fanReq.id)];
            try {
              localStorage.setItem('teamgol_join_requests', JSON.stringify(next));
            } catch {}
            pushBackendSyncImmediate({ joinRequests: next });
            return next;
          });
          setJoinSuccessAlert(
            `¡Solicitud de Aficionado enviada para ${fanReq.teamName}! El Admin/DT aprobará tu ingreso a la Porra Oficial.`
          );
          setTimeout(() => setJoinSuccessAlert(null), 6000);
        }}
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