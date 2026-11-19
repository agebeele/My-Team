import React, { useState, useRef, useEffect } from 'react';
import {
  Megaphone,
  Camera,
  Upload,
  Check,
  CheckCircle2,
  User,
  Mail,
  Shield,
} from 'lucide-react';
import { AppUser, TeamInfo, DEFAULT_FACEBOOK_AVATAR } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ChangePasswordSection } from './ChangePasswordSection';
import { pushBackendSyncImmediate } from '../utils/backendSync';
import { saveDeviceSession } from '../utils/storage';
import { isSupabaseConfigured, supabaseUpsertUser } from '../services/supabaseService';

interface FanProfileViewProps {
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  team: TeamInfo;
  allTeams: TeamInfo[];
}

export const FanProfileView: React.FC<FanProfileViewProps> = ({
  currentUser,
  setCurrentUser,
  users,
  setUsers,
  team,
  allTeams,
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || DEFAULT_FACEBOOK_AVATAR);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(currentUser.name || '');
    setBio(currentUser.bio || '');
    setAvatarUrl(currentUser.avatarUrl || DEFAULT_FACEBOOK_AVATAR);
  }, [currentUser.id, currentUser.name, currentUser.bio, currentUser.avatarUrl]);

  const followedTeamIds = Array.from(
    new Set([
      ...(Array.isArray(currentUser.teamIds) ? currentUser.teamIds.filter(Boolean) : []),
      ...(currentUser.teamId ? [currentUser.teamId] : []),
    ])
  );
  const followedTeams = allTeams.filter((t) => followedTeamIds.includes(t.id));

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (!result) return;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const side = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
        const sx = ((img.naturalWidth || img.width) - side) / 2;
        const sy = ((img.naturalHeight || img.height) - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, 400, 400);
        setAvatarUrl(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || currentUser.name;
    const cleanAvatar = avatarUrl.trim() || DEFAULT_FACEBOOK_AVATAR;

    const updatedUser: AppUser = {
      ...currentUser,
      name: cleanName,
      bio: bio.trim() || undefined,
      avatarUrl: cleanAvatar,
    };

    setCurrentUser(updatedUser);
    saveDeviceSession(updatedUser);

    const nextUsers = users.some((u) => u.id === currentUser.id)
      ? users.map((u) => (u.id === currentUser.id ? updatedUser : u))
      : [updatedUser, ...users];
    setUsers(nextUsers);

    pushBackendSyncImmediate({ users: nextUsers });
    if (isSupabaseConfigured()) {
      await supabaseUpsertUser(updatedUser);
    }

    setSaveToast('¡Perfil de Aficionado actualizado y sincronizado!');
    setTimeout(() => setSaveToast(null), 4000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#CED0D4] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#050505] tracking-tight">
              Mi Perfil de Aficionado / Porra Oficial
            </h2>
            <p className="text-xs sm:text-sm text-[#65676B] font-medium">
              Personaliza tu foto, nombre, clubes seguidos y contraseña de acceso
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-black self-start sm:self-auto">
          <span>📣 Porra Oficial</span>
        </span>
      </div>

      {saveToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Profile Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white rounded-2xl border border-[#CED0D4] p-5 sm:p-6 shadow-xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#F0F2F5] border border-[#CED0D4]">
          <div className="relative shrink-0">
            <img
              src={avatarUrl || DEFAULT_FACEBOOK_AVATAR}
              alt={name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_FACEBOOK_AVATAR;
              }}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-amber-400/40 border-2 border-white shadow-md bg-white"
            />
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#1877F2] hover:bg-[#0866FF] text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer"
              title="Tomar foto"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left">
            <div>
              <h3 className="text-base font-black text-[#050505] truncate">{name}</h3>
              <p className="text-xs text-[#65676B] truncate">{currentUser.email}</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Foto</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-[#050505] border border-[#CED0D4] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#1877F2]" />
                <span>Tomar Foto</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
              Nombre Completo *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#65676B] absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-xs font-bold text-[#050505] focus:outline-none focus:border-[#1877F2] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
              Correo de Aficionado
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#65676B] absolute left-3 top-2.5" />
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full pl-9 pr-3 py-2 bg-[#F0F2F5]/70 border border-[#CED0D4] rounded-xl text-xs font-medium text-[#65676B] cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
            Mensaje o grito de aliento para el club
          </label>
          <input
            type="text"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={`Ej. ¡Vamos con todo ${team.shortName}! Siempre en la grada`}
            className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-xs font-medium text-[#050505] focus:outline-none focus:border-[#1877F2] focus:bg-white"
          />
        </div>

        {followedTeams.length > 0 && (
          <div className="p-3.5 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] space-y-2">
            <span className="text-[11px] font-black uppercase text-[#65676B] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#1877F2]" />
              Clubes donde eres Aficionado Oficial ({followedTeams.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {followedTeams.map((ft) => (
                <span
                  key={ft.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#CED0D4] text-xs font-bold text-[#050505]"
                >
                  {ft.logoUrl && (
                    <img src={ft.logoUrl} alt={ft.name} className="w-4 h-4 rounded-full object-cover" />
                  )}
                  <span>{ft.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Perfil</span>
          </button>
        </div>
      </form>

      {/* Seguridad / Cambiar Contraseña */}
      <ChangePasswordSection
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        users={users}
        setUsers={setUsers}
      />

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => setAvatarUrl(dataUrl)}
        title="Foto de Perfil del Aficionado"
        playerName={name}
      />
    </div>
  );
};
