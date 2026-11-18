import { CONFIG } from './config.js';

/**
 * Screen-space HUD.
 *
 * Drawn after the camera transform is restored, so every position here is in
 * CSS pixels relative to the viewport. The score sits top-left, the streak
 * top-centre (hidden until it is at least 1), and the game-over overlay covers
 * the whole screen.
 */
export class HUD {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./player.js').Player} player
   * @param {number} screenWidth
   * @param {number} screenHeight
   * @param {boolean} [isGameOver]
   */
  draw(ctx, player, screenWidth, screenHeight, isGameOver = false) {
    this.drawScore(ctx, player);
    this.drawStreak(ctx, player, screenWidth);
    if (isGameOver) this.drawGameOver(ctx, screenWidth, screenHeight);
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

  /** Live FPS readout, kept in the top-right so it clears the score. */
  drawFps(ctx, fps, screenWidth) {
    const cfg = CONFIG.hud.fps;
    ctx.save();
    ctx.font = `${cfg.weight} ${cfg.size}px ${CONFIG.render.fonts.mono}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = cfg.color;
    ctx.shadowColor = cfg.glow;
    ctx.shadowBlur = 8;
    ctx.fillText(`${cfg.label} ${Math.round(fps)}`, screenWidth - cfg.margin, cfg.margin);
    ctx.restore();
  }

  drawGameOver(ctx, screenWidth, screenHeight) {
    const cfg = CONFIG.hud.gameOver;

    ctx.save();
    ctx.fillStyle = cfg.overlay;
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Scale the title down on narrow phones so it never clips the edges.
    const titleSize = Math.min(cfg.titleSize, screenWidth * 0.14);
    const centerY = screenHeight * 0.44;

    ctx.font = `${cfg.titleWeight} ${titleSize}px ${CONFIG.render.fonts.display}`;
    ctx.fillStyle = cfg.titleColor;
    ctx.shadowColor = cfg.titleGlow;
    ctx.shadowBlur = 28;
    ctx.fillText(cfg.title, screenWidth / 2, centerY);

    const promptSize = Math.min(cfg.promptSize, screenWidth * 0.06);
    ctx.font = `${cfg.promptWeight} ${promptSize}px ${CONFIG.render.fonts.display}`;
    ctx.fillStyle = cfg.promptColor;
    ctx.shadowColor = cfg.promptGlow;
    ctx.shadowBlur = 14;
    ctx.fillText(
      cfg.prompt,
      screenWidth / 2,
      centerY + screenHeight * cfg.promptOffset,
    );
    ctx.restore();
  }
}
