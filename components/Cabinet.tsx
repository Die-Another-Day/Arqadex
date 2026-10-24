'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Archive, Star, Clock, Play, Trash2, Zap, Trophy } from 'lucide-react'
import { GAMES } from '@/lib/games'
import { ARCADE_EVENT, clearCabinet, getBestReflex, getFavorites, getPlays, getRecent, recordPlay } from '@/lib/arcade'

export default function Cabinet() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [recent, setRecent] = useState<{ id: string; at: number }[]>([])
  const [plays, setPlays] = useState<Record<string, number>>({})
  const [best, setBest] = useState<number | null>(null)
  const [armed, setArmed] = useState(false)

  const refresh = useCallback(() => {
    setFavorites(getFavorites())
    setRecent(getRecent())
    setPlays(getPlays())
    setBest(getBestReflex())
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener(ARCADE_EVENT, refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener(ARCADE_EVENT, refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [refresh])

  const favGames = GAMES.filter((g) => favorites.includes(g.id))
  const recentGames = recent.flatMap((r) => {
    const game = GAMES.find((g) => g.id === r.id)
    return game ? [{ ...r, game }] : []
  })
  const totalPlays = Object.values(plays).reduce((a, b) => a + b, 0)

  return (
    <section className="py-20 px-6" id="cabinet">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-px" style={{ background: 'var(--accent)' }} />
          <span className="text-xs tracking-widest" style={{ color: 'var(--accent)', fontFamily: 'var(--font-orbitron)' }}>
            SAVED IN THIS BROWSER ONLY
          </span>
        </div>
        <h2 className="font-syne text-5xl md:text-7xl font-black mb-4" style={{ color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>
          YOUR CABINET
        </h2>
        <p className="max-w-lg mb-10" style={{ color: 'var(--muted)' }}>
          No account, no tracking. Star a game and it lands here. Play something and it shows up
          in your recent list with a running play count.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Play, label: 'TOTAL PLAYS', value: String(totalPlays) },
            { icon: Star, label: 'FAVOURITES', value: String(favGames.length) },
            { icon: Clock, label: 'RECENTLY PLAYED', value: String(recentGames.length) },
            { icon: Trophy, label: 'BEST REFLEX TIME', value: best === null ? '—' : `${best}ms` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-5" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
              <s.icon className="w-5 h-5 mb-3" style={{ color: 'var(--accent)' }} />
              <div className="font-orbitron text-2xl font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>{s.value}</div>
              <div className="text-[11px] tracking-widest mt-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl p-6" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
            <h3 className="font-orbitron font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>
              <Clock className="w-4 h-4" style={{ color: 'var(--accent)' }} /> CONTINUE PLAYING
            </h3>
            {recentGames.length === 0 ? (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                Nothing yet. Play any game from the arcade and it will wait for you here next time.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentGames.map((r) => r.game && (
                  <li key={r.id}>
                    <a
                      href={r.game.url ?? '#games'}
                      onClick={() => r.game.url && recordPlay(r.game.id)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.game.color, boxShadow: `0 0 10px ${r.game.color}` }} />
                      <span className="flex-1 font-orbitron text-sm font-bold truncate" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>{r.game.title}</span>
                      <span className="text-xs shrink-0" style={{ color: 'var(--muted)' }}>{plays[r.id] ?? 0} play{(plays[r.id] ?? 0) === 1 ? '' : 's'}</span>
                      <Play className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {best === null && (
              <a href="/reflex/" className="mt-5 flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--accent)' }}>
                <Zap className="w-4 h-4" /> No reflex time yet — set one in Reflex Rush →
              </a>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl p-6" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
            <h3 className="font-orbitron font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>
              <Star className="w-4 h-4" style={{ color: 'var(--accent2)' }} /> STARRED GAMES
            </h3>
            {favGames.length === 0 ? (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                Tap the star on any game card to pin it here — your personal top shelf.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {favGames.map((g) => (
                  <a
                    key={g.id}
                    href={g.url ?? '#games'}
                    onClick={() => g.url && recordPlay(g.id)}
                    className="px-3 py-2 rounded-full text-xs font-bold"
                    style={{ border: `1px solid ${g.color}55`, color: g.color, background: `${g.color}12`, fontFamily: 'var(--font-orbitron)' }}
                  >
                    {g.title} ↗
                  </a>
                ))}
              </div>
            )}
            <div className="mt-8 pt-5 flex items-center justify-between gap-3 flex-wrap" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                <Archive className="w-3.5 h-3.5" /> Stored only on this device.
              </p>
              <button
                onClick={() => {
                  if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 3000); return }
                  clearCabinet(); setArmed(false); refresh()
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold"
                style={{ border: '1px solid var(--border)', color: armed ? '#ff4d4d' : 'var(--muted)' }}
              >
                <Trash2 className="w-3.5 h-3.5" /> {armed ? 'TAP AGAIN TO CLEAR' : 'CLEAR CABINET'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
