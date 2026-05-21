'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Lock, Loader } from 'lucide-react'

const UPCOMING_GAMES = [
  {
    id: 'signal-collapse',
    title: 'SIGNAL COLLAPSE',
    url: 'https://die-another-day.github.io/SIGNAL-COLLAPSE/',
    description:'Trace corrupted signals through collapsing neon infrastructure before the entire network fails.',
    tags: ['PUZZLE', 'NETWORK', 'DARK'],
    color: '#00F5FF',
    accent: 'rgba(0, 245, 255, 0.15)',
    border: 'rgba(0, 245, 255, 0.3)',
    progress: 100,
    eta: 'LIVE',
    shape: 'wave',
  },

{
  id: 'vi-battle',
  title: 'VI-Battle',
  url: 'https://vi-battle.vercel.app',
  description:
    'Voice-controlled neural combat simulator where phonetic commands directly control real-time cybernetic warfare.',
  tags: ['VOICE', 'COMBAT', 'AI'],
  color: '#00F5FF',
  accent: 'rgba(0, 245, 255, 0.15)',
  border: 'rgba(0, 245, 255, 0.3)',
  progress: 100,
  eta: 'LIVE',
  shape: 'neural',
},
  {
    id: 'quantum-drift',
    title: 'QUANTUM DRIFT',
    url: 'https://quantum-drift.netlify.app',
    description: 'Pilot through superposition states. Exist in multiple paths simultaneously until observed.',
    tags: ['PHYSICS', 'QUANTUM', 'RACING'],
    color: '#7A5CFF',
    accent: 'rgba(122, 92, 255, 0.15)',
    border: 'rgba(122, 92, 255, 0.3)',
    progress: 100,
    eta: 'LIVE',
    shape: 'circle',
  },
 {
    id: 'ctrl',
    title: 'CTRL',
    description: 'Control systems pushed to the breaking point. Every action triggers an unpredictable cascade.',
    tags: ['CONTROL', 'CHAOS', 'REACTION'],
    color: '#FF2DA6',
    accent: 'rgba(255, 45, 166, 0.15)',
    border: 'rgba(255, 45, 166, 0.3)',
    progress: 72,
    eta: 'Q2 2025',
    shape: 'triangle',
  },
  {
    id: 'glitch-runner',
    title: 'GLITCH RUNNER',
    description: 'Navigate corrupted digital landscapes. Reality is fragmented. Speed is your only weapon.',
    tags: ['RUNNER', 'GLITCH', 'SPEED'],
    color: '#C7FF4D',
    accent: 'rgba(199, 255, 77, 0.15)',
    border: 'rgba(199, 255, 77, 0.3)',
    progress: 48,
    eta: 'Q3 2025',
    shape: 'hex',
  },

]

// Unique shape previews per game
function GamePreview({ game }: { game: typeof UPCOMING_GAMES[0] }) {
  return (
    <div
      className="relative w-full aspect-video rounded-lg overflow-hidden"
      style={{ background: `radial-gradient(ellipse at center, ${game.accent}, transparent 70%)` }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(${game.color}08 1px, transparent 1px), linear-gradient(90deg, ${game.color}08 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />
      {/* Shape preview */}
      <div className="absolute inset-0 flex items-center justify-center">
        {game.shape === 'triangle' && (
          <div className="relative w-16 h-16 float">
            <div
              className="absolute inset-0"
              style={{
                borderLeft: '32px solid transparent',
                borderRight: '32px solid transparent',
                borderBottom: `56px solid ${game.color}40`,
                filter: `drop-shadow(0 0 20px ${game.color}80)`,
              }}
            />
          </div>
        )}
        {game.shape === 'hex' && (
          <div
            className="w-16 h-14 float"
            style={{
              background: `${game.color}30`,
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
              boxShadow: `0 0 30px ${game.color}60`,
            }}
          />
        )}
        {game.shape === 'circle' && (
          <div
            className="w-16 h-16 rounded-full float-delay-1"
            style={{
              border: `2px solid ${game.color}60`,
              boxShadow: `0 0 30px ${game.color}40, inset 0 0 20px ${game.color}20`,
            }}
          />
        )}
        {game.shape === 'wave' && (
          <div
            className="w-20 h-8 float-delay-2"
            style={{
              background: `${game.color}20`,
              borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
              boxShadow: `0 0 20px ${game.color}40`,
            }}
          />
        )}
      </div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-end justify-end p-3">
        <Lock className="w-3 h-3" style={{ color: `${game.color}40` }} />
      </div>
      {/* Corner decorations */}
      <div className="absolute top-2 left-2 w-4 h-4" style={{ borderLeft: `1px solid ${game.color}30`, borderTop: `1px solid ${game.color}30` }} />
      <div className="absolute bottom-2 right-2 w-4 h-4" style={{ borderRight: `1px solid ${game.color}30`, borderBottom: `1px solid ${game.color}30` }} />
    </div>
  )
}

function GameCard({ game, index }: { game: typeof UPCOMING_GAMES[0]; index: number }) {
  const [hovered, setHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const cardRef = useRef<HTMLDivElement>(null)

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      ref={cardRef}
      className="relative rounded-xl overflow-hidden group cursor-none"
      onMouseMove={onMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'rgba(13, 13, 34, 0.6)',
        border: `1px solid ${hovered ? game.border : 'rgba(255,255,255,0.06)'}`,
        transition: 'border-color 0.3s, transform 0.3s',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      data-cursor="hover"
    >
      {/* Mouse glow */}
      {hovered && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(300px at ${mousePos.x}% ${mousePos.y}%, ${game.color}08, transparent 50%)`,
          }}
        />
      )}

      {/* Top progress bar */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `rgba(255,255,255,0.05)` }}>
        <motion.div
          className="h-full"
          style={{ background: game.color, boxShadow: `0 0 8px ${game.color}` }}
          initial={{ width: 0 }}
          whileInView={{ width: `${game.progress}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.3 + index * 0.1 }}
        />
      </div>

      <div className="p-5">
        {/* Preview */}
        <GamePreview game={game} />

        {/* Status + ETA */}
        <div className="flex items-center justify-between mt-4 mb-3">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
            style={{
              background: `${game.color}10`,
              border: `1px solid ${game.color}30`,
              color: game.color,
              fontFamily: 'var(--font-orbitron)',
            }}
          >
            <Loader className="w-2.5 h-2.5 animate-spin" />
            {game.url ? 'LIVE' : 'COMING SOON'}
          </div>
          <span
            className="text-xs text-silver/30"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            ETA {game.eta}
          </span>
        </div>

        {/* Title */}
        <h3
          className="font-orbitron text-xl font-black mb-2 transition-colors duration-300"
          style={{
            fontFamily: 'var(--font-orbitron)',
            color: hovered ? game.color : 'rgba(240, 240, 255, 0.9)',
          }}
        >
          {game.title}
        </h3>

        {/* Description */}
        <p className="text-silver/40 text-sm leading-relaxed mb-4">
          {game.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {game.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded"
              style={{
                border: `1px solid ${game.color}15`,
                color: `${game.color}50`,
                fontFamily: 'var(--font-orbitron)',
                background: `${game.color}05`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-silver/30" style={{ fontFamily: 'var(--font-orbitron)' }}>
              DEV PROGRESS
            </span>
            <span className="text-xs font-bold" style={{ color: game.color, fontFamily: 'var(--font-orbitron)' }}>
              {game.progress}%
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${game.color}80, ${game.color})` }}
              initial={{ width: 0 }}
              whileInView={{ width: `${game.progress}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, delay: 0.5 + index * 0.1 }}
            />
          </div>
        </div>

        {game.url && (
          <a
            href={game.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block text-center py-2 rounded text-xs font-bold tracking-widest"
            style={{
              background: `${game.color}15`,
              border: `1px solid ${game.color}40`,
              color: game.color,
              fontFamily: 'var(--font-orbitron)',
            }}
          >
            PLAY NOW ↗
          </a>
        )}
      </div>
    </motion.div>
  )
}

export default function GameGrid() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-20 px-6" id="upcoming">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div ref={ref}>
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="w-8 h-px bg-pink/50" />
            <span
              className="text-xs tracking-widest text-pink/50"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              IN DEVELOPMENT
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-syne text-5xl md:text-7xl font-black text-white mb-4"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            COMING SOON
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            className="text-silver/40 max-w-lg mb-16"
          >
            The arcade expands. Each experiment pushing further into the unknown.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {UPCOMING_GAMES.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
