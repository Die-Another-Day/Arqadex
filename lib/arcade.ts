/**
 * Everything the arcade remembers lives here — and only in the
 * visitor's own browser (localStorage). No account, no tracking,
 * no server. Favourites, recent plays, play counts and the best
 * Reflex Rush time all survive a refresh but never leave the device.
 */

export type ThemeId = 'neon' | 'synthwave' | 'matrix' | 'daylight'

export const THEMES: { id: ThemeId; label: string; hint: string }[] = [
  { id: 'daylight', label: 'DAYLIGHT', hint: 'Bright arcade' },
  { id: 'neon', label: 'NEON VOID', hint: 'The classic lab' },
  { id: 'synthwave', label: 'SYNTHWAVE', hint: 'Sunset chrome' },
  { id: 'matrix', label: 'MATRIX', hint: 'Green terminal' },
]

const FAV_KEY = 'arqadex:favorites'
const RECENT_KEY = 'arqadex:recent'
const PLAYS_KEY = 'arqadex:plays'
const REFLEX_KEY = 'arqadex:reflex-best'
const THEME_KEY = 'arqadex:theme'

export const ARCADE_EVENT = 'arqadex:arcade'

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new Event(ARCADE_EVENT))
  } catch {
    // Private mode / full storage: the arcade still works, it just forgets.
  }
}

export function getTheme(): ThemeId {
  const saved = read<string>(THEME_KEY, 'daylight')
  return THEMES.some((t) => t.id === saved) ? (saved as ThemeId) : 'daylight'
}

export function applyTheme(id: ThemeId) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = id
  write(THEME_KEY, id)
}

export function getFavorites(): string[] {
  return read<string[]>(FAV_KEY, [])
}

export function toggleFavorite(id: string): string[] {
  const current = getFavorites()
  const next = current.includes(id)
    ? current.filter((f) => f !== id)
    : [...current, id]
  write(FAV_KEY, next)
  return next
}

export type RecentPlay = { id: string; at: number }

export function getRecent(): RecentPlay[] {
  return read<RecentPlay[]>(RECENT_KEY, [])
}

export function getPlays(): Record<string, number> {
  return read<Record<string, number>>(PLAYS_KEY, {})
}

export function recordPlay(id: string) {
  const recent = [ { id, at: Date.now() }, ...getRecent().filter((r) => r.id !== id) ].slice(0, 6)
  const plays = getPlays()
  plays[id] = (plays[id] ?? 0) + 1
  write(RECENT_KEY, recent)
  write(PLAYS_KEY, plays)
}

export function getBestReflex(): number | null {
  return read<number | null>(REFLEX_KEY, null)
}

export function setBestReflex(ms: number) {
  const best = getBestReflex()
  if (best === null || ms < best) write(REFLEX_KEY, ms)
}

export function clearCabinet() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(FAV_KEY)
    window.localStorage.removeItem(RECENT_KEY)
    window.localStorage.removeItem(PLAYS_KEY)
    window.localStorage.removeItem(REFLEX_KEY)
    window.localStorage.removeItem(AIM_KEY)
    window.localStorage.removeItem(VAULT_KEY)
    window.dispatchEvent(new Event(ARCADE_EVENT))
  } catch {
    // ignore
  }
}

const VAULT_KEY = 'arqadex:vault'

export type VaultEntry = { gameId: string; score: number; note: string; at: number }

/**
 * Score Vault — player-entered scores. The static games do not report
 * their scores back to the arcade, so the vault runs on trust: you type
 * the final score you saw in the game, and the arcade remembers your
 * best per game. Reflex Rush and Aim Trainer are different — their
 * bests are recorded automatically by the games themselves.
 */
export function getVault(): VaultEntry[] {
  return read<VaultEntry[]>(VAULT_KEY, [])
}

export function addVaultScore(gameId: string, score: number, note = ''): VaultEntry[] {
  const next = [{ gameId, score, note: note.slice(0, 60), at: Date.now() }, ...getVault()].slice(0, 100)
  write(VAULT_KEY, next)
  return next
}

export function getBestVaultScore(gameId: string): VaultEntry | null {
  const entries = getVault().filter((e) => e.gameId === gameId)
  if (entries.length === 0) return null
  return entries.reduce((best, e) => (e.score > best.score ? e : best), entries[0])
}

const AIM_KEY = 'arqadex:aim-best'

export function getBestAim(): number | null {
  return read<number | null>(AIM_KEY, null)
}

export function setBestAim(score: number) {
  const best = getBestAim()
  if (best === null || score > best) write(AIM_KEY, score)
}
