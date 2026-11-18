import { CONFIG } from './config.js';
import { createLoop } from './loop.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { World } from './world.js';
import { Grapple } from './grapple.js';

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
const camera = new Camera(player.x, player.centerY, view.height);
const world = new World();
const grapple = new Grapple();

/**
 * One-button input. Any supported source starts a grapple, any release ends it.
 * The flag also suppresses key repeat and stray pointer events.
 */
let inputActive = false;

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
  // Gravity and velocity integrate in both states; the tether only redirects
  // that motion, so momentum survives the swing. Rooftops catch the player
  // from above and re-apply the auto-run speed.
  player.update(step, world.platforms);
  if (grapple.isAttached) grapple.update(player, step);
  camera.update(player.x, player.centerY, view.height, step);
  world.update(camera.x);
}

function beginGrapple() {
  if (inputActive) return;
  inputActive = true;
  grapple.fire(player, world.anchors);
}

function endGrapple() {
  if (!inputActive) return;
  inputActive = false;
  if (grapple.isAttached) grapple.release(player);
}

function onKeyDown(event) {
  if (event.code !== 'Space') return;
  // Stop Space from scrolling or activating focused controls.
  event.preventDefault();
  if (event.repeat) return;
  beginGrapple();
}

function onKeyUp(event) {
  if (event.code !== 'Space') return;
  event.preventDefault();
  endGrapple();
}

function onPointerDown(event) {
  if (event.button === 0) beginGrapple();
}

function onPointerUp(event) {
  if (event.button === 0) endGrapple();
}

function onFocusLost() {
  endGrapple();
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

/** Bright cyan tether from the player's centre to the anchor, if attached. */
function drawGrapple(alpha) {
  if (!grapple.isAttached) return;

  const x = player.renderX(alpha) + player.width / 2;
  const y = player.renderY(alpha) + player.height / 2;

  ctx.save();
  ctx.strokeStyle = '#35f6ff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(53, 246, 255, 0.8)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(grapple.anchor.x, grapple.anchor.y);
  ctx.stroke();
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
  const cameraY = camera.renderY(alpha);
  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  world.render(ctx, cameraX, cameraY, view);
  drawGrapple(alpha);
  player.render(ctx, alpha);
  ctx.restore();

  drawFps();
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointerup', onPointerUp);
window.addEventListener('pointercancel', onFocusLost);
window.addEventListener('blur', onFocusLost);

const loop = createLoop({ update, render });

syncCanvasSize();
camera.snapTo(player.x, player.centerY, view.height);
world.update(camera.x);
new ResizeObserver(syncCanvasSize).observe(canvas);
window.addEventListener('resize', syncCanvasSize);

loop.start();
