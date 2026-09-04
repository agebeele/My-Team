import React, { useState, useRef } from 'react';
import {
  Users,
  Download,
  Share2,
  Plus,
  Trash2,
  Upload,
  Check,
  Sparkles,
  Shield,
  Calendar,
  MapPin,
  Image as ImageIcon,
} from 'lucide-react';
import { Match, TeamInfo, Player, AppUser, Language, PlayerPosition } from '../types';
import { getT } from '../utils/translations';

interface ConvocatoriaGraphicProps {
  team: TeamInfo;
  setTeam: React.Dispatch<React.SetStateAction<TeamInfo>>;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  matches: Match[];
  currentUser: AppUser;
  language: Language;
  selectedMatchId?: string;
}

export const ConvocatoriaGraphic: React.FC<ConvocatoriaGraphicProps> = ({
  team,
  setTeam,
  players,
  setPlayers,
  matches,
  currentUser,
  language,
  selectedMatchId,
}) => {
  const t = getT(language);
  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';

  const [activeMatchId, setActiveMatchId] = useState<string>(
    selectedMatchId || matches[0]?.id || ''
  );

  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);

  // New Player state
  const [newPlayer, setNewPlayer] = useState<{
    name: string;
    nickname: string;
    number: number;
    position: PlayerPosition;
    avatarUrl: string;
  }>({
    name: '',
    nickname: '',
    number: 10,
    position: 'DEL',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  });

  // Edit Team state
  const [teamForm, setTeamForm] = useState({
    name: team.name,
    shortName: team.shortName,
    leagueName: team.leagueName,
    logoUrl: team.logoUrl,
    bannerUrl: team.bannerUrl,
  });

  const posterRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentMatch = matches.find((m) => m.id === activeMatchId) || matches[0];

  // Called up player toggles
  const togglePlayerCalledUp = (playerId: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, isCalledUp: !p.isCalledUp } : p))
    );
  };

  const selectAllPlayers = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, isCalledUp: true })));
  };

  const clearAllPlayers = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, isCalledUp: false })));
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayer.name.trim()) return;

    const created: Player = {
      id: `p_${Date.now()}`,
      name: newPlayer.name,
      nickname: newPlayer.nickname || undefined,
      number: Number(newPlayer.number),
      position: newPlayer.position,
      avatarUrl: newPlayer.avatarUrl,
      goals: 0,
      assists: 0,
      matches: 0,
      yellowCards: 0,
      redCards: 0,
      isCalledUp: true,
      isStarter: false,
      mvpHistory: [],
    };

    setPlayers((prev) => [...prev, created]);
    setShowAddPlayerModal(false);
    setNewPlayer({
      name: '',
      nickname: '',
      number: 11,
      position: 'DEL',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    });
  };

  const handleDeletePlayer = (playerId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar a este jugador de la plantilla?')) {
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }
  };

  const handleSaveTeamIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    setTeam((prev) => ({
      ...prev,
      name: teamForm.name,
      shortName: teamForm.shortName,
      leagueName: teamForm.leagueName,
      logoUrl: teamForm.logoUrl,
      bannerUrl: teamForm.bannerUrl,
    }));
    setShowEditTeamModal(false);
  };

  // Group called-up players by position for official flyer layout
  const calledUpPlayers = players.filter((p) => p.isCalledUp);
  const goalkeepers = calledUpPlayers.filter((p) => p.position === 'POR');
  const defenders = calledUpPlayers.filter((p) => p.position === 'DEF');
  const midfielders = calledUpPlayers.filter((p) => p.position === 'MED');
  const forwards = calledUpPlayers.filter((p) => p.position === 'DEL');

  // Generate PNG image using pure Canvas drawing from vector & DOM coordinates
  const handleDownloadGraphic = async () => {
    setIsGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      const width = 1080;
      const height = 1350; // Standard 4:5 Instagram Portrait Flyer
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Dark gradient background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#05080e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Top green glow
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.beginPath();
      ctx.arc(width / 2, 0, 450, 0, Math.PI * 2);
      ctx.fill();

      // Golden geometric lines
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(80, 180);
      ctx.lineTo(width - 80, 180);
      ctx.stroke();

      // Team Logo & Name Header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(team.name.toUpperCase(), width / 2, 105);

      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(team.leagueName.toUpperCase(), width / 2, 145);

      // Match Banner Block
      ctx.fillStyle = '#1e293b';
      ctx.roundRect(80, 210, width - 160, 140, 20);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('PRÓXIMO ENCUENTRO OFICIAL', width / 2, 245);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px sans-serif';
      ctx.fillText(`${team.shortName}  VS  ${currentMatch ? currentMatch.rival.toUpperCase() : 'RIVAL'}`, width / 2, 295);

      ctx.fillStyle = '#34d399';
      ctx.font = '20px sans-serif';
      const matchDetails = currentMatch
        ? `📅 ${currentMatch.date}  •  ⏰ ${currentMatch.time} hrs  •  📍 ${currentMatch.stadium}`
        : 'Horario y Estadio por confirmar';
      ctx.fillText(matchDetails, width / 2, 330);

      // Big Title: CONVOCATORIA
      ctx.fillStyle = '#F59E0B';
      ctx.font = '900 68px sans-serif';
      ctx.fillText('★ CONVOCATORIA OFICIAL ★', width / 2, 420);

      // Columns for positions
      const colLeftX = 140;
      const colRightX = width / 2 + 60;

      const drawPositionGroup = (
        title: string,
        groupPlayers: Player[],
        startX: number,
        startY: number
      ) => {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(title, startX, startY);

        let y = startY + 36;
        if (groupPlayers.length === 0) {
          ctx.fillStyle = '#64748b';
          ctx.font = 'italic 20px sans-serif';
          ctx.fillText('Sin convocados', startX + 15, y);
        } else {
          groupPlayers.forEach((p) => {
            // Jersey badge
            ctx.fillStyle = '#0f766e';
            ctx.roundRect(startX, y - 22, 44, 28, 6);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(String(p.number), startX + 22, y - 2);

            // Player name
            ctx.textAlign = 'left';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillStyle = '#f8fafc';
            ctx.fillText(p.name + (p.nickname ? ` "${p.nickname}"` : ''), startX + 56, y - 2);
            y += 40;
          });
        }
      };

      // Left Column: Porteros + Defensas
      drawPositionGroup('PORTEROS', goalkeepers, colLeftX, 480);
      drawPositionGroup('DEFENSAS', defenders, colLeftX, 620);

      // Right Column: Mediocampistas + Delanteros
      drawPositionGroup('MEDIOCAMPISTAS', midfielders, colRightX, 480);
      drawPositionGroup('DELANTEROS', forwards, colRightX, 740);

      // Bottom sponsor / footer bar
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, height - 100, width, 100);
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('¡VAMOS POR LOS TRES PUNTOS!  #JuntosPorLaGloria', width / 2, height - 55);
      ctx.fillStyle = '#64748b';
      ctx.font = '16px sans-serif';
      ctx.fillText(`Diseñado en TeamGol App  •  ${team.name}`, width / 2, height - 25);

      // Export as PNG
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Convocatoria_${team.shortName}_vs_${currentMatch?.rival || 'Partido'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error generating image flyer:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#141416] p-5 rounded-xl border border-white/5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            {t.convocatoria.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            {t.convocatoria.subtitle}
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

          {/* Download Graphic Button */}
          <button
            id="btn-download-convocatoria"
            onClick={handleDownloadGraphic}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isGenerating ? 'Generando...' : t.convocatoria.downloadGraphic}
          </button>

          {/* Team Identity Button (Owner) */}
          {isOwnerOrAdmin && (
            <button
              onClick={() => setShowEditTeamModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold text-xs border border-white/10 transition-all"
              title="Actualizar Escudo, Foto y Nombre del Club"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              {t.convocatoria.teamDetails}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Live Visual Graphic Preview */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Vista Previa de la Gráfica Oficial
            </span>
            <span className="text-xs text-emerald-400 font-bold">
              {calledUpPlayers.length} Convocados
            </span>
          </div>

          {/* Graphic Container */}
          <div
            ref={posterRef}
            id="convocatoria-poster"
            className="w-full max-w-lg bg-gradient-to-b from-[#141416] via-[#0D0D0F] to-[#141416] rounded-2xl border border-white/10 p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Background Glows and Team Backdrop */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Team Banner / Photo Header */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 h-32 mb-5">
              <img
                src={team.bannerUrl}
                alt={team.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover brightness-50"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
                <img
                  src={team.logoUrl}
                  alt={team.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-lg object-cover border-2 border-emerald-400 shadow-lg shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white tracking-tight truncate uppercase">
                    {team.name}
                  </h3>
                  <p className="text-[11px] font-semibold text-emerald-400 truncate">
                    {team.leagueName}
                  </p>
                </div>
              </div>
            </div>

            {/* Match info chip */}
            {currentMatch && (
              <div className="bg-black/50 border border-white/5 rounded-xl p-3 mb-5 text-center shadow-inner">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  ★ PARTIDO OFICIAL ★
                </div>
                <div className="text-base font-bold text-white my-0.5">
                  {team.shortName} <span className="text-gray-500">VS</span> {currentMatch.rival.toUpperCase()}
                </div>
                <div className="text-[11px] text-gray-400 flex items-center justify-center gap-2 flex-wrap">
                  <span>📅 {currentMatch.date}</span>
                  <span>•</span>
                  <span>⏰ {currentMatch.time} hrs</span>
                  <span>•</span>
                  <span className="truncate">📍 {currentMatch.stadium}</span>
                </div>
              </div>
            )}

            {/* Callup Title Banner */}
            <div className="text-center mb-5">
              <span className="inline-block px-4 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold tracking-widest uppercase">
                CONVOCATORIA OFICIAL
              </span>
            </div>

            {/* Squad lists by position */}
            <div className="grid grid-cols-2 gap-4 text-left">
              {/* Left Column: POR & DEF */}
              <div className="space-y-4">
                <div>
                  <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
                    Porteros ({goalkeepers.length})
                  </h5>
                  <div className="space-y-1.5">
                    {goalkeepers.length === 0 ? (
                      <p className="text-[11px] text-gray-500 italic">Sin convocados</p>
                    ) : (
                      goalkeepers.map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold flex items-center justify-center border border-emerald-500/30">
                            {p.number}
                          </span>
                          <span className="text-xs font-semibold text-gray-200 truncate">
                            {p.name}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
                    Defensas ({defenders.length})
                  </h5>
                  <div className="space-y-1.5">
                    {defenders.length === 0 ? (
                      <p className="text-[11px] text-gray-500 italic">Sin convocados</p>
                    ) : (
                      defenders.map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-white/5 text-gray-200 font-mono text-[10px] font-bold flex items-center justify-center border border-white/10">
                            {p.number}
                          </span>
                          <span className="text-xs font-semibold text-gray-200 truncate">
                            {p.name}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: MED & DEL */}
              <div className="space-y-4">
                <div>
                  <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
                    Medios ({midfielders.length})
                  </h5>
                  <div className="space-y-1.5">
                    {midfielders.length === 0 ? (
                      <p className="text-[11px] text-gray-500 italic">Sin convocados</p>
                    ) : (
                      midfielders.map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-white/5 text-gray-200 font-mono text-[10px] font-bold flex items-center justify-center border border-white/10">
                            {p.number}
                          </span>
                          <span className="text-xs font-semibold text-gray-200 truncate">
                            {p.name}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
                    Delanteros ({forwards.length})
                  </h5>
                  <div className="space-y-1.5">
                    {forwards.length === 0 ? (
                      <p className="text-[11px] text-gray-500 italic">Sin convocados</p>
                    ) : (
                      forwards.map((p) => (
                        <div key={p.id} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-white/5 text-gray-200 font-mono text-[10px] font-bold flex items-center justify-center border border-white/10">
                            {p.number}
                          </span>
                          <span className="text-xs font-semibold text-gray-200 truncate">
                            {p.name}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Poster Footer Stamp */}
            <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-500 font-medium">
              <span>{team.stadium}</span>
              <span className="font-bold text-emerald-400">#VamosPorLaVictoria</span>
            </div>
          </div>
        </div>

        {/* Right Side: Roster Controls & Player Registration */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#141416] p-5 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  {t.convocatoria.rosterTitle} ({players.length})
                </h3>
                <p className="text-xs text-gray-400">
                  Marca los jugadores que jugarán este partido
                </p>
              </div>

              {isOwnerOrAdmin && (
                <button
                  id="btn-add-player-roster"
                  onClick={() => setShowAddPlayerModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.convocatoria.addPlayer}
                </button>
              )}
            </div>

            {/* Quick bulk actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={selectAllPlayers}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-medium"
              >
                {t.convocatoria.allCalled}
              </button>
              <button
                onClick={clearAllPlayers}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10 text-xs font-medium"
              >
                {t.convocatoria.clearAll}
              </button>
            </div>

            {/* Players list with toggle checkboxes */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {players.map((player) => (
                <div
                  key={player.id}
                  id={`player-row-${player.id}`}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                    player.isCalledUp
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-black/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div
                    onClick={() => togglePlayerCalledUp(player.id)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                        player.isCalledUp
                          ? 'bg-emerald-500 text-black'
                          : 'border border-white/10 bg-black/50'
                      }`}
                    >
                      {player.isCalledUp && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-emerald-400">
                          #{player.number}
                        </span>
                        <span className="text-xs font-bold text-white truncate">
                          {player.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {player.position} • {player.goals} goles • {player.mvpHistory?.length || 0} MVPs
                      </span>
                    </div>
                  </div>

                  {isOwnerOrAdmin && (
                    <button
                      onClick={() => handleDeletePlayer(player.id)}
                      className="p-1 text-gray-500 hover:text-rose-400 transition-colors ml-2"
                      title="Eliminar de plantilla"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add New Player to Roster */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141416] border border-white/10 w-full max-w-md rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              {t.convocatoria.addPlayer}
            </h3>

            <form onSubmit={handleAddPlayer} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  placeholder="ej. Santiago Giménez"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                    Número de Camiseta
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={newPlayer.number}
                    onChange={(e) => setNewPlayer({ ...newPlayer, number: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                    Posición
                  </label>
                  <select
                    value={newPlayer.position}
                    onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value as PlayerPosition })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="POR">Portero (POR)</option>
                    <option value="DEF">Defensa (DEF)</option>
                    <option value="MED">Medio (MED)</option>
                    <option value="DEL">Delantero (DEL)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                  Apodo / Sobrenombre (Opcional)
                </label>
                <input
                  type="text"
                  value={newPlayer.nickname}
                  onChange={(e) => setNewPlayer({ ...newPlayer, nickname: e.target.value })}
                  placeholder="ej. Bebote"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                  URL de Foto del Jugador
                </label>
                <input
                  type="url"
                  value={newPlayer.avatarUrl}
                  onChange={(e) => setNewPlayer({ ...newPlayer, avatarUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddPlayerModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold shadow-sm"
                >
                  Registrar Jugador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Team Identity (Owner / Logo / Banner) */}
      {showEditTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141416] border border-white/10 w-full max-w-lg rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              {t.convocatoria.teamDetails}
            </h3>

            <form onSubmit={handleSaveTeamIdentity} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                    {t.convocatoria.teamName}
                  </label>
                  <input
                    type="text"
                    required
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                    {t.convocatoria.shortName}
                  </label>
                  <input
                    type="text"
                    required
                    value={teamForm.shortName}
                    onChange={(e) => setTeamForm({ ...teamForm, shortName: e.target.value })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                  {t.convocatoria.league}
                </label>
                <input
                  type="text"
                  required
                  value={teamForm.leagueName}
                  onChange={(e) => setTeamForm({ ...teamForm, leagueName: e.target.value })}
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1 flex items-center justify-between">
                  <span>{t.convocatoria.uploadLogo} (URL)</span>
                </label>
                <input
                  type="url"
                  value={teamForm.logoUrl}
                  onChange={(e) => setTeamForm({ ...teamForm, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1 flex items-center justify-between">
                  <span>{t.convocatoria.uploadBanner} (URL)</span>
                </label>
                <input
                  type="url"
                  value={teamForm.bannerUrl}
                  onChange={(e) => setTeamForm({ ...teamForm, bannerUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditTeamModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
