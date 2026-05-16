'use client'

import { motion } from 'framer-motion'
import { Github, Linkedin, Mail, Terminal } from 'lucide-react'

const LINKS = [
  { icon: Github, label: 'GITHUB', href: 'https://github.com' },
  { icon: Linkedin, label: 'LINKEDIN', href: 'https://linkedin.com' },
  { icon: Mail, label: 'CONTACT', href: 'mailto:hello@arcadelab.dev' },
]

export default function Footer() {
  return (
    <footer className="relative py-16 px-6 overflow-hidden">
      {/* Top animated neon divider */}
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14"
          style={{ transformOrigin: 'left' }}
        >
          <div
            className="h-px"
            style={{
              background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-pink), var(--accent-purple), var(--accent-cyan))',
              backgroundSize: '300% 100%',
              animation: 'border-flow 4s linear infinite',
              opacity: 0.4,
            }}
          />
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 items-center mb-14">
          {/* Logo & tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-cyan/20 rounded rotate-45" />
                <div className="absolute inset-1 bg-void rounded rotate-45" />
                <Terminal className="absolute inset-0 m-auto w-4 h-4 text-cyan" strokeWidth={1.5} />
              </div>
              <span
                className="font-orbitron text-sm font-bold tracking-widest"
                style={{ fontFamily: 'var(--font-orbitron)' }}
              >
                ARCADE<span style={{ color: 'var(--accent-cyan)' }}>LAB</span>
              </span>
            </div>
            <p
              className="text-xs text-silver/30 leading-relaxed"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              Experimental Web Games<br />& Interactive Chaos.
            </p>
          </motion.div>

          {/* Center: signature */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center"
          >
            <div
              className="font-syne text-3xl font-black mb-2"
              style={{
                fontFamily: 'var(--font-syne)',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-pink))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                opacity: 0.4,
              }}
            >
              Built for chaos.
            </div>
            <div
              className="text-xs tracking-widest text-silver/20"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              © 2025 ARCADE LAB
            </div>
          </motion.div>

          {/* Right: Social links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex md:justify-end gap-3"
          >
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                data-cursor="hover"
              >
                <link.icon className="w-4 h-4 text-silver/40 group-hover:text-cyan transition-colors" strokeWidth={1.5} />
                <span
                  className="text-xs text-silver/30 group-hover:text-cyan/70 tracking-widest transition-colors"
                  style={{ fontFamily: 'var(--font-orbitron)' }}
                >
                  {link.label}
                </span>
              </a>
            ))}
          </motion.div>
        </div>

        {/* Bottom: system info */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5"
        >
          <div className="flex items-center gap-6">
            <span
              className="text-xs text-silver/20"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              system.status: <span style={{ color: 'var(--accent-cyan)', opacity: 0.5 }}>ONLINE</span>
            </span>
            <span
              className="text-xs text-silver/20"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              uptime: <span style={{ color: 'var(--accent-lime)', opacity: 0.5 }}>99.9%</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan/40 status-live" />
            <span
              className="text-xs text-silver/20"
              style={{ fontFamily: 'var(--font-space-mono)' }}
            >
              experiments running in background...
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
