'use client'

import { motion } from 'framer-motion'
import { Atom, Brain, Network, Zap, Wind, Users, ExternalLink } from 'lucide-react'

const EXPERIMENTS = [
  { id: 'multiplayer', icon: Users, title: 'MULTIPLAYER PSYCH', desc: 'Social dynamics as game loops. Collective behavior shaping emergent narratives.', color: '#FF2DA6', status: 'LIVE', url: '/multiplayer-psych/' },
  { id: 'proc-gen', icon: Atom, title: 'PROCEDURAL SYSTEMS', desc: 'Infinitely generated game states. No two sessions are alike. Entropy as a design principle.', color: '#00F5FF', status: 'ACTIVE' },
  { id: 'ai-assist', icon: Brain, title: 'AI-ASSISTED DEV', desc: 'Machine cognition augmenting creative processes. Human intuition + algorithmic synthesis.', color: '#7A5CFF', status: 'ACTIVE' },
  { id: 'chaos-sim', icon: Wind, title: 'CHAOS SIMULATIONS', desc: 'Butterfly effects at game scale. Small inputs triggering unpredictable macro outcomes.', color: '#FF2DA6', status: 'RESEARCH' },
  { id: 'physics', icon: Zap, title: 'PHYSICS ENGINES', desc: 'Custom constraint solvers. Real-time rigid body dynamics. Forces as gameplay mechanics.', color: '#C7FF4D', status: 'ACTIVE' },
  { id: 'network', icon: Network, title: 'NETWORKED REALITY', desc: 'Shared game states across distributed nodes. Consensus mechanisms in play.', color: '#00F5FF', status: 'PLANNED' },
]

export default function LabSection() {
  return (
    <section id="lab" className="relative py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-px" style={{ background: 'var(--accent3)' }} />
          <span className="text-xs tracking-widest" style={{ color: 'var(--accent3)', fontFamily: 'var(--font-orbitron)' }}>
            RESEARCH DIVISION
          </span>
        </div>
        <h2 className="font-syne text-5xl md:text-7xl font-black mb-4" style={{ color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>
          THE EXPERIMENT LAB
        </h2>
        <p className="max-w-lg mb-4" style={{ color: 'var(--muted)' }}>
          A digital sandbox where ideas exist before they have names. Concepts are prototyped, broken, and rebuilt. The interesting failures live here too.
        </p>
        <p className="font-mono text-sm mb-12 px-4 py-3 rounded-lg inline-block" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--accent)', fontFamily: 'var(--font-space-mono)' }}>
          lab@arcade:~$ ls experiments/
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPERIMENTS.map((exp, index) => {
            const Icon = exp.icon
            const card = (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className="group relative p-5 rounded-xl overflow-hidden h-full"
                style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg" style={{ background: `${exp.color}14`, border: `1px solid ${exp.color}33` }}>
                    <Icon className="w-5 h-5" style={{ color: exp.color }} />
                  </div>
                  <span className="px-2 py-1 rounded text-[11px]" style={{ background: `${exp.color}12`, border: `1px solid ${exp.color}33`, color: exp.color, fontFamily: 'var(--font-orbitron)' }}>
                    {exp.status}
                  </span>
                </div>
                <h3 className="font-orbitron font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>
                  {exp.title}
                  {exp.url && <ExternalLink className="w-3.5 h-3.5" style={{ color: exp.color }} />}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{exp.desc}</p>
              </motion.div>
            )
            return exp.url ? (
              <a key={exp.id} href={exp.url} className="block">{card}</a>
            ) : (
              <div key={exp.id}>{card}</div>
            )
          })}
        </div>

        <p className="mt-12 text-center italic" style={{ color: 'var(--muted)' }}>
          “The most interesting bugs become features.”
        </p>
      </div>
    </section>
  )
}
