import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Trophy,
  Upload,
  Camera,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Shield,
  FileImage,
  ArrowRight,
  HelpCircle,
  Info,
  Layers,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StandingsRow, TeamInfo } from '../types';
import { scanLeagueTableWithGemini, TableImageInput } from '../utils/tableAiScanner';

interface TableAiScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamInfo;
  onApplyStandings: (newRows: StandingsRow[], updatedLeagueName?: string) => void;
}

interface UploadedPhoto {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
  sizeKb?: number;
}

// High quality realistic sample table graphic data for testing with 1 click
const SAMPLE_LEAGUE_TABLE_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNTAwIiB2aWV3Qm94PSIwIDAgODAwIDUwMCI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiMxODFhMWIiLz48dGV4dCB4PSI0MCIgeT0iNTAiIGZpbGw9IiNmZmYiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjIyIiBmb250LXdlaWdodD0iYm9sZCI+TElHQSBQUkVNSUVSIEZVVElUT0wgNyAtIFRBQkxBIERFIFBPU0lDSU9ORVM8L3RleHQ+PHJlY3QgeD0iNDAiIHk9IjgwIiB3aWR0aD0iNzIwIiBoZWlnaHQ9IjM1IiBmaWxsPSIjMmExYjFjIi8+PHRleHQgeD0iNTAiIHk9IjEwMiIgZmlsbD0iI2FhYSIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiPlBPUzwvdGV4dD48dGV4dCB4PSIxMDAiIHk9IjEwMiIgZmlsbD0iI2FhYSIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiPkVRVUlQTzwvdGV4dD48dGV4dCB4PSIzNTAiIHk9IjEwMiIgZmlsbD0iI2FhYSIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiPlBKPC90ZXh0Pjx0ZXh0IHg9IjQwMCIgeT0iMTAyIiBmaWxsPSIjYWFhIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCI+RzwvdGV4dD48dGV4dCB4PSI0NTAiIHk9IjEwMiIgZmlsbD0iI2FhYSIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiPkU8L3RleHQ+PHRleHQgeD0iNTAwIiB5PSIxMDIiIGZpbGw9IiNhYWEiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIj5QPC90ZXh0Pjx0ZXh0IHg9IjU1MCIgeT0iMTAyIiBmaWxsPSIjYWFhIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCI+R0Y8L3RleHQ+PHRleHQgeD0iNjAwIiB5PSIxMDIiIGZpbGw9IiNhYWEiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSJib2xkIj5HQzwvdGV4dD48dGV4dCB4PSI2NTAiIHk9IjEwMiIgZmlsbD0iI2FhYSIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiPkRJRjwvdGV4dD48dGV4dCB4PSI3MTAiIHk9IjEwMiIgZmlsbD0iI2FhYSIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiPlBUUzwvdGV4dD48IS0tIFJvdyAxIC0tPjxyZWN0IHg9IjQwIiB5PSIxMjAiIHdpZHRoPSI3MjAiIGhlaWdodD0iNDUiIGZpbGw9IiMyMzI2MjciLz48dGV4dCB4PSI1NSIgeT0iMTQ4IiBmaWxsPSIjZmZjMTA3IiBmb250LXdlaWdodD0iYm9sZCI+MTwvdGV4dD48dGV4dCB4PSIxMDAiIHk9IjE0OCIgZmlsbD0iI2ZmZiIgZm9udC13ZWlnaHQ9ImJvbGQiPkZDIEJheWVybiBNdW5pY2ggLyBSYXlvczwvdGV4dD48dGV4dCB4PSIzNTUiIHk9IjE0OCIgZmlsbD0iI2ZmZiI+MTI8L3RleHQ+PHRleHQgeD0iNDA1IiB5PSIxNDgiIGZpbGw9IiNmZmYiPjEwPC90ZXh0Pjx0ZXh0IHg9IjQ1NSIgeT0iMTQ4IiBmaWxsPSIjZmZmIj4xPC90ZXh0Pjx0ZXh0IHg9IjUwNSIgeT0iMTQ4IiBmaWxsPSIjZmZmIj4xPC90ZXh0Pjx0ZXh0IHg9IjU1NSIgeT0iMTQ4IiBmaWxsPSIjZmZmIj4zODwvdGV4dD48dGV4dCB4PSI2MDUiIHk9IjE0OCIgZmlsbD0iI2ZmZiI+MTQ8L3RleHQ+PHRleHQgeD0iNjU1IiB5PSIxNDgiIGZpbGw9IiM0Y2FmNTAiPis8dGV4dCB4PSI2NjUiIHk9IjE0OCIgZmlsbD0iIzRjYWY1MCI+MjQ8L3RleHQ+PHRleHQgeD0iNzE1IiB5PSIxNDgiIGZpbGw9IiNmZmJjMDAiIGZvbnQtd2VpZ2h0PSJib2xkIj4zMTwvdGV4dD48IS0tIFJvdyAyIC0tPjxyZWN0IHg9IjQwIiB5PSIxNzAiIHdpZHRoPSI3MjAiIGhlaWdodD0iNDUiIGZpbGw9IiMxZTJjMjQiLz48dGV4dCB4PSI1NSIgeT0iMTk4IiBmaWxsPSIjZmZmIj4yPC90ZXh0Pjx0ZXh0IHg9IjEwMCIgeT0iMTk4IiBmaWxsPSIjZmZmIj5IYWxjb25lcyBEb3JhZG9zIEZDNjwvdGV4dD48dGV4dCB4PSIzNTUiIHk9IjE5OCIgZmlsbD0iI2ZmZiI+MTI8L3RleHQ+PHRleHQgeD0iNDA1IiB5PSIxOTgiIGZpbGw9IiNmZmYiPjk8L3RleHQ+PHRleHQgeD0iNDU1IiB5PSIxOTgiIGZpbGw9IiNmZmYiPjE8L3RleHQ+PHRleHQgeD0iNTA1IiB5PSIxOTgiIGZpbGw9IiNmZmYiPjI8L3RleHQ+PHRleHQgeD0iNTU1IiB5PSIxOTgiIGZpbGw9IiNmZmYiPjMyPC90ZXh0Pjx0ZXh0IHg9IjYwNSIgeT0iMTk4IiBmaWxsPSIjZmZmIj4xNjwvdGV4dD48dGV4dCB4PSI2NTUiIHk9IjE5OCIgZmlsbD0iIzRjYWY1MCI+KzE2PC90ZXh0Pjx0ZXh0IHg9IjcxNSIgeT0iMTk4IiBmaWxsPSIjZmZmIj4yODwvdGV4dD48IS0tIFJvdyAzIC0tPjxyZWN0IHg9IjQwIiB5PSIyMjAiIHdpZHRoPSI3MjAiIGhlaWdodD0iNDUiIGZpbGw9IiMyMzI2MjciLz48dGV4dCB4PSI1NSIgeT0iMjQ4IiBmaWxsPSIjZmZmIj4zPC90ZXh0Pjx0ZXh0IHg9IjEwMCIgeT0iMjQ4IiBmaWxsPSIjZmZmIj5CYXJjZWxvbmEgTm9jdHVybm88L3RleHQ+PHRleHQgeD0iMzU1IiB5PSIyNDgiIGZpbGw9IiNmZmYiPjEyPC90ZXh0Pjx0ZXh0IHg9IjQwNSIgeT0iMjQ4IiBmaWxsPSIjZmZmIj44PC90ZXh0Pjx0ZXh0IHg9IjQ1NSIgeT0iMjQ4IiBmaWxsPSIjZmZmIj4yPC90ZXh0Pjx0ZXh0IHg9IjUwNSIgeT0iMjQ4IiBmaWxsPSIjZmZmIj4yPC90ZXh0Pjx0ZXh0IHg9IjU1NSIgeT0iMjQ4IiBmaWxsPSIjZmZmIj4yOTwvdGV4dD48dGV4dCB4PSI2MDUiIHk9IjI0OCIgZmlsbD0iI2ZmZiI+MTg8L3RleHQ+PHRleHQgeD0iNjU1IiB5PSIyNDgiIGZpbGw9IiM0Y2FmNTAiPisxMTwvdGV4dD48dGV4dCB4PSI3MTUiIHk9IjI0OCIgZmlsbD0iI2ZmZiI+MjY8L3RleHQ+PCEtLSBSb3cgNCAtLT48cmVjdCB4PSI0MCIgeT0iMjcwIiB3aWR0aD0iNzIwIiBoZWlnaHQ9IjQ1IiBmaWxsPSIjMWUyYzI0Ii8+PHRleHQgeD0iNTUiIHk9IjI5OCIgZmlsbD0iI2ZmZiI+NDwvdGV4dD48dGV4dCB4PSIxMDAiIHk9IjI5OCIgZmlsbD0iI2ZmZiI+UmVhbCBTcGFydGFuczwvdGV4dD48dGV4dCB4PSIzNTUiIHk9IjI5OCIgZmlsbD0iI2ZmZiI+MTI8L3RleHQ+PHRleHQgeD0iNDA1IiB5PSIyOTgiIGZpbGw9IiNmZmYiPjc8L3RleHQ+PHRleHQgeD0iNDU1IiB5PSIyOTgiIGZpbGw9IiNmZmYiPjE8L3RleHQ+PHRleHQgeD0iNTA1IiB5PSIyOTgiIGZpbGw9IiNmZmYiPjQ8L3RleHQ+PHRleHQgeD0iNTU1IiB5PSIyOTgiIGZpbGw9IiNmZmYiPjI1PC90ZXh0Pjx0ZXh0IHg9IjYwNSIgeT0iMjk4IiBmaWxsPSIjZmZmIj4yMTwvdGV4dD48dGV4dCB4PSI2NTUiIHk9IjI5OCIgZmlsbD0iIzRjYWY1MCI+KzQ8L3RleHQ+PHRleHQgeD0iNzE1IiB5PSIyOTgiIGZpbGw9IiNmZmYiPjIyPC90ZXh0Pjwvc3ZnPg==';

export const TableAiScannerModal: React.FC<TableAiScannerModalProps> = ({
  isOpen,
  onClose,
  team,
  onApplyStandings,
}) => {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanEngineUsed, setScanEngineUsed] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<'upload' | 'review'>('upload');

  // Review & Edit extracted rows
  const [extractedRows, setExtractedRows] = useState<StandingsRow[]>([]);
  const [extractedLeagueName, setExtractedLeagueName] = useState<string>(team.leagueName || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setScanError(null);

    const filesArray = Array.from(fileList);
    const newPhotos: UploadedPhoto[] = [];

    let processedCount = 0;
    filesArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = ev.target?.result as string;
        if (res) {
          newPhotos.push({
            id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            base64: res,
            mimeType: file.type || 'image/jpeg',
            sizeKb: Math.round(file.size / 1024),
          });
        }
        processedCount++;
        if (processedCount === filesArray.length) {
          setPhotos((prev) => [...prev, ...newPhotos]);
          setSelectedPreviewIndex((prev) => (prev >= 0 ? prev : 0));
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      if (selectedPreviewIndex >= updated.length) {
        setSelectedPreviewIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  const handleUseSampleImage = () => {
    setScanError(null);
    setPhotos([
      {
        id: `sample_${Date.now()}`,
        name: 'tabla_ejemplo_liga_premier.svg',
        base64: SAMPLE_LEAGUE_TABLE_IMAGE,
        mimeType: 'image/svg+xml',
        sizeKb: 45,
      },
    ]);
    setSelectedPreviewIndex(0);
  };

  const handleStartScan = async () => {
    if (photos.length === 0) {
      setScanError('Por favor selecciona al menos una foto de la tabla.');
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setProgressStatus(`Iniciando escaneo de ${photos.length} foto${photos.length > 1 ? 's' : ''}...`);

    try {
      const imageInputs: TableImageInput[] = photos.map((p) => ({
        base64: p.base64,
        mimeType: p.mimeType,
        name: p.name,
      }));

      const result = await scanLeagueTableWithGemini(
        imageInputs,
        photos[0]?.mimeType || 'image/jpeg',
        team.name,
        team.shortName,
        team.logoUrl,
        (msg) => setProgressStatus(msg)
      );

      if (!result.rows || result.rows.length === 0) {
        throw new Error('No se detectaron filas válidas de la tabla en las imágenes.');
      }

      setExtractedRows(result.rows);
      setScanEngineUsed(result.engine || 'Gemini Vision AI');
      if (result.leagueName && result.leagueName.trim().length > 2) {
        setExtractedLeagueName(result.leagueName.trim());
      }
      setActiveStep('review');
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanError(
        err.message ||
          'No se pudo extraer la tabla automáticamente. Intenta con una foto más nítida o agrega las filas manualmente.'
      );
    } finally {
      setIsScanning(false);
      setProgressStatus('');
    }
  };

  const handleConfirmAndApply = () => {
    if (!extractedRows || extractedRows.length === 0) return;

    onApplyStandings(extractedRows, extractedLeagueName);

    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    onClose();
  };

  const handleRowChange = (index: number, field: keyof StandingsRow, value: any) => {
    setExtractedRows((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      // Auto recalculate DG if GF or GC changed
      if (field === 'gf' || field === 'gc') {
        const gf = field === 'gf' ? Number(value) : target.gf;
        const gc = field === 'gc' ? Number(value) : target.gc;
        target.dg = gf - gc;
      }
      // Auto recalculate points if G or E changed
      if (field === 'g' || field === 'e') {
        const g = field === 'g' ? Number(value) : target.g;
        const e = field === 'e' ? Number(value) : target.e;
        target.pts = g * 3 + e;
      }

      updated[index] = target;
      return updated;
    });
  };

  const handleSetOurTeam = (index: number) => {
    setExtractedRows((prev) =>
      prev.map((row, i) => ({
        ...row,
        isOurTeam: i === index,
        logo: i === index ? team.logoUrl || '/fc_bayern_logo.png' : row.logo,
      }))
    );
  };

  const handleAddRow = () => {
    const nextRank = extractedRows.length + 1;
    const newRow: StandingsRow = {
      id: `standing_manual_${Date.now()}`,
      rank: nextRank,
      name: `Nuevo Equipo ${nextRank}`,
      logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=150&q=80',
      pj: 0,
      g: 0,
      e: 0,
      p: 0,
      gf: 0,
      gc: 0,
      dg: 0,
      pts: 0,
      isOurTeam: false,
    };
    setExtractedRows([...extractedRows, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    setExtractedRows((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((r, idx) => ({ ...r, rank: idx + 1 }));
    });
  };

  const currentPreviewPhoto = photos[selectedPreviewIndex] || photos[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#242526] border border-[#CED0D4] dark:border-white/10 w-full max-w-5xl rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#CED0D4] dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-[#050505] dark:text-white tracking-tight">
                  Escáner Inteligente de Tabla de Liga
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-[#1877F2] dark:bg-blue-900/40 dark:text-blue-300">
                  IA Multi-Foto & OCR
                </span>
              </div>
              <p className="text-xs text-[#65676B] dark:text-gray-400">
                Sube una o varias fotos (ej. tabla completa o dividida en páginas) para que la IA extraiga todos los equipos, estadísticas y rehaga tu tabla oficial.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#65676B] dark:text-gray-400 hover:bg-[#F0F2F5] dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {scanError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{scanError}</span>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 font-normal mt-0.5">
                  Consejo: Asegúrate de que las columnas (Pos, Equipo, PJ, G, PTS) sean visibles y tengan buena iluminación. También puedes subir más fotos para completar la tabla.
                </p>
              </div>
            </div>
          )}

          {/* STEP 1: UPLOAD MULTIPLE PHOTOS */}
          {activeStep === 'upload' && (
            <div className="space-y-4">
              {/* Hidden file input with MULTIPLE enabled */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />

              {photos.length === 0 ? (
                /* Empty state: big dropzone */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#CED0D4] dark:border-white/20 hover:border-[#1877F2] dark:hover:border-blue-500 rounded-2xl p-8 sm:p-12 text-center cursor-pointer bg-[#F8FAFC] dark:bg-white/5 transition-all group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#1877F2] mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-[#050505] dark:text-white">
                    Toca aquí para seleccionar una o varias fotos de la tabla
                  </h4>
                  <p className="text-xs text-[#65676B] dark:text-gray-400 mt-1 max-w-md mx-auto">
                    Puedes seleccionar <strong>múltiples fotos al mismo tiempo</strong> (por ejemplo: si la tabla es muy larga y tomaste 2 fotos, o capturas de pantalla de WhatsApp/Facebook).
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#18191A] border border-[#CED0D4] dark:border-white/10 text-xs font-bold text-[#050505] dark:text-white shadow-xs">
                      <Camera className="w-3.5 h-3.5 text-[#1877F2]" />
                      Subir fotos de la galería o cámara
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseSampleImage();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-600 text-xs font-bold text-amber-900 dark:text-amber-300 hover:bg-amber-100 transition-colors shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Probar con Foto de Ejemplo
                    </button>
                  </div>
                </div>
              ) : (
                /* Multi-photo selected state */
                <div className="space-y-4">
                  {/* Photo Gallery Carousel / Thumbnails Bar */}
                  <div className="flex items-center justify-between gap-2 p-3 bg-[#F0F2F5] dark:bg-black/40 rounded-xl border border-[#CED0D4] dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#1877F2]" />
                      <span className="text-xs font-bold text-[#050505] dark:text-white">
                        {photos.length} {photos.length === 1 ? 'Foto seleccionada' : 'Fotos seleccionadas'}:
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-[#242526] hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-bold text-[#1877F2] border border-[#CED0D4] dark:border-white/10 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Agregar otra foto / hoja</span>
                    </button>
                  </div>

                  {/* Thumbnail Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                    {photos.map((photo, idx) => {
                      const isSelected = idx === selectedPreviewIndex;
                      return (
                        <div
                          key={photo.id}
                          onClick={() => setSelectedPreviewIndex(idx)}
                          className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all p-1 bg-black/90 group ${
                            isSelected
                              ? 'border-[#1877F2] ring-2 ring-blue-500/20'
                              : 'border-[#CED0D4] dark:border-white/10 hover:border-gray-400'
                          }`}
                        >
                          <img
                            src={photo.base64}
                            alt={photo.name}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <div className="absolute top-1.5 left-1.5 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                            #{idx + 1}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(photo.id);
                            }}
                            className="absolute top-1.5 right-1.5 p-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[10px] shadow-sm cursor-pointer"
                            title="Eliminar esta foto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="mt-1 px-1">
                            <p className="text-[10px] font-semibold text-white truncate">{photo.name}</p>
                            {photo.sizeKb && (
                              <span className="text-[9px] text-gray-400">{photo.sizeKb} KB</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Add More Tile */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="h-28 rounded-xl border-2 border-dashed border-[#CED0D4] dark:border-white/20 hover:border-[#1877F2] flex flex-col items-center justify-center p-2 text-center cursor-pointer bg-[#F8FAFC] dark:bg-white/5 transition-colors"
                    >
                      <Plus className="w-5 h-5 text-[#1877F2] mb-1" />
                      <span className="text-[11px] font-bold text-[#050505] dark:text-white">
                        + Agregar foto
                      </span>
                      <span className="text-[9px] text-gray-400">página 2, etc.</span>
                    </div>
                  </div>

                  {/* Active Photo Full Preview */}
                  {currentPreviewPhoto && (
                    <div className="relative rounded-2xl overflow-hidden border border-[#CED0D4] dark:border-white/10 bg-black/95 max-h-80 flex items-center justify-center">
                      <img
                        src={currentPreviewPhoto.base64}
                        alt="Vista previa de foto"
                        className="max-h-80 object-contain w-auto mx-auto"
                      />
                      <div className="absolute bottom-3 left-3 bg-black/80 text-white px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-xs flex items-center gap-1.5">
                        <FileImage className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          Viendo Foto #{selectedPreviewIndex + 1}: {currentPreviewPhoto.name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Scan Trigger Bar */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-[#050505] dark:text-white">
                          Procesar {photos.length} {photos.length === 1 ? 'imagen' : 'imágenes'} con IA
                        </h4>
                        <p className="text-[11px] text-[#65676B] dark:text-gray-300">
                          La IA unirá todas las fotos, extraerá la clasificación completa y buscará a <strong className="text-[#1877F2]">{team.name}</strong>.
                        </p>
                        {progressStatus && (
                          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1 flex items-center gap-1.5">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>{progressStatus}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={handleStartScan}
                      className="px-6 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs sm:text-sm font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Escaneando tabla...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Escanear y Rehacer Tabla</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: REVIEW & RE-BUILD TABLE */}
          {activeStep === 'review' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    ¡Tabla reconstruida con éxito! Se detectaron <strong>{extractedRows.length} equipos</strong> {scanEngineUsed ? `(${scanEngineUsed})` : ''}.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep('upload')}
                  className="text-xs text-[#1877F2] underline font-bold cursor-pointer self-start sm:self-auto"
                >
                  Subir o agregar más fotos
                </button>
              </div>

              {/* Tournament Name Input */}
              <div className="bg-[#F8FAFC] dark:bg-white/5 p-3.5 rounded-xl border border-[#CED0D4] dark:border-white/10 space-y-1">
                <label className="block text-[11px] font-bold uppercase text-[#65676B] dark:text-gray-400">
                  Nombre de la Liga o Torneo:
                </label>
                <input
                  type="text"
                  value={extractedLeagueName}
                  onChange={(e) => setExtractedLeagueName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#18191A] border border-[#CED0D4] dark:border-white/10 text-xs font-bold text-[#050505] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                  placeholder="Ej. Liga Premier Fútbol 7"
                />
              </div>

              {/* Editable Table */}
              <div className="overflow-x-auto rounded-xl border border-[#CED0D4] dark:border-white/10">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F0F2F5] dark:bg-[#18191A] text-[#65676B] dark:text-gray-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-2 text-center w-12">Pos</th>
                      <th className="py-2.5 px-3">Equipo</th>
                      <th className="py-2.5 px-2 text-center w-14">PJ</th>
                      <th className="py-2.5 px-2 text-center w-14">G</th>
                      <th className="py-2.5 px-2 text-center w-14">E</th>
                      <th className="py-2.5 px-2 text-center w-14">P</th>
                      <th className="py-2.5 px-2 text-center w-14">GF</th>
                      <th className="py-2.5 px-2 text-center w-14">GC</th>
                      <th className="py-2.5 px-2 text-center w-14">DG</th>
                      <th className="py-2.5 px-2 text-center w-16 text-[#1877F2] font-black">PTS</th>
                      <th className="py-2.5 px-2 text-center w-12">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
                    {extractedRows.map((row, idx) => (
                      <tr
                        key={row.id || idx}
                        className={`transition-colors ${
                          row.isOurTeam
                            ? 'bg-blue-50/80 dark:bg-blue-900/20 font-bold'
                            : 'hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            value={row.rank}
                            onChange={(e) => handleRowChange(idx, 'rank', parseInt(e.target.value) || 0)}
                            className="w-10 text-center font-bold font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-[#050505] dark:text-white text-xs"
                          />
                        </td>

                        {/* Name & Badge */}
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={row.logo}
                              alt={row.name}
                              className="w-6 h-6 rounded-full object-cover shrink-0 border border-gray-200 bg-white"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/fc_bayern_logo.png';
                              }}
                            />
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => handleRowChange(idx, 'name', e.target.value)}
                              className="flex-1 min-w-[140px] font-bold py-1 px-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-[#050505] dark:text-white text-xs"
                            />
                            {row.isOurTeam ? (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#1877F2] text-white shrink-0">
                                Tu Club ⭐
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetOurTeam(idx)}
                                className="text-[10px] text-gray-400 hover:text-[#1877F2] underline shrink-0 cursor-pointer"
                                title="Marcar como tu club"
                              >
                                Es mi club
                              </button>
                            )}
                          </div>
                        </td>

                        {/* PJ */}
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            value={row.pj}
                            onChange={(e) => handleRowChange(idx, 'pj', parseInt(e.target.value) || 0)}
                            className="w-12 text-center font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-[#050505] dark:text-white text-xs"
                          />
                        </td>

                        {/* G */}
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            value={row.g}
                            onChange={(e) => handleRowChange(idx, 'g', parseInt(e.target.value) || 0)}
                            className="w-12 text-center font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-emerald-600 font-bold text-xs"
                          />
                        </td>

                        {/* E */}
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            value={row.e}
                            onChange={(e) => handleRowChange(idx, 'e', parseInt(e.target.value) || 0)}
                            className="w-12 text-center font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-[#050505] dark:text-white text-xs"
                          />
                        </td>

                        {/* P */}
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            value={row.p}
                            onChange={(e) => handleRowChange(idx, 'p', parseInt(e.target.value) || 0)}
                            className="w-12 text-center font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-rose-600 font-bold text-xs"
                          />
                        </td>

                        {/* GF */}
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            value={row.gf}
                            onChange={(e) => handleRowChange(idx, 'gf', parseInt(e.target.value) || 0)}
                            className="w-12 text-center font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-[#050505] dark:text-white text-xs"
                          />
                        </td>

                        {/* GC */}
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            value={row.gc}
                            onChange={(e) => handleRowChange(idx, 'gc', parseInt(e.target.value) || 0)}
                            className="w-12 text-center font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-[#050505] dark:text-white text-xs"
                          />
                        </td>

                        {/* DG */}
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            value={row.dg}
                            onChange={(e) => handleRowChange(idx, 'dg', parseInt(e.target.value) || 0)}
                            className={`w-12 text-center font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-xs font-bold ${
                              row.dg > 0 ? 'text-emerald-600' : row.dg < 0 ? 'text-rose-600' : 'text-gray-500'
                            }`}
                          />
                        </td>

                        {/* PTS */}
                        <td className="py-2 px-1 text-center">
                          <input
                            type="number"
                            value={row.pts}
                            onChange={(e) => handleRowChange(idx, 'pts', parseInt(e.target.value) || 0)}
                            className="w-14 text-center font-mono py-1 rounded border-2 border-[#1877F2] bg-white dark:bg-[#18191A] text-[#1877F2] text-xs font-black"
                          />
                        </td>

                        {/* Delete */}
                        <td className="py-2 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="px-3 py-1.5 rounded-lg border border-[#CED0D4] dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-bold text-[#050505] dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#1877F2]" />
                  <span>Agregar fila manual</span>
                </button>

                <p className="text-[11px] text-[#65676B] dark:text-gray-400">
                  💡 Puedes editar cualquier número directamente en las casillas antes de guardar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-[#CED0D4] dark:border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#65676B] dark:text-gray-400 hover:bg-[#F0F2F5] dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {activeStep === 'review' && (
            <button
              type="button"
              onClick={handleConfirmAndApply}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar y Rehacer Tabla Oficial</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
