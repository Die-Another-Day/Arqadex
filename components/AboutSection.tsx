'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Terminal, Shield, Code, Cpu, Flame } from 'lucide-react'

const SKILLS = [
  { label: 'CREATIVE CODING', val: 95, color: '#00F5FF' },
  { label: 'GAME MECHANICS', val: 88, color: '#7A5CFF' },
  { label: 'CYBERSECURITY', val: 80, color: '#FF2DA6' },
  { label: 'AI SYSTEMS', val: 75, color: '#C7FF4D' },
  { label: 'PHYSICS SIM', val: 82, color: '#00F5FF' },
]

const TRAITS = [
  { icon: Code, label: 'CREATIVE CODING', desc: 'WebGL, canvas, procedural systems' },
  { icon: Shield, label: 'CYBERSECURITY', desc: 'Security research meets creative tech' },
  { icon: Cpu, label: 'AI-ASSISTED', desc: 'Machine learning as creative partner' },
  { icon: Flame, label: 'CHAOS-DRIVEN', desc: 'Entropy is a feature, not a bug' },
]

function SkillBar({ skill, index }: { skill: typeof SKILLS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="mb-4"
    >
      <div className="flex justify-between items-center mb-1.5">
        <span
          className="text-xs tracking-widest text-silver/50"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          {skill.label}
        </span>
        <span
          className="text-xs font-bold"
          style={{ color: skill.color, fontFamily: 'var(--font-orbitron)' }}
        >
          {skill.val}%
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${skill.color}60, ${skill.color})`,
            boxShadow: `0 0 8px ${skill.color}60`,
          }}
          initial={{ width: 0 }}
          whileInView={{ width: `${skill.val}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.3 + index * 0.08, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}

export default function AboutSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="about" className="relative py-32 px-6">
      {/* Ambient bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,245,255,0.02), transparent)',
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Section label */}
        <div ref={ref}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className="flex items-center gap-4 mb-4"
          >
            <div className="w-8 h-px bg-cyan/50" />
            <span
              className="text-xs tracking-widest text-cyan/50"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              OPERATOR PROFILE
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-syne text-5xl md:text-7xl font-black text-white mb-16"
            style={{ fontFamily: 'var(--font-syne)' }}
          >
            ABOUT
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left: Profile terminal */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.2 }}
          >
            {/* Terminal card */}
            <div
              className="rounded-xl overflow-hidden mb-8"
              style={{
                background: 'rgba(8,8,24,0.8)',
                border: '1px solid rgba(0,245,255,0.1)',
              }}
            >
              {/* Terminal header */}
              <div
                className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: 'rgba(0,245,255,0.08)' }}
              >
                <div className="flex gap-1.5">
                  {['#FF5F56', '#FFBD2E', '#27C93F'].map((c) => (
                    <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <Terminal className="w-3.5 h-3.5 text-cyan/30 ml-1" />
                <span
                  className="text-xs text-silver/30"
                  style={{ fontFamily: 'var(--font-space-mono)' }}
                >
                  operator.sys
                </span>
              </div>

              {/* Terminal body */}
              <div className="p-5">
                {[
                  { prefix: '>', text: 'whoami', color: '#00F5FF' },
                  { prefix: ' ', text: 'indie_developer + security_researcher', color: '#A0A0C0' },
                  { prefix: '>', text: 'cat expertise.txt', color: '#00F5FF' },
                  { prefix: ' ', text: 'creative_coding | cybersecurity | AI', color: '#A0A0C0' },
                  { prefix: '>', text: 'cat mission.txt', color: '#00F5FF' },
                  { prefix: ' ', text: 'experimental games as digital art', color: '#7A5CFF' },
                  { prefix: '>', text: '_', color: '#00F5FF' },
                ].map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                    className="flex items-start gap-2 mb-1.5"
                  >
                    <span
                      className="text-sm select-none"
                      style={{ color: line.prefix === '>' ? line.color : 'transparent', fontFamily: 'var(--font-space-mono)' }}
                    >
                      {line.prefix}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: line.color, fontFamily: 'var(--font-space-mono)' }}
                    >
                      {line.text}
                      {line.text === '_' && (
                        <span
                          className="animate-pulse"
                          style={{ animation: 'status-pulse 1s ease-in-out infinite' }}
                        >
                          ▌
                        </span>
                      )}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Trait cards */}
            <div className="grid grid-cols-2 gap-3">
              {TRAITS.map((trait, i) => (
                <motion.div
                  key={trait.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="p-3 rounded-lg group hover:border-cyan/20 transition-colors"
                  style={{
                    background: 'rgba(13,13,34,0.5)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <trait.icon className="w-4 h-4 text-cyan/40 mb-2 group-hover:text-cyan/70 transition-colors" />
                  <div
                    className="text-xs text-white/60 font-bold mb-1"
                    style={{ fontFamily: 'var(--font-orbitron)' }}
                  >
                    {trait.label}
                  </div>
                  <div className="text-xs text-silver/30" style={{ fontFamily: 'var(--font-space-mono)' }}>
                    {trait.desc}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Description + Skills */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.4 }}
          >
            <p className="text-xl text-white/70 leading-relaxed mb-4 font-syne" style={{ fontFamily: 'var(--font-syne)' }}>
              An indie developer operating at the intersection of{' '}
              <span className="text-cyan">creative coding</span>,{' '}
              <span className="text-pink">cybersecurity</span>, and{' '}
              <span className="text-purple">experimental game design</span>.
            </p>

            <p className="text-silver/40 leading-relaxed mb-10">
              Building interactive experiences that challenge the boundaries between art, technology, and play. 
              Every game is an experiment. Every mechanic is a hypothesis. 
              The interesting questions live at the edge of expected behaviour.
            </p>

            {/* Skills */}
            <div
              className="p-5 rounded-xl mb-6"
              style={{
                background: 'rgba(8,8,24,0.6)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div
                className="text-xs tracking-widest text-silver/30 mb-5"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                CAPABILITY MATRIX
              </div>
              {SKILLS.map((skill, i) => (
                <SkillBar key={skill.label} skill={skill} index={i} />
              ))}
            </div>

            {/* Motto */}
            <div
              className="p-4 rounded-lg border-l-2 border-pink"
              style={{ background: 'rgba(255,45,166,0.04)' }}
            >
              <p
                className="text-sm italic text-silver/50"
                style={{ fontFamily: 'var(--font-space-mono)' }}
              >
                "If it doesn&apos;t break, it wasn&apos;t interesting enough."
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
