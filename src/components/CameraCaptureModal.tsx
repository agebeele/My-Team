import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  title?: string;
  subtitle?: string;
  playerName?: string;
  dorsal?: string | number;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Tomar Foto del Jugador',
  subtitle = 'Centra el rostro del jugador dentro del marco',
  playerName,
  dorsal,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const countdownTimerRef = useRef<any>(null);

  // Initialize camera when opened
  useEffect(() => {
    if (isOpen) {
      setCapturedDataUrl(null);
      setCameraError(null);
      startCamera(cameraFacing);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isOpen]);

  const startCamera = async (facing: 'user' | 'environment') => {
    stopCamera();
    setIsStartingCamera(true);
    setCameraError(null);

    try {
      // Check mediaDevices support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara no está disponible en este dispositivo o navegador.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsStartingCamera(false);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setIsStartingCamera(false);
      setCameraError(
        'No se pudo acceder a la cámara en vivo. Puedes subir una foto desde tu galería o usar la cámara nativa de tu dispositivo.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleSwitchCamera = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const handleTakeSnapshotWithCountdown = () => {
    if (countdown !== null) return;
    setCountdown(3);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownTimerRef.current);
          takeSnapshotDirect();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const takeSnapshotDirect = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Create square crop for player portrait
    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;
    const side = Math.min(vWidth, vHeight);
    const startX = (vWidth - side) / 2;
    const startY = (vHeight - side) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror if user front camera
    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, side, side, 0, 0, 500, 500);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedDataUrl(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (!result) return;

      // Crop/resize image to square 500x500
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const side = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
        const sx = ((img.naturalWidth || img.width) - side) / 2;
        const sy = ((img.naturalHeight || img.height) - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, 500, 500);

        const squareData = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedDataUrl(squareData);
        stopCamera();
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmPhoto = () => {
    if (capturedDataUrl) {
      onCapture(capturedDataUrl);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    setCountdown(null);
    startCamera(cameraFacing);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1E1F20] rounded-2xl shadow-2xl border border-[#CED0D4] dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#F0F2F5] dark:bg-[#18191A] border-b border-[#CED0D4] dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#050505] dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-[#65676B] dark:text-gray-400">
                {playerName ? `${playerName} ${dorsal ? `(#${dorsal})` : ''}` : subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#65676B] hover:text-[#050505] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Preview Body */}
        <div className="p-4 flex-1 flex flex-col items-center justify-center bg-[#0F172A] relative min-h-[320px]">
          {capturedDataUrl ? (
            /* Review Captured Photo */
            <div className="flex flex-col items-center gap-3 w-full animate-in zoom-in-95">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-[#10B981] shadow-2xl ring-4 ring-[#10B981]/20">
                <img
                  src={capturedDataUrl}
                  alt="Captura"
                  className="w-full h-full object-cover"
                />
                {dorsal && (
                  <span className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-black/90 text-white font-black text-sm flex items-center justify-center border-2 border-white shadow-lg">
                    #{dorsal}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> ¡Foto capturada con éxito!
              </p>
            </div>
          ) : cameraError ? (
            /* Error Fallback */
            <div className="p-6 text-center text-white space-y-4 max-w-xs">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/40">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-rose-300">{cameraError}</p>
                <p className="text-[11px] text-gray-400">
                  Usa el botón de abajo para subir una foto desde tu galería o cámara del teléfono.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                Subir desde Dispositivo / Galería
              </button>
            </div>
          ) : (
            /* Live Video Stream Viewfinder */
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-white/60 shadow-2xl ring-4 ring-[#1877F2]/40 bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover ${cameraFacing === 'user' ? '-scale-x-100' : ''}`}
              />

              {/* Viewfinder Target Guide */}
              <div className="absolute inset-0 pointer-events-none rounded-full border-2 border-dashed border-[#38BDF8]/60 animate-pulse" />

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                  <span className="text-6xl font-black text-white animate-ping">
                    {countdown}
                  </span>
                </div>
              )}

              {/* Loading spinner */}
              {isStartingCamera && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#1877F2]" />
                  <span className="text-xs font-semibold">Iniciando cámara...</span>
                </div>
              )}
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 bg-[#F0F2F5] dark:bg-[#18191A] border-t border-[#CED0D4] dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
          {capturedDataUrl ? (
            /* Actions when photo is taken */
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-gray-100 text-[#050505] dark:text-white font-bold text-xs border border-[#CED0D4] dark:border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tomar de Nuevo</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Guardar esta Foto al Jugador</span>
              </button>
            </>
          ) : (
            /* Actions during live camera */
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  disabled={!stream || isStartingCamera}
                  className="p-2.5 rounded-xl bg-white dark:bg-white/10 hover:bg-gray-100 text-[#050505] dark:text-white text-xs font-bold border border-[#CED0D4] dark:border-white/10 transition-colors disabled:opacity-40 cursor-pointer"
                  title="Cambiar entre cámara frontal y trasera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-gray-100 text-[#050505] dark:text-white text-xs font-bold border border-[#CED0D4] dark:border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Subir imagen guardada o usar app de cámara"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#1877F2]" />
                  <span className="hidden sm:inline">Galería</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={takeSnapshotDirect}
                  disabled={!stream || isStartingCamera}
                  className="px-5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-black text-xs shadow-md flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capturar Foto</span>
                </button>

                <button
                  type="button"
                  onClick={handleTakeSnapshotWithCountdown}
                  disabled={!stream || isStartingCamera || countdown !== null}
                  className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow-xs flex items-center gap-1 cursor-pointer transition-all disabled:opacity-40"
                  title="Cuenta regresiva de 3 segundos"
                >
                  <span>3s</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
