'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Maximize, Minimize, RefreshCw, Palette, Loader2, Trophy, Info, X, Clock, Play, Share2, Check } from 'lucide-react'
import CustomCursor from '@/components/CustomCursor'
import { ThemeProvider, useTheme } from '@/components/theme'
import { THEMES, recordPlay, getPlays, getVault, addVaultScore, getBestVaultScore, ARCADE_EVENT, type ThemeId, type VaultEntry } from '@/lib/arcade'
import { GAMES } from '@/lib/games'

/**
 * GameShell — the frame every game plays inside.
 *
 * Two things a bare <iframe> could never do:
 *  1. Carry the arcade theme INTO the game. Static game builds have their
 *     own hard-coded colours, so the shell tints the whole game with a
 *     per-theme CSS filter and re-skins the frame, header and loader.
 *  2. Carry the custom cursor INTO the game. The parent page never sees
 *     mouse movement over an iframe, so the shell injects a small
 *     dot-and-ring cursor into the game's own document (same origin),
 *     coloured from the active theme.
 * If the game document refuses injection (cross-origin, sandbox), the
 * shell still works — the frame, tint and header just carry the theme.
 *
 * v2.2 adds a third thing: a drawer with a live session timer, the
 * game's own description, and the Score Vault — player-entered scores
 * for games that cannot report their scores back to the arcade.
 */
const IFRAME_FILTER: Record<ThemeId, string> = {
  neon: 'none',
  synthwave: 'hue-rotate(-25deg) saturate(1.25)',
  matrix: 'sepia(0.45) hue-rotate(60deg) saturate(2.4) brightness(0.95)',
  daylight: 'brightness(1.08) saturate(1.05) contrast(0.98)',
}

const CURSOR_ACCENT: Record<ThemeId, string> = {
  neon: '#00f5ff',
  synthwave: '#ff71ce',
  matrix: '#00ff66',
  daylight: '#ff2d78',
}

const IN_GAME_CURSOR_JS = `
(function () {
  if (window.__arqadexCursor) return;
  window.__arqadexCursor = true;
  var dot = document.createElement('div');
  var ring = document.createElement('div');
  dot.id = 'arqadex-cursor-dot';
  ring.id = 'arqadex-cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);
  var x = -100, y = -100, rx = -100, ry = -100, raf = 0;
  function frame() {
    rx += (x - rx) * 0.16; ry += (y - ry) * 0.16;
    dot.style.transform = 'translate(' + (x - 4) + 'px,' + (y - 4) + 'px)';
    ring.style.transform = 'translate(' + (rx - 20) + 'px,' + (ry - 20) + 'px)';
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  document.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; });
  document.addEventListener('mouseover', function (e) {
    var t = e.target;
    var hot = t && t.closest ? !!t.closest('a,button,canvas,[data-cursor="hover"]') : false;
    ring.classList.toggle('arq-hover', hot);
  });
  document.addEventListener('mousedown', function () {
    var s = document.createElement('div');
    s.className = 'arqadex-cursor-ripple';
    s.style.left = (x - 20) + 'px'; s.style.top = (y - 20) + 'px';
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 450);
  });
})();
`

const IN_GAME_CURSOR_CSS = `
#arqadex-cursor-dot, #arqadex-cursor-ring { position: fixed; top: 0; left: 0; pointer-events: none; z-index: 2147483647; }
#arqadex-cursor-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--arq-cursor, #00f5ff); box-shadow: 0 0 10px var(--arq-cursor, #00f5ff), 0 0 22px var(--arq-cursor, #00f5ff); }
#arqadex-cursor-ring { width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid var(--arq-cursor, #00f5ff); opacity: 0.7; transition: width .18s, height .18s, opacity .18s; }
#arqadex-cursor-ring.arq-hover { width: 60px; height: 60px; opacity: 1; }
.arqadex-cursor-ripple { position: fixed; width: 40px; height: 40px; border-radius: 50%; border: 2px solid var(--arq-cursor, #00f5ff); pointer-events: none; z-index: 2147483647; animation: arq-ripple .45s ease-out forwards; }
@keyframes arq-ripple { from { transform: scale(.4); opacity: .9; } to { transform: scale(1.8); opacity: 0; } }
`

function injectGameCursor(iframe: HTMLIFrameElement, theme: ThemeId) {
  try {
    const doc = iframe.contentDocument
    if (!doc || !doc.body) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    // v2.4: games that ship their own cursor (Quantum Drift's neon
    // dot-and-ring) keep it — injecting a second one on top would
    // double the cursor and was the reported "cursor not there" mess.
    if (doc.getElementById('qd-cursor-dot')) return
    doc.documentElement.style.setProperty('--arq-cursor', CURSOR_ACCENT[theme])
    if (!doc.getElementById('arqadex-cursor-style')) {
      const style = doc.createElement('style')
      style.id = 'arqadex-cursor-style'
      style.textContent = '* { cursor: none !important; }' + IN_GAME_CURSOR_CSS
      doc.head.appendChild(style)
      const script = doc.createElement('script')
      script.textContent = IN_GAME_CURSOR_JS
      doc.body.appendChild(script)
    }
  } catch {
    // Cross-origin or sandboxed game: the shell tint still applies.
  }
}

function fmtElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function ShellInner({ gameId, title, src }: { gameId: string; title: string; src: string }) {
  const { theme, setTheme } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [isFull, setIsFull] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [shared, setShared] = useState(false)

  /* v2.6.4 — traffic lever: one-tap share from every game. The link copied
     is this play page itself, so a friend opens the same game instantly.
     Native share sheet where the device offers one, clipboard otherwise. */
  const shareGame = useCallback(async () => {
    const url = window.location.href
    const text = `${title} on ARQADEX — play instantly, no downloads.`
    try {
      if (navigator.share) { await navigator.share({ title: `${title} — ARQADEX`, text, url }) }
      else throw new Error('no native share')
    } catch {
      try { await navigator.clipboard.writeText(url) }
      catch {
        const ta = document.createElement('textarea')
        ta.value = url
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
    }
    setShared(true)
    window.setTimeout(() => setShared(false), 2000)
  }, [title])
  const [elapsed, setElapsed] = useState(0)
  const [score, setScore] = useState('')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [vault, setVault] = useState<VaultEntry[]>([])
  const wrapRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [frameKey, setFrameKey] = useState(0)
  const startedAt = useRef(Date.now())

  const game = GAMES.find((g) => g.id === gameId)
  const plays = getPlays()[gameId] ?? 0
  const best = getBestVaultScore(gameId)

  useEffect(() => {
    recordPlay(gameId)
  }, [gameId])

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startedAt.current), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const refresh = () => setVault(getVault().filter((e) => e.gameId === gameId))
    refresh()
    window.addEventListener(ARCADE_EVENT, refresh)
    return () => window.removeEventListener(ARCADE_EVENT, refresh)
  }, [gameId])

  useEffect(() => {
    if (iframeRef.current) injectGameCursor(iframeRef.current, theme)
  }, [theme, frameKey, loaded])

  useEffect(() => {
    const onChange = () => setIsFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const cycleTheme = useCallback(() => {
    const idx = THEMES.findIndex((t) => t.id === theme)
    setTheme(THEMES[(idx + 1) % THEMES.length].id)
  }, [theme, setTheme])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      wrapRef.current?.requestFullscreen().catch(() => {})
    }
  }, [])

  const saveScore = () => {
    const n = Number(score)
    if (!Number.isFinite(n)) return
    addVaultScore(gameId, n, note)
    setScore('')
    setNote('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0]

  return (
    <div ref={wrapRef} className="flex flex-col w-full h-screen overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <CustomCursor />
      <header
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
      >
        <a href="/" className="inline-flex items-center gap-2 text-sm font-bold tracking-widest" style={{ color: 'var(--muted)' }}>
          <ArrowLeft className="w-4 h-4" /> ARCADE
        </a>
        <div className="flex-1 min-w-0">
          <h1 className="font-black truncate" style={{ fontFamily: 'var(--font-orbitron)', color: 'var(--accent)' }}>
            {title}
          </h1>
        </div>
        <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] tracking-widest" style={{ border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>
          <Clock className="w-3 h-3" /> {fmtElapsed(elapsed)}
        </span>
        <span
          className="hidden sm:inline-block px-2 py-1 rounded text-[10px] tracking-widest"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}
        >
          THEME: {current.label}
        </span>
        <button
          onClick={shareGame}
          title="Share this game — send a friend straight here"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold tracking-widest transition-transform hover:scale-105"
          style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)', border: '1px solid var(--border)' }}
        >
          {shared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />} <span className="hidden sm:inline">{shared ? 'COPIED!' : 'SHARE'}</span>
        </button>
        <button
          onClick={() => setDrawer((v) => !v)}
          title="About this game & Score Vault"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold tracking-widest transition-transform hover:scale-105"
          style={{ background: drawer ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 14%, transparent)', color: drawer ? 'var(--on-accent)' : 'var(--accent)', border: '1px solid var(--border)' }}
        >
          <Trophy className="w-4 h-4" /> <span className="hidden sm:inline">VAULT</span>
        </button>
        <button
          onClick={cycleTheme}
          title="Cycle theme — the game re-tints with it"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold tracking-widest transition-transform hover:scale-105"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          <Palette className="w-4 h-4" /> <span className="hidden sm:inline">THEME</span>
        </button>
        <button
          onClick={() => setFrameKey((k) => k + 1)}
          title="Reload game"
          className="p-2 rounded-lg"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          title="Fullscreen"
          className="p-2 rounded-lg"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          {isFull ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </header>

      {drawer && (
        <div className="shrink-0 max-h-[45vh] overflow-y-auto px-4 py-4" style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-orbitron font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  <Info className="w-4 h-4" style={{ color: 'var(--accent)' }} /> ABOUT THIS EXPERIMENT
                </h2>
                <button onClick={() => setDrawer(false)} aria-label="Close drawer" className="p-1" style={{ color: 'var(--muted)' }}><X className="w-4 h-4" /></button>
              </div>
              {game && <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--muted)' }}>{game.tagline}</p>}
              {game && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {game.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 text-xs rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>{t}</span>
                  ))}
                </div>
              )}
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                Session: {fmtElapsed(elapsed)} in this frame · {plays} play{plays === 1 ? '' : 's'} counted from the arcade
                {game ? ` · ${game.players} · ${game.mood}` : ''}. Controls live inside the game itself — check its own
                menu or tutorial first.
              </p>
            </div>
            <div>
              <h2 className="font-orbitron font-bold flex items-center gap-2 mb-2" style={{ fontFamily: 'var(--font-orbitron)' }}>
                <Trophy className="w-4 h-4" style={{ color: 'var(--accent2)' }} /> SCORE VAULT
              </h2>
              <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--muted)' }}>
                These games don&apos;t report scores back to the arcade, so the vault runs on trust:
                type the final score you saw in the game. It stays in this browser only.
              </p>
              <div className="flex gap-2 mb-2">
                <input
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  inputMode="numeric"
                  placeholder="Your final score"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
                <button onClick={saveScore} disabled={score.trim() === '' || !Number.isFinite(Number(score))} className="px-4 py-2 rounded-lg text-xs font-bold tracking-widest disabled:opacity-40" style={{ background: 'var(--accent)', color: 'var(--on-accent)', fontFamily: 'var(--font-orbitron)' }}>
                  {saved ? 'SAVED ✓' : 'SAVE'}
                </button>
              </div>
              {best ? (
                <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>
                  Your best here: <b style={{ color: 'var(--accent)' }}>{best.score.toLocaleString()}</b>
                  {best.note ? ` — ${best.note}` : ''}
                </p>
              ) : (
                <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>No vault score yet for this game.</p>
              )}
              {vault.length > 0 && (
                <ul className="space-y-1">
                  {vault.slice(0, 5).map((e, i) => (
                    <li key={`${e.at}-${i}`} className="flex justify-between gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                      <span>{e.score.toLocaleString()}{e.note ? ` — ${e.note}` : ''}</span>
                      <span>{new Date(e.at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
              <a href="/#cabinet" className="inline-flex items-center gap-1 text-xs font-bold mt-3" style={{ color: 'var(--accent)' }}>
                <Play className="w-3 h-3" /> See all vault bests in Your Cabinet →
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex-1 min-h-0" style={{ background: '#000' }}>
        {!loaded && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            <span className="text-xs tracking-[0.3em]" style={{ fontFamily: 'var(--font-orbitron)' }}>
              LOADING THE LAB…
            </span>
          </div>
        )}
        <iframe
          key={frameKey}
          ref={iframeRef}
          src={src}
          title={title}
          className="w-full h-full border-0"
          style={{ filter: IFRAME_FILTER[theme] }}
          onLoad={(e) => {
            setLoaded(true)
            injectGameCursor(e.currentTarget, theme)
            // Quantum Drift (and other keyboard games) only receive keys
            // when the frame has focus — give it focus on load so the
            // first keypress works without an extra click.
            try { e.currentTarget.focus() } catch {}
          }}
          allow="autoplay; fullscreen; gamepad; microphone"
        />
      </div>
    </div>
  )
}

export default function GameShell({ gameId, title, src }: { gameId: string; title: string; src: string }) {
  return (
    <ThemeProvider>
      <ShellInner gameId={gameId} title={title} src={src} />
    </ThemeProvider>
  )
}
