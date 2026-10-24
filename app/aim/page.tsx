'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Crosshair, Target, Trophy, Timer, Palette } from 'lucide-react'
import CustomCursor from '@/components/CustomCursor'
import { ThemeProvider, useTheme } from '@/components/theme'
import { THEMES, getBestAim, setBestAim, recordPlay } from '@/lib/arcade'

type TargetDot = { id: number; x: number; y: number; size: number; born: number }

const ROUND_SECONDS = 30
const TARGET_LIFETIME = 950

/**
 * AIM TRAINER — the arcade's second built-in game.
 * Thirty seconds, one arena, endless targets. Targets shrink away if you
 * dawdle, clicks on empty arena count as misses, and the pace quickens
 * as the clock runs down. Best score lives in this browser only.
 */
function AimInner() {
  const { theme, setTheme } = useTheme()
  const [running, setRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [targets, setTargets] = useState<TargetDot[]>([])
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [best, setBest] = useState<number | null>(null)
  const [pops, setPops] = useState<{ id: number; x: number; y: number }[]>([])
  const idRef = useRef(0)
  const arenaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setBest(getBestAim())
  }, [])

  const spawn = useCallback(() => {
    const arena = arenaRef.current
    if (!arena) return
    const rect = arena.getBoundingClientRect()
    const size = 52 + Math.random() * 44
    const x = Math.random() * Math.max(60, rect.width - size)
    const y = Math.random() * Math.max(60, rect.height - size)
    const id = ++idRef.current
    setTargets((t) => [...t.slice(-5), { id, x, y, size, born: Date.now() }])
    setTimeout(() => {
      setTargets((t) => t.filter((d) => d.id !== id))
    }, TARGET_LIFETIME)
  }, [])

  useEffect(() => {
    if (!running) return
    // Pace quickens: from ~700ms down to ~380ms as the round progresses.
    const elapsed = ROUND_SECONDS - timeLeft
    const interval = Math.max(380, 700 - elapsed * 12)
    const timer = setTimeout(spawn, interval)
    return () => clearTimeout(timer)
  }, [running, timeLeft, targets.length, spawn])

  useEffect(() => {
    if (!running) return
    if (timeLeft <= 0) {
      setRunning(false)
      setTargets([])
      const score = hits
      setBestAim(score)
      setBest(getBestAim())
      return
    }
    const clock = setTimeout(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearTimeout(clock)
  }, [running, timeLeft, hits])

  const start = () => {
    recordPlay('aim-trainer')
    setHits(0)
    setMisses(0)
    setPops([])
    setTargets([])
    setTimeLeft(ROUND_SECONDS)
    setRunning(true)
  }

  const hitTarget = (e: React.MouseEvent, dot: TargetDot) => {
    e.stopPropagation()
    setHits((h) => h + 1)
    setTargets((t) => t.filter((d) => d.id !== dot.id))
    const pop = { id: ++idRef.current, x: dot.x + dot.size / 2, y: dot.y }
    setPops((p) => [...p, pop])
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== pop.id)), 600)
  }

  const accuracy = hits + misses === 0 ? null : Math.round((hits / (hits + misses)) * 100)
  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0]

  return (
    <main className="min-h-screen px-6 py-10" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <CustomCursor />
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
            <ArrowLeft className="w-4 h-4" /> Back to the arcade
          </a>
          <button
            onClick={() => {
              const idx = THEMES.findIndex((t) => t.id === theme)
              setTheme(THEMES[(idx + 1) % THEMES.length].id)
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold tracking-widest"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            <Palette className="w-4 h-4" /> {current.label}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <span className="px-2 py-1 rounded text-xs" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', border: '1px solid var(--border)', color: 'var(--accent)', fontFamily: 'var(--font-orbitron)' }}>
            BUILT-IN · NEW IN V2.1
          </span>
          <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>NO INSTALL · NO ACCOUNT</span>
        </div>
        <h1 className="font-syne text-5xl md:text-6xl font-black mb-3" style={{ fontFamily: 'var(--font-syne)' }}>
          AIM <span style={{ color: 'var(--accent)' }}>TRAINER</span>
        </h1>
        <p className="leading-relaxed mb-8" style={{ color: 'var(--muted)' }}>
          Thirty seconds. Targets pop up and fade fast — click them before they vanish.
          Clicks on empty arena count as misses, and the pace quickens as the clock runs down.
        </p>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { icon: Timer, label: 'TIME', value: `${timeLeft}s` },
            { icon: Crosshair, label: 'HITS', value: `${hits}` },
            { icon: Target, label: 'ACCURACY', value: accuracy === null ? '—' : `${accuracy}%` },
            { icon: Trophy, label: 'BEST', value: best === null ? '—' : `${best}` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
              <s.icon className="w-4 h-4 mx-auto mb-2" style={{ color: 'var(--accent)' }} />
              <div className="font-orbitron font-black" style={{ fontFamily: 'var(--font-orbitron)' }}>{s.value}</div>
              <div className="text-[10px] tracking-widest mt-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {!running && timeLeft === ROUND_SECONDS && (
          <button
            onClick={start}
            className="w-full rounded-2xl py-6 font-orbitron font-black text-xl tracking-widest transition-transform hover:scale-[1.01] mb-6"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)', fontFamily: 'var(--font-orbitron)' }}
          >
            START 30-SECOND ROUND
          </button>
        )}
        {!running && timeLeft === 0 && (
          <div className="rounded-2xl p-6 text-center mb-6" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
            <p className="font-orbitron font-black text-3xl mb-1" style={{ fontFamily: 'var(--font-orbitron)' }}>
              {hits} HITS · {accuracy ?? 0}% ACCURACY
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
              {best !== null && hits >= best && hits > 0 ? 'New personal best — the cabinet remembers.' : 'The cabinet remembers your best. Beat it.'}
            </p>
            <button
              onClick={start}
              className="px-6 py-3 rounded-xl font-orbitron font-black text-sm tracking-widest"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)', fontFamily: 'var(--font-orbitron)' }}
            >
              GO AGAIN
            </button>
          </div>
        )}

        <div
          ref={arenaRef}
          onClick={() => running && setMisses((m) => m + 1)}
          className="relative w-full rounded-2xl overflow-hidden select-none"
          style={{ height: 440, background: 'var(--panel)', border: '1px solid var(--border)', cursor: running ? 'none' : 'default' }}
        >
          <div className="absolute inset-0 grid-bg opacity-60" />
          {!running && timeLeft === ROUND_SECONDS && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--muted)' }}>
              <span className="text-xs tracking-[0.3em]" style={{ fontFamily: 'var(--font-orbitron)' }}>PRESS START — TARGETS APPEAR HERE</span>
            </div>
          )}
          {targets.map((dot) => (
            <button
              key={dot.id}
              onClick={(e) => hitTarget(e, dot)}
              aria-label="Target"
              className="absolute rounded-full transition-transform hover:scale-110"
              style={{
                left: dot.x,
                top: dot.y,
                width: dot.size,
                height: dot.size,
                background: `radial-gradient(circle at 50% 50%, var(--accent) 0%, var(--accent) 35%, transparent 36%, var(--accent2) 37%, var(--accent2) 62%, transparent 63%)`,
                boxShadow: '0 0 18px var(--accent), 0 0 40px var(--accent)',
                border: '2px solid var(--on-accent)',
                animation: 'aim-target-in 0.18s ease-out',
              }}
            />
          ))}
          {pops.map((pop) => (
            <span
              key={pop.id}
              className="absolute font-orbitron font-black pointer-events-none"
              style={{ left: pop.x, top: pop.y, color: 'var(--accent)', fontFamily: 'var(--font-orbitron)', animation: 'aim-pop 0.6s ease-out forwards' }}
            >
              +1
            </span>
          ))}
        </div>
        <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>
          Tip: targets vanish after under a second — speed beats precision early, accuracy wins late.
        </p>
      </div>
      <style>{`
        @keyframes aim-target-in { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes aim-pop { from { transform: translate(-50%, 0); opacity: 1; } to { transform: translate(-50%, -28px); opacity: 0; } }
      `}</style>
    </main>
  )
}

export default function AimTrainerPage() {
  return (
    <ThemeProvider>
      <AimInner />
    </ThemeProvider>
  )
}
