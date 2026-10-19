import React, { useState } from 'react';
import { Mail, X, Check, Copy, ExternalLink, Send, Clock } from 'lucide-react';
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

  const invitationSubject = `⚽ Invitación Oficial: ¡Únete a ${team.name}! (Fútbol 7)`;
  const invitationBody = `¡Hola ${invitation.playerName}!\n\nHas sido invitado oficialmente a formar parte del plantel de ${team.name} para la ${team.leagueName} de Fútbol 7.\n\nTus datos para acceder en la app desde tu dispositivo:\n• Correo invitado: ${invitation.email}\n• Equipo: ${team.name}\n• Estadio: ${team.stadium}\n\nIngresa en la app con este correo electrónico para confirmar tu lugar en la plantilla y ver el calendario, convocatorias y alineaciones tácticas.\n\n¡Te esperamos en la cancha!\nCuerpo Técnico de ${team.name}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Asunto: ${invitationSubject}\n\n${invitationBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const mailtoLink = `mailto:${encodeURIComponent(invitation.email)}?subject=${encodeURIComponent(invitationSubject)}&body=${encodeURIComponent(invitationBody)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-[#CED0D4] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#050505] animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-[#1877F2] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight leading-none">
                Invitación Enviada por Correo
              </h3>
              <p className="text-[11px] text-white/80 mt-0.5 font-medium">
                Notificación oficial enviada al dispositivo del jugador
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

        {/* Status Notification Strip */}
        <div className="bg-blue-50 px-5 py-2.5 border-b border-blue-200 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-[#1877F2] font-bold">
            <Send className="w-3.5 h-3.5" />
            <span>Invitación Enviada con Éxito</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full shrink-0">
            <Clock className="w-3 h-3" /> Pendiente de Aceptación
          </span>
        </div>

        {/* Email Metadata Strip */}
        <div className="bg-[#F0F2F5] px-5 py-3 border-b border-[#E4E6EB] text-xs space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#65676B] w-14 shrink-0">Para:</span>
            <span className="font-mono font-bold text-[#050505] bg-white px-2 py-0.5 rounded border border-[#CED0D4] truncate">
              {invitation.email}
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
        <div className="p-5 overflow-y-auto max-h-[50vh] space-y-4 text-xs leading-relaxed text-[#050505]">
          {/* Club Letterhead Banner */}
          <div className="rounded-xl border border-[#CED0D4] p-3.5 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/50 flex items-center gap-3">
            <img
              src={team.logoUrl}
              alt={team.name}
              className="w-11 h-11 rounded-xl object-cover border border-[#1877F2]/30 shadow-xs shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="min-w-0">
              <h4 className="text-sm font-black text-[#050505] uppercase tracking-wide truncate">
                {team.name}
              </h4>
              <p className="text-[11px] font-bold text-[#1877F2]">
                {team.leagueName} • Fútbol 7 Oficial
              </p>
              <p className="text-[10px] text-[#65676B] mt-0.5">
                Sede: {team.stadium} {team.location ? `(${team.location})` : ''}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs">
              <p className="font-bold">📱 Pasos para el jugador invitado:</p>
              <p className="text-[11px] text-amber-800 mt-1">
                La invitación llegará al correo del jugador. Cuando abra la app en su dispositivo e inicie sesión o se registre con el correo <strong>{invitation.email}</strong>, quedará integrado a la plantilla de <strong>{team.name}</strong>.
              </p>
            </div>

            <p className="text-sm font-bold text-[#050505]">
              Mensaje enviado a <span className="text-[#1877F2]">{invitation.playerName}</span>:
            </p>

            <div className="bg-[#F0F2F5] p-3 rounded-xl border border-[#CED0D4] space-y-1.5 font-medium">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#65676B]">Correo Destino:</span>{' '}
                  <strong className="text-[#050505] font-mono">{invitation.email}</strong>
                </div>
                <div>
                  <span className="text-[#65676B]">Rol:</span>{' '}
                  <strong className="text-[#1877F2]">Jugador Oficial</strong>
                </div>
                <div>
                  <span className="text-[#65676B]">Equipo:</span>{' '}
                  <strong className="text-[#050505]">{team.name}</strong>
                </div>
                <div>
                  <span className="text-[#65676B]">Liga:</span>{' '}
                  <strong className="text-[#050505]">{team.leagueName}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#F0F2F5] px-5 py-3 border-t border-[#CED0D4] flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#E4E6EB] text-[#050505] border border-[#CED0D4] font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Correo'}</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <a
              href={mailtoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-[#E4E6EB] text-[#1877F2] border border-[#1877F2]/30 font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Gestor de Correo</span>
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
