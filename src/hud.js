import { CONFIG } from './config.js';

const DEFAULT_SAVE = { highScore: 0, totalBolts: 0 };

/**
 * Screen-space HUD.
 *
 * Drawn after the camera transform is restored, so every position here is in
 * CSS pixels relative to the viewport. MENU shows the title and saved totals,
 * PLAYING shows live run readouts, and GAMEOVER overlays the run summary.
 */
export class HUD {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./player.js').Player} player
   * @param {number} screenWidth
   * @param {number} screenHeight
   * @param {'MENU'|'PLAYING'|'GAMEOVER'} gameState
   * @param {{highScore: number, totalBolts: number}} saveData
   */
  draw(ctx, player, screenWidth, screenHeight, gameState = 'PLAYING', saveData = DEFAULT_SAVE) {
    if (gameState === 'MENU') {
      this.drawMenu(ctx, screenWidth, screenHeight, saveData);
      return;
    }
    if (gameState === 'GAMEOVER') {
      this.drawGameOver(ctx, player, screenWidth, screenHeight, saveData);
      return;
    }
    this.drawScore(ctx, player);
    this.drawStreak(ctx, player, screenWidth);
    this.drawBolts(ctx, player, screenWidth);
  }

  drawScore(ctx, player) {
    const cfg = CONFIG.hud.score;
    ctx.save();
    ctx.font = `${cfg.weight} ${cfg.size}px ${CONFIG.render.fonts.display}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = cfg.color;
    ctx.shadowColor = cfg.glow;
    ctx.shadowBlur = 14;
    ctx.fillText(`${cfg.label} ${player.score}`, cfg.margin, cfg.margin);
    ctx.restore();
  }

  drawStreak(ctx, player, screenWidth) {
    if (player.streak <= 0) return;

    const cfg = CONFIG.hud.streak;
    ctx.save();
    ctx.font = `${cfg.weight} ${cfg.size}px ${CONFIG.render.fonts.display}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = cfg.color;
    ctx.shadowColor = cfg.glow;
    ctx.shadowBlur = 14;
    ctx.fillText(`STREAK x${player.streak}`, screenWidth / 2, cfg.margin);
    ctx.restore();
  }

  /** Gold counter for bolts earned in the current run, in the top right. */
  drawBolts(ctx, player, screenWidth) {
    const cfg = CONFIG.hud.bolts;
    ctx.save();
    ctx.font = `${cfg.weight} ${cfg.size}px ${CONFIG.render.fonts.display}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = cfg.color;
    ctx.shadowColor = cfg.glow;
    ctx.shadowBlur = 14;
    ctx.fillText(`${cfg.label} ${player.boltsEarned}`, screenWidth - cfg.margin, cfg.margin);
    ctx.restore();
  }

  /** FPS readout; shifts below the bolts counter while a run is active. */
  drawFps(ctx, fps, screenWidth, top = CONFIG.hud.fps.margin) {
    const cfg = CONFIG.hud.fps;
    ctx.save();
    ctx.font = `${cfg.weight} ${cfg.size}px ${CONFIG.render.fonts.mono}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = cfg.color;
    ctx.shadowColor = cfg.glow;
    ctx.shadowBlur = 8;
    ctx.fillText(`${cfg.label} ${Math.round(fps)}`, screenWidth - cfg.margin, top);
    ctx.restore();
  }

  /** Centred glowing text; the caller owns the ctx save/restore and alignment. */
  centered(ctx, text, x, y, font, color, glow, blur = 14) {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.shadowColor = glow;
    ctx.shadowBlur = blur;
    ctx.fillText(text, x, y);
  }

  drawMenu(ctx, screenWidth, screenHeight, saveData) {
    const cfg = CONFIG.hud.menu;
    const centerX = screenWidth / 2;
    const display = CONFIG.render.fonts.display;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const titleSize = Math.min(cfg.titleSize, screenWidth * 0.11);
    this.centered(ctx, cfg.title, centerX, screenHeight * 0.34,
      `${cfg.titleWeight} ${titleSize}px ${display}`, cfg.titleColor, cfg.titleGlow, 32);

    const statSize = Math.min(cfg.statSize, screenWidth * 0.055);
    const statFont = `${cfg.statWeight} ${statSize}px ${display}`;
    this.centered(ctx, `High Score: ${saveData.highScore}`, centerX, screenHeight * 0.5,
      statFont, cfg.statColor, cfg.statGlow);
    this.centered(ctx, `Bolts: ${saveData.totalBolts}`, centerX, screenHeight * 0.56,
      statFont, cfg.statColor, cfg.statGlow);

    // A slow sine wave makes the call to action breathe rather than blink.
    const pulse = 0.5 + 0.5 * Math.sin((now / 1000) * cfg.pulseSpeed);
    ctx.globalAlpha = 1 - cfg.pulseAmplitude * pulse;
    const promptSize = Math.min(cfg.promptSize, screenWidth * 0.055);
    this.centered(ctx, cfg.prompt, centerX, screenHeight * 0.74,
      `${cfg.promptWeight} ${promptSize}px ${display}`, cfg.promptColor, cfg.promptGlow);
    ctx.restore();
  }

  drawGameOver(ctx, player, screenWidth, screenHeight, saveData) {
    const cfg = CONFIG.hud.gameOver;
    const centerX = screenWidth / 2;
    const display = CONFIG.render.fonts.display;

    ctx.save();
    ctx.fillStyle = cfg.overlay;
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const titleSize = Math.min(cfg.titleSize, screenWidth * 0.14);
    this.centered(ctx, cfg.title, centerX, screenHeight * cfg.titleY,
      `${cfg.titleWeight} ${titleSize}px ${display}`, cfg.titleColor, cfg.titleGlow, 28);

    const detailSize = Math.min(cfg.detailSize, screenWidth * 0.055);
    const font = `${cfg.detailWeight} ${detailSize}px ${display}`;
    const firstY = screenHeight * cfg.detailStart;
    const gap = screenHeight * cfg.detailSpacing;
    this.centered(ctx, `Score: ${player.score}`, centerX, firstY,
      font, cfg.detailColor, cfg.detailGlow);
    this.centered(ctx, `Bolts Earned: +${player.boltsEarned}`, centerX, firstY + gap,
      font, cfg.boltColor, cfg.boltColor);
    this.centered(ctx, `Best: ${saveData.highScore}`, centerX, firstY + gap * 2,
      font, cfg.bestColor, cfg.bestColor);

    const promptSize = Math.min(cfg.promptSize, screenWidth * 0.06);
    this.centered(ctx, cfg.prompt, centerX, screenHeight * cfg.promptY,
      `${cfg.promptWeight} ${promptSize}px ${display}`, cfg.promptColor, cfg.promptGlow);
    ctx.restore();
  }
}
