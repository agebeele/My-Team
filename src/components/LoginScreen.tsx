import React, { useState, useRef } from 'react';
import {
  Shield,
  Lock,
  Mail,
  KeyRound,
  User,
  UserPlus,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  Crown,
  Camera,
  Image as ImageIcon,
  Smartphone,
  CheckCircle2,
  Trophy,
  Palette,
  CheckCheck,
} from 'lucide-react';
import {
  AppUser,
  TeamInfo,
  Player,
  Language,
  PlayerPosition,
  DEFAULT_FACEBOOK_AVATAR,
  ALL_POSITIONS,
  TeamInvitation,
} from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { APP_NAME, APP_LOGO_URL } from '../assets/branding';

interface LoginScreenProps {
  team: TeamInfo;
  setTeam?: React.Dispatch<React.SetStateAction<TeamInfo>>;
  allUsers: AppUser[];
  setUsers?: React.Dispatch<React.SetStateAction<AppUser[]>>;
  players: Player[];
  setPlayers?: React.Dispatch<React.SetStateAction<Player[]>>;
  onLoginSuccess: (user: AppUser, rememberDevice: boolean) => void;
  onTeamCreated?: (newTeam: TeamInfo) => void;
  onInvitationSent?: (invitation: TeamInvitation) => void;
  language: Language;
  invitedTeam?: { id?: string; name: string; logoUrl?: string } | null;
  invitedTeamName?: string | null;
}

const PRESET_CRESTS = [
  {
    name: 'Rayos Élite',
    url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Balón Dorado',
    url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Halcones',
    url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Copa Campeones',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=200&q=80',
  },
];

const PRESET_COLORS = [
  { name: 'Azul Real', hex: '#1877F2' },
  { name: 'Rojo Pasión', hex: '#DC2626' },
  { name: 'Verde Césped', hex: '#059669' },
  { name: 'Dorado', hex: '#D97706' },
  { name: 'Negro Élite', hex: '#111827' },
  { name: 'Morado', hex: '#7C3AED' },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  team,
  setTeam,
  allUsers,
  setUsers,
  players,
  setPlayers,
  onLoginSuccess,
  onTeamCreated,
  onInvitationSent,
  invitedTeam,
  invitedTeamName,
}) => {
  // Determine if the user was invited to a specific team
  const hasInvite = Boolean(invitedTeam?.name || invitedTeamName);
  const invitedName = invitedTeam?.name || invitedTeamName || '';
  const invitedLogo = invitedTeam?.logoUrl;

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'create_team'>(
    hasInvite ? 'register' : 'login'
  );

  // Login form state (no placeholders, clean credentials)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Registration form state for player
  const [newPlayerForm, setNewPlayerForm] = useState({
    name: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    number: '10',
    position: 'DEL' as PlayerPosition,
    avatarUrl: DEFAULT_FACEBOOK_AVATAR,
  });
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // "Quiero armar mi propio equipo" form state
  const [newTeamForm, setNewTeamForm] = useState({
    name: '',
    leagueName: 'Liga Premier Fútbol 7',
    primaryColor: '#1877F2',
    secondaryColor: '#0866FF',
    logoUrl: PRESET_CRESTS[0].url,
    dtName: '',
    dtEmail: '',
    dtPassword: '',
    dtConfirmPassword: '',
  });
  const [teamCreateError, setTeamCreateError] = useState<string | null>(null);
  const [showDtPassword, setShowDtPassword] = useState(false);

  // Camera & File modal state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'player' | 'team'>('player');
  const fileInputPlayerRef = useRef<HTMLInputElement>(null);
  const fileInputTeamRef = useRef<HTMLInputElement>(null);

  // Dynamic team branding for header based on mode
  let displayTeamName = team.name;
  let displayTeamLogo: string | undefined = team.logoUrl;

  if (activeTab === 'create_team') {
    displayTeamName = newTeamForm.name.trim() || 'Nuevo Equipo Fut 7';
    displayTeamLogo = newTeamForm.logoUrl;
  } else if (hasInvite) {
    displayTeamName = invitedName;
    displayTeamLogo = invitedLogo || team.logoUrl;
  }

  // Handle Login Submit
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const identifier = loginIdentifier.trim().toLowerCase();
    const pass = loginPassword.trim();

    if (!identifier) {
      setLoginError('Ingresa tu correo o usuario.');
      return;
    }
    if (!pass) {
      setLoginError('Ingresa tu contraseña.');
      return;
    }

    // Direct check for required admin: email agbl141201@gmail.com, usuario admin, pass root
    if (
      (identifier === 'admin' || identifier === 'agbl141201@gmail.com') &&
      pass === 'root'
    ) {
      const adminInList = allUsers.find(
        (u) =>
          u.email.toLowerCase() === 'agbl141201@gmail.com' ||
          (u.username && u.username.toLowerCase() === 'admin')
      );

      const targetAdmin: AppUser = adminInList || {
        id: 'u_admin',
        name: 'Administrador (Admin)',
        email: 'agbl141201@gmail.com',
        username: 'admin',
        password: 'root',
        role: 'owner',
        avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        playerId: 'p1',
        provider: 'email',
      };

      if (!adminInList && setUsers) {
        setUsers((prev) => [targetAdmin, ...prev]);
      }

      setLoginSuccess('¡Bienvenido Administrador!');
      setTimeout(() => {
        onLoginSuccess(targetAdmin, rememberDevice);
      }, 500);
      return;
    }

    // Match in user directory
    const matchedUser = allUsers.find(
      (u) =>
        u.email.toLowerCase() === identifier ||
        (u.username && u.username.toLowerCase() === identifier)
    );

    if (!matchedUser) {
      setLoginError(
        'No encontramos una cuenta con ese correo o usuario. Si eres nuevo, puedes crear tu cuenta o armar tu propio equipo.'
      );
      return;
    }

    const expectedPass =
      matchedUser.password || (matchedUser.role === 'owner' ? 'root' : '123');

    if (expectedPass !== pass) {
      setLoginError('Contraseña incorrecta. Por favor intenta nuevamente.');
      return;
    }

    setLoginSuccess(`¡Bienvenido, ${matchedUser.name.split(' ')[0]}!`);
    setTimeout(() => {
      onLoginSuccess(matchedUser, rememberDevice);
    }, 500);
  };

  // Handle Photo upload for player
  const handlePlayerPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewPlayerForm((prev) => ({
          ...prev,
          avatarUrl: event.target?.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Logo upload for new team
  const handleTeamLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewTeamForm((prev) => ({
          ...prev,
          logoUrl: event.target?.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Player Registration Submit
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    const name = newPlayerForm.name.trim();
    const email = newPlayerForm.email.trim();
    const password = newPlayerForm.password.trim();
    const confirmPassword = newPlayerForm.confirmPassword.trim();

    if (!name) {
      setRegisterError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!email || !email.includes('@')) {
      setRegisterError('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (!password || password.length < 3) {
      setRegisterError('Crea una contraseña de al menos 3 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setRegisterError('Las contraseñas no coinciden.');
      return;
    }

    const emailExists = allUsers.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (emailExists) {
      setRegisterError('Ya existe una cuenta con este correo. Inicia sesión.');
      return;
    }

    const dorsal = parseInt(newPlayerForm.number, 10) || Math.floor(Math.random() * 89) + 10;
    const newPlayerId = `p_${Date.now()}`;
    const newUserId = `u_${Date.now()}`;
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    const newPlayer: Player = {
      id: newPlayerId,
      name,
      nickname: newPlayerForm.nickname.trim() || undefined,
      number: dorsal,
      position: newPlayerForm.position,
      avatarUrl: newPlayerForm.avatarUrl || DEFAULT_FACEBOOK_AVATAR,
      matches: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      isCalledUp: true,
      isStarter: false,
      mvpHistory: [],
    };

    const newUser: AppUser = {
      id: newUserId,
      name,
      email,
      username,
      password,
      role: 'player',
      avatarUrl: newPlayer.avatarUrl,
      playerId: newPlayerId,
      provider: 'email',
    };

    if (setPlayers) {
      setPlayers((prev) => [...prev, newPlayer]);
    }
    if (setUsers) {
      setUsers((prev) => [...prev, newUser]);
    }

    const invitation: TeamInvitation = {
      id: `inv_${Date.now()}`,
      email,
      playerName: name,
      teamName: displayTeamName,
      sentAt: new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      role: 'player',
      status: 'sent',
    };

    if (onInvitationSent) {
      onInvitationSent(invitation);
    }

    setLoginSuccess(`¡Cuenta creada con éxito! Se registró tu acceso a ${displayTeamName}.`);
    setTimeout(() => {
      onLoginSuccess(newUser, rememberDevice);
    }, 600);
  };

  // Handle "Quiero armar mi propio equipo" Submit
  const handleCreateTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTeamCreateError(null);

    const teamName = newTeamForm.name.trim();
    const dtName = newTeamForm.dtName.trim();
    const dtEmail = newTeamForm.dtEmail.trim().toLowerCase();
    const dtPassword = newTeamForm.dtPassword.trim();
    const dtConfirmPassword = newTeamForm.dtConfirmPassword.trim();

    if (!teamName) {
      setTeamCreateError('Ingresa el nombre de tu equipo.');
      return;
    }
    if (!dtName) {
      setTeamCreateError('Ingresa tu nombre como Director Técnico / Dueño.');
      return;
    }
    if (!dtEmail || !dtEmail.includes('@')) {
      setTeamCreateError('Ingresa un correo electrónico válido.');
      return;
    }
    if (!dtPassword || dtPassword.length < 3) {
      setTeamCreateError('Crea una contraseña de al menos 3 caracteres.');
      return;
    }
    if (dtPassword !== dtConfirmPassword) {
      setTeamCreateError('Las contraseñas no coinciden.');
      return;
    }

    const emailExists = allUsers.some(
      (u) => u.email.toLowerCase() === dtEmail
    );
    if (emailExists) {
      setTeamCreateError('Ya existe una cuenta con este correo. Inicia sesión en su lugar.');
      return;
    }

    // 1. Create the new Team
    const newTeamId = `team_${Date.now()}`;
    const createdTeam: TeamInfo = {
      id: newTeamId,
      name: teamName,
      shortName: teamName.length <= 4 ? teamName.toUpperCase() : teamName.substring(0, 3).toUpperCase(),
      logoUrl: newTeamForm.logoUrl || PRESET_CRESTS[0].url,
      bannerUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
      leagueName: newTeamForm.leagueName.trim() || 'Liga de Fútbol 7',
      season: 'Temporada 2026',
      stadium: 'Cancha Local',
      foundedYear: new Date().getFullYear().toString(),
      primaryColor: newTeamForm.primaryColor,
      secondaryColor: newTeamForm.secondaryColor,
    };

    // 2. Create the Owner user
    const ownerUserId = `u_owner_${Date.now()}`;
    const ownerPlayerId = `p_dt_${Date.now()}`;
    const ownerUsername = dtEmail.split('@')[0].replace(/[^a-z0-9]/g, '') || 'dt';

    const ownerUser: AppUser = {
      id: ownerUserId,
      name: dtName,
      email: dtEmail,
      username: ownerUsername,
      password: dtPassword,
      role: 'owner', // DT / Owner role with full management permissions!
      avatarUrl: DEFAULT_FACEBOOK_AVATAR,
      playerId: ownerPlayerId,
      provider: 'email',
    };

    // 3. Create initial DT player record for squad
    const dtPlayer: Player = {
      id: ownerPlayerId,
      name: dtName,
      nickname: 'DT',
      number: 1,
      position: 'MED',
      avatarUrl: DEFAULT_FACEBOOK_AVATAR,
      goals: 0,
      assists: 0,
      matches: 0,
      yellowCards: 0,
      redCards: 0,
      isCalledUp: true,
      isStarter: true,
      mvpHistory: [],
    };

    // Clear previous invite storage so the user is established in their new team
    try {
      localStorage.removeItem('teamgol_invited_team');
    } catch {
      // ignore
    }

    // Update global state
    if (setTeam) {
      setTeam(createdTeam);
    }
    if (setUsers) {
      setUsers((prev) => [ownerUser, ...prev]);
    }
    if (setPlayers) {
      setPlayers((prev) => [dtPlayer, ...prev]);
    }
    if (onTeamCreated) {
      onTeamCreated(createdTeam);
    }

    setLoginSuccess(`¡Equipo "${teamName}" creado con éxito! Bienvenido, Director Técnico.`);
    setTimeout(() => {
      onLoginSuccess(ownerUser, rememberDevice);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#050505] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#1877F2] selection:text-white">
      <div className="w-full max-w-md my-auto space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Official Dream Team App Header */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm border border-amber-300 ring-2 ring-white bg-white shrink-0">
            <img
              src={APP_LOGO_URL}
              alt={APP_NAME}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-black tracking-widest text-[#1877F2] uppercase bg-[#E7F3FF] border border-[#1877F2]/25 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
            <span>{APP_NAME}</span>
            <span className="text-[10px] text-amber-500 font-black">★</span>
            <span className="text-[10px] text-[#65676B] font-semibold">FUT 7</span>
          </span>
        </div>

        {/* Team Identity Card (uses invited team name & logo if invited, or user's new team in creation mode) */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            {displayTeamLogo ? (
              <img
                src={displayTeamLogo}
                alt={displayTeamName}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                className="w-20 h-20 rounded-2xl mx-auto object-cover shadow-xl ring-4 ring-white border-2 border-[#CED0D4] bg-white transition-all"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl mx-auto bg-gradient-to-tr from-[#1877F2] to-[#0866FF] text-white flex items-center justify-center shadow-xl ring-4 ring-white border-2 border-white">
                <Shield className="w-10 h-10" />
              </div>
            )}
            <span className="absolute -bottom-2 -right-1 bg-amber-400 text-black font-black text-[10px] px-2 py-0.5 rounded-full shadow-md border border-white">
              FUT 7
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#050505]">
              {displayTeamName}
            </h1>
            <p className="text-xs font-semibold text-[#65676B]">
              {activeTab === 'create_team'
                ? 'Panel de Creación y Dirección de Nuevo Club'
                : 'Portal Oficial de Convocatorias, Alineaciones y Partidos'}
            </p>
          </div>
        </div>

        {/* Invited Link Banner if accessed via invite URL / invitation */}
        {hasInvite && activeTab !== 'create_team' && (
          <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-2xl flex items-start gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="text-xs text-emerald-950 leading-relaxed">
              <span className="font-black block">¡Invitación Oficial de Equipo!</span>
              Has sido invitado a formar parte de <strong>{displayTeamName}</strong>. Crea tu cuenta o inicia sesión para ingresar al plantel.
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-[#CED0D4] shadow-xl p-6 space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 bg-[#F0F2F5] p-1.5 rounded-2xl border border-[#E4E6EB] gap-1">
            <button
              type="button"
              id="tab-login-mode"
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
                setRegisterError(null);
                setTeamCreateError(null);
              }}
              className={`py-2 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                activeTab === 'login'
                  ? 'bg-white text-[#1877F2] shadow-xs'
                  : 'text-[#65676B] hover:text-[#050505]'
              }`}
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Iniciar Sesión</span>
            </button>

            <button
              type="button"
              id="tab-register-mode"
              onClick={() => {
                setActiveTab('register');
                setLoginError(null);
                setRegisterError(null);
                setTeamCreateError(null);
              }}
              className={`py-2 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                activeTab === 'register'
                  ? 'bg-[#1877F2] text-white shadow-xs'
                  : 'text-[#65676B] hover:text-[#050505]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Crear Cuenta</span>
            </button>

            <button
              type="button"
              id="tab-create-team-mode"
              onClick={() => {
                setActiveTab('create_team');
                setLoginError(null);
                setRegisterError(null);
                setTeamCreateError(null);
              }}
              className={`py-2 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${
                activeTab === 'create_team'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-800 hover:text-amber-900'
              }`}
            >
              <Crown className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              <span className="truncate font-black">Mi Equipo</span>
            </button>
          </div>

          {/* Alert Messages */}
          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
              {loginError}
            </div>
          )}
          {registerError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
              {registerError}
            </div>
          )}
          {teamCreateError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
              {teamCreateError}
            </div>
          )}
          {loginSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{loginSuccess}</span>
            </div>
          )}

          {/* ================= FORM 1: LOGIN ================= */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#050505] mb-1.5">
                  Correo Electrónico o Usuario *
                </label>
                <div className="relative">
                  <input
                    id="input-login-identifier"
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-medium text-[#050505] focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden transition-all"
                  />
                  <Mail className="w-4 h-4 text-[#65676B] absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#050505] mb-1.5">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-medium text-[#050505] focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden transition-all"
                  />
                  <KeyRound className="w-4 h-4 text-[#65676B] absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-[#65676B] hover:text-[#050505] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember on this device checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1877F2] focus:ring-[#1877F2] border-[#CED0D4] cursor-pointer"
                />
                <span className="text-xs text-[#65676B] select-none">
                  Guardar inicio de sesión en este dispositivo
                </span>
              </label>

              {/* Submit button */}
              <button
                type="submit"
                id="btn-submit-login"
                className="w-full py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ingresar al Club</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Direct Call to Action for "Quiero armar mi propio equipo" */}
              <div className="pt-3 border-t border-[#CED0D4]/60 text-center space-y-2">
                <p className="text-[11px] text-[#65676B] font-medium">
                  ¿Eres Director Técnico o quieres crear tu propio club?
                </p>
                <button
                  type="button"
                  id="btn-switch-create-team"
                  onClick={() => {
                    setActiveTab('create_team');
                    setLoginError(null);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 border border-amber-300/80 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>Quiero armar mi propio equipo</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                </button>
              </div>
            </form>
          )}

          {/* ================= FORM 2: REGISTER AS PLAYER ================= */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#050505] mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newPlayerForm.name}
                  onChange={(e) => setNewPlayerForm({ ...newPlayerForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-medium text-[#050505] focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#050505] mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={newPlayerForm.email}
                  onChange={(e) => setNewPlayerForm({ ...newPlayerForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-medium text-[#050505] focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden"
                />
                <p className="text-[10px] text-[#65676B] mt-1">
                  * Se vinculará para que recibas notificaciones y convocatorias del equipo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#050505] mb-1">
                    Contraseña *
                  </label>
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    required
                    value={newPlayerForm.password}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-medium text-[#050505] focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#050505] mb-1">
                    Confirmar *
                  </label>
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    required
                    value={newPlayerForm.confirmPassword}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-medium text-[#050505] focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#050505] mb-1">
                    Dorsal Deseado *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={newPlayerForm.number}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-medium text-[#050505] focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#050505] mb-1">
                    Posición *
                  </label>
                  <select
                    value={newPlayerForm.position}
                    onChange={(e) => setNewPlayerForm({ ...newPlayerForm, position: e.target.value as PlayerPosition })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-medium text-[#050505] focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden cursor-pointer"
                  >
                    {ALL_POSITIONS.map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label} ({pos.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Photo section with camera capture & gallery upload */}
              <div className="p-3 bg-[#F0F2F5] rounded-2xl border border-[#CED0D4] space-y-2">
                <label className="block text-xs font-bold text-[#050505]">
                  Fotografía de Perfil
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={newPlayerForm.avatarUrl || DEFAULT_FACEBOOK_AVATAR}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_FACEBOOK_AVATAR;
                    }}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[#1877F2]/40 bg-white"
                  />

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      id="btn-register-camera"
                      onClick={() => {
                        setCameraTarget('player');
                        setIsCameraOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Tomar Foto</span>
                    </button>

                    <button
                      type="button"
                      id="btn-register-gallery"
                      onClick={() => fileInputPlayerRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white text-[#050505] text-xs font-bold border border-[#CED0D4] hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#1877F2]" />
                      <span>Galería</span>
                    </button>

                    <input
                      ref={fileInputPlayerRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePlayerPhotoUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Remember on this device checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1877F2] focus:ring-[#1877F2] border-[#CED0D4] cursor-pointer"
                />
                <span className="text-xs text-[#65676B] select-none">
                  Guardar inicio de sesión en este dispositivo
                </span>
              </label>

              <button
                type="submit"
                id="btn-submit-register"
                className="w-full py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Registrarme y Unirme al Club</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ================= FORM 3: QUIERO ARMAR MI PROPIO EQUIPO ================= */}
          {activeTab === 'create_team' && (
            <form onSubmit={handleCreateTeamSubmit} className="space-y-4">
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300/80 p-3 rounded-2xl flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-950">
                  <span className="font-black block">Crea tu Club como Director Técnico</span>
                  Tendrás control total para configurar convocatorias, armar alineaciones tácticas e invitar a tus jugadores por enlace o WhatsApp.
                </div>
              </div>

              {/* 1. Datos del Club */}
              <div className="space-y-3">
                <div className="text-[11px] font-black uppercase text-[#65676B] tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#1877F2]" />
                  <span>1. Identidad de tu Club</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#050505] mb-1">
                    Nombre del Equipo *
                  </label>
                  <input
                    id="input-create-team-name"
                    type="text"
                    required
                    value={newTeamForm.name}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-bold text-[#050505] focus:ring-2 focus:ring-amber-500 focus:bg-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#050505] mb-1">
                    Liga o Categoría
                  </label>
                  <input
                    type="text"
                    value={newTeamForm.leagueName}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, leagueName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-medium text-[#050505] focus:ring-2 focus:ring-amber-500 focus:bg-white outline-hidden"
                  />
                </div>

                {/* Crest Selection */}
                <div>
                  <label className="block text-xs font-bold text-[#050505] mb-1.5">
                    Escudo del Club
                  </label>

                  {/* Preset quick selection */}
                  <div className="grid grid-cols-4 gap-2 mb-2.5">
                    {PRESET_CRESTS.map((crest) => (
                      <button
                        key={crest.name}
                        type="button"
                        onClick={() => setNewTeamForm({ ...newTeamForm, logoUrl: crest.url })}
                        className={`p-1.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1 cursor-pointer bg-[#F0F2F5] hover:bg-white ${
                          newTeamForm.logoUrl === crest.url
                            ? 'border-amber-500 ring-2 ring-amber-400/40 bg-white'
                            : 'border-transparent'
                        }`}
                      >
                        <img
                          src={crest.url}
                          alt={crest.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover shadow-xs"
                        />
                        <span className="text-[9px] font-bold text-[#65676B] truncate w-full text-center">
                          {crest.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Custom upload or camera */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      id="btn-team-crest-camera"
                      onClick={() => {
                        setCameraTarget('team');
                        setIsCameraOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Tomar Foto Escudo</span>
                    </button>

                    <button
                      type="button"
                      id="btn-team-crest-gallery"
                      onClick={() => fileInputTeamRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white text-[#050505] text-xs font-bold border border-[#CED0D4] hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span>Subir Imagen</span>
                    </button>

                    <input
                      ref={fileInputTeamRef}
                      type="file"
                      accept="image/*"
                      onChange={handleTeamLogoUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Club Primary Color */}
                <div>
                  <label className="block text-xs font-bold text-[#050505] mb-1.5 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-[#65676B]" />
                    <span>Color Primario del Club</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setNewTeamForm({ ...newTeamForm, primaryColor: col.hex })}
                        style={{ backgroundColor: col.hex }}
                        className={`w-7 h-7 rounded-full shadow-xs cursor-pointer transition-transform flex items-center justify-center ${
                          newTeamForm.primaryColor === col.hex ? 'ring-3 ring-black/30 scale-110' : 'hover:scale-105'
                        }`}
                        title={col.name}
                      >
                        {newTeamForm.primaryColor === col.hex && (
                          <CheckCheck className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                        )}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={newTeamForm.primaryColor}
                      onChange={(e) => setNewTeamForm({ ...newTeamForm, primaryColor: e.target.value })}
                      className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer overflow-hidden shadow-xs"
                      title="Elegir color personalizado"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Datos del Dueño / DT */}
              <div className="space-y-3 pt-2 border-t border-[#CED0D4]/70">
                <div className="text-[11px] font-black uppercase text-[#65676B] tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>2. Tu Cuenta de Director Técnico (DT)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#050505] mb-1">
                    Nombre Completo del DT / Dueño *
                  </label>
                  <input
                    id="input-create-team-dt-name"
                    type="text"
                    required
                    value={newTeamForm.dtName}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, dtName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-medium text-[#050505] focus:ring-2 focus:ring-amber-500 focus:bg-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#050505] mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    id="input-create-team-dt-email"
                    type="email"
                    required
                    value={newTeamForm.dtEmail}
                    onChange={(e) => setNewTeamForm({ ...newTeamForm, dtEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-medium text-[#050505] focus:ring-2 focus:ring-amber-500 focus:bg-white outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-[#050505] mb-1">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showDtPassword ? 'text' : 'password'}
                        required
                        value={newTeamForm.dtPassword}
                        onChange={(e) => setNewTeamForm({ ...newTeamForm, dtPassword: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-medium text-[#050505] focus:ring-2 focus:ring-amber-500 focus:bg-white outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDtPassword(!showDtPassword)}
                        className="absolute right-2.5 top-2 text-[#65676B] hover:text-[#050505] cursor-pointer"
                      >
                        {showDtPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#050505] mb-1">
                      Confirmar *
                    </label>
                    <input
                      type={showDtPassword ? 'text' : 'password'}
                      required
                      value={newTeamForm.dtConfirmPassword}
                      onChange={(e) => setNewTeamForm({ ...newTeamForm, dtConfirmPassword: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-medium text-[#050505] focus:ring-2 focus:ring-amber-500 focus:bg-white outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Remember on this device checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-[#CED0D4] cursor-pointer"
                />
                <span className="text-xs text-[#65676B] select-none">
                  Guardar inicio de sesión en este dispositivo
                </span>
              </label>

              {/* Create Team Submit Button */}
              <button
                type="submit"
                id="btn-submit-create-team"
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>¡Crear mi Equipo y Comenzar a Invitar!</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Security / Device Recognition Footer Notice */}
        <div className="text-center text-[11px] text-[#65676B] space-y-1">
          <p className="flex items-center justify-center gap-1 font-semibold">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Al iniciar sesión, este dispositivo quedará recordado automáticamente.</span>
          </p>
          <p className="text-[10px] text-[#65676B]/80">
            Podrás cerrar sesión o cambiar de cuenta en cualquier momento.
          </p>
        </div>
      </div>

      {/* Camera Capture Modal for Player Avatar or Team Crest */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          if (cameraTarget === 'team') {
            setNewTeamForm((prev) => ({ ...prev, logoUrl: dataUrl }));
          } else {
            setNewPlayerForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
          }
        }}
        title={cameraTarget === 'team' ? 'Tomar Foto del Escudo' : 'Tomar Foto del Jugador'}
        subtitle={
          cameraTarget === 'team'
            ? 'Encuadra el escudo, playera o insignia del club'
            : 'Centra tu rostro dentro del círculo'
        }
        playerName={cameraTarget === 'team' ? newTeamForm.name : newPlayerForm.name}
      />
    </div>
  );
};
