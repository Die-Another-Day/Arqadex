'use client'

import { motion } from 'framer-motion'
import { Terminal, Shield, Code, Cpu, Flame } from 'lucide-react'

const SKILLS = [
  { label: 'CREATIVE CODING', val: 95, color: '#00F5FF' },
  { label: 'GAME MECHANICS', val: 88, color: '#7A5CFF' },
  { label: 'CYBERSECURITY', val: 80, color: '#FF2DA6' },
  { label: 'AI SYSTEMS', val: 75, color: '#C7FF4D' },
  { label: 'PHYSICS SIM', val: 82, color: '#FF3410' },
]

const TRAITS = [
  { icon: Code, label: 'CREATIVE CODING', desc: 'WebGL, canvas, procedural systems' },
  { icon: Shield, label: 'CYBERSECURITY', desc: 'Security research meets creative tech' },
  { icon: Cpu, label: 'AI-ASSISTED', desc: 'Machine learning as creative partner' },
  { icon: Flame, label: 'CHAOS-DRIVEN', desc: 'Entropy is a feature, not a bug' },
]

export default function AboutSection() {
  return (
    <section id="about" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-px" style={{ background: 'var(--accent)' }} />
          <span className="text-xs tracking-widest" style={{ color: 'var(--accent)', fontFamily: 'var(--font-orbitron)' }}>
            OPERATOR PROFILE
          </span>
        </div>
        <h2 className="font-syne text-5xl md:text-7xl font-black mb-12" style={{ color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>
          ABOUT
        </h2>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-2xl p-6 md:p-8"
            style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Terminal className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <span className="font-orbitron font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>operator.sys</span>
            </div>
            <div className="space-y-3 font-mono text-sm mb-8" style={{ fontFamily: 'var(--font-space-mono)', color: 'var(--muted)' }}>
              <p><span style={{ color: 'var(--accent)' }}>&gt; whoami</span><br />indie_developer + security_researcher</p>
              <p><span style={{ color: 'var(--accent)' }}>&gt; cat expertise.txt</span><br />creative_coding | cybersecurity | AI</p>
              <p><span style={{ color: 'var(--accent)' }}>&gt; cat mission.txt</span><br />experimental games as digital art</p>
              <p><span style={{ color: 'var(--accent)' }}>&gt; _▌</span></p>
            </div>
            <p className="leading-relaxed" style={{ color: 'var(--muted)' }}>
              An indie developer operating at the intersection of creative coding, cybersecurity, and
              experimental game design. Building interactive experiences that challenge the boundaries
              between art, technology, and play. Every game is an experiment. Every mechanic is a hypothesis.
              The interesting questions live at the edge of expected behaviour.
            </p>
            <p className="mt-6 italic" style={{ color: 'var(--muted)' }}>
              “If it doesn&apos;t break, it wasn&apos;t interesting enough.”
            </p>
          </motion.div>

          <div>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {TRAITS.map((trait) => (
                <motion.div
                  key={trait.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-4 rounded-xl"
                  style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
                >
                  <trait.icon className="w-5 h-5 mb-2" style={{ color: 'var(--accent)' }} />
                  <h3 className="font-orbitron text-sm font-bold mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>{trait.label}</h3>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>{trait.desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="rounded-2xl p-6" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
              <h3 className="font-orbitron text-sm tracking-widest mb-5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>
                CAPABILITY MATRIX <span className="normal-case tracking-normal">(SELF-RATED)</span>
              </h3>
              <div className="space-y-4">
                {SKILLS.map((skill) => (
                  <div key={skill.label}>
                    <div className="flex justify-between text-xs mb-1.5" style={{ fontFamily: 'var(--font-orbitron)' }}>
                      <span style={{ color: 'var(--muted)' }}>{skill.label}</span>
                      <span style={{ color: skill.color }}>{skill.val}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: skill.color }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.val}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-2xl p-6 md:p-8 flex flex-wrap items-center justify-between gap-4" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
          <div>
            <h3 className="font-orbitron font-bold text-lg mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>BUILT SOMETHING WEIRD?</h3>
            <p style={{ color: 'var(--muted)' }}>ARQADEX is open to creators. Submit your experimental game — if it fits the lab, we publish it here.</p>
          </div>
          <a href="/submit/" className="px-6 py-3 rounded-lg text-xs font-bold tracking-widest shrink-0" style={{ background: 'var(--accent)', color: 'var(--on-accent)', fontFamily: 'var(--font-orbitron)' }}>
            SUBMIT YOUR GAME ↗
          </a>
        </div>
      </div>
    </section>
  )
}
