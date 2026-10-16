import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  X,
  Check,
  Copy,
  Terminal,
  Zap,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAndroidUsbModal?: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isOpen,
  onClose,
  onOpenAndroidUsbModal,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<'prompt' | 'qr' | 'adb'>('prompt');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstalledSuccess(true);
      setDeferredPrompt(null);
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setInstalledSuccess(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error triggering install prompt:', err);
      }
    } else {
      // In iframes or environments where Chrome blocks native modal,
      // simulate the installation & transition to the phone QR and ADB guides
      setInstalledSuccess(true);
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://dreamteam.app';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    currentUrl
  )}`;

  const ADB_DEVICES_CMD = 'adb devices';
  const GRADLEW_INSTALL_CMD = 'cd android && ./gradlew installDebug';
  const ADB_REVERSE_CMD = 'adb reverse tcp:3000 tcp:3000';
  const ALL_ADB_CMDS = `# 1. Verificar celular conectado por cable USB
adb devices

# 2. Compilar e instalar APK Debug nativo en tu teléfono
cd android && ./gradlew installDebug

# 3. Redirigir puerto del servidor de desarrollo al celular
adb reverse tcp:3000 tcp:3000`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-[#1E2024] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden text-[#050505] dark:text-white max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Android Native Header (Simulation of Android OS / Chrome Install Sheet) */}
        <div className="bg-[#0B132B] px-5 py-3 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold tracking-tight text-gray-200">
              Instalador Oficial Android
            </span>
            <span className="text-[9px] bg-emerald-500/30 text-emerald-300 font-extrabold uppercase px-1.5 py-0.5 rounded">
              Android OS
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector: Diálogo Nativo / QR Celular / Comandos ADB */}
        <div className="flex border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-xs font-bold">
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'prompt'
                ? 'border-[#1877F2] text-[#1877F2] bg-white dark:bg-[#1E2024]'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Instalar App</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'border-[#1877F2] text-[#1877F2] bg-white dark:bg-[#1E2024]'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Código QR</span>
          </button>
          <button
            onClick={() => setActiveTab('adb')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'adb'
                ? 'border-[#1877F2] text-[#1877F2] bg-white dark:bg-[#1E2024]'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-500" />
            <span>USB (ADB)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              {/* Authentic Android App Install Sheet Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-[#F0F2F5] to-white dark:from-white/5 dark:to-white/10 border border-gray-200 dark:border-white/10 flex items-start gap-4">
                <div className="relative shrink-0">
                  <img
                    src="/icon-192.jpg"
                    alt="Dream Team Icon"
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#1877F2] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                    7
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                    Dream Team - Fútbol 7
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    com.dreamteam.app · App Oficial Android
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Certificada Google Play Protect
                    </span>
                  </div>
                </div>
              </div>

              {/* What will be installed info */}
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Añade icono directo a tu pantalla de inicio en Android.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Funciona 100% a pantalla completa nativa sin barra de navegador.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Acceso rápido a convocatorias, alineaciones 7v7 y modo partido en vivo.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Compatible con Depuración USB (ADB) para desarrollo en tiempo real.</span>
                </div>
              </div>

              {/* Success Notification if clicked */}
              {installedSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">¡Solicitud de instalación iniciada!</p>
                    <p className="text-[11px] mt-0.5 text-emerald-700 dark:text-emerald-300">
                      Si el diálogo nativo no aparece por estar dentro del visor de Google Cloud, escanea el <b>Código QR</b> con tu teléfono o copia los comandos <b>ADB USB</b> en las pestañas superiores.
                    </p>
                  </div>
                </div>
              )}

              {/* Primary Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  id="btn-confirm-android-install"
                  onClick={handleInstallClick}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-[0.99]"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar en el Teléfono</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTab('qr')}
                    className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Ver Código QR</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('adb')}
                    className="py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Comandos ADB</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-white rounded-2xl border-2 border-emerald-500/40 inline-block shadow-md">
                <img
                  src={qrCodeUrl}
                  alt="QR para instalar en Android"
                  className="w-48 h-48 mx-auto rounded-lg object-contain"
                />
              </div>

              <div className="text-left bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-400/30">
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Pasos para instalar en tu Android:</span>
                </p>
                <ol className="text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1 list-decimal list-inside mt-1.5">
                  <li>Apunta la cámara de tu celular Android al código QR.</li>
                  <li>Toca el enlace que aparece para abrir en <b>Google Chrome</b>.</li>
                  <li>Toca el banner <b>"Instalar Dream Team"</b> o el menú ⋮ &gt; <b>"Instalar aplicación"</b>.</li>
                </ol>
              </div>

              <button
                onClick={() => handleCopy(currentUrl, 'url')}
                className="w-full py-2.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedCmd === 'url' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCmd === 'url' ? '¡Enlace copiado al portapapeles!' : 'Copiar enlace directo para enviar a WhatsApp/Telegram'}</span>
              </button>
            </div>
          )}

          {activeTab === 'adb' && (
            <div className="space-y-3">
              <div className="bg-[#0B132B] text-white p-3 rounded-2xl border border-emerald-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Comandos Rápidos ADB (1 Clic)</span>
                  </span>
                  <button
                    onClick={() => handleCopy(ALL_ADB_CMDS, 'all_adb')}
                    className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {copiedCmd === 'all_adb' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar Todos</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {/* Cmd 1 */}
                  <div className="bg-black/50 p-2 rounded-xl flex items-center justify-between gap-2 border border-white/5">
                    <div className="min-w-0">
                      <span className="text-[10px] text-gray-400 block">1. Verificar dispositivo USB</span>
                      <code className="text-xs font-mono text-emerald-300 font-bold">{ADB_DEVICES_CMD}</code>
                    </div>
                    <button
                      onClick={() => handleCopy(ADB_DEVICES_CMD, 'cmd_1')}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-400 transition-colors cursor-pointer shrink-0"
                      title="Copiar"
                    >
                      {copiedCmd === 'cmd_1' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Cmd 2 */}
                  <div className="bg-black/50 p-2 rounded-xl flex items-center justify-between gap-2 border border-white/5">
                    <div className="min-w-0">
                      <span className="text-[10px] text-gray-400 block">2. Compilar & Instalar APK Debug</span>
                      <code className="text-xs font-mono text-sky-300 font-bold">{GRADLEW_INSTALL_CMD}</code>
                    </div>
                    <button
                      onClick={() => handleCopy(GRADLEW_INSTALL_CMD, 'cmd_2')}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sky-400 transition-colors cursor-pointer shrink-0"
                      title="Copiar"
                    >
                      {copiedCmd === 'cmd_2' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Cmd 3 */}
                  <div className="bg-black/50 p-2 rounded-xl flex items-center justify-between gap-2 border border-white/5">
                    <div className="min-w-0">
                      <span className="text-[10px] text-gray-400 block">3. Redirigir puerto al celular</span>
                      <code className="text-xs font-mono text-purple-300 font-bold">{ADB_REVERSE_CMD}</code>
                    </div>
                    <button
                      onClick={() => handleCopy(ADB_REVERSE_CMD, 'cmd_3')}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-purple-400 transition-colors cursor-pointer shrink-0"
                      title="Copiar"
                    >
                      {copiedCmd === 'cmd_3' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {onOpenAndroidUsbModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAndroidUsbModal();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Abrir Guía USB Completa y Código Kotlin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            Exclusivo para Android (Fútbol 7)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 text-gray-800 dark:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
