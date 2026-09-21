import { Match, TeamInfo, Player } from '../types';
import {
  loadCanvasImageSafe,
  downloadCanvasOrBlob,
  CanvasExportResult,
  STADIUM_BACKGROUND_PRESETS,
} from './graphicPresets';

/**
 * Draws a rounded rectangle path on canvas with native fallback
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof (ctx as any).roundRect === 'function') {
    ctx.beginPath();
    (ctx as any).roundRect(x, y, w, h, r);
    return;
  }
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Generates an ultra-high-definition (1080 x 1350 px) official match flyer graphic.
 * Includes club logo, rival logo, high-impact stadium backdrop, score/status,
 * goal scorers with minute, and official MVP spotlight with player photo.
 */
export async function generateMatchPosterCanvas(
  match: Match,
  team: TeamInfo,
  players: Player[]
): Promise<CanvasExportResult | null> {
  const width = 1080;
  const height = 1540;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const primaryColor = team.primaryColor || '#1877F2';
  const secondaryColor = team.secondaryColor || '#0866FF';

  // 1. Draw Deep Stadium Background
  ctx.fillStyle = '#0B0F19';
  ctx.fillRect(0, 0, width, height);

  const stadiumBgUrl = team.bannerUrl || STADIUM_BACKGROUND_PRESETS[0].url;
  const bgImg = await loadCanvasImageSafe(stadiumBgUrl);
  if (bgImg) {
    ctx.save();
    ctx.globalAlpha = 0.42;
    // Cover scale
    const hRatio = width / bgImg.width;
    const vRatio = height / bgImg.height;
    const ratio = Math.max(hRatio, vRatio);
    const centerShiftX = (width - bgImg.width * ratio) / 2;
    const centerShiftY = (height - bgImg.height * ratio) / 2;
    ctx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height, centerShiftX, centerShiftY, bgImg.width * ratio, bgImg.height * ratio);
    ctx.restore();
  }

  // 2. Dark Vignette & Gradient Overlays
  const vigGrad = ctx.createRadialGradient(width / 2, height / 2, 200, width / 2, height / 2, 850);
  vigGrad.addColorStop(0, 'rgba(11, 15, 25, 0.45)');
  vigGrad.addColorStop(0.7, 'rgba(11, 15, 25, 0.88)');
  vigGrad.addColorStop(1, 'rgba(5, 7, 12, 0.98)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, width, height);

  // Top header color accent band
  const topGrad = ctx.createLinearGradient(0, 0, width, 0);
  topGrad.addColorStop(0, primaryColor);
  topGrad.addColorStop(0.5, secondaryColor);
  topGrad.addColorStop(1, primaryColor);
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, 14);

  // 3. Header: League & Match Metadata
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 24px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText(team.leagueName.toUpperCase() || 'LIGA OFICIAL', width / 2, 65);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '700 16px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '1px';
  const modalityLabel = match.modality === 'fut11' ? 'FÚTBOL 11' : match.modality === 'fut9' ? 'FÚTBOL 9' : match.modality === 'fut5' ? 'FÚTBOL 5' : 'FÚTBOL 7';
  ctx.fillText(`★ ACTA Y RESULTADO OFICIAL  •  ${modalityLabel} ★`, width / 2, 95);

  // Date, Time & Stadium Pill
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  roundRect(ctx, width / 2 - 320, 115, 640, 44, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillText(`📅 ${match.date}   •   ⏰ ${match.time} hrs   •   🏟️ ${match.stadium}`, width / 2, 143);

  // 4. Matchup Scoreboard Container
  const scoreBoxY = 185;
  const scoreBoxH = 340;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  roundRect(ctx, 50, scoreBoxY, width - 100, scoreBoxH, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Team 1 (Us)
  const homeX = 220;
  const awayX = width - 220;

  // Draw Team Logo (Left)
  const teamLogoImg = await loadCanvasImageSafe(team.logoUrl);
  ctx.save();
  ctx.beginPath();
  ctx.arc(homeX, scoreBoxY + 110, 65, 0, Math.PI * 2);
  ctx.fillStyle = '#1E293B';
  ctx.fill();
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.clip();
  if (teamLogoImg) {
    ctx.drawImage(teamLogoImg, homeX - 65, scoreBoxY + 45, 130, 130);
  } else {
    ctx.fillStyle = primaryColor;
    ctx.fillRect(homeX - 65, scoreBoxY + 45, 130, 130);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(team.shortName.slice(0, 3).toUpperCase(), homeX, scoreBoxY + 122);
  }
  ctx.restore();

  // Team 1 Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 24px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(team.name, homeX, scoreBoxY + 215);

  ctx.fillStyle = match.isHome ? '#34D399' : '#94A3B8';
  ctx.font = '800 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(match.isHome ? 'LOCAL (CASA)' : 'VISITANTE', homeX, scoreBoxY + 240);

  // Rival Logo (Right)
  const rivalLogoImg = await loadCanvasImageSafe(match.rivalLogo);
  ctx.save();
  ctx.beginPath();
  ctx.arc(awayX, scoreBoxY + 110, 65, 0, Math.PI * 2);
  ctx.fillStyle = '#1E293B';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.clip();
  if (rivalLogoImg) {
    ctx.drawImage(rivalLogoImg, awayX - 65, scoreBoxY + 45, 130, 130);
  } else {
    ctx.fillStyle = '#334155';
    ctx.fillRect(awayX - 65, scoreBoxY + 45, 130, 130);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(match.rival.slice(0, 3).toUpperCase(), awayX, scoreBoxY + 122);
  }
  ctx.restore();

  // Rival Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 24px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(match.rival, awayX, scoreBoxY + 215);

  ctx.fillStyle = !match.isHome ? '#34D399' : '#94A3B8';
  ctx.font = '800 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(!match.isHome ? 'LOCAL (CASA)' : 'VISITANTE', awayX, scoreBoxY + 240);

  // Center Score Display
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';
  const scoreUs = match.scoreUs ?? 0;
  const scoreThem = match.scoreThem ?? 0;

  if (isFinished || isLive) {
    // Score Badge Container
    const scorePillGrad = ctx.createLinearGradient(width / 2 - 110, scoreBoxY + 70, width / 2 + 110, scoreBoxY + 160);
    scorePillGrad.addColorStop(0, '#0284C7');
    scorePillGrad.addColorStop(1, '#1E40AF');
    ctx.fillStyle = scorePillGrad;
    roundRect(ctx, width / 2 - 110, scoreBoxY + 70, 220, 95, 20);
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 58px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${scoreUs} - ${scoreThem}`, width / 2, scoreBoxY + 140);

    // Status label below score
    const statusText = isFinished ? 'FINALIZADO' : 'EN VIVO';
    const statusBg = isFinished ? '#10B981' : '#E11D48';
    ctx.fillStyle = statusBg;
    roundRect(ctx, width / 2 - 75, scoreBoxY + 180, 150, 32, 16);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 13px system-ui, -apple-system, sans-serif';
    ctx.fillText(statusText, width / 2, scoreBoxY + 201);
  } else {
    // Scheduled match: VS
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    roundRect(ctx, width / 2 - 60, scoreBoxY + 80, 120, 75, 20);
    ctx.fill();

    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 42px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VS', width / 2, scoreBoxY + 135);

    ctx.fillStyle = '#38BDF8';
    roundRect(ctx, width / 2 - 80, scoreBoxY + 175, 160, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = '900 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('PRÓXIMO ENCUENTRO', width / 2, scoreBoxY + 195);
  }

  // 5. Middle Section: Scorers & Events (Left) & MVP Spotlight (Right)
  const midY = 550;
  const colW = (width - 130) / 2;
  const midH = 410;

  // Scorers Box (Left)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  roundRect(ctx, 50, midY, colW, midH, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Scorers Header
  ctx.fillStyle = primaryColor;
  roundRect(ctx, 50, midY, colW, 48, 24);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 15px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('⚽ GOLEADORES E INCIDENCIAS', 75, midY + 30);

  let scY = midY + 75;
  if (match.scorersUs && match.scorersUs.length > 0) {
    match.scorersUs.slice(0, 5).forEach((sc) => {
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillText(`⚽ ${sc.playerName}`, 75, scY);

      ctx.fillStyle = '#38BDF8';
      ctx.font = '900 15px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${sc.minute}'`, 50 + colW - 25, scY);
      ctx.textAlign = 'left';

      if (sc.assistPlayerName) {
        ctx.fillStyle = '#94A3B8';
        ctx.font = 'italic 12px system-ui, -apple-system, sans-serif';
        ctx.fillText(`   Asistencia: ${sc.assistPlayerName}`, 75, scY + 18);
        scY += 42;
      } else {
        scY += 34;
      }
    });
  } else {
    ctx.fillStyle = '#64748B';
    ctx.font = 'italic 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('Sin anotaciones registradas', 75, scY + 25);
    scY += 45;
  }

  // Cards summary if any
  const yellowEvents = match.events?.filter((e) => e.type === 'yellow_card' && e.team === 'us') || [];
  const redEvents = match.events?.filter((e) => e.type === 'red_card' && e.team === 'us') || [];
  if (yellowEvents.length > 0 || redEvents.length > 0) {
    ctx.fillStyle = '#CBD5E1';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    let cardsText = 'Tarjetas: ';
    if (yellowEvents.length > 0) cardsText += `🟨 ${yellowEvents.map((y) => `${y.playerName?.split(' ')[0]} (${y.minute}')`).join(', ')}  `;
    if (redEvents.length > 0) cardsText += `🟥 ${redEvents.map((r) => `${r.playerName?.split(' ')[0]} (${r.minute}')`).join(', ')}`;
    ctx.fillText(cardsText.slice(0, 48), 75, midY + midH - 20);
  }

  // ----------------------------------------------------
  // MVP Spotlight Box (Right) - ROBUST RESOLUTION
  // ----------------------------------------------------
  const mvpX = 50 + colW + 30;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  roundRect(ctx, mvpX, midY, colW, midH, 24);
  ctx.fill();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // MVP Header Banner
  const mvpGrad = ctx.createLinearGradient(mvpX, midY, mvpX + colW, midY);
  mvpGrad.addColorStop(0, '#D97706');
  mvpGrad.addColorStop(1, '#F59E0B');
  ctx.fillStyle = mvpGrad;
  roundRect(ctx, mvpX, midY, colW, 48, 24);
  ctx.fill();
  // Title based on match status
  const isMatchFinished = match.status === 'finished' || (match.scoreUs !== null && match.scoreThem !== null);
  const isMatchLive = match.status === 'live';
  const mvpTitle = isMatchFinished
    ? '★ JUGADOR DEL PARTIDO (MVP) ★'
    : isMatchLive
    ? '★ FIGURA DESTACADA EN VIVO ★'
    : '★ JUGADOR A SEGUIR ★';

  ctx.fillStyle = '#000000';
  ctx.font = '900 15px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(mvpTitle, mvpX + colW / 2, midY + 30);

  // 1. Resolve MVP Player with cascading fallbacks
  let mvpPlayer: Player | undefined;
  if (match.mvpId) {
    mvpPlayer = players.find((p) => p.id === match.mvpId);
  }
  if (!mvpPlayer && match.mvpPlayerName) {
    mvpPlayer = players.find(
      (p) =>
        p.name.trim().toLowerCase() === match.mvpPlayerName?.trim().toLowerCase() ||
        (p.nickname && p.nickname.trim().toLowerCase() === match.mvpPlayerName?.trim().toLowerCase())
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
    if (topId) {
      mvpPlayer = players.find((p) => p.id === topId);
    }
  }
  if (!mvpPlayer && match.scorersUs && match.scorersUs.length > 0) {
    const topScorerItem = match.scorersUs[0];
    mvpPlayer = players.find((p) => p.id === topScorerItem.playerId || p.name === topScorerItem.playerName);
  }
  if (!mvpPlayer && players.length > 0) {
    mvpPlayer = players.find((p) => p.isStarter) || players[0];
  }

  // 2. Resolve MVP Photo with multiple cascading locations
  const mvpHistoryItem = mvpPlayer?.mvpHistory?.find((h) => h.matchId === match.id);
  const mvpPhotoCandidate =
    match.mvpPhotoUrl ||
    mvpHistoryItem?.photoUrl ||
    mvpPlayer?.mvpHistory?.[0]?.photoUrl ||
    mvpPlayer?.avatarUrl ||
    '';

  const mvpImgCenterX = mvpX + colW / 2;
  const mvpImgCenterY = midY + 155;
  const mvpRadius = 68;

  // Load and Draw MVP Photo
  const mvpImg = await loadCanvasImageSafe(mvpPhotoCandidate);
  ctx.save();
  ctx.beginPath();
  ctx.arc(mvpImgCenterX, mvpImgCenterY, mvpRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#1E293B';
  ctx.fill();
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.clip();

  if (mvpImg) {
    // Cover scale inside circle
    const iRatio = Math.max((mvpRadius * 2) / mvpImg.width, (mvpRadius * 2) / mvpImg.height);
    const iW = mvpImg.width * iRatio;
    const iH = mvpImg.height * iRatio;
    const iX = mvpImgCenterX - iW / 2;
    const iY = mvpImgCenterY - iH / 2;
    ctx.drawImage(mvpImg, iX, iY, iW, iH);
  } else {
    // High-definition stylized MVP Soccer Shield Avatar with initials and jersey
    const avatarGrad = ctx.createLinearGradient(
      mvpImgCenterX - mvpRadius,
      mvpImgCenterY - mvpRadius,
      mvpImgCenterX + mvpRadius,
      mvpImgCenterY + mvpRadius
    );
    avatarGrad.addColorStop(0, '#1E293B');
    avatarGrad.addColorStop(0.5, '#0F172A');
    avatarGrad.addColorStop(1, '#0284C7');
    ctx.fillStyle = avatarGrad;
    ctx.fillRect(mvpImgCenterX - mvpRadius, mvpImgCenterY - mvpRadius, mvpRadius * 2, mvpRadius * 2);

    // Inner jersey glow
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(mvpImgCenterX, mvpImgCenterY - 12, 28, 0, Math.PI * 2);
    ctx.fill();

    // Player initials or dorsal
    const initials = mvpPlayer?.name
      ? mvpPlayer.name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
      : `#${mvpPlayer?.number || '10'}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(initials, mvpImgCenterX, mvpImgCenterY - 4);

    // Dorsal banner at bottom of circle
    ctx.fillStyle = '#F59E0B';
    roundRect(ctx, mvpImgCenterX - 34, mvpImgCenterY + 22, 68, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = '900 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`#${mvpPlayer?.number || '10'}`, mvpImgCenterX, mvpImgCenterY + 39);
  }
  ctx.restore();

  // Golden Laurels / Badge indicator
  ctx.fillStyle = '#F59E0B';
  roundRect(ctx, mvpImgCenterX - 75, mvpImgCenterY + mvpRadius - 14, 150, 26, 13);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.font = '900 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isFinished ? '★ MVP OFICIAL ★' : '★ DESTACADO ★', mvpImgCenterX, mvpImgCenterY + mvpRadius + 3);

  // MVP Details
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 22px system-ui, -apple-system, sans-serif';
  const mvpName = match.mvpPlayerName || mvpPlayer?.name || 'Jugador Destacado';
  ctx.fillText(mvpName, mvpImgCenterX, midY + 268);

  ctx.fillStyle = '#F59E0B';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  const mvpPos = mvpPlayer ? `#${mvpPlayer.number}  •  ${mvpPlayer.position}${mvpPlayer.nickname ? `  "${mvpPlayer.nickname}"` : ''}` : 'Elegido por el vestuario';
  ctx.fillText(mvpPos, mvpImgCenterX, midY + 296);

  const votes = match.mvpVotes && (mvpPlayer?.id || match.mvpId)
    ? match.mvpVotes[mvpPlayer?.id || match.mvpId || ''] || 0
    : 0;

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  if (votes > 0) {
    ctx.fillText(`🏆 ${votes} votos recibidos del vestuario`, mvpImgCenterX, midY + 332);
  } else {
    ctx.fillText('🏅 Reconocimiento Oficial TeamGol', mvpImgCenterX, midY + 332);
  }

  // ----------------------------------------------------
  // 6. Bottom Squad Call-up ("Plantilla Convocada")
  // ----------------------------------------------------
  const botY = 980;
  const botH = 500;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  roundRect(ctx, 50, botY, width - 100, botH, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Intelligent resolution of called players
  let calledPlayers: Player[] = [];
  if (match.calledUpPlayerIds && match.calledUpPlayerIds.length > 0) {
    calledPlayers = players.filter((p) => match.calledUpPlayerIds.includes(p.id));
  }
  if (calledPlayers.length === 0) {
    calledPlayers = players.filter((p) => p.isCalledUp);
  }
  if (calledPlayers.length === 0) {
    calledPlayers = [...players];
  }

  // Separate into Starters vs Substitutes
  const lineupIds = new Set(match.lineup?.map((l) => l.playerId) || []);
  const starters = calledPlayers.filter((p) =>
    lineupIds.size > 0 ? lineupIds.has(p.id) : p.isStarter
  );
  const expectedStartersCount = match.modality === 'fut11' ? 11 : match.modality === 'fut9' ? 9 : match.modality === 'fut5' ? 5 : 7;
  const finalStarters = starters.length > 0 ? starters : calledPlayers.slice(0, expectedStartersCount);
  const starterIdsSet = new Set(finalStarters.map((p) => p.id));
  let finalSubs = calledPlayers.filter((p) => !starterIdsSet.has(p.id));

  // If no subs in called list, pull remaining players from team roster
  if (finalSubs.length === 0 && players.length > finalStarters.length) {
    finalSubs = players.filter((p) => !starterIdsSet.has(p.id));
  }

  // Top Squad Header
  const squadBannerGrad = ctx.createLinearGradient(50, botY, width - 50, botY);
  squadBannerGrad.addColorStop(0, '#0284C7');
  squadBannerGrad.addColorStop(1, '#0F172A');
  ctx.fillStyle = squadBannerGrad;
  roundRect(ctx, 50, botY, width - 100, 48, 24);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 16px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`📋 CONVOCATORIA Y PLANTILLA OFICIAL (${finalStarters.length + finalSubs.length} Jugadores)`, 80, botY + 30);

  // Position Pill Color helper
  const getPosColor = (pos: string) => {
    if (!pos) return { bg: '#E2E8F0', text: '#334155' };
    const pUpper = pos.toUpperCase();
    if (['POR', 'GK'].includes(pUpper)) return { bg: '#FEF3C7', text: '#92400E' };
    if (['DEF', 'CB', 'LB', 'RB', 'CEN', 'LAT', 'CAR', 'DFC', 'LI', 'LD'].includes(pUpper)) return { bg: '#E0F2FE', text: '#0369A1' };
    if (['MED', 'CM', 'CDM', 'CAM', 'MCD', 'MCO', 'MI', 'MD', 'MC'].includes(pUpper)) return { bg: '#D1FAE5', text: '#065F46' };
    return { bg: '#FFE4E6', text: '#BE123C' };
  };

  // 6A. Sub-Header: TITULARES
  ctx.fillStyle = '#10B981';
  roundRect(ctx, 75, botY + 65, 230, 28, 14);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(`★ TITULARES (${finalStarters.length})`, 95, botY + 84);

  // Grid for Starters (up to 2 rows of 4 columns)
  let row = 0;
  let col = 0;
  finalStarters.slice(0, 11).forEach((p) => {
    const colX = 75 + col * 230;
    const itemY = botY + 105 + row * 40;

    // Dorsal chip
    ctx.fillStyle = '#1E293B';
    roundRect(ctx, colX, itemY, 32, 30, 8);
    ctx.fill();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${p.number}`, colX + 16, itemY + 20);

    // Player Name
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 13.5px system-ui, -apple-system, sans-serif';
    const nameDisplay = p.name.length > 12 ? `${p.name.slice(0, 11)}.` : p.name;
    ctx.fillText(nameDisplay, colX + 38, itemY + 20);

    // Position Pill
    const posStyling = getPosColor(p.position);
    ctx.fillStyle = posStyling.bg;
    roundRect(ctx, colX + 165, itemY + 6, 48, 20, 6);
    ctx.fill();
    ctx.fillStyle = posStyling.text;
    ctx.font = '900 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(p.position || 'JUG', colX + 189, itemY + 20);

    col++;
    if (col >= 4) {
      col = 0;
      row++;
    }
  });

  // Divider line
  const dividerY = botY + 245;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(75, dividerY);
  ctx.lineTo(width - 75, dividerY);
  ctx.stroke();

  // 6B. Sub-Header: SUPLENTES Y DISPONIBLES
  ctx.fillStyle = '#38BDF8';
  roundRect(ctx, 75, dividerY + 15, 260, 28, 14);
  ctx.fill();
  ctx.fillStyle = '#0F172A';
  ctx.font = '900 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`🔄 SUPLENTES / BANCA (${finalSubs.length})`, 95, dividerY + 34);

  // Grid for Substitutes
  if (finalSubs.length > 0) {
    let sRow = 0;
    let sCol = 0;
    finalSubs.slice(0, 12).forEach((p) => {
      const colX = 75 + sCol * 230;
      const itemY = dividerY + 55 + sRow * 40;

      // Dorsal chip
      ctx.fillStyle = '#1E293B';
      roundRect(ctx, colX, itemY, 32, 30, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = '900 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${p.number}`, colX + 16, itemY + 20);

      // Player Name
      ctx.textAlign = 'left';
      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 13.5px system-ui, -apple-system, sans-serif';
      const nameDisplay = p.name.length > 12 ? `${p.name.slice(0, 11)}.` : p.name;
      ctx.fillText(nameDisplay, colX + 38, itemY + 20);

      // Position Pill
      const posStyling = getPosColor(p.position);
      ctx.fillStyle = posStyling.bg;
      roundRect(ctx, colX + 165, itemY + 6, 48, 20, 6);
      ctx.fill();
      ctx.fillStyle = posStyling.text;
      ctx.font = '900 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.position || 'SUPL', colX + 189, itemY + 20);

      sCol++;
      if (sCol >= 4) {
        sCol = 0;
        sRow++;
      }
    });
  } else {
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'italic 14px system-ui, -apple-system, sans-serif';
    ctx.fillText('Todos los jugadores convocados están listados en la formación inicial', 75, dividerY + 75);
  }

  // Footer line: Watermark & branding
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Diseñado en TeamGol App  •  ${team.name}  •  ${new Date().toLocaleDateString()}`, width / 2, height - 20);

  // Export as PNG
  const fileName = `Partido_${team.shortName}_vs_${match.rival.replace(/[^a-zA-Z0-9]/g, '_')}_${match.date}.png`;
  return await downloadCanvasOrBlob(canvas, fileName);
}
