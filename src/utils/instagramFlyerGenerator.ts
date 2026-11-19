import { Match, Player, TeamInfo } from '../types';
import { STADIUM_BACKGROUND_PRESETS, loadCanvasImageSafe } from './graphicPresets';

export type FlyerFormat = 'story' | 'post';
export type FlyerMode = 'matchday' | 'result' | 'fan_mvp';

export interface RenderInstagramFlyerOptions {
  format: FlyerFormat;
  mode: FlyerMode;
  team: TeamInfo;
  match?: Match;
  mvpPlayer?: Player;
  fanMvpVotesCount?: number;
}

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const drawCircularImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cx: number,
  cy: number,
  radius: number,
  fallbackText: string,
  accentColor: string
) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#0F172A';
  ctx.fill();
  ctx.clip();

  if (img && img.naturalWidth > 0) {
    const size = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - size) / 2;
    const sy = (img.naturalHeight - size) / 2;
    ctx.drawImage(img, sx, sy, size, size, cx - radius, cy - radius, radius * 2, radius * 2);
  } else {
    ctx.fillStyle = accentColor;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 ${Math.round(radius * 0.72)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fallbackText.slice(0, 3).toUpperCase(), cx, cy + 2);
  }
  ctx.restore();
};

const drawImageCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number
) => {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = w / h;
  let drawW = w;
  let drawH = h;
  let offsetX = 0;
  let offsetY = 0;

  if (imgRatio > canvasRatio) {
    drawH = h;
    drawW = h * imgRatio;
    offsetX = -(drawW - w) / 2;
  } else {
    drawW = w;
    drawH = w / imgRatio;
    offsetY = -(drawH - h) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
};

export async function renderInstagramFlyerCanvas(
  options: RenderInstagramFlyerOptions
): Promise<HTMLCanvasElement> {
  const { format, mode, team, match, mvpPlayer, fanMvpVotesCount = 0 } = options;
  const width = 1080;
  const height = format === 'story' ? 1920 : 1350;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const primary = team.primaryColor || '#1877F2';
  const secondary = team.secondaryColor || '#0866FF';
  const bgUrl = team.bannerUrl || STADIUM_BACKGROUND_PRESETS[0].url;

  const [bgImg, teamLogoImg, rivalLogoImg, playerImg] = await Promise.all([
    loadCanvasImageSafe(bgUrl),
    loadCanvasImageSafe(team.logoUrl),
    match?.rivalLogo ? loadCanvasImageSafe(match.rivalLogo) : Promise.resolve(null),
    mvpPlayer?.avatarUrl ? loadCanvasImageSafe(mvpPlayer.avatarUrl) : Promise.resolve(null),
  ]);

  // 1. Background stadium + dark editorial gradient overlay
  const gradBg = ctx.createLinearGradient(0, 0, width, height);
  gradBg.addColorStop(0, '#070B14');
  gradBg.addColorStop(0.5, '#0F172A');
  gradBg.addColorStop(1, '#04070D');
  ctx.fillStyle = gradBg;
  ctx.fillRect(0, 0, width, height);

  if (bgImg) {
    ctx.save();
    ctx.globalAlpha = 0.36;
    drawImageCover(ctx, bgImg, width, height);
    ctx.restore();
  }

  // Team glow accents
  const glowTop = ctx.createRadialGradient(width / 2, height * 0.2, 40, width / 2, height * 0.2, 680);
  glowTop.addColorStop(0, `${primary}66`);
  glowTop.addColorStop(1, 'transparent');
  ctx.fillStyle = glowTop;
  ctx.fillRect(0, 0, width, height);

  const glowBottom = ctx.createRadialGradient(width / 2, height * 0.88, 30, width / 2, height * 0.88, 600);
  glowBottom.addColorStop(0, `${secondary}55`);
  glowBottom.addColorStop(1, 'transparent');
  ctx.fillStyle = glowBottom;
  ctx.fillRect(0, 0, width, height);

  // Subtle frame border
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, 36, 36, width - 72, height - 72, 40);
  ctx.stroke();
  ctx.restore();

  const isStory = format === 'story';
  const topY = isStory ? 130 : 92;

  // 2. Top Club Pill + League Tag
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  drawRoundedRect(ctx, width / 2 - 250, topY, 500, 62, 31);
  ctx.fill();
  ctx.strokeStyle = primary;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 24px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `${team.leagueName || 'FÚTBOL 7 OFICIAL'}`.toUpperCase(),
    width / 2,
    topY + 32
  );
  ctx.restore();

  // 3. Mode Title
  const badgeText =
    mode === 'matchday'
      ? match?.status === 'live'
        ? 'PARTIDO EN VIVO'
        : 'PRÓXIMO PARTIDO • MATCHDAY'
      : mode === 'result'
      ? 'RESULTADO FINAL OFICIAL'
      : 'MVP DE LA AFICIÓN';

  const titleY = topY + 135;
  ctx.save();
  ctx.fillStyle = mode === 'fan_mvp' ? '#FBBF24' : primary;
  ctx.font = '900 34px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, width / 2, titleY);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = isStory ? '900 72px system-ui, -apple-system, sans-serif' : '900 62px system-ui, -apple-system, sans-serif';
  ctx.fillText(team.name.toUpperCase(), width / 2, titleY + 76);
  ctx.restore();

  // 4. Main Centerpiece
  if (mode === 'fan_mvp' && mvpPlayer) {
    const centerY = isStory ? height * 0.49 : height * 0.51;
    const avatarRadius = isStory ? 235 : 195;

    // Gold Halo Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, centerY, avatarRadius + 16, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(width / 2, centerY, avatarRadius + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A';
    ctx.fill();
    ctx.restore();

    drawCircularImage(
      ctx,
      playerImg,
      width / 2,
      centerY,
      avatarRadius,
      mvpPlayer.name,
      primary
    );

    // Jersey Number Badge
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2 + avatarRadius * 0.72, centerY + avatarRadius * 0.68, 56, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0F172A';
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 42px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${mvpPlayer.number || '10'}`, width / 2 + avatarRadius * 0.72, centerY + avatarRadius * 0.69);
    ctx.restore();

    // Player Name & Votes Pill
    const infoY = centerY + avatarRadius + (isStory ? 110 : 88);
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 58px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(mvpPlayer.name.toUpperCase(), width / 2, infoY);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '700 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `POSICIÓN: ${mvpPlayer.position}${mvpPlayer.nickname ? ` • "${mvpPlayer.nickname}"` : ''}`,
      width / 2,
      infoY + 52
    );

    // Votes badge
    const pillW = 460;
    const pillY = infoY + 86;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    drawRoundedRect(ctx, width / 2 - pillW / 2, pillY, pillW, 74, 37);
    ctx.fill();
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#FDE68A';
    ctx.font = '900 32px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `⭐ ${fanMvpVotesCount} ${fanMvpVotesCount === 1 ? 'VOTO' : 'VOTOS'} DE LA AFICIÓN`,
      width / 2,
      pillY + 46
    );
    ctx.restore();
  } else if (match) {
    // Matchday or Final Result
    const crestsY = isStory ? height * 0.45 : height * 0.46;
    const crestRadius = isStory ? 138 : 118;
    const leftX = 275;
    const rightX = width - 275;

    // Club Shield Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(leftX, crestsY, crestRadius + 10, 0, Math.PI * 2);
    ctx.fillStyle = primary;
    ctx.fill();
    ctx.restore();
    drawCircularImage(ctx, teamLogoImg, leftX, crestsY, crestRadius, team.shortName || team.name, primary);

    // Rival Shield Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(rightX, crestsY, crestRadius + 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fill();
    ctx.restore();
    drawCircularImage(ctx, rivalLogoImg, rightX, crestsY, crestRadius, match.rival, '#334155');

    // Center Score or VS
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (mode === 'result') {
      const sUs = match.scoreUs ?? 0;
      const sThem = match.scoreThem ?? 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 112px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${sUs} - ${sThem}`, width / 2, crestsY);

      const outcomeText =
        sUs > sThem ? '¡VICTORIA DEL CLUB!' : sUs === sThem ? 'EMPATE EN LA CANCHA' : 'MARCADOR FINAL';
      ctx.fillStyle = sUs > sThem ? '#34D399' : '#FBBF24';
      ctx.font = '900 26px system-ui, -apple-system, sans-serif';
      ctx.fillText(outcomeText, width / 2, crestsY + 90);
    } else {
      ctx.fillStyle = '#FBBF24';
      ctx.font = '900 94px system-ui, -apple-system, sans-serif';
      ctx.fillText('VS', width / 2, crestsY);
    }
    ctx.restore();

    // Team Labels under crests
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 30px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((team.shortName || team.name).toUpperCase().slice(0, 14), leftX, crestsY + crestRadius + 56);
    ctx.fillText(match.rival.toUpperCase().slice(0, 16), rightX, crestsY + crestRadius + 56);
    ctx.restore();

    // Info Card
    const cardY = crestsY + crestRadius + (isStory ? 128 : 102);
    const cardW = width - 160;
    const cardH = isStory ? 280 : 210;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    drawRoundedRect(ctx, 80, cardY, cardW, cardH, 32);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    if (mode === 'result') {
      const scorers = (match.scorersUs || [])
        .slice(0, 5)
        .map((s) => `⚽ ${s.playerName} (${s.minute}')`)
        .join('   •   ');
      ctx.fillStyle = '#94A3B8';
      ctx.font = '800 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('ANOTADORES DEL PARTIDO', width / 2, cardY + 56);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 28px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        scorers || `${match.date} • ${match.stadium}`,
        width / 2,
        cardY + cardH / 2 + 10
      );

      ctx.fillStyle = '#60A5FA';
      ctx.font = '700 24px system-ui, -apple-system, sans-serif';
      ctx.fillText(`🏟️ ${match.stadium}   •   📅 ${match.date}`, width / 2, cardY + cardH - 42);
    } else {
      ctx.fillStyle = '#FBBF24';
      ctx.font = '900 38px system-ui, -apple-system, sans-serif';
      ctx.fillText(`📅 ${match.date}   •   ⏰ ${match.time} HRS`, width / 2, cardY + (isStory ? 84 : 66));

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '800 30px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        `🏟️ ${match.stadium} (${match.isHome ? 'LOCAL' : 'VISITA'})`,
        width / 2,
        cardY + (isStory ? 152 : 122)
      );

      const fanCount = Array.isArray(match.fanAttendance) ? match.fanAttendance.length : 0;
      ctx.fillStyle = '#34D399';
      ctx.font = '800 24px system-ui, -apple-system, sans-serif';
      ctx.fillText(
        fanCount > 0
          ? `📣 ${fanCount} ${fanCount === 1 ? 'aficionado confirmado' : 'aficionados confirmados'} en la grada`
          : `🔥 ¡Ven a apoyar a ${team.name}!`,
        width / 2,
        cardY + cardH - 46
      );
    }
    ctx.restore();
  }

  // 5. Footer Strip
  const footerY = height - (isStory ? 120 : 88);
  ctx.save();
  if (mode === 'fan_mvp' && match) {
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '700 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `VS ${match.rival.toUpperCase()}  •  MARCADOR ${match.scoreUs ?? 0} - ${match.scoreThem ?? 0}  •  ${match.date}`,
      width / 2,
      footerY - 54
    );
  }

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '800 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DREAMTEAM • FÚTBOL 7 OFICIAL', width / 2, footerY);
  ctx.restore();

  return canvas;
}
