# ARQADEX — Experimental Web Games

A browser arcade lab. Physics-driven chaos, procedural systems, voice combat,
reflex experiments and interactive madness — all playable on the web, no installs,
no accounts, no tracking.

Live site: **https://arqadex.site**

## What's in v2.2.2 — hero title actually fits its box

- v2.2.1 only lowered the phone floor and did not fix the wide view. The
  real measurement: Syne 800 "ARQADEX" advances 8.464em, so at the old
  10rem cap the word was 1,354px wide inside a 1,024px container — it
  only looked centred by overflowing its box. The title is now sized
  from that measurement: `clamp(1.9rem, 10vw, 8rem)` inside a widened
  1,280px hero container, so the word fits its box at every width
  (320px phone through desktop) and its centre is the box's centre.
- Line height raised from 0.9 to 1.05 so Syne's Q tail no longer drops
  into the subtitle line.

## What's in v2.2.1 — hero centering fix

- The ARQADEX hero title was wider than a phone-width container (its size
  had a 4rem floor), so on narrow screens the final X ran off the right
  edge — and the section hides overflow, so no scrollbar ever revealed
  it. The title now scales with `clamp(2.75rem, 13vw, 10rem)`, stays on
  one line, and is centred with an inline `text-align: center` so no
  stylesheet rule can quietly un-centre it again.
- Also added the missing `@keyframes scan` the hero's scan line was
  already referencing, so it sweeps down the hero instead of sitting at
  the top.

## What's in v2.2 — the games themselves, upgraded

- **Score Vault (every game)** — the game frame now has a VAULT panel with a
  live session timer and the game's own description. The static games don't
  report scores back to the arcade, so the vault is honestly player-entered:
  you type the final score you saw, and the arcade remembers your best per
  game. Vault bests surface on game cards and in Your Cabinet. Reflex Rush
  and Aim Trainer stay automatic — their bests are recorded by the games.
- **Today's Pick** — one game a day, the same for everyone, changing at
  midnight (local date), on the home page under Feeling Lucky.
- **Protocol Zero** — completed profiles are now saved in your browser (last
  5), shown on the intro screen next time, and the final assessment screen
  has a COPY PROFILE button.
- **Signal Collapse** — sector progress now persists (Continue button and
  best-moves on the title screen), a HINT button highlights the next node
  on a shortest feasible path (BFS over position + repairs remaining), and
  the win screen now also shows moves and time.
- **Quantum Drift** — deepest sector reached is now saved and shown on the
  main menu, and switching tabs mid-run auto-pauses instead of draining
  the run.
- **Baldys Escape, VI-Battle, Merge Ball, Multiplayer Psych** — no surgery
  inside these: Baldys already has a 100-level save/star system, VI-Battle
  and Merge Ball are compiled builds where edits risk breaking the game,
  and Multiplayer Psych is simulated. All four get the universal shell
  upgrades (Vault, timer, about panel, theme, cursor) instead.

## What's in v2.1

- **Daylight is now the default theme** — bright arcade first, with Neon Void,
  Synthwave and Matrix one click away. A saved theme still wins for returning
  visitors.
- **Themes now reach inside the games** — every game plays inside the GameShell
  frame, which re-tints the game itself per theme (plus a themed header, theme
  switcher, reload and fullscreen). The custom cursor is injected into the
  game's own document too, so it never drops back to the system arrow mid-game.
- **A richer cursor everywhere** — click ripples, a fading motion trail,
  a caret-bar shape over text fields, and per-theme personalities (square in
  Matrix, soft daylight glow, extra synthwave bloom).
- **Aim Trainer** (`/aim/`) — the second built-in game: 30-second rounds,
  fast-fading targets, accuracy tracking and a best score in Your Cabinet.
- **Livelier environment** — the ambient particle dust re-colours itself when
  the theme changes, and theme switches cross-fade instead of snapping.

## What's in v2.0

- **A real arcade browser** — search, filter by tag, sort, and star favourites.
  CTRL is the one game still in the lab (72%); everything else is live.
- **4 switchable themes** — Neon Void, Synthwave, Matrix and Daylight. Pick one in
  the nav bar; it is saved in your browser and applied before first paint.
- **Command palette** — press `Ctrl/⌘K` anywhere to search games, jump to a
  section, switch theme, or play a random game.
- **Feeling Lucky slot machine** on the hero — spin and it picks a live game for you.
- **Your Cabinet** — favourites, recently played, play counts and your best
  Reflex Rush time, stored only in `localStorage` on your own device.
- **Reflex Rush** (`/reflex/`) — a built-in reaction-time game. Wait for the
  flash, tap fast, beat your best. False starts count.
- **Open submissions** (`/submit/`) — creators can pitch an experimental game.

## Games

| Game | What it is | Status |
| --- | --- | --- |
| Protocol Zero | Reflex / psycho sim, featured release | Live |
| Baldys Escape | Glitch runner | Live |
| Merge Ball | Physics merge chaos | Live |
| Signal Collapse | Puzzle / network collapse | Live |
| VI-Battle | Voice-controlled combat | Live |
| Quantum Drift | Quantum physics racing | Live |
| Multiplayer Psych | Social dynamics as game loops | Live |
| Reflex Rush | Built-in reaction test | Live |
| Aim Trainer | Built-in 30-second aim test | Live |
| CTRL | Control systems at breaking point | In the lab (72%) |

## Run it locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export into out/
```

The site is a static Next.js export (`output: 'export'` in `next.config.ts`),
so the built `out/` folder can be hosted anywhere static — the live site is
served from this repo's build.

## Add a game

1. Drop the playable game files under `public/<game-slug>/` (an `index.html`
   entry point), or add a Next route under `app/<game-slug>/` that embeds them
   in an iframe, like `app/signal-collapse/page.tsx` does.
2. Add one entry to the `GAMES` array in `lib/games.ts` — title, tagline, tags,
   colour, status and `url`. Leave `url` off and the game shows as in-development
   instead of a dead link.
3. It appears automatically in the arcade browser, the command palette, the
   random picker, the footer live list and the cabinet.

## Project layout

- `app/` — pages: home, `/reflex/`, `/submit/`, and iframe wrappers for the
  static games (`/signal-collapse/`, `/vi-battle/`, `/multiplayer-psych/`).
- `components/` — nav, hero, featured game, game browser, cabinet, lab, about, footer.
- `lib/games.ts` — the single source of truth for every game.
- `lib/arcade.ts` — themes, favourites, recents, play counts, best reflex time
  (all `localStorage`, nothing leaves the browser).
- `public/` — the playable static games, PWA manifest and service worker.
