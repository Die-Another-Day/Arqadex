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
    id: 'bus-yatra',
    title: 'BUS YATRA',
    tagline: 'Walk to the bus stand, drive or ride any bus across 10 real Indian routes. Garage with 8 buses, weather and day & night, tickets, seat selection, coins and progression.',
    color: '#FFB020',
    shape: 'duel',
    tags: ['3D', 'SIMULATOR', 'INDIAN', 'MUSIC'],
    players: '1P + BOTS',
    mood: 'DESI ROAD TRIP',
    status: 'LIVE',
    progress: 100,
    url: '/play/bus-yatra',
  },
  {
    id: 'jhatka',
    title: 'JHATKA',
    tagline:
      'Chatpata reaction duel. Green dekhte hi apni side dabao — jaldi dabaya to jhatka, der ki to haar. Best of 3 rounds, same phone, first to 2 wins. No downloads, no accounts, no ads — or practice solo vs the bot.',
    tags: ['COUPLES', 'REACTION', 'CHATPATA'],
    color: '#FF2DA6',
    status: 'LIVE',
    progress: 100,
    url: '/play/jhatka',
    players: '2 PLAYERS',
    mood: 'Bijli se tez',
    shape: 'bolt',
  },
  {
    id: 'tap-dhamaka',
    title: 'TAP DHAMAKA',
    tagline:
      'Chatpata tap race. 10 second, bas ungliyaan — sabse zyada tap karo, round tumhara. Best of 3 rounds on one phone, first to 2 wins. No downloads, no accounts, no ads — or practice solo vs the bot.',
    tags: ['COUPLES', 'SPEED', 'CHATPATA'],
    color: '#FF7A00',
    status: 'LIVE',
    progress: 100,
    url: '/play/tap-dhamaka',
    players: '2 PLAYERS',
    mood: 'Ungliyaan aag',
    shape: 'circle',
  },
  {
    id: 'hawa-hockey',
    title: 'HAWA HOCKEY',
    tagline:
      'Chatpata air hockey. Puck hawa mein, paddle haath mein — drag your paddle, pehle 3 goal karo. 60-second cap, one phone, two players. No downloads, no accounts, no ads — or practice solo vs the bot.',
    tags: ['COUPLES', 'SPORTS', 'CHATPATA'],
    color: '#00F5FF',
    status: 'LIVE',
    progress: 100,
    url: '/play/hawa-hockey',
    players: '2 PLAYERS',
    mood: 'Goal ya go home',
    shape: 'duel',
  },
  {
    id: 'yaaddasht',
    title: 'YAADDASHT',
    tagline:
      'Chatpata memory duel. Dimaag ki kasrat — do cards palto, jodi milao, jeet jao. 8 jodiyaan on one phone, most pairs wins. No downloads, no accounts, no ads — or practice solo vs the bot.',
    tags: ['COUPLES', 'MEMORY', 'CHATPATA'],
    color: '#7A5CFF',
    status: 'LIVE',
    progress: 100,
    url: '/play/yaaddasht',
    players: '2 PLAYERS',
    mood: 'Bhool gaye to gaye',
    shape: 'hex',
  },
  {
    id: 'pehchan-kaun',
    title: 'PEHCHAN KAUN',
    tagline:
      'Chatpata know-me quiz. Tu mujhe kitna jaanta hai? Apne baare mein jawaab do, partner guess kare — 6 rounds, zyada sahi guesses jeete. Pyaar ka asli test, one phone. No downloads, no accounts, no ads.',
    tags: ['COUPLES', 'QUIZ', 'CHATPATA'],
    color: '#FF004C',
    status: 'LIVE',
    progress: 100,
    url: '/play/pehchan-kaun',
    players: '2 PLAYERS',
    mood: 'Pyaar ka test',
    shape: 'merge',
  },
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
    id: 'neon-duel',
    title: 'NEON DUEL',
    tagline:
      'Arqadex\'s first real multiplayer game. Create a room, share the link, and duel your friends, your group — or your partner — in a fastest-finger reaction battle. No downloads, no accounts, peer-to-peer.',
    tags: ['REACTION', 'MULTIPLAYER', 'PARTY'],
    color: '#FF2DA6',
    status: 'LIVE',
    progress: 100,
    url: '/play/neon-duel',
    players: 'MULTIPLAYER',
    mood: 'Fastest finger wins',
    shape: 'duel',
  },
  {
    id: 'neon-outlaw',
    title: 'NEON OUTLAW',
    tagline:
      'Arqadex\'s first open-city game. You are KAI, a street racer new to Neon City — do the Fixer\'s jobs, win street races against rival crews, and survive the heat. Walk neon streets, jack sports cars and vans, explore the beach, docks and park, and play the full story chain — a GTA-style sandbox in your browser, no downloads.',
    tags: ['OPEN WORLD', 'DRIVING', 'CINEMATIC'],
    color: '#FF2DA6',
    status: 'LIVE',
    progress: 100,
    url: '/play/neon-outlaw',
    players: 'SOLO',
    mood: 'Outrun the heat',
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

/**
 * Play Store-style listing data for each game's detail page
 * (/games/[slug]). `description` is the long store description,
 * `howTo` is the tutorial shown when the player taps PLAY TUTORIAL.
 * Ratings and download counts are NOT invented — a game with no
 * ratings yet honestly says so on its page.
 */
export type GameDetail = {
  description: string
  howTo: string[]
  screenshots: string[]
}

const DETAIL_DEFAULTS: GameDetail = {
  description: '',
  howTo: ['Open the game.', 'Follow the on-screen instructions.', 'Have fun.'],
  screenshots: [],
}

export const GAME_DETAILS: Record<string, Partial<GameDetail>> = {
  'bus-yatra': {
    description:
      'BUS YATRA is a 3D Indian bus simulator. Walk through a living city to the bus stand, then choose: DRIVE any of 8 buses across 10 real routes — Vadodara to Ahmedabad and beyond — or TRAVEL as a passenger, buy a ticket, pick your seat and watch the city roll by. Realistic buses with working dashboards, a conductor who checks tickets, passengers who board and alight, weather and day-night driving, a garage to unlock new buses with coins, and original Bollywood-style radio that changes with the place. No downloads, no accounts — just drive.',
    howTo: [
      'Walk to the bus stand using the joystick or WASD keys.',
      'Stand next to a bus and choose DRIVE or TRAVEL.',
      'Driving: steer with the joystick or arrow keys, brake near stops, open the doors to let passengers board.',
      'Travelling: buy a ticket, pick a seat on the seat map, and enjoy the ride.',
      'Earn coins from fares and unlock new buses in the garage.',
    ],
    screenshots: ['/games/bus-yatra/shot-1.png', '/games/bus-yatra/shot-2.png'],
  },
  jhatka: {
    description:
      'JHATKA is a Chatpata reaction duel for couples — and anyone with fast fingers. Stare at the screen. The moment it turns green, slam your side. Too early and you get the jhatka; too slow and you lose the round. Best of 3 rounds on one phone, first to 2 wins. Play together on the same phone, or practice solo against the bot.',
    howTo: [
      'Both players hold their side of the phone.',
      'Wait for the screen to turn green.',
      'The instant it turns green, tap your side.',
      'Too early is a false start and loses the round. First to 2 round wins takes the match.',
    ],
    screenshots: ['/games/jhatka/shot-1.png', '/games/jhatka/shot-2.png'],
  },
  'tap-dhamaka': {
    description:
      'TAP DHAMAKA is a Chatpata tap race for couples. Ten seconds. Two thumbs. Whoever taps more wins the round. Best of 3 rounds on one phone, first to 2 wins — pure speed, no skill needed, just ungliyaan on fire. Play together on the same phone, or practice solo against the bot.',
    howTo: [
      'Both players hold their side of the phone.',
      'When the timer starts, tap your side as fast as you can.',
      'You have 10 seconds. Most taps wins the round.',
      'Best of 3 rounds — first to 2 round wins takes the match.',
    ],
    screenshots: ['/games/tap-dhamaka/shot-1.png', '/games/tap-dhamaka/shot-2.png'],
  },
  'hawa-hockey': {
    description:
      'HAWA HOCKEY is Chatpata air hockey for couples. The puck floats on air, the paddle is in your hand — drag it, block, and smash the puck into your partner\'s goal. First to 3 goals wins, with a 60-second cap. One phone, two players, zero mercy. Or practice solo against the bot.',
    howTo: [
      'Each player drags their paddle with a finger.',
      'Push the puck into your opponent\'s goal to score.',
      'First to 3 goals wins the match.',
      'If nobody reaches 3 in 60 seconds, most goals wins.',
    ],
    screenshots: ['/games/hawa-hockey/shot-1.png', '/games/hawa-hockey/shot-2.png'],
  },
  yaaddasht: {
    description:
      'YAADDASHT is a Chatpata memory duel for couples. Flip two cards. Find the pair. Remember where everything is — because your partner is watching the same board. 8 pairs on one phone, most pairs wins. A quiet game with loud consequences. Play together, or practice solo against the bot.',
    howTo: [
      'Take turns flipping two cards.',
      'If they match, you keep the pair and go again.',
      'If they don\'t, remember where they were — the cards flip back.',
      'Most pairs at the end wins the match.',
    ],
    screenshots: ['/games/yaaddasht/shot-1.png', '/games/yaaddasht/shot-2.png'],
  },
  'pehchan-kaun': {
    description:
      'PEHCHAN KAUN is the Chatpata know-me quiz for couples. How well does your partner really know you? Answer questions about yourself, then your partner guesses your answer — 6 rounds, most correct guesses wins. It is the real test of pyaar, on one phone. No downloads, no accounts.',
    howTo: [
      'One player answers a question about themselves — secretly.',
      'The partner guesses what they answered.',
      'Correct guess scores a point.',
      '6 rounds. Most correct guesses wins.',
    ],
    screenshots: ['/games/pehchan-kaun/shot-1.png', '/games/pehchan-kaun/shot-2.png'],
  },
  'neon-duel': {
    description:
      'NEON DUEL is Arqadex\'s first real multiplayer game. Create a room, share the link, and duel your friends, your group — or your partner — in a fastest-finger reaction battle. No downloads, no accounts, peer-to-peer. Up to 6 players in a group, or a 1v1 couples duel. Fastest finger wins.',
    howTo: [
      'Create a room and share the link with your friends.',
      'Everyone joins the room from their own phone.',
      'Wait for the signal, then tap as fast as you can.',
      'Fastest finger wins the round. Play again to settle it.',
    ],
    screenshots: ['/games/neon-duel/shot-1.png', '/games/neon-duel/shot-2.png'],
  },
  'neon-outlaw': {
    description:
      'NEON OUTLAW is Arqadex\'s first open-city game. You are KAI, a street racer new to Neon City. Do the Fixer\'s jobs, win street races against rival crews, and survive the heat. Walk neon streets, jack sports cars and vans, explore the beach, docks and park, and play the full story chain — a GTA-style sandbox in your browser, no downloads.',
    howTo: [
      'Walk the neon streets with WASD or the on-screen joystick.',
      'Talk to the Fixer to take jobs.',
      'Jack a car and race rival crews — win to earn cash and respect.',
      'Watch out for the heat. Finish the story chain to become the Outlaw.',
    ],
    screenshots: ['/games/neon-outlaw/shot-1.png', '/games/neon-outlaw/shot-2.png'],
  },
  'protocol-zero': {
    description:
      'PROTOCOL ZERO is a high-pressure human response experiment. Escalating neural simulations test your reflex, tolerance, decision patterns and psychological endurance. How far can you go before the protocol breaks you?',
    howTo: [
      'Follow the on-screen prompts as fast as you can.',
      'Each round gets faster and harder.',
      'One wrong move costs you. Survive as many rounds as you can.',
    ],
    screenshots: ['/games/protocol-zero/shot-1.png', '/games/protocol-zero/shot-2.png'],
  },
  'baldys-escape': {
    description:
      'BALDYS ESCAPE is a fast glitch runner. Navigate corrupted digital landscapes where reality is fragmented and speed is everything. Jump, dodge, and outrun the corruption.',
    howTo: [
      'Run automatically — you control the jump.',
      'Tap or press Space to jump over gaps and glitches.',
      'Time your jumps. One fall ends the run.',
    ],
    screenshots: ['/games/baldys-escape/shot-1.png', '/games/baldys-escape/shot-2.png'],
  },
  'merge-ball': {
    description:
      'MERGE BALL is a physics-driven chaotic merge experience with neon arcade aesthetics. Drop, collide, and evolve unstable quantum spheres. Merge the small ones, grow the big ones, and don\'t let the board fill up.',
    howTo: [
      'Drop balls from the top of the board.',
      'When two identical balls touch, they merge into a bigger one.',
      'Bigger merges score more. Keep the board from overflowing.',
    ],
    screenshots: ['/games/merge-ball/shot-1.png', '/games/merge-ball/shot-2.png'],
  },
  'quantum-drift': {
    description:
      'QUANTUM DRIFT is a physics racer through superposition states. Pilot your craft through a track that exists in multiple paths at once — until observed. Bend the track, drift the corners, and finish first.',
    howTo: [
      'Steer with the arrow keys or on-screen controls.',
      'Drift through corners to keep your speed.',
      'The track shifts as you race — stay on the path.',
    ],
    screenshots: ['/games/quantum-drift/shot-1.png', '/games/quantum-drift/shot-2.png'],
  },
  'signal-collapse': {
    description:
      'SIGNAL COLLAPSE is a puzzle race through collapsing neon infrastructure. Trace corrupted signals before the entire network fails. Every second counts.',
    howTo: [
      'Trace the signal path through the network.',
      'Reconnect the broken links before the collapse spreads.',
      'Finish before the timer runs out.',
    ],
  },
  'vi-battle': {
    description:
      'VI-BATTLE is a voice-controlled neural combat simulator. Your voice is the weapon — phonetic commands directly control real-time cybernetic warfare. Shout to fight.',
    howTo: [
      'Allow microphone access when asked.',
      'Speak the commands shown on screen to attack and defend.',
      'Louder and clearer commands hit harder.',
    ],
  },
  'multiplayer-psych': {
    description:
      'MULTIPLAYER PSYCH turns social dynamics into game loops. Collective behaviour shapes emergent narratives — the people are the mechanic.',
    howTo: [
      'Join a session with your group.',
      'Follow the prompts and make your choices.',
      'Watch how the group\'s behaviour shapes the story.',
    ],
  },
  'reflex-rush': {
    description:
      'REFLEX RUSH is the arcade\'s own built-in reaction test. Wait for the flash, strike as fast as you can, and beat your best time. No install, no account.',
    howTo: [
      'Wait for the screen to flash.',
      'Tap the instant it changes.',
      'Your reaction time is scored. Beat your best.',
    ],
  },
  'aim-trainer': {
    description:
      'AIM TRAINER is thirty seconds of pure aim. Endless targets, one timer. Click fast, miss nothing, and chase a score the cabinet remembers.',
    howTo: [
      'Targets appear at random. Click them as fast as you can.',
      'You have 30 seconds. Each hit scores.',
      'Misses cost you. Chase the high score.',
    ],
  },
}

export function gameDetail(g: Game): GameDetail {
  const d = GAME_DETAILS[g.id] ?? {}
  return {
    description: d.description ?? g.tagline,
    howTo: d.howTo ?? DETAIL_DEFAULTS.howTo,
    screenshots: d.screenshots ?? [],
  }
}

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
