export type GameStatus = 'LIVE' | 'IN_DEV'

export type Game = {
  id: string
  title: string
  tagline: string
  tags: string[]
  color: string
  status: GameStatus
  progress: number
  url?: string
  players: string
  mood: string
  shape: 'hex' | 'merge' | 'radar' | 'duel' | 'circle' | 'triangle' | 'bolt'
}

/**
 * Single source of truth for every experiment on the arcade.
 * Add a game here and it appears in the browser, the command
 * palette, the random picker and the cabinet automatically.
 * `url` is what the PLAY button opens; games without one are
 * shown as in-development, never as a dead link.
 */
export const GAMES: Game[] = [
  {
    id: 'protocol-zero',
    title: 'PROTOCOL ZERO',
    tagline:
      'High-pressure human response experiment testing reflex, tolerance, decision patterns, and psychological endurance through escalating neural simulations.',
    tags: ['REFLEX', 'PSYCHO', 'SIM', 'NEURAL'],
    color: '#FF004C',
    status: 'LIVE',
    progress: 100,
    url: '/play/protocol-zero',
    players: 'SOLO',
    mood: 'High pressure',
    shape: 'radar',
  },
  {
    id: 'baldys-escape',
    title: "BALDYS ESCAPE",
    tagline:
      'Navigate corrupted digital landscapes. Reality is fragmented. Speed is you.',
    tags: ['RUNNER', 'GLITCH', 'JUMP'],
    color: '#C7FF4D',
    status: 'LIVE',
    progress: 100,
    url: '/play/baldys-escape',
    players: 'SOLO',
    mood: 'Fast & glitchy',
    shape: 'hex',
  },
  {
    id: 'merge-ball',
    title: 'MERGE BALL',
    tagline:
      'Physics-driven chaotic merge experience with neon arcade aesthetics. Drop, collide, and evolve unstable quantum spheres.',
    tags: ['PHYSICS', 'CASUAL', 'NEON'],
    color: '#00F5FF',
    status: 'LIVE',
    progress: 100,
    url: '/play/merge-ball',
    players: 'SOLO',
    mood: 'Chaotic & chill',
    shape: 'merge',
  },
  {
    id: 'signal-collapse',
    title: 'SIGNAL COLLAPSE',
    tagline:
      'Trace corrupted signals through collapsing neon infrastructure before the entire network fails.',
    tags: ['PUZZLE', 'NETWORK', 'DARK'],
    color: '#FF3410',
    status: 'LIVE',
    progress: 100,
    url: '/signal-collapse/',
    players: 'SOLO',
    mood: 'Race the collapse',
    shape: 'radar',
  },
  {
    id: 'vi-battle',
    title: 'VI-BATTLE',
    tagline:
      'Voice-controlled neural combat simulator where phonetic commands directly control real-time cybernetic warfare.',
    tags: ['VOICE', 'COMBAT', 'AI'],
    color: '#FF3D81',
    status: 'LIVE',
    progress: 100,
    url: '/vi-battle/',
    players: 'SOLO',
    mood: 'Shout to fight',
    shape: 'duel',
  },
  {
    id: 'quantum-drift',
    title: 'QUANTUM DRIFT',
    tagline:
      'Pilot through superposition states. Exist in multiple paths simultaneously until observed.',
    tags: ['PHYSICS', 'QUANTUM', 'RACING'],
    color: '#7A5CFF',
    status: 'LIVE',
    progress: 100,
    url: '/play/quantum-drift',
    players: 'SOLO',
    mood: 'Bend the track',
    shape: 'circle',
  },
  {
    id: 'multiplayer-psych',
    title: 'MULTIPLAYER PSYCH',
    tagline:
      'Social dynamics as game loops. Collective behaviour shaping emergent narratives.',
    tags: ['SOCIAL', 'MULTIPLAYER', 'EXPERIMENTAL'],
    color: '#FF2DA6',
    status: 'LIVE',
    progress: 100,
    url: '/multiplayer-psych/',
    players: 'MULTIPLAYER',
    mood: 'People are the mechanic',
    shape: 'duel',
  },
  {
    id: 'reflex-rush',
    title: 'REFLEX RUSH',
    tagline:
      'The arcade\'s own built-in reaction test. Wait for the flash, strike as fast as you can, and beat your best time. No install, no account.',
    tags: ['REFLEX', 'BUILT-IN', 'SPEED'],
    color: '#00FF88',
    status: 'LIVE',
    progress: 100,
    url: '/reflex/',
    players: 'SOLO',
    mood: 'Pure reaction',
    shape: 'bolt',
  },
  {
    id: 'aim-trainer',
    title: 'AIM TRAINER',
    tagline:
      'Thirty seconds, endless targets. Click fast, miss nothing, and chase a score the cabinet remembers.',
    tags: ['AIM', 'SPEED', 'BUILT-IN'],
    color: '#FF7A00',
    status: 'LIVE',
    progress: 100,
    url: '/aim/',
    players: 'SOLO',
    mood: 'Pure aim',
    shape: 'circle',
  },
  {
    id: 'ctrl',
    title: 'CTRL',
    tagline:
      'Control systems pushed to the breaking point. Every action triggers an unpredictable cascade.',
    tags: ['CONTROL', 'CHAOS', 'REACTION'],
    color: '#FF2DA6',
    status: 'IN_DEV',
    progress: 72,
    players: 'SOLO',
    mood: 'Still in the lab',
    shape: 'triangle',
  },
]

export const LIVE_GAMES = GAMES.filter((g) => g.status === 'LIVE')
export const ALL_TAGS = Array.from(new Set(GAMES.flatMap((g) => g.tags))).sort()

export function pickRandomGame(excludeId?: string): Game {
  const pool = LIVE_GAMES.filter((g) => g.id !== excludeId)
  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * Today's Pick — deterministic, so everyone sees the same game on the
 * same day and it changes at midnight (local date, YYYY-MM-DD).
 */
export function pickOfDay(date = new Date()): Game {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return LIVE_GAMES[hash % LIVE_GAMES.length]
}
