'use client'

import { useEffect, useState } from 'react'
import { Play, Download, Check, Share } from 'lucide-react'
import { recordPlay } from '@/lib/arcade'

/**
 * The two actions on a game's store page.
 *
 * PLAY TUTORIAL opens the game instantly and shows the how-to-play
 * guide first (the play page reads ?tutorial=1). INSTALL puts this
 * game on the home screen as its own app — it opens straight into
 * the game, no Arqadex homepage in between. On Android/Chrome it
 * uses the beforeinstallprompt flow for this game's manifest; on
 * iOS (which has no install prompt) it shows the Share → Add to
 * Home Screen steps instead.
 *
 * The button says INSTALLED only when this game was actually
 * installed in this session (the appinstalled event). It must NOT
 * be driven by display-mode: standalone — that only says the
 * Arqadex site itself is running as an app, which would wrongly
 * mark every game installed.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
}

export default function GameDetailClient({
  title,
  color,
  tutorialUrl,
  playUrl,
  gameId,
}: {
  title: string
  color: string
  tutorialUrl: string
  playUrl: string
  gameId: string
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [showManualHelp, setShowManualHelp] = useState(false)
  const [installMsg, setInstallMsg] = useState('')

  useEffect(() => {
    // installed is set ONLY by the appinstalled event below — never
    // from display-mode, which describes the Arqadex site, not this game.
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
      setInstallMsg('Installed — find it on your home screen. It opens straight into the game.')
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    setInstallMsg('')
    setShowManualHelp(false)
    if (installed) return
    if (deferred) {
      setInstalling(true)
      try {
        await deferred.prompt()
        const choice = await deferred.userChoice
        if (choice.outcome === 'accepted') {
          setInstalled(true)
          setInstallMsg('Installed — find it on your home screen. It opens straight into the game.')
        } else {
          setInstallMsg('Install dismissed — you can still play instantly, no download needed.')
        }
      } finally {
        setDeferred(null)
        setInstalling(false)
      }
      return
    }
    // No install prompt available: iOS Safari never fires
    // beforeinstallprompt, and some browsers only offer it from the
    // menu. Show the manual Add to Home Screen steps — adding from
    // this page uses this game's manifest, so the icon opens
    // straight into the game.
    setShowManualHelp(true)
  }

  return (
    <div>
      <div className="flex gap-3">
        <a
          href={tutorialUrl}
          onClick={() => recordPlay(gameId)}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-black text-sm tracking-widest transition-transform hover:scale-[1.02] active:scale-95"
          style={{ background: color, color: '#06060e', fontFamily: 'var(--font-orbitron)' }}
        >
          <Play className="w-5 h-5" /> PLAY TUTORIAL
        </a>
        <button
          onClick={install}
          disabled={installed || installing}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-black text-sm tracking-widest transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          style={{ background: installed ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 14%, transparent)', color: installed ? 'var(--on-accent)' : 'var(--accent)', border: '1px solid var(--border)', fontFamily: 'var(--font-orbitron)' }}
        >
          {installed ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
          {installed ? 'INSTALLED' : installing ? 'INSTALLING…' : 'INSTALL'}
        </button>
      </div>

      <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--muted)' }}>
        Play Tutorial opens the game instantly and shows how to play first. Install adds {title} to your
        home screen as its own app — it opens straight into the game, even offline after the first load.
      </p>

      {installMsg && (
        <p className="text-sm mt-3 px-3 py-2 rounded-lg" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--text)' }}>
          {installMsg}
        </p>
      )}

      {showManualHelp && (
        <div className="mt-3 px-4 py-3 rounded-xl text-sm leading-relaxed" style={{ border: '1px solid var(--border)', background: 'var(--panel)' }}>
          <p className="font-bold flex items-center gap-2 mb-2">
            <Share className="w-4 h-4" style={{ color: 'var(--accent)' }} /> Add {title} to your home screen
          </p>
          {isIOS() ? (
            <ol className="list-decimal list-inside space-y-1" style={{ color: 'var(--muted)' }}>
              <li>Tap the <b>Share</b> button in Safari (the square with an arrow).</li>
              <li>Scroll down and tap <b>Add to Home Screen</b>.</li>
              <li>Tap <b>Add</b>. {title} now opens straight from your home screen — no Arqadex in between.</li>
            </ol>
          ) : (
            <ol className="list-decimal list-inside space-y-1" style={{ color: 'var(--muted)' }}>
              <li>Tap the browser menu (<b>⋮</b>, top right).</li>
              <li>Tap <b>Add to Home screen</b> (or <b>Install app</b> if it appears).</li>
              <li>Tap <b>Add</b>. {title} now opens straight from your home screen — no Arqadex in between.</li>
            </ol>
          )}
        </div>
      )}

      <div className="mt-3 text-center">
        <a href={playUrl} onClick={() => recordPlay(gameId)} className="text-xs font-bold underline underline-offset-4" style={{ color: 'var(--muted)' }}>
          Just play now, no tutorial →
        </a>
      </div>
    </div>
  )
}
