'use client'

import Navigation from '@/components/Navigation'
import HeroSection from '@/components/HeroSection'
import FeaturedGame from '@/components/FeaturedGame'
import GameGrid from '@/components/GameGrid'
import Cabinet from '@/components/Cabinet'
import LabSection from '@/components/LabSection'
import AboutSection from '@/components/AboutSection'
import Footer from '@/components/Footer'
import CustomCursor from '@/components/CustomCursor'
import ParticleCanvas from '@/components/ParticleCanvas'
import SmoothScroll from '@/components/SmoothScroll'
import { ThemeProvider } from '@/components/theme'

// These three only touch window/canvas inside useEffect, so they are safe
// to render on the server — importing them normally (instead of ssr:false)
// means the home page is server-rendered instead of bailing out to
// client-side rendering only.
export default function HomePage() {
  return (
    <ThemeProvider>
      <SmoothScroll>
        <main className="relative min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
          <div className="noise-overlay" />
          <div className="scanlines" />
          <ParticleCanvas />
          <CustomCursor />
          <Navigation />
          <div className="relative z-10">
            <HeroSection />
            <FeaturedGame />
            <GameGrid />
            <Cabinet />
            <LabSection />
            <AboutSection />
            <Footer />
          </div>
        </main>
      </SmoothScroll>
    </ThemeProvider>
  )
}
