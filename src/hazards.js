import { CONFIG } from './config.js';

/** Number of individual teeth drawn inside one spike strip. */
const SPIKE_TEETH = 4;
/** Width of a laser's bright inner core, in pixels. */
const LASER_CORE = 3;
const DRONE_EYE = 8;
const DRONE_EYE_CORE = 3;

/**
 * Hazard visuals and drone motion.
 *
 * Hazards are plain AABBs created by `World`; this module only advances the
 * bobbing drones and draws them. Sine bobbing mutates `hazard.y` in place, so
 * collision and rendering always use the drone's current position.
 */

/** Bobs every drone around its spawn height; spikes and lasers stay still. */
export function updateHazards(hazards, dt) {
  for (const hazard of hazards) {
    if (hazard.type !== 'drone') continue;
    hazard.time += dt;
    const wave = Math.sin(hazard.time * CONFIG.droneBobSpeed + hazard.phase);
    hazard.y = hazard.startY + wave * CONFIG.droneBobAmplitude;
  }
}

/** Draws the hazards currently intersecting the visible world rectangle. */
export function renderHazards(ctx, hazards, left, right, top, bottom) {
  for (const hazard of hazards) {
    if (hazard.x + hazard.width < left || hazard.x > right) continue;
    if (hazard.y + hazard.height < top || hazard.y > bottom) continue;

    if (hazard.type === 'spike') renderSpikes(ctx, hazard);
    else if (hazard.type === 'laser') renderLaser(ctx, hazard);
    else if (hazard.type === 'drone') renderDrone(ctx, hazard);
  }
}

/** Bright pink/red teeth whose bases rest on the rooftop surface. */
function renderSpikes(ctx, hazard) {
  const step = hazard.width / SPIKE_TEETH;
  const base = hazard.y + hazard.height;

  ctx.save();
  ctx.shadowColor = CONFIG.hazardRedGlow;
  ctx.shadowBlur = 16;
  ctx.fillStyle = CONFIG.hazardRed;
  ctx.beginPath();
  for (let i = 0; i < SPIKE_TEETH; i += 1) {
    const x = hazard.x + i * step;
    ctx.moveTo(x, base);
    ctx.lineTo(x + step / 2, hazard.y);
    ctx.lineTo(x + step, base);
  }
  ctx.fill();
  ctx.restore();
}

/** Glowing red beam with a thin white-hot core along its long axis. */
function renderLaser(ctx, hazard) {
  ctx.save();
  ctx.shadowColor = CONFIG.hazardRedGlow;
  ctx.shadowBlur = 22;
  ctx.fillStyle = CONFIG.hazardRed;
  ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);

  ctx.shadowBlur = 0;
  ctx.fillStyle = CONFIG.hazardCore;
  if (hazard.width > hazard.height) {
    ctx.fillRect(hazard.x, hazard.y + (hazard.height - LASER_CORE) / 2, hazard.width, LASER_CORE);
  } else {
    ctx.fillRect(hazard.x + (hazard.width - LASER_CORE) / 2, hazard.y, LASER_CORE, hazard.height);
  }
  ctx.restore();
}

/** Dark purple drone body with a glowing red eye and hot centre. */
function renderDrone(ctx, hazard) {
  const centerX = hazard.x + hazard.width / 2;
  const centerY = hazard.y + hazard.height / 2;

  ctx.save();
  ctx.shadowColor = CONFIG.hazardRedGlow;
  ctx.shadowBlur = 10;
  ctx.fillStyle = CONFIG.droneBody;
  ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);

  ctx.shadowBlur = 18;
  ctx.fillStyle = CONFIG.hazardRed;
  ctx.beginPath();
  ctx.arc(centerX, centerY, DRONE_EYE, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = CONFIG.hazardCore;
  ctx.beginPath();
  ctx.arc(centerX, centerY, DRONE_EYE_CORE, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
