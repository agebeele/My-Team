import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Medal,
  ChevronUp,
  Shield,
  Search,
} from 'lucide-react';
import { StandingsRow, Player, TeamInfo, AppUser, Language } from '../types';
import { getT } from '../utils/translations';

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

  // Sort players by goals descending, then assists
  const sortedScorers = [...players]
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#141416] p-5 rounded-xl border border-white/5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            {t.tables.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            {team.leagueName}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-black/50 p-1 rounded-lg border border-white/10 text-xs">
          <button
            id="tab-scorers"
            onClick={() => setActiveTab('scorers')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-bold transition-all ${
              activeTab === 'scorers'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            {t.tables.scorersTab}
          </button>
          <button
            id="tab-standings"
            onClick={() => setActiveTab('standings')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md font-bold transition-all ${
              activeTab === 'standings'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            {t.tables.standingsTab}
          </button>
        </div>
      </div>

      {/* Top Scorers View */}
      {activeTab === 'scorers' && (
        <div className="space-y-4">
          {/* Podium Top 3 Scorers Showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {sortedScorers.slice(0, 3).map((scorer, index) => {
              const rankColor =
                index === 0
                  ? 'border-amber-400/40 bg-amber-500/10 text-amber-300'
                  : index === 1
                  ? 'border-white/20 bg-white/5 text-gray-200'
                  : 'border-amber-700/40 bg-amber-700/10 text-amber-500';

              const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';

              return (
                <div
                  key={scorer.id}
                  onClick={() => onViewPlayerProfile(scorer.id)}
                  className={`relative p-5 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] flex items-center gap-4 ${rankColor}`}
                >
                  <div className="relative">
                    <img
                      src={scorer.avatarUrl}
                      alt={scorer.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/10"
                    />
                    <span className="absolute -top-2 -left-2 text-xl">{medalEmoji}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest block opacity-80">
                      Puesto #{index + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white truncate">
                      {scorer.name}
                    </h4>
                    <p className="text-xs text-gray-400">
                      {scorer.position} • #{scorer.number}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black font-sport text-white block leading-none">
                      {scorer.goals}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Goles
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Scorers Table */}
          <div className="bg-[#141416] rounded-xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar goleador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <span className="text-xs text-gray-400">
                {sortedScorers.length} Jugadores registrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/40 text-gray-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                  <tr>
                    <th className="py-3 px-4 text-center">Pos</th>
                    <th className="py-3 px-4">Jugador</th>
                    <th className="py-3 px-4 text-center">Posición</th>
                    <th className="py-3 px-4 text-center font-bold text-amber-400">Goles</th>
                    <th className="py-3 px-4 text-center">Asistencias</th>
                    <th className="py-3 px-4 text-center">PJ</th>
                    <th className="py-3 px-4 text-center">MVPs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {sortedScorers.map((player, index) => (
                    <tr
                      key={player.id}
                      onClick={() => onViewPlayerProfile(player.id)}
                      className="hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-center font-bold font-mono">
                        {index === 0 ? (
                          <span className="text-amber-400 font-bold">1</span>
                        ) : index === 1 ? (
                          <span className="text-gray-300 font-bold">2</span>
                        ) : index === 2 ? (
                          <span className="text-amber-600 font-bold">3</span>
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
                            <span className="font-bold text-white block">
                              {player.name}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              #{player.number} {player.nickname ? `"${player.nickname}"` : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-400">
                        {player.position}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-400 text-sm">
                        {player.goals}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-gray-300">
                        {player.assists}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-gray-400">
                        {player.matches}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-400">
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
        <div className="bg-[#141416] rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                Clasificación General - {team.leagueName}
              </h3>
              <p className="text-xs text-gray-400">
                Puestos 1-4 clasifican a la Liguilla por el campeonato
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 text-gray-400 uppercase tracking-wider text-[10px] border-b border-white/5">
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
                  <th className="py-3 px-4 text-center font-bold text-emerald-400">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {standings.map((row) => {
                  const isCurrent = row.isOurTeam;

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-emerald-500/10 font-bold border-l-2 border-emerald-500'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-bold font-mono">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-md ${
                            row.rank <= 4
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'text-gray-400'
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
                              isCurrent ? 'text-emerald-400 font-bold' : 'text-white'
                            }`}
                          >
                            {row.name}
                            {isCurrent && (
                              <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-black font-bold uppercase tracking-wider">
                                MI EQUIPO
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-gray-400">{row.pj}</td>
                      <td className="py-3 px-2 text-center font-mono text-gray-300">{row.g}</td>
                      <td className="py-3 px-2 text-center font-mono text-gray-400">{row.e}</td>
                      <td className="py-3 px-2 text-center font-mono text-gray-400">{row.p}</td>
                      <td className="py-3 px-2 text-center font-mono text-gray-400 hidden sm:table-cell">{row.gf}</td>
                      <td className="py-3 px-2 text-center font-mono text-gray-400 hidden sm:table-cell">{row.gc}</td>
                      <td className="py-3 px-2 text-center font-mono font-semibold">
                        <span className={row.dg > 0 ? 'text-emerald-400' : row.dg < 0 ? 'text-rose-400' : 'text-gray-400'}>
                          {row.dg > 0 ? `+${row.dg}` : row.dg}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-sm text-emerald-400">
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
