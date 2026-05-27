'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { ExternalLink, Zap, Cpu, Globe } from 'lucide-react'
import Link from 'next/link'

const GAME = {
  title: 'PROTOCOL ZERO',
  url: '/protocol-zero/',
  description:
    'High-pressure human response experiment testing reflex, tolerance, decision patterns, and psychological endurance through escalating neural simulations.',
  
  tags: ['REFLEX', 'PSYCHO', 'SIM', 'NEURAL'],

  status: 'LIVE',
}
// Canvas-style thumbnail placeholder with animated elements
function GameThumbnail() {
  return (
    <div
      className="relative w-full aspect-video overflow-hidden rounded-lg"
      style={{ background: 'linear-gradient(135deg, #050510 0%, #0D0D22 40%, #130820 100%)' }}
    >
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,245,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.06) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      


{/* Protocol Zero Core */}
<div className="absolute inset-0 flex items-center justify-center">

  {/* Outer Ring */}
  <div
    className="absolute w-36 h-36 rounded-full"
    style={{
      border: '2px solid rgba(255,0,76,0.25)',
      boxShadow: '0 0 40px rgba(255,0,76,0.25)',
    }}
  />

  {/* Inner Ring */}
  <div
    className="absolute w-24 h-24 rounded-full animate-pulse"
    style={{
      border: '2px solid rgba(255,80,120,0.7)',
      boxShadow: '0 0 25px rgba(255,0,76,0.45)',
    }}
  />

  {/* Core */}
  <div
    className="absolute w-6 h-6 rounded-full"
    style={{
      background: '#FF004C',
      boxShadow: `
        0 0 12px #FF004C,
        0 0 30px #FF004C
      `,
    }}
  />

  {/* Rotating scan line */}
  <div
    className="absolute w-40 h-[2px] rotate-45"
    style={{
      background:
        'linear-gradient(to right, transparent, #FF004C, transparent)',
      opacity: 0.9,
    }}
  />

  {/* Danger glow */}
  <div
    className="absolute w-52 h-52 rounded-full"
    style={{
      background:
        'radial-gradient(circle, rgba(255,0,76,0.12), transparent 70%)',
      filter: 'blur(20px)',
    }}
  />
</div>


      {/* Scan line on thumbnail */}
      <div
        className="absolute inset-x-0 h-px opacity-30"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.8), transparent)',
          animation: 'scan 4s linear infinite',
        }}
      />
      {/* Corner markers */}
      <div className="absolute top-3 left-3 w-5 h-5 border-l border-t border-cyan/40" />
      <div className="absolute top-3 right-3 w-5 h-5 border-r border-t border-cyan/40" />
      <div className="absolute bottom-3 left-3 w-5 h-5 border-l border-b border-cyan/40" />
      <div className="absolute bottom-3 right-3 w-5 h-5 border-r border-b border-cyan/40" />
      {/* Center overlay text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="font-orbitron text-3xl font-black opacity-10 tracking-widest select-none"
          style={{ fontFamily: 'var(--font-orbitron)', color: 'var(--accent-cyan)' }}
        >
          PROTOCOL
        </div>
      </div>
    </div>
  )
}

export default function FeaturedGame() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 })

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setTilt({ x: (y - 0.5) * -15, y: (x - 0.5) * 15 })
    setGlowPos({ x: x * 100, y: y * 100 })
  }

  const onMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setGlowPos({ x: 50, y: 50 })
  }

  return (
    <section ref={ref} id="games" className="relative py-32 px-6 overflow-hidden">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto mb-16"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-8 h-px bg-cyan/50" />
          <span
            className="text-xs tracking-widest text-cyan/50"
            style={{ fontFamily: 'var(--font-orbitron)' }}
          >
            FEATURED RELEASE
          </span>
        </div>
        <h2
          className="font-syne text-5xl md:text-7xl font-black text-white"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          NOW PLAYING
        </h2>
      </motion.div>

      {/* Featured Card */}
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          ref={cardRef}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className="relative rounded-2xl cursor-none overflow-hidden"
          style={{
            transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: 'transform 0.15s ease-out',
            background: 'rgba(13, 13, 34, 0.8)',
            border: '1px solid rgba(0, 245, 255, 0.15)',
          }}
          data-cursor="hover"
        >
          {/* Dynamic glow based on mouse */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(600px circle at ${glowPos.x}% ${glowPos.y}%, rgba(0,245,255,0.06), transparent 50%)`,
              transition: 'background 0.1s',
            }}
          />

          {/* Animated border */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.3), transparent)',
                transform: 'translateX(-100%)',
                animation: 'scan 6s linear infinite',
              }}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: Thumbnail */}
            <div className="p-6 md:p-8">
              <GameThumbnail />

              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                {GAME.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs border border-cyan/20 text-cyan/50 rounded"
                    style={{ fontFamily: 'var(--font-orbitron)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Info */}
            <div className="p-6 md:p-8 md:pl-4 flex flex-col justify-center">
              {/* Status */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-cyan status-live" />
                <span
                  className="text-xs text-cyan font-bold tracking-widest"
                  style={{ fontFamily: 'var(--font-orbitron)' }}
                >
                  LIVE
                </span>
                <span className="text-muted text-xs" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  // DEPLOYED
                </span>
              </div>

              {/* Title */}
              <h3
                className="font-orbitron text-5xl font-black mb-4"
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  background: 'linear-gradient(135deg, #F0F0FF, rgba(0,245,255,0.7))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {GAME.title}
              </h3>

              {/* Description */}
              <p className="text-silver/60 leading-relaxed mb-8 text-sm md:text-base">
                {GAME.description}
              </p>

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { icon: Globe, label: 'PLATFORM', value: 'WEB' },
                  { icon: Zap, label: 'ENGINE', value: 'PHYSICS' },
                  { icon: Cpu, label: 'STATUS', value: 'v1.0.0' },
                  { icon: ExternalLink, label: 'MODE', value: 'SOLO' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 px-3 py-2 rounded border border-white/5"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <item.icon className="w-3 h-3 text-purple/60" />
                    <div>
                      <div className="text-xs text-silver/30" style={{ fontFamily: 'var(--font-orbitron)' }}>
                        {item.label}
                      </div>
                      <div className="text-xs text-silver/70 font-bold" style={{ fontFamily: 'var(--font-orbitron)' }}>
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                href={GAME.url}
                
                
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-lg font-bold tracking-widest text-sm overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(122,92,255,0.2))',
                  border: '1px solid rgba(0,245,255,0.4)',
                  fontFamily: 'var(--font-orbitron)',
                  color: 'var(--accent-cyan)',
                }}
                data-cursor="hover"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(122,92,255,0.15))' }}
                />
                <span className="relative">PLAY NOW</span>
                <ExternalLink className="relative w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
