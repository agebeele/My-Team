import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  X,
  Check,
  Copy,
  Terminal,
  Code2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Cpu,
  Sparkles,
  Cloud,
  HelpCircle,
  Share2,
  CheckCircle2,
  Play,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface AndroidUsbModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'commands' | 'cloud' | 'guide' | 'code';
}

export const AndroidUsbPanelContent: React.FC<{
  onClose?: () => void;
  isEmbedded?: boolean;
}> = ({ onClose, isEmbedded = false }) => {
  const [activeTab, setActiveTab] = useState<'commands' | 'cloud' | 'guide' | 'code'>('commands');
  const [activeCodeFile, setActiveCodeFile] = useState<'main' | 'bridge' | 'manifest' | 'gradle'>('main');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsPwaInstalled(true);
      setDeferredPrompt(null);
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const [showInstallTip, setShowInstallTip] = useState(false);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstallTip(true);
      setTimeout(() => setShowInstallTip(false), 8000);
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://dreamteam.app';

  const ALL_COMMANDS_SNIPPET = `# 1. Verificar dispositivo conectado por cable USB
adb devices

# 2. Entrar a la carpeta nativa y compilar/instalar APK Debug
cd android && ./gradlew installDebug

# 3. Redirigir puerto del servidor de desarrollo al celular
adb reverse tcp:3000 tcp:3000`;

  const MAIN_ACTIVITY_SNIPPET = `package com.dreamteam.app

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebSettings
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // ⚡ HABILITADO PARA DEPURACIÓN POR USB (ADB & CHROME INSPECT)
        WebView.setWebContentsDebuggingEnabled(true)
        
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            addJavascriptInterface(AndroidBridge(this@MainActivity, this@MainActivity), "AndroidNativeBridge")
        }
        setContentView(webView)
        webView.loadUrl("http://localhost:3000") // Con adb reverse tcp:3000 tcp:3000
    }
}`;

  const ANDROID_BRIDGE_SNIPPET = `package com.dreamteam.app

import android.content.Context
import android.os.Vibrator
import android.os.VibrationEffect
import android.os.Build
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class AndroidBridge(private val context: Context, private val activity: AppCompatActivity) {

    @JavascriptInterface
    fun showToast(message: String) {
        activity.runOnUiThread {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun vibrate(durationMs: Long) {
        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(durationMs)
        }
    }

    @JavascriptInterface
    fun isNativeApp(): Boolean = true
}`;

  const MANIFEST_SNIPPET = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <application
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true"
        android:label="Dream Team"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const GRADLE_SNIPPET = `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.dreamteam.app"
    compileSdk = 34
    defaultConfig {
        applicationId = "com.dreamteam.app"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.11.0")
}`;

  return (
    <div className={`flex flex-col bg-white dark:bg-[#1E1F24] ${isEmbedded ? 'rounded-2xl border border-[#CED0D4] dark:border-white/10 shadow-lg' : 'h-full'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1877F2] via-[#0866FF] to-indigo-600 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner shrink-0">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Panel Interactivo: App Móvil & Depuración USB
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-400 text-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" />
                ADB & USB Ready
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-1 font-medium">
              Guía paso a paso y comandos oficiales listos para copiar con 1 clic
            </p>
          </div>
        </div>
        {onClose && !isEmbedded && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0 ml-2"
            title="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Cloud Environment Clarification Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-700/30 px-4 py-3 flex items-start gap-3">
        <Cloud className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <p className="font-bold">
            ¿Por qué la opción física USB se ejecuta en tu PC y no directamente en Google Cloud?
          </p>
          <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
            Google Cloud es un servidor remoto en la nube que no tiene tu cable USB conectado. Para probar la app en tu teléfono Android tienes <strong>dos opciones inmediatas</strong>:
            1) <strong>Comandos ADB</strong> en tu computadora con cable USB, o 
            2) <strong>Instalar directamente desde Google Cloud</strong> en tu Android abriendo esta URL en Chrome (PWA / WebAPK instantáneo sin cables).
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#CED0D4] dark:border-white/10 bg-[#F0F2F5] dark:bg-[#18191A] px-3 sm:px-4 pt-2 gap-1.5 sm:gap-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('commands')}
          className={`px-3 sm:px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'commands'
              ? 'bg-white dark:bg-[#1E1F24] text-[#1877F2] dark:text-[#60A5FA] border-t-2 border-[#1877F2]'
              : 'text-[#65676B] dark:text-gray-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-500" />
          <span>Comandos ADB (1-Clic)</span>
        </button>

        <button
          onClick={() => setActiveTab('cloud')}
          className={`px-3 sm:px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'cloud'
              ? 'bg-white dark:bg-[#1E1F24] text-[#1877F2] dark:text-[#60A5FA] border-t-2 border-[#1877F2]'
              : 'text-[#65676B] dark:text-gray-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Cloud className="w-4 h-4 text-[#1877F2]" />
          <span>Instalar desde Google Cloud</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-3 sm:px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'guide'
              ? 'bg-white dark:bg-[#1E1F24] text-[#1877F2] dark:text-[#60A5FA] border-t-2 border-[#1877F2]'
              : 'text-[#65676B] dark:text-gray-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Guía Paso a Paso</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`px-3 sm:px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'code'
              ? 'bg-white dark:bg-[#1E1F24] text-[#1877F2] dark:text-[#60A5FA] border-t-2 border-[#1877F2]'
              : 'text-[#65676B] dark:text-gray-400 hover:text-black dark:hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4 text-indigo-500" />
          <span>Código Kotlin</span>
        </button>
      </div>

      {/* Panel Body */}
      <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
        
        {/* TAB 1: COMANDOS ADB LISTOS CON 1 CLIC (User's primary request) */}
        {activeTab === 'commands' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-gray-100 dark:border-white/10">
              <div>
                <h4 className="font-black text-sm text-[#050505] dark:text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#1877F2]" />
                  Comandos ADB Oficiales para Depuración USB
                </h4>
                <p className="text-xs text-[#65676B] dark:text-gray-400 mt-0.5">
                  Haz clic en el botón de copiar de cualquier comando para pegarlo directamente en tu terminal.
                </p>
              </div>

              {/* Copy all commands in 1 click */}
              <button
                onClick={() => handleCopy(ALL_COMMANDS_SNIPPET, 'all-commands')}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
              >
                {copiedText === 'all-commands' ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>¡Todos los comandos copiados!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar los 3 comandos juntos</span>
                  </>
                )}
              </button>
            </div>

            {/* Comando 1: adb devices */}
            <div className="bg-[#121316] text-white p-4 rounded-2xl border border-white/10 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Paso 1: Detectar teléfono conectado por USB
                </span>
                <button
                  onClick={() => handleCopy('adb devices', 'cmd-devices')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copiar comando"
                >
                  {copiedText === 'cmd-devices' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar 1-clic</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-black/60 p-3 rounded-xl font-mono text-sm text-emerald-300 font-bold border border-white/5 select-all">
                adb devices
              </div>
              <p className="text-[11px] text-gray-400">
                Verifica que tu celular aparezca listado como <code>device</code> (si dice <code>unauthorized</code>, acepta la huella RSA en la pantalla de tu celular).
              </p>
            </div>

            {/* Comando 2: ./gradlew installDebug */}
            <div className="bg-[#121316] text-white p-4 rounded-2xl border border-white/10 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sky-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-3 h-3 text-sky-400" />
                  Paso 2: Compilar e instalar APK Debug en el teléfono
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy('./gradlew installDebug', 'cmd-install-debug')}
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copiar comando en carpeta android"
                  >
                    {copiedText === 'cmd-install-debug' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>./gradlew installDebug</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleCopy('cd android && ./gradlew installDebug', 'cmd-cd-install')}
                    className="px-2.5 py-1.5 rounded-lg bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Copiar comando con cd android"
                  >
                    {copiedText === 'cmd-cd-install' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>cd android && ./gradlew...</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="bg-black/60 p-3 rounded-xl font-mono text-sm text-sky-300 font-bold border border-white/5 select-all">
                ./gradlew installDebug
              </div>
              <p className="text-[11px] text-gray-400">
                Compila la arquitectura Kotlin de <code className="text-white">/android</code> y la instala directamente en tu dispositivo físico sin pasar por Google Play.
              </p>
            </div>

            {/* Comando 3: adb reverse tcp:3000 tcp:3000 */}
            <div className="bg-[#121316] text-white p-4 rounded-2xl border border-white/10 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-purple-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-purple-400" />
                  Paso 3: Redirigir puerto local (Túnel USB en vivo)
                </span>
                <button
                  onClick={() => handleCopy('adb reverse tcp:3000 tcp:3000', 'cmd-reverse')}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copiar comando"
                >
                  {copiedText === 'cmd-reverse' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar 1-clic</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-black/60 p-3 rounded-xl font-mono text-sm text-purple-300 font-bold border border-white/5 select-all">
                adb reverse tcp:3000 tcp:3000
              </div>
              <p className="text-[11px] text-gray-400">
                Permite que la app en tu celular acceda a <code className="text-white">http://localhost:3000</code> a través del cable USB con cero latencia.
              </p>
            </div>

            {/* Comandos adicionales útiles */}
            <div className="p-4 rounded-2xl bg-[#F0F2F5] dark:bg-white/5 border border-[#CED0D4] dark:border-white/10 space-y-3">
              <h5 className="font-bold text-[#050505] dark:text-white text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Comandos adicionales para depuración avanzada:
              </h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-[#121316] rounded-xl border border-gray-200 dark:border-white/10">
                  <span className="font-mono text-gray-700 dark:text-gray-300 truncate mr-2">
                    chrome://inspect/#devices
                  </span>
                  <button
                    onClick={() => handleCopy('chrome://inspect/#devices', 'chrome-inspect')}
                    className="p-1 rounded-md bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-700 dark:text-white cursor-pointer shrink-0"
                    title="Copiar URL para Chrome"
                  >
                    {copiedText === 'chrome-inspect' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white dark:bg-[#121316] rounded-xl border border-gray-200 dark:border-white/10">
                  <span className="font-mono text-gray-700 dark:text-gray-300 truncate mr-2">
                    ./android/install_usb_debug.sh
                  </span>
                  <button
                    onClick={() => handleCopy('./android/install_usb_debug.sh', 'script-debug')}
                    className="p-1 rounded-md bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-700 dark:text-white cursor-pointer shrink-0"
                    title="Copiar script"
                  >
                    {copiedText === 'script-debug' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INSTALAR DESDE GOOGLE CLOUD (No cables required!) */}
        {activeTab === 'cloud' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 space-y-2">
              <div className="flex items-center gap-2 text-[#1877F2] dark:text-blue-300 font-bold text-sm">
                <Cloud className="w-4 h-4" />
                <span>Instalación Inmediata en Android desde Google Cloud</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                Si no tienes tu cable USB a mano o estás probando directamente desde Google Cloud / AI Studio, puedes instalar la aplicación en tu celular Android en <strong>10 segundos</strong> como una App Nativa (PWA / WebAPK) con icono propio, pantalla completa y soporte offline.
              </p>
            </div>

            {/* Paso 1: Abrir URL en Android */}
            <div className="p-4 rounded-2xl bg-[#F0F2F5] dark:bg-white/5 border border-[#CED0D4] dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1877F2] text-white font-black flex items-center justify-center text-xs">
                    1
                  </span>
                  <h5 className="font-black text-sm text-[#050505] dark:text-white">
                    Abre la URL de Google Cloud en Chrome en tu Android
                  </h5>
                </div>
                <button
                  onClick={() => handleCopy(currentUrl, 'cloud-url')}
                  className="px-3 py-1.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedText === 'cloud-url' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText === 'cloud-url' ? 'URL Copiada' : 'Copiar URL'}</span>
                </button>
              </div>

              <div className="p-3 bg-white dark:bg-black/40 rounded-xl border border-gray-200 dark:border-white/10 font-mono text-xs text-[#1877F2] dark:text-[#60A5FA] break-all select-all">
                {currentUrl}
              </div>
            </div>

            {/* Paso 2: Botón de Instalación Directa */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs">
                  2
                </span>
                <h5 className="font-black text-sm text-[#050505] dark:text-white">
                  Instalar como App Nativa en Android
                </h5>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Pulsa el siguiente botón en tu celular Android para añadirla directamente a tu pantalla de inicio:
              </p>

              <button
                onClick={handleInstallPwa}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Smartphone className="w-5 h-5" />
                <span>{isPwaInstalled ? '✅ App ya instalada en este dispositivo' : '📲 Instalar App en este celular Android'}</span>
              </button>

              <div className="text-[11px] text-[#65676B] dark:text-gray-400 bg-white/70 dark:bg-black/30 p-3 rounded-xl border border-gray-200/60 dark:border-white/5 space-y-1">
                <p className="font-bold text-[#050505] dark:text-white">
                  Instrucciones alternativas en Google Chrome Móvil:
                </p>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>Toca el menú de los tres puntos verticales (<strong>⋮</strong>) arriba a la derecha.</li>
                  <li>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a la pantalla de inicio"</strong>.</li>
                  <li>Acepta y verás el icono oficial de <strong>Dream Team</strong> en tus aplicaciones.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GUÍA PASO A PASO USB */}
        {activeTab === 'guide' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#1877F2] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-[#1877F2] dark:text-blue-300">
                  Instalación física por Cable USB (PC a Teléfono)
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                  Todo el proyecto Android está compilado en la carpeta <code className="font-mono bg-white dark:bg-black/40 px-1 py-0.5 rounded border border-blue-200 dark:border-white/10 font-bold">/android</code> con soporte para Android 7.0 a 15 (API 24 a 35).
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Paso 1 */}
              <div className="p-4 rounded-2xl bg-[#F0F2F5] dark:bg-white/5 border border-[#CED0D4] dark:border-white/10 flex gap-3.5 items-start">
                <span className="w-6 h-6 rounded-full bg-[#1877F2] text-white font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div className="space-y-1 flex-1">
                  <h5 className="font-black text-sm text-[#050505] dark:text-white">
                    Activa las Opciones de Desarrollador en tu teléfono
                  </h5>
                  <p className="text-[#65676B] dark:text-gray-300 text-xs leading-relaxed">
                    En tu teléfono ve a <strong>Ajustes &gt; Acerca del teléfono</strong>. Toca <strong>7 veces seguidas</strong> sobre <em>"Número de compilación"</em> hasta ver el mensaje de confirmación.
                  </p>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="p-4 rounded-2xl bg-[#F0F2F5] dark:bg-white/5 border border-[#CED0D4] dark:border-white/10 flex gap-3.5 items-start">
                <span className="w-6 h-6 rounded-full bg-[#1877F2] text-white font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div className="space-y-1 flex-1">
                  <h5 className="font-black text-sm text-[#050505] dark:text-white">
                    Habilita la "Depuración por USB"
                  </h5>
                  <p className="text-[#65676B] dark:text-gray-300 text-xs leading-relaxed">
                    Ve a <strong>Ajustes &gt; Opciones de Desarrollador</strong> y activa los interruptores <strong>"Depuración por USB"</strong> e <strong>"Instalar vía USB"</strong>.
                  </p>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="p-4 rounded-2xl bg-[#F0F2F5] dark:bg-white/5 border border-[#CED0D4] dark:border-white/10 flex gap-3.5 items-start">
                <span className="w-6 h-6 rounded-full bg-[#1877F2] text-white font-black flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div className="space-y-1 flex-1">
                  <h5 className="font-black text-sm text-[#050505] dark:text-white">
                    Conecta el cable USB y acepta el permiso RSA
                  </h5>
                  <p className="text-[#65676B] dark:text-gray-300 text-xs leading-relaxed">
                    Conecta tu teléfono a tu PC. En la pantalla del celular aparecerá <em>"¿Permitir depuración por USB?"</em>. Marca <strong>"Permitir siempre"</strong> y toca <strong>Permitir</strong>.
                  </p>
                </div>
              </div>

              {/* Paso 4 */}
              <div className="p-4 rounded-2xl bg-[#F0F2F5] dark:bg-white/5 border border-[#CED0D4] dark:border-white/10 flex gap-3.5 items-start">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center shrink-0 text-xs">
                  4
                </span>
                <div className="space-y-1 flex-1">
                  <h5 className="font-black text-sm text-[#050505] dark:text-white">
                    Ejecuta los comandos en tu terminal
                  </h5>
                  <p className="text-[#65676B] dark:text-gray-300 text-xs leading-relaxed">
                    Ejecuta <code className="font-mono font-bold text-[#1877F2]">adb devices</code> para confirmar conexión, luego <code className="font-mono font-bold text-[#1877F2]">./gradlew installDebug</code> en la carpeta android, y <code className="font-mono font-bold text-[#1877F2]">adb reverse tcp:3000 tcp:3000</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CÓDIGO FUENTE KOTLIN */}
        {activeTab === 'code' && (
          <div className="space-y-3">
            <div className="flex gap-2 text-[11px] font-bold border-b border-[#CED0D4] dark:border-white/10 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveCodeFile('main')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  activeCodeFile === 'main'
                    ? 'bg-[#1877F2] text-white'
                    : 'bg-[#F0F2F5] dark:bg-white/5 text-[#65676B] dark:text-gray-400'
                }`}
              >
                MainActivity.kt
              </button>
              <button
                onClick={() => setActiveCodeFile('bridge')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  activeCodeFile === 'bridge'
                    ? 'bg-[#1877F2] text-white'
                    : 'bg-[#F0F2F5] dark:bg-white/5 text-[#65676B] dark:text-gray-400'
                }`}
              >
                AndroidBridge.kt
              </button>
              <button
                onClick={() => setActiveCodeFile('manifest')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  activeCodeFile === 'manifest'
                    ? 'bg-[#1877F2] text-white'
                    : 'bg-[#F0F2F5] dark:bg-white/5 text-[#65676B] dark:text-gray-400'
                }`}
              >
                AndroidManifest.xml
              </button>
              <button
                onClick={() => setActiveCodeFile('gradle')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                  activeCodeFile === 'gradle'
                    ? 'bg-[#1877F2] text-white'
                    : 'bg-[#F0F2F5] dark:bg-white/5 text-[#65676B] dark:text-gray-400'
                }`}
              >
                build.gradle.kts
              </button>
            </div>

            <div className="relative">
              <pre className="bg-[#121316] text-gray-200 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-80 border border-white/10 leading-relaxed">
                {activeCodeFile === 'main' && MAIN_ACTIVITY_SNIPPET}
                {activeCodeFile === 'bridge' && ANDROID_BRIDGE_SNIPPET}
                {activeCodeFile === 'manifest' && MANIFEST_SNIPPET}
                {activeCodeFile === 'gradle' && GRADLE_SNIPPET}
              </pre>
              <button
                onClick={() => {
                  const text =
                    activeCodeFile === 'main'
                      ? MAIN_ACTIVITY_SNIPPET
                      : activeCodeFile === 'bridge'
                      ? ANDROID_BRIDGE_SNIPPET
                      : activeCodeFile === 'manifest'
                      ? MANIFEST_SNIPPET
                      : GRADLE_SNIPPET;
                  handleCopy(text, 'code snippet');
                }}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedText === 'code snippet' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedText === 'code snippet' ? 'Copiado' : 'Copiar Archivo'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-[#F0F2F5] dark:bg-[#18191A] border-t border-[#CED0D4] dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-[#65676B] dark:text-gray-400 font-medium">
          <Cpu className="w-4 h-4 text-[#1877F2]" />
          <span>Android 14 (API 34) • Kotlin 2.0 • AndroidX WebKit</span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Entendido
          </button>
        )}
      </div>
    </div>
  );
};

export const AndroidUsbModal: React.FC<AndroidUsbModalProps> = ({ isOpen, onClose, initialTab }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        <AndroidUsbPanelContent onClose={onClose} isEmbedded={false} />
      </div>
    </div>
  );
};
