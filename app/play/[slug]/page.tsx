import { notFound } from 'next/navigation'
import GameShell from '@/components/GameShell'

/** Static builds that used to open bare, now play inside the themed shell. */
const STATIC_GAMES: Record<string, { title: string; src: string }> = {
  'protocol-zero': { title: 'PROTOCOL ZERO', src: '/protocol-zero/' },
  'baldys-escape': { title: 'BALDYS ESCAPE', src: '/baldys-escape/' },
  'merge-ball': { title: 'MERGE BALL', src: '/merge-ball/' },
  'quantum-drift': { title: 'QUANTUM DRIFT', src: '/quantum-drift/' },
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
