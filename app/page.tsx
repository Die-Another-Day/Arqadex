'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Navigation'
import HeroSection from '@/components/HeroSection'
import FeaturedGame from '@/components/FeaturedGame'
import GameGrid from '@/components/GameGrid'
import LabSection from '@/components/LabSection'
import AboutSection from '@/components/AboutSection'
import Footer from '@/components/Footer'

// Dynamic import for client-only components
const CustomCursor = dynamic(() => import('@/components/CustomCursor'), { ssr: false })
const ParticleCanvas = dynamic(() => import('@/components/ParticleCanvas'), { ssr: false })
const SmoothScroll = dynamic(() => import('@/components/SmoothScroll'), { ssr: false })

export default function HomePage() {
  const [mouseGlow, setMouseGlow] = useState({ x: 50, y: 50 })
  const rafRef = useRef<number>(0)
  const targetGlow = useRef({ x: 50, y: 50 })
  const currentGlow = useRef({ x: 50, y: 50 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      targetGlow.current = {
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      }
    }

    const animate = () => {
      currentGlow.current.x += (targetGlow.current.x - currentGlow.current.x) * 0.05
      currentGlow.current.y += (targetGlow.current.y - currentGlow.current.y) * 0.05
      setMouseGlow({ ...currentGlow.current })
      rafRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMove)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <SmoothScroll>
      <main
        className="relative min-h-screen"
        style={{ background: 'var(--bg-void)' }}
      >
        {/* Global mouse reactive gradient */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(800px circle at ${mouseGlow.x}% ${mouseGlow.y}%, rgba(122, 92, 255, 0.04) 0%, transparent 50%)`,
            zIndex: 0,
            transition: 'background 0.05s',
          }}
        />

        {/* Noise overlay */}
        <div className="noise-overlay" />

        {/* Scanlines */}
        <div className="scanlines" />

        {/* Particles */}
        <ParticleCanvas />

        {/* Custom cursor (desktop only) */}
        <CustomCursor />

        {/* Navigation */}
        <Navigation />

        {/* Page content */}
        <div className="relative z-10">
          <HeroSection />

          {/* Section separator */}
          <div className="max-w-7xl mx-auto px-6">
            <div
              className="h-px opacity-20"
              style={{
                background: 'linear-gradient(90deg, transparent, var(--accent-cyan), transparent)',
              }}
            />
          </div>

          <FeaturedGame />

          <div className="max-w-7xl mx-auto px-6">
            <div
              className="h-px opacity-20"
              style={{
                background: 'linear-gradient(90deg, transparent, var(--accent-pink), transparent)',
              }}
            />
          </div>

          <GameGrid />

          <div className="max-w-7xl mx-auto px-6">
            <div
              className="h-px opacity-20"
              style={{
                background: 'linear-gradient(90deg, transparent, var(--accent-purple), transparent)',
              }}
            />
          </div>

          <LabSection />

          <div className="max-w-7xl mx-auto px-6">
            <div
              className="h-px opacity-20"
              style={{
                background: 'linear-gradient(90deg, transparent, var(--accent-cyan), transparent)',
              }}
            />
          </div>

          <AboutSection />

          <Footer />
        </div>
      </main>
    </SmoothScroll>
  )
}
