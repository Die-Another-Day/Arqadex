'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, CheckCircle, AlertCircle, ArrowLeft, Gamepad2, User, Link, FileText, Tag, Mail, ExternalLink } from 'lucide-react'

const GENRE_TAGS = ['ACTION', 'PUZZLE', 'PHYSICS', 'RUNNER', 'HORROR', 'ARCADE', 'STRATEGY', 'EXPERIMENTAL', 'MULTIPLAYER', 'DARK', 'CASUAL', 'OTHER']

export default function SubmitPage() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [gameFile, setGameFile] = useState<File | null>(null)
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [submitType, setSubmitType] = useState<'url' | 'file'>('url')
  const formRef = useRef<HTMLFormElement>(null)

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < 4 ? [...prev, tag] : prev
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')

    const form = e.currentTarget
    const data = new FormData(form)
    data.set('tags', selectedTags.join(', '))
    if (screenshot) data.set('screenshot', screenshot)
    if (submitType === 'file' && gameFile) data.set('game_file', gameFile)

    try {
      const res = await fetch('https://formspree.io/f/mwvdglgz', {  // ← paste your Formspree endpoint here
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      })
      if (res.ok) { setStatus('success'); formRef.current?.reset(); setSelectedTags([]); setGameFile(null); setScreenshot(null) }
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-void)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <CheckCircle className="w-16 h-16 text-cyan mx-auto mb-6" />
          <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'var(--font-syne)' }}>
            Submission Received
          </h2>
          <p className="text-silver/50 mb-8 leading-relaxed">
            We review every submission manually. If your game fits the lab, you'll hear from us within 3–5 days.
          </p>
	  <a             
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-widest transition-all hover:scale-105"
            style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', color: '#00F5FF', fontFamily: 'var(--font-orbitron)' }}
          >
            <ArrowLeft className="w-4 h-4" /> BACK TO ARCADE
          </a>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-24" style={{ background: 'var(--bg-void)' }}>
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(122,92,255,0.05) 0%, transparent 70%)' }} />

      <div className="max-w-2xl mx-auto relative">
        {/* Back link */}
        <motion.a
          href="/"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 text-silver/40 hover:text-cyan transition-colors mb-10 text-sm"
          style={{ fontFamily: 'var(--font-orbitron)' }}
        >
          <ArrowLeft className="w-4 h-4" /> ARQADEX
        </motion.a>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-px bg-purple/50" />
            <span className="text-xs tracking-widest text-purple/50" style={{ fontFamily: 'var(--font-orbitron)' }}>CREATOR PORTAL</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4" style={{ fontFamily: 'var(--font-syne)' }}>
            SUBMIT<br />
            <span style={{ WebkitTextStroke: '1px rgba(122,92,255,0.5)', color: 'transparent' }}>YOUR GAME</span>
          </h1>
          <p className="text-silver/40 leading-relaxed max-w-lg">
            Built something experimental? If it fits the ARQADEX aesthetic — weird, interactive, and genuinely playable — we want to publish it here.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          ref={formRef}
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Creator details */}
          <div className="rounded-xl p-6 space-y-4" style={{ background: 'rgba(8,8,24,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-cyan/50" />
              <span className="text-xs tracking-widest text-cyan/50" style={{ fontFamily: 'var(--font-orbitron)' }}>CREATOR INFO</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-silver/40 mb-1.5" style={{ fontFamily: 'var(--font-orbitron)' }}>NAME / HANDLE *</label>
                <input name="creator_name" required placeholder="Your name or alias"
                  className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-white/20 outline-none transition-all focus:border-cyan/40"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-space-mono)' }} />
              </div>
              <div>
                <label className="block text-xs text-silver/40 mb-1.5" style={{ fontFamily: 'var(--font-orbitron)' }}>EMAIL *</label>
                <input name="email" type="email" required placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-white/20 outline-none transition-all focus:border-cyan/40"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-space-mono)' }} />
              </div>
            </div>

            <div>
              <label className="block text-xs text-silver/40 mb-1.5" style={{ fontFamily: 'var(--font-orbitron)' }}>PORTFOLIO / GITHUB (optional)</label>
              <input name="portfolio" placeholder="https://github.com/you"
                className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-white/20 outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-space-mono)' }} />
            </div>
          </div>

          {/* Game details */}
          <div className="rounded-xl p-6 space-y-4" style={{ background: 'rgba(8,8,24,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Gamepad2 className="w-4 h-4 text-purple/50" />
              <span className="text-xs tracking-widest text-purple/50" style={{ fontFamily: 'var(--font-orbitron)' }}>GAME INFO</span>
            </div>

            <div>
              <label className="block text-xs text-silver/40 mb-1.5" style={{ fontFamily: 'var(--font-orbitron)' }}>GAME NAME *</label>
              <input name="game_name" required placeholder="What is it called?"
                className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-white/20 outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-space-mono)' }} />
            </div>

            <div>
              <label className="block text-xs text-silver/40 mb-1.5" style={{ fontFamily: 'var(--font-orbitron)' }}>DESCRIPTION *</label>
              <textarea name="description" required rows={3} placeholder="What does it do? What makes it interesting?"
                className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-white/20 outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-space-mono)' }} />
            </div>

            {/* Genre tags */}
            <div>
              <label className="block text-xs text-silver/40 mb-2" style={{ fontFamily: 'var(--font-orbitron)' }}>
                GENRE TAGS <span className="text-white/20">(pick up to 4)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRE_TAGS.map(tag => (
                  <button
                    key={tag} type="button" onClick={() => toggleTag(tag)}
                    className="px-3 py-1 rounded text-xs transition-all duration-200"
                    style={{
                      fontFamily: 'var(--font-orbitron)',
                      background: selectedTags.includes(tag) ? 'rgba(122,92,255,0.2)' : 'rgba(255,255,255,0.04)',
                      border: selectedTags.includes(tag) ? '1px solid rgba(122,92,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      color: selectedTags.includes(tag) ? '#7A5CFF' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Game files */}
          <div className="rounded-xl p-6 space-y-4" style={{ background: 'rgba(8,8,24,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-4 h-4 text-cyan/50" />
              <span className="text-xs tracking-widest text-cyan/50" style={{ fontFamily: 'var(--font-orbitron)' }}>GAME FILES</span>
            </div>

            {/* Toggle URL vs File */}
            <div className="flex gap-2 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {(['url', 'file'] as const).map(t => (
                <button
                  key={t} type="button" onClick={() => setSubmitType(t)}
                  className="flex-1 py-2 rounded-md text-xs font-bold tracking-widest transition-all"
                  style={{
                    fontFamily: 'var(--font-orbitron)',
                    background: submitType === t ? 'rgba(0,245,255,0.1)' : 'transparent',
                    border: submitType === t ? '1px solid rgba(0,245,255,0.3)' : '1px solid transparent',
                    color: submitType === t ? '#00F5FF' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {t === 'url' ? '🔗 HOSTED URL' : '📁 UPLOAD FILES'}
                </button>
              ))}
            </div>

            {submitType === 'url' ? (
              <div>
                <label className="block text-xs text-silver/40 mb-1.5" style={{ fontFamily: 'var(--font-orbitron)' }}>GAME URL *</label>
                <input name="game_url" required={submitType === 'url'} placeholder="https://your-game.netlify.app"
                  className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-white/20 outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-space-mono)' }} />
                <p className="text-xs text-silver/25 mt-1.5">GitHub Pages, Netlify, Vercel, itch.io — any public URL works</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-silver/40 mb-1.5" style={{ fontFamily: 'var(--font-orbitron)' }}>GAME ZIP / FILES</label>
                <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-lg cursor-pointer transition-all hover:border-cyan/30"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <Upload className="w-6 h-6 text-white/20" />
                  <span className="text-xs text-silver/30" style={{ fontFamily: 'var(--font-orbitron)' }}>
                    {gameFile ? gameFile.name : 'Click to upload (.zip, .html, max 10MB)'}
                  </span>
                  <input type="file" accept=".zip,.html" className="hidden" onChange={e => setGameFile(e.target.files?.[0] || null)} />
                </label>
                <p className="text-xs text-silver/25 mt-1.5">Or share a Google Drive / Dropbox link in the description above</p>
              </div>
            )}

            {/* Screenshot */}
            <div>
              <label className="block text-xs text-silver/40 mb-1.5" style={{ fontFamily: 'var(--font-orbitron)' }}>SCREENSHOT (optional)</label>
              <label className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all hover:border-purple/30"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                <Upload className="w-4 h-4 text-white/20 flex-shrink-0" />
                <span className="text-xs text-silver/30" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  {screenshot ? screenshot.name : 'Upload a screenshot or GIF (max 5MB)'}
                </span>
                <input type="file" accept="image/*,.gif" className="hidden" onChange={e => setScreenshot(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex items-start gap-3">
            <input name="agree" type="checkbox" required id="agree"
              className="mt-0.5 w-4 h-4 accent-cyan" />
            <label htmlFor="agree" className="text-xs text-silver/35 leading-relaxed">
              I confirm this game is my own original work and I agree to let ARQADEX publish it on arqadex.site. I can request removal at any time by emailing.
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full py-4 rounded-xl font-black tracking-widest text-sm transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: status === 'sending' ? 'rgba(122,92,255,0.1)' : 'rgba(122,92,255,0.15)',
              border: '1px solid rgba(122,92,255,0.4)',
              color: '#7A5CFF',
              fontFamily: 'var(--font-orbitron)',
            }}
          >
            {status === 'sending' ? 'TRANSMITTING...' : 'SUBMIT TO ARQADEX ↗'}
          </button>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-400 text-xs" style={{ fontFamily: 'var(--font-orbitron)' }}>
              <AlertCircle className="w-4 h-4" /> Submission failed — check your connection and try again.
            </div>
          )}
        </motion.form>
      </div>
    </div>
  )
}
