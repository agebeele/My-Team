import { TeamInfo, Match, Player, LineupPosition } from '../types';
import { loadCanvasImageSafe, downloadCanvasOrBlob, CanvasExportResult } from './graphicPresets';

export interface GenerateLineupPosterOptions {
  team: TeamInfo;
  activeMatch: Match;
  formation: string;
  starterPlayers: { slot: LineupPosition; player?: Player }[];
  benchPlayers: Player[];
  primaryColor: string;
  secondaryColor: string;
  selectedBg: string;
}

/**
 * Copies an image Blob directly to the system clipboard (for WhatsApp, Discord, Slack, etc.)
 */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard write failed:', err);
  }
  return false;
}

/**
 * Draws and exports a high-definition (1080x1350, 4:5 Instagram/WhatsApp portrait)
 * tactical lineup poster using pure HTML5 Canvas.
 *
 * This completely avoids HTML DOM-to-canvas rendering quirks, iframe security restrictions,
 * and tainted canvas errors.
 */
export async function generateLineupCanvasPoster(
  options: GenerateLineupPosterOptions
): Promise<CanvasExportResult | null> {
  const {
    team,
    activeMatch,
    formation,
    starterPlayers,
    benchPlayers,
    primaryColor = '#1877F2',
    secondaryColor = '#60A5FA',
    selectedBg,
  } = options;

  const width = 1080;
  const height = 1350;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. Base dark background
  ctx.fillStyle = '#05070B';
  ctx.fillRect(0, 0, width, height);

  // 2. Stadium / Pitch / Players background
  const bgImg = await loadCanvasImageSafe(selectedBg);
  if (bgImg) {
    ctx.save();
    ctx.drawImage(bgImg, 0, 0, width, height);
    ctx.restore();
  } else {
    // Elegant fallback pitch atmosphere
    const pitchGrad = ctx.createLinearGradient(0, 0, 0, height);
    pitchGrad.addColorStop(0, '#071018');
    pitchGrad.addColorStop(0.5, '#0B2216');
    pitchGrad.addColorStop(1, '#05070B');
    ctx.fillStyle = pitchGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Dark vignette gradients for high contrast & readability
  const vignette = ctx.createLinearGradient(0, 0, 0, height);
  vignette.addColorStop(0, 'rgba(5, 7, 11, 0.88)');
  vignette.addColorStop(0.32, 'rgba(5, 7, 11, 0.55)');
  vignette.addColorStop(0.78, 'rgba(5, 7, 11, 0.70)');
  vignette.addColorStop(0.92, 'rgba(5, 7, 11, 0.95)');
  vignette.addColorStop(1, 'rgba(5, 7, 11, 0.99)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // Radial brand light behind top header
  const radialGlow = ctx.createRadialGradient(width / 2, 110, 10, width / 2, 110, 420);
  radialGlow.addColorStop(0, `${primaryColor}55`);
  radialGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, 500);

  // 4. Subtle tactical field markings
  const fieldX = 70;
  const fieldY = 410;
  const fieldW = width - 140;
  const fieldH = 760;

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 2.5;

  // Field boundary
  ctx.strokeRect(fieldX, fieldY, fieldW, fieldH);

  // Halfway line
  const halfY = fieldY + fieldH / 2;
  ctx.beginPath();
  ctx.moveTo(fieldX, halfY);
  ctx.lineTo(fieldX + fieldW, halfY);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(width / 2, halfY, 110, 0, Math.PI * 2);
  ctx.stroke();

  // Center dot
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.arc(width / 2, halfY, 6, 0, Math.PI * 2);
  ctx.fill();

  // Penalty Area - Rival (Top)
  ctx.strokeRect(width / 2 - 200, fieldY, 400, 150);
  // Goal Area - Rival (Top)
  ctx.strokeRect(width / 2 - 100, fieldY, 200, 60);

  // Penalty Area - Our Goal (Bottom)
  ctx.strokeRect(width / 2 - 200, fieldY + fieldH - 150, 400, 150);
  // Goal Area - Our Goal (Bottom)
  ctx.strokeRect(width / 2 - 100, fieldY + fieldH - 60, 200, 60);

  ctx.restore();

  // 5. Header: Club Logo
  const logoImg = await loadCanvasImageSafe(team.logoUrl);
  const logoX = width / 2;
  const logoY = 85;
  const logoR = 46;

  ctx.save();
  // Glowing outer aura
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(logoX, logoY, logoR + 3, 0, Math.PI * 2);
  ctx.stroke();

  if (logoImg) {
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImg, logoX - logoR, logoY - logoR, logoR * 2, logoR * 2);
  } else {
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(team.shortName.charAt(0) || 'T', logoX, logoY);
  }
  ctx.restore();

  // Club Name
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(team.name.toUpperCase(), width / 2, 175);

  // League Name
  ctx.fillStyle = secondaryColor || '#60A5FA';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(team.leagueName.toUpperCase(), width / 2, 206);

  // Match Information Banner
  ctx.save();
  ctx.fillStyle = 'rgba(10, 15, 26, 0.88)';
  const bannerW = width - 180;
  const bannerH = 100;
  const bannerX = 90;
  const bannerY = 222;

  ctx.beginPath();
  ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 16);
  ctx.fill();
  ctx.strokeStyle = `${primaryColor}80`;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#F59E0B';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('★ PARTIDO OFICIAL ★', width / 2, bannerY + 28);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(
    `${team.shortName}  VS  ${activeMatch.rival.toUpperCase()}`,
    width / 2,
    bannerY + 64
  );

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '16px sans-serif';
  ctx.fillText(
    `📅 ${activeMatch.date}   •   ⏰ ${activeMatch.time} hrs   •   📍 ${activeMatch.stadium}`,
    width / 2,
    bannerY + 89
  );
  ctx.restore();

  // Formation Pill
  ctx.save();
  ctx.fillStyle = `${primaryColor}35`;
  const pillW = 460;
  const pillH = 38;
  const pillX = width / 2 - pillW / 2;
  const pillY = 345;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 19);
  ctx.fill();
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`★ ALINEACIÓN TITULAR (${formation}) ★`, width / 2, pillY + 25);
  ctx.restore();

  // 6. Draw 7 Starter Players on Pitch
  // Pre-load all player avatar images in parallel
  const avatarPromises = starterPlayers.map(async ({ player }) => {
    if (player?.avatarUrl) {
      return await loadCanvasImageSafe(player.avatarUrl);
    }
    return null;
  });
  const loadedAvatars = await Promise.all(avatarPromises);

  starterPlayers.forEach(({ slot, player }, idx) => {
    const isPor = slot.roleName === 'POR';
    const playerAccent = isPor ? '#F59E0B' : primaryColor;

    // Map slot.x (0..100) and slot.y (0..100) to field coordinates
    const posX = fieldX + (slot.x / 100) * fieldW;
    const posY = fieldY + ((slot.y - 12) / 80) * (fieldH - 60) + 30;

    const nodeR = 34;

    ctx.save();

    // Node outer glowing ring
    ctx.strokeStyle = playerAccent;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(posX, posY, nodeR + 2, 0, Math.PI * 2);
    ctx.stroke();

    // Avatar image or colored fallback
    const avatarImg = loadedAvatars[idx];
    if (avatarImg) {
      ctx.beginPath();
      ctx.arc(posX, posY, nodeR, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(avatarImg, posX - nodeR, posY - nodeR, nodeR * 2, nodeR * 2);
    } else {
      ctx.fillStyle = playerAccent;
      ctx.beginPath();
      ctx.arc(posX, posY, nodeR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = player?.name
        ? player.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
        : slot.roleName;
      ctx.fillText(initials, posX, posY);
    }
    ctx.restore();

    // Number Badge (bottom right of avatar)
    ctx.save();
    const badgeR = 14;
    const badgeX = posX + nodeR - 8;
    const badgeY = posY + nodeR - 8;
    ctx.fillStyle = '#05070B';
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(player?.number || '?'), badgeX, badgeY + 0.5);
    ctx.restore();

    // Player Name & Role Pill Underneath
    ctx.save();
    const namePillW = 126;
    const namePillH = 34;
    const namePillX = posX - namePillW / 2;
    const namePillY = posY + nodeR + 10;

    ctx.fillStyle = 'rgba(5, 7, 11, 0.90)';
    ctx.beginPath();
    ctx.roundRect(namePillX, namePillY, namePillW, namePillH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Player Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const shortPlayerName = player?.name
      ? player.name.split(' ')[0]
      : slot.roleName;
    ctx.fillText(shortPlayerName, posX, namePillY + 16);

    // Role text
    ctx.fillStyle = playerAccent;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(slot.roleName, posX, namePillY + 29);
    ctx.restore();
  });

  // 7. Bench / Suplentes bar at bottom
  ctx.save();
  const benchY = height - 130;
  ctx.fillStyle = 'rgba(10, 15, 26, 0.92)';
  ctx.fillRect(0, benchY, width, 60);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, benchY, width, 60);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#F59E0B';
  ctx.font = '900 16px sans-serif';
  ctx.fillText('BANCA:', 70, benchY + 36);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 15px sans-serif';
  const benchText =
    benchPlayers.length > 0
      ? benchPlayers
          .map((p) => `#${p.number} ${p.name.split(' ')[0]}`)
          .join('   •   ')
      : 'Plantilla completa en cancha';
  ctx.fillText(benchText, 150, benchY + 36);
  ctx.restore();

  // 8. Footer Brand Line
  ctx.save();
  const footerY = height - 40;
  ctx.fillStyle = 'rgba(5, 7, 11, 0.98)';
  ctx.fillRect(0, height - 70, width, 70);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px sans-serif';
  ctx.fillText(`📍 ${activeMatch.stadium}`, 70, footerY);

  ctx.textAlign = 'right';
  ctx.fillStyle = secondaryColor || '#60A5FA';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(
    `#${team.shortName || 'TeamGol'}  •  ¡VAMOS POR LA VICTORIA!`,
    width - 70,
    footerY
  );
  ctx.restore();

  // 9. Export using safe Blob/Canvas Downloader
  const fileName = `Alineacion_${team.shortName || 'Equipo'}_vs_${activeMatch.rival.replace(
    /\s+/g,
    '_'
  )}_${formation}.png`;

  return await downloadCanvasOrBlob(canvas, fileName);
}
