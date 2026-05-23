'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Atom, Brain, Network, Zap, Wind, Users, ExternalLink } from 'lucide-react'

const EXPERIMENTS = [
  {
    id: 'multiplayer',
    icon: Users,
    title: 'MULTIPLAYER PSYCH',
    desc: 'Social dynamics as game loops. Collective behavior shaping emergent narratives.',
    color: '#FF2DA6',
    status: 'LIVE',
    url: 'https://multiplayer-psych.up.railway.app',
  },
  {
    id: 'proc-gen',
    icon: Atom,
    title: 'PROCEDURAL SYSTEMS',
    desc: 'Infinitely generated game states. No two sessions are alike. Entropy as a design principle.',
    color: '#00F5FF',
    status: 'ACTIVE',
  },
  {
    id: 'ai-assist',
    icon: Brain,
    title: 'AI-ASSISTED DEV',
    desc: 'Machine cognition augmenting creative processes. Human intuition + algorithmic synthesis.',
    color: '#7A5CFF',
    status: 'ACTIVE',
  },
  {
    id: 'chaos-sim',
    icon: Wind,
    title: 'CHAOS SIMULATIONS',
    desc: 'Butterfly effects at game scale. Small inputs triggering unpredictable macro outcomes.',
    color: '#FF2DA6',
    status: 'RESEARCH',
  },
  {
    id: 'physics',
    icon: Zap,
    title: 'PHYSICS ENGINES',
    desc: 'Custom constraint solvers. Real-time rigid body dynamics. Forces as gameplay mechanics.',
    color: '#C7FF4D',
    status: 'ACTIVE',
  },
  {
    id: 'network',
    icon: Network,
    title: 'NETWORKED REALITY',
    desc: 'Shared game states across distributed nodes. Consensus mechanisms in play.',
    color: '#00F5FF',
    status: 'PLANNED',
  },
]

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#C7FF4D',
  RESEARCH: '#FF2DA6',
  PLANNED: '#7A5CFF',
  LIVE:     '#00F5FF'
}

function ExperimentCard({ exp, index }: { exp: typeof EXPERIMENTS[0]; index: number }) {
  const Icon = exp.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative p-5 rounded-xl overflow-hidden"
      style={{
        background: 'rgba(8, 8, 24, 0.6)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(200px at 50% 0%, ${exp.color}06, transparent)` }}
      />

      {/* Top line accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${exp.color}, transparent)` }}
      />

      {/* Icon */}
      <div
        className="relative w-10 h-10 rounded-lg mb-4 flex items-center justify-center"
        style={{ background: `${exp.color}10`, border: `1px solid ${exp.color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color: exp.color }} strokeWidth={1.5} />
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: STATUS_COLORS[exp.status] }}
        />
        <span
          className="text-xs tracking-widest"
          style={{
            fontFamily: 'var(--font-orbitron)',
            color: STATUS_COLORS[exp.status],
            opacity: 0.7,
          }}
        >
          {exp.status}
        </span>
      </div>

    {/* Title */}
      <h3
        className="font-orbitron text-sm font-bold mb-2 tracking-wide text-white/80 group-hover:text-white transition-colors"
        style={{ fontFamily: 'var(--font-orbitron)' }}
      >
        {exp.title}
      </h3>

      {/* Desc */}
      <p className="text-silver/40 text-xs leading-relaxed">
        {exp.desc}
      </p>
    


      {exp.url && (
       <a  
        href={exp.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-widest transition-all duration-300"
        style={{
          background: `${exp.color}12`,
          border: `1px solid ${exp.color}40`,
          color: exp.color,
          fontFamily: 'var(--font-orbitron)',
        }}
      >
        <ExternalLink className="w-3 h-3" />
        ENTER LAB
      </a>
    )}


    </motion.div>
  )
}

export default function LabSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
 http://localhost:3000
  return (
    <section id="lab" className="relative py-32 px-6 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 40% at 20% 50%, rgba(122, 92, 255, 0.04) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 80% 50%, rgba(0, 245, 255, 0.03) 0%, transparent 70%)
          `,
        }}
      />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div ref={ref} className="mb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="w-8 h-px bg-purple/50" />
            <span
              className="text-xs tracking-widest text-purple/50"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              RESEARCH DIVISION
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <h2
              className="font-syne text-5xl md:text-7xl font-black mb-6"
              style={{ fontFamily: 'var(--font-syne)' }}
            >
              <span className="text-white">THE EXPERIMENT</span>
              <br />
              <span
                style={{
                  WebkitTextStroke: '1px rgba(122,92,255,0.5)',
                  color: 'transparent',
                }}
              >
                LAB
              </span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
            className="text-silver/40 max-w-xl leading-relaxed"
          >
            A digital sandbox where ideas exist before they have names. Concepts are prototyped, broken, and rebuilt. 
            The interesting failures live here too.
          </motion.p>
        </div>

        {/* Terminal-style header bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{
            background: 'rgba(8,8,24,0.8)',
            border: '1px solid rgba(122,92,255,0.2)',
            transformOrigin: 'left',
          }}
        >
          <div className="flex gap-1.5">
            {['#FF5F56', '#FFBD2E', '#27C93F'].map((c) => (
              <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <span
            className="text-xs text-silver/30 ml-2"
            style={{ fontFamily: 'var(--font-space-mono)' }}
          >
            lab@arcade:~$ ls experiments/
          </span>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPERIMENTS.map((exp, i) => (
            <ExperimentCard key={exp.id} exp={exp} index={i} />
          ))}
        </div>

        {/* Bottom quote */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mt-20 text-center"
        >
          <p
            className="text-2xl md:text-3xl text-white/10 font-syne italic"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            "The most interesting bugs become features."
          </p>
        </motion.div>
      </div>
    </section>
  )
}
