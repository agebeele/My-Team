#!/usr/bin/env bash
# ==============================================================================
# Script de Instalación y Depuración USB para Dream Team (Android Nativo Kotlin)
# ==============================================================================

set -e

echo "⚽ =================================================="
echo "   DREAM TEAM - Instalación por Depuración USB (ADB)"
echo "=================================================="

# 1. Comprobar que ADB está instalado en la computadora
if ! command -v adb &> /dev/null; then
    echo "❌ Error: 'adb' no está instalado o no se encuentra en el PATH."
    echo "👉 Instala Android SDK Platform-Tools o Android Studio."
    exit 1
fi

echo "🔍 Verificando dispositivos conectados por cable USB..."
adb devices

DEVICE_COUNT=$(adb devices | grep -v "List" | grep "device$" | wc -l)

if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo ""
    echo "⚠️  No se detectó ningún celular Android en modo depuración USB."
    echo "Sigue estos pasos en tu teléfono:"
    echo "  1. Ve a Ajustes > Acerca del teléfono."
    echo "  2. Toca 7 veces sobre 'Número de compilación' hasta activar Opciones de Desarrollador."
    echo "  3. Ve a Opciones de Desarrollador > Activa 'Depuración por USB'."
    echo "  4. Conecta el celular a la PC con cable USB y presiona 'Permitir depuración USB' en la pantalla del celular."
    exit 1
fi

echo "✅ Teléfono detectado correctamente vía USB."

# 2. Configurar túnel de depuración USB en tiempo real (puerto 3000)
echo "⚡ Configurando túnel ADB reverse para el servidor local (puerto 3000)..."
adb reverse tcp:3000 tcp:3000

# 3. Compilar APK Debug con Gradle
echo "🛠️ Compilando APK nativo de depuración en Kotlin con Gradle..."
if [ -f "./gradlew" ]; then
    chmod +x ./gradlew
    ./gradlew assembleDebug
    echo "📲 Instalando APK debug en el teléfono..."
    adb install -r app/build/outputs/apk/debug/app-debug.apk
    echo "🚀 Iniciando Dream Team en el celular..."
    adb shell am start -n com.dreamteam.app.debug/com.dreamteam.app.MainActivity
    echo "🎉 ¡App instalada y ejecutándose exitosamente por USB!"
    echo "💡 Puedes abrir 'chrome://inspect' en tu Google Chrome de PC para depurar en vivo."
else
    echo "ℹ️ Abre la carpeta '/android' en Android Studio y presiona 'Run' (Shift + F10) con tu celular conectado."
fi
