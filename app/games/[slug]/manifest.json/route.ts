import { NextResponse } from 'next/server'
import { GAMES } from '@/lib/games'

/** Static export: pre-render one manifest per live game at build time. */
export const dynamic = 'force-static'

export function generateStaticParams() {
  return GAMES.filter((g) => g.status === 'LIVE').map((g) => ({ slug: g.id }))
}

/**
 * Per-game web app manifest — installing from a game's detail page
 * puts THAT game on the home screen (its own name, icon colour and
 * start URL), not the Arqadex homepage. The detail page overrides
 * the layout's manifest with this one in its metadata.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const game = GAMES.find((g) => g.id === slug)
  if (!game) return new NextResponse('Not found', { status: 404 })
  const manifest = {
    name: `${game.title} — ARQADEX`,
    short_name: game.title,
    description: game.tagline,
    start_url: `${game.url ?? `/play/${slug}`}?utm_source=homescreen`,
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#06060e',
    theme_color: game.color,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json', 'Cache-Control': 'public, max-age=3600' },
  })
}
