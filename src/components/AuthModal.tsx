import React, { useState } from 'react';
import {
  User,
  Crown,
  Lock,
  X,
  Check,
  UserPlus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AppUser, Language, Player, TeamInfo, PlayerPosition, DEFAULT_FACEBOOK_AVATAR, ALL_POSITIONS } from '../types';
import { getT } from '../utils/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  allUsers: AppUser[];
  setUsers?: React.Dispatch<React.SetStateAction<AppUser[]>>;
  players?: Player[];
  setPlayers?: React.Dispatch<React.SetStateAction<Player[]>>;
  team?: TeamInfo;
  language: Language;
  invitedTeamName?: string | null;
  onJoinSuccess?: (playerName: string) => void;
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
  onJoinSuccess,
}) => {
  const t = getT(language);
  const [activeMode, setActiveMode] = useState<'switch' | 'register'>(
    invitedTeamName ? 'register' : 'switch'
  );

  // New Player Registration state
  const [newPlayerForm, setNewPlayerForm] = useState({
    name: '',
    nickname: '',
    email: '',
    number: '',
    position: 'DEL' as PlayerPosition,
  });
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegisterNewPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerForm.name.trim()) {
      setRegistrationError('Por favor ingresa tu nombre completo.');
      return;
    }
    const num = parseInt(newPlayerForm.number, 10) || Math.floor(Math.random() * 89) + 10;
    const cleanEmail = newPlayerForm.email.trim() || `${newPlayerForm.name.toLowerCase().replace(/\s+/g, '.')}@club.com`;
    const newPlayerId = `p-${Date.now()}`;
    const newUserId = `u-${Date.now()}`;

    const newPlayer: Player = {
      id: newPlayerId,
      name: newPlayerForm.name.trim(),
      nickname: newPlayerForm.nickname.trim() || undefined,
      number: num,
      position: newPlayerForm.position,
      avatarUrl: DEFAULT_FACEBOOK_AVATAR,
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
      name: newPlayerForm.name.trim(),
      email: cleanEmail,
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

    setCurrentUser(newUser);
    if (onJoinSuccess) {
      onJoinSuccess(newPlayer.name);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-[#CED0D4] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 relative text-[#050505]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#65676B] hover:text-[#050505] bg-[#F0F2F5] hover:bg-[#E4E6EB] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-[#E7F3FF] text-[#1877F2] flex items-center justify-center mx-auto border border-[#1877F2]/20 shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-[#050505]">
            {activeMode === 'register' ? 'Unirse al Equipo' : 'Iniciar Sesión / Cambiar Perfil'}
          </h3>
          <p className="text-xs text-[#65676B] font-medium">
            {team ? `${team.name} • Fútbol 7` : 'Gestión de Club'}
          </p>
        </div>

        {/* Invite Banner if applicable */}
        {invitedTeamName && (
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <span className="font-black">¡Invitación Especial!</span> Has recibido un enlace para unirte como jugador a <strong className="text-emerald-700">{invitedTeamName}</strong>. Completa tus datos para ver convocatorias, alineaciones y calendario.
            </div>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex bg-[#F0F2F5] p-1 rounded-xl border border-[#E4E6EB]">
          <button
            type="button"
            onClick={() => setActiveMode('switch')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeMode === 'switch'
                ? 'bg-white text-[#1877F2] shadow-xs'
                : 'text-[#65676B] hover:text-[#050505]'
            }`}
          >
            Cuentas del Equipo
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('register')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'register'
                ? 'bg-[#1877F2] text-white shadow-xs'
                : 'text-[#65676B] hover:text-[#050505]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Nuevo Jugador
          </button>
        </div>

        {/* Tab 1: Fast Switch Profile */}
        {activeMode === 'switch' && (
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#65676B] block">
              Selecciona tu cuenta activa:
            </span>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
              {allUsers.map((user) => {
                const isSelected = user.id === currentUser.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      setCurrentUser(user);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#E7F3FF] border-[#1877F2]/40 text-[#050505]'
                        : 'bg-[#F0F2F5] border-[#CED0D4]/70 hover:border-[#1877F2]/40 text-[#050505]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-[#CED0D4]"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">
                          {user.name}
                        </span>
                        <span className="text-[11px] text-[#65676B] flex items-center gap-1 font-medium">
                          {user.role === 'owner' ? (
                            <span className="text-amber-600 font-bold flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5" /> Dueño
                            </span>
                          ) : (
                            <span className="text-[#1877F2] font-bold flex items-center gap-0.5">
                              <User className="w-2.5 h-2.5" /> Jugador
                            </span>
                          )}
                          <span>• {user.email}</span>
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#1877F2] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Register New Player & Join Team */}
        {activeMode === 'register' && (
          <form onSubmit={handleRegisterNewPlayer} className="space-y-3 pt-1">
            {registrationError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {registrationError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#050505] mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Santiago Cruz"
                value={newPlayerForm.name}
                onChange={(e) =>
                  setNewPlayerForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-[#050505] mb-1">
                  Apodo / Nickname
                </label>
                <input
                  type="text"
                  placeholder="Ej. El Tanque"
                  value={newPlayerForm.nickname}
                  onChange={(e) =>
                    setNewPlayerForm((prev) => ({ ...prev, nickname: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#050505] mb-1">
                  Dorsal (Número)
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  placeholder="Ej. 10"
                  value={newPlayerForm.number}
                  onChange={(e) =>
                    setNewPlayerForm((prev) => ({ ...prev, number: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-[#050505] mb-1">
                  Posición en Cancha
                </label>
                <select
                  value={newPlayerForm.position}
                  onChange={(e) =>
                    setNewPlayerForm((prev) => ({
                      ...prev,
                      position: e.target.value as PlayerPosition,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden cursor-pointer"
                >
                  <optgroup label="🧤 Portería">
                    {ALL_POSITIONS.filter((p) => p.category === 'POR').map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="🛡️ Defensas (Centrales, Laterales, Carrileros)">
                    {ALL_POSITIONS.filter((p) => p.category === 'DEF').map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="⚡ Mediocampo (MCD, MC, MCO, MI, MD)">
                    {ALL_POSITIONS.filter((p) => p.category === 'MED').map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="⚽ Delantera (Extremos, Centro, Segundos)">
                    {ALL_POSITIONS.filter((p) => p.category === 'DEL').map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#050505] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={newPlayerForm.email}
                  onChange={(e) =>
                    setNewPlayerForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs focus:ring-2 focus:ring-[#1877F2] focus:bg-white outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Unirme al Equipo y Ver Todo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
