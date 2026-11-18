import { CONFIG } from './config.js';
import { createLoop } from './loop.js';
import { Player } from './player.js';
import { Camera } from './camera.js';
import { World } from './world.js';
import { Grapple } from './grapple.js';
import { HUD } from './hud.js';
import { ParticleSystem } from './particles.js';
import { SaveManager } from './save.js';
import { SDK } from './sdk.js';
import { aabb, aabbOverlap } from './utils.js';

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
const particles = new ParticleSystem();

/** Reused AABBs so hazard checks never allocate in the hot update loop. */
const playerBox = aabb(0, 0, 0, 0);
const hazardBox = aabb(0, 0, 0, 0);

/** Saved run records, refreshed whenever a run ends. */
let saveData = SaveManager.load();

/** 'MENU' waits for a start press; 'PLAYING' simulates; 'GAMEOVER' freezes. */
let gameState = 'MENU';

/** Deaths since the last midroll break; reset when a break is requested. */
let deathsSinceAd = 0;

/** The rewarded revive is a one-time lifeline for the current run. */
let hasRevivedThisRun = false;

/** True while an ad is in flight, so presses cannot change state mid-ad. */
let adInProgress = false;

/** Tracks the airborne-to-grounded transition so landings fire juice once. */
let wasGrounded = true;

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
  // Particles keep settling between runs; only the shake decays while frozen.
  particles.update(step);

  // No physics or streaming on the menu or game-over screen.
  if (gameState !== 'PLAYING') {
    camera.updateShake(step);
    return;
  }

  // Gravity and velocity integrate while playing; the tether only redirects
  // that motion, so momentum survives the swing. Rooftops catch the player
  // from above and re-apply the auto-run speed.
  player.update(step, world.platforms);
  if (grapple.isAttached) grapple.update(player, step);

  // A touchdown is an impact: kick up dust at the player's feet.
  if (!wasGrounded && player.isGrounded) {
    camera.shake(5);
    particles.emit(player.centerX, player.y + player.height, 10, '#ff2fd0', 240);
  }
  wasGrounded = player.isGrounded;

  // Hazard contact is lethal: violent shake, a red burst, then the shared
  // game-over path. This can only be reached while PLAYING.
  if (hitsHazard()) {
    camera.shake(CONFIG.hazardDeathShake);
    particles.emit(
      player.centerX, player.centerY,
      CONFIG.hazardDeathParticles, CONFIG.hazardRed, CONFIG.hazardDeathParticleSpeed,
    );
    endRun();
    return;
  }

  // Falling past the death plane ends the run, banks the result, and drops the
  // tether. The frozen HUD then reads the freshly refreshed save data.
  if (player.y > CONFIG.deathY) {
    endRun();
    return;
  }

  camera.update(player.x, player.centerY, view.height, step);
  world.update(camera.x, step);
}

/** Freezes the run, releases the tether, and banks the result once. */
function endRun() {
  if (gameState !== 'PLAYING') return;
  player.deathY = player.y;
  gameState = 'GAMEOVER';
  inputActive = false;
  if (grapple.isAttached) grapple.release(player);
  SDK.gameplayStop();
  saveData = SaveManager.addRunStats(player.score, player.boltsEarned);

  // Death is a natural break. Every third death asks for a midroll ad while the
  // simulation is already frozen, then keeps the summary interactive.
  deathsSinceAd += 1;
  if (deathsSinceAd >= CONFIG.midrollEveryDeaths) {
    deathsSinceAd = 0;
    adInProgress = true;
    const adDone = () => { adInProgress = false; };
    SDK.showMidroll().then(adDone, adDone);
  }
}

/** True when the player's AABB overlaps any live hazard's AABB. */
function hitsHazard() {
  playerBox.x = player.x;
  playerBox.y = player.y;
  playerBox.w = player.width;
  playerBox.h = player.height;

  for (const hazard of world.hazards) {
    hazardBox.x = hazard.x;
    hazardBox.y = hazard.y;
    hazardBox.w = hazard.width;
    hazardBox.h = hazard.height;
    if (aabbOverlap(playerBox, hazardBox)) return true;
  }
  return false;
}

function beginGrapple() {
  if (gameState !== 'PLAYING' || inputActive) return;
  inputActive = true;
  if (grapple.fire(player, world.anchors)) {
    player.registerSwing();
    // The tether biting the anchor: impact shake + cyan sparks at the puck.
    camera.shake(10);
    particles.emit(grapple.anchor.x, grapple.anchor.y, 15, '#35f6ff', 340);
  }
}

function endGrapple() {
  if (!inputActive) return;
  inputActive = false;
  if (grapple.isAttached) grapple.release(player);
}

/** Starts a clean run and consumes the press so it cannot also fire a tether. */
function startRun() {
  inputActive = true;
  wasGrounded = true;
  hasRevivedThisRun = false;
  player.reset();
  camera.reset(player.x, player.centerY, view.height);
  world.reset(camera.x);
  gameState = 'PLAYING';
  SDK.gameplayStart();
}

/** Returns from the summary to the menu; the banked totals stay on screen. */
function goToMenu() {
  inputActive = true;
  gameState = 'MENU';
}

/**
 * Spends the run's one rewarded revive. The reward is only granted after the
 * SDK confirms the ad completed; a dismissed or unavailable ad leaves the
 * summary untouched.
 */
async function tryRevive() {
  if (gameState !== 'GAMEOVER' || hasRevivedThisRun || adInProgress) return;

  adInProgress = true;
  let rewarded = false;
  try {
    rewarded = await SDK.showRewarded();
  } finally {
    adInProgress = false;
  }
  if (!rewarded || gameState !== 'GAMEOVER' || hasRevivedThisRun) return;

  hasRevivedThisRun = true;
  gameState = 'PLAYING';
  SDK.gameplayStart();

  // Lift clear of the rooftop and jump, so both fall and hazard deaths resume
  // in open air. A nearby hazard sweep keeps the player from dying instantly.
  player.y = Math.min(player.deathY - CONFIG.reviveRise, CONFIG.rooftopY - 120);
  player.vy = CONFIG.reviveJumpVelocity;
  player.vx = Math.max(player.vx, CONFIG.runSpeed);
  player.prevY = player.y;
  player.isGrounded = false;
  player.resetTrail();
  world.clearHazardsNear(player.centerX, player.y, CONFIG.reviveHazardClearRadius);
  camera.snapTo(player.x, player.centerY, view.height);
  particles.emit(player.centerX, player.centerY, 20, '#ffcf4d', 300);

  wasGrounded = false;
  inputActive = false;
}

/** A press advances MENU -> PLAYING -> GAMEOVER -> MENU. */
function handlePress() {
  if (adInProgress) return;
  if (gameState === 'PLAYING') {
    beginGrapple();
  } else if (gameState === 'MENU') {
    startRun();
  } else {
    goToMenu();
  }
}

function onKeyDown(event) {
  // R is the rewarded-revive shortcut; it is only meaningful on the summary.
  if (event.code === 'KeyR') {
    event.preventDefault();
    if (!event.repeat) tryRevive();
    return;
  }
  if (event.code !== 'Space') return;
  // Stop Space from scrolling or activating focused controls.
  event.preventDefault();
  if (event.repeat) return;
  handlePress();
}

function onKeyUp(event) {
  if (event.code !== 'Space') return;
  event.preventDefault();
  endGrapple();
}

function onPointerDown(event) {
  if (event.button !== 0) return;

  // Mobile has no R key: the gold revive prompt doubles as a click/tap area.
  if (gameState === 'GAMEOVER' && !hasRevivedThisRun && !adInProgress) {
    const rect = canvas.getBoundingClientRect();
    const y = (event.clientY - rect.top) / Math.max(1, rect.height);
    const cfg = CONFIG.hud.gameOver;
    if (y >= cfg.promptY + 0.04 && y <= cfg.reviveY + 0.05) {
      tryRevive();
      return;
    }
  }
  handlePress();
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

  // The menu draws no city: only the HUD sits on top of the background.
  if (gameState !== 'MENU') {
    // World, particles, tether, and player share one camera translation; the
    // shake offset comes from camera.renderX/renderY, and the HUD stays fixed.
    const cameraX = camera.renderX(alpha);
    const cameraY = camera.renderY(alpha);
    ctx.save();
    ctx.translate(-cameraX, -cameraY);
    world.render(ctx, cameraX, cameraY, view, world.hazards);
    particles.render(ctx);
    grapple.render(ctx, player, alpha);
    player.render(ctx, alpha);
    ctx.restore();
  }

  // HUD lives in screen space: reset to the DPR transform so it never shakes.
  ctx.setTransform(view.scaleX, 0, 0, view.scaleY, 0, 0);
  hud.draw(ctx, player, view.width, view.height, gameState, saveData, hasRevivedThisRun);
  const fpsTop = gameState === 'PLAYING'
    ? CONFIG.hud.bolts.margin + CONFIG.hud.bolts.size + 8
    : CONFIG.hud.fps.margin;
  hud.drawFps(ctx, state.fps, view.width, fpsTop);
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);
window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointerup', onPointerUp);
window.addEventListener('pointercancel', onFocusLost);
window.addEventListener('blur', onFocusLost);

const loop = createLoop({ update, render });

// Platform init is optional; off-platform the adapter logs a mock and resolves.
SDK.init();

syncCanvasSize();
camera.snapTo(player.x, player.centerY, view.height);
world.update(camera.x);
new ResizeObserver(syncCanvasSize).observe(canvas);
window.addEventListener('resize', syncCanvasSize);

loop.start();
