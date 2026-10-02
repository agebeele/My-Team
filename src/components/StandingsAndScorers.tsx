import React, { useState, useRef } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Medal,
  ChevronUp,
  Shield,
  Search,
  Download,
  CheckCircle2,
  Sparkles,
  Pencil,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';
import { StandingsRow, Player, TeamInfo, AppUser, Language } from '../types';
import { getT } from '../utils/translations';
import { downloadElementAsImage } from '../utils/imageDownloader';
import { TableAiScannerModal } from './TableAiScannerModal';
import { getCrestForTeam } from '../utils/tableAiScanner';
import { DEFAULT_GREY_SHIELD_SVG } from '../utils/ocrTableParser';

interface StandingsAndScorersProps {
  standings: StandingsRow[];
  setStandings?: React.Dispatch<React.SetStateAction<StandingsRow[]>>;
  players: Player[];
  team: TeamInfo;
  setTeam?: React.Dispatch<React.SetStateAction<TeamInfo>>;
  currentUser: AppUser;
  language: Language;
  onViewPlayerProfile: (playerId: string) => void;
}

export const StandingsAndScorers: React.FC<StandingsAndScorersProps> = ({
  standings,
  setStandings,
  players,
  team,
  setTeam,
  currentUser,
  language,
  onViewPlayerProfile,
}) => {
  const t = getT(language);
  const [activeTab, setActiveTab] = useState<'scorers' | 'standings'>('scorers');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiScanModalOpen, setIsAiScanModalOpen] = useState(false);
  const [isDirectEditing, setIsDirectEditing] = useState(false);
  const [editRows, setEditRows] = useState<StandingsRow[]>([]);

  const handleStartDirectEdit = () => {
    setEditRows(JSON.parse(JSON.stringify(standings)));
    setIsDirectEditing(true);
  };

  const handleCancelDirectEdit = () => {
    setIsDirectEditing(false);
  };

  const handleSaveDirectEdit = () => {
    if (setStandings) {
      setStandings(editRows);
      setToastMessage('¡Datos de la tabla guardados exitosamente!');
      setTimeout(() => setToastMessage(null), 3500);
    }
    setIsDirectEditing(false);
  };

  const handleEditRowField = (index: number, field: keyof StandingsRow, value: any) => {
    setEditRows((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };
      if (field === 'name') {
        target.logo = getCrestForTeam(String(value), target.isOurTeam, team.logoUrl);
      }
      if (field === 'gf' || field === 'gc') {
        const gf = field === 'gf' ? Number(value) : target.gf;
        const gc = field === 'gc' ? Number(value) : target.gc;
        target.dg = gf - gc;
      }
      if (field === 'g' || field === 'e') {
        const g = field === 'g' ? Number(value) : target.g;
        const e = field === 'e' ? Number(value) : target.e;
        target.pts = g * 3 + e;
      }
      updated[index] = target;
      return updated;
    });
  };

  const handleSetOurTeamInEdit = (index: number) => {
    setEditRows((prev) =>
      prev.map((row, i) => ({
        ...row,
        isOurTeam: i === index,
        logo: i === index ? team.logoUrl || '/fc_bayern_logo.png' : getCrestForTeam(row.name, false),
      }))
    );
  };

  const handleAddRowInEdit = () => {
    const nextRank = editRows.length + 1;
    const newRow: StandingsRow = {
      id: `standing_manual_${Date.now()}`,
      rank: nextRank,
      name: `Equipo ${nextRank}`,
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
    setEditRows([...editRows, newRow]);
  };

  const handleDeleteRowInEdit = (index: number) => {
    setEditRows((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((r, idx) => ({ ...r, rank: idx + 1 }));
    });
  };

  // Gallery download states
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const scorersSectionRef = useRef<HTMLDivElement>(null);
  const standingsSectionRef = useRef<HTMLDivElement>(null);

  const handleDownloadScorers = async () => {
    if (!scorersSectionRef.current) return;
    setIsDownloading(true);
    const cleanLeague = (team.leagueName || 'liga').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `tabla_goleo_${cleanLeague}.png`;

    const res = await downloadElementAsImage(scorersSectionRef.current, {
      fileName,
      backgroundColor: '#0A0A0B',
      scale: 2.5,
    });

    setIsDownloading(false);
    if (res) {
      setToastMessage('¡Tabla de goleo guardada en tu galería!');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleDownloadStandings = async () => {
    if (!standingsSectionRef.current) return;
    setIsDownloading(true);
    const cleanLeague = (team.leagueName || 'liga').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `tabla_general_${cleanLeague}.png`;

    const res = await downloadElementAsImage(standingsSectionRef.current, {
      fileName,
      backgroundColor: '#0A0A0B',
      scale: 2.5,
    });

    setIsDownloading(false);
    if (res) {
      setToastMessage('¡Tabla general guardada en tu galería!');
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Sort players by goals descending, then assists
  const sortedScorers = [...players]
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Toast Notification when image is saved to gallery */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-500 text-black px-4 py-3 rounded-xl shadow-2xl font-bold text-xs sm:text-sm flex items-center gap-2 border border-white animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#242526] p-5 rounded-2xl border border-[#CED0D4] dark:border-white/10 shadow-xs transition-colors">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#050505] dark:text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            {t.tables.title}
          </h2>
          <p className="text-xs sm:text-sm text-[#65676B] dark:text-gray-400 mt-0.5 font-medium">
            {team.leagueName}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Download button for current active tab */}
          <button
            onClick={activeTab === 'scorers' ? handleDownloadScorers : handleDownloadStandings}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F0F2F5] hover:bg-[#E4E6EB] dark:bg-white/10 dark:hover:bg-white/15 text-[#050505] dark:text-white border border-[#CED0D4] dark:border-white/10 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            title={`Descargar ${activeTab === 'scorers' ? 'goleadores' : 'tabla general'} a tu galería`}
          >
            <Download className="w-3.5 h-3.5 text-[#1877F2] dark:text-emerald-400" />
            <span>{isDownloading ? 'Guardando...' : 'Descargar Foto'}</span>
          </button>

          {/* Tab switcher */}
          <div className="flex bg-[#F0F2F5] dark:bg-black/50 p-1 rounded-xl border border-[#CED0D4] dark:border-white/10 text-xs">
            <button
              id="tab-scorers"
              onClick={() => setActiveTab('scorers')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'scorers'
                  ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-amber-400 shadow-xs'
                  : 'text-[#65676B] dark:text-gray-400 hover:text-[#050505] dark:hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-500" />
              {t.tables.scorersTab}
            </button>
            <button
              id="tab-standings"
              onClick={() => setActiveTab('standings')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'standings'
                  ? 'bg-white dark:bg-[#242526] text-[#1877F2] dark:text-emerald-400 shadow-xs'
                  : 'text-[#65676B] dark:text-gray-400 hover:text-[#050505] dark:hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 text-[#1877F2] dark:text-emerald-400" />
              {t.tables.standingsTab}
            </button>
          </div>
        </div>
      </div>

      {/* Top Scorers View */}
      {activeTab === 'scorers' && (
        <div ref={scorersSectionRef} className="space-y-4">
          {/* Podium Top 3 Scorers Showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {sortedScorers.slice(0, 3).map((scorer, index) => {
              const rankColor =
                index === 0
                  ? 'border-amber-300 dark:border-amber-400/40 bg-amber-50/70 dark:bg-amber-500/10 text-[#050505] dark:text-amber-300'
                  : index === 1
                  ? 'border-[#CED0D4] dark:border-white/20 bg-white dark:bg-white/5 text-[#050505] dark:text-gray-200'
                  : 'border-amber-200 dark:border-amber-700/40 bg-amber-50/40 dark:bg-amber-700/10 text-[#050505] dark:text-amber-500';

              const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';

              return (
                <div
                  key={scorer.id}
                  onClick={() => onViewPlayerProfile(scorer.id)}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] flex items-center gap-4 shadow-xs ${rankColor}`}
                >
                  <div className="relative">
                    <img
                      src={scorer.avatarUrl}
                      alt={scorer.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white dark:ring-white/10 shadow-xs"
                    />
                    <span className="absolute -top-2 -left-2 text-xl">{medalEmoji}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-wider block text-[#65676B] dark:text-gray-400">
                      Puesto #{index + 1}
                    </span>
                    <h4 className="text-sm font-bold text-[#050505] dark:text-white truncate">
                      {scorer.name}
                    </h4>
                    <p className="text-xs text-[#65676B] dark:text-gray-400 font-medium">
                      {scorer.position} • #{scorer.number}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black font-sport text-[#050505] dark:text-white block leading-none">
                      {scorer.goals}
                    </span>
                    <span className="text-[10px] font-bold text-[#1877F2] dark:text-emerald-400 uppercase tracking-wider">
                      Goles
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Scorers Table */}
          <div className="bg-white dark:bg-[#242526] rounded-2xl border border-[#CED0D4] dark:border-white/10 overflow-hidden shadow-xs transition-colors">
            <div className="p-4 border-b border-[#CED0D4] dark:border-white/10 flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#65676B] dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar goleador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-[#F0F2F5] dark:bg-black/50 border border-[#CED0D4] dark:border-white/10 rounded-xl text-xs text-[#050505] dark:text-white focus:outline-none focus:border-[#1877F2]"
                />
              </div>
              <span className="text-xs text-[#65676B] dark:text-gray-400 font-medium">
                {sortedScorers.length} Jugadores registrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F0F2F5] dark:bg-black/40 text-[#65676B] dark:text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-[#CED0D4] dark:border-white/10">
                  <tr>
                    <th className="py-3 px-4 text-center">Pos</th>
                    <th className="py-3 px-4">Jugador</th>
                    <th className="py-3 px-4 text-center">Posición</th>
                    <th className="py-3 px-4 text-center font-black text-[#1877F2] dark:text-amber-400">Goles</th>
                    <th className="py-3 px-4 text-center">Asistencias</th>
                    <th className="py-3 px-4 text-center">PJ</th>
                    <th className="py-3 px-4 text-center">MVPs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CED0D4]/60 dark:divide-white/5 text-[#050505] dark:text-gray-300">
                  {sortedScorers.map((player, index) => (
                    <tr
                      key={player.id}
                      onClick={() => onViewPlayerProfile(player.id)}
                      className="hover:bg-[#F0F2F5]/80 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-center font-bold font-mono">
                        {index === 0 ? (
                          <span className="text-amber-500 dark:text-amber-400 font-black">1</span>
                        ) : index === 1 ? (
                          <span className="text-[#65676B] dark:text-gray-300 font-bold">2</span>
                        ) : index === 2 ? (
                          <span className="text-amber-700 dark:text-amber-600 font-bold">3</span>
                        ) : (
                          <span>{index + 1}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={player.avatarUrl}
                            alt={player.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                          <div>
                            <span className="font-bold text-[#050505] dark:text-white block">
                              {player.name}
                            </span>
                            <span className="text-[10px] text-[#65676B] dark:text-gray-400">
                              #{player.number} {player.nickname ? `"${player.nickname}"` : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-[#65676B] dark:text-gray-400">
                        {player.position}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-[#1877F2] dark:text-amber-400 text-sm">
                        {player.goals}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[#050505] dark:text-gray-300 font-semibold">
                        {player.assists}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-[#65676B] dark:text-gray-400 font-semibold">
                        {player.matches}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-500 dark:text-amber-400">
                        {player.mvpHistory?.length || 0} ★
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* General Standings Table View */}
      {activeTab === 'standings' && (
        <div ref={standingsSectionRef} className="bg-white dark:bg-[#242526] rounded-2xl border border-[#CED0D4] dark:border-white/10 overflow-hidden shadow-xs transition-colors">
          <div className="p-4 border-b border-[#CED0D4] dark:border-white/10 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-black text-[#050505] dark:text-white">
                Clasificación General - {team.leagueName}
              </h3>
              <p className="text-xs text-[#65676B] dark:text-gray-400 font-medium">
                Puestos 1-4 clasifican a la Liguilla por el campeonato
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isDirectEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleAddRowInEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#18191A] border border-[#CED0D4] dark:border-white/10 hover:bg-gray-100 text-xs font-bold text-[#050505] dark:text-white transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#1877F2]" />
                    <span>+ Agregar Equipo</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelDirectEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-xs font-bold text-[#65676B] dark:text-gray-300 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cancelar</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDirectEdit}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Cambios</span>
                  </button>
                </>
              ) : (
                <>
                  {(currentUser.role === 'owner' || currentUser.role === 'coach') && setStandings && (
                    <>
                      <button
                        type="button"
                        onClick={handleStartDirectEdit}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#18191A] border border-[#1877F2] text-[#1877F2] hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        title="Editar los nombres y números de la tabla directamente"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar Tabla Directamente</span>
                      </button>

                      <button
                        type="button"
                        id="btn-scan-table-ai"
                        onClick={() => setIsAiScanModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black transition-all shadow-sm cursor-pointer"
                        title="Escanear fotos de la tabla de la liga (31 equipos) con IA"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                        <span>Escanear Fotos con IA (31 Equipos)</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={handleDownloadStandings}
                    disabled={isDownloading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E7F3FF] hover:bg-[#DBE7F2] dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-[#1877F2] dark:text-emerald-300 border border-[#1877F2]/30 dark:border-emerald-500/20 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Guardar tabla general en tu galería"
                  >
                    <Download className="w-3.5 h-3.5 text-[#1877F2] dark:text-emerald-400" />
                    <span>{isDownloading ? 'Guardando...' : 'Guardar Tabla en Galería'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {isDirectEditing && (
            <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/50 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
              <span className="font-bold flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5 text-[#1877F2]" />
                Modo edición activo: Modifica los números y nombres de tus 31 equipos. Al terminar pulsa "Guardar Cambios".
              </span>
              <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
                {editRows.length} equipos en la tabla
              </span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F0F2F5] dark:bg-black/40 text-[#65676B] dark:text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-[#CED0D4] dark:border-white/10">
                <tr>
                  <th className="py-3 px-3 text-center w-12">Pos</th>
                  <th className="py-3 px-4">Club</th>
                  <th className="py-3 px-2 text-center w-14">PJ</th>
                  <th className="py-3 px-2 text-center w-14">G</th>
                  <th className="py-3 px-2 text-center w-14">E</th>
                  <th className="py-3 px-2 text-center w-14">P</th>
                  <th className="py-3 px-2 text-center w-14 hidden sm:table-cell">GF</th>
                  <th className="py-3 px-2 text-center w-14 hidden sm:table-cell">GC</th>
                  <th className="py-3 px-2 text-center w-14">DG</th>
                  <th className="py-3 px-4 text-center w-16 font-black text-[#1877F2] dark:text-emerald-400">PTS</th>
                  {isDirectEditing && <th className="py-3 px-2 text-center w-12">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CED0D4]/60 dark:divide-white/5 text-[#050505] dark:text-gray-300">
                {isDirectEditing ? (
                  editRows.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      className={`transition-colors ${
                        row.isOurTeam
                          ? 'bg-blue-50/90 dark:bg-blue-900/30 font-bold border-l-4 border-[#1877F2]'
                          : 'hover:bg-[#F0F2F5]/80 dark:hover:bg-white/5'
                      }`}
                    >
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          value={row.rank}
                          onChange={(e) => handleEditRowField(idx, 'rank', parseInt(e.target.value) || 0)}
                          className="w-10 text-center font-bold font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-[#050505] dark:text-white text-xs"
                        />
                      </td>

                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={row.logo}
                            alt={row.name}
                            className="w-6 h-6 rounded-full object-cover shrink-0 border border-gray-200 dark:border-white/10 bg-white shadow-2xs"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_GREY_SHIELD_SVG;
                            }}
                          />
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => handleEditRowField(idx, 'name', e.target.value)}
                            className="flex-1 min-w-[130px] font-bold py-1 px-2 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-[#050505] dark:text-white text-xs"
                          />
                          {row.isOurTeam ? (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#1877F2] text-white shrink-0">
                              Mi Club ⭐
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetOurTeamInEdit(idx)}
                              className="text-[10px] text-gray-400 hover:text-[#1877F2] underline shrink-0 cursor-pointer"
                              title="Marcar como tu club"
                            >
                              Es mi club
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-1 text-center">
                        <input
                          type="number"
                          value={row.pj}
                          onChange={(e) => handleEditRowField(idx, 'pj', parseInt(e.target.value) || 0)}
                          className="w-12 text-center font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-[#050505] dark:text-white text-xs"
                        />
                      </td>

                      <td className="py-2 px-1 text-center">
                        <input
                          type="number"
                          value={row.g}
                          onChange={(e) => handleEditRowField(idx, 'g', parseInt(e.target.value) || 0)}
                          className="w-12 text-center font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-emerald-600 font-bold text-xs"
                        />
                      </td>

                      <td className="py-2 px-1 text-center">
                        <input
                          type="number"
                          value={row.e}
                          onChange={(e) => handleEditRowField(idx, 'e', parseInt(e.target.value) || 0)}
                          className="w-12 text-center font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-[#050505] dark:text-white text-xs"
                        />
                      </td>

                      <td className="py-2 px-1 text-center">
                        <input
                          type="number"
                          value={row.p}
                          onChange={(e) => handleEditRowField(idx, 'p', parseInt(e.target.value) || 0)}
                          className="w-12 text-center font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-rose-600 font-bold text-xs"
                        />
                      </td>

                      <td className="py-2 px-1 text-center hidden sm:table-cell">
                        <input
                          type="number"
                          value={row.gf}
                          onChange={(e) => handleEditRowField(idx, 'gf', parseInt(e.target.value) || 0)}
                          className="w-12 text-center font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-[#050505] dark:text-white text-xs"
                        />
                      </td>

                      <td className="py-2 px-1 text-center hidden sm:table-cell">
                        <input
                          type="number"
                          value={row.gc}
                          onChange={(e) => handleEditRowField(idx, 'gc', parseInt(e.target.value) || 0)}
                          className="w-12 text-center font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-[#050505] dark:text-white text-xs"
                        />
                      </td>

                      <td className="py-2 px-1 text-center">
                        <input
                          type="number"
                          value={row.dg}
                          onChange={(e) => handleEditRowField(idx, 'dg', parseInt(e.target.value) || 0)}
                          className={`w-12 text-center font-mono py-1 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-[#18191A] text-xs font-bold ${
                            row.dg > 0 ? 'text-emerald-600' : row.dg < 0 ? 'text-rose-600' : 'text-gray-500'
                          }`}
                        />
                      </td>

                      <td className="py-2 px-1 text-center">
                        <input
                          type="number"
                          value={row.pts}
                          onChange={(e) => handleEditRowField(idx, 'pts', parseInt(e.target.value) || 0)}
                          className="w-14 text-center font-mono py-1 rounded border-2 border-[#1877F2] bg-white dark:bg-[#18191A] text-[#1877F2] text-xs font-black"
                        />
                      </td>

                      <td className="py-2 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRowInEdit(idx)}
                          className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  standings.map((row) => {
                    const isCurrent = row.isOurTeam;

                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          isCurrent
                            ? 'bg-[#E7F3FF]/70 dark:bg-emerald-500/10 font-bold border-l-4 border-[#1877F2] dark:border-emerald-500'
                            : 'hover:bg-[#F0F2F5]/80 dark:hover:bg-white/5'
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-bold font-mono">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-md ${
                              row.rank <= 4
                                ? 'bg-[#1877F2]/10 text-[#1877F2] dark:bg-emerald-500/20 dark:text-emerald-400 font-bold'
                                : 'text-[#65676B] dark:text-gray-400'
                            }`}
                          >
                            {row.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {row.logo && (row.logo.startsWith('http') || row.logo.startsWith('/') || row.logo.startsWith('data:')) ? (
                              <img
                                src={row.logo}
                                alt={row.name}
                                className="w-6 h-6 rounded-full object-cover shrink-0 border border-gray-200 dark:border-white/10 bg-white shadow-2xs"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = DEFAULT_GREY_SHIELD_SVG;
                                }}
                              />
                            ) : (
                              <span className="text-base">{row.logo || '🛡️'}</span>
                            )}
                            <span
                              className={`font-semibold truncate ${
                                isCurrent ? 'text-[#1877F2] dark:text-emerald-400 font-bold' : 'text-[#050505] dark:text-white'
                              }`}
                            >
                              {row.name}
                              {isCurrent && (
                                <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-md bg-[#1877F2] text-white font-bold uppercase tracking-wider">
                                  MI EQUIPO
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-[#65676B] dark:text-gray-400">{row.pj}</td>
                        <td className="py-3 px-2 text-center font-mono text-[#050505] dark:text-gray-300 font-bold">{row.g}</td>
                        <td className="py-3 px-2 text-center font-mono text-[#65676B] dark:text-gray-400">{row.e}</td>
                        <td className="py-3 px-2 text-center font-mono text-[#65676B] dark:text-gray-400">{row.p}</td>
                        <td className="py-3 px-2 text-center font-mono text-[#65676B] dark:text-gray-400 hidden sm:table-cell">{row.gf}</td>
                        <td className="py-3 px-2 text-center font-mono text-[#65676B] dark:text-gray-400 hidden sm:table-cell">{row.gc}</td>
                        <td className="py-3 px-2 text-center font-mono font-semibold">
                          <span className={row.dg > 0 ? 'text-emerald-600 dark:text-emerald-400' : row.dg < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#65676B] dark:text-gray-400'}>
                            {row.dg > 0 ? `+${row.dg}` : row.dg}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-black text-sm text-[#1877F2] dark:text-emerald-400">
                          {row.pts}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI League Table Scanner Modal */}
      {setStandings && (
        <TableAiScannerModal
          isOpen={isAiScanModalOpen}
          onClose={() => setIsAiScanModalOpen(false)}
          team={team}
          onApplyStandings={(newRows, updatedLeague) => {
            setStandings(newRows);
            if (updatedLeague && setTeam) {
              setTeam((prev) => ({ ...prev, leagueName: updatedLeague }));
            }
            setToastMessage('¡Tabla general actualizada con IA exitosamente!');
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}
    </div>
  );
};
