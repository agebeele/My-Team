import React, { useState } from 'react';
import {
  User,
  Trophy,
  Award,
  Calendar,
  Flame,
  Shield,
  Star,
  Camera,
  Edit2,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { Player, TeamInfo, AppUser, Language } from '../types';
import { getT } from '../utils/translations';

interface PlayerProfileViewProps {
  player: Player;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  team: TeamInfo;
  currentUser: AppUser;
  language: Language;
  onBack?: () => void;
}

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({
  player,
  setPlayers,
  team,
  currentUser,
  language,
  onBack,
}) => {
  const t = getT(language);
  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';
  const isSelf = currentUser.playerId === player.id;
  const canEdit = isOwnerOrAdmin || isSelf;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: player.name,
    nickname: player.nickname || '',
    number: player.number,
    avatarUrl: player.avatarUrl,
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === player.id
          ? {
              ...p,
              name: formData.name,
              nickname: formData.nickname || undefined,
              number: Number(formData.number),
              avatarUrl: formData.avatarUrl,
            }
          : p
      )
    );
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button if navigates from list */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al listado
        </button>
      )}

      {/* Main Profile Header Card */}
      <div className="relative bg-[#141416] rounded-xl border border-white/5 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar & Number Badge */}
          <div className="relative shrink-0">
            <img
              src={player.avatarUrl}
              alt={player.name}
              referrerPolicy="no-referrer"
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl object-cover ring-2 ring-emerald-500/30 shadow-lg"
            />
            <span className="absolute -bottom-2 -right-2 w-9 h-9 rounded-lg bg-emerald-500 text-black font-mono font-bold text-base flex items-center justify-center shadow-lg border-2 border-[#141416]">
              #{player.number}
            </span>
          </div>

          {/* Info Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider inline-block mb-1.5">
                  {player.position === 'POR'
                    ? 'Portero'
                    : player.position === 'DEF'
                    ? 'Defensa'
                    : player.position === 'MED'
                    ? 'Mediocampista'
                    : 'Delantero'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {player.name}
                </h1>
                {player.nickname && (
                  <p className="text-sm font-semibold text-amber-400">
                    "{player.nickname}"
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {team.name} • {team.leagueName}
                </p>
              </div>

              {canEdit && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-semibold self-center sm:self-start transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                  {isEditing ? 'Cancelar' : 'Editar Datos'}
                </button>
              )}
            </div>

            {/* Quick Stat Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-center">
                <span className="text-xl font-black font-sport text-white block">
                  {player.goals}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {t.playerProfile.goals}
                </span>
              </div>

              <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-center">
                <span className="text-xl font-black font-sport text-emerald-400 block">
                  {player.assists}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {t.playerProfile.assists}
                </span>
              </div>

              <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-center">
                <span className="text-xl font-black font-sport text-gray-200 block">
                  {player.matches}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {t.playerProfile.matches}
                </span>
              </div>

              <div className="bg-black/40 p-3 rounded-lg border border-white/5 text-center">
                <span className="text-xl font-black font-sport text-amber-400 block">
                  {player.mvpHistory?.length || 0}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {t.playerProfile.mvpAwards}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Inline Edit Form */}
        {isEditing && (
          <form
            onSubmit={handleSaveProfile}
            className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                Nombre
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                Apodo
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                Número
              </label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-bold"
              >
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Trophy Cabinet: Saved MVP Photos with Date & Rival */}
      <div className="bg-[#141416] rounded-xl border border-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              {t.mvp.trophyCabinet}
            </h3>
            <p className="text-xs text-gray-400">
              Fotos conmemorativas automáticas de partidos ganados como MVP
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
            {player.mvpHistory?.length || 0} Premios
          </span>
        </div>

        {(!player.mvpHistory || player.mvpHistory.length === 0) ? (
          <div className="p-8 text-center bg-black/40 rounded-lg border border-white/5 space-y-2">
            <Award className="w-10 h-10 text-gray-600 mx-auto" />
            <h4 className="text-sm font-bold text-gray-400">
              Aún no cuenta con fotos conmemorativas MVP
            </h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Al finalizar cada partido y ser votado como el jugador destacado, la cámara capturará automáticamente su foto y la guardará aquí.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {player.mvpHistory.map((rec) => (
              <div
                key={rec.id}
                className="bg-black/40 rounded-lg border border-white/5 overflow-hidden group hover:border-amber-500/40 transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={rec.photoUrl}
                    alt={`MVP vs ${rec.rival}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-400 text-black font-bold text-[10px] uppercase flex items-center gap-1 shadow-md">
                    <Star className="w-3 h-3 fill-black" />
                    OFICIAL MVP
                  </div>
                </div>

                <div className="p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white uppercase truncate">
                      vs {rec.rival}
                    </span>
                    <span className="font-mono text-amber-400 font-bold text-[11px]">
                      {rec.votesCount} votos
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span>{rec.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
