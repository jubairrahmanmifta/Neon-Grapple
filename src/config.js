/**
 * Neon Grapple — central tuning table.
 *
 * Every value that affects timing, layout, colour, or feel lives here so it can
 * be adjusted without hunting through the codebase. Viewport-dependent sizes are
 * expressed as ratios and converted at draw time, keeping the game crisp at any
 * resolution.
 */
export const CONFIG = Object.freeze({
  loop: {
    /** Logic updates per second. Fixed so future physics stays deterministic. */
    updatesPerSecond: 60,
    /** Never simulate more than this much real time in one frame (seconds). */
    maxFrameTime: 0.25,
    /** Hard ceiling on catch-up steps per frame; excess backlog is dropped. */
    maxUpdatesPerFrame: 5,
  },

  // --- Stage 1: auto-runner tuning -----------------------------------------

  /** Constant forward speed enforced on the ground, in pixels per second. */
  runSpeed: 350,
  /** Forward acceleration while below runSpeed, in pixels per second squared. */
  runAcceleration: 2000,
  /** Downward acceleration, in pixels per second squared. */
  gravity: 1500,
  /** Pixels from the left edge where the camera holds the player on screen. */
  cameraOffsetX: 300,
  /** Fraction of viewport height where the camera eases the player to rest. */
  cameraOffsetY: 0.7,
  /** Slow vertical catch-up rate; keeps swing arcs from feeling nauseating. */
  cameraFollowRate: 3,
  /** Player spawn position, on top of the starting rooftop. */
  spawnX: 400,
  spawnY: 550,

  // --- Stage 2: grapple tuning ---------------------------------------------

  /** Maximum distance from the player's centre to an acceptable anchor. */
  grappleRange: 600,
  /** Fraction of the rope's overstretch corrected each step (soft tether). */
  ropeConstraintDamping: 0.98,
  /** Velocity multiplier applied on release; rewards well-timed detaches. */
  swingSpeedBoost: 1.05,

  // --- Stage 3: procedural city tuning -------------------------------------

  /** Y of every rooftop surface. The starting rooftop uses this too. */
  rooftopY: 600,
  /** Gap width range, in pixels. */
  minGapWidth: 200,
  maxGapWidth: 400,
  /** Rooftop width range, in pixels. */
  minRooftopWidth: 400,
  maxRooftopWidth: 800,
  /** Anchor height range above the middle of each gap, in pixels. */
  minAnchorY: 200,
  maxAnchorY: 300,
  /** Generate chunks this far ahead of the camera and prune this far behind. */
  generationAhead: 2000,
  cleanupBehind: 1000,

  // --- Stage 4: death, score, and combo tuning ------------------------------

  /** Falling below this world Y ends the run. */
  deathY: 1000,
  /** Score earned per pixel of forward progress (x * multiplier). */
  scoreDistanceMultiplier: 0.1,

  // --- Stage 5: juice tuning ------------------------------------------------

  /** Screen-shake units shed per second after a shake impulse. */
  shakeDecay: 30,
  /** Downward acceleration applied to particles, in pixels per second squared. */
  particleGravity: 900,

  // --- Stage 6: persistence and progression tuning ---------------------------

  /** Bolts awarded per score point (a score of 1000 earns 50 bolts). */
  boltsPerScore: 0.05,

  // --- Stage 7: procedural hazard tuning ------------------------------------

  /** Per-chunk spawn chances for spike strips, gap lasers, and drones. */
  spikeChance: 0.2,
  laserChance: 0.2,
  droneChance: 0.2,
  /** Hazard body sizes, in world pixels. */
  spikeWidth: 40,
  spikeHeight: 30,
  laserLength: 100,
  laserThickness: 10,
  droneSize: 50,
  /** Drones appear this far ahead of the camera. */
  droneSpawnAhead: 1000,
  /** Drone sine bob: amplitude in pixels, speed in radians per second. */
  droneBobAmplitude: 26,
  droneBobSpeed: 2.2,
  /** Vertical placement range for lasers and drones. */
  minHazardY: 200,
  maxHazardY: 500,
  /** Lethal impact feedback. */
  hazardDeathShake: 30,
  hazardDeathParticles: 50,
  hazardDeathParticleSpeed: 560,
  hazardRed: '#ff0055',
  hazardRedGlow: 'rgba(255, 0, 85, 0.9)',
  hazardCore: '#ffd6e3',
  droneBody: '#12091f',

  // --- Stage 8: CrazyGames SDK and rewarded revive --------------------------

  /** A midroll break is requested after this many deaths. */
  midrollEveryDeaths: 3,
  /** Revive lifts the player this far above the recorded death height. */
  reviveRise: 200,
  /** Upward impulse applied on revive, in pixels per second. */
  reviveJumpVelocity: -300,
  /** Hazards this close to the revived player are removed for fairness. */
  reviveHazardClearRadius: 260,

  render: {
    /** Backing-store pixel-ratio cap. Keeps high-DPI phones at a sane cost. */
    maxDPR: 2,
    background: '#05060f',
    fonts: {
      display: '"Arial Black", "Segoe UI", system-ui, -apple-system, sans-serif',
      mono: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
    },
  },

  hud: {
    fps: {
      label: 'FPS',
      color: '#86ffc7',
      glow: 'rgba(134, 255, 199, 0.55)',
      weight: 600,
      size: 14,
      margin: 18,
      /** Seconds between rolling FPS samples. */
      sampleWindow: 0.5,
    },
    score: {
      label: 'SCORE',
      color: '#35f6ff',
      glow: 'rgba(53, 246, 255, 0.75)',
      weight: 900,
      size: 30,
      margin: 24,
    },
    streak: {
      color: '#ff2fd0',
      glow: 'rgba(255, 47, 208, 0.8)',
      weight: 800,
      size: 24,
      margin: 26,
    },
    bolts: {
      label: 'BOLTS',
      color: '#ffcf4d',
      glow: 'rgba(255, 207, 77, 0.75)',
      weight: 800,
      size: 24,
      margin: 24,
    },
    menu: {
      title: 'NEON GRAPPLE',
      titleColor: '#35f6ff',
      titleGlow: 'rgba(53, 246, 255, 0.85)',
      titleWeight: 900,
      titleSize: 92,
      statColor: '#ffffff',
      statGlow: 'rgba(255, 255, 255, 0.45)',
      statWeight: 700,
      statSize: 24,
      prompt: 'Click or Press Space to Play',
      promptColor: '#ff2fd0',
      promptGlow: 'rgba(255, 47, 208, 0.8)',
      promptWeight: 700,
      promptSize: 24,
      /** Prompt alpha dips by this much at the bottom of each pulse. */
      pulseAmplitude: 0.5,
      /** Prompt pulse speed in radians per second. */
      pulseSpeed: 3,
    },
    gameOver: {
      overlay: 'rgba(3, 4, 10, 0.72)',
      title: 'GAME OVER',
      titleColor: '#ffffff',
      titleGlow: 'rgba(255, 255, 255, 0.7)',
      titleWeight: 900,
      titleSize: 84,
      /** Title and summary positions as fractions of the viewport height. */
      titleY: 0.28,
      detailColor: '#ffffff',
      detailGlow: 'rgba(255, 255, 255, 0.35)',
      detailWeight: 700,
      detailSize: 24,
      detailStart: 0.44,
      detailSpacing: 0.075,
      boltColor: '#ffcf4d',
      bestColor: '#35f6ff',
      prompt: 'Press Space to Continue',
      promptColor: '#35f6ff',
      promptGlow: 'rgba(53, 246, 255, 0.75)',
      promptWeight: 700,
      promptSize: 22,
      promptY: 0.78,
      /** Optional one-time rewarded revive, drawn below the continue prompt. */
      revivePrompt: 'Press R to Revive',
      reviveHint: 'Watch an ad to continue',
      reviveColor: '#ffcf4d',
      reviveGlow: 'rgba(255, 207, 77, 0.8)',
      reviveWeight: 800,
      reviveSize: 20,
      reviveHintSize: 14,
      reviveY: 0.87,
    },
  },
});
