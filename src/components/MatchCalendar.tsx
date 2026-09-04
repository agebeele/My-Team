import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Plus,
  FileDown,
  Bell,
  CheckCircle2,
  Sparkles,
  Edit2,
  Trash2,
  AlertCircle,
  ExternalLink,
  Shield,
  Activity,
} from 'lucide-react';
import { Match, TeamInfo, Player, AppUser, Language } from '../types';
import { getT } from '../utils/translations';
import { exportMatchToPdf } from '../utils/pdfExport';

interface MatchCalendarProps {
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  team: TeamInfo;
  players: Player[];
  currentUser: AppUser;
  language: Language;
  onNavigateToMvp?: (matchId: string) => void;
  onOpenMvp?: (matchId: string) => void;
  onNavigateToLineup?: (matchId: string) => void;
  onNavigateToConvocatoria?: (matchId: string) => void;
  activeReminders?: string[];
  toggleMatchReminder?: (match: Match) => void;
}

export const MatchCalendar: React.FC<MatchCalendarProps> = ({
  matches,
  setMatches,
  team,
  players,
  currentUser,
  language,
  onNavigateToMvp,
  onOpenMvp,
  onNavigateToLineup = (_matchId: string) => {},
  onNavigateToConvocatoria = (_matchId: string) => {},
  activeReminders = [],
  toggleMatchReminder = (_match: Match) => {},
}) => {
  const t = getT(language);
  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';
  const handleGoToMvp = onOpenMvp || onNavigateToMvp || (() => {});

  const [filter, setFilter] = useState<'all' | 'scheduled' | 'finished'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [showResultModal, setShowResultModal] = useState<Match | null>(null);

  // Form states for creating / editing match
  const [formData, setFormData] = useState({
    rival: '',
    rivalLogo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=150&q=80',
    date: new Date().toISOString().split('T')[0],
    time: '20:00',
    stadium: 'Cancha 1 - Polideportivo',
    isHome: true,
  });

  // Form states for registering score
  const [resultScoreUs, setResultScoreUs] = useState<number>(0);
  const [resultScoreThem, setResultScoreThem] = useState<number>(0);
  const [scorersList, setScorersList] = useState<Array<{ playerId: string; playerName: string; minute: number }>>([]);
  const [selectedScorerPlayerId, setSelectedScorerPlayerId] = useState<string>(players[0]?.id || '');
  const [scorerMinute, setScorerMinute] = useState<number>(15);

  const filteredMatches = matches.filter((m) => {
    if (filter === 'scheduled') return m.status === 'scheduled' || m.status === 'live';
    if (filter === 'finished') return m.status === 'finished';
    return true;
  });

  // Calculate if 50 minutes have elapsed since start
  const isMvpVoteAvailable = (match: Match): boolean => {
    if (match.status === 'finished') return true;
    const now = Date.now();
    const elapsedMinutes = (now - match.matchStartTimestamp) / (1000 * 60);
    return elapsedMinutes >= 50;
  };

  const getMinutesElapsed = (match: Match): number => {
    const now = Date.now();
    return Math.floor((now - match.matchStartTimestamp) / (1000 * 60));
  };

  const handleCreateOrUpdateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rival.trim()) return;

    const matchDateTime = new Date(`${formData.date}T${formData.time}:00`).getTime();

    if (editingMatch) {
      setMatches((prev) =>
        prev.map((m) =>
          m.id === editingMatch.id
            ? {
                ...m,
                rival: formData.rival,
                rivalLogo: formData.rivalLogo,
                date: formData.date,
                time: formData.time,
                stadium: formData.stadium,
                isHome: formData.isHome,
                matchStartTimestamp: matchDateTime || m.matchStartTimestamp,
              }
            : m
        )
      );
      setEditingMatch(null);
    } else {
      const newMatch: Match = {
        id: `m_${Date.now()}`,
        rival: formData.rival,
        rivalLogo: formData.rivalLogo,
        date: formData.date,
        time: formData.time,
        stadium: formData.stadium,
        isHome: formData.isHome,
        status: 'scheduled',
        scoreUs: null,
        scoreThem: null,
        scorersUs: [],
        calledUpPlayerIds: players.map((p) => p.id),
        lineup: [],
        createdAtTimestamp: Date.now(),
        matchStartTimestamp: matchDateTime || Date.now(),
      };
      setMatches((prev) => [newMatch, ...prev]);
    }

    setShowAddModal(false);
    setFormData({
      rival: '',
      rivalLogo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=150&q=80',
      date: new Date().toISOString().split('T')[0],
      time: '20:00',
      stadium: 'Cancha 1 - Polideportivo',
      isHome: true,
    });
  };

  const handleDeleteMatch = (matchId: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este partido?')) {
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    }
  };

  const handleOpenResultModal = (match: Match) => {
    setShowResultModal(match);
    setResultScoreUs(match.scoreUs ?? 0);
    setResultScoreThem(match.scoreThem ?? 0);
    setScorersList(match.scorersUs || []);
  };

  const handleAddScorer = () => {
    const pl = players.find((p) => p.id === selectedScorerPlayerId);
    if (!pl) return;
    setScorersList((prev) => [
      ...prev,
      { playerId: pl.id, playerName: pl.name, minute: scorerMinute },
    ]);
  };

  const handleRemoveScorer = (idx: number) => {
    setScorersList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveResult = () => {
    if (!showResultModal) return;
    setMatches((prev) =>
      prev.map((m) =>
        m.id === showResultModal.id
          ? {
              ...m,
              scoreUs: resultScoreUs,
              scoreThem: resultScoreThem,
              scorersUs: scorersList,
              status: 'finished',
            }
          : m
      )
    );
    setShowResultModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#141416] p-5 rounded-xl border border-white/5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-400" />
            {t.calendar.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            {t.calendar.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Pills */}
          <div className="flex bg-black/50 p-1 rounded-lg border border-white/5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filter === 'all' ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('scheduled')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filter === 'scheduled' ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Próximos
            </button>
            <button
              onClick={() => setFilter('finished')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                filter === 'finished' ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              Finalizados
            </button>
          </div>

          {/* New Match Button (Owner / Admin) */}
          {isOwnerOrAdmin && (
            <button
              id="btn-new-match"
              onClick={() => {
                setEditingMatch(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              {t.calendar.newMatch}
            </button>
          )}
        </div>
      </div>

      {/* Match Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredMatches.map((match) => {
          const mvpActive = isMvpVoteAvailable(match);
          const minutesElapsed = getMinutesElapsed(match);
          const isReminded = activeReminders.includes(match.id);

          return (
            <div
              key={match.id}
              id={`match-card-${match.id}`}
              className="relative bg-[#141416] rounded-xl border border-white/5 p-5 shadow-xl transition-all hover:border-white/10 space-y-4"
            >
              {/* Match Header: Status & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {match.status === 'live' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      {t.calendar.statusLive} ({minutesElapsed}')
                    </span>
                  ) : match.status === 'finished' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/5 text-gray-300 border border-white/10">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {t.calendar.statusFinished}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      {t.calendar.statusScheduled}
                    </span>
                  )}

                  <span className="text-xs font-medium text-gray-400">
                    {match.date} • {match.time} hrs
                  </span>
                </div>

                {/* Owner controls: Edit / Delete */}
                {isOwnerOrAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingMatch(match);
                        setFormData({
                          rival: match.rival,
                          rivalLogo: match.rivalLogo,
                          date: match.date,
                          time: match.time,
                          stadium: match.stadium,
                          isHome: match.isHome,
                        });
                        setShowAddModal(true);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                      title="Editar partido"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMatch(match.id)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-rose-400 transition-colors"
                      title="Eliminar partido"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Teams & Scoreboard Visual */}
              <div className="bg-black/50 p-4 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                {/* Our Team */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover border border-emerald-500/30 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-white truncate">
                      {team.name}
                    </h4>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                      {match.isHome ? t.calendar.local : t.calendar.visitor}
                    </span>
                  </div>
                </div>

                {/* Center Score or VS */}
                <div className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#141416] rounded-lg border border-white/10 min-w-[70px]">
                  {match.scoreUs !== null && match.scoreThem !== null ? (
                    <div className="text-xl sm:text-2xl font-black font-sport tracking-wider text-white">
                      <span className="text-emerald-400">{match.scoreUs}</span>
                      <span className="text-gray-600 mx-1">-</span>
                      <span>{match.scoreThem}</span>
                    </div>
                  ) : (
                    <div className="text-base sm:text-lg font-black font-sport tracking-widest text-gray-400">
                      VS
                    </div>
                  )}
                  <span className="text-[10px] text-gray-500 font-medium">
                    {match.time}
                  </span>
                </div>

                {/* Rival Team */}
                <div className="flex items-center justify-end gap-3 flex-1 min-w-0 text-right">
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-white truncate">
                      {match.rival}
                    </h4>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      {!match.isHome ? t.calendar.local : t.calendar.visitor}
                    </span>
                  </div>
                  <img
                    src={match.rivalLogo}
                    alt={match.rival}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover border border-white/10 shrink-0"
                  />
                </div>
              </div>

              {/* Stadium & Scorers info */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <span className="truncate">{match.stadium}</span>
                </div>

                {match.scorersUs.length > 0 && (
                  <div className="text-[11px] text-gray-300 font-medium truncate ml-2">
                    ⚽ {match.scorersUs.map((s) => `${s.playerName.split(' ')[0]} (${s.minute}')`).join(', ')}
                  </div>
                )}
              </div>

              {/* 50-Minute MVP Rule Banner if active */}
              {mvpActive ? (
                <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
                    <div>
                      <p className="text-xs font-bold text-amber-300">
                        {match.mvpPlayerName
                          ? `MVP: ${match.mvpPlayerName}`
                          : '¡Votación de MVP Abierta! (+50m transcurridos)'}
                      </p>
                      <p className="text-[10px] text-amber-200/80">
                        {match.mvpPlayerName
                          ? 'Foto oficial capturada y archivada en su perfil'
                          : 'Vota al jugador destacado y toma su foto oficial con la cámara'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleGoToMvp(match.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shrink-0 shadow-sm transition-all"
                  >
                    {match.mvpPlayerName ? 'Ver MVP' : t.calendar.voteMvp}
                  </button>
                </div>
              ) : (
                <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Votación MVP: disponible a los 50 min de partido</span>
                  <span className="font-mono text-emerald-400 font-semibold">{minutesElapsed > 0 ? `${minutesElapsed} min jugados` : 'Previa'}</span>
                </div>
              )}

              {/* Footer Quick Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {/* Push Notification Button */}
                  <button
                    id={`btn-reminder-${match.id}`}
                    onClick={() => toggleMatchReminder(match)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isReminded
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                    }`}
                  >
                    <Bell className={`w-3.5 h-3.5 ${isReminded ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                    {isReminded ? t.calendar.notified : t.calendar.notifyMe}
                  </button>

                  {/* Export PDF Button */}
                  <button
                    id={`btn-export-pdf-${match.id}`}
                    onClick={() => exportMatchToPdf(match, team, players)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium border border-white/10 transition-all"
                    title={t.calendar.exportPdf}
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                    PDF
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Jump to Convocatoria flyer */}
                  <button
                    onClick={() => onNavigateToConvocatoria(match.id)}
                    className="text-xs text-gray-400 hover:text-emerald-400 font-medium px-2 py-1"
                  >
                    Convocatoria
                  </button>

                  {/* Jump to Lineup Pitch */}
                  <button
                    onClick={() => onNavigateToLineup(match.id)}
                    className="text-xs text-gray-400 hover:text-emerald-400 font-medium px-2 py-1"
                  >
                    Alineación
                  </button>

                  {/* Owner: Record Score */}
                  {isOwnerOrAdmin && (
                    <button
                      onClick={() => handleOpenResultModal(match)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30 border border-white/10 text-xs font-bold text-gray-200 transition-all"
                    >
                      <Trophy className="w-3 h-3 text-amber-400" />
                      {t.calendar.recordResult}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Schedule / Edit Match */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141416] border border-white/10 w-full max-w-lg rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingMatch ? t.calendar.editMatch : t.calendar.newMatch}
            </h3>

            <form onSubmit={handleCreateOrUpdateMatch} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                  Nombre del Rival
                </label>
                <input
                  type="text"
                  required
                  value={formData.rival}
                  onChange={(e) => setFormData({ ...formData, rival: e.target.value })}
                  placeholder="ej. Halcones FC, Toros FC..."
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                    {t.calendar.date}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                    {t.calendar.time}
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                  {t.calendar.stadium}
                </label>
                <input
                  type="text"
                  required
                  value={formData.stadium}
                  onChange={(e) => setFormData({ ...formData, stadium: e.target.value })}
                  placeholder="Cancha 2 - Deportivo Norte"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                  Condición de Local / Visitante
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isHome: true })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      formData.isHome
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-black/50 border-white/10 text-gray-400'
                    }`}
                  >
                    {t.calendar.local} (Casa)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isHome: false })}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      !formData.isHome
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-black/50 border-white/10 text-gray-400'
                    }`}
                  >
                    {t.calendar.visitor} (Fuera)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold shadow-sm"
                >
                  {editingMatch ? 'Actualizar' : 'Programar Partido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Match Result & Scorers */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141416] border border-white/10 w-full max-w-lg rounded-xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              {t.calendar.recordResult}
            </h3>

            <div className="p-4 bg-black/50 rounded-xl border border-white/5 text-center">
              <p className="text-xs text-gray-400 mb-2">Marcador Final Oficial</p>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <span className="block text-xs font-bold text-emerald-400 truncate max-w-[100px]">
                    {team.shortName}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={resultScoreUs}
                    onChange={(e) => setResultScoreUs(parseInt(e.target.value) || 0)}
                    className="w-16 h-14 bg-[#141416] border-2 border-emerald-500 rounded-lg text-center text-2xl font-black text-white font-sport mt-1"
                  />
                </div>

                <span className="text-2xl font-black text-gray-600">-</span>

                <div className="text-center">
                  <span className="block text-xs font-bold text-gray-400 truncate max-w-[100px]">
                    {showResultModal.rival}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={resultScoreThem}
                    onChange={(e) => setResultScoreThem(parseInt(e.target.value) || 0)}
                    className="w-16 h-14 bg-[#141416] border-2 border-white/10 rounded-lg text-center text-2xl font-black text-white font-sport mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Goal Scorers Registration */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                {t.calendar.scorers} ({team.shortName})
              </label>

              <div className="flex gap-2">
                <select
                  value={selectedScorerPlayerId}
                  onChange={(e) => setSelectedScorerPlayerId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.number} {p.name} ({p.position})
                    </option>
                  ))}
                </select>

                <div className="w-24 flex items-center bg-black/50 border border-white/10 rounded-lg px-2">
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={scorerMinute}
                    onChange={(e) => setScorerMinute(parseInt(e.target.value) || 1)}
                    className="w-full bg-transparent text-white text-xs font-bold text-center focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-500 font-bold">'</span>
                </div>

                <button
                  type="button"
                  onClick={handleAddScorer}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-lg"
                >
                  + Gol
                </button>
              </div>

              {/* Scorers List */}
              <div className="space-y-1 mt-2">
                {scorersList.map((sc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-black/50 text-xs border border-white/5"
                  >
                    <span className="text-white font-medium">
                      ⚽ {sc.playerName} <span className="text-emerald-400 font-bold">({sc.minute}')</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveScorer(idx)}
                      className="text-gray-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowResultModal(null)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold border border-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveResult}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold shadow-sm"
              >
                {t.calendar.saveResult}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
