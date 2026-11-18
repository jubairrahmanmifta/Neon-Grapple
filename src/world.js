import { CONFIG } from './config.js';
import { rand } from './utils.js';
import { renderHazards, updateHazards } from './hazards.js';

const COLORS = {
  platform: '#160b2b',
  platformEdge: '#c46bff',
  platformEdgeGlow: 'rgba(196, 107, 255, 0.85)',
  anchor: '#ffe94a',
  anchorCore: '#fffbe0',
};

const ANCHOR_RADIUS = 9;
const ANCHOR_CORE_RADIUS = 3;
const START_X = 0;
const START_WIDTH = 1000;
const EDGE_HEIGHT = 3;
/** Extra body drawn below the viewport so buildings never show a bottom seam. */
const BODY_OVERDRAW = 200;

/**
 * Procedural rooftop city.
 *
 * The world is an endless chain of flat rooftops separated by gaps. Each gap
 * owns exactly one sky anchor, placed above its midpoint, so a player who runs
 * off the edge always has something to aim at. Platforms and anchors are
 * generated ahead of the camera and pruned behind it, which keeps the arrays
 * small no matter how long a run lasts.
 */
export class World {
  constructor() {
    this.platforms = [];
    this.anchors = [];
    this.hazards = [];
    this.reset();
  }

  /**
   * Clears the whole city and rebuilds the starting rooftop. Called on boot and
   * on every restart so a new run always begins from the same layout.
   *
   * @param {number} [cameraX] left edge of the visible world to fill ahead of
   */
  reset(cameraX = 0) {
    this.platforms = [{ x: START_X, y: CONFIG.rooftopY, width: START_WIDTH }];
    this.anchors = [];
    this.hazards = [];
    this.update(cameraX, 0);
  }

  /**
   * Generates chunks until the rightmost rooftop is far enough ahead of the
   * camera, then drops everything that is no longer worth keeping.
   *
   * @param {number} cameraX left edge of the visible world
   * @param {number} [dt=0] seconds elapsed, used for drone bobbing
   */
  update(cameraX, dt = 0) {
    while (this.rightmostEdge() < cameraX + CONFIG.generationAhead) {
      this.generateChunk(cameraX);
    }
    updateHazards(this.hazards, dt);

    while (this.platforms.length > 0 && this.platforms[0].x < cameraX - CONFIG.cleanupBehind) {
      this.platforms.shift();
    }
    while (this.anchors.length > 0 && this.anchors[0].x < cameraX - CONFIG.cleanupBehind) {
      this.anchors.shift();
    }

    // Hazards are not strictly ordered by x (drones spawn far ahead), so prune
    // with an in-place compaction instead of shifting from the front.
    const cutoff = cameraX - CONFIG.cleanupBehind;
    let write = 0;
    for (const hazard of this.hazards) {
      if (hazard.x + hazard.width < cutoff) continue;
      this.hazards[write] = hazard;
      write += 1;
    }
    this.hazards.length = write;
  }

  /** Right edge of the furthest generated rooftop. */
  rightmostEdge() {
    const last = this.platforms[this.platforms.length - 1];
    return last.x + last.width;
  }

  /** Appends one gap + rooftop + anchor and any optional hazards. */
  generateChunk(cameraX) {
    const previous = this.platforms[this.platforms.length - 1];
    const gapStart = previous.x + previous.width;
    const gapWidth = Math.round(rand(CONFIG.minGapWidth, CONFIG.maxGapWidth));
    const gapEnd = gapStart + gapWidth;
    const width = Math.round(rand(CONFIG.minRooftopWidth, CONFIG.maxRooftopWidth));

    this.anchors.push({
      x: gapStart + gapWidth / 2,
      y: Math.round(rand(CONFIG.minAnchorY, CONFIG.maxAnchorY)),
    });
    this.platforms.push({ x: gapEnd, y: previous.y, width });

    // Spikes sit on the new rooftop; their box covers the full tooth height.
    if (Math.random() < CONFIG.spikeChance) {
      const spikeWidth = CONFIG.spikeWidth;
      this.hazards.push({
        type: 'spike',
        x: Math.round(rand(gapEnd, gapEnd + width - spikeWidth)),
        y: previous.y - CONFIG.spikeHeight,
        width: spikeWidth,
        height: CONFIG.spikeHeight,
      });
    }

    // Half the lasers are vertical beam gates; the rest lie across the gap.
    if (Math.random() < CONFIG.laserChance) {
      const vertical = Math.random() < 0.5;
      const length = CONFIG.laserLength;
      const thickness = CONFIG.laserThickness;
      this.hazards.push({
        type: 'laser',
        vertical,
        x: Math.round(rand(gapStart, gapEnd - (vertical ? thickness : length))),
        y: Math.round(rand(CONFIG.minHazardY, CONFIG.maxHazardY - (vertical ? length : 0))),
        width: vertical ? thickness : length,
        height: vertical ? length : thickness,
      });
    }

    // Drones spawn far ahead and bob around their own initial height.
    if (Math.random() < CONFIG.droneChance) {
      const size = CONFIG.droneSize;
      const y = Math.round(rand(CONFIG.minHazardY, CONFIG.maxHazardY - size));
      this.hazards.push({
        type: 'drone',
        x: cameraX + CONFIG.droneSpawnAhead,
        y,
        width: size,
        height: size,
        startY: y,
        time: 0,
        phase: rand(0, Math.PI * 2),
      });
    }
  }

  /**
   * Draws rooftops, anchors, and the supplied hazard list. Camera translation
   * is already applied by the caller.
   *
   * @param {Array} hazards hazards to draw (defaults to this.hazards)
   */
  render(ctx, cameraX, cameraY, view, hazards = this.hazards) {
    const left = cameraX;
    const right = cameraX + view.width;
    const viewBottom = cameraY + view.height;

    for (const platform of this.platforms) {
      if (platform.x + platform.width < left || platform.x > right) continue;
      if (platform.y > viewBottom) continue;

      const bodyHeight = Math.max(0, viewBottom - platform.y) + BODY_OVERDRAW;
      ctx.fillStyle = COLORS.platform;
      ctx.fillRect(platform.x, platform.y, platform.width, bodyHeight);

      ctx.save();
      ctx.shadowColor = COLORS.platformEdgeGlow;
      ctx.shadowBlur = 14;
      ctx.fillStyle = COLORS.platformEdge;
      ctx.fillRect(platform.x, platform.y - EDGE_HEIGHT, platform.width, EDGE_HEIGHT);
      ctx.restore();
    }

    this.renderAnchors(ctx, left, right, cameraY, viewBottom);
    renderHazards(ctx, hazards, left, right, cameraY, viewBottom);
  }

  /** Bright yellow pucks with a hot inner dot; only visible ones are drawn. */
  renderAnchors(ctx, left, right, top, bottom) {
    for (const anchor of this.anchors) {
      if (anchor.x < left - 40 || anchor.x > right + 40) continue;
      if (anchor.y < top - 40 || anchor.y > bottom + 40) continue;

      ctx.save();
      ctx.shadowColor = 'rgba(255, 233, 74, 0.9)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = COLORS.anchor;
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, ANCHOR_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = COLORS.anchorCore;
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, ANCHOR_CORE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
