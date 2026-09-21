import React, { useState } from 'react';
import { Mail, X, Check, Copy, ExternalLink, Shield, Send, Sparkles } from 'lucide-react';
import { TeamInfo, TeamInvitation } from '../types';

interface EmailInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: TeamInvitation | null;
  team: TeamInfo;
}

export const EmailInvitationModal: React.FC<EmailInvitationModalProps> = ({
  isOpen,
  onClose,
  invitation,
  team,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !invitation) return null;

  const invitationSubject = `⚽ Invitación Oficial: ¡Bienvenido a ${team.name}! (Fútbol 7)`;
  const invitationBody = `¡Hola ${invitation.playerName}!\n\nHas sido registrado oficialmente en el plantel de ${team.name} para la ${team.leagueName} de Fútbol 7.\n\nTus datos de acceso al equipo:\n• Correo: ${invitation.email}\n• Rol: Jugador Oficial\n• Estadio: ${team.stadium}\n\nAccede a la app para ver el calendario de partidos, convocatorias y alineaciones tácticas.\n\n¡Vamos por la victoria!\nCuerpo Técnico de ${team.name}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Asunto: ${invitationSubject}\n\n${invitationBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const mailtoLink = `mailto:${encodeURIComponent(invitation.email)}?subject=${encodeURIComponent(invitationSubject)}&body=${encodeURIComponent(invitationBody)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-[#CED0D4] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#050505] animate-in zoom-in-95 duration-200">
        {/* Top Simulated Email Window Bar */}
        <div className="bg-[#1877F2] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight leading-none">
                Invitación Enviada al Correo
              </h3>
              <p className="text-[11px] text-white/80 mt-0.5 font-medium">
                Notificación oficial de incorporación al equipo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Email Metadata Strip */}
        <div className="bg-[#F0F2F5] px-5 py-3 border-b border-[#E4E6EB] text-xs space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#65676B] w-14 shrink-0">Para:</span>
            <span className="font-mono font-bold text-[#050505] bg-white px-2 py-0.5 rounded border border-[#CED0D4] truncate">
              {invitation.email}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full ml-auto shrink-0">
              <Send className="w-2.5 h-2.5" /> Enviado
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#65676B] w-14 shrink-0">De:</span>
            <span className="text-[#050505] font-semibold truncate">
              Cuerpo Técnico {team.name} &lt;club@{team.shortName.toLowerCase().replace(/\s+/g, '')}.com&gt;
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#65676B] w-14 shrink-0">Asunto:</span>
            <span className="font-bold text-[#1877F2] truncate">
              {invitationSubject}
            </span>
          </div>
        </div>

        {/* Email Content Body Preview */}
        <div className="p-5 overflow-y-auto max-h-[55vh] space-y-4 text-xs leading-relaxed text-[#050505]">
          {/* Club Letterhead Banner */}
          <div className="rounded-xl border border-[#CED0D4] p-4 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/50 flex items-center gap-3.5">
            <img
              src={team.logoUrl}
              alt={team.name}
              className="w-12 h-12 rounded-xl object-cover border border-[#1877F2]/30 shadow-xs shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="min-w-0">
              <h4 className="text-base font-black text-[#050505] uppercase tracking-wide truncate">
                {team.name}
              </h4>
              <p className="text-[11px] font-bold text-[#1877F2]">
                {team.leagueName} • Modalidad Fútbol 7 Oficial
              </p>
              <p className="text-[10px] text-[#65676B] mt-0.5">
                Sede: {team.stadium}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-bold text-[#050505]">
              ¡Hola <span className="text-[#1877F2]">{invitation.playerName}</span>!
            </p>
            <p className="text-[#404040]">
              Te informamos que tu cuenta ha sido creada exitosamente y has sido dado de alta como <strong>Jugador Oficial</strong> en el plantel de <strong>{team.name}</strong>.
            </p>

            <div className="bg-[#F0F2F5] p-3.5 rounded-xl border border-[#CED0D4] space-y-1.5 font-medium">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#65676B] block">
                Tus credenciales y datos del equipo:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#65676B]">Correo / Usuario:</span>{' '}
                  <strong className="text-[#050505] font-mono">{invitation.email}</strong>
                </div>
                <div>
                  <span className="text-[#65676B]">Rol:</span>{' '}
                  <strong className="text-[#1877F2]">Jugador del Club</strong>
                </div>
                <div>
                  <span className="text-[#65676B]">Equipo:</span>{' '}
                  <strong className="text-[#050505]">{team.name}</strong>
                </div>
                <div>
                  <span className="text-[#65676B]">Modalidad:</span>{' '}
                  <strong className="text-[#050505]">Fútbol 7 (7v7)</strong>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-[#050505]">
                Con tu cuenta de jugador puedes:
              </p>
              <ul className="space-y-1 text-[#404040] pl-1">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Consultar los partidos programados y activar recordatorios en tu calendario.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Ver la convocatoria oficial de jugadores para cada jornada.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Consultar la alineación táctica 7v7 y guardar las fotos de cada encuentro.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Revisar la tabla general de posiciones y tabla de goleadores.</span>
                </li>
              </ul>
            </div>

            <p className="text-[11px] text-[#65676B] italic pt-1">
              ¡Bienvenido al equipo y vamos con todo por el campeonato!
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#F0F2F5] px-5 py-3 border-t border-[#CED0D4] flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#E4E6EB] text-[#050505] border border-[#CED0D4] font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado al portapapeles!' : 'Copiar Texto del Correo'}</span>
          </button>

          <div className="flex items-center gap-2">
            <a
              href={mailtoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-[#E4E6EB] text-[#1877F2] border border-[#1877F2]/30 font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir en Cliente de Correo</span>
            </a>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1877F2] hover:bg-[#0866FF] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
