# 📱 Dream Team - Proyecto Nativo Android (Kotlin) & Depuración USB

Esta carpeta contiene la arquitectura nativa en **Kotlin** para Android con soporte completo de **Depuración por USB (ADB)** e integración de hardware (cámara, historias, vibración háptica).

---

## 🚀 Guía Rápida: Instalación por Depuración USB (ADB)

### Paso 1: Activar Depuración por USB en el Teléfono Android
1. Abre **Ajustes** (Configuración) en tu teléfono Android.
2. Ve a **Acerca del teléfono** (o *Información de software*).
3. Busca **Número de compilación** (Build number) y tócalo **7 veces seguidas** hasta que aparezca el mensaje: *"¡Ahora eres desarrollador!"*.
4. Regresa al menú principal de Ajustes y entra a **Opciones de desarrollador** (o *Sistema > Opciones para desarrolladores*).
5. Activa el interruptor **Depuración por USB** (USB Debugging).
6. Activa también **Instalar vía USB** si tu fabricante (Xiaomi, Samsung, Huawei, etc.) lo solicita.

### Paso 2: Conectar el celular a tu PC
1. Conecta tu teléfono a la computadora mediante un cable USB de datos.
2. En la pantalla de tu celular aparecerá la ventana: **"¿Permitir depuración por USB?"**.
3. Marca la casilla *"Permitir siempre desde esta computadora"* y presiona **Permitir**.

### Paso 3: Comprobar conexión y Ejecutar
Abre una terminal en tu computadora y corre:
```bash
adb devices
```
Deberás ver tu dispositivo listado como:
```
List of devices attached
34891b0f    device
```

### Paso 4: Enrutar puerto y compilar/instalar
Si ejecutas el servidor de desarrollo en el puerto 3000:
```bash
adb reverse tcp:3000 tcp:3000
```
Para compilar e instalar el APK nativo:
```bash
cd android
chmod +x install_usb_debug.sh
./install_usb_debug.sh
```
O ábrelo directamente en **Android Studio** y presiona el botón verde **Run ▶** (Shift + F10) seleccionando tu teléfono físico conectado por USB.

---

## 🔍 Depuración en Vivo con Google Chrome (DevTools)
Gracias a que `MainActivity.kt` incluye:
```kotlin
WebView.setWebContentsDebuggingEnabled(true)
```
Puedes abrir en Google Chrome en tu PC:
```
chrome://inspect/#devices
```
Podrás ver la pantalla de tu celular, inspeccionar elementos, ver errores en consola en tiempo real y depurar el código JavaScript/CSS/HTML directamente mientras la app corre en tu celular.
