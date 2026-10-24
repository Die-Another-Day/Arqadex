'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Search, Star, X, Zap } from 'lucide-react'
import { GAMES, ALL_TAGS, type Game } from '@/lib/games'
import { getFavorites, toggleFavorite, recordPlay } from '@/lib/arcade'

function ShapePreview({ game }: { game: Game }) {
  const c = game.color
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden" style={{ background: `radial-gradient(ellipse at center, ${c}22, transparent 70%)` }}>
      <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${c}14 1px, transparent 1px), linear-gradient(90deg, ${c}14 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
      <div className="absolute inset-0 flex items-center justify-center">
        {game.shape === 'hex' && (
          <div className="w-16 h-14 float" style={{ background: `${c}44`, clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', filter: `drop-shadow(0 0 20px ${c}88)` }} />
        )}
        {game.shape === 'circle' && (
          <div className="w-16 h-16 rounded-full float" style={{ border: `2px solid ${c}99`, boxShadow: `0 0 30px ${c}66, inset 0 0 20px ${c}33` }} />
        )}
        {game.shape === 'triangle' && (
          <div className="w-0 h-0 float" style={{ borderLeft: '32px solid transparent', borderRight: '32px solid transparent', borderBottom: `56px solid ${c}66`, filter: `drop-shadow(0 0 20px ${c}88)` }} />
        )}
        {game.shape === 'radar' && (
          <div className="relative w-20 h-20 float">
            <div className="absolute inset-0 rounded-full" style={{ border: `2px solid ${c}66`, boxShadow: `0 0 25px ${c}77` }} />
            <div className="absolute inset-3 rounded-full" style={{ border: `1px solid ${c}99` }} />
            <div className="absolute inset-[34%] rounded-full" style={{ background: c, filter: 'blur(4px)', boxShadow: `0 0 20px ${c}` }} />
          </div>
        )}
        {game.shape === 'merge' && (
          <div className="relative w-24 h-24">
            <div className="absolute w-12 h-12 rounded-full float" style={{ background: '#00F5FF88', left: 0, top: 20, boxShadow: '0 0 25px #00F5FF' }} />
            <div className="absolute w-10 h-10 rounded-full float-delay-1" style={{ background: '#FF3D8188', right: 8, top: 0, boxShadow: '0 0 25px #FF3D81' }} />
            <div className="absolute w-8 h-8 rounded-full float-delay-2" style={{ background: '#8B5CF688', left: 40, bottom: 0, boxShadow: '0 0 20px #8B5CF6' }} />
          </div>
        )}
        {game.shape === 'duel' && (
          <div className="relative w-24 h-20 flex items-center justify-center">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 float" style={{ width: 0, height: 0, borderTop: '14px solid transparent', borderBottom: '14px solid transparent', borderRight: `22px solid ${c}`, filter: `drop-shadow(0 0 12px ${c})` }} />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 float-delay-1" style={{ width: 0, height: 0, borderTop: '14px solid transparent', borderBottom: '14px solid transparent', borderLeft: `22px solid ${c}`, filter: `drop-shadow(0 0 12px ${c})` }} />
            <div className="absolute w-3 h-3 rounded-full animate-pulse" style={{ background: '#fff', boxShadow: `0 0 8px #fff, 0 0 18px ${c}` }} />
          </div>
        )}
        {game.shape === 'bolt' && (
          <Zap className="w-16 h-16 float" style={{ color: c, filter: `drop-shadow(0 0 20px ${c})` }} fill={c} />
        )}
      </div>
      <div className="absolute inset-0 flex items-end justify-end p-3">
        {game.status === 'IN_DEV' && <Lock className="w-3 h-3" style={{ color: `${c}66` }} />}
      </div>
      <div className="absolute top-2 left-2 w-4 h-4" style={{ borderLeft: `1px solid ${c}44`, borderTop: `1px solid ${c}44` }} />
      <div className="absolute bottom-2 right-2 w-4 h-4" style={{ borderRight: `1px solid ${c}44`, borderBottom: `1px solid ${c}44` }} />
    </div>
  )
}

export default function GameGrid() {
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<string>('ALL')
  const [onlyFavs, setOnlyFavs] = useState(false)
  const [sort, setSort] = useState<'featured' | 'az' | 'progress'>('featured')
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites())

  const filtered = useMemo(() => {
    let list = [...GAMES]
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((g) => `${g.title} ${g.tagline} ${g.tags.join(' ')} ${g.mood}`.toLowerCase().includes(q))
    if (tag !== 'ALL') list = list.filter((g) => g.tags.includes(tag))
    if (onlyFavs) list = list.filter((g) => favorites.includes(g.id))
    if (sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title))
    if (sort === 'progress') list.sort((a, b) => b.progress - a.progress)
    return list
  }, [query, tag, onlyFavs, sort, favorites])

  const clearFilters = () => { setQuery(''); setTag('ALL'); setOnlyFavs(false) }

  return (
    <section className="py-20 px-6" id="games">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-px" style={{ background: 'var(--accent2)' }} />
          <span className="text-xs tracking-widest" style={{ color: 'var(--accent2)', fontFamily: 'var(--font-orbitron)' }}>
            THE ARCADE
          </span>
        </div>
        <h2 className="font-syne text-5xl md:text-7xl font-black mb-4" style={{ color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>
          ALL GAMES
        </h2>
        <p className="max-w-lg mb-10" style={{ color: 'var(--muted)' }}>
          Search, filter by vibe, star your favourites. Favourites and plays are saved in this browser only.
        </p>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-4">
          <label className="flex items-center gap-2 flex-1 min-w-[220px] px-4 py-3 rounded-lg" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search games, tags, moods…"
              className="w-full bg-transparent outline-none text-sm placeholder:opacity-50"
              style={{ color: 'var(--text)' }}
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Clear search"><X className="w-4 h-4" style={{ color: 'var(--muted)' }} /></button>
            )}
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="px-4 py-3 rounded-lg text-sm outline-none"
            style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text)' }}
            aria-label="Sort games"
          >
            <option value="featured">Sort: Featured</option>
            <option value="az">Sort: A–Z</option>
            <option value="progress">Sort: Most complete</option>
          </select>
          <button
            onClick={() => setOnlyFavs((v) => !v)}
            className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold"
            style={{
              background: onlyFavs ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'var(--panel)',
              border: `1px solid ${onlyFavs ? 'var(--accent)' : 'var(--border)'}`,
              color: onlyFavs ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            <Star className="w-4 h-4" fill={onlyFavs ? 'currentColor' : 'none'} /> FAVOURITES ONLY
          </button>
        </div>

        {/* Tag chips */}
        <div className="flex flex-wrap gap-1.5 mb-8">
          {['ALL', ...ALL_TAGS].map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className="px-3 py-1.5 text-xs rounded-full transition-colors"
              style={{
                border: `1px solid ${tag === t ? 'var(--accent)' : 'var(--border)'}`,
                color: tag === t ? 'var(--accent)' : 'var(--muted)',
                background: tag === t ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                fontFamily: 'var(--font-orbitron)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <p className="text-xs tracking-widest mb-4" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>
          SHOWING {filtered.length} OF {GAMES.length}
          {(query || tag !== 'ALL' || onlyFavs) && (
            <button onClick={clearFilters} className="ml-3 underline underline-offset-4" style={{ color: 'var(--accent)' }}>Clear filters</button>
          )}
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
            <p className="font-orbitron font-bold mb-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>NO EXPERIMENTS MATCH</p>
            <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
              {onlyFavs ? 'You haven\'t starred anything yet — tap the star on a game card.' : 'Try a different search or tag.'}
            </p>
            <button onClick={clearFilters} className="px-6 py-3 rounded-lg text-xs font-bold tracking-widest" style={{ background: 'var(--accent)', color: 'var(--on-accent)', fontFamily: 'var(--font-orbitron)' }}>
              CLEAR FILTERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((game, i) => {
              const isFav = favorites.includes(game.id)
              return (
                <motion.article
                  key={game.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: (i % 3) * 0.08 }}
                  className="relative rounded-xl overflow-hidden group"
                  style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
                >
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'var(--border)' }}>
                    <motion.div className="h-full" style={{ background: game.color, boxShadow: `0 0 8px ${game.color}` }} initial={{ width: 0 }} whileInView={{ width: `${game.progress}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.3 }} />
                  </div>
                  <div className="p-5">
                    <ShapePreview game={game} />
                    <div className="flex items-center justify-between mt-4 mb-3">
                      <span className="flex items-center gap-1.5 px-2 py-1 rounded text-xs" style={{ background: `${game.color}14`, border: `1px solid ${game.color}44`, color: game.color, fontFamily: 'var(--font-orbitron)' }}>
                        {game.status === 'LIVE' ? <><span className="w-1.5 h-1.5 rounded-full status-live" style={{ background: game.color }} /> LIVE</> : 'IN THE LAB'}
                      </span>
                      <button
                        onClick={() => setFavorites(toggleFavorite(game.id))}
                        aria-label={isFav ? `Remove ${game.title} from favourites` : `Save ${game.title} as favourite`}
                        className="p-1.5 rounded-full transition-transform hover:scale-110"
                        style={{ color: isFav ? game.color : 'var(--muted)' }}
                      >
                        <Star className="w-5 h-5" fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <h3 className="font-orbitron text-xl font-black mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>{game.title}</h3>
                    <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>{game.players} · {game.mood}</p>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--muted)' }}>{game.tagline}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {game.tags.map((t) => (
                        <button key={t} onClick={() => setTag(t)} className="px-2 py-0.5 text-xs rounded" style={{ border: `1px solid ${game.color}22`, color: `${game.color}`, background: `${game.color}0d`, fontFamily: 'var(--font-orbitron)' }}>
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>DEV PROGRESS</span>
                        <span className="text-xs font-bold" style={{ color: game.color, fontFamily: 'var(--font-orbitron)' }}>{game.progress}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden mb-4" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${game.progress}%`, background: `linear-gradient(90deg, ${game.color}88, ${game.color})` }} />
                      </div>
                      {game.url ? (
                        <a
                          href={game.url}
                          onClick={() => recordPlay(game.id)}
                          className="block text-center py-2.5 rounded text-xs font-bold tracking-widest transition-transform hover:scale-[1.01]"
                          style={{ background: `${game.color}18`, border: `1px solid ${game.color}55`, color: game.color, fontFamily: 'var(--font-orbitron)' }}
                        >
                          PLAY NOW ↗
                        </a>
                      ) : (
                        <p className="text-center py-2.5 rounded text-xs tracking-widest" style={{ border: '1px dashed var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>
                          STILL COOKING IN THE LAB
                        </p>
                      )}
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
