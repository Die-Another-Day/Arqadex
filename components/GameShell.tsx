'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Maximize, Minimize, RefreshCw, Palette, Loader2 } from 'lucide-react'
import CustomCursor from '@/components/CustomCursor'
import { ThemeProvider, useTheme } from '@/components/theme'
import { THEMES, recordPlay, type ThemeId } from '@/lib/arcade'

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

function ShellInner({ gameId, title, src }: { gameId: string; title: string; src: string }) {
  const { theme, setTheme } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [isFull, setIsFull] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [frameKey, setFrameKey] = useState(0)

  useEffect(() => {
    recordPlay(gameId)
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
        <span
          className="hidden sm:inline-block px-2 py-1 rounded text-[10px] tracking-widest"
          style={{ border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}
        >
          THEME: {current.label}
        </span>
        <button
          onClick={cycleTheme}
          title="Cycle theme — the game re-tints with it"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold tracking-widest transition-transform hover:scale-105"
          style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
        >
          <Palette className="w-4 h-4" /> THEME
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
