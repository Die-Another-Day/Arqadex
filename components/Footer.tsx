'use client'

import { Github, Linkedin, Terminal } from 'lucide-react'
import { GAMES, LIVE_GAMES } from '@/lib/games'

const LINKS = [
  { icon: Github, label: 'GITHUB', href: 'https://github.com/Die-Another-Day' },
  { icon: Linkedin, label: 'LINKEDIN', href: 'https://linkedin.com/in/eeshangarg888' },
]

export default function Footer() {
  return (
    <footer className="relative px-6 pt-16 pb-10" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between gap-10 mb-12">
          <div className="max-w-sm">
            <a href="#" className="flex items-center gap-3 mb-4">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded rotate-45" style={{ background: 'color-mix(in srgb, var(--accent) 20%, transparent)' }} />
                <div className="absolute inset-1 rounded rotate-45" style={{ background: 'var(--bg)' }} />
                <Terminal className="absolute inset-0 m-auto w-4 h-4" style={{ color: 'var(--accent)' }} strokeWidth={1.5} />
              </div>
              <span className="font-orbitron text-sm font-bold tracking-widest" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>
                ARQADEX<span style={{ color: 'var(--accent)' }}>.LAB</span>
              </span>
            </a>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Experimental web games &amp; interactive chaos. All games run in your browser —
              no installs, no accounts, no tracking.
            </p>
          </div>

          <div>
            <h3 className="font-orbitron text-xs tracking-widest mb-4" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>ARCADE</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#games" style={{ color: 'var(--muted)' }}>All games</a></li>
              <li><a href="#cabinet" style={{ color: 'var(--muted)' }}>Your cabinet</a></li>
              <li><a href="#lab" style={{ color: 'var(--muted)' }}>Experiment lab</a></li>
              <li><a href="/submit/" style={{ color: 'var(--muted)' }}>Submit a game</a></li>
              <li><a href="/reflex/" style={{ color: 'var(--muted)' }}>Reflex Rush</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-orbitron text-xs tracking-widest mb-4" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>LIVE NOW</h3>
            <ul className="space-y-2 text-sm">
              {LIVE_GAMES.slice(0, 5).map((g) => (
                <li key={g.id}><a href={g.url} style={{ color: 'var(--muted)' }}>{g.title}</a></li>
              ))}
              <li style={{ color: 'var(--muted)' }}>+ {LIVE_GAMES.length - 5} more in the arcade</li>
            </ul>
          </div>

          <div>
            <h3 className="font-orbitron text-xs tracking-widest mb-4" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>OPERATOR</h3>
            <ul className="space-y-2 text-sm">
              {LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                    <link.icon className="w-4 h-4" /> {link.label}
                  </a>
                </li>
              ))}
              <li><a href="https://build.arqadex.site/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)' }}>Rent Us</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs flex items-center gap-2" style={{ color: 'var(--muted)' }}>
            <span className="w-1.5 h-1.5 rounded-full status-live" style={{ background: 'var(--accent)' }} />
            {GAMES.length} EXPERIMENTS · {LIVE_GAMES.length} LIVE · V2.0 — REBUILT OCT 2026
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Press <kbd className="px-1.5 py-0.5 rounded" style={{ border: '1px solid var(--border)' }}>Ctrl/⌘K</kbd> anywhere to search the arcade.
          </p>
        </div>
      </div>
    </footer>
  )
}
