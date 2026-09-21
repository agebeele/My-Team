import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Save,
  Check,
  Users,
  RotateCcw,
  Sparkles,
  ArrowLeftRight,
  Move,
  Plus,
  X,
  Trash2,
  Download,
} from 'lucide-react';
import { Match, Player, AppUser, Language, LineupPosition, MatchModality, TeamInfo } from '../types';
import { getT } from '../utils/translations';
import { DEFAULT_LINEUP } from '../data/initialData';
import { LineupDownloadModal } from './LineupDownloadModal';

interface TacticalPitchProps {
  team: TeamInfo;
  setTeam?: React.Dispatch<React.SetStateAction<TeamInfo>>;
  players: Player[];
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  currentUser: AppUser;
  language: Language;
  selectedMatchId?: string;
}

interface FormationConfig {
  label: string;
  positions: { x: number; y: number; roleName: string }[];
}

export const MODALITY_INFO: Record<
  MatchModality,
  { name: string; short: string; totalPlayers: number; defaultFormation: string; fieldHint: string }
> = {
  fut5: {
    name: 'Fútbol 7',
    short: 'Fut 7',
    totalPlayers: 7,
    defaultFormation: '2-3-1',
    fieldHint: '1 Portero + 6 de Campo',
  },
  fut7: {
    name: 'Fútbol 7',
    short: 'Fut 7',
    totalPlayers: 7,
    defaultFormation: '2-3-1',
    fieldHint: '1 Portero + 6 de Campo',
  },
  fut9: {
    name: 'Fútbol 7',
    short: 'Fut 7',
    totalPlayers: 7,
    defaultFormation: '2-3-1',
    fieldHint: '1 Portero + 6 de Campo',
  },
  fut11: {
    name: 'Fútbol 7',
    short: 'Fut 7',
    totalPlayers: 7,
    defaultFormation: '2-3-1',
    fieldHint: '1 Portero + 6 de Campo',
  },
};

export const FUT7_FORMATIONS: Record<string, FormationConfig> = {
  '2-3-1': {
    label: '2-3-1 Clásico Fut 7 (Recomendado)',
    positions: [
      { x: 50, y: 88, roleName: 'POR' },
      { x: 28, y: 72, roleName: 'DEF' },
      { x: 72, y: 72, roleName: 'DEF' },
      { x: 20, y: 46, roleName: 'MI' },
      { x: 50, y: 48, roleName: 'MC' },
      { x: 80, y: 46, roleName: 'MD' },
      { x: 50, y: 20, roleName: 'DC' },
    ],
  },
  '2-1-2-1': {
    label: '2-1-2-1 Doble Vértice / Rombo',
    positions: [
      { x: 50, y: 88, roleName: 'POR' },
      { x: 28, y: 72, roleName: 'DEF' },
      { x: 72, y: 72, roleName: 'DEF' },
      { x: 50, y: 55, roleName: 'PIV' },
      { x: 28, y: 37, roleName: 'MO' },
      { x: 72, y: 37, roleName: 'MO' },
      { x: 50, y: 20, roleName: 'DC' },
    ],
  },
  '3-2-1': {
    label: '3-2-1 Cerrojo / Equilibrado',
    positions: [
      { x: 50, y: 88, roleName: 'POR' },
      { x: 20, y: 70, roleName: 'LI' },
      { x: 50, y: 74, roleName: 'DFC' },
      { x: 80, y: 70, roleName: 'LD' },
      { x: 34, y: 46, roleName: 'MC' },
      { x: 66, y: 46, roleName: 'MC' },
      { x: 50, y: 20, roleName: 'DC' },
    ],
  },
  '2-2-2': {
    label: '2-2-2 Duplas en Bloque',
    positions: [
      { x: 50, y: 88, roleName: 'POR' },
      { x: 30, y: 72, roleName: 'DEF' },
      { x: 70, y: 72, roleName: 'DEF' },
      { x: 32, y: 46, roleName: 'MC' },
      { x: 68, y: 46, roleName: 'MC' },
      { x: 32, y: 22, roleName: 'DC' },
      { x: 68, y: 22, roleName: 'DC' },
    ],
  },
  '3-1-2': {
    label: '3-1-2 Contragolpe Rápido',
    positions: [
      { x: 50, y: 88, roleName: 'POR' },
      { x: 20, y: 70, roleName: 'LI' },
      { x: 50, y: 74, roleName: 'DFC' },
      { x: 80, y: 70, roleName: 'LD' },
      { x: 50, y: 48, roleName: 'MC' },
      { x: 34, y: 22, roleName: 'DC' },
      { x: 66, y: 22, roleName: 'DC' },
    ],
  },
  '1-3-2': {
    label: '1-3-2 Presión Ofensiva',
    positions: [
      { x: 50, y: 88, roleName: 'POR' },
      { x: 50, y: 74, roleName: 'LIB' },
      { x: 20, y: 48, roleName: 'MI' },
      { x: 50, y: 46, roleName: 'MC' },
      { x: 80, y: 48, roleName: 'MD' },
      { x: 35, y: 22, roleName: 'DC' },
      { x: 65, y: 22, roleName: 'DC' },
    ],
  },
};

/**
 * Calculates accurate pitch coordinates for any numerical formation (e.g., '2-1-2-1')
 * In Fut 7: 1 Portero (automatic) + 6 Outfield Players = 7 players total
 */
export function generatePositionsFromFormationString(
  formationKey: string
): { positions: { x: number; y: number; roleName: string }[]; label: string; lines: number[] } | null {
  const clean = formationKey.trim();
  const parts = clean
    .split(/[-., /]+/)
    .map((n) => parseInt(n, 10))
    .filter((n) => !isNaN(n) && n > 0);

  if (parts.length === 0) return null;

  let outfieldLines = parts;
  let totalSum = parts.reduce((a, b) => a + b, 0);

  // If user included the goalkeeper as 1 at the beginning (e.g. 1-2-1-2-1 where sum is 7)
  if (totalSum === 7 && parts[0] === 1 && parts.length > 1) {
    outfieldLines = parts.slice(1);
    totalSum = 6;
  }

  if (totalSum !== 6) {
    return null;
  }

  // Always 1 Portero positioned at bottom center
  const positions: { x: number; y: number; roleName: string }[] = [
    { x: 50, y: 88, roleName: 'POR' },
  ];

  const numLines = outfieldLines.length;
  const minY = 20; // Attack line (forward)
  const maxY = 72; // Defense line (closest to goalie)

  outfieldLines.forEach((count, lineIdx) => {
    // Y calculation: line 0 is defense (maxY), last line is attack (minY)
    const y =
      numLines === 1
        ? 48
        : Math.round(maxY - (lineIdx / (numLines - 1)) * (maxY - minY));

    // Determine X positions
    let xCoords: number[] = [];
    if (count === 1) {
      xCoords = [50];
    } else if (count === 2) {
      xCoords = [28, 72];
    } else if (count === 3) {
      xCoords = [20, 50, 80];
    } else if (count === 4) {
      xCoords = [18, 39, 61, 82];
    } else if (count === 5) {
      xCoords = [16, 33, 50, 67, 84];
    } else {
      const pad = 16;
      const span = 100 - pad * 2;
      xCoords = Array.from({ length: count }, (_, i) =>
        Math.round(pad + (i / (count - 1)) * span)
      );
    }

    xCoords.forEach((x, i) => {
      let roleName = 'MED';
      if (lineIdx === 0) {
        if (count === 1) roleName = 'LIB';
        else if (count === 2) roleName = 'DEF';
        else if (count === 3) roleName = i === 0 ? 'LI' : i === 1 ? 'DFC' : 'LD';
        else roleName = i === 0 ? 'LI' : i === count - 1 ? 'LD' : 'DFC';
      } else if (lineIdx === numLines - 1) {
        if (count === 1) roleName = 'DC';
        else if (count === 2) roleName = 'DC';
        else roleName = i === 0 ? 'EI' : i === count - 1 ? 'ED' : 'DC';
      } else {
        if (count === 1) roleName = lineIdx === 1 && numLines >= 4 ? 'PIV' : 'MC';
        else if (count === 2) roleName = lineIdx === numLines - 2 && numLines >= 4 ? 'MO' : 'MC';
        else if (count === 3) roleName = i === 0 ? 'MI' : i === 1 ? 'MC' : 'MD';
        else roleName = 'MC';
      }

      positions.push({ x, y, roleName });
    });
  });

  const formattedKey = outfieldLines.join('-');
  return {
    positions,
    label: `${formattedKey} Personalizada`,
    lines: outfieldLines,
  };
}

export const FORMATIONS_BY_MODALITY: Record<MatchModality, Record<string, FormationConfig>> = {
  fut5: FUT7_FORMATIONS,
  fut7: FUT7_FORMATIONS,
  fut9: FUT7_FORMATIONS,
  fut11: FUT7_FORMATIONS,
};

export const TacticalPitch: React.FC<TacticalPitchProps> = ({
  team,
  setTeam,
  players,
  matches,
  setMatches,
  currentUser,
  language,
  selectedMatchId,
}) => {
  const t = getT(language);
  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';

  const [activeMatchId, setActiveMatchId] = useState<string>(
    selectedMatchId || matches[0]?.id || ''
  );

  const activeMatch = matches.find((m) => m.id === activeMatchId) || matches[0];

  // Download modal state
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Modality state: Fútbol 7
  const [modality, setModality] = useState<MatchModality>('fut7');

  const [formation, setFormation] = useState<string>('2-3-1');

  // Custom formations state (persisted in localStorage)
  const [customFormations, setCustomFormations] = useState<Record<string, FormationConfig>>(() => {
    try {
      const stored = localStorage.getItem('teamgol_custom_formations_fut7');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customInput, setCustomInput] = useState('2-1-2-1');
  const [customLabel, setCustomLabel] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  // Combined formations (presets + custom ones)
  const allFormations: Record<string, FormationConfig> = {
    ...FUT7_FORMATIONS,
    ...customFormations,
  };

  const [pitchLineup, setPitchLineup] = useState<LineupPosition[]>(() => {
    if (activeMatch?.lineup && activeMatch.lineup.length === 7) {
      return activeMatch.lineup;
    }
    return DEFAULT_LINEUP;
  });

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Drag and drop & swap states
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [touchCoord, setTouchCoord] = useState<{ x: number; y: number } | null>(null);
  const [swapNotification, setSwapNotification] = useState<string | null>(null);

  // Sync state when activeMatchId changes - ensure exactly 7 players
  useEffect(() => {
    if (activeMatch) {
      setModality('fut7');
      setFormation('2-3-1');

      if (activeMatch.lineup && activeMatch.lineup.length === 7) {
        setPitchLineup(activeMatch.lineup);
      } else {
        setPitchLineup(DEFAULT_LINEUP);
      }
      setSelectedSlotIndex(null);
    }
  }, [activeMatchId]);

  // Handler to switch modality (Fut 5, Fut 7, Fut 9, Fut 11)
  const handleSelectModality = (newMod: MatchModality) => {
    setModality(newMod);
    const targetCount = MODALITY_INFO[newMod].totalPlayers;
    const defaultForm = MODALITY_INFO[newMod].defaultFormation;
    setFormation(defaultForm);
    const formConfig = allFormations[defaultForm] || FORMATIONS_BY_MODALITY[newMod][defaultForm];
    if (!formConfig) return;

    // Collect currently assigned starter player IDs
    const currentAssignedPlayerIds = pitchLineup
      .map((slot) => slot.playerId)
      .filter(Boolean);

    // Build the new lineup array adapted to newMod
    const newLineup: LineupPosition[] = formConfig.positions.map((slot, index) => {
      const existingPlayerId = currentAssignedPlayerIds[index] || players[index]?.id || '';
      return {
        playerId: existingPlayerId,
        x: slot.x,
        y: slot.y,
        roleName: slot.roleName,
      };
    });

    setPitchLineup(newLineup);
    setSelectedSlotIndex(null);
  };

  // Handler to change formation within current modality
  const handleApplyFormation = (formKey: string) => {
    setFormation(formKey);
    const formConfig = allFormations[formKey] || FORMATIONS_BY_MODALITY[modality][formKey];
    if (!formConfig) return;

    const newLineup = formConfig.positions.map((slot, index) => {
      const existingPlayerId = pitchLineup[index]?.playerId || players[index]?.id || '';
      return {
        playerId: existingPlayerId,
        x: slot.x,
        y: slot.y,
        roleName: slot.roleName,
      };
    });
    setPitchLineup(newLineup);
    setSelectedSlotIndex(null);
  };

  // Handler to save and apply a custom formation by typing numbers (e.g., 2-1-2-1)
  const handleSaveCustomFormation = () => {
    const result = generatePositionsFromFormationString(customInput);
    if (!result) {
      setCustomError('La formación debe sumar 6 jugadores de campo (+ 1 portero = 7 en total). Ejemplo: 2-1-2-1');
      return;
    }

    const key = result.lines.join('-');
    const label = customLabel.trim() || `${key} Personalizada`;

    const newConfig: FormationConfig = {
      label,
      positions: result.positions,
    };

    const updated = {
      ...customFormations,
      [key]: newConfig,
    };

    setCustomFormations(updated);
    try {
      localStorage.setItem('teamgol_custom_formations_fut7', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    // Immediately apply this formation to the pitch
    setFormation(key);
    const newLineup = newConfig.positions.map((slot, index) => {
      const existingPlayerId = pitchLineup[index]?.playerId || players[index]?.id || '';
      return {
        playerId: existingPlayerId,
        x: slot.x,
        y: slot.y,
        roleName: slot.roleName,
      };
    });
    setPitchLineup(newLineup);
    setSelectedSlotIndex(null);

    setSwapNotification(`Formación ${key} guardada y aplicada`);
    setTimeout(() => setSwapNotification(null), 3500);

    setIsCustomModalOpen(false);
    setCustomInput('2-1-2-1');
    setCustomLabel('');
    setCustomError(null);
  };

  // Handler to delete a user-created custom formation
  const handleDeleteCustomFormation = (keyToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...customFormations };
    delete updated[keyToDelete];
    setCustomFormations(updated);
    try {
      localStorage.setItem('teamgol_custom_formations_fut7', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    if (formation === keyToDelete) {
      handleApplyFormation('2-3-1');
    }
  };

  // Real-time preview & validation of custom formation
  const previewFormation = useMemo(() => {
    return generatePositionsFromFormationString(customInput);
  }, [customInput]);

  const parsedNumbers = useMemo(() => {
    return customInput
      .trim()
      .split(/[-., /]+/)
      .map((n) => parseInt(n, 10))
      .filter((n) => !isNaN(n) && n > 0);
  }, [customInput]);

  const outfieldSum = useMemo(() => {
    return parsedNumbers.reduce((a, b) => a + b, 0);
  }, [parsedNumbers]);

  const isValidCustomFormation = Boolean(previewFormation);

  // Core swap execution between two slots on the pitch
  const executeSwap = (fromIndex: number, toIndex: number) => {
    if (!isOwnerOrAdmin) return;
    if (fromIndex === toIndex) return;

    const fromSlot = pitchLineup[fromIndex];
    const toSlot = pitchLineup[toIndex];
    if (!fromSlot || !toSlot) return;

    setPitchLineup((prev) => {
      const updated = [...prev];
      const tempPlayerId = updated[fromIndex].playerId;
      updated[fromIndex] = {
        ...updated[fromIndex],
        playerId: updated[toIndex].playerId,
      };
      updated[toIndex] = {
        ...updated[toIndex],
        playerId: tempPlayerId,
      };
      return updated;
    });

    const p1 = players.find((p) => p.id === fromSlot.playerId);
    const p2 = players.find((p) => p.id === toSlot.playerId);
    const name1 = p1 ? p1.name.split(' ')[0] : fromSlot.roleName;
    const name2 = p2 ? p2.name.split(' ')[0] : toSlot.roleName;

    setSwapNotification(`${name1} ⇄ ${name2}`);
    setTimeout(() => {
      setSwapNotification((prev) => (prev?.includes(name1) ? null : prev));
    }, 2800);
  };

  // Slot click handler: tap one then tap another to swap, or tap to assign bench
  const handleSlotClick = (index: number) => {
    if (!isOwnerOrAdmin) return;
    if (selectedSlotIndex === null) {
      setSelectedSlotIndex(index);
    } else if (selectedSlotIndex === index) {
      setSelectedSlotIndex(null);
    } else {
      // User tapped player A then tapped player B: execute swap!
      executeSwap(selectedSlotIndex, index);
      setSelectedSlotIndex(null);
    }
  };

  // Desktop HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isOwnerOrAdmin) return;
    setDraggingIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const fromIndexStr = e.dataTransfer.getData('text/plain');
    const fromIndex = fromIndexStr !== '' ? Number(fromIndexStr) : draggingIndex;
    if (fromIndex !== null && !isNaN(fromIndex) && fromIndex !== targetIndex) {
      executeSwap(fromIndex, targetIndex);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  // Mobile Touch Drag handlers (hold & drag across the field)
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    setDraggingIndex(index);
    setTouchCoord({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggingIndex === null) return;
    const touch = e.touches[0];
    setTouchCoord({ x: touch.clientX, y: touch.clientY });

    // Identify which slot element is under the finger
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const slotEl = element?.closest('[data-slot-index]');
    if (slotEl) {
      const targetIdx = Number(slotEl.getAttribute('data-slot-index'));
      if (!isNaN(targetIdx) && targetIdx !== draggingIndex) {
        setDragOverIndex(targetIdx);
        return;
      }
    }
    setDragOverIndex(null);
  };

  const handleTouchEnd = () => {
    if (draggingIndex !== null && dragOverIndex !== null && draggingIndex !== dragOverIndex) {
      executeSwap(draggingIndex, dragOverIndex);
    }
    setDraggingIndex(null);
    setDragOverIndex(null);
    setTouchCoord(null);
  };

  const handleAssignPlayerToSlot = (playerId: string) => {
    if (selectedSlotIndex === null) return;

    setPitchLineup((prev) => {
      const updated = [...prev];
      // If player is already on pitch in another slot, swap them!
      const existingSlotIndex = updated.findIndex((item) => item.playerId === playerId);
      if (existingSlotIndex !== -1 && existingSlotIndex !== selectedSlotIndex) {
        const temp = updated[selectedSlotIndex].playerId;
        updated[existingSlotIndex].playerId = temp;
      }
      updated[selectedSlotIndex] = {
        ...updated[selectedSlotIndex],
        playerId,
      };
      return updated;
    });

    setSelectedSlotIndex(null);
  };

  const handleSaveLineupToMatch = () => {
    if (!activeMatch) return;
    setMatches((prev) =>
      prev.map((m) =>
        m.id === activeMatch.id
          ? {
              ...m,
              modality,
              lineup: pitchLineup,
            }
          : m
      )
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const starterPlayerIds = pitchLineup.map((l) => l.playerId).filter(Boolean);
  const benchPlayers = players.filter((p) => !starterPlayerIds.includes(p.id));
  const currentModalityInfo = MODALITY_INFO[modality];

  return (
    <div className="space-y-6">
      {/* Informative Banner for Players */}
      {!isOwnerOrAdmin && (
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3 shadow-xs">
          <Shield className="w-5 h-5 text-[#1877F2] shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-[#050505]">Alineación Oficial (Modo Jugador):</span> Puedes consultar la formación táctica de 7 jugadores y los titulares designados por el cuerpo técnico, y descargar la imagen oficial. La edición de titulares y formaciones está reservada para el Administrador / Dueño.
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#242526] p-5 rounded-2xl border border-[#CED0D4] dark:border-white/10 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#050505] dark:text-white tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#1877F2] dark:text-emerald-400" />
              {t.lineup.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#65676B] dark:text-gray-400 mt-0.5 font-medium">
              Alineación táctica oficial de Fútbol 7 (1 portero y 6 jugadores de campo)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Match selector */}
            <select
              value={activeMatchId}
              onChange={(e) => setActiveMatchId(e.target.value)}
              className="px-3 py-2 bg-[#F0F2F5] dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-xs font-semibold focus:outline-none focus:border-[#1877F2]"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  vs {m.rival} ({m.date})
                </option>
              ))}
            </select>

            {/* Download Lineup Poster Button */}
            <button
              id="btn-open-download-lineup"
              onClick={() => setIsDownloadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E7F3FF] hover:bg-[#D0E7FF] text-[#1877F2] font-bold text-xs shadow-xs transition-all border border-[#1877F2]/30 cursor-pointer"
              title="Descargar alineación oficial con logo del club y fondo de estadio"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Alineación</span>
            </button>

            {/* Save Button */}
            {isOwnerOrAdmin && (
              <button
                id="btn-save-lineup"
                onClick={handleSaveLineupToMatch}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saveSuccess ? t.lineup.savedSuccess : t.lineup.saveLineup}
              </button>
            )}
          </div>
        </div>

        {/* Modality & Formations Controller Strip */}
        <div className="pt-3 border-t border-[#CED0D4] dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Fútbol 7 Badge (Single indicator, removing replicated 7v7 buttons) */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#E7F3FF] dark:bg-[#1877F2]/20 text-[#1877F2] dark:text-[#60A5FA] border border-[#1877F2]/30 text-xs font-bold shadow-xs">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Modalidad: Fútbol 7 (7v7 • 1 Portero + 6 en Cancha)</span>
          </div>

          {/* Formations list for Fútbol 7 - restricted for players */}
          {isOwnerOrAdmin ? (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-[11px] font-bold text-[#65676B] dark:text-gray-400 mr-1 whitespace-nowrap">
                Formación:
              </span>
              {Object.entries(allFormations).map(([fk, fConfig]) => {
                const isCustom = Boolean(customFormations[fk]);
                const isActive = formation === fk;
                return (
                  <div key={fk} className="relative group/fbtn shrink-0">
                    <button
                      id={`formation-btn-${fk}`}
                      onClick={() => handleApplyFormation(fk)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-[#1877F2] text-white shadow-xs'
                          : 'bg-[#F0F2F5] dark:bg-white/5 text-[#050505] dark:text-gray-300 hover:bg-[#E4E6EB] dark:hover:bg-white/10 border border-[#CED0D4] dark:border-white/10'
                      }`}
                      title={fConfig.label}
                    >
                      {isCustom && <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />}
                      <span>{fk}</span>
                    </button>

                    {isCustom && (
                      <button
                        onClick={(e) => handleDeleteCustomFormation(fk, e)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] opacity-0 group-hover/fbtn:opacity-100 transition-opacity cursor-pointer shadow-xs"
                        title="Eliminar formación personalizada"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Button to add custom formation */}
              <button
                id="btn-add-custom-formation"
                onClick={() => {
                  setIsCustomModalOpen(true);
                  setCustomError(null);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-[#E7F3FF] dark:bg-[#1877F2]/20 text-[#1877F2] dark:text-[#60A5FA] hover:bg-[#D0E7FF] dark:hover:bg-[#1877F2]/30 border border-[#1877F2]/30 transition-all cursor-pointer whitespace-nowrap shadow-xs"
                title="Insertar alineación por números (ejemplo: 2-1-2-1)"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Insertar Alineación</span>
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F0F2F5] text-[#050505] text-xs font-bold border border-[#CED0D4]">
              <span className="text-[#65676B]">Esquema Táctico del DT:</span>
              <span className="text-[#1877F2] font-black">{formation}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Soccer Pitch Canvas */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Swap notification toast */}
          {swapNotification && (
            <div className="w-full max-w-lg mb-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-pulse">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
                <span>{swapNotification}</span>
              </div>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                Intercambiados
              </span>
            </div>
          )}

          {/* Pitch Status & Legend Bar */}
          <div className="w-full max-w-lg flex items-center justify-between text-xs text-[#65676B] dark:text-gray-400 mb-2.5 px-1 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[#1877F2] dark:text-emerald-400 font-bold bg-[#E7F3FF] dark:bg-emerald-500/10 border border-[#1877F2]/20 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-lg shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1877F2] dark:bg-emerald-400 animate-pulse" />
                {currentModalityInfo.name} ({formation})
              </span>
              <span className="text-[#65676B] dark:text-gray-400 hidden sm:inline text-[11px] font-medium">
                {currentModalityInfo.fieldHint}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#65676B] dark:text-gray-400 hidden sm:inline-flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3 text-[#1877F2] dark:text-emerald-400" />
                Arrastra para cambiar
              </span>
              <span className="font-mono text-[#1877F2] dark:text-emerald-400 font-bold bg-white dark:bg-black/60 border border-[#CED0D4] dark:border-white/10 px-2.5 py-0.5 rounded-lg shadow-xs">
                {starterPlayerIds.length}/{currentModalityInfo.totalPlayers} en cancha
              </span>
            </div>
          </div>

          {/* Realistic Tactical Soccer Pitch */}
          <div
            id="soccer-pitch"
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            className="w-full aspect-[3/4] max-w-lg bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 rounded-2xl border-2 border-emerald-600/50 p-3 shadow-2xl relative overflow-hidden select-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(0,0,0,0.08), rgba(0,0,0,0.08) 40px, transparent 40px, transparent 80px)',
            }}
          >
            {/* Field Markings */}
            <div className="absolute inset-3 border-2 border-white/30 rounded-xl pointer-events-none">
              {/* Center Line */}
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/30 -translate-y-1/2" />
              {/* Center Circle */}
              <div className="absolute top-1/2 left-1/2 w-28 h-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
              <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50" />

              {/* Top Penalty Area (Rival Goal) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 border-b-2 border-x-2 border-white/30 rounded-b-lg" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-10 border-b-2 border-x-2 border-white/30 rounded-b-md" />
              <div className="absolute top-24 left-1/2 -translate-x-1/2 w-20 h-10 border-b-2 border-white/30 rounded-b-full" />

              {/* Bottom Penalty Area (Our Goal) */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-t-2 border-x-2 border-white/30 rounded-t-lg" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-10 border-t-2 border-x-2 border-white/30 rounded-t-md" />
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-20 h-10 border-t-2 border-white/30 rounded-t-full" />
            </div>

            {/* Tactical Player Nodes */}
            {pitchLineup.map((slot, index) => {
              const player = players.find((p) => p.id === slot.playerId);
              const isSelected = selectedSlotIndex === index;
              const isDragging = draggingIndex === index;
              const isDragOver = dragOverIndex === index && draggingIndex !== index;
              const isOtherSelected = selectedSlotIndex !== null && selectedSlotIndex !== index;

              return (
                <div
                  key={index}
                  data-slot-index={index}
                  draggable={isOwnerOrAdmin}
                  onDragStart={isOwnerOrAdmin ? (e) => handleDragStart(e, index) : undefined}
                  onDragOver={isOwnerOrAdmin ? (e) => handleDragOver(e, index) : undefined}
                  onDrop={isOwnerOrAdmin ? (e) => handleDrop(e, index) : undefined}
                  onDragEnd={isOwnerOrAdmin ? handleDragEnd : undefined}
                  onTouchStart={isOwnerOrAdmin ? (e) => handleTouchStart(e, index) : undefined}
                  onClick={isOwnerOrAdmin ? () => handleSlotClick(index) : undefined}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute group z-20 flex flex-col items-center touch-none transition-transform duration-150 ${
                    isOwnerOrAdmin ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                  } ${isDragging ? 'opacity-40 scale-90 pointer-events-none' : ''}`}
                >
                  {/* Floating Action Badge when Hovered/Over during drag */}
                  {isOwnerOrAdmin && isDragOver && (
                    <div className="absolute -top-7 whitespace-nowrap bg-amber-400 text-black px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-2xl animate-bounce z-30">
                      <ArrowLeftRight className="w-3 h-3" />
                      Soltar para cambiar
                    </div>
                  )}

                  {/* Floating Badge when Slot is Selected by Tap */}
                  {isOwnerOrAdmin && isSelected && !isDragOver && (
                    <div className="absolute -top-7 whitespace-nowrap bg-amber-400 text-black px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xl animate-pulse z-30">
                      <ArrowLeftRight className="w-3 h-3" />
                      Toca otro para cambiar
                    </div>
                  )}

                  {/* Jersey Circle Node */}
                  <div
                    className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl ${
                      isDragOver
                        ? 'ring-4 ring-amber-400 scale-125 bg-amber-400 text-black shadow-amber-500/50 animate-pulse'
                        : isSelected
                        ? 'ring-4 ring-amber-400 scale-125 bg-amber-400 text-black'
                        : isOtherSelected
                        ? 'bg-emerald-500 text-black ring-2 ring-amber-400/60 hover:scale-110 hover:ring-amber-400'
                        : player?.position === 'POR'
                        ? 'bg-amber-500 text-black ring-2 ring-white/90'
                        : `bg-emerald-500 text-black ring-2 ring-white/90 ${isOwnerOrAdmin ? 'group-hover:scale-110' : ''}`
                    }`}
                  >
                    {player?.avatarUrl ? (
                      <img
                        src={player.avatarUrl}
                        alt={player.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full rounded-full object-cover p-0.5"
                      />
                    ) : (
                      <span className="font-mono font-bold text-sm">
                        {player ? player.number : '?'}
                      </span>
                    )}

                    {/* Number Overlay Badge */}
                    <span className="absolute -bottom-1 -right-1 bg-black text-emerald-400 border border-emerald-500/50 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-mono font-bold">
                      {player ? player.number : slot.roleName}
                    </span>

                    {/* Quick drag indicator dot */}
                    {isOwnerOrAdmin && (
                      <span className="absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 bg-black/80 text-gray-300 rounded-full p-0.5 transition-opacity">
                        <Move className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Player Name Pill */}
                  <div
                    className={`mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight text-center max-w-[85px] truncate transition-all shadow-md ${
                      isDragOver || isSelected
                        ? 'bg-amber-400 text-black font-bold scale-105'
                        : 'bg-black/80 text-white border border-white/10'
                    }`}
                  >
                    {player ? player.name.split(' ')[0] : slot.roleName}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Avatar when Dragging on Mobile Touch */}
          {touchCoord && draggingIndex !== null && (
            <div
              className="fixed pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none"
              style={{ left: touchCoord.x, top: touchCoord.y }}
            >
              <div className="w-14 h-14 rounded-full bg-amber-400 text-black shadow-2xl flex items-center justify-center ring-4 ring-white shadow-amber-500/60 animate-pulse">
                {(() => {
                  const draggedSlot = pitchLineup[draggingIndex];
                  const p = players.find((pl) => pl.id === draggedSlot?.playerId);
                  if (p?.avatarUrl) {
                    return (
                      <img
                        src={p.avatarUrl}
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full rounded-full object-cover p-0.5"
                      />
                    );
                  }
                  return <span className="font-mono font-black text-lg">{p ? p.number : '?'}</span>;
                })()}
              </div>
              <span className="mt-1.5 bg-black/90 text-amber-300 font-bold text-[11px] px-2.5 py-0.5 rounded-full border border-amber-400/50 shadow-xl flex items-center gap-1">
                <ArrowLeftRight className="w-3 h-3" />
                {dragOverIndex !== null ? '¡Suelta para cambiar!' : 'Arrastra sobre otro jugador'}
              </span>
            </div>
          )}
        </div>

        {/* Substitutes Bench & Player Placement Palette */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#242526] p-5 rounded-2xl border border-[#CED0D4] dark:border-white/10 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#050505] dark:text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#1877F2] dark:text-emerald-400" />
                  {isOwnerOrAdmin
                    ? selectedSlotIndex !== null
                      ? `Asignar a Posición: ${pitchLineup[selectedSlotIndex]?.roleName || 'Titular'}`
                      : t.lineup.bench
                    : 'Banca de Suplentes'}
                </h3>
                <p className="text-xs text-[#65676B] dark:text-gray-400">
                  {isOwnerOrAdmin
                    ? selectedSlotIndex !== null
                      ? 'Toca cualquier jugador de abajo para ubicarlo'
                      : 'Toca una posición en la cancha para sustituirlo'
                    : 'Jugadores convocados a disposición del cuerpo técnico'}
                </p>
              </div>

              {isOwnerOrAdmin && selectedSlotIndex !== null && (
                <button
                  onClick={() => setSelectedSlotIndex(null)}
                  className="text-xs font-bold text-[#65676B] hover:text-[#050505] dark:text-gray-400 dark:hover:text-white px-2.5 py-1 bg-[#F0F2F5] dark:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>

            {/* Players List (Bench or All when slot selected) */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {(isOwnerOrAdmin && selectedSlotIndex !== null ? players : benchPlayers).map((player) => {
                const isOnPitch = starterPlayerIds.includes(player.id);
                return (
                  <button
                    key={player.id}
                    onClick={() => {
                      if (isOwnerOrAdmin && selectedSlotIndex !== null) {
                        handleAssignPlayerToSlot(player.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isOwnerOrAdmin && selectedSlotIndex !== null
                        ? 'hover:bg-[#E7F3FF] dark:hover:bg-emerald-500/10 hover:border-[#1877F2]/40 dark:hover:border-emerald-500/30 cursor-pointer bg-white dark:bg-black/40 border-[#CED0D4] dark:border-white/10'
                        : 'bg-[#F0F2F5] dark:bg-black/40 border-[#CED0D4]/70 dark:border-white/5 cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-black text-[#1877F2] dark:text-emerald-400 w-6">
                        #{player.number}
                      </span>
                      <img
                        src={player.avatarUrl}
                        alt={player.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#050505] dark:text-white block truncate">
                          {player.name}
                        </span>
                        <span className="text-[10px] text-[#65676B] dark:text-gray-400">
                          {player.position} • {player.goals} goles
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isOnPitch ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E7F3FF] dark:bg-emerald-500/20 text-[#1877F2] dark:text-emerald-400 border border-[#1877F2]/30 dark:border-emerald-500/30">
                          En Cancha
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/70 dark:bg-white/5 text-[#65676B] dark:text-gray-400 border border-[#CED0D4] dark:border-white/5">
                          Banca
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Insertar Alineación Personalizada */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#242526] rounded-2xl border border-[#CED0D4] dark:border-white/15 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#CED0D4] dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#E7F3FF] dark:bg-[#1877F2]/20 text-[#1877F2] dark:text-[#60A5FA]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#050505] dark:text-white">
                    Insertar Alineación
                  </h3>
                  <p className="text-xs text-[#65676B] dark:text-gray-400">
                    Define las líneas por números (ejemplo: 2-1-2-1)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#F0F2F5] dark:hover:bg-white/10 text-[#65676B] dark:text-gray-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input & Form */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#050505] dark:text-gray-200 mb-1">
                  Estructura numérica (de defensa a delantera):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => {
                      setCustomInput(e.target.value);
                      setCustomError(null);
                    }}
                    placeholder="Ej. 2-1-2-1"
                    className="w-full px-3.5 py-2.5 bg-[#F0F2F5] dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-base font-mono font-bold tracking-wider focus:outline-none focus:border-[#1877F2]"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#65676B] dark:text-gray-400 pointer-events-none font-mono">
                    + 1 POR
                  </div>
                </div>
                <p className="text-[11px] text-[#65676B] dark:text-gray-400 mt-1">
                  Los números corresponden a las líneas de campo. El portero (1) se agrega automáticamente para un total de 7.
                </p>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[10px] font-bold text-[#65676B] dark:text-gray-400 uppercase tracking-wider block mb-1.5">
                  Sugerencias tácticas rápidas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { code: '2-1-2-1', label: '2-1-2-1 Rombo / Doble Vértice' },
                    { code: '2-2-1-1', label: '2-2-1-1 Escalonada' },
                    { code: '1-2-2-1', label: '1-2-2-1 Equilibrio y Posesión' },
                    { code: '3-1-1-1', label: '3-1-1-1 Muro y Transición' },
                    { code: '1-3-1-1', label: '1-3-1-1 Control Central' },
                    { code: '1-4-1', label: '1-4-1 Mediocampo Poblado' },
                  ].map((preset) => (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => {
                        setCustomInput(preset.code);
                        setCustomLabel(preset.label);
                        setCustomError(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        customInput === preset.code
                          ? 'bg-[#1877F2] text-white shadow-xs'
                          : 'bg-[#F0F2F5] dark:bg-white/5 text-[#050505] dark:text-gray-300 hover:bg-[#E4E6EB] dark:hover:bg-white/10 border border-[#CED0D4] dark:border-white/10'
                      }`}
                    >
                      {preset.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Math & Validation Box */}
              <div
                className={`p-3 rounded-xl border text-xs transition-all ${
                  isValidCustomFormation
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/25 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/25 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    {isValidCustomFormation ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                    )}
                    {isValidCustomFormation
                      ? 'Formación válida para Fútbol 7'
                      : 'Comprobación de cupos'}
                  </span>
                  <span className="font-mono text-xs">
                    {parsedNumbers.length > 0 ? parsedNumbers.join(' + ') : '0'} + 1 POR = {isValidCustomFormation ? '7' : outfieldSum + 1}/7
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-95">
                  {isValidCustomFormation
                    ? `Distribución perfecta: 1 Portero y ${parsedNumbers.length} líneas de campo (${parsedNumbers.join(' - ')}).`
                    : outfieldSum < 6
                    ? `Faltan ${6 - outfieldSum} jugador(es) de campo. Recuerda: en Fútbol 7 son 1 portero + 6 en campo.`
                    : `Sobran ${outfieldSum - 6} jugador(es) de campo. Las líneas deben sumar exactamente 6 de campo.`}
                </p>
              </div>

              {/* Mini Pitch Tactical Preview */}
              {previewFormation && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-[#65676B] dark:text-gray-400 uppercase tracking-wider block">
                    Previsualización en cancha:
                  </span>
                  <div className="w-full h-40 bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 rounded-xl border border-emerald-600/40 relative overflow-hidden p-2 shadow-inner">
                    {/* Pitch markings */}
                    <div className="absolute inset-2 border border-white/20 rounded-lg pointer-events-none">
                      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/20 -translate-y-1/2" />
                      <div className="absolute top-1/2 left-1/2 w-14 h-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-7 border-t border-l border-r border-white/20" />
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-7 border-b border-l border-r border-white/20" />
                    </div>

                    {/* Nodes */}
                    {previewFormation.positions.map((pos, idx) => (
                      <div
                        key={idx}
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute flex flex-col items-center"
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black font-mono shadow-md border ${
                            pos.roleName === 'POR'
                              ? 'bg-amber-400 text-black border-white'
                              : 'bg-emerald-400 text-black border-white'
                          }`}
                        >
                          {pos.roleName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Name / Label */}
              <div>
                <label className="block text-xs font-bold text-[#050505] dark:text-gray-200 mb-1">
                  Nombre descriptivo (opcional):
                </label>
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="Ej. 2-1-2-1 Rombo Táctico"
                  className="w-full px-3 py-2 bg-[#F0F2F5] dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-xl text-[#050505] dark:text-white text-xs font-medium focus:outline-none focus:border-[#1877F2]"
                />
              </div>

              {customError && (
                <p className="text-xs text-rose-500 font-bold">{customError}</p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-[#CED0D4] dark:border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#65676B] dark:text-gray-300 hover:bg-[#F0F2F5] dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!isValidCustomFormation}
                onClick={handleSaveCustomFormation}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isValidCustomFormation
                    ? 'bg-[#1877F2] hover:bg-[#0866FF] text-white'
                    : 'bg-gray-300 dark:bg-white/10 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Aplicar y Guardar Formación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Descargar Alineación Oficial con Logo, Estadio y Colores */}
      <LineupDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        team={team}
        setTeam={setTeam}
        activeMatch={activeMatch}
        formation={formation}
        starterPlayers={pitchLineup.map((slot) => ({
          slot,
          player: players.find((p) => p.id === slot.playerId),
        }))}
        benchPlayers={benchPlayers}
        language={language}
      />
    </div>
  );
};

