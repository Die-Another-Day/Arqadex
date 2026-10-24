'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDown, Download, Shuffle, Play, Zap, ChevronRight } from 'lucide-react'
import { GAMES, LIVE_GAMES, pickRandomGame, pickOfDay, type Game } from '@/lib/games'
import { recordPlay } from '@/lib/arcade'

const WORDS = ['EXPERIMENTAL', 'CHAOTIC', 'NEON', 'PLAYABLE', 'UNHINGED', 'PROCEDURAL']

export default function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [spinTitle, setSpinTitle] = useState('???')
  const [picked, setPicked] = useState<Game | null>(null)
  const [todays, setTodays] = useState<Game | null>(null)
  const spinRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Client-only, so the server render and the visitor's local date never disagree.
  useEffect(() => { setTodays(pickOfDay()) }, [])

  useEffect(() => {
    const id = setInterval(() => setWordIndex((i) => (i + 1) % WORDS.length), 2200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => () => { if (spinRef.current) clearInterval(spinRef.current) }, [])

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    setPicked(null)
    let ticks = 0
    spinRef.current = setInterval(() => {
      ticks += 1
      const g = LIVE_GAMES[Math.floor(Math.random() * LIVE_GAMES.length)]
      setSpinTitle(g.title)
      if (ticks >= 14) {
        if (spinRef.current) clearInterval(spinRef.current)
        const final = pickRandomGame()
        setSpinTitle(final.title)
        setPicked(final)
        setSpinning(false)
      }
    }, 70)
  }

  const scrollToGames = () => {
    document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })
  }

  const installApp = () => {
    if (typeof window !== 'undefined' && (window as unknown as { __installPrompt?: { prompt: () => void; userChoice: Promise<unknown> } }).__installPrompt) {
      const prompt = (window as unknown as { __installPrompt: { prompt: () => void; userChoice: Promise<unknown> } }).__installPrompt
      prompt.prompt()
      prompt.userChoice.then(() => {
        ;(window as unknown as { __installPrompt: unknown }).__installPrompt = null
        const btn = document.getElementById('arqadex-install-btn')
        if (btn) btn.style.display = 'none'
      })
    }
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 pt-28 pb-16" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 30% 30%, color-mix(in srgb, var(--accent3) 10%, transparent) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 70% 60%, color-mix(in srgb, var(--accent) 8%, transparent) 0%, transparent 60%),
            radial-gradient(ellipse 40% 50% at 50% 80%, color-mix(in srgb, var(--accent2) 7%, transparent) 0%, transparent 60%)
          `,
        }}
      />
      <div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)', animation: 'scan 12s linear infinite', zIndex: 2 }}
      />

      <div className="relative z-10 max-w-7xl w-full mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass"
          style={{ border: '1px solid var(--border)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full status-live" style={{ background: 'var(--accent)' }} />
          <span className="text-xs tracking-widest" style={{ color: 'var(--accent)', fontFamily: 'var(--font-orbitron)' }}>
            EXPERIMENT // ONLINE · V2.0
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-black leading-[1.05] tracking-tight w-full mx-auto text-center"
          style={{
            fontFamily: 'var(--font-syne)',
            color: 'var(--text)',
            // Measured, not guessed: Syne 800 "ARQADEX" advances 8.464em
            // (fontTools on the actual woff2). At the old 10rem cap that is
            // 1,354px — wider than the old 1,024px container, so the word
            // only ever looked centred by overflowing its box equally.
            // 10vw keeps it inside the padded viewport at every phone
            // width (320px: 32px font -> 271px word vs 272px content width),
            // the 8rem cap keeps it inside the widened 1,280px container
            // on desktop (128px -> 1,083px word), and the 1.9rem floor is
            // only for viewports narrower than that. textAlign is inline
            // so no stylesheet rule can quietly left-align it again.
            // leading 1.05 (was 0.9) stops Syne's Q tail dropping into
            // the subtitle line below.
            fontSize: 'clamp(1.9rem, 10vw, 8rem)',
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          ARQA<span style={{ color: 'var(--accent)' }}>DEX</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-lg md:text-2xl font-bold tracking-wide"
          style={{ color: 'var(--muted)' }}
        >
          <span style={{ color: 'var(--accent2)' }}>{WORDS[wordIndex]}</span> WEB GAMES &amp; INTERACTIVE CHAOS
        </motion.p>
        <p className="mt-4 max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--muted)' }}>
          A digital sandbox where ideas exist before they have names. Every game is an experiment,
          every mechanic is a hypothesis — and the interesting failures live here too.
        </p>

        {/* Stats */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {[
            { value: String(GAMES.length), label: 'EXPERIMENTS' },
            { value: String(LIVE_GAMES.length), label: 'LIVE NOW' },
            { value: '01', label: 'IN THE LAB' },
            { value: '∞', label: 'CHAOS LEVEL' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-orbitron text-2xl md:text-3xl font-black" style={{ color: 'var(--accent)', fontFamily: 'var(--font-orbitron)' }}>{s.value}</div>
              <div className="text-[11px] tracking-widest mt-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Random picker — the slot machine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 mx-auto max-w-2xl rounded-2xl p-5 md:p-6 text-left"
          style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-pixel)' }}>
              ▸ INSERT COIN — CAN&apos;T DECIDE?
            </p>
            <button
              onClick={spin}
              disabled={spinning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest transition-transform hover:scale-[1.03] disabled:opacity-60"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)', fontFamily: 'var(--font-orbitron)' }}
            >
              <Shuffle className="w-4 h-4" />
              {spinning ? 'ROLLING…' : 'FEELING LUCKY'}
            </button>
          </div>
          <div
            className="mt-4 rounded-xl px-4 py-4 text-center font-orbitron font-black tracking-widest text-lg md:text-2xl truncate"
            style={{ background: 'var(--bg)', border: '1px dashed var(--border)', color: picked ? picked.color : 'var(--text)', fontFamily: 'var(--font-orbitron)' }}
          >
            {spinning ? spinTitle : picked ? picked.title : '??? — PRESS FEELING LUCKY'}
          </div>
          <AnimatePresence>
            {picked && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-center gap-3 flex-wrap">
                <p className="flex-1 min-w-[200px] text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{picked.tagline}</p>
                {picked.url && (
                  <a
                    href={picked.url}
                    onClick={() => recordPlay(picked.id)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest shrink-0"
                    style={{ background: `${picked.color}22`, border: `1px solid ${picked.color}66`, color: picked.color, fontFamily: 'var(--font-orbitron)' }}
                  >
                    <Play className="w-3.5 h-3.5" /> PLAY NOW
                  </a>
                )}
                <button onClick={spin} className="text-xs tracking-widest underline underline-offset-4" style={{ color: 'var(--muted)' }}>
                  Spin again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Today's Pick — same game for everyone, changes at midnight */}
        {todays && todays.url && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 mx-auto max-w-2xl rounded-2xl p-5 text-left flex items-center gap-4 flex-wrap"
            style={{ background: 'var(--panel)', border: `1px solid ${todays.color}55` }}
          >
            <div className="flex-1 min-w-[220px]">
              <p className="text-xs tracking-widest" style={{ color: todays.color, fontFamily: 'var(--font-orbitron)' }}>
                ▸ TODAY&apos;S PICK — CHANGES AT MIDNIGHT
              </p>
              <p className="font-orbitron font-black text-lg mt-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>{todays.title}</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{todays.tagline}</p>
            </div>
            <a
              href={todays.url}
              onClick={() => recordPlay(todays.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold tracking-widest shrink-0"
              style={{ background: `${todays.color}22`, border: `1px solid ${todays.color}66`, color: todays.color, fontFamily: 'var(--font-orbitron)' }}
            >
              <Play className="w-3.5 h-3.5" /> PLAY TODAY&apos;S PICK
            </a>
          </motion.div>
        )}

        {/* Main actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={scrollToGames}
            className="group px-8 py-4 rounded-lg text-sm font-bold tracking-widest transition-transform hover:scale-[1.02]"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)', fontFamily: 'var(--font-orbitron)' }}
          >
            <span className="flex items-center gap-2">BROWSE THE ARCADE <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
          </button>
          <a
            href="/reflex/"
            className="px-8 py-4 rounded-lg text-sm font-bold tracking-widest transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}
          >
            <span className="flex items-center gap-2"><Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} /> TRY REFLEX RUSH</span>
          </a>
          <button
            id="arqadex-install-btn"
            onClick={installApp}
            className="px-8 py-4 rounded-lg text-sm font-bold tracking-widest transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-orbitron)', display: 'none' }}
          >
            <span className="flex items-center gap-2"><Download className="w-4 h-4" /> INSTALL APP</span>
          </button>
        </div>

        <button onClick={scrollToGames} className="mt-12 inline-flex flex-col items-center gap-2" style={{ color: 'var(--muted)' }} aria-label="Scroll to games">
          <span className="text-[11px] tracking-widest" style={{ fontFamily: 'var(--font-orbitron)' }}>SCROLL</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </button>
      </div>

      {/* Ticker */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="ticker-track flex gap-10 whitespace-nowrap text-xs tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>
          {[...GAMES, ...GAMES].map((g, i) => (
            <span key={`${g.id}-${i}`}>
              {g.title} <span style={{ color: g.color }}>●</span> {g.status === 'LIVE' ? 'LIVE' : 'IN LAB'}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
