import React, { useState, useEffect } from 'react';
import {
  User,
  Crown,
  Lock,
  X,
  Check,
  UserPlus,
  ArrowRight,
  Sparkles,
  LogIn,
  Mail,
  Camera,
  Upload,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  LogOut,
  Megaphone,
} from 'lucide-react';
import {
  AppUser,
  Language,
  Player,
  TeamInfo,
  PlayerPosition,
  DEFAULT_FACEBOOK_AVATAR,
  ALL_POSITIONS,
  TeamInvitation,
  TeamJoinRequest,
} from '../types';
import { getT } from '../utils/translations';
import { CameraCaptureModal } from './CameraCaptureModal';
import { APP_NAME, APP_LOGO_URL } from '../assets/branding';
import { supabaseUpsertUser, supabaseUpsertJoinRequest, isSupabaseConfigured } from '../services/supabaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;
  allUsers: AppUser[];
  setUsers?: React.Dispatch<React.SetStateAction<AppUser[]>>;
  players?: Player[];
  setPlayers?: React.Dispatch<React.SetStateAction<Player[]>>;
  team?: TeamInfo;
  language: Language;
  invitedTeamName?: string | null;
  joinFanTeam?: { id: string; name: string; logoUrl?: string } | null;
  onFanJoinRequest?: (req: TeamJoinRequest) => void;
  onJoinSuccess?: (playerName: string) => void;
  onInvitationSent?: (invitation: TeamInvitation) => void;
  defaultMode?: 'login' | 'register' | 'switch';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  setCurrentUser,
  allUsers,
  setUsers,
  players = [],
  setPlayers,
  team,
  language,
  invitedTeamName,
  joinFanTeam,
  onFanJoinRequest,
  onJoinSuccess,
  onInvitationSent,
  defaultMode = 'login',
}) => {
  const t = getT(language);
  const [activeMode, setActiveMode] = useState<'login' | 'register'>(
    invitedTeamName || joinFanTeam ? 'register' : (defaultMode === 'register' ? 'register' : 'login')
  );
  const [registerRole, setRegisterRole] = useState<'player' | 'fan'>(
    joinFanTeam ? 'fan' : 'player'
  );

  useEffect(() => {
    if (joinFanTeam) {
      setActiveMode('register');
      setRegisterRole('fan');
    } else if (invitedTeamName) {
      setActiveMode('register');
    }
  }, [joinFanTeam, invitedTeamName]);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Register form state
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
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanInput = loginIdentifier.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanInput) {
      setLoginError('Por favor ingresa tu correo electrónico o nombre de usuario.');
      return;
    }
    if (!cleanPass) {
      setLoginError('Por favor ingresa tu contraseña.');
      return;
    }

    // Find user by email or username (case-insensitive)
    const matchedUser = allUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        u.email.split('@')[0].toLowerCase() === cleanInput ||
        (u.username && u.username.toLowerCase() === cleanInput)
    );

    if (!matchedUser) {
      // Special check: if user entered admin with agbl141201@gmail.com or admin
      if (cleanInput === 'admin' || cleanInput === 'agbl141201@gmail.com') {
        if (cleanPass === 'root') {
          // Fallback create admin if not found in list
          const fallbackAdmin: AppUser = {
            id: 'u_admin',
            name: 'Administrador (Admin)',
            email: 'agbl141201@gmail.com',
            username: 'admin',
            password: 'root',
            role: 'owner',
            avatarUrl: DEFAULT_FACEBOOK_AVATAR,
            playerId: 'p_1',
            teamId: 'team_01',
            provider: 'email',
          };
          if (setUsers) setUsers((prev) => [fallbackAdmin, ...prev]);
          setCurrentUser(fallbackAdmin);
          setLoginSuccess('¡Bienvenido Administrador!');
          setTimeout(() => {
            onClose();
            setLoginSuccess(null);
          }, 800);
          return;
        }
      }

      setLoginError('No encontramos una cuenta con ese correo o usuario. Si eres nuevo, por favor regístrate.');
      return;
    }

    // Verify password
    const userPass =
      matchedUser.password ||
      (matchedUser.role === 'owner'
        ? 'root'
        : matchedUser.role === 'league_admin'
        ? 'admin'
        : '123');
    if (userPass !== cleanPass) {
      setLoginError('Contraseña incorrecta. Verifica tu contraseña.');
      return;
    }

    // Success login
    setCurrentUser(matchedUser);
    setLoginSuccess(`¡Bienvenido de nuevo, ${matchedUser.name.split(' ')[0]}!`);
    setTimeout(() => {
      onClose();
      setLoginSuccess(null);
    }, 700);
  };

  // Quick filler for testing
  const fillAdminCredentials = () => {
    setLoginIdentifier('admin');
    setLoginPassword('root');
    setLoginError(null);
  };

  const fillPlayerCredentials = () => {
    const samplePlayer = allUsers.find((u) => u.role === 'player') || allUsers[1];
    if (samplePlayer) {
      setLoginIdentifier(samplePlayer.email || samplePlayer.username || '');
      setLoginPassword(samplePlayer.password || '123');
    } else {
      setLoginIdentifier('andres.trevino@dreamteam.com');
      setLoginPassword('123');
    }
    setLoginError(null);
  };

  // File upload for avatar
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // Handle Register (Jugador o Aficionado)
  const handleRegisterNewPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationError(null);

    const name = newPlayerForm.name.trim();
    const rawEmailInput = newPlayerForm.email.trim().toLowerCase();
    const expectedDomain = registerRole === 'fan' ? '@dmaficion.com' : '@dreamteam.com';
    if (rawEmailInput.includes('@') && !rawEmailInput.endsWith(expectedDomain)) {
      setRegistrationError(
        `El correo para ${registerRole === 'fan' ? 'Aficionado' : 'Jugador'} debe usar el dominio ${expectedDomain}.`
      );
      return;
    }
    const rawPrefix = rawEmailInput.split('@')[0].replace(/\s+/g, '').toLowerCase();
    const password = newPlayerForm.password.trim();
    const confirmPassword = newPlayerForm.confirmPassword.trim();

    if (!name) {
      setRegistrationError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!rawPrefix) {
      setRegistrationError('Por favor ingresa el inicio de tu correo (antes del @) para crear tu cuenta.');
      return;
    }
    const email = `${rawPrefix}${expectedDomain}`;
    if (!password || password.length < 3) {
      setRegistrationError('Por favor define una contraseña de al menos 3 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setRegistrationError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    // Check if email already exists
    const emailExists = allUsers.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (emailExists) {
      setRegistrationError('Ya existe una cuenta con este correo electrónico. Inicia sesión en su lugar.');
      return;
    }

    const newUserId = `u-${Date.now()}`;
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const avatarUrl = newPlayerForm.avatarUrl || DEFAULT_FACEBOOK_AVATAR;

    if (registerRole === 'fan') {
      const fanUser: AppUser = {
        id: newUserId,
        name,
        email,
        username,
        password,
        role: 'fan',
        avatarUrl,
        teamId: undefined,
        teamIds: [],
        teamJoinStatus: joinFanTeam ? 'pending' : 'none',
        requestedTeamId: joinFanTeam?.id,
        requestedTeamName: joinFanTeam?.name,
        provider: 'email',
      };

      if (setUsers) {
        setUsers((prev) => [...prev, fanUser]);
      }
      if (isSupabaseConfigured()) {
        supabaseUpsertUser(fanUser);
      }

      if (joinFanTeam) {
        const fanReq: TeamJoinRequest = {
          id: `req_fan_${Date.now()}_${joinFanTeam.id}`,
          userId: newUserId,
          userName: name,
          playerName: name,
          userEmail: email,
          playerEmail: email,
          userAvatar: avatarUrl,
          playerAvatar: avatarUrl,
          teamId: joinFanTeam.id,
          teamName: joinFanTeam.name,
          teamLogo: joinFanTeam.logoUrl,
          requestType: 'fan',
          status: 'pending',
          createdAt: new Date().toISOString(),
          requestedAt: new Date().toISOString(),
          mensaje: 'Desea unirse como Aficionado Oficial / Porra',
        };
        if (onFanJoinRequest) {
          onFanJoinRequest(fanReq);
        }
        if (isSupabaseConfigured()) {
          supabaseUpsertJoinRequest(fanReq);
        }
      }

      setCurrentUser(fanUser);
      if (onJoinSuccess) {
        onJoinSuccess(fanUser.name);
      }
      onClose();
      return;
    }

    const num = parseInt(newPlayerForm.number, 10) || Math.floor(Math.random() * 89) + 10;
    const newPlayerId = `p-${Date.now()}`;

    const newPlayer: Player = {
      id: newPlayerId,
      name,
      nickname: newPlayerForm.nickname.trim() || undefined,
      number: num,
      position: newPlayerForm.position,
      avatarUrl,
      matches: 0,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      isCalledUp: true,
      isStarter: false,
      mvpHistory: [],
      phone: '',
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
      teamId: undefined,
      teamIds: [],
      teamJoinStatus: 'none',
      position: newPlayerForm.position,
      jerseyNumber: num,
      provider: 'email',
    };

    if (setPlayers) {
      setPlayers((prev) => [...prev, newPlayer]);
    }
    if (setUsers) {
      setUsers((prev) => [...prev, newUser]);
    }

    if (isSupabaseConfigured()) {
      supabaseUpsertUser(newUser);
    }

    setCurrentUser(newUser);

    const invitation: TeamInvitation = {
      id: `inv-${Date.now()}`,
      email,
      playerName: name,
      teamName: team?.name || 'Club Fútbol 7',
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

    if (onJoinSuccess) {
      onJoinSuccess(newPlayer.name);
    }

    onClose();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-[#CED0D4] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 relative text-[#050505] animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#65676B] hover:text-[#050505] bg-[#F0F2F5] hover:bg-[#E4E6EB] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <img
              src={APP_LOGO_URL}
              alt={APP_NAME}
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-lg object-cover ring-1 ring-amber-300"
            />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#1877F2]">
              {APP_NAME}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#E7F3FF] text-[#1877F2] flex items-center justify-center mx-auto border border-[#1877F2]/20 shadow-xs">
            {activeMode === 'register' ? (
              <UserPlus className="w-6 h-6 text-[#1877F2]" />
            ) : (
              <Lock className="w-6 h-6 text-[#1877F2]" />
            )}
          </div>
          <h3 className="text-xl font-black text-[#050505]">
            {activeMode === 'login'
              ? 'Iniciar Sesión'
              : registerRole === 'fan'
              ? 'Registro de Aficionado / Porra'
              : 'Registro de Jugador'}
          </h3>
          <p className="text-xs text-[#65676B] font-medium">
            {joinFanTeam
              ? `Porra Oficial de ${joinFanTeam.name}`
              : team
              ? `${team.name} • Fútbol 7 Oficial`
              : 'Gestión del Club'}
          </p>
        </div>

        {/* Invite Banner if invited via URL */}
        {joinFanTeam && (
          <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl flex items-start gap-2.5">
            <Megaphone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 leading-relaxed">
              <span className="font-black">¡Porra Oficial de {joinFanTeam.name}!</span> Regístrate como Aficionado para apoyar en partidos, comentar en el muro y votar por el MVP.
            </div>
          </div>
        )}
        {!joinFanTeam && invitedTeamName && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <span className="font-black">¡Invitación Especial!</span> Has recibido un enlace para unirte como jugador a <strong className="text-emerald-700">{invitedTeamName}</strong>. Crea tu cuenta para recibir la confirmación en tu correo.
            </div>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex bg-[#F0F2F5] p-1 rounded-xl border border-[#E4E6EB]">
          <button
            type="button"
            onClick={() => {
              setActiveMode('login');
              setLoginError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeMode === 'login'
                ? 'bg-white text-[#1877F2] shadow-xs'
                : 'text-[#65676B] hover:text-[#050505]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('register');
              setRegistrationError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeMode === 'register'
                ? 'bg-[#1877F2] text-white shadow-xs'
                : 'text-[#65676B] hover:text-[#050505]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {/* ================= MODE 1: LOGIN ================= */}
        {activeMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
            {loginError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                {loginError}
              </div>
            )}
            {loginSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{loginSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#050505] mb-1">
                Correo Electrónico o Usuario *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden font-medium"
                />
                <Mail className="w-4 h-4 text-[#65676B] absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#050505] mb-1">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden font-medium"
                />
                <KeyRound className="w-4 h-4 text-[#65676B] absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#65676B] hover:text-[#050505] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Ingresar al Club</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ================= MODE 2: REGISTER ================= */}
        {activeMode === 'register' && (
          <form onSubmit={handleRegisterNewPlayer} className="space-y-3 pt-1 max-h-[65vh] overflow-y-auto pr-1">
            {registrationError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in">
                {registrationError}
              </div>
            )}

            {/* Role Toggle: Jugador vs Aficionado / Porra */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F0F2F5] border border-[#CED0D4]">
              <button
                type="button"
                onClick={() => {
                  setRegisterRole('player');
                  setRegistrationError(null);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  registerRole === 'player'
                    ? 'bg-white text-[#1877F2] shadow-xs'
                    : 'text-[#65676B] hover:text-[#050505]'
                }`}
              >
                ⚽ Jugador
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegisterRole('fan');
                  setRegistrationError(null);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  registerRole === 'fan'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-[#65676B] hover:text-[#050505]'
                }`}
              >
                📣 Aficionado / Porra
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#050505] mb-1">
                {registerRole === 'fan' ? 'Nombre Completo del Aficionado *' : 'Nombre Completo del Jugador *'}
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Rodrigo Mendoza"
                value={newPlayerForm.name}
                onChange={(e) =>
                  setNewPlayerForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#050505] mb-1">
                Correo Electrónico Oficial * (Solo escribe antes del @)
              </label>
              <div className="flex items-center rounded-xl bg-[#F0F2F5] border border-[#CED0D4] focus-within:ring-2 focus-within:ring-[#1877F2] focus-within:bg-white overflow-hidden transition-all">
                <input
                  type="text"
                  required
                  placeholder={registerRole === 'fan' ? 'ej. maria.porra' : 'ej. rodrigo.mendoza'}
                  value={newPlayerForm.email}
                  onChange={(e) => {
                    const cleanPrefix = e.target.value.split('@')[0].replace(/\s+/g, '').toLowerCase();
                    setNewPlayerForm((prev) => ({ ...prev, email: cleanPrefix }));
                  }}
                  className="flex-1 min-w-0 px-3 py-2 bg-transparent text-xs font-medium text-[#050505] outline-hidden"
                />
                <span className={`px-3 py-2 bg-[#E4E6EB]/80 border-l border-[#CED0D4] text-xs font-bold select-none shrink-0 ${
                  registerRole === 'fan' ? 'text-amber-700' : 'text-[#1877F2]'
                }`}>
                  {registerRole === 'fan' ? '@dmaficion.com' : '@dreamteam.com'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-[#050505] mb-1">
                  Crear Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 3 caracteres"
                    value={newPlayerForm.password}
                    onChange={(e) =>
                      setNewPlayerForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full px-3 py-2 pr-8 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-2.5 top-2.5 text-[#65676B] hover:text-[#050505] cursor-pointer"
                  >
                    {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#050505] mb-1">
                  Confirmar Contraseña *
                </label>
                <input
                  type={showRegisterPassword ? 'text' : 'password'}
                  required
                  placeholder="Repite tu contraseña"
                  value={newPlayerForm.confirmPassword}
                  onChange={(e) =>
                    setNewPlayerForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden"
                />
              </div>
            </div>

            {registerRole === 'player' && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#050505] mb-1">
                    Apodo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. El Rayo"
                    value={newPlayerForm.nickname}
                    onChange={(e) =>
                      setNewPlayerForm((prev) => ({ ...prev, nickname: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#050505] mb-1">
                    Dorsal #
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    placeholder="10"
                    value={newPlayerForm.number}
                    onChange={(e) =>
                      setNewPlayerForm((prev) => ({ ...prev, number: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#050505] mb-1">
                    Posición
                  </label>
                  <select
                    value={newPlayerForm.position}
                    onChange={(e) =>
                      setNewPlayerForm((prev) => ({
                        ...prev,
                        position: e.target.value as PlayerPosition,
                      }))
                    }
                    className="w-full px-2 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden cursor-pointer"
                  >
                    <option value="POR">Portero (POR)</option>
                    <option value="DEF">Defensa (DEF)</option>
                    <option value="MED">Medio (MED)</option>
                    <option value="DEL">Delantero (DEL)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Player Photo (Camera, File, or Default) */}
            <div className="bg-[#F0F2F5] p-3 rounded-xl border border-[#CED0D4] space-y-2">
              <span className="text-[11px] font-bold text-[#050505] block">
                Foto de Perfil del Jugador:
              </span>
              <div className="flex items-center gap-3">
                <img
                  src={newPlayerForm.avatarUrl || DEFAULT_FACEBOOK_AVATAR}
                  alt="Avatar preview"
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#1877F2] shadow-xs shrink-0"
                />
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#E4E6EB] text-[#1877F2] border border-[#1877F2]/30 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Tomar Foto</span>
                  </button>

                  <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#E4E6EB] text-[#050505] border border-[#CED0D4] text-xs font-bold shadow-xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#65676B]" />
                    <span>Subir</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Registrarme y Enviar Invitación al Correo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Camera capture modal for registration avatar */}
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(photoDataUrl) => {
            setNewPlayerForm((prev) => ({ ...prev, avatarUrl: photoDataUrl }));
            setIsCameraOpen(false);
          }}
          title="Tomar Foto del Jugador"
        />
      </div>
    </div>
  );
};
