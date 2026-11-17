/**
 * Small, dependency-free math helpers shared across the game.
 * All angles are radians; all AABBs use top-left origin.
 */

/**
 * @typedef {{ x: number, y: number, w: number, h: number }} Aabb
 */

/**
 * Restricts a value to an inclusive range.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

/**
 * Linear interpolation from `a` to `b`; `t` is not clamped.
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Random float in [min, max).
 * @param {number} [min=0]
 * @param {number} [max=1]
 * @returns {number}
 */
export function rand(min = 0, max = 1) {
  return min + Math.random() * (max - min);
}

/**
 * Random integer in [min, max], both inclusive.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

/**
 * Builds an axis-aligned bounding box.
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @returns {Aabb}
 */
export function aabb(x, y, w, h) {
  return { x, y, w, h };
}

/**
 * True when two AABBs overlap. Touching edges do not count as overlap.
 * @param {Aabb} a
 * @param {Aabb} b
 * @returns {boolean}
 */
export function aabbOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * True when a point lies inside an AABB (edges inclusive).
 * @param {Aabb} box
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
export function aabbContains(box, x, y) {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}
