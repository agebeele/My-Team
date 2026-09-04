import { jsPDF } from 'jspdf';
import { Match, TeamInfo, Player } from '../types';

export const exportMatchToPdf = (match: Match, team: TeamInfo, players: Player[]) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Background Theme
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('ACTA OFICIAL DE PARTIDO', pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text(team.leagueName.toUpperCase(), pageWidth / 2, 27, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Fecha: ${match.date}  |  Hora: ${match.time}  |  Estadio: ${match.stadium}`, pageWidth / 2, 34, { align: 'center' });

  // Scoreboard Container
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 50, pageWidth - 30, 48, 4, 4, 'FD');

  // Teams & Score
  const scoreUs = match.scoreUs !== null ? String(match.scoreUs) : '-';
  const scoreThem = match.scoreThem !== null ? String(match.scoreThem) : '-';

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(team.name, 25, 66);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(match.isHome ? 'LOCAL (CASA)' : 'VISITANTE', 25, 74);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(match.rival, pageWidth - 25, 66, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(!match.isHome ? 'LOCAL (CASA)' : 'VISITANTE', pageWidth - 25, 74, { align: 'right' });

  // Score Badge
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(pageWidth / 2 - 28, 56, 56, 24, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(`${scoreUs}  -  ${scoreThem}`, pageWidth / 2, 72, { align: 'center' });

  // Status line
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const statusLabel = match.status === 'finished' ? 'ENCUENTRO FINALIZADO' : match.status === 'live' ? 'EN VIVO' : 'PROGRAMADO';
  doc.text(`ESTADO: ${statusLabel}`, pageWidth / 2, 92, { align: 'center' });

  let curY = 108;

  // Scorers Section
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(15, curY, (pageWidth - 35) / 2, 54, 3, 3, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GOLEADORES DEL EQUIPO', 20, curY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  let scorerY = curY + 18;
  if (match.scorersUs.length === 0) {
    doc.text('Sin anotaciones registradas', 20, scorerY);
  } else {
    match.scorersUs.forEach((sc, idx) => {
      if (idx < 5) {
        doc.text(`⚽ ${sc.playerName} (${sc.minute}')`, 20, scorerY);
        scorerY += 7;
      }
    });
  }

  // MVP Section
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(pageWidth / 2 + 2, curY, (pageWidth - 35) / 2, 54, 3, 3, 'FD');
  doc.setTextColor(180, 83, 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('★ JUGADOR DESTACADO (MVP)', pageWidth / 2 + 8, curY + 9);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  if (match.mvpPlayerName) {
    doc.setFont('helvetica', 'bold');
    doc.text(`MVP: ${match.mvpPlayerName}`, pageWidth / 2 + 8, curY + 22);
    doc.setFont('helvetica', 'normal');
    doc.text('Elegido por votación del equipo', pageWidth / 2 + 8, curY + 30);
    const votes = match.mvpVotes && match.mvpId ? match.mvpVotes[match.mvpId] || 0 : 0;
    if (votes > 0) {
      doc.text(`Votos registrados: ${votes}`, pageWidth / 2 + 8, curY + 37);
    }
    doc.text(`Foto oficial archivada en perfil`, pageWidth / 2 + 8, curY + 44);
  } else {
    doc.text('Votación de MVP pendiente o en proceso.', pageWidth / 2 + 8, curY + 22);
    doc.text('(Se activa a los 50m de juego)', pageWidth / 2 + 8, curY + 30);
  }

  curY += 64;

  // Called-up Players / Roster
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, curY, pageWidth - 30, 80, 3, 3, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PLANTILLA CONVOCADA PARA ESTE ENCUENTRO', 20, curY + 9);

  const calledPlayers = players.filter((p) => match.calledUpPlayerIds.includes(p.id));
  const starters = calledPlayers.filter((p) => p.isStarter);
  const subs = calledPlayers.filter((p) => !p.isStarter);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`TITULARES (${starters.length}):`, 20, curY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const starterNames = starters.map((p) => `#${p.number} ${p.name} (${p.position})`).join(', ');
  const splitStarters = doc.splitTextToSize(starterNames || 'No definidos', pageWidth - 45);
  doc.text(splitStarters, 20, curY + 24);

  const starterHeight = splitStarters.length * 4.5;
  const subsY = curY + 28 + starterHeight;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text(`SUPLENTES (${subs.length}):`, 20, subsY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const subsNames = subs.map((p) => `#${p.number} ${p.name} (${p.position})`).join(', ');
  const splitSubs = doc.splitTextToSize(subsNames || 'Sin suplentes', pageWidth - 45);
  doc.text(splitSubs, 20, subsY + 6);

  // Signatures line at bottom
  const bottomY = 270;
  doc.setDrawColor(203, 213, 225);
  doc.line(25, bottomY, 85, bottomY);
  doc.line(pageWidth - 85, bottomY, pageWidth - 25, bottomY);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Firma Dueño / Capitán de Equipo', 55, bottomY + 5, { align: 'center' });
  doc.text('Firma Árbitro / Comisario Liga', pageWidth - 55, bottomY + 5, { align: 'center' });

  // Footer stamp
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generado automáticamente por TeamGol App  •  ${new Date().toLocaleString()}`, pageWidth / 2, 288, { align: 'center' });

  doc.save(`Resultado_${team.shortName}_vs_${match.rival.replace(/\s+/g, '_')}_${match.date}.pdf`);
};
