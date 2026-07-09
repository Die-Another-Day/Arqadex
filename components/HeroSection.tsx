'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, Download, ChevronRight } from 'lucide-react'
const SUBTITLE = 'Experimental Web Games & Interactive Chaos'

export default function HeroSection() {
  const [typed, setTyped] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const mouseRef = useRef({ x: 0, y: 0 })
  const titleRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const heroRef = useRef<HTMLElement>(null)

  // Typewriter effect
  useEffect(() => {
    let i = 0
    const delay = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < SUBTITLE.length) {
          setTyped(SUBTITLE.slice(0, i + 1))
          i++
        } else {
          clearInterval(interval)
        }
      }, 40)
      return () => clearInterval(interval)
    }, 1200)

    const cursorInterval = setInterval(() => setShowCursor((v) => !v), 530)
    return () => {
      clearTimeout(delay)
      clearInterval(cursorInterval)
    }
  }, [])

  // Parallax tilt
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth
      const h = window.innerHeight
      const x = (e.clientX / w - 0.5) * 12
      const y = (e.clientY / h - 0.5) * 8
      setTilt({ x: -y, y: x })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const scrollToGames = () => {
    document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })
  }

  const installApp = () => {
    if (typeof window !== 'undefined' && (window as any).__installPrompt) {
      (window as any).__installPrompt.prompt()
      ;(window as any).__installPrompt.userChoice.then(() => {
        ;(window as any).__installPrompt = null
        const btn = document.getElementById('arqadex-install-btn')
        if (btn) btn.style.display = 'none'
      })
    }
  }

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'var(--bg-void)' }}
    >
      {/* Animated grid */}
      <div className="absolute inset-0 grid-bg opacity-40" />

      {/* Radial gradient glow orbs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 30% 30%, rgba(122, 92, 255, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 70% 60%, rgba(0, 245, 255, 0.06) 0%, transparent 60%),
            radial-gradient(ellipse 40% 50% at 50% 80%, rgba(255, 45, 166, 0.05) 0%, transparent 60%)
          `,
        }}
      />

      {/* Horizontal scan line */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.3), transparent)',
          animation: 'scan 12s linear infinite',
          zIndex: 2,
        }}
      />

      {/* Floating geometric decorations */}
      <motion.div
        className="absolute top-32 left-12 w-24 h-24 border border-cyan/10 rounded-lg rotate-12 float"
        animate={{ rotate: [12, 20, 12] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-40 right-16 w-16 h-16 border border-pink/10 rounded-full float-delay-2"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-48 right-32 w-8 h-8 bg-purple/10 rotate-45"
        animate={{ rotate: [45, 90, 45], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-64 left-24 w-4 h-4 bg-lime/20"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />

      {/* Corner brackets */}
      <div className="absolute top-32 left-8 md:left-16 w-10 h-10 border-l-2 border-t-2 border-cyan/30" />
      <div className="absolute top-32 right-8 md:right-16 w-10 h-10 border-r-2 border-t-2 border-cyan/30" />
      <div className="absolute bottom-20 left-8 md:left-16 w-10 h-10 border-l-2 border-b-2 border-pink/30" />
      <div className="absolute bottom-20 right-8 md:right-16 w-10 h-10 border-r-2 border-b-2 border-pink/30" />

      {/* Center content */}
      <div
        ref={titleRef}
        className="relative z-10 flex flex-col items-center text-center px-6"
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
      >
        {/* Pre-title badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 20 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8 flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-cyan/20"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-cyan status-live" />
          <span
            className="text-xs text-cyan/70 tracking-widest"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            EXPERIMENT // ONLINE
          </span>
        </motion.div>

        {/* Main title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-4"
        >
          <h1
            className="glitch-text font-orbitron text-7xl md:text-9xl lg:text-[11rem] font-black tracking-tighter leading-none"
            data-text="ARCADE"
            style={{
              fontFamily: 'var(--font-orbitron)',
              background: 'linear-gradient(135deg, #F0F0FF 30%, rgba(0,245,255,0.8) 60%, rgba(122,92,255,0.8) 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 60px rgba(0,245,255,0.3))',
            }}
          >
            ARCADE
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-10 flex items-end gap-4"
        >
          <h2
            className="font-orbitron text-5xl md:text-7xl lg:text-8xl font-black tracking-widest leading-none"
            style={{
              fontFamily: 'var(--font-orbitron)',
              color: 'transparent',
              WebkitTextStroke: '1px rgba(0,245,255,0.4)',
            }}
          >
            LAB
          </h2>
          <div className="mb-2 px-2 py-0.5 border border-pink/40 rounded text-pink text-xs font-bold tracking-widest"
            style={{ fontFamily: 'var(--font-orbitron)' }}>
            v0.1
          </div>
        </motion.div>

        {/* Typewriter subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-12 h-8 flex items-center"
        >
          <p
            className="text-lg md:text-xl text-silver/70"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            {typed}
            <span
              className="ml-0.5 inline-block w-0.5 h-5 bg-cyan align-middle"
              style={{ opacity: showCursor ? 1 : 0, transition: 'opacity 0.1s' }}
            />
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <button
            onClick={scrollToGames}
            className="magnetic-btn group relative px-8 py-4 rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(122,92,255,0.15))',
              border: '1px solid rgba(0,245,255,0.4)',
            }}
            data-cursor="hover"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan/20 to-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span
              className="relative flex items-center gap-2 text-cyan font-bold tracking-widest text-sm"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              ENTER ARCADE
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>


	  <button
            id="arqadex-install-btn"
            onClick={installApp}
            className="magnetic-btn group px-8 py-4 rounded-lg border border-white/10 hover:border-cyan/40 transition-all duration-300"
            style={{ background: 'rgba(255,255,255,0.03)', display: 'none' }}
            data-cursor="hover"
          >
            <span
              className="flex items-center gap-2 text-silver/60 group-hover:text-cyan font-bold tracking-widest text-sm transition-colors"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              <Download className="w-4 h-4" />
              INSTALL ARQADEX
            </span>
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-14 flex items-center gap-8 md:gap-14"
        >
          {[
            { value: '01', label: 'LIVE GAMES' },
            { value: '04', label: 'IN DEVELOPMENT' },
            { value: '∞', label: 'CHAOS LEVEL' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="font-orbitron text-2xl font-black text-cyan mb-1"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                {stat.value}
              </div>
              <div
                className="text-xs text-silver/40 tracking-widest"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
        onClick={scrollToGames}
      >
        <span
          className="text-xs text-silver/30 tracking-widest"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          SCROLL
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown className="w-4 h-4 text-cyan/40" />
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(transparent, var(--bg-void))' }}
      />
    </section>
  )
}
