import { CONFIG } from './config.js';
import { createLoop } from './loop.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { World } from './world.js';
import { Grapple } from './grapple.js';
import { HUD } from './hud.js';

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
const hud = new HUD();

/** 'PLAYING' simulates the run; 'GAMEOVER' freezes it until a restart. */
let gameState = 'PLAYING';

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
  // The world is frozen on the game-over screen: no physics, no streaming.
  if (gameState !== 'PLAYING') return;

  // Gravity and velocity integrate while playing; the tether only redirects
  // that motion, so momentum survives the swing. Rooftops catch the player
  // from above and re-apply the auto-run speed.
  player.update(step, world.platforms);
  if (grapple.isAttached) grapple.update(player, step);

  // Falling past the death plane ends the run and drops the tether.
  if (player.y > CONFIG.deathY) {
    gameState = 'GAMEOVER';
    inputActive = false;
    if (grapple.isAttached) grapple.release(player);
    return;
  }

  camera.update(player.x, player.centerY, view.height, step);
  world.update(camera.x);
}

function beginGrapple() {
  if (gameState !== 'PLAYING' || inputActive) return;
  inputActive = true;
  if (grapple.fire(player, world.anchors)) player.registerSwing();
}

function endGrapple() {
  if (!inputActive) return;
  inputActive = false;
  if (grapple.isAttached) grapple.release(player);
}

/** Wipes the run and snaps the camera back to the spawn point. */
function restart() {
  inputActive = false;
  player.reset();
  camera.reset(player.x, player.centerY, view.height);
  world.reset(camera.x);
  gameState = 'PLAYING';
}

function onKeyDown(event) {
  if (event.code !== 'Space') return;
  // Stop Space from scrolling or activating focused controls.
  event.preventDefault();
  if (event.repeat) return;
  if (gameState === 'GAMEOVER') {
    restart();
    return;
  }
  beginGrapple();
}

function onKeyUp(event) {
  if (event.code !== 'Space') return;
  event.preventDefault();
  endGrapple();
}

function onPointerDown(event) {
  if (event.button !== 0) return;
  if (gameState === 'GAMEOVER') {
    restart();
    return;
  }
  beginGrapple();
}

function onPointerUp(event) {
  if (event.button === 0) endGrapple();
}

function onFocusLost() {
  endGrapple();
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
  grapple.render(ctx, player, alpha);
  player.render(ctx, alpha);
  ctx.restore();

  // HUD lives in screen space so it never scrolls or zooms with the camera.
  hud.draw(ctx, player, view.width, view.height, gameState === 'GAMEOVER');
  hud.drawFps(ctx, state.fps, view.width);
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
