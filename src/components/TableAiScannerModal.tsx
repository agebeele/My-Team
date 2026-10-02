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
  FileImage,
  ArrowRight,
  Layers,
  CheckCircle2,
  FileText,
  Shield,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StandingsRow, TeamInfo } from '../types';
import {
  scanLeagueTableWithGemini,
  TableImageInput,
  getCrestForTeam,
  DEFAULT_GREY_SHIELD_SVG,
} from '../utils/tableAiScanner';
import {
  LEAGUE_31_TEAMS_DATA,
  parseStandingsFromOcrText,
} from '../utils/ocrTableParser';

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

  // Text paste tab
  const [showPasteMode, setShowPasteMode] = useState<boolean>(false);
  const [rawPastedText, setRawPastedText] = useState<string>('');

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

  /**
   * Directly loads the full 31 teams dataset:
   * Maps each club to its official crest or grey shield for common names,
   * highlights Bayern Munich as the user's team.
   */
  const handleLoad31TeamsDataset = () => {
    setScanError(null);
    const fullRows: StandingsRow[] = LEAGUE_31_TEAMS_DATA.map((t, idx) => {
      const isBayern = t.name.toLowerCase().includes('bayern');
      const logoUrl = getCrestForTeam(t.name, isBayern, team.logoUrl || '/fc_bayern_logo.png');
      return {
        id: `standing_31_${Date.now()}_${idx}`,
        rank: t.rank,
        name: t.name,
        logo: logoUrl,
        pj: t.pj,
        g: t.g,
        e: t.e,
        p: t.p,
        gf: t.gf,
        gc: t.gc,
        dg: t.dg,
        pts: t.pts,
        isOurTeam: isBayern,
      };
    });

    setExtractedRows(fullRows);
    setExtractedLeagueName(team.leagueName || 'LIGA PREMIER FÚTBOL (31 EQUIPOS)');
    setScanEngineUsed('Tabla Completa de 31 Equipos');
    setActiveStep('review');
  };

  /**
   * Parses raw text pasted by the user (from WhatsApp, OCR apps or notes)
   */
  const handleProcessPastedText = () => {
    if (!rawPastedText.trim()) {
      setScanError('Por favor pega el texto de las filas de la tabla antes de procesar.');
      return;
    }
    setScanError(null);

    const parsed = parseStandingsFromOcrText(rawPastedText);
    if (!parsed.teams || parsed.teams.length === 0) {
      setScanError('No se pudieron reconocer equipos en el texto pegado. Verifica que contenga nombre y números.');
      return;
    }

    const rows: StandingsRow[] = parsed.teams.map((t, idx) => {
      const isBayern = t.name.toLowerCase().includes('bayern') || t.name.toLowerCase().includes(team.name.toLowerCase());
      const logo = getCrestForTeam(t.name, isBayern, team.logoUrl);
      return {
        id: `standing_pasted_${Date.now()}_${idx}`,
        rank: t.rank,
        name: t.name,
        logo,
        pj: t.pj,
        g: t.g,
        e: t.e,
        p: t.p,
        gf: t.gf,
        gc: t.gc,
        dg: t.dg,
        pts: t.pts,
        isOurTeam: isBayern,
      };
    });

    setExtractedRows(rows);
    if (parsed.leagueName) {
      setExtractedLeagueName(parsed.leagueName);
    }
    setScanEngineUsed(`Texto Procesado (${rows.length} equipos)`);
    setActiveStep('review');
  };

  /**
   * Scans all uploaded photos together (multi-image scan)
   */
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
          'No se pudo extraer la tabla automáticamente. Puedes cargar los 31 equipos con 1 clic o pegar el texto de la tabla.'
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
        particleCount: 90,
        spread: 85,
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

      // If team name changed, auto update logo
      if (field === 'name') {
        target.logo = getCrestForTeam(String(value), target.isOurTeam, team.logoUrl);
      }
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
        logo: i === index ? team.logoUrl || '/fc_bayern_logo.png' : getCrestForTeam(row.name, false),
      }))
    );
  };

  const handleAddRow = () => {
    const nextRank = extractedRows.length + 1;
    const newRow: StandingsRow = {
      id: `standing_manual_${Date.now()}`,
      rank: nextRank,
      name: `Nuevo Equipo ${nextRank}`,
      logo: DEFAULT_GREY_SHIELD_SVG,
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
                  31 Equipos & Logos Oficiales
                </span>
              </div>
              <p className="text-xs text-[#65676B] dark:text-gray-400">
                Sube las 2 o más fotos de la tabla, o carga directamente los <strong>31 equipos</strong> con sus escudos oficiales y escudo gris para equipos comunes.
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
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoad31TeamsDataset}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Cargar los 31 Equipos de la Liga
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: UPLOAD PHOTOS OR LOAD 31 TEAMS */}
          {activeStep === 'upload' && (
            <div className="space-y-4">
              {/* Quick Action Top Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-[#050505] dark:text-white">
                      ¿Tu liga tiene 31 equipos?
                    </h4>
                    <p className="text-[11px] text-[#65676B] dark:text-gray-300">
                      Carga la tabla completa de 31 equipos con Bayern Munich en la cima y todos los escudos oficiales listos para editar o aplicar.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLoad31TeamsDataset}
                  className="px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Cargar los 31 Equipos Ahora</span>
                </button>
              </div>

              {/* Mode Switcher: Multi-photo Upload vs Paste Text */}
              <div className="flex items-center gap-2 border-b border-[#CED0D4] dark:border-white/10 pb-2">
                <button
                  type="button"
                  onClick={() => setShowPasteMode(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    !showPasteMode
                      ? 'bg-[#1877F2] text-white'
                      : 'text-[#65676B] dark:text-gray-400 hover:bg-[#F0F2F5] dark:hover:bg-white/5'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Escanear Fotos de la Tabla ({photos.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasteMode(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    showPasteMode
                      ? 'bg-[#1877F2] text-white'
                      : 'text-[#65676B] dark:text-gray-400 hover:bg-[#F0F2F5] dark:hover:bg-white/5'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Pegar Texto de la Tabla</span>
                </button>
              </div>

              {/* Hidden file input with MULTIPLE enabled */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />

              {!showPasteMode ? (
                photos.length === 0 ? (
                  /* Empty state: big dropzone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#CED0D4] dark:border-white/20 hover:border-[#1877F2] dark:hover:border-blue-500 rounded-2xl p-8 sm:p-10 text-center cursor-pointer bg-[#F8FAFC] dark:bg-white/5 transition-all group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-[#1877F2] mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-bold text-[#050505] dark:text-white">
                      Toca aquí para seleccionar las 2 fotos de la tabla
                    </h4>
                    <p className="text-xs text-[#65676B] dark:text-gray-400 mt-1 max-w-md mx-auto">
                      Puedes seleccionar <strong>las dos imágenes al mismo tiempo</strong> (ej. Foto 1 con puestos 1-16 y Foto 2 con puestos 17-31). El escáner las unirá automáticamente.
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
                          handleLoad31TeamsDataset();
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        Cargar los 31 Equipos de la Liga
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
                        <span>+ Agregar otra foto / página</span>
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
                              Foto #{idx + 1}
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
                      <div className="relative rounded-2xl overflow-hidden border border-[#CED0D4] dark:border-white/10 bg-black/95 max-h-72 flex items-center justify-center">
                        <img
                          src={currentPreviewPhoto.base64}
                          alt="Vista previa de foto"
                          className="max-h-72 object-contain w-auto mx-auto"
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
                            Escanear y Unir {photos.length} {photos.length === 1 ? 'imagen' : 'imágenes'}
                          </h4>
                          <p className="text-[11px] text-[#65676B] dark:text-gray-300">
                            La IA extraerá todos los equipos, asignará los escudos correspondientes y guardará las estadísticas completas.
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
                            <span>Escaneando...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Escanear Fotos Ahora</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              ) : (
                /* Paste text mode */
                <div className="space-y-3 p-4 bg-[#F8FAFC] dark:bg-white/5 rounded-2xl border border-[#CED0D4] dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#050505] dark:text-white flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#1877F2]" />
                      <span>Pega aquí el texto con los 31 equipos y sus números:</span>
                    </label>
                    <span className="text-[11px] text-[#65676B] dark:text-gray-400">
                      Formato libre: Pos, Equipo, PJ, G, E, P, GF, GC, DIF, PTS
                    </span>
                  </div>

                  <textarea
                    rows={8}
                    value={rawPastedText}
                    onChange={(e) => setRawPastedText(e.target.value)}
                    placeholder={`1 Real Madrid 28 24 3 1 104 35 69 75\n2 Bayern Munich 28 21 4 3 131 41 90 67\n3 Manchester City 28 21 3 4 110 42 68 66\n...`}
                    className="w-full p-3 font-mono text-xs rounded-xl border border-[#CED0D4] dark:border-white/10 bg-white dark:bg-[#18191A] text-[#050505] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        setRawPastedText(
                          LEAGUE_31_TEAMS_DATA.map(
                            (t) =>
                              `${t.rank} ${t.name} ${t.pj} ${t.g} ${t.e} ${t.p} ${t.gf} ${t.gc} ${t.dg} ${t.pts}`
                          ).join('\n')
                        )
                      }
                      className="text-xs text-[#1877F2] font-bold hover:underline cursor-pointer"
                    >
                      Insertar ejemplo de los 31 equipos
                    </button>

                    <button
                      type="button"
                      onClick={handleProcessPastedText}
                      className="px-5 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Procesar Texto</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: REVIEW & RE-BUILD TABLE (ALL 31 TEAMS) */}
          {activeStep === 'review' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    ¡Tabla generada con <strong>{extractedRows.length} equipos</strong> {scanEngineUsed ? `(${scanEngineUsed})` : ''}!
                  </span>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleLoad31TeamsDataset}
                    className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-[#1877F2] dark:text-blue-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Cargar los 31 equipos oficiales"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Recargar 31 Equipos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep('upload')}
                    className="text-xs text-[#1877F2] underline font-bold cursor-pointer"
                  >
                    Subir o agregar más fotos
                  </button>
                </div>
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
              <div className="overflow-x-auto rounded-xl border border-[#CED0D4] dark:border-white/10 max-h-[50vh]">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 z-10 bg-[#F0F2F5] dark:bg-[#18191A] text-[#65676B] dark:text-gray-300 font-bold uppercase text-[10px] shadow-xs">
                    <tr>
                      <th className="py-2.5 px-2 text-center w-12">Pos</th>
                      <th className="py-2.5 px-3">Equipo & Escudo</th>
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
                            ? 'bg-blue-50/90 dark:bg-blue-900/30 font-bold border-l-4 border-[#1877F2]'
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
                                (e.target as HTMLImageElement).src = DEFAULT_GREY_SHIELD_SVG;
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
                                Mi Club ⭐
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
                  🛡️ Equipos con nombre conocido tienen su logo oficial; los equipos comunes tienen escudo gris.
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
              <span>Aplicar y Guardar los {extractedRows.length} Equipos</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
