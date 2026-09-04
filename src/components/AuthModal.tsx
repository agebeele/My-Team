import React from 'react';
import {
  Shield,
  User,
  Crown,
  Lock,
  X,
  Check,
} from 'lucide-react';
import { AppUser, Language } from '../types';
import { getT } from '../utils/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  allUsers: AppUser[];
  language: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  setCurrentUser,
  allUsers,
  language,
}) => {
  const t = getT(language);
  if (!isOpen) return null;

  const handleSocialLogin = (provider: string) => {
    // Switch or create authenticated session
    alert(`Sesión iniciada con éxito vía ${provider}. Sesión segura activa.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#141416] border border-white/10 w-full max-w-md rounded-xl shadow-2xl p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {t.auth.login} / Cambiar Perfil
          </h3>
          <p className="text-xs text-gray-400">
            {t.auth.socialAuthDesc}
          </p>
        </div>

        {/* Social Login Options */}
        <div className="space-y-2">
          {/* Google Login */}
          <button
            onClick={() => handleSocialLogin('Google')}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-white hover:bg-gray-100 text-black font-bold text-xs shadow-sm transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {t.auth.loginWithGoogle}
          </button>

          {/* Facebook Login */}
          <button
            onClick={() => handleSocialLogin('Facebook')}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs shadow-sm transition-all"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Continuar con Facebook
          </button>
        </div>

        {/* Demo Fast Switch Profile */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            Seleccionar Cuenta de Prueba Rápida:
          </span>

          <div className="space-y-1.5">
            {allUsers.map((user) => {
              const isSelected = user.id === currentUser.id;
              return (
                <button
                  key={user.id}
                  onClick={() => {
                    setCurrentUser(user);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                      : 'bg-black/40 border-white/5 hover:border-white/15 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/10"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        {user.role === 'owner' ? (
                          <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" /> Dueño
                          </span>
                        ) : user.role === 'admin' ? (
                          <span className="text-purple-400 font-semibold flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" /> Admin
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                            <User className="w-2.5 h-2.5" /> Jugador
                          </span>
                        )}
                        <span>• {user.email}</span>
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
