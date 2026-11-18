import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Camera,
  Upload,
  Check,
  CheckCircle2,
  User,
  Mail,
  Database,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppUser, Post, DEFAULT_FACEBOOK_AVATAR } from '../types';
import { CameraCaptureModal } from './CameraCaptureModal';
import { pushBackendSyncImmediate } from '../utils/backendSync';
import { isSupabaseConfigured, supabaseUpsertUser, supabaseUpsertPost } from '../services/supabaseService';

interface LeagueAdminProfileViewProps {
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  onOpenSupabaseModal?: () => void;
}

export const LeagueAdminProfileView: React.FC<LeagueAdminProfileViewProps> = ({
  currentUser,
  setCurrentUser,
  users,
  setUsers,
  setPosts,
  onOpenSupabaseModal,
}) => {
  const [name, setName] = useState(currentUser.name || 'Administrador de Liga');
  const [adminTitle, setAdminTitle] = useState(currentUser.adminTitle || 'Oficial de Liga • Administración General');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || DEFAULT_FACEBOOK_AVATAR);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(currentUser.name || 'Administrador de Liga');
    setAdminTitle(currentUser.adminTitle || 'Oficial de Liga • Administración General');
    setBio(currentUser.bio || '');
    setAvatarUrl(currentUser.avatarUrl || DEFAULT_FACEBOOK_AVATAR);
  }, [currentUser.id, currentUser.name, currentUser.avatarUrl, currentUser.adminTitle, currentUser.bio]);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setAvatarUrl(dataUrl);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || 'Administrador de Liga';
    const cleanAvatar = avatarUrl.trim() || DEFAULT_FACEBOOK_AVATAR;
    const cleanTitle = adminTitle.trim() || 'Oficial de Liga • Administración General';
    const cleanBio = bio.trim();

    const updatedUser: AppUser = {
      ...currentUser,
      name: cleanName,
      avatarUrl: cleanAvatar,
      adminTitle: cleanTitle,
      bio: cleanBio || undefined,
    };

    setCurrentUser(updatedUser);

    const existsInUsers = users.some((u) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase());
    const nextUsers = existsInUsers
      ? users.map((u) =>
          u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()
            ? updatedUser
            : u
        )
      : [updatedUser, ...users];

    setUsers(nextUsers);

    // Sync updated author name & photo on existing posts created by this League Admin
    setPosts((prev) =>
      prev.map((p) => {
        if (p.authorId === currentUser.id) {
          const updatedPost = { ...p, authorName: cleanName, authorAvatar: cleanAvatar };
          if (isSupabaseConfigured()) {
            supabaseUpsertPost(updatedPost);
          }
          return updatedPost;
        }
        return p;
      })
    );

    pushBackendSyncImmediate({ users: nextUsers });
    if (isSupabaseConfigured()) {
      await supabaseUpsertUser(updatedUser);
    }

    try {
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.65 } });
    } catch {}

    setSaveToast('¡Perfil de Administrador de Liga actualizado y sincronizado!');
    setTimeout(() => setSaveToast(null), 4000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#CED0D4] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center shadow-md shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#050505] tracking-tight">
              Mi Perfil de Administrador (Liga)
            </h2>
            <p className="text-xs sm:text-sm text-[#65676B] font-medium">
              Personaliza tu foto de perfil y nombre oficial visibles en comunicados y en la cabecera
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300 text-xs font-black self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Oficial de Liga</span>
        </span>
      </div>

      {saveToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Main Profile Edit Card */}
      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-[#CED0D4] p-5 sm:p-7 shadow-xs space-y-6"
      >
        {/* Photo Upload & Preview */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 sm:p-5 rounded-2xl bg-[#F0F2F5] border border-[#CED0D4]">
          <div className="relative shrink-0">
            <img
              src={avatarUrl || DEFAULT_FACEBOOK_AVATAR}
              alt={name}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_FACEBOOK_AVATAR;
              }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-purple-500/30 border-2 border-white shadow-md bg-white"
            />
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-[#1877F2] hover:bg-[#0866FF] text-white flex items-center justify-center shadow-md border-2 border-white cursor-pointer transition-transform active:scale-95"
              title="Tomar foto con cámara"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-w-0 space-y-2.5 text-center sm:text-left w-full">
            <div>
              <h3 className="text-base font-black text-[#050505] truncate">{name || 'Administrador de Liga'}</h3>
              <p className="text-xs text-[#65676B] truncate">{currentUser.email}</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileUpload}
              className="hidden"
            />

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                id="btn-league-admin-upload-photo"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Foto desde Galería</span>
              </button>

              <button
                type="button"
                id="btn-league-admin-camera-photo"
                onClick={() => setIsCameraOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-[#050505] border border-[#CED0D4] text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-[#1877F2]" />
                <span>Tomar Foto con Cámara</span>
              </button>

              <button
                type="button"
                onClick={() => setAvatarUrl(DEFAULT_FACEBOOK_AVATAR)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-gray-100 text-[#65676B] border border-[#CED0D4] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Restaurar avatar por defecto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Silueta</span>
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] font-bold text-[#1877F2] hover:underline cursor-pointer"
              >
                {showUrlInput ? 'Ocultar enlace URL' : 'O pegar enlace URL de imagen'}
              </button>
              {showUrlInput && (
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-2 w-full px-3 py-2 bg-white border border-[#CED0D4] rounded-xl text-xs text-[#050505] focus:outline-none focus:border-[#1877F2]"
                />
              )}
            </div>
          </div>
        </div>

        {/* Name & Title Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#65676B] mb-1.5">
              Nombre del Administrador *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#65676B] absolute left-3 top-2.5" />
              <input
                id="input-league-admin-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Administrador de Liga"
                className="w-full pl-9 pr-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-sm font-bold text-[#050505] focus:outline-none focus:border-[#1877F2] focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#65676B] mb-1.5">
              Cargo / Subtítulo Oficial
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 text-purple-600 absolute left-3 top-2.5" />
              <input
                type="text"
                value={adminTitle}
                onChange={(e) => setAdminTitle(e.target.value)}
                placeholder="Panel General • Todas las Ligas"
                className="w-full pl-9 pr-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-sm font-medium text-[#050505] focus:outline-none focus:border-[#1877F2] focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#65676B] mb-1.5">
              Correo de Acceso
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

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#65676B] mb-1.5">
              Nota / Firma Oficial (Opcional)
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ej. Presidencia y Reglamentación de Ligas Fut 7"
              className="w-full px-3 py-2 bg-[#F0F2F5] border border-[#CED0D4] rounded-xl text-xs font-medium text-[#050505] focus:outline-none focus:border-[#1877F2] focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-[#CED0D4] flex flex-wrap items-center justify-between gap-3">
          {onOpenSupabaseModal ? (
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold cursor-pointer transition-colors"
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Configuración Supabase</span>
            </button>
          ) : (
            <div />
          )}

          <button
            id="btn-save-league-admin-profile"
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs sm:text-sm font-black shadow-md flex items-center gap-2 cursor-pointer transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Cambios de Perfil</span>
          </button>
        </div>
      </form>

      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => setAvatarUrl(dataUrl)}
        title="Foto de Perfil del Administrador de Liga"
        subtitle="Centra tu rostro dentro del marco circular"
        playerName={name}
        dorsal="LIGA"
      />
    </div>
  );
};
