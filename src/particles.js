import { CONFIG } from './config.js';
import { rand } from './utils.js';

const MIN_LIFE = 0.25;
const MAX_LIFE = 0.6;
const MIN_SIZE = 2;
const MAX_SIZE = 5;
/** Fraction of the requested speed that the slowest particle receives. */
const MIN_SPEED_FACTOR = 0.3;

/**
 * Lightweight particle burst system.
 *
 * Particles are plain objects moved by a simple velocity + gravity integration.
 * Updates compact the array in place, so dead particles never allocate and the
 * hot loop stays cheap. Rendering uses one glowing circle per particle.
 */
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  /**
   * Spawns `count` particles at world position `x`/`y` in every direction.
   *
   * @param {number} x
   * @param {number} y
   * @param {number} count
   * @param {string} color CSS colour used for both the fill and its glow
   * @param {number} speed maximum launch speed, in pixels per second
   */
  emit(x, y, count, color, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const velocity = rand(speed * MIN_SPEED_FACTOR, speed);
      const life = rand(MIN_LIFE, MAX_LIFE);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life,
        maxLife: life,
        color,
        size: rand(MIN_SIZE, MAX_SIZE),
      });
    }
  }

  /** Integrates velocities, applies gravity, and drops expired particles. */
  update(dt) {
    const gravity = CONFIG.particleGravity;
    let write = 0;

    for (let i = 0; i < this.particles.length; i += 1) {
      const particle = this.particles[i];
      particle.life -= dt;
      if (particle.life <= 0) continue;

      particle.vy += gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      this.particles[write] = particle;
      write += 1;
    }

    this.particles.length = write;
  }

  /** Draws each particle as a glowing circle; opacity follows remaining life. */
  render(ctx) {
    if (this.particles.length === 0) return;

    ctx.save();
    for (const particle of this.particles) {
      const fade = particle.life / particle.maxLife;
      ctx.globalAlpha = fade;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
