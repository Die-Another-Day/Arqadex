import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ARCADE LAB — Experimental Web Games',
  description: 'An experimental digital arcade. Physics-driven chaos, procedural systems, and interactive madness.',
  keywords: ['arcade', 'indie games', 'experimental', 'web games', 'interactive', 'cyberpunk'],
  openGraph: {
    title: 'ARCADE LAB',
    description: 'Experimental Web Games & Interactive Chaos',
    type: 'website',
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🕹️</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Orbitron:wght@400;500;600;700;800;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --font-syne: 'Syne', sans-serif;
            --font-orbitron: 'Orbitron', monospace;
            --font-space-mono: 'Space Mono', monospace;
          }
        `}</style>
      </head>
      <body className="bg-void antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
