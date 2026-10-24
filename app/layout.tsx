import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ARQADEX — Experimental Web Games',
  description: 'An experimental digital arcade. Physics-driven chaos, procedural systems, and interactive madness. Search, favourite, and play in your browser — no installs, no accounts.',
  keywords: ['arcade', 'indie games', 'experimental', 'web games', 'interactive', 'cyberpunk', 'arqadex'],
  openGraph: {
    title: 'ARQADEX',
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

        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ARQADEX" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#06060e" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />


        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Orbitron:wght@400;500;600;700;800;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --font-syne: 'Syne', sans-serif;
            --font-orbitron: 'Orbitron', monospace;
            --font-space-mono: 'Space Mono', monospace;
            --font-pixel: 'Press Start 2P', monospace;
          }
        `}</style>
        {/* Set the saved theme before first paint so the page never flashes the wrong look. */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('arqadex:theme');
            var ok = ['neon', 'synthwave', 'matrix', 'daylight'].indexOf(JSON.parse(t || '"neon"')) >= 0;
            document.documentElement.dataset.theme = ok ? JSON.parse(t) : 'neon';
          } catch (e) {
            document.documentElement.dataset.theme = 'neon';
          }
        `}} />

        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/service-worker.js').catch(function(){});
            });
          }
          window.__installPrompt = null;
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.__installPrompt = e;
            var btn = document.getElementById('arqadex-install-btn');
            if (btn) btn.style.display = 'flex';
          });
          window.addEventListener('appinstalled', function() {
            var btn = document.getElementById('arqadex-install-btn');
            if (btn) btn.style.display = 'none';
          });
        `}} />

      </head>
      <body className="antialiased" style={{ background: 'var(--bg)', color: 'var(--text)' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
