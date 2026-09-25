import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Heart,
  Zap,
  Cpu,
  Layers,
  Download,
  Copy,
  Check,
  Play,
  Square,
  AlertTriangle,
  Radio,
  Wifi,
  WifiOff,
  Flame,
  Footprints,
  RotateCcw,
  FileText,
  Wrench,
  Sparkles,
  Clock,
  User as UserIcon,
  TrendingUp,
  Sliders,
  Info,
  ChevronRight,
  ShieldAlert,
  Battery,
  Maximize2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Player, TeamInfo, AppUser, ArmbandTelemetryData, ArmbandConnectionStatus, TelemetrySessionRecord } from '../types';

interface IoTTelemetryHubProps {
  team: TeamInfo;
  players: Player[];
  currentUser: AppUser | null;
  onViewPlayerProfile?: (playerId: string) => void;
}

// BLE UUIDs according to Bluetooth SIG and Custom GATT
const HEART_RATE_SERVICE_UUID = 0x180d;
const HEART_RATE_MEASUREMENT_CHAR_UUID = 0x2a37;
const BATTERY_SERVICE_UUID = 0x180f;
const BATTERY_LEVEL_CHAR_UUID = 0x2a19;
// Custom GATT Service for MPU-6050 Sports IMU
const SPORTS_IMU_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const SPORTS_IMU_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

export const IoTTelemetryHub: React.FC<IoTTelemetryHubProps> = ({
  team,
  players,
  currentUser,
}) => {
  // Sub-tabs: 'telemetry' | 'hardware' | 'code' | 'sessions'
  const [activeSubTab, setActiveSubTab] = useState<'telemetry' | 'hardware' | 'code' | 'sessions'>('telemetry');

  // Selected Player wearing the smart armband
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(() => {
    if (currentUser?.playerId && players.some((p) => p.id === currentUser.playerId)) {
      return currentUser.playerId;
    }
    return players[0]?.id || 'p1';
  });

  // Connection State
  const [connectionStatus, setConnectionStatus] = useState<ArmbandConnectionStatus>('simulated');
  const [deviceName, setDeviceName] = useState<string>('ESP32-TeamGol-Brazalete (Simulado)');
  const [isWebBluetoothSupported, setIsWebBluetoothSupported] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simulation Intensity Control: 'rest' | 'jog' | 'run' | 'sprint'
  const [simIntensity, setSimIntensity] = useState<'rest' | 'jog' | 'run' | 'sprint'>('run');

  // Sound alert for dangerous heart rate (> 185 BPM)
  const [soundAlertEnabled, setSoundAlertEnabled] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Live Telemetry Data
  const [telemetry, setTelemetry] = useState<ArmbandTelemetryData>({
    heartRate: 142,
    spO2: 98,
    accelX: 0.12,
    accelY: 0.35,
    accelZ: 0.98,
    gForce: 1.05,
    intensity: 72,
    sprints: 3,
    cadence: 165,
    calories: 148,
    batteryLevel: 92,
    timestamp: Date.now(),
  });

  // Live Session Recording
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState<number>(0);
  const [recordedHistory, setRecordedHistory] = useState<ArmbandTelemetryData[]>([]);
  const [savedSessions, setSavedSessions] = useState<TelemetrySessionRecord[]>(() => {
    try {
      const stored = localStorage.getItem('teamgol_telemetry_sessions');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  });

  // Copied code toast
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Canvas ref for ECG / Pulse wave graph
  const ecgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ecgPointsRef = useRef<number[]>(new Array(120).fill(140));

  // Check Web Bluetooth support on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      setIsWebBluetoothSupported(true);
    } else {
      setIsWebBluetoothSupported(false);
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('teamgol_telemetry_sessions', JSON.stringify(savedSessions));
    } catch {
      // ignore
    }
  }, [savedSessions]);

  // Session timer counter
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setSessionElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Sound beeper alert when HR is dangerous (> 185 BPM)
  const triggerAudioBeep = () => {
    if (!soundAlertEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch alarm
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // audio context restricted
    }
  };

  // Telemetry loop: Simulated stream or live tick
  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus === 'simulated') {
        // Generate realistic values based on chosen intensity
        setTelemetry((prev) => {
          let targetBpm = 135;
          let targetG = 1.1;
          let targetCadence = 150;
          let targetIntensity = 65;
          let sprintChance = 0.05;

          if (simIntensity === 'rest') {
            targetBpm = 75;
            targetG = 1.0;
            targetCadence = 0;
            targetIntensity = 25;
            sprintChance = 0;
          } else if (simIntensity === 'jog') {
            targetBpm = 120;
            targetG = 1.25;
            targetCadence = 130;
            targetIntensity = 55;
            sprintChance = 0.02;
          } else if (simIntensity === 'run') {
            targetBpm = 155;
            targetG = 1.6;
            targetCadence = 165;
            targetIntensity = 78;
            sprintChance = 0.08;
          } else if (simIntensity === 'sprint') {
            targetBpm = 188;
            targetG = 2.4;
            targetCadence = 195;
            targetIntensity = 96;
            sprintChance = 0.25;
          }

          // Smooth random fluctuations
          const jitterBpm = Math.floor((Math.random() - 0.5) * 6);
          const newBpm = Math.max(55, Math.min(205, Math.round(prev.heartRate * 0.85 + targetBpm * 0.15 + jitterBpm)));
          
          if (newBpm > 185) {
            triggerAudioBeep();
          }

          const accelNoiseX = (Math.random() - 0.5) * (simIntensity === 'sprint' ? 1.5 : 0.4);
          const accelNoiseY = (Math.random() - 0.5) * (simIntensity === 'sprint' ? 1.5 : 0.4);
          const accelNoiseZ = 0.9 + (Math.random() - 0.5) * 0.3;
          const gTotal = Math.sqrt(accelNoiseX * accelNoiseX + accelNoiseY * accelNoiseY + accelNoiseZ * accelNoiseZ);

          const isSprintHit = simIntensity === 'sprint' || (gTotal > 2.1 && Math.random() < sprintChance);
          const newSprints = isSprintHit && Math.random() < 0.15 ? prev.sprints + 1 : prev.sprints;

          const newCadence = simIntensity === 'rest' ? 0 : Math.round(targetCadence + (Math.random() - 0.5) * 10);
          const newIntensity = Math.round(Math.min(100, Math.max(10, (newBpm / 195) * 100)));
          const newCalories = isRecording ? Number((prev.calories + 0.15).toFixed(1)) : prev.calories;

          const updated: ArmbandTelemetryData = {
            heartRate: newBpm,
            spO2: simIntensity === 'sprint' ? 96 : 98 + Math.floor(Math.random() * 2),
            accelX: Number(accelNoiseX.toFixed(2)),
            accelY: Number(accelNoiseY.toFixed(2)),
            accelZ: Number(accelNoiseZ.toFixed(2)),
            gForce: Number(gTotal.toFixed(2)),
            intensity: newIntensity,
            sprints: newSprints,
            cadence: newCadence,
            calories: newCalories,
            batteryLevel: Math.max(20, prev.batteryLevel - (Math.random() < 0.01 ? 1 : 0)),
            timestamp: Date.now(),
          };

          // Record history if active
          if (isRecording) {
            setRecordedHistory((hist) => [...hist.slice(-300), updated]);
          }

          // Push to ECG waveform buffer
          if (ecgPointsRef.current) {
            ecgPointsRef.current.push(newBpm);
            if (ecgPointsRef.current.length > 120) {
              ecgPointsRef.current.shift();
            }
          }

          return updated;
        });
      }
    }, 400);

    return () => clearInterval(interval);
  }, [connectionStatus, simIntensity, isRecording, soundAlertEnabled]);

  // Draw smooth live ECG waveform on canvas
  useEffect(() => {
    const canvas = ecgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      phase += (telemetry.heartRate / 60) * 0.12;
      const width = canvas.width;
      const height = canvas.height;

      // Dark athletic grid background
      ctx.fillStyle = '#0B132B';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = '#1C2541';
      ctx.lineWidth = 1;
      const gridStep = 20;
      for (let x = 0; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ECG Pulse trace line
      ctx.beginPath();
      const centerY = height / 2;

      // Color depends on cardiac zone
      let strokeColor = '#10B981'; // Green
      if (telemetry.heartRate > 175) strokeColor = '#EF4444'; // Red danger
      else if (telemetry.heartRate > 155) strokeColor = '#F59E0B'; // Orange
      else if (telemetry.heartRate > 135) strokeColor = '#3B82F6'; // Blue

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 10;

      const points = ecgPointsRef.current;
      const stepX = width / (points.length - 1);

      for (let i = 0; i < points.length; i++) {
        const x = i * stepX;
        // Synthesize realistic P-Q-R-S-T wave component
        const wavePos = (i * 0.15 + phase) % (Math.PI * 2);
        let ecgSpike = 0;
        if (wavePos > 2.0 && wavePos < 2.2) {
          // P wave
          ecgSpike = -8;
        } else if (wavePos > 2.6 && wavePos < 2.7) {
          // Q dip
          ecgSpike = 12;
        } else if (wavePos > 2.7 && wavePos < 2.9) {
          // R spike (ventricular depolarization)
          ecgSpike = -42 * (telemetry.heartRate / 120);
        } else if (wavePos > 2.9 && wavePos < 3.05) {
          // S dip
          ecgSpike = 18;
        } else if (wavePos > 3.4 && wavePos < 3.8) {
          // T wave
          ecgSpike = -12;
        }

        const y = centerY + ecgSpike;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Leading pulsing glow dot at the head of the trace
      const lastX = width - 4;
      const lastWavePos = ((points.length - 1) * 0.15 + phase) % (Math.PI * 2);
      let lastSpike = 0;
      if (lastWavePos > 2.7 && lastWavePos < 2.9) lastSpike = -35;
      const lastY = centerY + lastSpike;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [telemetry.heartRate]);

  // Web Bluetooth API Connector for ESP32
  const handleConnectBluetooth = async () => {
    setErrorMessage(null);
    const nav = navigator as any;
    if (!nav.bluetooth) {
      setErrorMessage('Tu navegador no soporta Web Bluetooth API. Usa Google Chrome o Microsoft Edge.');
      return;
    }

    try {
      setConnectionStatus('connecting');
      // Request device with standard Heart Rate service or custom Sports IMU
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'ESP32' },
          { namePrefix: 'TeamGol' },
          { services: [HEART_RATE_SERVICE_UUID] },
        ],
        optionalServices: [
          HEART_RATE_SERVICE_UUID,
          BATTERY_SERVICE_UUID,
          SPORTS_IMU_SERVICE_UUID,
        ],
      });

      setDeviceName(device.name || 'ESP32 Deportivo');
      const server = await device.gatt.connect();

      // Try reading Heart Rate Service
      try {
        const hrService = await server.getPrimaryService(HEART_RATE_SERVICE_UUID);
        const hrChar = await hrService.getCharacteristic(HEART_RATE_MEASUREMENT_CHAR_UUID);
        await hrChar.startNotifications();
        hrChar.addEventListener('characteristicvaluechanged', (event: any) => {
          const value = event.target.value;
          // Parse standard Heart Rate Measurement
          const flags = value.getUint8(0);
          const is16Bit = flags & 0x01;
          const hr = is16Bit ? value.getUint16(1, true) : value.getUint8(1);
          setTelemetry((prev) => ({
            ...prev,
            heartRate: hr,
            timestamp: Date.now(),
          }));
        });
      } catch (hrErr) {
        console.warn('Standard HR service not active, trying custom IMU...', hrErr);
      }

      setConnectionStatus('connected');
    } catch (err: any) {
      console.error('BLE connection error:', err);
      setConnectionStatus('simulated');
      setErrorMessage(
        err.message || 'No se pudo conectar al dispositivo ESP32. Revisa que el Bluetooth esté encendido.'
      );
    }
  };

  const handleDisconnect = () => {
    setConnectionStatus('disconnected');
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setSessionStartTime(Date.now());
    setSessionElapsedSeconds(0);
    setRecordedHistory([]);
  };

  const handleStopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);

    // Compute session summary
    const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
    const avgBpm = recordedHistory.length
      ? Math.round(recordedHistory.reduce((acc, curr) => acc + curr.heartRate, 0) / recordedHistory.length)
      : telemetry.heartRate;
    const maxBpm = recordedHistory.length
      ? Math.max(...recordedHistory.map((h) => h.heartRate))
      : telemetry.heartRate;
    const highIntensityMin = Math.round(
      (recordedHistory.filter((h) => h.heartRate > 160).length * 0.4) / 60
    );

    const newSession: TelemetrySessionRecord = {
      id: `session_${Date.now()}`,
      playerId: selectedPlayerId,
      playerName: selectedPlayer?.name || 'Jugador',
      date: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      startTime: sessionStartTime || Date.now(),
      durationSeconds: sessionElapsedSeconds,
      avgBpm,
      maxBpm,
      sprintsCount: telemetry.sprints,
      caloriesBurned: Math.round(telemetry.calories),
      highIntensityMinutes: highIntensityMin,
    };

    setSavedSessions((prev) => [newSession, ...prev]);
  };

  // Heart Rate Zone helper
  const getHeartRateZone = (bpm: number) => {
    if (bpm < 115) return { name: 'Calentamiento', color: 'text-sky-600 bg-sky-50 border-sky-200', range: '50-60%' };
    if (bpm < 135) return { name: 'Quema Grasa', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', range: '60-70%' };
    if (bpm < 155) return { name: 'Aeróbica (Cardio)', color: 'text-blue-600 bg-blue-50 border-blue-200', range: '70-80%' };
    if (bpm < 175) return { name: 'Umbral Anaeróbico', color: 'text-amber-600 bg-amber-50 border-amber-200', range: '80-90%' };
    return { name: 'Esfuerzo Máximo / Peligro', color: 'text-rose-600 bg-rose-50 border-rose-200 font-black animate-pulse', range: '90-100%' };
  };

  const hrZone = getHeartRateZone(telemetry.heartRate);
  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

  // Complete Arduino IDE C++ Sketch Code
  const arduinoSketchCode = `/*
  ==============================================================
   TEAMGOL - BRAZALETE DEPORTIVO INTELIGENTE CASERO CON ESP32
   Sensores:
     - MAX30102 (Frecuencia Cardíaca PPG por I2C)
     - MPU-6050 (Acelerómetro & Giroscopio por I2C)
   Conectividad:
     - Bluetooth Low Energy (BLE) estándar + GATT Custom
  ==============================================================
  Conexión I2C común (ESP32):
    ESP32 GPIO 21  -->  SDA (MAX30102 y MPU-6050)
    ESP32 GPIO 22  -->  SCL (MAX30102 y MPU-6050)
    ESP32 3.3V     -->  VCC (Ambos sensores)
    ESP32 GND      -->  GND (Ambos sensores)
*/

#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Instancias de Sensores
Adafruit_MPU6050 mpu;
MAX30105 particleSensor;

// UUIDs BLE estándar y personalizados
#define SERVICE_UUID_HEART_RATE       "0000180d-0000-1000-8000-00805f9b34fb"
#define CHAR_UUID_HEART_RATE_MEASURE  "00002a37-0000-1000-8000-00805f9b34fb"
#define SERVICE_UUID_SPORTS_IMU       "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHAR_UUID_SPORTS_IMU_DATA     "beb5483e-36e1-4688-b7f5-ea07361b26a8"

BLEServer* pServer = NULL;
BLECharacteristic* pHeartRateChar = NULL;
BLECharacteristic* pImuChar = NULL;
bool deviceConnected = false;

// Variables de ritmo cardíaco
const byte RATE_SIZE = 4;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;
float beatsPerMinute = 0;
int beatAvg = 75;

// Detección de sprints
int sprintCount = 0;
unsigned long lastSprintCheck = 0;

class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println(">> App conectada por Bluetooth!");
    };
    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println(">> Dispositivo desconectado.");
      BLEDevice::startAdvertising(); // Reiniciar visibilidad
    }
};

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22); // SDA = 21, SCL = 22

  Serial.println("\\n--- INICIALIZANDO BRAZALETE TEAMGOL ---");

  // 1. Iniciar MPU-6050 (Acelerómetro/Giroscopio)
  if (!mpu.begin()) {
    Serial.println("Error: MPU-6050 no detectado. Revisa cables I2C.");
  } else {
    Serial.println("MPU-6050 listo (Rango: +-8G)");
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  }

  // 2. Iniciar MAX30102 (Sensor Óptico de Pulso)
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("Error: MAX30102 no detectado. Revisa I2C.");
  } else {
    Serial.println("MAX30102 listo en cara interna.");
    particleSensor.setup(); 
    particleSensor.setPulseAmplitudeRed(0x0A); // Led rojo suave para ahorrar batería
    particleSensor.setPulseAmplitudeGreen(0);  // Apagar verde
  }

  // 3. Iniciar Servidor BLE en ESP32
  BLEDevice::init("ESP32-TeamGol-Brazalete");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Servicio Estándar de Frecuencia Cardíaca (0x180D)
  BLEService *pHRService = pServer->createService(SERVICE_UUID_HEART_RATE);
  pHeartRateChar = pHRService->createCharacteristic(
                      CHAR_UUID_HEART_RATE_MEASURE,
                      BLECharacteristic::PROPERTY_NOTIFY
                    );
  pHeartRateChar->addDescriptor(new BLE2902());
  pHRService->start();

  // Servicio Personalizado para Deportes (IMU, G-Force, Sprints)
  BLEService *pImuService = pServer->createService(SERVICE_UUID_SPORTS_IMU);
  pImuChar = pImuService->createCharacteristic(
                CHAR_UUID_SPORTS_IMU_DATA,
                BLECharacteristic::PROPERTY_READ |
                BLECharacteristic::PROPERTY_NOTIFY
             );
  pImuChar->addDescriptor(new BLE2902());
  pImuService->start();

  // Anunciar Bluetooth
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID_HEART_RATE);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  BLEDevice::startAdvertising();
  Serial.println(">> Bluetooth BLE activo. Esperando conexión desde TeamGol...");
}

void loop() {
  // Leer pulso con MAX30102
  long irValue = particleSensor.getIR();

  if (checkForBeat(irValue) == true) {
    long delta = millis() - lastBeat;
    lastBeat = millis();
    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute < 230 && beatsPerMinute > 45) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;
      beatAvg = 0;
      for (byte x = 0 ; x < RATE_SIZE ; x++) beatAvg += rates[x];
      beatAvg /= RATE_SIZE;
    }
  }

  // Leer aceleración y detectar sprints cada 150ms
  if (millis() - lastSprintCheck > 150) {
    lastSprintCheck = millis();
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    // Calcular magnitud resultante de G-force (m/s^2 a G dividiendo entre 9.81)
    float gForce = sqrt(a.acceleration.x * a.acceleration.x + 
                        a.acceleration.y * a.acceleration.y + 
                        a.acceleration.z * a.acceleration.z) / 9.81;

    // Detección de sprint: G-force superior a 2.0G
    if (gForce > 2.0) {
      sprintCount++;
    }

    // Transmitir datos por Bluetooth si la app está conectada
    if (deviceConnected) {
      // 1. Notificar Frecuencia Cardíaca estándar (formato BLE Heart Rate)
      uint8_t hrPayload[2] = { 0b00000000, (uint8_t)beatAvg };
      pHeartRateChar->setValue(hrPayload, 2);
      pHeartRateChar->notify();

      // 2. Notificar Telemetría Deportiva en JSON compacto
      char imuBuffer[64];
      snprintf(imuBuffer, sizeof(imuBuffer), 
               "{\\"g\\":%.2f,\\"ax\\":%.2f,\\"ay\\":%.2f,\\"az\\":%.2f,\\"sp\\":%d}", 
               gForce, a.acceleration.x/9.81, a.acceleration.y/9.81, a.acceleration.z/9.81, sprintCount);
      pImuChar->setValue((uint8_t*)imuBuffer, strlen(imuBuffer));
      pImuChar->notify();
    }
  }
}
`;

  const copyArduinoCode = () => {
    navigator.clipboard.writeText(arduinoSketchCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const downloadArduinoFile = () => {
    const blob = new Blob([arduinoSketchCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Brazalete_ESP32_TeamGol.ino';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header with IoT Badge */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#CED0D4] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-md shrink-0">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#050505] tracking-tight">
                  Brazalete Deportivo Inteligente (ESP32 IoT)
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Prototipo Casero 100%
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#65676B] mt-0.5">
                Monitoreo físico en tiempo real con ESP32, acelerómetro MPU-6050 y sensor de pulso MAX30102.
              </p>
            </div>
          </div>

          {/* Quick Subtab Bar */}
          <div className="flex items-center gap-1.5 bg-[#F0F2F5] p-1.5 rounded-xl border border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('telemetry')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSubTab === 'telemetry'
                  ? 'bg-white text-[#1877F2] shadow-xs'
                  : 'text-[#65676B] hover:text-[#050505]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Telemetría en Vivo</span>
            </button>
            <button
              onClick={() => setActiveSubTab('hardware')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSubTab === 'hardware'
                  ? 'bg-white text-[#1877F2] shadow-xs'
                  : 'text-[#65676B] hover:text-[#050505]'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Guía de Montaje Casero</span>
            </button>
            <button
              onClick={() => setActiveSubTab('code')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSubTab === 'code'
                  ? 'bg-white text-[#1877F2] shadow-xs'
                  : 'text-[#65676B] hover:text-[#050505]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Código Arduino IDE (.ino)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('sessions')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSubTab === 'sessions'
                  ? 'bg-white text-[#1877F2] shadow-xs'
                  : 'text-[#65676B] hover:text-[#050505]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Historial ({savedSessions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: LIVE TELEMETRY DASHBOARD */}
      {/* ========================================================= */}
      {activeSubTab === 'telemetry' && (
        <div className="space-y-6">
          {/* Hardware Connection & Player Allocation Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#CED0D4] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Device status & controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    connectionStatus === 'connected'
                      ? 'bg-emerald-500 animate-ping'
                      : connectionStatus === 'simulated'
                      ? 'bg-blue-500'
                      : 'bg-rose-500'
                  }`}
                />
                <span className="text-xs font-black uppercase text-[#050505]">
                  {connectionStatus === 'connected'
                    ? 'ESP32 Conectado (BLE)'
                    : connectionStatus === 'simulated'
                    ? 'Modo Simulador En Vivo'
                    : 'Desconectado'}
                </span>
              </div>

              <span className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-mono">
                {deviceName}
              </span>

              {/* Battery indicator */}
              <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                <Battery className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold">{telemetry.batteryLevel}%</span>
              </div>

              {/* Sound alert toggle */}
              <button
                onClick={() => setSoundAlertEnabled(!soundAlertEnabled)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                  soundAlertEnabled
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
                title="Alarma sonora si el pulso excede 185 BPM"
              >
                {soundAlertEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Alarma {soundAlertEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Right: Connect Bluetooth or Switch Simulation */}
            <div className="flex flex-wrap items-center gap-2">
              {isWebBluetoothSupported && (
                <button
                  onClick={handleConnectBluetooth}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#1877F2] text-white hover:bg-blue-600 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Vincular ESP32 Bluetooth</span>
                </button>
              )}

              {connectionStatus !== 'simulated' && (
                <button
                  onClick={() => setConnectionStatus('simulated')}
                  className="px-3 py-2 text-xs font-bold rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Activar Simulador</span>
                </button>
              )}

              {/* Player Wearer Selector */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
                <span className="text-xs text-gray-500 font-semibold hidden sm:inline">Jugador:</span>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg text-xs font-bold px-2.5 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1877F2] cursor-pointer"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.number} - {p.name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Simulation Intensity Controller (if in simulation mode) */}
          {connectionStatus === 'simulated' && (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-4 border border-blue-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#1877F2]" />
                <span className="text-xs font-bold text-gray-800">
                  Control del Simulador Físico (Prueba en vivo sin circuito físico conectado):
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'rest', label: 'Reposo (75 BPM)' },
                  { id: 'jog', label: 'Trote Suave (120 BPM)' },
                  { id: 'run', label: 'Carrera / Partido (155 BPM)' },
                  { id: 'sprint', label: 'Sprint Máximo (190 BPM 🔥)' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSimIntensity(mode.id as any)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      simIntensity === mode.id
                        ? 'bg-[#1877F2] text-white shadow-xs'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dangerous BPM Warning Alert */}
          {telemetry.heartRate > 185 && (
            <div className="bg-rose-500 text-white p-3.5 rounded-xl shadow-lg flex items-center justify-between animate-bounce">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-white" />
                <div>
                  <span className="font-black text-sm uppercase">¡Alerta de Esfuerzo Máximo Peligroso!</span>
                  <p className="text-xs text-rose-100">
                    {selectedPlayer?.name || 'El jugador'} supera los 185 BPM. Se recomienda descanso o sustitución preventiva en la cancha.
                  </p>
                </div>
              </div>
              <span className="font-mono text-xl font-black bg-rose-700/60 px-3 py-1 rounded-lg">
                {telemetry.heartRate} BPM
              </span>
            </div>
          )}

          {/* Main Telemetry Grid: Heart Rate Monitor + MPU6050 Motion */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cardiac PPG Monitor Panel (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-[#CED0D4] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-600 fill-rose-600 animate-pulse" />
                    <h3 className="font-black text-sm text-[#050505]">
                      Frecuencia Cardíaca en Tiempo Real (MAX30102 PPG)
                    </h3>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${hrZone.color}`}>
                    {hrZone.name} ({hrZone.range})
                  </span>
                </div>

                {/* Big BPM Display & Secondary Metrics */}
                <div className="grid grid-cols-3 gap-3 my-4">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                    <span className="text-[11px] text-gray-500 font-bold uppercase block">Pulso Actual</span>
                    <div className="flex items-baseline justify-center gap-1 mt-1">
                      <span className="text-3xl sm:text-4xl font-black font-mono text-[#050505]">
                        {telemetry.heartRate}
                      </span>
                      <span className="text-xs text-rose-600 font-bold">BPM</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                    <span className="text-[11px] text-gray-500 font-bold uppercase block">Oxígeno SpO2</span>
                    <div className="flex items-baseline justify-center gap-1 mt-1">
                      <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-600">
                        {telemetry.spO2}
                      </span>
                      <span className="text-xs text-emerald-600 font-bold">%</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                    <span className="text-[11px] text-gray-500 font-bold uppercase block">Intensidad</span>
                    <div className="flex items-baseline justify-center gap-1 mt-1">
                      <span className="text-3xl sm:text-4xl font-black font-mono text-blue-600">
                        {telemetry.intensity}
                      </span>
                      <span className="text-xs text-blue-600 font-bold">%</span>
                    </div>
                  </div>
                </div>

                {/* Live ECG Canvas Waveform */}
                <div className="relative rounded-xl overflow-hidden border border-gray-800 shadow-inner">
                  <canvas
                    ref={ecgCanvasRef}
                    width={520}
                    height={140}
                    className="w-full h-36 block bg-[#0B132B]"
                  />
                  <div className="absolute top-2 left-3 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>TRAZADO ÓPTICO MAX30102 • 100 Hz</span>
                  </div>
                  <div className="absolute bottom-2 right-3 text-[10px] font-mono text-gray-400 bg-black/50 px-2 py-0.5 rounded">
                    Cara interna del antebrazo
                  </div>
                </div>
              </div>

              {/* Cardiac Zones Progress Bar */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-500 uppercase block mb-1.5">
                  Zonas Cardiovasculares FIFA / UEFA:
                </span>
                <div className="w-full h-2.5 rounded-full bg-gray-200 flex overflow-hidden">
                  <div className="w-[20%] bg-sky-400" title="Zona 1: Calentamiento (50-60%)" />
                  <div className="w-[20%] bg-emerald-400" title="Zona 2: Quema Grasa (60-70%)" />
                  <div className="w-[20%] bg-blue-500" title="Zona 3: Aeróbica (70-80%)" />
                  <div className="w-[20%] bg-amber-500" title="Zona 4: Umbral Anaeróbico (80-90%)" />
                  <div className="w-[20%] bg-rose-500" title="Zona 5: Máximo Esfuerzo (90-100%)" />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-1">
                  <span>50%</span>
                  <span>70%</span>
                  <span>85%</span>
                  <span>100% (200 BPM)</span>
                </div>
              </div>
            </div>

            {/* MPU-6050 Motion & Sprint Acceleration Panel (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#CED0D4] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <h3 className="font-black text-sm text-[#050505]">
                      Movimiento & Sprints (MPU-6050)
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">
                    6 Ejes I2C
                  </span>
                </div>

                {/* G-Force & Sprints Highlight Card */}
                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3.5 border border-amber-200">
                    <span className="text-[11px] text-amber-800 font-bold uppercase block">Fuerza G Resultante</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-black font-mono text-amber-900">
                        {telemetry.gForce}
                      </span>
                      <span className="text-xs text-amber-700 font-bold">G</span>
                    </div>
                    <span className="text-[10px] text-amber-700 mt-1 block">
                      {telemetry.gForce > 2.0 ? '⚡ Alta Aceleración / Giro' : 'Movimiento Regular'}
                    </span>
                  </div>

                  <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-xl p-3.5 border border-rose-200">
                    <span className="text-[11px] text-rose-800 font-bold uppercase block">Sprints Registrados</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-black font-mono text-rose-900">
                        {telemetry.sprints}
                      </span>
                      <span className="text-xs text-rose-700 font-bold">piques</span>
                    </div>
                    <span className="text-[10px] text-rose-700 mt-1 block">
                      Umbral de sprint: &gt; 2.0 G
                    </span>
                  </div>
                </div>

                {/* 3-Axis Accelerometer Visualizer */}
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 space-y-2.5">
                  <span className="text-[11px] font-bold text-gray-700 uppercase block">
                    Acelerómetro 3 Ejes (G):
                  </span>

                  <div>
                    <div className="flex justify-between text-xs font-mono font-bold">
                      <span className="text-blue-600">Eje X (Lateral):</span>
                      <span>{telemetry.accelX} G</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.abs(telemetry.accelX) * 50)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono font-bold">
                      <span className="text-emerald-600">Eje Y (Frontal/Zancada):</span>
                      <span>{telemetry.accelY} G</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.abs(telemetry.accelY) * 50)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono font-bold">
                      <span className="text-purple-600">Eje Z (Vertical/Impacto):</span>
                      <span>{telemetry.accelZ} G</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-purple-500 h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.abs(telemetry.accelZ) * 50)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Athletic Metrics: Cadence & Calories */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2.5 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <Footprints className="w-5 h-5 text-indigo-600" />
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Cadencia</span>
                    <span className="text-sm font-black text-gray-800 font-mono">
                      {telemetry.cadence} <span className="text-[10px] font-normal">pasos/min</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Calorías</span>
                    <span className="text-sm font-black text-gray-800 font-mono">
                      {telemetry.calories} <span className="text-[10px] font-normal">kcal</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Recording Card (Grabar Partido / Entrenamiento) */}
          <div className="bg-gradient-to-r from-gray-900 via-[#182138] to-gray-900 text-white rounded-2xl p-5 shadow-lg border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isRecording ? 'bg-rose-600 animate-pulse text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  {isRecording ? 'Grabando Sesión Deportiva en Vivo' : 'Registro de Sesión para Rendimiento'}
                </h4>
                <p className="text-xs text-gray-300">
                  {isRecording
                    ? `Monitoreando a ${selectedPlayer?.name || 'Jugador'} • ${recordedHistory.length} muestras recopiladas`
                    : 'Graba partidos o entrenamientos para calcular pulso promedio, picos cardíacos y sprints.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isRecording && (
                <div className="bg-black/40 px-3.5 py-1.5 rounded-xl border border-white/10 font-mono text-base font-black text-emerald-400">
                  {Math.floor(sessionElapsedSeconds / 60)
                    .toString()
                    .padStart(2, '0')}
                  :{(sessionElapsedSeconds % 60).toString().padStart(2, '0')}
                </div>
              )}

              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Iniciar Grabación de Sesión</span>
                </button>
              ) : (
                <button
                  onClick={handleStopRecording}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer animate-pulse"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Detener y Guardar Sesión</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: DIY HARDWARE & BRICOLAJE GUIDE */}
      {/* ========================================================= */}
      {activeSubTab === 'hardware' && (
        <div className="space-y-6">
          {/* Key Anatomical Insight Banner */}
          <div className="bg-blue-50 border-l-4 border-[#1877F2] p-4 rounded-xl shadow-xs">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#1877F2] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-blue-900">
                  Principio Biomecánico: ¿Por qué en la cara interna del antebrazo?
                </h4>
                <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                  Para medir datos deportivos en fútbol y atletismo, colocar el sensor <strong>MAX30102 en la cara interna del antebrazo</strong> permite que la luz infrarroja capte directamente el flujo pulsátil de las arterias radial y cubital superficiales, reduciendo en un 80% el ruido mecánico causado por el movimiento de la muñeca. La cajita con el ESP32 y la batería se coloca en la <strong>cara externa o lateral</strong> para protegerlos de impactos con el balón.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Materiales para la Pulsera Casera */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#CED0D4] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
                1
              </span>
              <h3 className="font-black text-base text-[#050505]">
                Materiales para la Pulsera / Brazalete (100% Casero y Económico)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h4 className="font-bold text-xs uppercase text-emerald-800 tracking-wide mb-1">
                  Banda de Neopreno o Elástico Ancho (5 a 7 cm)
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Puedes reciclar una <strong>codera elástica vieja</strong>, un brazalete deportivo para celular que ya no uses, o comprar en mercería un trozo de elástico textil grueso. Brinda sujeción sin cortar la circulación.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h4 className="font-bold text-xs uppercase text-emerald-800 tracking-wide mb-1">
                  Cinta Velcro (Macho y Hembra)
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Permite ajustar la presión en el brazo fácilmente durante el calentamiento y aflojarlo en el entretiempo.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h4 className="font-bold text-xs uppercase text-emerald-800 tracking-wide mb-1">
                  Caja de plástico pequeña y ligera ("El Gabinete")
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Una cajita de caramelos (tipo <strong>Tic Tac</strong> o similar), una pequeña caja de chicles plástica, un trozo de tubo PVC delgado o una funda de tela acolchada hecha a mano.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h4 className="font-bold text-xs uppercase text-emerald-800 tracking-wide mb-1">
                  Aguja e hilo o silicona caliente / pegamento textil
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Para fijar el velcro y la cajita al elástico de manera resistente a tirones y sudor deportivo.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Componentes Electrónicos Básicos */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#CED0D4] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center">
                2
              </span>
              <h3 className="font-black text-base text-[#050505]">
                Componentes Electrónicos Básicos (El "Cerebro")
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-lg">Componente</th>
                    <th className="py-2.5 px-3">Función Deportiva</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Notas & Recomendaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-3 font-bold text-[#050505] flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#1877F2]" />
                      ESP32 (NodeMCU o ESP32-C3)
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      Microprocesador con Bluetooth BLE y Wi-Fi integrados. Procesa ritmos y aceleración.
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      Económico ($3-$5 USD). Muy fácil de programar por USB con Arduino IDE.
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-3 font-bold text-[#050505] flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Sensor MPU-6050
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      Acelerómetro y Giroscopio 6 ejes. Mide saltos, giros, cadencia de zancadas y sprints.
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      Conexión rápida por I2C (SDA/SCL compartidos con el MAX30102).
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-3 font-bold text-[#050505] flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500" />
                      Sensor MAX30102
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      Sensor óptico de pulso (PPG) y oxigenación. Mide la frecuencia cardíaca (BPM).
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      Debe tocar directamente la piel sin que entre luz ambiental.
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-3 font-bold text-[#050505] flex items-center gap-2">
                      <Battery className="w-4 h-4 text-emerald-600" />
                      Batería LiPo 3.7V o Mini Powerbank
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      Alimentación eléctrica portátil para el partido completo.
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      Para pruebas en mesa sirve el mismo cable USB conectado a la laptop.
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-3 font-bold text-[#050505] flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-purple-600" />
                      Cables Jumpers / Protoboard Mini
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      Conexiones rápidas sin soldadura para probar antes de coser.
                    </td>
                    <td className="py-3 px-3 text-gray-500">
                      No necesitas cautín ni estaño al principio.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pinout Wiring Diagram Box */}
            <div className="bg-[#0B132B] text-white p-4 rounded-xl font-mono text-xs space-y-2 border border-blue-900">
              <span className="text-emerald-400 font-bold block">
                🔌 ESQUEMA DE CONEXIÓN I2C (Cableado Rápido):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-300">
                <div className="bg-white/5 p-2 rounded">
                  <span className="text-amber-400 font-bold">ESP32 Pinout:</span>
                  <div>• 3.3V  ➔ VCC de MPU-6050 y MAX30102</div>
                  <div>• GND   ➔ GND de MPU-6050 y MAX30102</div>
                  <div>• GPIO 21 ➔ SDA (Ambos sensores)</div>
                  <div>• GPIO 22 ➔ SCL (Ambos sensores)</div>
                </div>
                <div className="bg-white/5 p-2 rounded">
                  <span className="text-cyan-400 font-bold">Ventaja del bus I2C:</span>
                  <div>• Ambos sensores comparten SDA y SCL en paralelo porque tienen direcciones I2C distintas:</div>
                  <div>  - MPU-6050: 0x68</div>
                  <div>  - MAX30102: 0x57</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Ensamblaje Paso a Paso */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#CED0D4] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-black text-sm flex items-center justify-center">
                3
              </span>
              <h3 className="font-black text-base text-[#050505]">
                Cómo ensamblar el prototipo casero paso a paso
              </h3>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#050505]">
                    Montaje de prueba en mesa (Breadboard)
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Verifica que todo encienda antes de coser. Conecta el ESP32, el MPU-6050 y el MAX30102 en una mini-protoboard usando cables Dupont/Jumper. Conéctalo a tu computadora por USB para programar el código inicial y validar lectura de datos en el Monitor Serie de Arduino IDE.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#050505]">
                    Preparación de la caja protectora (Aislamiento y salidas)
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Haz una pequeña perforación en la cajita de plástico (o envase Tic Tac) para que el sensor cardíaco (MAX30102) sobresalga ligeramente hacia abajo (para tocar la piel) y otra ranura para el cable USB o el conector de la batería. Puedes pegar un anillo de goma eva negra alrededor del sensor óptico para aislarlo de la luz solar en la cancha.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#050505]">
                    Confección de la banda elástica (Ajuste al antebrazo)
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Corta el elástico a la medida de tu antebrazo dejando 3 a 4 cm extra. Cose o pega con pegamento textil los trozos de velcro en los extremos para poder ponértelo y quitártelo con ajuste firme pero cómodo, sin cortar la irrigación sanguínea durante el partido.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-[#1877F2] text-white font-bold flex items-center justify-center shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#050505]">
                    Montaje final del circuito (Fijación textil)
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Pega o cose la cajita de plástico en el exterior del brazalete. Asegúrate de que el sensor cardíaco quede mirando directamente hacia la piel en el lado interno del antebrazo. ¡Listo! Ya tienes un monitor deportivo profesional de telemetría por menos de $15 USD.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: ARDUINO IDE FIRMWARE CODE (.INO) */}
      {/* ========================================================= */}
      {activeSubTab === 'code' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#CED0D4] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-black text-base text-[#050505]">
                  Firmware Arduino IDE para ESP32 (.ino)
                </h3>
                <p className="text-xs text-[#65676B]">
                  Código completo con servidor BLE Heart Rate estándar y características para aceleración MPU-6050.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyArduinoCode}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? '¡Copiado!' : 'Copiar Código'}</span>
                </button>

                <button
                  onClick={downloadArduinoFile}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar .ino</span>
                </button>
              </div>
            </div>

            {/* Quick Setup Instructions in Arduino IDE */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs space-y-1 text-amber-900">
              <span className="font-bold block text-sm">🛠️ Instrucciones de compilación en Arduino IDE:</span>
              <p>
                1. Instala el paquete de placas <strong>esp32 by Espressif Systems</strong> en el Administrador de Placas.
              </p>
              <p>
                2. En <strong>Herramientas &gt; Administrar Bibliotecas</strong>, instala:
              </p>
              <ul className="list-disc list-inside font-mono text-[11px] ml-2 text-amber-950">
                <li><strong>Adafruit MPU6050</strong> (junto con Adafruit Unified Sensor)</li>
                <li><strong>SparkFun MAX3010x Pulse and Proximity Sensor Library</strong></li>
              </ul>
              <p>
                3. Selecciona la placa <strong>ESP32 Dev Module</strong> (o <strong>ESP32C3 Dev Module</strong>) y el puerto COM correcto.
              </p>
              <p>
                4. Presiona <strong>Subir (Upload)</strong>. Al terminar, abre la consola serie a <strong>115200 baudios</strong>.
              </p>
            </div>

            {/* Code Editor Preview */}
            <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-[#0B132B]">
              <div className="bg-[#1C2541] px-4 py-2 flex items-center justify-between text-xs text-gray-300 font-mono border-b border-gray-800">
                <span>Brazalete_ESP32_TeamGol.ino</span>
                <span className="text-[10px] text-emerald-400 font-bold">C++ / Arduino IDE</span>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-[500px] leading-relaxed">
                {arduinoSketchCode}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 4: SESSIONS HISTORY & EXPORT */}
      {/* ========================================================= */}
      {activeSubTab === 'sessions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#CED0D4] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-black text-base text-[#050505]">
                  Historial de Sesiones Grabadas con el Brazalete
                </h3>
                <p className="text-xs text-[#65676B]">
                  Resumen fisiológico de entrenamientos y partidos disputados por cada jugador.
                </p>
              </div>

              {savedSessions.length > 0 && (
                <button
                  onClick={() => {
                    const csvContent =
                      'data:text/csv;charset=utf-8,' +
                      'Fecha,Jugador,Duracion_Seg,BPM_Promedio,BPM_Maximo,Sprints,Calorias,Minutos_Alta_Intensidad\n' +
                      savedSessions
                        .map(
                          (s) =>
                            `"${s.date}","${s.playerName}",${s.durationSeconds},${s.avgBpm},${s.maxBpm},${s.sprintsCount},${s.caloriesBurned},${s.highIntensityMinutes}`
                        )
                        .join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `reporte_telemetria_${team.shortName}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
              )}
            </div>

            {savedSessions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-gray-700">No hay sesiones grabadas todavía</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  Ve a la pestaña <strong>Telemetría en Vivo</strong> y presiona "Iniciar Grabación de Sesión" durante un partido o entrenamiento para registrar datos físicos.
                </p>
                <button
                  onClick={() => setActiveSubTab('telemetry')}
                  className="mt-4 px-4 py-2 text-xs font-bold rounded-xl bg-[#1877F2] text-white hover:bg-blue-600 transition-all cursor-pointer"
                >
                  Ir a Telemetría en Vivo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1877F2] font-black text-xs flex items-center justify-center">
                          {session.playerName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-gray-900 block">
                            {session.playerName}
                          </span>
                          <span className="text-[11px] text-gray-500">{session.date}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                        {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-200 text-center">
                      <div className="bg-white p-2 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-gray-400 uppercase block font-bold">Prom BPM</span>
                        <span className="text-sm font-black text-gray-800 font-mono">{session.avgBpm}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-rose-500 uppercase block font-bold">Max BPM</span>
                        <span className="text-sm font-black text-rose-600 font-mono">{session.maxBpm}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-amber-500 uppercase block font-bold">Sprints</span>
                        <span className="text-sm font-black text-amber-600 font-mono">{session.sprintsCount}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-emerald-500 uppercase block font-bold">Calorías</span>
                        <span className="text-sm font-black text-emerald-600 font-mono">{session.caloriesBurned}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
