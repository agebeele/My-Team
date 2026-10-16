import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Terminal,
  Copy,
  Check,
  Zap,
  Wifi,
  BatteryCharging,
  Maximize2,
  Minimize2,
  Sparkles,
  Download,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface AndroidSystemBarProps {
  onOpenAndroidUsb: () => void;
  onOpenInstallModal?: () => void;
  isDeviceFrameActive?: boolean;
  onToggleDeviceFrame?: () => void;
}

export const AndroidSystemBar: React.FC<AndroidSystemBarProps> = ({
  onOpenAndroidUsb,
  onOpenInstallModal,
  isDeviceFrameActive = false,
  onToggleDeviceFrame,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('12:45');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleCopy = (cmd: string, label: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(label);
    setToastMessage(`Comando copiado: ${cmd}`);
    setTimeout(() => {
      setCopiedCmd(null);
      setToastMessage(null);
    }, 2800);
  };

  const handleInstallApp = async () => {
    if (onOpenInstallModal) {
      onOpenInstallModal();
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      onOpenAndroidUsb();
    }
  };

  return (
    <div className="w-full select-none">
      {/* 1. Realistic Android OS Status Bar */}
      <div className="bg-[#0B132B] text-white px-3 sm:px-4 py-1 flex items-center justify-between text-[11px] font-medium tracking-tight border-b border-white/10">
        {/* Left: Time & Android System Notification Icons */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-xs">{currentTime}</span>
          <div className="flex items-center gap-1.5 opacity-80 pl-1">
            {/* Android Notification: Football App */}
            <span className="text-[10px]" title="Dream Team Notificaciones">⚽</span>
            {/* Android Notification: USB Debug Active */}
            <span
              className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-500/30 text-emerald-300 px-1 py-0.2 rounded font-bold"
              title="Depuración por USB activada (ADB)"
            >
              <Zap className="w-2.5 h-2.5 text-emerald-400" />
              <span>USB Debug</span>
            </span>
          </div>
        </div>

        {/* Right: Network, 5G, Wi-Fi & Battery Status */}
        <div className="flex items-center gap-2 text-white/90">
          <span className="text-[10px] font-bold tracking-wider text-sky-400">5G</span>
          <Wifi className="w-3.5 h-3.5 text-white/90" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold">100%</span>
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* 2. Interactive Android USB & Fast Installation Banner */}
      <div className="bg-gradient-to-r from-[#0F1E36] via-[#12274A] to-[#0A172B] text-white px-3 sm:px-4 py-2 border-b border-sky-500/20 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          
          {/* Left Title with Android Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-xs sm:text-sm text-white tracking-tight">
                  Android OS
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Depuración USB (ADB)
                </span>
                <span className="hidden lg:inline-flex text-[10px] text-sky-300 font-semibold bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-700/40">
                  Google Cloud Preview
                </span>
              </div>
              <p className="text-[11px] text-gray-300 truncate">
                Haz 1 clic sobre cualquier comando para copiarlo o instalar directamente en tu celular
              </p>
            </div>
          </div>

          {/* Center / Right: 1-Click ADB Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-start sm:justify-end">
            {/* ADB Command 1: adb devices */}
            <button
              onClick={() => handleCopy('adb devices', 'devices')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                copiedCmd === 'devices'
                  ? 'bg-emerald-500 text-white shadow-xs scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-emerald-300 border border-emerald-500/30'
              }`}
              title="Copiar comando: adb devices"
            >
              {copiedCmd === 'devices' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
              <span>adb devices</span>
            </button>

            {/* ADB Command 2: ./gradlew installDebug */}
            <button
              onClick={() => handleCopy('./gradlew installDebug', 'gradlew')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                copiedCmd === 'gradlew'
                  ? 'bg-emerald-500 text-white shadow-xs scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-sky-300 border border-sky-500/30'
              }`}
              title="Copiar comando: ./gradlew installDebug"
            >
              {copiedCmd === 'gradlew' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
              <span>./gradlew installDebug</span>
            </button>

            {/* ADB Command 3: adb reverse tcp:3000 tcp:3000 */}
            <button
              onClick={() => handleCopy('adb reverse tcp:3000 tcp:3000', 'reverse')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                copiedCmd === 'reverse'
                  ? 'bg-emerald-500 text-white shadow-xs scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-purple-300 border border-purple-500/30'
              }`}
              title="Copiar comando: adb reverse tcp:3000 tcp:3000"
            >
              {copiedCmd === 'reverse' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
              <span>adb reverse</span>
            </button>

            {/* Open Full USB Guide Modal */}
            <button
              onClick={onOpenAndroidUsb}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
              title="Abrir panel completo con guía paso a paso y código fuente Android"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Guía Paso a Paso</span>
            </button>

            {/* Fast Install on Android Device (PWA / WebAPK) */}
            <button
              onClick={handleInstallApp}
              className="px-3 py-1.5 rounded-lg bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
              title="Instalar aplicación en tu dispositivo Android"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstalled ? '✅ Instalada' : '📲 Instalar App'}</span>
            </button>

            {/* Toggle Phone Device Frame vs Fullscreen on desktop */}
            {onToggleDeviceFrame && (
              <button
                onClick={onToggleDeviceFrame}
                className="hidden md:flex p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0"
                title={isDeviceFrameActive ? 'Ver en pantalla completa' : 'Ver dentro de marco de celular Android'}
              >
                {isDeviceFrameActive ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating Animated Toast on Copy */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#121316] text-white border border-emerald-500/50 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
