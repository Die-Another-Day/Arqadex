import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import GameShell from '@/components/GameShell'
import { GAMES } from '@/lib/games'

/** Per-game metadata so each play page can rank on its own title instead of
 *  every game sharing the generic homepage title. Canonical uses the
 *  trailing-slash URL the static export actually serves. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const game = GAMES.find((g) => g.id === slug)
  const staticGame = STATIC_GAMES[slug]
  const title = game
    ? `${game.title} — Play Instantly on ARQADEX`
    : staticGame
      ? `${staticGame.title} — Play Instantly on ARQADEX`
      : 'ARQADEX — Play Instantly. No Downloads.'
  const description =
    game?.tagline ??
    'Play instantly in your browser — no downloads, no installs. Duel friends in live rooms or play solo on Arqadex.'
  const url = `https://arqadex.site/play/${slug}/`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'ARQADEX', type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

/** Static builds that used to open bare, now play inside the themed shell. */
const STATIC_GAMES: Record<string, { title: string; src: string }> = {
  'protocol-zero': { title: 'PROTOCOL ZERO', src: '/protocol-zero/' },
  'baldys-escape': { title: 'BALDYS ESCAPE', src: '/baldys-escape/' },
  'merge-ball': { title: 'MERGE BALL', src: '/merge-ball/' },
  'quantum-drift': { title: 'QUANTUM DRIFT', src: '/quantum-drift/' },
  'neon-duel': { title: 'NEON DUEL', src: '/neon-duel/' },
  'neon-outlaw': { title: 'NEON OUTLAW', src: '/neon-outlaw/' },
  'jhatka': { title: 'JHATKA', src: '/jhatka/' },
  'tap-dhamaka': { title: 'TAP DHAMAKA', src: '/tap-dhamaka/' },
  'hawa-hockey': { title: 'HAWA HOCKEY', src: '/hawa-hockey/' },
  'yaaddasht': { title: 'YAADDASHT', src: '/yaaddasht/' },
  'pehchan-kaun': { title: 'PEHCHAN KAUN', src: '/pehchan-kaun/' },
}

export function generateStaticParams() {
  return Object.keys(STATIC_GAMES).map((slug) => ({ slug }))
}

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const game = STATIC_GAMES[slug]
  if (!game) notFound()
  return <GameShell gameId={slug} title={game.title} src={game.src} />
}
