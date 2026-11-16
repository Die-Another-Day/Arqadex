import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GAMES, gameDetail } from '@/lib/games'
import GameDetailClient from '@/components/GameDetailClient'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const game = GAMES.find((g) => g.id === slug)
  if (!game) return { title: 'Game not found — ARQADEX' }
  const url = `https://arqadex.site/games/${slug}/`
  return {
    title: `${game.title} — ARQADEX`,
    description: game.tagline,
    // Installing from this page puts THIS game on the home screen.
    manifest: `/games/${slug}/manifest.json`,
    alternates: { canonical: url },
    openGraph: { title: `${game.title} — ARQADEX`, description: game.tagline, url, siteName: 'ARQADEX', type: 'website' },
    twitter: { card: 'summary', title: `${game.title} — ARQADEX`, description: game.tagline },
  }
}

export function generateStaticParams() {
  return GAMES.filter((g) => g.status === 'LIVE').map((g) => ({ slug: g.id }))
}

export default async function GameDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const game = GAMES.find((g) => g.id === slug)
  if (!game || game.status !== 'LIVE') notFound()
  const detail = gameDetail(game)
  const playUrl = game.url ?? `/play/${slug}`
  const isPlayPage = playUrl.startsWith('/play/')
  const tutorialUrl = isPlayPage ? `${playUrl}?tutorial=1` : playUrl

  return (
    <main className="relative min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="noise-overlay" />
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-16 relative z-10">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-bold tracking-widest mb-6" style={{ color: 'var(--muted)' }}>
          ← ARCADE
        </a>

        {/* ---- header: icon, title, developer ---- */}
        <div className="flex gap-4 items-start mb-4">
          <div
            className="w-20 h-20 shrink-0 rounded-2xl flex items-center justify-center font-black text-2xl"
            style={{ background: game.color, color: '#06060e', fontFamily: 'var(--font-orbitron)', boxShadow: `0 8px 32px ${game.color}55` }}
          >
            {game.title.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black leading-tight" style={{ fontFamily: 'var(--font-orbitron)' }}>
              {game.title}
            </h1>
            <p className="text-sm font-bold mt-1" style={{ color: 'var(--accent)' }}>ARQADEX</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {game.players} · {game.mood}
            </p>
          </div>
        </div>

        {/* ---- store facts: rating (honest), instant play, no download ---- */}
        <div className="flex gap-6 py-4 mb-5 text-center" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="flex-1">
            <div className="font-black text-lg">NEW</div>
            <div className="text-[11px] tracking-wide" style={{ color: 'var(--muted)' }}>No ratings yet</div>
          </div>
          <div className="flex-1" style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
            <div className="font-black text-lg">INSTANT</div>
            <div className="text-[11px] tracking-wide" style={{ color: 'var(--muted)' }}>Plays in browser</div>
          </div>
          <div className="flex-1">
            <div className="font-black text-lg">0 MB</div>
            <div className="text-[11px] tracking-wide" style={{ color: 'var(--muted)' }}>No download</div>
          </div>
        </div>

        {/* ---- the two actions ---- */}
        <GameDetailClient
          title={game.title}
          color={game.color}
          tutorialUrl={tutorialUrl}
          playUrl={playUrl}
          gameId={slug}
        />

        {/* ---- screenshots ---- */}
        <h2 className="font-black tracking-widest text-sm mt-8 mb-3" style={{ fontFamily: 'var(--font-orbitron)' }}>SCREENSHOTS</h2>
        {detail.screenshots.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {detail.screenshots.map((src) => (
              <img
                key={src}
                src={src}
                alt={`${game.title} screenshot`}
                className="rounded-xl shrink-0 w-[320px] h-[180px] object-cover"
                style={{ border: '1px solid var(--border)' }}
                loading="lazy"
              />
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl w-full h-[180px] flex flex-col items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${game.color}33, transparent)`, border: `1px solid ${game.color}66` }}
          >
            <span className="font-black text-2xl" style={{ fontFamily: 'var(--font-orbitron)', color: game.color }}>{game.title}</span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Screenshots coming soon — play it now to see it live.</span>
          </div>
        )}

        {/* ---- about ---- */}
        <h2 className="font-black tracking-widest text-sm mt-8 mb-3" style={{ fontFamily: 'var(--font-orbitron)' }}>ABOUT THIS GAME</h2>
        <p className="text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>{detail.description}</p>

        {/* ---- how to play ---- */}
        <h2 className="font-black tracking-widest text-sm mt-8 mb-3" style={{ fontFamily: 'var(--font-orbitron)' }}>HOW TO PLAY</h2>
        <ol className="space-y-2">
          {detail.howTo.map((step, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              <span
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black"
                style={{ background: game.color, color: '#06060e' }}
              >
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        {/* ---- tags + details ---- */}
        <div className="flex flex-wrap gap-1.5 mt-8">
          {game.tags.map((t) => (
            <span key={t} className="px-2 py-1 text-xs rounded" style={{ border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-orbitron)' }}>{t}</span>
          ))}
        </div>
        <p className="text-xs mt-6 leading-relaxed" style={{ color: 'var(--muted)' }}>
          Developer: ARQADEX · Category: Game · Plays instantly in your browser — no downloads, no accounts.
          Installing adds this game to your home screen so it opens straight into the game.
        </p>
      </div>
    </main>
  )
}
