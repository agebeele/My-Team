import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, ShieldCheck } from 'lucide-react';
import { AppUser } from '../types';
import { saveDeviceSession } from '../utils/storage';
import { pushBackendSyncImmediate } from '../utils/backendSync';
import { isSupabaseConfigured, supabaseUpdateUserPassword, supabaseUpsertUser } from '../services/supabaseService';

interface ChangePasswordSectionProps {
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  users?: AppUser[];
  setUsers?: React.Dispatch<React.SetStateAction<AppUser[]>>;
  title?: string;
}

export const ChangePasswordSection: React.FC<ChangePasswordSectionProps> = ({
  currentUser,
  setCurrentUser,
  users,
  setUsers,
  title = 'Seguridad / Cambiar Contraseña',
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanCurrent = currentPassword.trim();
    const cleanNew = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    const expectedCurrent =
      currentUser.password ||
      (currentUser.role === 'owner'
        ? 'root'
        : currentUser.role === 'league_admin'
        ? 'admin'
        : '123');

    if (!cleanCurrent) {
      setErrorMsg('Ingresa tu contraseña actual.');
      return;
    }

    if (cleanCurrent !== expectedCurrent) {
      setErrorMsg('La contraseña actual es incorrecta.');
      return;
    }

    if (!cleanNew || cleanNew.length < 3) {
      setErrorMsg('La nueva contraseña debe tener al menos 3 caracteres.');
      return;
    }

    if (cleanNew === expectedCurrent) {
      setErrorMsg('La nueva contraseña debe ser diferente a la contraseña actual.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setErrorMsg('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    setIsSaving(true);

    const updatedUser: AppUser = {
      ...currentUser,
      password: cleanNew,
    };

    try {
      if (isSupabaseConfigured()) {
        const updatedDirect = await supabaseUpdateUserPassword(currentUser.id, cleanNew);
        if (!updatedDirect) {
          await supabaseUpsertUser(updatedUser);
        }
      }
    } catch {
      // Fallback to local & backend sync
    }

    setCurrentUser(updatedUser);
    saveDeviceSession(updatedUser);

    try {
      localStorage.setItem('teamgol_current_user', JSON.stringify(updatedUser));
    } catch {
      // ignore
    }

    if (setUsers) {
      const baseList = users && users.length > 0 ? users : [];
      const exists = baseList.some((u) => u.id === currentUser.id);
      const nextUsers = exists
        ? baseList.map((u) => (u.id === currentUser.id ? updatedUser : u))
        : [updatedUser, ...baseList];
      setUsers(nextUsers);
      pushBackendSyncImmediate({ users: nextUsers });
    } else if (users) {
      const nextUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
      pushBackendSyncImmediate({ users: nextUsers });
    }

    setIsSaving(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccessMsg('¡Contraseña actualizada correctamente! Úsala en tu próximo inicio de sesión.');
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#CED0D4] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#CED0D4]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100 text-[#1877F2] border border-[#CED0D4]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#050505]">{title}</h3>
            <p className="text-xs text-[#65676B]">
              Actualiza tu contraseña de acceso para {currentUser.email}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F0F2F5] text-[#65676B] border border-[#CED0D4]">
          Cuenta Protegida
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
            Contraseña actual *
          </label>
          <div className="relative">
            <KeyRound className="w-3.5 h-3.5 text-[#65676B] absolute left-3 top-2.5" />
            <input
              type={showCurrent ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-8 pr-9 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-semibold text-[#050505] focus:outline-none focus:border-[#1877F2] focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-2.5 top-2 text-[#65676B] hover:text-[#050505] cursor-pointer"
            >
              {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
            Nueva contraseña *
          </label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 text-[#65676B] absolute left-3 top-2.5" />
            <input
              type={showNew ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 3 caracteres"
              className="w-full pl-8 pr-9 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-semibold text-[#050505] focus:outline-none focus:border-[#1877F2] focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2.5 top-2 text-[#65676B] hover:text-[#050505] cursor-pointer"
            >
              {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-[#65676B] mb-1">
            Confirmar nueva contraseña *
          </label>
          <div className="relative">
            <Lock className="w-3.5 h-3.5 text-[#65676B] absolute left-3 top-2.5" />
            <input
              type={showNew ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#F0F2F5] border border-[#CED0D4] text-xs font-semibold text-[#050505] focus:outline-none focus:border-[#1877F2] focus:bg-white"
            />
          </div>
        </div>

        <div className="sm:col-span-3 flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-black shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
