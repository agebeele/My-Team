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
} from 'lucide-react';
import { StandingsRow, Player, TeamInfo, AppUser, Language } from '../types';
import { getT } from '../utils/translations';
import { downloadElementAsImage } from '../utils/imageDownloader';

interface StandingsAndScorersProps {
  standings: StandingsRow[];
  players: Player[];
  team: TeamInfo;
  currentUser: AppUser;
  language: Language;
  onViewPlayerProfile: (playerId: string) => void;
}

export const StandingsAndScorers: React.FC<StandingsAndScorersProps> = ({
  standings,
  players,
  team,
  currentUser,
  language,
  onViewPlayerProfile,
}) => {
  const t = getT(language);
  const [activeTab, setActiveTab] = useState<'scorers' | 'standings'>('scorers');
  const [searchTerm, setSearchTerm] = useState('');

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

            <button
              onClick={handleDownloadStandings}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E7F3FF] hover:bg-[#DBE7F2] dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-[#1877F2] dark:text-emerald-300 border border-[#1877F2]/30 dark:border-emerald-500/20 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              title="Guardar tabla general en tu galería"
            >
              <Download className="w-3.5 h-3.5 text-[#1877F2] dark:text-emerald-400" />
              <span>{isDownloading ? 'Guardando...' : 'Guardar Tabla en Galería'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F0F2F5] dark:bg-black/40 text-[#65676B] dark:text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-[#CED0D4] dark:border-white/10">
                <tr>
                  <th className="py-3 px-3 text-center">Pos</th>
                  <th className="py-3 px-4">Club</th>
                  <th className="py-3 px-2 text-center">PJ</th>
                  <th className="py-3 px-2 text-center">G</th>
                  <th className="py-3 px-2 text-center">E</th>
                  <th className="py-3 px-2 text-center">P</th>
                  <th className="py-3 px-2 text-center hidden sm:table-cell">GF</th>
                  <th className="py-3 px-2 text-center hidden sm:table-cell">GC</th>
                  <th className="py-3 px-2 text-center">DG</th>
                  <th className="py-3 px-4 text-center font-black text-[#1877F2] dark:text-emerald-400">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CED0D4]/60 dark:divide-white/5 text-[#050505] dark:text-gray-300">
                {standings.map((row) => {
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
                        <div className="flex items-center gap-2">
                          <span className="text-base">{row.logo}</span>
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
