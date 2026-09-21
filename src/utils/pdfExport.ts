import { jsPDF } from 'jspdf';
import { Match, TeamInfo, Player } from '../types';
import { loadCanvasImageSafe, triggerBrowserFileDownload } from './graphicPresets';

/**
 * Safely loads an image URL and converts it to a JPEG Data URL for jsPDF.
 */
async function loadImageDataUrlSafe(url?: string): Promise<string | null> {
  if (!url || typeof url !== 'string') return null;
  try {
    const img = await loadCanvasImageSafe(url);
    if (!img) return null;
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width || 200;
    canvas.height = img.naturalHeight || img.height || 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (err) {
    console.warn('Could not convert image to data URL for PDF:', err);
    return null;
  }
}

/**
 * Generates an official, comprehensive Match Report PDF ("Acta Oficial de Partido")
 * complete with team logos, full squad call-up roster (Titulares y Suplentes),
 * match scorers and events, and the official MVP Photo.
 */
export const exportMatchToPdf = async (
  match: Match,
  team: TeamInfo,
  players: Player[]
): Promise<{ blob: Blob; blobUrl: string } | null> => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Preload all assets in parallel with cascading MVP resolution
    let mvpPlayer: Player | undefined;
    if (match.mvpId) {
      mvpPlayer = players.find((p) => p.id === match.mvpId);
    }
    if (!mvpPlayer && match.mvpPlayerName) {
      mvpPlayer = players.find(
        (p) =>
          p.name.toLowerCase().trim() === match.mvpPlayerName?.toLowerCase().trim() ||
          (p.nickname && p.nickname.toLowerCase().trim() === match.mvpPlayerName?.toLowerCase().trim())
      );
    }
    if (!mvpPlayer && match.mvpVotes && Object.keys(match.mvpVotes).length > 0) {
      let topId = '';
      let maxV = -1;
      Object.entries(match.mvpVotes).forEach(([pId, v]) => {
        if (v > maxV) {
          maxV = v;
          topId = pId;
        }
      });
      if (topId) mvpPlayer = players.find((p) => p.id === topId);
    }
    if (!mvpPlayer && match.scorersUs && match.scorersUs.length > 0) {
      const topScorerItem = match.scorersUs[0];
      mvpPlayer = players.find((p) => p.id === topScorerItem.playerId || p.name === topScorerItem.playerName);
    }
    if (!mvpPlayer && players.length > 0) {
      mvpPlayer = players.find((p) => p.isStarter) || players[0];
    }

    const mvpHistoryItem = mvpPlayer?.mvpHistory?.find((h) => h.matchId === match.id);
    const mvpPhotoToLoad =
      match.mvpPhotoUrl ||
      mvpHistoryItem?.photoUrl ||
      mvpPlayer?.mvpHistory?.[0]?.photoUrl ||
      mvpPlayer?.avatarUrl ||
      '';

    const [teamLogoData, rivalLogoData, mvpPhotoData] = await Promise.all([
      loadImageDataUrlSafe(team.logoUrl),
      loadImageDataUrlSafe(match.rivalLogo),
      loadImageDataUrlSafe(mvpPhotoToLoad),
    ]);

    // 1. Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 42, 'F');

    // Header Color Accent line
    const pColorHex = team.primaryColor || '#1877F2';
    doc.setDrawColor(24, 119, 242);
    doc.setLineWidth(1.5);
    doc.line(0, 42, pageWidth, 42);

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ACTA OFICIAL DE PARTIDO', pageWidth / 2, 16, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.text(team.leagueName.toUpperCase() || 'LIGA REGIONAL OFICIAL', pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    const modalityText = match.modality === 'fut11' ? 'Fútbol 11' : match.modality === 'fut9' ? 'Fútbol 9' : match.modality === 'fut5' ? 'Fútbol 5' : 'Fútbol 7';
    doc.text(`Fecha: ${match.date}  |  Hora: ${match.time} hrs  |  Estadio: ${match.stadium}  |  Modalidad: ${modalityText}`, pageWidth / 2, 33, { align: 'center' });

    // 2. Scoreboard Container
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.roundedRect(12, 48, pageWidth - 24, 48, 3, 3, 'FD');

    // Team 1 Logo & Info (Left)
    if (teamLogoData) {
      try {
        doc.addImage(teamLogoData, 'JPEG', 18, 52, 18, 18);
      } catch {
        // Safe fallback
      }
    }
    const team1TextX = teamLogoData ? 40 : 20;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(team.name, team1TextX, 61);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(match.isHome ? 'LOCAL (CASA)' : 'VISITANTE', team1TextX, 68);

    // Team 2 Logo & Info (Right)
    if (rivalLogoData) {
      try {
        doc.addImage(rivalLogoData, 'JPEG', pageWidth - 36, 52, 18, 18);
      } catch {
        // Safe fallback
      }
    }
    const team2TextX = rivalLogoData ? pageWidth - 42 : pageWidth - 20;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(match.rival, team2TextX, 61, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(!match.isHome ? 'LOCAL (CASA)' : 'VISITANTE', team2TextX, 68, { align: 'right' });

    // Score Center Badge
    const scoreUs = match.scoreUs !== null ? String(match.scoreUs) : '-';
    const scoreThem = match.scoreThem !== null ? String(match.scoreThem) : '-';

    doc.setFillColor(16, 185, 129); // emerald-500
    doc.roundedRect(pageWidth / 2 - 25, 54, 50, 22, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(`${scoreUs}  -  ${scoreThem}`, pageWidth / 2, 69, { align: 'center' });

    // Status Line below scoreboard
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const statusLabel =
      match.status === 'finished' ? 'ENCUENTRO FINALIZADO (OFICIAL)' : match.status === 'live' ? 'EN JUEGO (EN VIVO)' : 'PARTIDO PROGRAMADO';
    doc.text(`ESTADO: ${statusLabel}`, pageWidth / 2, 88, { align: 'center' });

    let curY = 102;

    // 3. Scorers & Incidents Section (Left)
    const colWidth = (pageWidth - 30) / 2;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(12, curY, colWidth, 58, 3, 3, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('GOLEADORES E INCIDENCIAS', 17, curY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    let scorerY = curY + 17;

    if (!match.scorersUs || match.scorersUs.length === 0) {
      doc.text('Sin goles registrados para el equipo', 17, scorerY);
      scorerY += 7;
    } else {
      match.scorersUs.slice(0, 5).forEach((sc) => {
        doc.text(`⚽ ${sc.playerName} (${sc.minute}')`, 17, scorerY);
        scorerY += 6.5;
      });
    }

    // Incidents / Cards if any
    const events = match.events || [];
    const cardEvents = events.filter((e) => e.type === 'yellow_card' || e.type === 'red_card');
    if (cardEvents.length > 0) {
      cardEvents.slice(0, 2).forEach((ev) => {
        const icon = ev.type === 'yellow_card' ? '[TA]' : '[TR]';
        doc.setFontSize(8);
        doc.setTextColor(ev.type === 'yellow_card' ? 180 : 220, ev.type === 'yellow_card' ? 120 : 38, 38);
        doc.text(`${icon} ${ev.playerName || 'Jugador'} (${ev.minute}')`, 17, scorerY);
        scorerY += 5.5;
      });
    }

    // 4. Official MVP Section (Right) - WITH EMBEDDED MVP PHOTO
    const mvpColX = 12 + colWidth + 6;
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(mvpColX, curY, colWidth, 58, 3, 3, 'FD');

    doc.setTextColor(180, 83, 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('★ JUGADOR DESTACADO (MVP)', mvpColX + 5, curY + 8);

    const hasMvp = Boolean(match.mvpPlayerName || match.mvpId);
    if (hasMvp) {
      const mvpName = match.mvpPlayerName || mvpPlayer?.name || 'MVP Oficial';

      // EMBED OFFICIAL MVP PHOTO IF AVAILABLE
      if (mvpPhotoData) {
        try {
          // Draw photo container border
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(245, 158, 11);
          doc.setLineWidth(0.8);
          doc.roundedRect(mvpColX + 5, curY + 13, 24, 24, 2, 2, 'FD');

          // Embed photo
          doc.addImage(mvpPhotoData, 'JPEG', mvpColX + 6, curY + 14, 22, 22);
        } catch (e) {
          console.warn('Error rendering MVP photo in PDF:', e);
        }
      }

      const textStartX = mvpPhotoData ? mvpColX + 32 : mvpColX + 6;

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(mvpName, textStartX, curY + 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      if (mvpPlayer) {
        doc.text(`Dorsal #${mvpPlayer.number}  •  ${mvpPlayer.position}`, textStartX, curY + 26);
      } else {
        doc.text('Elegido por votación del vestuario', textStartX, curY + 26);
      }

      const votes = match.mvpVotes && match.mvpId ? match.mvpVotes[match.mvpId] || 0 : 0;
      doc.setTextColor(180, 83, 9);
      doc.setFont('helvetica', 'bold');
      doc.text(votes > 0 ? `★ ${votes} Votos recibidos` : '★ Reconocimiento Oficial', textStartX, curY + 32);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Foto y distinción archivada en TeamGol', mvpColX + 5, curY + 45);
    } else {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Votación de MVP pendiente o en proceso.', mvpColX + 6, curY + 22);
      doc.text('(Se activa a los 50 minutos de partido)', mvpColX + 6, curY + 30);
    }

    curY += 66;

    // 5. Squad Call-up Roster (PLANTILLA CONVOCADA) - FULL SQUAD DETAILS
    // Intelligent resolution: match.calledUpPlayerIds -> players.isCalledUp -> all team players
    let calledPlayers: Player[] = [];
    if (match.calledUpPlayerIds && match.calledUpPlayerIds.length > 0) {
      calledPlayers = players.filter((p) => match.calledUpPlayerIds.includes(p.id));
    }
    if (calledPlayers.length === 0) {
      const isCalledList = players.filter((p) => p.isCalledUp);
      calledPlayers = isCalledList.length > 0 ? isCalledList : [...players];
    }

    // Resolve Starters vs Subs from Lineup or isStarter property
    const lineupPlayerIds = new Set(match.lineup?.map((l) => l.playerId) || []);
    const starters = calledPlayers.filter((p) =>
      lineupPlayerIds.size > 0 ? lineupPlayerIds.has(p.id) : p.isStarter
    );
    const subs = calledPlayers.filter((p) => !starters.some((st) => st.id === p.id));

    // Calculate height needed for players
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(12, curY, pageWidth - 24, 98, 3, 3, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`PLANTILLA Y CONVOCATORIA OFICIAL (${calledPlayers.length} Jugadores Convocados)`, 17, curY + 8);

    // Titulares Section
    let listY = curY + 16;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // emerald-600
    const startersList = starters.length > 0 ? starters : calledPlayers.slice(0, 7);
    doc.text(`TITULARES (${startersList.length}):`, 17, listY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const starterNames = startersList.map((p) => `#${p.number} ${p.name} (${p.position})`).join(', ');
    const splitStarters = doc.splitTextToSize(starterNames || 'No definidos', pageWidth - 36);
    doc.text(splitStarters, 17, listY + 5);

    const starterHeight = splitStarters.length * 4.2;
    const subsY = listY + 8 + starterHeight;

    // Suplentes Section
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    const subsList = starters.length > 0 ? subs : calledPlayers.slice(7);
    doc.text(`SUPLENTES / DISPONIBLES (${subsList.length}):`, 17, subsY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const subsNames = subsList.map((p) => `#${p.number} ${p.name} (${p.position})`).join(', ');
    const splitSubs = doc.splitTextToSize(subsNames || 'Sin suplentes registrados', pageWidth - 36);
    doc.text(splitSubs, 17, subsY + 5);

    // Detailed Roster Grid: 3 columns with numbers, positions, and names
    const gridY = subsY + splitSubs.length * 4.2 + 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('DETALLE INDIVIDUAL DE DORSALES Y POSICIONES:', 17, gridY);

    const rosterColWidth = (pageWidth - 36) / 3;
    let colIdx = 0;
    let rowIdx = 0;

    calledPlayers.slice(0, 18).forEach((p, idx) => {
      colIdx = idx % 3;
      rowIdx = Math.floor(idx / 3);
      const px = 17 + colIdx * rosterColWidth;
      const py = gridY + 5 + rowIdx * 4.2;

      if (py < curY + 94) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`#${p.number}`, px, py);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const displayName = p.name.length > 18 ? p.name.slice(0, 16) + '...' : p.name;
        doc.text(`${displayName} (${p.position})`, px + 7, py);
      }
    });

    // 6. Official Signatures
    const bottomY = pageHeight - 24;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(20, bottomY, 80, bottomY);
    doc.line(pageWidth - 80, bottomY, pageWidth - 20, bottomY);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Firma Dueño / Capitán de Equipo', 50, bottomY + 4, { align: 'center' });
    doc.text('Firma Árbitro / Delegado Oficial', pageWidth - 50, bottomY + 4, { align: 'center' });

    // Footer Watermark
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `TeamGol App  •  Acta Oficial generada el ${new Date().toLocaleString()}  •  ${team.name}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );

    // Generate blob & trigger safe download
    const pdfBlob = doc.output('blob');
    const pdfBlobUrl = URL.createObjectURL(pdfBlob);
    const fileName = `Acta_${team.shortName}_vs_${match.rival.replace(/[^a-zA-Z0-9]/g, '_')}_${match.date}.pdf`;

    triggerBrowserFileDownload(pdfBlob, pdfBlobUrl, fileName);

    return { blob: pdfBlob, blobUrl: pdfBlobUrl };
  } catch (err) {
    console.error('Error generating PDF:', err);
    return null;
  }
};
