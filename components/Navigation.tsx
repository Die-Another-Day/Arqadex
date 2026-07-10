'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Gamepad2, FlaskConical, User, Menu, X, Upload } from 'lucide-react'
const navItems = [
  { label: 'GAMES', href: '#games', icon: Gamepad2 },
  { label: 'LAB', href: '#lab', icon: FlaskConical },
  { label: 'ABOUT', href: '#about', icon: User },
  { label: 'SUBMIT', href: '/submit', icon: Upload },
]

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'py-3' : 'py-6'
      }`}
    >
      <div
        className={`mx-auto max-w-7xl px-6 transition-all duration-500 ${
          scrolled ? 'glass rounded-xl mx-4 border border-cyan/10' : ''
        }`}
      >
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-3 group"
            data-cursor="hover"
          >
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-cyan/20 rounded rotate-45 group-hover:bg-cyan/30 transition-colors" />
              <div className="absolute inset-1 bg-void rounded rotate-45" />
              <Terminal
                className="absolute inset-0 m-auto w-4 h-4 text-cyan"
                strokeWidth={1.5}
              />
            </div>
            <span
              className="font-orbitron text-sm font-bold tracking-widest text-white group-hover:text-cyan transition-colors"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              ARCADE<span className="text-cyan">LAB</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="relative px-4 py-2 group"
                data-cursor="hover"
              >
                <span
                  className="font-orbitron text-xs tracking-widest text-silver/60 group-hover:text-cyan transition-colors duration-300"
                  style={{ fontFamily: 'var(--font-orbitron)' }}
                >
                  {item.label}
                </span>
                <span className="absolute bottom-0 left-0 right-0 h-px bg-cyan scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan status-live" />
              <span
                className="font-orbitron text-xs text-cyan/60 tracking-widest"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                4+ LIVE
              </span>
            </div>
            <a
              href="https://build.arqadex.site/"
              target="_blank"
              rel="noopener noreferrer"
              className="magnetic-btn px-5 py-2 bg-cyan/10 border border-cyan/30 rounded text-cyan text-xs font-bold tracking-widest hover:bg-cyan/20 hover:border-cyan/60 transition-all duration-300"
              style={{ fontFamily: 'var(--font-orbitron)' }}
              data-cursor="hover"
            >
              Rent Us
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-silver p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden glass border-t border-cyan/10 mx-4 rounded-b-xl overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 text-silver/60 hover:text-cyan transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  <span
                    className="font-orbitron text-xs tracking-widest"
                    style={{ fontFamily: 'var(--font-orbitron)' }}
                  >
                    {item.label}
                  </span>
                </a>
              ))}
	      <a   
                href="/submit"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 text-cyan/70 hover:text-cyan transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span
                  className="font-orbitron text-xs tracking-widest"
                  style={{ fontFamily: 'var(--font-orbitron)' }}
                >
                  SUBMIT GAME
                </span>
              </a>


              <div className="neon-divider" />
              <a
                href="https://build.arqadex.site/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-center px-5 py-2.5 bg-cyan/10 border border-cyan/30 rounded text-cyan text-xs font-bold tracking-widest"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                Rent Us
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
