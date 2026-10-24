'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Zap, Trophy, RotateCcw, Timer } from 'lucide-react'
import { getBestReflex, setBestReflex, recordPlay } from '@/lib/arcade'
import CustomCursor from '@/components/CustomCursor'

type Phase = 'idle' | 'waiting' | 'ready' | 'too-soon' | 'result'

function verdict(ms: number) {
  if (ms < 180) return 'Inhuman. Are you a machine?'
  if (ms < 230) return 'Pro-gamer reflexes.'
  if (ms < 300) return 'Sharp. Faster than most humans.'
  if (ms < 400) return 'Solid — keep warming up.'
  return 'The lab believes in you. Try again.'
}

export default function ReflexRushPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [last, setLast] = useState<number | null>(null)
  const [attempts, setAttempts] = useState<number[]>([])
  const [best, setBest] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef = useRef(0)

  useEffect(() => {
    setBest(getBestReflex())
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const start = () => {
    recordPlay('reflex-rush')
    setPhase('waiting')
    setLast(null)
    const delay = 1500 + Math.random() * 2500
    timerRef.current = setTimeout(() => {
      startRef.current = performance.now()
      setPhase('ready')
    }, delay)
  }

  const tap = () => {
    if (phase === 'waiting') {
      if (timerRef.current) clearTimeout(timerRef.current)
      setPhase('too-soon')
      return
    }
    if (phase === 'ready') {
      const ms = Math.round(performance.now() - startRef.current)
      setLast(ms)
      setAttempts((a) => [ms, ...a].slice(0, 5))
      setBestReflex(ms)
      setBest(getBestReflex())
      setPhase('result')
    }
  }

  const avg = attempts.length ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length) : null

  const panelStyle =
    phase === 'ready'
      ? { background: 'var(--accent)', color: 'var(--on-accent)', border: '1px solid var(--accent)' }
      : phase === 'too-soon'
        ? { background: '#ff2d2d22', color: '#ff6b6b', border: '1px solid #ff2d2d55' }
        : { background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--border)' }

  return (
    <main className="min-h-screen px-6 py-10" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <CustomCursor />
      <div className="max-w-3xl mx-auto">
        <a href="/" className="inline-flex items-center gap-2 text-sm mb-8" style={{ color: 'var(--muted)' }}>
          <ArrowLeft className="w-4 h-4" /> Back to the arcade
        </a>

        <div className="flex items-center gap-3 mb-3">
          <span className="px-2 py-1 rounded text-xs" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', border: '1px solid var(--border)', color: 'var(--accent)', fontFamily: 'var(--font-orbitron)' }}>
            BUILT-IN · NEW IN V2
          </span>
          <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>NO INSTALL · NO ACCOUNT</span>
        </div>
        <h1 className="font-syne text-5xl md:text-6xl font-black mb-3" style={{ fontFamily: 'var(--font-syne)' }}>
          REFLEX <span style={{ color: 'var(--accent)' }}>RUSH</span>
        </h1>
        <p className="leading-relaxed mb-8" style={{ color: 'var(--muted)' }}>
          Wait for the panel to flash, then tap it as fast as you can. Tap too early and it counts
          as a false start. Your best time is saved in this browser only.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Trophy, label: 'BEST', value: best === null ? '—' : `${best}ms` },
            { icon: Timer, label: 'LAST', value: last === null ? '—' : `${last}ms` },
            { icon: Zap, label: 'AVG (LAST 5)', value: avg === null ? '—' : `${avg}ms` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
              <s.icon className="w-4 h-4 mx-auto mb-2" style={{ color: 'var(--accent)' }} />
              <div className="font-orbitron font-black" style={{ fontFamily: 'var(--font-orbitron)' }}>{s.value}</div>
              <div className="text-[10px] tracking-widest mt-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={phase === 'idle' || phase === 'result' || phase === 'too-soon' ? start : tap}
          className="w-full rounded-2xl min-h-[280px] flex flex-col items-center justify-center gap-3 p-8 transition-all select-none"
          style={panelStyle}
        >
          {phase === 'idle' && (
            <>
              <Zap className="w-10 h-10" />
              <span className="font-orbitron font-black text-xl md:text-2xl tracking-widest" style={{ fontFamily: 'var(--font-orbitron)' }}>TAP TO START</span>
              <span className="text-sm opacity-70">The flash comes when you least expect it.</span>
            </>
          )}
          {phase === 'waiting' && (
            <>
              <span className="font-orbitron font-black text-xl md:text-2xl tracking-widest animate-pulse" style={{ fontFamily: 'var(--font-orbitron)' }}>WAIT FOR IT…</span>
              <span className="text-sm opacity-70">Don&apos;t tap yet. Seriously.</span>
            </>
          )}
          {phase === 'ready' && (
            <span className="font-orbitron font-black text-3xl md:text-5xl tracking-widest" style={{ fontFamily: 'var(--font-orbitron)' }}>TAP NOW!</span>
          )}
          {phase === 'too-soon' && (
            <>
              <span className="font-orbitron font-black text-xl md:text-2xl tracking-widest" style={{ fontFamily: 'var(--font-orbitron)' }}>FALSE START!</span>
              <span className="text-sm opacity-80">You jumped the gun. Tap to try again.</span>
            </>
          )}
          {phase === 'result' && last !== null && (
            <>
              <span className="font-orbitron font-black text-4xl md:text-6xl" style={{ fontFamily: 'var(--font-orbitron)' }}>{last}ms</span>
              <span className="text-sm opacity-80">{verdict(last)}</span>
              <span className="flex items-center gap-2 text-xs font-bold tracking-widest mt-2" style={{ fontFamily: 'var(--font-orbitron)' }}>
                <RotateCcw className="w-3.5 h-3.5" /> TAP TO GO AGAIN
              </span>
            </>
          )}
        </button>

        {attempts.length > 0 && (
          <div className="mt-6 rounded-xl p-5" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
            <h2 className="font-orbitron text-xs tracking-widest mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>RECENT ATTEMPTS</h2>
            <div className="flex flex-wrap gap-2">
              {attempts.map((a, i) => (
                <span key={`${a}-${i}`} className="px-3 py-1.5 rounded-full text-sm font-bold" style={{ border: '1px solid var(--border)', color: a === best ? 'var(--accent)' : 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>
                  {a}ms {a === best ? '★' : ''}
                </span>
              ))}
            </div>
            <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>
              Tip: your best time also shows up in Your Cabinet on the home page.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
