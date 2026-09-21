import React, { useState } from 'react';
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

interface LoginScreenProps {
  team: TeamInfo;
  allUsers: AppUser[];
  setUsers?: React.Dispatch<React.SetStateAction<AppUser[]>>;
  players: Player[];
  setPlayers?: React.Dispatch<React.SetStateAction<Player[]>>;
  onLoginSuccess: (user: AppUser, rememberDevice: boolean) => void;
  onInvitationSent?: (invitation: TeamInvitation) => void;
  language: Language;
  invitedTeamName?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  team,
  allUsers,
  setUsers,
  players,
  setPlayers,
  onLoginSuccess,
  onInvitationSent,
  invitedTeamName,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    invitedTeamName ? 'register' : 'login'
  );

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);

  // Registration form state
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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Quick fill admin credentials
  const fillAdmin = () => {
    setLoginIdentifier('admin');
    setLoginPassword('root');
    setLoginError(null);
  };

  // Quick fill sample player
  const fillPlayer = () => {
    const playerUser = allUsers.find((u) => u.role === 'player') || allUsers[1];
    if (playerUser) {
      setLoginIdentifier(playerUser.username || playerUser.email);
      setLoginPassword(playerUser.password || '123');
    } else {
      setLoginIdentifier('andres.trevino@teamgol.com');
      setLoginPassword('123');
    }
    setLoginError(null);
  };

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
      }, 600);
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
        'No encontramos una cuenta con ese correo o usuario. Si eres nuevo, regístrate en la pestaña "Crear Cuenta".'
      );
      return;
    }

    const expectedPass =
      matchedUser.password || (matchedUser.role === 'owner' ? 'root' : '123');

    if (expectedPass !== pass) {
      setLoginError('Contraseña incorrecta. Por favor intenta nuevamente.');
      return;
    }

    setLoginSuccess(`¡Bienvenido de nuevo, ${matchedUser.name.split(' ')[0]}!`);
    setTimeout(() => {
      onLoginSuccess(matchedUser, rememberDevice);
    }, 600);
  };

  // Handle Photo upload from gallery
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Handle Registration Submit
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
      setRegisterError('Ya existe una cuenta con este correo. Inicia sesión en su lugar.');
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
      role: 'player', // Regular user registering is a player with player-level permissions
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

    // Send Team Invitation record to the specified email
    const invitation: TeamInvitation = {
      id: `inv_${Date.now()}`,
      email,
      playerName: name,
      teamName: team.name,
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

    setLoginSuccess(`¡Cuenta creada con éxito! Se envió la invitación a ${email}.`);
    setTimeout(() => {
      onLoginSuccess(newUser, rememberDevice);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#050505] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#1877F2] selection:text-white">
      {/* Background Subtle Stadium Aesthetic */}
      <div className="w-full max-w-md my-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Team Identity Card */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={team.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                className="w-20 h-20 rounded-2xl mx-auto object-cover shadow-xl ring-4 ring-white border-2 border-[#CED0D4] bg-white"
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
              {team.name}
            </h1>
            <p className="text-xs font-semibold text-[#65676B]">
              Portal Oficial de Convocatorias, Alineaciones y Partidos
            </p>
          </div>
        </div>

        {/* Invited Link Banner if accessed via share URL */}
        {invitedTeamName && (
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-start gap-3 shadow-xs">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 leading-relaxed">
              <span className="font-bold block">¡Invitación de Equipo!</span>
              Has sido invitado a formar parte de <strong>{invitedTeamName}</strong>. Crea tu cuenta para recibir la confirmación a tu correo.
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-[#CED0D4] shadow-xl p-6 space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-[#F0F2F5] p-1.5 rounded-2xl border border-[#E4E6EB]">
            <button
              type="button"
              id="tab-login-mode"
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-[#1877F2] shadow-xs'
                  : 'text-[#65676B] hover:text-[#050505]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              id="tab-register-mode"
              onClick={() => {
                setActiveTab('register');
                setRegisterError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-[#1877F2] text-white shadow-xs'
                  : 'text-[#65676B] hover:text-[#050505]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Crear Cuenta</span>
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
          {loginSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{loginSuccess}</span>
            </div>
          )}

          {/* ================= FORM 1: LOGIN ================= */}
          {activeTab === 'login' ? (
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
                    placeholder="admin o agbl141201@gmail.com"
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
                    placeholder="Tu contraseña (ej. root para admin)"
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

              {/* Quick access testing pills */}
              <div className="bg-[#F0F2F5] p-3 rounded-2xl border border-[#CED0D4]/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#65676B] tracking-wider">
                    Cuentas Preconfiguradas:
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> Listo
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="btn-quick-admin"
                    onClick={fillAdmin}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-left text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <div className="truncate">
                      <div className="truncate">Admin Dueño</div>
                      <div className="text-[10px] text-amber-700/80 font-normal">admin / root</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="btn-quick-player"
                    onClick={fillPlayer}
                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-left text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#1877F2] shrink-0" />
                    <div className="truncate">
                      <div className="truncate">Jugador Roster</div>
                      <div className="text-[10px] text-blue-700/80 font-normal">andres9 / 123</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                id="btn-submit-login"
                className="w-full py-3 px-4 rounded-2xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ingresar al Club</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* ================= FORM 2: REGISTER ================= */
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
                  placeholder="ej. Santiago Giménez"
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
                  placeholder="tu.correo@ejemplo.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-medium text-[#050505] focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden"
                />
                <p className="text-[10px] text-[#65676B] mt-1">
                  * A este correo se enviará la invitación oficial para unirte al equipo.
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
                    placeholder="Mínimo 3 caract."
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
                    placeholder="Repite clave"
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
                  Fotografía de Perfil (Para Convocatorias y MVP)
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
                      onClick={() => setIsCameraOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Tomar Foto</span>
                    </button>

                    <button
                      type="button"
                      id="btn-register-gallery"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white text-[#050505] text-xs font-bold border border-[#CED0D4] hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#1877F2]" />
                      <span>Galería</span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
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
        </div>

        {/* Security / Device Recognition Footer Notice */}
        <div className="text-center text-[11px] text-[#65676B] space-y-1">
          <p className="flex items-center justify-center gap-1 font-semibold">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Al iniciar sesión, este dispositivo quedará recordado automáticamente.</span>
          </p>
          <p className="text-[10px] text-[#65676B]/80">
            Podrás cerrar sesión en cualquier momento desde el menú de usuario.
          </p>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          setNewPlayerForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
        }}
        title="Tomar Foto del Jugador"
        subtitle="Centra tu rostro dentro del círculo"
        playerName={newPlayerForm.name}
        dorsal={newPlayerForm.number}
      />
    </div>
  );
};
