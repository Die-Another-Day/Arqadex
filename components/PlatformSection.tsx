'use client'

import { motion } from 'framer-motion'
import { Zap, Users, Upload, ArrowRight } from 'lucide-react'

/* v2.5.0 — Phase 1 of the Arqadex company pivot: the site stops
   presenting itself as only an arcade lab and starts presenting
   itself as a platform. Everything claimed here is already true:
   instant play works today, game links are shareable today, and
   developer submissions go through the existing review form.
   Live multiplayer rooms are explicitly marked as next, not live. */

const PILLARS = [
  {
    icon: Zap,
    color: '#00F5FF',
    title: 'PLAY INSTANTLY',
    desc: 'Every game on Arqadex opens in your browser in seconds. No downloads, no installs, no app store — on phone or desktop, it just plays.',
    tag: 'LIVE TODAY',
  },
  {
    icon: Users,
    color: '#FF2DA6',
    title: 'PLAY TOGETHER',
    desc: 'Send any game link to a friend or your partner and they open it instantly, no download on their side either. And now live rooms are real: NEON DUEL lets you create a room, share the link, and duel a partner or a group in real time, peer-to-peer.',
    tag: 'LIVE ROOMS: NEON DUEL',
  },
  {
    icon: Upload,
    color: '#7A5CFF',
    title: 'PUBLISH HERE',
    desc: 'Built a web game? Submit it to Arqadex and reach players instantly. Developers keep 70% of the ad revenue their game earns, Arqadex keeps 30%. Every submission is reviewed by a human before it goes live.',
    tag: 'DEVELOPER PROGRAM',
  },
]

export default function PlatformSection() {
  return (
    <section id="platform" className="relative py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-px" style={{ background: 'var(--accent)' }} />
          <span className="text-xs tracking-widest" style={{ color: 'var(--accent)', fontFamily: 'var(--font-orbitron)' }}>
            ARQADEX AS A PLATFORM
          </span>
        </div>
        <h2 className="font-black text-5xl md:text-7xl mb-4" style={{ color: 'var(--text)', fontFamily: 'var(--font-syne)' }}>
          NO DOWNLOADS.
          <br />
          <span style={{ color: 'var(--accent)' }}>JUST PLAY.</span>
        </h2>
        <p className="max-w-xl mb-12" style={{ color: 'var(--muted)' }}>
          Arqadex is becoming the place where games are played the moment you find them —
          alone, with friends, or as a couple — and where the people who make games get paid for it.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {PILLARS.map((p, index) => {
            const Icon = p.icon
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className="group relative p-6 rounded-xl overflow-hidden h-full"
                style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg" style={{ background: `${p.color}14`, border: `1px solid ${p.color}33` }}>
                    <Icon className="w-5 h-5" style={{ color: p.color }} />
                  </div>
                  <span className="px-2 py-1 rounded text-[10px] text-center" style={{ background: `${p.color}12`, border: `1px solid ${p.color}33`, color: p.color, fontFamily: 'var(--font-orbitron)' }}>
                    {p.tag}
                  </span>
                </div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-orbitron)' }}>
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{p.desc}</p>
              </motion.div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="#games"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-widest transition-all hover:scale-105"
            style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', border: '1px solid var(--border)', color: 'var(--accent)', fontFamily: 'var(--font-orbitron)' }}
          >
            BROWSE GAMES <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/play/neon-duel"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-widest transition-all hover:scale-105"
            style={{ background: 'color-mix(in srgb, var(--accent2) 14%, transparent)', border: '1px solid var(--border)', color: 'var(--accent2)', fontFamily: 'var(--font-orbitron)' }}
          >
            <Users className="w-4 h-4" /> PLAY NEON DUEL — LIVE ROOMS
          </a>
          <a
            href="/submit/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-widest transition-all hover:scale-105"
            style={{ background: 'color-mix(in srgb, var(--accent2) 14%, transparent)', border: '1px solid var(--border)', color: 'var(--accent2)', fontFamily: 'var(--font-orbitron)' }}
          >
            <Upload className="w-4 h-4" /> SUBMIT YOUR GAME — 70% TO YOU
          </a>
        </div>
      </div>
    </section>
  )
}
