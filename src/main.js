import { CONFIG } from './config.js';
import { createLoop } from './loop.js';
import { clamp } from './utils.js';

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
  prevTime: 0,
  time: 0,
  fps: CONFIG.loop.updatesPerSecond,
  fpsFrames: 0,
  fpsElapsed: 0,
};

/**
 * Rasterising big blurred text every frame is wasteful. The title and its glow
 * are cached in an offscreen canvas at backing-store resolution and rebuilt only
 * when the viewport changes. The pulse is just a subtle opacity animation.
 */
const titleLayer = {
  canvas: document.createElement('canvas'),
  dirty: true,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
};

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
  titleLayer.dirty = true;

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
}

function update(step) {
  state.prevTime = state.time;
  state.time += step;
}

function titleFont(size) {
  return `${CONFIG.title.weight} ${size}px ${CONFIG.render.fonts.display}`;
}

function buildTitleLayer() {
  const cfg = CONFIG.title;
  const { width, height } = view;
  const base = Math.min(width * cfg.size.widthRatio, height * cfg.size.heightRatio);
  let fontSize = clamp(base, cfg.size.min, cfg.size.max);

  ctx.font = titleFont(fontSize);
  let textWidth = ctx.measureText(cfg.text).width;
  const maxWidth = width * cfg.maxWidthRatio;
  if (textWidth > maxWidth) {
    fontSize *= maxWidth / textWidth;
    ctx.font = titleFont(fontSize);
    textWidth = ctx.measureText(cfg.text).width;
  }

  const padding = cfg.glowBlur * 2;
  const cssWidth = textWidth + padding * 2;
  const cssHeight = fontSize * 1.3 + padding * 2;
  const scale = Math.max(0.1, view.scaleX);
  const layer = titleLayer.canvas;

  layer.width = Math.max(1, Math.ceil(cssWidth * scale));
  layer.height = Math.max(1, Math.ceil(cssHeight * scale));

  const layerCtx = layer.getContext('2d');
  layerCtx.setTransform(scale, 0, 0, scale, 0, 0);
  layerCtx.textAlign = 'center';
  layerCtx.textBaseline = 'middle';
  layerCtx.font = titleFont(fontSize);

  const x = cssWidth / 2;
  const y = cssHeight / 2;
  const gradient = layerCtx.createLinearGradient(x - textWidth / 2, y, x + textWidth / 2, y);
  cfg.gradient.forEach((color, index) => {
    gradient.addColorStop(index / (cfg.gradient.length - 1), color);
  });

  layerCtx.fillStyle = gradient;
  layerCtx.shadowColor = cfg.glowColor;
  layerCtx.shadowBlur = cfg.glowBlur;
  layerCtx.fillText(cfg.text, x, y);
  layerCtx.shadowBlur = cfg.glowBlur * 0.35;
  layerCtx.fillText(cfg.text, x, y);

  titleLayer.x = (width - cssWidth) / 2;
  titleLayer.y = (height - cssHeight) / 2;
  titleLayer.width = cssWidth;
  titleLayer.height = cssHeight;
  titleLayer.dirty = false;
}

function drawTitle(time) {
  if (titleLayer.dirty) buildTitleLayer();

  const cfg = CONFIG.title;
  const wave = 0.5 + 0.5 * Math.sin(time * Math.PI * 2 * cfg.pulseHz);

  ctx.save();
  ctx.globalAlpha = 1 - cfg.pulseAlpha + cfg.pulseAlpha * wave;
  ctx.drawImage(
    titleLayer.canvas,
    titleLayer.x,
    titleLayer.y,
    titleLayer.width,
    titleLayer.height,
  );
  ctx.restore();
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

  // Logic runs at a fixed rate, so interpolate the visual clock for smooth glow.
  const visualTime = state.prevTime + (state.time - state.prevTime) * alpha;
  drawTitle(visualTime);
  drawFps();
}

const loop = createLoop({ update, render });

syncCanvasSize();
new ResizeObserver(syncCanvasSize).observe(canvas);
window.addEventListener('resize', syncCanvasSize);

loop.start();
