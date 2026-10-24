'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Play, Shuffle, Palette, Gamepad2, FlaskConical, Upload, Zap } from 'lucide-react'
import { GAMES, pickRandomGame } from '@/lib/games'
import { recordPlay, THEMES, applyTheme } from '@/lib/arcade'
import { useTheme } from '@/components/theme'

type Entry = {
  id: string
  label: string
  hint: string
  run: () => void
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { setTheme } = useTheme()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open ])

  const entries: Entry[] = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (s: string) => !q || s.toLowerCase().includes(q)
    const list: Entry[] = []

    list.push({
      id: 'random',
      label: 'Play a random game',
      hint: 'Feeling lucky',
      run: () => {
        const g = pickRandomGame()
        if (g.url) {
          recordPlay(g.id)
          window.location.href = g.url
        }
      },
    })
    list.push({
      id: 'reflex',
      label: 'Reflex Rush — the built-in reaction test',
      hint: 'New in v2',
      run: () => { window.location.href = '/reflex/' },
    })

    for (const g of GAMES) {
      if (!match(`${g.title} ${g.tagline} ${g.tags.join(' ')}`)) continue
      list.push({
        id: `game-${g.id}`,
        label: g.title,
        hint: g.status === 'LIVE' ? `Play now · ${g.tags.join(' / ')}` : `In the lab · ${g.progress}%`,
        run: () => {
          if (g.url) {
            recordPlay(g.id)
            window.location.href = g.url
          } else {
            document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })
          }
        },
      })
    }

    for (const t of THEMES) {
      if (!match(`theme ${t.label} ${t.hint}`)) continue
      list.push({
        id: `theme-${t.id}`,
        label: `Switch theme — ${t.label}`,
        hint: t.hint,
        run: () => setTheme(t.id),
      })
    }

    const sections: Entry[] = [
      { id: 'go-games', label: 'Go to the arcade', hint: 'All games', run: () => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' }) },
      { id: 'go-cabinet', label: 'Go to your cabinet', hint: 'Favourites & recent', run: () => document.getElementById('cabinet')?.scrollIntoView({ behavior: 'smooth' }) },
      { id: 'go-lab', label: 'Go to the experiment lab', hint: 'Research', run: () => document.getElementById('lab')?.scrollIntoView({ behavior: 'smooth' }) },
      { id: 'go-submit', label: 'Submit a game', hint: 'Open submissions', run: () => { window.location.href = '/submit/' } },
    ]
    for (const s of sections) if (match(s.label)) list.push(s)
    return list
  }, [query, setTheme])

  useEffect(() => setSelected(0), [entries.length, query])

  const runSelected = () => {
    const entry = entries[Math.min(selected, entries.length - 1)]
    if (!entry) return
    setOpen(false)
    entry.run()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-xs tracking-widest transition-colors"
        style={{ border: '1px solid var(--border)', color: 'var(--muted)', background: 'var(--panel)' }}
        aria-label="Open command palette"
      >
        <Search className="w-3.5 h-3.5" />
        <span style={{ fontFamily: 'var(--font-orbitron)' }}>SEARCH</span>
        <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ border: '1px solid var(--border)' }}>⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-xl rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, entries.length - 1)) }
                    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
                    if (e.key === 'Enter') runSelected()
                  }}
                  placeholder="Type a game, a theme, or an action…"
                  className="w-full bg-transparent outline-none text-sm placeholder:opacity-50"
                  style={{ color: 'var(--text)' }}
                />
                <kbd className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}>ESC</kbd>
              </div>
              <div className="max-h-[50vh] overflow-y-auto p-2">
                {entries.length === 0 && (
                  <p className="px-3 py-6 text-sm text-center" style={{ color: 'var(--muted)' }}>
                    Nothing matches “{query}”. Try a game name, a tag, or “theme”.
                  </p>
                )}
                {entries.map((entry, i) => (
                  <button
                    key={entry.id}
                    onMouseEnter={() => setSelected(i)}
                    onClick={runSelected}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left"
                    style={{ background: i === selected ? 'var(--panel)' : 'transparent', border: i === selected ? '1px solid var(--border)' : '1px solid transparent' }}
                  >
                    {entry.id === 'random' ? <Shuffle className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                      : entry.id.startsWith('theme-') ? <Palette className="w-4 h-4 shrink-0" style={{ color: 'var(--accent2)' }} />
                      : entry.id.startsWith('go-') ? <FlaskConical className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
                      : entry.id === 'reflex' ? <Zap className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                      : <Gamepad2 className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />}
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-bold truncate" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>{entry.label}</span>
                      <span className="block text-xs truncate" style={{ color: 'var(--muted)' }}>{entry.hint}</span>
                    </span>
                    {entry.id.startsWith('game-') && <Play className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted)' }} />}
                    {entry.id === 'go-submit' && <Upload className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--muted)' }} />}
                  </button>
                ))}
              </div>
              <p className="px-4 py-2.5 text-[11px] tracking-wide" style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }}>
                ↑ ↓ to move · Enter to run · Ctrl/⌘K anywhere to open this again
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
