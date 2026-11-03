import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Edit2,
  Calendar,
  Clock,
  MapPin,
  Shield,
  CheckCircle2,
  Users,
  Sparkles,
} from 'lucide-react';
import { Match, TeamInfo, Player, LineupPosition, DEFAULT_FACEBOOK_AVATAR } from '../types';
import { DEFAULT_LINEUP } from '../data/initialData';
import { downloadElementAsImage } from '../utils/imageDownloader';

interface MatchLineupViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  team: TeamInfo;
  players: Player[];
  onEditLineup?: (matchId: string) => void;
  canEdit?: boolean;
}

export const MatchLineupViewerModal: React.FC<MatchLineupViewerModalProps> = ({
  isOpen,
  onClose,
  match,
  team,
  players = [],
  onEditLineup,
  canEdit = true,
}) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !match) return null;

  // Resolve lineup slots: use match.lineup or fallback to DEFAULT_LINEUP
  const activeLineup: LineupPosition[] =
    match.lineup && match.lineup.length > 0 ? match.lineup : DEFAULT_LINEUP;

  // Map slots to actual players
  const starters = activeLineup.map((slot) => {
    const player = players.find((p) => p.id === slot.playerId);
    return {
      slot,
      player,
    };
  });

  const starterIds = new Set(activeLineup.map((s) => s.playerId).filter(Boolean));
  const benchPlayers = players.filter((p) => !starterIds.has(p.id));

  // Determine tactical formation tag (e.g., 2-3-1)
  const formationLabel = match.formation || '2-3-1';

  const handleDownload = async () => {
    if (!posterRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadElementAsImage(posterRef.current, {
        fileName: `Alineacion_${team.shortName || team.name}_vs_${match.rival.replace(/\s+/g, '_')}.png`,
        backgroundColor: '#0a0d14',
        scale: 2,
        onSuccess: () => {
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 3000);
        },
      });
    } catch (err) {
      console.error('Error al descargar afiche de alineación:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#18191A] rounded-3xl max-w-2xl w-full border border-[#CED0D4] dark:border-white/10 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-[#CED0D4] dark:border-white/10 flex items-center justify-between bg-[#F0F2F5] dark:bg-[#242526] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-[#050505] dark:text-white truncate">
                  Alineación Confirmada: {team.shortName || team.name} vs {match.rival}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 font-extrabold text-[10px] tracking-wider uppercase">
                  {formationLabel} • Fut 7
                </span>
              </div>
              <p className="text-xs text-[#65676B] dark:text-gray-400 truncate">
                {match.date} • {match.time} hrs • {match.stadium}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#65676B] hover:text-[#050505] dark:text-gray-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Cerrar vista"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Visual Soccer Pitch Container to download/view */}
          <div className="flex justify-center">
            <div
              ref={posterRef}
              id="lineup-tactical-card"
              className="w-full max-w-[480px] aspect-[4/5] rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-2xl border-2 border-emerald-500/30 select-none bg-[#07130a]"
            >
              {/* Field Grass Texture with Radial Lighting */}
              <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 50%, #15803d 0%, #166534 50%, #052e16 100%)',
                }}
              />

              {/* Striped Pitch Lines (Vertical Alternating Grass Cuts) */}
              <div className="absolute inset-0 z-1 opacity-20 pointer-events-none flex">
                <div className="flex-1 bg-black/20" />
                <div className="flex-1 bg-white/10" />
                <div className="flex-1 bg-black/20" />
                <div className="flex-1 bg-white/10" />
                <div className="flex-1 bg-black/20" />
              </div>

              {/* Soccer Pitch Markings (White Lines) */}
              <div className="absolute inset-3 z-2 border-2 border-white/40 rounded-xl pointer-events-none">
                {/* Center Circle & Halfway Line */}
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/40 -translate-y-1/2" />
                <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full border-2 border-white/40 -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-white/60 -translate-x-1/2 -translate-y-1/2" />

                {/* Top Penalty Area (Rival) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-16 border-b-2 border-x-2 border-white/40 rounded-b-xl" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 border-b-2 border-x-2 border-white/30 rounded-b-lg" />

                {/* Bottom Penalty Area (Our Goal) */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-16 border-t-2 border-x-2 border-white/40 rounded-t-xl" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-6 border-t-2 border-x-2 border-white/30 rounded-t-lg" />
              </div>

              {/* Top Banner on Poster: Match VS Bar */}
              <div className="relative z-10 pt-3 px-3 pb-1">
                <div className="bg-black/60 backdrop-blur-md rounded-xl p-2 border border-white/15 flex items-center justify-between text-white shadow-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={team.logoUrl || DEFAULT_FACEBOOK_AVATAR}
                      alt={team.name}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_FACEBOOK_AVATAR;
                      }}
                      className="w-8 h-8 rounded-full object-cover border border-emerald-400 bg-black shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] font-black uppercase tracking-wider block truncate text-emerald-300">
                        {team.shortName || team.name}
                      </span>
                      <span className="text-[9px] text-gray-300 block truncate">
                        vs {match.rival}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/40">
                      {formationLabel}
                    </span>
                    <span className="text-[9px] text-gray-300 block mt-0.5 font-medium">
                      {match.time} hrs
                    </span>
                  </div>
                </div>
              </div>

              {/* Starting 7 Players Placed Accurately on the Pitch */}
              <div className="relative z-10 flex-1 w-full h-full">
                {starters.map(({ slot, player }, index) => {
                  const playerName = player
                    ? player.nickname || player.name.split(' ')[0]
                    : 'Sin asignar';
                  const playerDorsal = player?.number || '';
                  const playerAvatar = player?.avatarUrl || DEFAULT_FACEBOOK_AVATAR;

                  return (
                    <div
                      key={`starter-pin-${index}`}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
                      style={{
                        left: `${slot.x}%`,
                        top: `${slot.y}%`,
                      }}
                    >
                      {/* Player Circle Avatar with Role Badge */}
                      <div className="relative">
                        <img
                          src={playerAvatar}
                          alt={playerName}
                          crossOrigin="anonymous"
                          onError={(e) => {
                            e.currentTarget.src = DEFAULT_FACEBOOK_AVATAR;
                          }}
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-xl bg-slate-900"
                        />
                        {/* Dorsal Number or Position Tag */}
                        <span className="absolute -bottom-1 -right-1 bg-amber-400 text-black font-black text-[9px] px-1.5 py-0.2 rounded-full border border-black shadow-xs min-w-[16px] text-center">
                          {playerDorsal ? `#${playerDorsal}` : slot.roleName}
                        </span>
                      </div>

                      {/* Name Tag Pill */}
                      <div className="mt-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-wider shadow-md whitespace-nowrap text-center max-w-[85px] truncate">
                        {playerName}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Card Footer */}
              <div className="relative z-10 pb-2 px-3 pt-1 text-center">
                <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest drop-shadow-sm">
                  {team.leagueName} • Alineación Oficial Fútbol 7
                </span>
              </div>
            </div>
          </div>

          {/* Bench / Suplentes List */}
          {benchPlayers.length > 0 && (
            <div className="bg-[#F0F2F5] dark:bg-[#242526] p-3.5 rounded-2xl border border-[#CED0D4] dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#050505] dark:text-white">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#1877F2]" />
                  <span>Banca / Suplentes Disponibles ({benchPlayers.length})</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {benchPlayers.map((bp) => (
                  <div
                    key={bp.id}
                    className="flex items-center gap-2 p-1.5 bg-white dark:bg-[#18191A] rounded-xl border border-[#CED0D4]/70 dark:border-white/5 shadow-2xs"
                  >
                    <img
                      src={bp.avatarUrl || DEFAULT_FACEBOOK_AVATAR}
                      alt={bp.name}
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_FACEBOOK_AVATAR;
                      }}
                      className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-200"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-[#050505] dark:text-white truncate">
                        {bp.nickname || bp.name.split(' ')[0]}
                      </p>
                      <span className="text-[9px] text-[#65676B] dark:text-gray-400 font-semibold block">
                        #{bp.number || '-'} • {bp.position}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[#CED0D4] dark:border-white/10 bg-[#F0F2F5] dark:bg-[#242526] flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-2">
            {downloadSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                ¡Imagen guardada con éxito!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {canEdit && onEditLineup && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditLineup(match.id);
                }}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-[#050505] dark:text-white text-xs font-bold border border-[#CED0D4] dark:border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#1877F2]" />
                <span>Modificar Táctica</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Generando afiche...' : 'Descargar Imagen'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
