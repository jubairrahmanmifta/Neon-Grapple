import { CONFIG } from './config.js';
import { createLoop } from './loop.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { World } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

if (!ctx) {
  throw new Error('Neon Grapple requires Canvas 2D support.');
}

/**
 * Viewport state is kept in CSS pixels. The backing store is sized separately
 * so drawing code never has to think about devicePixelRatio.
 */
const view = {
  width: 1,
  height: 1,
  scaleX: 1,
  scaleY: 1,
  rawDPR: 1,
};

const state = {
  fps: CONFIG.loop.updatesPerSecond,
  fpsFrames: 0,
  fpsElapsed: 0,
};

const player = new Player();
const camera = new Camera(player.x);
const world = new World();

const JUMP_KEYS = new Set(['Space', 'KeyW', 'ArrowUp']);

/**
 * Matches the canvas backing store to its CSS size at the current (capped) DPR.
 * Called on load, on layout resize, and when the monitor DPR changes.
 */
function syncCanvasSize() {
  const rect = canvas.getBoundingClientRect();
  const cssWidth = Math.max(1, rect.width);
  const cssHeight = Math.max(1, rect.height);
  const rawDPR = window.devicePixelRatio || 1;
  const dpr = Math.min(rawDPR, CONFIG.render.maxDPR);
  const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
  const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));

  view.width = cssWidth;
  view.height = cssHeight;
  view.scaleX = pixelWidth / cssWidth;
  view.scaleY = pixelHeight / cssHeight;
  view.rawDPR = rawDPR;

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
}

function update(step) {
  player.update(step);
  camera.update(player.x);
}

function onKeyDown(event) {
  if (!JUMP_KEYS.has(event.code)) return;
  // Stop Space/ArrowUp from scrolling or activating focused controls.
  if (event.code === 'Space' || event.code === 'ArrowUp') event.preventDefault();
  if (event.repeat) return;
  player.jump();
}

function onPointerDown(event) {
  if (event.button !== 0) return;
  player.jump();
}

function drawFps() {
  const cfg = CONFIG.hud.fps;
  ctx.save();
  ctx.font = `${cfg.weight} ${cfg.size}px ${CONFIG.render.fonts.mono}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = cfg.color;
  ctx.shadowColor = cfg.glow;
  ctx.shadowBlur = 8;
  ctx.fillText(`${cfg.label} ${Math.round(state.fps)}`, cfg.margin, cfg.margin);
  ctx.restore();
}

function render(alpha, frameDelta) {
  // Catch DPR changes (e.g. dragging the window to another monitor).
  if ((window.devicePixelRatio || 1) !== view.rawDPR) syncCanvasSize();

  // 1 CSS pixel in view coordinates == 1 CSS pixel on screen, at any DPR cap.
  ctx.setTransform(view.scaleX, 0, 0, view.scaleY, 0, 0);

  state.fpsElapsed += frameDelta;
  state.fpsFrames += 1;
  if (state.fpsElapsed >= CONFIG.hud.fps.sampleWindow) {
    state.fps = state.fpsFrames / state.fpsElapsed;
    state.fpsElapsed = 0;
    state.fpsFrames = 0;
  }

  ctx.fillStyle = CONFIG.render.background;
  ctx.fillRect(0, 0, view.width, view.height);

  // World and player share one camera translation; the HUD stays in screen space.
  const cameraX = camera.renderX(alpha);
  ctx.save();
  ctx.translate(-cameraX, 0);
  world.render(ctx, cameraX, view);
  player.render(ctx, alpha);
  ctx.restore();

  drawFps();
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('pointerdown', onPointerDown);

const loop = createLoop({ update, render });

syncCanvasSize();
new ResizeObserver(syncCanvasSize).observe(canvas);
window.addEventListener('resize', syncCanvasSize);

loop.start();
