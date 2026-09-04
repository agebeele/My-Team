import React, { useState } from 'react';
import {
  Shield,
  RotateCcw,
  Save,
  Check,
  Users,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Match, Player, AppUser, Language, LineupPosition } from '../types';
import { getT } from '../utils/translations';
import { DEFAULT_LINEUP } from '../data/initialData';

interface TacticalPitchProps {
  players: Player[];
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  currentUser: AppUser;
  language: Language;
  selectedMatchId?: string;
}

const FORMATIONS: Record<string, { label: string; positions: { x: number; y: number; roleName: string }[] }> = {
  '4-3-3': {
    label: '4-3-3 Ofensivo',
    positions: [
      { x: 50, y: 88, roleName: 'POR' },
      { x: 18, y: 72, roleName: 'LI' },
      { x: 38, y: 74, roleName: 'DFC' },
      { x: 62, y: 74, roleName: 'DFC' },
      { x: 82, y: 72, roleName: 'LD' },
      { x: 50, y: 54, roleName: 'MCD' },
      { x: 28, y: 44, roleName: 'MC' },
      { x: 72, y: 44, roleName: 'MCO' },
      { x: 18, y: 22, roleName: 'EI' },
      { x: 50, y: 16, roleName: 'DC' },
      { x: 82, y: 22, roleName: 'ED' },
    ],
  },
  '4-4-2': {
    label: '4-4-2 Clásico',
    positions: [
      { x: 50, y: 88, roleName: 'POR' },
      { x: 18, y: 72, roleName: 'LI' },
      { x: 38, y: 74, roleName: 'DFC' },
      { x: 62, y: 74, roleName: 'DFC' },
      { x: 82, y: 72, roleName: 'LD' },
      { x: 18, y: 46, roleName: 'MI' },
      { x: 38, y: 48, roleName: 'MC' },
      { x: 62, y: 48, roleName: 'MC' },
      { x: 82, y: 46, roleName: 'MD' },
      { x: 36, y: 18, roleName: 'DC' },
      { x: 64, y: 18, roleName: 'DC' },
    ],
  },
  '3-5-2': {
    label: '3-5-2 Dominio',
    positions: [
      { x: 50, y: 88, roleName: 'POR' },
      { x: 25, y: 74, roleName: 'DFC' },
      { x: 50, y: 76, roleName: 'LIB' },
      { x: 75, y: 74, roleName: 'DFC' },
      { x: 15, y: 46, roleName: 'CAI' },
      { x: 36, y: 50, roleName: 'MC' },
      { x: 50, y: 42, roleName: 'MCO' },
      { x: 64, y: 50, roleName: 'MC' },
      { x: 85, y: 46, roleName: 'CAD' },
      { x: 36, y: 18, roleName: 'DC' },
      { x: 64, y: 18, roleName: 'DC' },
    ],
  },
  '4-2-3-1': {
    label: '4-2-3-1 Moderno',
    positions: [
      { x: 50, y: 88, roleName: 'POR' },
      { x: 18, y: 72, roleName: 'LI' },
      { x: 38, y: 74, roleName: 'DFC' },
      { x: 62, y: 74, roleName: 'DFC' },
      { x: 82, y: 72, roleName: 'LD' },
      { x: 36, y: 56, roleName: 'MCD' },
      { x: 64, y: 56, roleName: 'MCD' },
      { x: 20, y: 36, roleName: 'MI' },
      { x: 50, y: 34, roleName: 'MCO' },
      { x: 80, y: 36, roleName: 'MD' },
      { x: 50, y: 16, roleName: 'DC' },
    ],
  },
};

export const TacticalPitch: React.FC<TacticalPitchProps> = ({
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
  const [formation, setFormation] = useState<string>('4-3-3');
  const [pitchLineup, setPitchLineup] = useState<LineupPosition[]>(DEFAULT_LINEUP);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeMatch = matches.find((m) => m.id === activeMatchId) || matches[0];

  const handleApplyFormation = (formKey: string) => {
    setFormation(formKey);
    const formConfig = FORMATIONS[formKey];
    if (!formConfig) return;

    // Retain existing players if available
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
  };

  const handleSlotClick = (index: number) => {
    setSelectedSlotIndex(index === selectedSlotIndex ? null : index);
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
              lineup: pitchLineup,
            }
          : m
      )
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const starterPlayerIds = pitchLineup.map((l) => l.playerId);
  const benchPlayers = players.filter((p) => !starterPlayerIds.includes(p.id));

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#141416] p-5 rounded-xl border border-white/5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            {t.lineup.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            {t.lineup.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Match selector */}
          <select
            value={activeMatchId}
            onChange={(e) => setActiveMatchId(e.target.value)}
            className="px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                vs {m.rival} ({m.date})
              </option>
            ))}
          </select>

          {/* Formation selector */}
          <div className="flex bg-black/50 p-1 rounded-lg border border-white/10 text-xs">
            {Object.keys(FORMATIONS).map((fk) => (
              <button
                key={fk}
                onClick={() => handleApplyFormation(fk)}
                className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                  formation === fk ? 'bg-emerald-500 text-black shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                {fk}
              </button>
            ))}
          </div>

          {/* Save Button */}
          {isOwnerOrAdmin && (
            <button
              id="btn-save-lineup"
              onClick={handleSaveLineupToMatch}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-sm transition-all"
            >
              {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveSuccess ? t.lineup.savedSuccess : t.lineup.saveLineup}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Soccer Pitch Canvas */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-gray-400 mb-2 px-1">
            <span>
              {t.lineup.dragHint}
            </span>
            <span className="font-mono text-emerald-400 font-bold">
              {starterPlayerIds.filter(Boolean).length}/11 en cancha
            </span>
          </div>

          {/* Realistic Tactical Soccer Pitch */}
          <div
            id="soccer-pitch"
            className="w-full aspect-[3/4] max-w-lg bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 rounded-2xl border-2 border-emerald-600/50 p-3 shadow-2xl relative overflow-hidden select-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.08), rgba(0,0,0,0.08) 40px, transparent 40px, transparent 80px)',
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

              return (
                <div
                  key={index}
                  onClick={() => handleSlotClick(index)}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute cursor-pointer group z-20 flex flex-col items-center"
                >
                  {/* Jersey Circle Node */}
                  <div
                    className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl ${
                      isSelected
                        ? 'ring-4 ring-amber-400 scale-125 bg-amber-400 text-black'
                        : player?.position === 'POR'
                        ? 'bg-amber-500 text-black ring-2 ring-white/90'
                        : 'bg-emerald-500 text-black ring-2 ring-white/90 group-hover:scale-110'
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
                  </div>

                  {/* Player Name Pill */}
                  <div
                    className={`mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight text-center max-w-[85px] truncate transition-all shadow-md ${
                      isSelected
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
        </div>

        {/* Substitutes Bench & Player Placement Palette */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#141416] p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  {selectedSlotIndex !== null
                    ? `Selecciona jugador para posición: ${pitchLineup[selectedSlotIndex]?.roleName}`
                    : t.lineup.bench}
                </h3>
                <p className="text-xs text-gray-400">
                  {selectedSlotIndex !== null
                    ? 'Toca un jugador de abajo para asignarlo'
                    : 'Toca una posición en la cancha para cambiar al titular'}
                </p>
              </div>
            </div>

            {/* Players List (Bench or All when slot selected) */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {(selectedSlotIndex !== null ? players : benchPlayers).map((player) => {
                const isOnPitch = starterPlayerIds.includes(player.id);
                return (
                  <button
                    key={player.id}
                    onClick={() => {
                      if (selectedSlotIndex !== null) {
                        handleAssignPlayerToSlot(player.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                      selectedSlotIndex !== null
                        ? 'hover:bg-emerald-500/10 hover:border-emerald-500/30 cursor-pointer bg-black/40 border-white/10'
                        : 'bg-black/40 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs font-black text-emerald-400 w-6">
                        #{player.number}
                      </span>
                      <img
                        src={player.avatarUrl}
                        alt={player.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {player.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {player.position} • {player.goals} goles
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {isOnPitch ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          En Cancha
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
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
    </div>
  );
};
