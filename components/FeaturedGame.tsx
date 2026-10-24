'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Zap, Cpu, Globe, Brain } from 'lucide-react'
import { GAMES } from '@/lib/games'
import { recordPlay } from '@/lib/arcade'

const GAME = GAMES.find((g) => g.id === 'protocol-zero')!

export default function FeaturedGame() {
  return (
    <section id="featured" className="relative py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-px" style={{ background: 'var(--accent)' }} />
          <span className="text-xs tracking-widest" style={{ color: 'var(--accent)', fontFamily: 'var(--font-orbitron)' }}>
            FEATURED RELEASE
          </span>
        </div>
        <h2 className="font-syne text-4xl md:text-6xl font-black mb-12" style={{ color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>
          NOW PLAYING
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className="grid md:grid-cols-2 gap-8 items-stretch rounded-2xl overflow-hidden"
          style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
        >
          {/* Animated thumbnail */}
          <div className="relative aspect-video md:aspect-auto md:min-h-[340px] overflow-hidden" style={{ background: `radial-gradient(ellipse at center, ${GAME.color}22, var(--bg) 70%)` }}>
            <div className="absolute inset-0 grid-bg opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-36 h-36 rounded-full" style={{ border: `2px solid ${GAME.color}44`, boxShadow: `0 0 40px ${GAME.color}44` }} />
              <div className="absolute w-24 h-24 rounded-full animate-pulse" style={{ border: `2px solid ${GAME.color}bb`, boxShadow: `0 0 25px ${GAME.color}77` }} />
              <div className="absolute w-6 h-6 rounded-full" style={{ background: GAME.color, boxShadow: `0 0 12px ${GAME.color}, 0 0 30px ${GAME.color}` }} />
              <div className="absolute w-40 h-[2px] rotate-45" style={{ background: `linear-gradient(to right, transparent, ${GAME.color}, transparent)`, opacity: 0.9 }} />
            </div>
            <div className="absolute top-3 left-3 w-5 h-5" style={{ borderLeft: `1px solid ${GAME.color}66`, borderTop: `1px solid ${GAME.color}66` }} />
            <div className="absolute top-3 right-3 w-5 h-5" style={{ borderRight: `1px solid ${GAME.color}66`, borderTop: `1px solid ${GAME.color}66` }} />
            <div className="absolute bottom-3 left-3 w-5 h-5" style={{ borderLeft: `1px solid ${GAME.color}66`, borderBottom: `1px solid ${GAME.color}66` }} />
            <div className="absolute bottom-3 right-3 w-5 h-5" style={{ borderRight: `1px solid ${GAME.color}66`, borderBottom: `1px solid ${GAME.color}66` }} />
            <span className="absolute inset-0 flex items-center justify-center font-orbitron text-3xl font-black opacity-10 tracking-widest select-none" style={{ color: GAME.color, fontFamily: 'var(--font-orbitron)' }}>
              PROTOCOL
            </span>
          </div>

          <div className="p-6 md:p-10 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded text-xs" style={{ background: `${GAME.color}18`, border: `1px solid ${GAME.color}55`, color: GAME.color, fontFamily: 'var(--font-orbitron)' }}>
                <span className="w-2 h-2 rounded-full status-live" style={{ background: GAME.color }} /> LIVE // DEPLOYED
              </span>
              <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>v1.0.0 · SOLO · WEB</span>
            </div>
            <h3 className="font-orbitron text-3xl md:text-4xl font-black mb-4" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>
              {GAME.title}
            </h3>
            <p className="leading-relaxed mb-6" style={{ color: 'var(--muted)' }}>{GAME.tagline}</p>
            <div className="grid grid-cols-2 gap-3 mb-8 text-sm">
              {[
                { icon: Zap, label: 'Reflex under pressure' },
                { icon: Brain, label: 'Decision patterns' },
                { icon: Cpu, label: 'Neural simulations' },
                { icon: Globe, label: 'Runs in your browser' },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                  <f.icon className="w-4 h-4 shrink-0" style={{ color: GAME.color }} />
                  {f.label}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-8">
              {GAME.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-xs rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-auto">
              <a
                href={GAME.url}
                onClick={() => recordPlay(GAME.id)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-sm font-bold tracking-widest transition-transform hover:scale-[1.02]"
                style={{ background: GAME.color, color: '#0a0a12', fontFamily: 'var(--font-orbitron)' }}
              >
                PLAY NOW <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
