'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Gamepad2, FlaskConical, User, Menu, X, Upload, Archive, Palette } from 'lucide-react'
import { LIVE_GAMES } from '@/lib/games'
import { THEMES } from '@/lib/arcade'
import { useTheme } from '@/components/theme'
import CommandPalette from '@/components/CommandPalette'

const navItems = [
  { label: 'GAMES', href: '#games', icon: Gamepad2 },
  { label: 'CABINET', href: '#cabinet', icon: Archive },
  { label: 'LAB', href: '#lab', icon: FlaskConical },
  { label: 'ABOUT', href: '#about', icon: User },
  { label: 'SUBMIT', href: '/submit/', icon: Upload },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const currentTheme = THEMES.find((t) => t.id === theme) ?? THEMES[0]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const cycleTheme = () => {
    const idx = THEMES.findIndex((t) => t.id === theme)
    setTheme(THEMES[(idx + 1) % THEMES.length].id)
  }

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-3' : 'py-6'}`}
    >
      <div
        className={`mx-auto max-w-7xl px-6 transition-all duration-500 ${
          scrolled ? 'glass rounded-xl mx-4' : ''
        }`}
        style={scrolled ? { border: '1px solid var(--border)' } : undefined}
      >
        <div className="flex items-center justify-between h-14 gap-3">
          <a href="#" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded rotate-45 transition-colors" style={{ background: 'color-mix(in srgb, var(--accent) 20%, transparent)' }} />
              <div className="absolute inset-1 rounded rotate-45" style={{ background: 'var(--bg)' }} />
              <Terminal className="absolute inset-0 m-auto w-4 h-4" style={{ color: 'var(--accent)' }} strokeWidth={1.5} />
            </div>
            <span className="font-orbitron text-sm font-bold tracking-widest" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>
              ARQADEX<span style={{ color: 'var(--accent)' }}>.LAB</span>
            </span>
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="relative px-4 py-2 group">
                <span className="font-orbitron text-xs tracking-widest transition-colors duration-300" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>
                  {item.label}
                </span>
                <span className="absolute bottom-0 left-0 right-0 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" style={{ background: 'var(--accent)' }} />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 mr-1">
              <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: 'var(--accent)' }} />
              <span className="font-orbitron text-xs tracking-widest" style={{ color: 'var(--accent)', fontFamily: 'var(--font-orbitron)' }}>
                {LIVE_GAMES.length} LIVE
              </span>
            </div>
            <CommandPalette />
            <button
              onClick={cycleTheme}
              title={`Theme: ${currentTheme.label} — click to change`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs tracking-widest transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text)', background: 'var(--panel)' }}
            >
              <Palette className="w-3.5 h-3.5" style={{ color: 'var(--accent2)' }} />
              <span className="hidden md:inline" style={{ fontFamily: 'var(--font-orbitron)' }}>{currentTheme.label}</span>
            </button>
            <a
              href="https://build.arqadex.site/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:block px-4 py-2 rounded text-xs font-bold tracking-widest transition-all duration-300"
              style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', border: '1px solid var(--border)', color: 'var(--accent)', fontFamily: 'var(--font-orbitron)' }}
            >
              Rent Us
            </a>
            <button className="lg:hidden p-2" style={{ color: 'var(--muted)' }} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden glass mx-4 rounded-b-xl overflow-hidden"
            style={{ border: '1px solid var(--border)', borderTop: 'none' }}
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navItems.map((item) => (
                <a key={item.label} href={item.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3" style={{ color: 'var(--muted)' }}>
                  <item.icon className="w-4 h-4" />
                  <span className="font-orbitron text-xs tracking-widest" style={{ fontFamily: 'var(--font-orbitron)' }}>{item.label}</span>
                </a>
              ))}
              <button onClick={cycleTheme} className="flex items-center gap-3 text-left" style={{ color: 'var(--accent2)' }}>
                <Palette className="w-4 h-4" />
                <span className="font-orbitron text-xs tracking-widest" style={{ fontFamily: 'var(--font-orbitron)' }}>THEME: {currentTheme.label} (TAP TO CHANGE)</span>
              </button>
              <div className="neon-divider" />
              <a href="https://build.arqadex.site/" target="_blank" rel="noopener noreferrer" className="text-center px-5 py-2.5 rounded text-xs font-bold tracking-widest" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', border: '1px solid var(--border)', color: 'var(--accent)', fontFamily: 'var(--font-orbitron)' }}>
                Rent Us
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
