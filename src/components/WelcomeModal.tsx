import React from 'react';
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Users,
  MapPin,
  ArrowRight,
  X,
  Shield,
  Star,
} from 'lucide-react';
import { TeamInfo, TeamInvitation } from '../types';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: TeamInfo;
  invitation?: TeamInvitation | null;
  onNavigate?: (tab: string) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  team,
  invitation,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const handleAction = (tabName: string) => {
    if (onNavigate) {
      onNavigate(tabName);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-[#CED0D4] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[#050505] animate-in zoom-in-95 duration-200">
        {/* Festive Header Banner with Team Colors */}
        <div
          className="relative px-6 pt-8 pb-6 text-white text-center overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${team.primaryColor || '#1877F2'} 0%, #0866FF 100%)`,
          }}
        >
          {/* Subtle Decorative Pattern */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/35 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Shield & Badge */}
          <div className="relative inline-block mb-3">
            <img
              src={team.logoUrl}
              alt={team.name}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="w-20 h-20 rounded-2xl mx-auto object-cover ring-4 ring-white/90 shadow-2xl bg-white"
            />
            <div className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-950 p-1.5 rounded-full shadow-lg ring-2 ring-white">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black tracking-wider uppercase mb-2 border border-white/25">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>¡Invitación Aceptada con Éxito!</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight leading-tight uppercase font-sport">
            ¡Bienvenido a {team.name}!
          </h2>
          <p className="text-xs text-white/90 mt-1 max-w-sm mx-auto font-medium">
            Has confirmado tu incorporación oficial al plantel de Fútbol 7.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Official Invitation Detail Card */}
          <div className="p-4 rounded-2xl bg-[#F0F2F5] border border-[#CED0D4] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-[#65676B] tracking-wider">
                Ficha del Jugador Confirmado
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Miembro Oficial Activo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-[#65676B] block text-[10px]">Jugador:</span>
                <strong className="text-[#050505] text-sm">
                  {invitation?.playerName || 'Jugador Registrado'}
                </strong>
              </div>
              <div>
                <span className="text-[#65676B] block text-[10px]">Correo Vinculado:</span>
                <strong className="text-[#1877F2] font-mono truncate block">
                  {invitation?.email || 'Vía Invitación Oficial'}
                </strong>
              </div>
              <div>
                <span className="text-[#65676B] block text-[10px]">Liga y Modalidad:</span>
                <strong className="text-[#050505]">
                  {team.leagueName} (Fut 7)
                </strong>
              </div>
              <div>
                <span className="text-[#65676B] block text-[10px]">Rol Asignado:</span>
                <strong className="text-emerald-700 font-bold">
                  Jugador de Plantel
                </strong>
              </div>
            </div>
          </div>

          {/* Playing Venue Card with Stadium & Location */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1877F2]/10 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-5 h-5 text-[#1877F2]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1877F2] block">
                Sede y Ubicación donde jugamos
              </span>
              <h4 className="text-xs font-bold text-[#050505] mt-0.5">
                {team.stadium}
              </h4>
              <p className="text-[11px] text-[#65676B] mt-0.5 leading-snug">
                {team.location || 'Canchas Oficiales de la Liga'}
              </p>
            </div>
          </div>

          {/* Quick Start Suggestions */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#65676B] block">
              ¿Qué deseas hacer primero?
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAction('calendar')}
                className="p-3 rounded-xl bg-white hover:bg-[#F0F2F5] border border-[#CED0D4] text-left transition-all flex items-center gap-2.5 cursor-pointer shadow-xs group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#050505]">Calendario</div>
                  <div className="text-[10px] text-[#65676B] truncate">Ver partidos y horarios</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction('wall')}
                className="p-3 rounded-xl bg-white hover:bg-[#F0F2F5] border border-[#CED0D4] text-left transition-all flex items-center gap-2.5 cursor-pointer shadow-xs group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-[#1877F2] shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#050505]">Muro del Club</div>
                  <div className="text-[10px] text-[#65676B] truncate">Comentar y publicar</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#F0F2F5] border-t border-[#CED0D4] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>¡Entrar a la Cancha!</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
