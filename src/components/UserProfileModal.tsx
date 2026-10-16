import React, { useState, useRef } from 'react';
import {
  X,
  User,
  Camera,
  Upload,
  Check,
  Share2,
  Shield,
  Sparkles,
  Trophy,
  ArrowRightLeft,
  Smartphone,
  Flame,
  Award,
  Sun,
  Moon,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  AppUser,
  Player,
  TeamInfo,
  PlayerPosition,
  ALL_POSITIONS,
} from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  allUsers: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  team: TeamInfo;
  player?: Player;
  onOpenStoryShare?: (type: 'player_card' | 'standings' | 'scorers' | 'mvp') => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  setCurrentUser,
  allUsers,
  setUsers,
  team,
  player,
  onOpenStoryShare,
  theme = 'light',
  onToggleTheme,
}) => {
  const [formData, setFormData] = useState({
    name: currentUser.name,
    username: currentUser.username || '',
    bio: currentUser.bio || '',
    position: (currentUser.position || player?.position || 'DEL') as PlayerPosition,
    jerseyNumber: currentUser.jerseyNumber || player?.number || 10,
    avatarUrl: currentUser.avatarUrl,
  });

  const [savedToast, setSavedToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setFormData((prev) => ({ ...prev, avatarUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = () => {
    let cleanUsername = formData.username.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername) {
      cleanUsername = `user_${Date.now().toString().slice(-4)}`;
    }

    const updatedUser: AppUser = {
      ...currentUser,
      name: formData.name.trim(),
      username: cleanUsername,
      bio: formData.bio.trim(),
      position: formData.position,
      jerseyNumber: Number(formData.jerseyNumber) || 10,
      avatarUrl: formData.avatarUrl,
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    confetti({ particleCount: 30, spread: 50 });
    showToast('¡Perfil y usuario actualizados correctamente!');
  };

  const handleSwitchAccount = (user: AppUser) => {
    setCurrentUser(user);
    setFormData({
      name: user.name,
      username: user.username || '',
      bio: user.bio || '',
      position: user.position || 'DEL',
      jerseyNumber: user.jerseyNumber || 10,
      avatarUrl: user.avatarUrl,
    });
    confetti({ particleCount: 20, spread: 40 });
    showToast(`Sesión cambiada a @${user.username || user.name}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1E1F20] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#CED0D4] dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-blue-500/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#050505] dark:text-white">
                Mi Perfil de Usuario
              </h3>
              <p className="text-xs text-[#65676B] dark:text-gray-400">
                Tu identidad digital para historias, estadísticas y notificaciones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-[#050505] dark:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {savedToast && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedToast}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Avatar & Username Preview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0F1012] to-[#1A1C20] text-white flex items-center gap-4 shadow-lg border border-white/10 relative overflow-hidden">
            <div className="relative shrink-0">
              <img
                src={formData.avatarUrl}
                alt={formData.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-400 shadow-md bg-white"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 shadow-md cursor-pointer transition-all"
                title="Cambiar Foto"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileUpload}
                className="hidden"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black truncate">{formData.name}</h4>
                <span className="text-[10px] font-black bg-amber-400 text-black px-1.5 py-0.2 rounded-md">
                  #{formData.jerseyNumber}
                </span>
              </div>
              <p className="text-xs font-bold text-amber-300">
                @{formData.username || 'usuario'}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-white/70">
                <span>{formData.position}</span>
                <span>•</span>
                <span>{team.name}</span>
              </div>
            </div>

            {/* Quick Share to Stories Button inside profile */}
            {onOpenStoryShare && (
              <button
                onClick={() => {
                  onClose();
                  onOpenStoryShare('player_card');
                }}
                className="self-center px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Crear Historia</span>
              </button>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#050505] dark:text-gray-200 mb-1">
                Nombre Completo:
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs border border-[#CED0D4] dark:border-white/10 bg-white dark:bg-[#2A2B2D] text-[#050505] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#050505] dark:text-gray-200 mb-1">
                Nombre de Usuario Único (@username para historias y menciones):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">@</span>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="ejemplo: alex_delantero9"
                  className="w-full pl-7 pr-3 py-2 rounded-xl text-xs border border-[#CED0D4] dark:border-white/10 bg-white dark:bg-[#2A2B2D] text-[#050505] dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-[#65676B] dark:text-gray-400 mt-0.5">
                Con este @usuario otros jugadores y entrenadores pueden mandarte invitaciones directas a tus notificaciones.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#050505] dark:text-gray-200 mb-1">
                  Posición Habitual:
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value as PlayerPosition })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-[#CED0D4] dark:border-white/10 bg-white dark:bg-[#2A2B2D] text-[#050505] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                >
                  {ALL_POSITIONS.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#050505] dark:text-gray-200 mb-1">
                  Número de Dorsal:
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={formData.jerseyNumber}
                  onChange={(e) => setFormData({ ...formData, jerseyNumber: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-[#CED0D4] dark:border-white/10 bg-white dark:bg-[#2A2B2D] text-[#050505] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#050505] dark:text-gray-200 mb-1">
                Biografía / Lema Deportivo:
              </label>
              <textarea
                rows={2}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Frase deportiva o descripción..."
                className="w-full px-3 py-2 rounded-xl text-xs border border-[#CED0D4] dark:border-white/10 bg-white dark:bg-[#2A2B2D] text-[#050505] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1877F2] resize-none"
              />
            </div>

            {/* Global Theme Preference Toggle */}
            {onToggleTheme && (
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#050505] dark:text-white block">
                      Tema de la Aplicación
                    </span>
                    <span className="text-[10px] text-[#65676B] dark:text-gray-400 block">
                      {theme === 'dark' ? 'Modo Oscuro activado (variables CSS Tailwind)' : 'Modo Claro activado'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-profile-theme-toggle"
                  onClick={onToggleTheme}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#2A2B2D] border border-gray-200 dark:border-white/10 text-xs font-bold text-[#050505] dark:text-white hover:bg-gray-100 dark:hover:bg-[#3A3B3C] shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Cambiar a Claro</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-blue-500" />
                      <span>Cambiar a Oscuro</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Quick Account Switcher for Testing In-App Invitations & Multiple Profiles */}
          <div className="pt-3 border-t border-[#CED0D4] dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#050505] dark:text-white flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
                Cambiar de Cuenta / Probar Otros Perfiles:
              </span>
              <span className="text-[10px] text-[#65676B] dark:text-gray-400">
                1 Clic
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {allUsers.map((u) => {
                const isActive = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSwitchAccount(u)}
                    className={`p-2 rounded-xl flex items-center gap-2 text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-500/10 border-2 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'bg-gray-100 dark:bg-white/5 border border-transparent hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-white/50"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold truncate">{u.name.split(' ')[0]}</p>
                      <p className="text-[9px] text-gray-500 truncate font-mono">@{u.username || 'user'}</p>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#F0F2F5] dark:bg-white/5 border-t border-[#CED0D4] dark:border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#65676B] dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 cursor-pointer"
          >
            Cerrar
          </button>
          <button
            onClick={handleSaveProfile}
            className="px-5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>
    </div>
  );
};
