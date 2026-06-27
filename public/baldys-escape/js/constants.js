// ════════════════════════════════════════════════════════
// BALDY'S ESCAPE — Core Constants
// ════════════════════════════════════════════════════════

const GAME = {
  TITLE: "BALDY'S ESCAPE",
  TOTAL_WORLDS: 10,
  LEVELS_PER_WORLD: 10,
  TOTAL_LEVELS: 100,
};

// ─── PHYSICS ──────────────────────────────────────────
const PHYS = {
  GRAVITY: 0.62,
  WALK_SPEED_BASE: 2.55,        // px/frame at 60fps
  WALK_SPEED_MAX_BONUS: 0.55,   // added by world 10
  JUMP_MIN: -10.2,              // tap jump
  JUMP_MAX: -15.6,              // full-hold jump
  JUMP_HOLD_MS: 220,            // ms of hold to reach max jump
  GROUND_FRICTION: 0.86,
  AIR_DRAG: 0.985,
  TERMINAL_VELOCITY: 18,
  PLAYER_W: 26,
  PLAYER_H: 46,
  GROUND_Y: 0,                  // computed per-level (top of ground)
};

// Pre-computed jump ranges (used by level generator for fairness)
// distance = speed * timeOfFlight ; timeOfFlight = 2*|Vy0|/gravity
function jumpDistance(speed, vy0) {
  const t = (2 * Math.abs(vy0)) / PHYS.GRAVITY;
  return speed * t;
}
function jumpApex(vy0) {
  return (vy0 * vy0) / (2 * PHYS.GRAVITY);
}

// ─── HAZARD KINDS ─────────────────────────────────────
const HAZARD = {
  PIT: 'pit',
  SPIKE_FENCE: 'spike_fence',
  CATAPULT: 'catapult',
  ROPE_SWING: 'rope_swing',
  LADDER_BOULDER: 'ladder_boulder',
  SEESAW: 'seesaw',
  SAW_BLADE: 'saw_blade',
  CRUMBLE: 'crumble',
  MOVING_PLATFORM: 'moving_platform',
  CEILING_DROP: 'ceiling_drop',
  LASER_GATE: 'laser_gate',
  TURRET: 'turret',
  WIND_GUST: 'wind_gust',
};

// ─── WORLD / THEME DEFINITIONS ────────────────────────
const WORLDS = [
  {
    id: 0, name: 'City Outskirts', short: 'City',
    sky: ['#27e8c4', '#eef9c8'], ground: '#9a6b53', groundDark: '#7a4f3b',
    accent: '#2bd6a8', skyline: '#9fc7d8', skylineAlpha: 0.55,
    decoration: 'city', particleColor: '#ffffff',
    pitLabel: 'River', pitColor: '#4fa7d6', pitColor2: '#2c7ea8',
    hazards: [HAZARD.PIT, HAZARD.SPIKE_FENCE, HAZARD.CATAPULT, HAZARD.ROPE_SWING, HAZARD.LADDER_BOULDER, HAZARD.SEESAW],
    musicRoot: 220, musicScale: [0,2,4,7,9],
  },
  {
    id: 1, name: 'Green Meadows', short: 'Forest',
    sky: ['#bdf264', '#eafcd4'], ground: '#7a5230', groundDark: '#5c3d22',
    accent: '#54c43a', skyline: '#8fd17a', skylineAlpha: 0.5,
    decoration: 'forest', particleColor: '#bdf264',
    pitLabel: 'Pond', pitColor: '#5cb88a', pitColor2: '#368a63',
    hazards: [HAZARD.PIT, HAZARD.SPIKE_FENCE, HAZARD.CATAPULT, HAZARD.ROPE_SWING, HAZARD.LADDER_BOULDER, HAZARD.SEESAW, HAZARD.SAW_BLADE, HAZARD.CRUMBLE],
    musicRoot: 246, musicScale: [0,2,4,7,9],
  },
  {
    id: 2, name: 'Rocky Canyon', short: 'Canyon',
    sky: ['#f2a65a', '#fbe7c6'], ground: '#a9683f', groundDark: '#7e4b2b',
    accent: '#e08030', skyline: '#caa282', skylineAlpha: 0.55,
    decoration: 'canyon', particleColor: '#e0b070',
    pitLabel: 'Chasm', pitColor: '#3a2a22', pitColor2: '#1f1611',
    hazards: [HAZARD.PIT, HAZARD.SPIKE_FENCE, HAZARD.CATAPULT, HAZARD.ROPE_SWING, HAZARD.LADDER_BOULDER, HAZARD.SEESAW, HAZARD.SAW_BLADE, HAZARD.CRUMBLE, HAZARD.MOVING_PLATFORM, HAZARD.CEILING_DROP],
    musicRoot: 196, musicScale: [0,3,5,7,10],
  },
  {
    id: 3, name: 'Sandy Desert', short: 'Desert',
    sky: ['#ffd76b', '#fff3d0'], ground: '#d9b063', groundDark: '#b0883f',
    accent: '#f0a830', skyline: '#e8cf9a', skylineAlpha: 0.6,
    decoration: 'desert', particleColor: '#ffe9a8',
    pitLabel: 'Quicksand', pitColor: '#cfa75c', pitColor2: '#a9803b',
    hazards: [HAZARD.PIT, HAZARD.SPIKE_FENCE, HAZARD.CATAPULT, HAZARD.ROPE_SWING, HAZARD.LADDER_BOULDER, HAZARD.SEESAW, HAZARD.SAW_BLADE, HAZARD.CRUMBLE, HAZARD.MOVING_PLATFORM, HAZARD.CEILING_DROP, HAZARD.WIND_GUST],
    musicRoot: 233, musicScale: [0,2,4,7,9],
  },
  {
    id: 4, name: 'Frozen Tundra', short: 'Tundra',
    sky: ['#aee3f5', '#eafbff'], ground: '#dbeef7', groundDark: '#aed4e6',
    accent: '#6fc6e8', skyline: '#cfe9f5', skylineAlpha: 0.65,
    decoration: 'tundra', particleColor: '#ffffff',
    pitLabel: 'Ice Crack', pitColor: '#2f6f8f', pitColor2: '#194a63',
    hazards: [HAZARD.PIT, HAZARD.SPIKE_FENCE, HAZARD.CATAPULT, HAZARD.ROPE_SWING, HAZARD.LADDER_BOULDER, HAZARD.SEESAW, HAZARD.SAW_BLADE, HAZARD.CRUMBLE, HAZARD.MOVING_PLATFORM, HAZARD.CEILING_DROP, HAZARD.WIND_GUST],
    musicRoot: 261, musicScale: [0,2,3,7,9],
    slippery: true,
  },
  {
    id: 5, name: 'Volcanic Core', short: 'Volcano',
    sky: ['#ff6b4a', '#2a1218'], ground: '#3a2420', groundDark: '#23120f',
    accent: '#ff5722', skyline: '#5a2a1f', skylineAlpha: 0.7,
    decoration: 'volcano', particleColor: '#ff8a3d',
    pitLabel: 'Lava', pitColor: '#ff5a1f', pitColor2: '#c4290a',
    hazards: [HAZARD.PIT, HAZARD.SPIKE_FENCE, HAZARD.CATAPULT, HAZARD.ROPE_SWING, HAZARD.LADDER_BOULDER, HAZARD.SEESAW, HAZARD.SAW_BLADE, HAZARD.CRUMBLE, HAZARD.MOVING_PLATFORM, HAZARD.CEILING_DROP, HAZARD.WIND_GUST, HAZARD.LASER_GATE],
    musicRoot: 174, musicScale: [0,1,4,6,9],
    dark: true,
  },
  {
    id: 6, name: 'Night City', short: 'NightCity',
    sky: ['#1b1f4a', '#3a2f66'], ground: '#26223f', groundDark: '#161430',
    accent: '#ff2d87', skyline: '#3d3868', skylineAlpha: 0.8,
    decoration: 'nightcity', particleColor: '#00ffd1',
    pitLabel: 'Void', pitColor: '#0c0c1c', pitColor2: '#000000',
    hazards: [HAZARD.PIT, HAZARD.SPIKE_FENCE, HAZARD.CATAPULT, HAZARD.ROPE_SWING, HAZARD.LADDER_BOULDER, HAZARD.SEESAW, HAZARD.SAW_BLADE, HAZARD.CRUMBLE, HAZARD.MOVING_PLATFORM, HAZARD.CEILING_DROP, HAZARD.WIND_GUST, HAZARD.LASER_GATE, HAZARD.TURRET],
    musicRoot: 220, musicScale: [0,2,3,6,9],
    dark: true,
  },
  {
    id: 7, name: 'Sky Islands', short: 'SkyIslands',
    sky: ['#7fd3ff', '#eaffff'], ground: '#8a7a6a', groundDark: '#665a4d',
    accent: '#ffffff', skyline: '#cdeeff', skylineAlpha: 0.5,
    decoration: 'sky', particleColor: '#ffffff',
    pitLabel: 'Open Sky', pitColor: '#bfeeff', pitColor2: '#8fd6ff',
    hazards: [HAZARD.PIT, HAZARD.SPIKE_FENCE, HAZARD.CATAPULT, HAZARD.ROPE_SWING, HAZARD.LADDER_BOULDER, HAZARD.SEESAW, HAZARD.SAW_BLADE, HAZARD.CRUMBLE, HAZARD.MOVING_PLATFORM, HAZARD.CEILING_DROP, HAZARD.WIND_GUST, HAZARD.LASER_GATE, HAZARD.TURRET],
    musicRoot: 293, musicScale: [0,2,4,7,9],
  },
  {
    id: 8, name: 'Crystal Caves', short: 'Crystal',
    sky: ['#5b3a8a', '#1d1235'], ground: '#3c2a55', groundDark: '#241638',
    accent: '#c77dff', skyline: '#4a3370', skylineAlpha: 0.75,
    decoration: 'crystal', particleColor: '#c77dff',
    pitLabel: 'Abyss', pitColor: '#160e26', pitColor2: '#05030a',
    hazards: [HAZARD.PIT, HAZARD.SPIKE_FENCE, HAZARD.CATAPULT, HAZARD.ROPE_SWING, HAZARD.LADDER_BOULDER, HAZARD.SEESAW, HAZARD.SAW_BLADE, HAZARD.CRUMBLE, HAZARD.MOVING_PLATFORM, HAZARD.CEILING_DROP, HAZARD.WIND_GUST, HAZARD.LASER_GATE, HAZARD.TURRET],
    musicRoot: 207, musicScale: [0,1,4,6,9],
    dark: true,
  },
  {
    id: 9, name: 'Chaos Realm', short: 'Chaos',
    sky: ['#ff2d87', '#1a0a2a'], ground: '#2a1a3a', groundDark: '#150a20',
    accent: '#ccff00', skyline: '#4a2a5a', skylineAlpha: 0.8,
    decoration: 'chaos', particleColor: '#ccff00',
    pitLabel: 'The Void', pitColor: '#0a0014', pitColor2: '#000000',
    hazards: [HAZARD.PIT, HAZARD.SPIKE_FENCE, HAZARD.CATAPULT, HAZARD.ROPE_SWING, HAZARD.LADDER_BOULDER, HAZARD.SEESAW, HAZARD.SAW_BLADE, HAZARD.CRUMBLE, HAZARD.MOVING_PLATFORM, HAZARD.CEILING_DROP, HAZARD.WIND_GUST, HAZARD.LASER_GATE, HAZARD.TURRET],
    musicRoot: 196, musicScale: [0,1,3,6,8],
    dark: true,
  },
];

// ─── DIFFICULTY CURVE ─────────────────────────────────
// Returns tuning parameters for a given absolute level number (1-100)
function getLevelDifficulty(levelNum) {
  const worldIdx = Math.floor((levelNum - 1) / GAME.LEVELS_PER_WORLD);
  const levelInWorld = ((levelNum - 1) % GAME.LEVELS_PER_WORLD) + 1; // 1-10
  const world = WORLDS[Math.min(worldIdx, WORLDS.length - 1)];
  const globalProgress = (levelNum - 1) / (GAME.TOTAL_LEVELS - 1); // 0..1

  const chunkCount = Math.round(6 + globalProgress * 14);          // 6 → 20 chunks
  const speed = PHYS.WALK_SPEED_BASE + globalProgress * PHYS.WALK_SPEED_MAX_BONUS;
  const gapMax = 80 + globalProgress * 60;                          // 80 → 140 px
  const gapMin = 50 + globalProgress * 20;
  const timingTightness = 0.55 + globalProgress * 0.45;             // 0.55 → 1.0 (smaller = tighter windows; used as multiplier)
  const isBossLevel = levelInWorld === GAME.LEVELS_PER_WORLD;       // every 10th level

  return {
    world, worldIdx, levelInWorld, globalProgress,
    chunkCount, speed, gapMax, gapMin, timingTightness, isBossLevel,
    seed: levelNum * 7919 + 104729,
  };
}

// ─── STAR THRESHOLDS ──────────────────────────────────
function starsForDeaths(deaths) {
  if (deaths === 0) return 3;
  if (deaths <= 2) return 2;
  return 1;
}
