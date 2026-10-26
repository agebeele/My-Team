import React, { useState } from 'react';
import { Database, Check, Copy, ExternalLink, ShieldCheck, AlertCircle, RefreshCw, X, Sparkles } from 'lucide-react';
import { getSupabaseCredentials, saveSupabaseCredentials, isSupabaseConfigured, getSupabaseClient } from '../utils/supabaseClient';
import { SUPABASE_SQL_SCRIPT } from '../data/supabaseSqlScript';

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const currentCreds = getSupabaseCredentials();
  const [urlInput, setUrlInput] = useState(currentCreds.url);
  const [keyInput, setKeyInput] = useState(currentCreds.anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = urlInput.trim();
    const cleanKey = keyInput.trim();

    if (!cleanUrl || !cleanKey) {
      saveSupabaseCredentials('', '');
      setStatusMessage({
        type: 'success',
        text: 'Credenciales eliminadas. La app volverá al modo local (localStorage).',
      });
      setTimeout(() => {
        setStatusMessage(null);
        if (onConnected) onConnected();
      }, 1500);
      return;
    }

    if (!cleanUrl.startsWith('http')) {
      setStatusMessage({
        type: 'error',
        text: 'La URL debe comenzar con https:// (ejemplo: https://xyz.supabase.co)',
      });
      return;
    }

    saveSupabaseCredentials(cleanUrl, cleanKey);
    setIsTesting(true);
    setStatusMessage(null);

    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('No se pudo inicializar el cliente de Supabase.');

      // Test reading teams table or players table
      const { data, error } = await client.from('teams').select('id, name').limit(1);

      if (error) {
        // Table might not exist yet if SQL script wasn't run
        if (error.code === '42P01') {
          setStatusMessage({
            type: 'error',
            text: 'Conexión exitosa, pero falta crear las tablas. Por favor copia el Script SQL abajo y córrelo en el SQL Editor de Supabase.',
          });
        } else {
          setStatusMessage({
            type: 'error',
            text: `Error de Supabase: ${error.message} (Código: ${error.code})`,
          });
        }
      } else {
        setStatusMessage({
          type: 'success',
          text: '¡Conexión exitosa con Supabase! Ahora tus jugadores, partidos y muro se sincronizan en la nube en tiempo real.',
        });
        setTimeout(() => {
          if (onConnected) onConnected();
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'No se pudo conectar a Supabase. Verifica la URL y la Anon Key.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1C1E21] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#CED0D4] dark:border-white/10 my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20 shadow-xs">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#050505] dark:text-white tracking-tight">
                Conectar con Supabase
              </h2>
              {isConfigured ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Conectado
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Modo Local
                </span>
              )}
            </div>
            <p className="text-xs text-[#65676B] dark:text-gray-400">
              Sincroniza tu equipo, jugadores y publicaciones entre diferentes celulares en tiempo real.
            </p>
          </div>
        </div>

        {/* Step Guide */}
        <div className="mt-6 space-y-4">
          <div className="p-4 rounded-2xl bg-[#F0F2F5] dark:bg-white/5 border border-[#CED0D4] dark:border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-[#050505] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[11px] font-black">
                1
              </span>
              <span>Crea tu proyecto gratis en Supabase</span>
            </h3>
            <p className="text-xs text-[#65676B] dark:text-gray-400">
              Entra a{' '}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-[#1877F2] font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>supabase.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>{' '}
              (gratis con tu cuenta de GitHub) y crea un nuevo proyecto (ejemplo: <code>bayern-munich</code>).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F0F2F5] dark:bg-white/5 border border-[#CED0D4] dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-[#050505] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[11px] font-black">
                  2
                </span>
                <span>Ejecuta el Script SQL en Supabase</span>
              </h3>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Script SQL</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-[#65676B] dark:text-gray-400 leading-relaxed">
              En tu panel de Supabase, ve a <strong>SQL Editor</strong> ➔ haz clic en <strong>New Query</strong> ➔ pega este script y pulsa <strong>Run</strong>. Creará automáticamente las tablas con los 17 jugadores del Bayern Munich y la cuenta de administrador.
            </p>
          </div>

          <form onSubmit={handleSaveAndTest} className="p-4 rounded-2xl bg-[#F0F2F5] dark:bg-white/5 border border-[#CED0D4] dark:border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-[#050505] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[11px] font-black">
                3
              </span>
              <span>Pega tus Credenciales de API</span>
            </h3>
            <p className="text-[11px] text-[#65676B] dark:text-gray-400">
              En Supabase, ve a <strong>Project Settings</strong> (el engranaje abajo a la izquierda) ➔ <strong>API</strong>. Copia tu <strong>Project URL</strong> y tu <strong>anon public key</strong>:
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-[#050505] dark:text-white mb-1">
                  Project URL (ej. https://xxxx.supabase.co):
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://xyzproject.supabase.co"
                  className="w-full px-3 py-2 rounded-xl border border-[#CED0D4] dark:border-white/10 bg-white dark:bg-[#242526] text-xs font-mono text-[#050505] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#050505] dark:text-white mb-1">
                  API Key Pública (anon public):
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 rounded-xl border border-[#CED0D4] dark:border-white/10 bg-white dark:bg-[#242526] text-xs font-mono text-[#050505] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                />
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isTesting}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Probando conexión...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Guardar y Probar Conexión</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Vercel Environment Variables Tip */}
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <span>🚀 Para tu despliegue permanente en Vercel:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              En tu proyecto de <strong>Vercel ➔ Settings ➔ Environment Variables</strong>, puedes agregar:
            </p>
            <div className="bg-white/80 dark:bg-black/40 p-2 rounded-lg font-mono text-[10px] space-y-0.5 text-[#050505] dark:text-gray-200 select-all">
              <div>VITE_SUPABASE_URL = {urlInput || 'https://tu-proyecto.supabase.co'}</div>
              <div>VITE_SUPABASE_ANON_KEY = {keyInput || 'tu-anon-key'}</div>
            </div>
            <p className="text-[10px] text-blue-700 dark:text-blue-300">
              Al agregarlas en Vercel, todos tus amigos y visitantes se conectarán a Supabase automáticamente sin necesidad de configurar nada en sus celulares.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
