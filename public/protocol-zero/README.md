# ⚡ PROTOCOL ZERO
### ARQADEX Behavioral Research Division — Classified Cognitive Assessment System v2.4.7

> *This is not a game. You are a subject.*

A psychological stress experiment disguised as a futuristic interactive system. Five escalating levels. Real behavioral data collected and profiled.

---

## 🚀 How to Run

```bash
# Just open in any modern browser — no server, no build step needed
open index.html

# Or serve locally for best performance:
python3 -m http.server 8080
# → http://localhost:8080
```

**Best experience:** Chrome or Firefox, fullscreen (`F11`), headphones on.

---

## 🧠 The Five Levels

### LEVEL 1 — SIGNAL INTERCEPT (Reflex)
- An 8×7 grid of 56 nodes
- Targets activate and must be clicked before they expire
- Decoys appear — visually similar to targets but penalize clicks
- 3 misses = **ELIMINATED** (restart from Level 1)
- Speed, target count, and decoy similarity escalate with progress
- Your average reaction time is secretly tracked

### LEVEL 2 — ETHICAL CALIBRATION (Morality)
- 10 moral dilemma questions with a live timer
- 2 wrong answers = Level 2 restart
- Fail Level 2 twice = **reset to Level 1** (all data wiped)
- Questions escalate from uncomfortable → genuinely disturbing
- Hover switches between options are tracked
- The final question is the meta-reveal

### LEVEL 3 — RECURSIVE LOOP (Entrapment)
- No fail state — but wrong choices increase loop depth
- Correct choices reduce depth toward the exit
- **The "correct" answer is randomly determined** — the player cannot know
- At high depth: text glitches, screen distorts, options become unreadable
- Exit appears when depth ≤ 6 after 14+ decisions (or forced at 28 decisions)
- Maximum depth: 26 — at which point the screen is nearly unreadable

### LEVEL 4 — PATTERN GHOST (Signal Recognition)
*Original invention — designed to reward the focused mind after psychological exhaustion*
- 2,500 particles form a shifting noise field
- A hidden shape briefly emerges from the particles then dissolves
- Player must identify the shape from 3–7 options
- Duration decreases each round (2.6s → 0.4s on Hard)
- Options increase per round (3 → 7)
- Particle movement accelerates with each round
- 10 rounds to complete

### LEVEL 5 — FINAL ASSESSMENT (Profile Reveal)
- All tracked data compiled into a real psychological profile
- Four dimensions: Reflex, Moral Architecture, Loop Resistance, Signal Clarity
- Composite behavioral portrait generated from the combination
- True reveal: "You were never a player. You were a subject."

---

## 🎮 Difficulty System

| Parameter | LOW | MEDIUM | HARD |
|---|---|---|---|
| Level 1 target window | 1650ms | 1050ms | 620ms |
| Level 1 decoy similarity | 28% | 60% | 84% |
| Level 1 hits required | 35 | 40 | 45 |
| Level 2 timer | 20s | 14s | 9s |
| Level 3 depth multiplier | 0.65× | 1.0× | 1.5× |
| Level 4 signal duration | 2600ms | 1700ms | 980ms |

---

## 🧬 Behavioral Tracking

Every interaction is tracked and fed into the final profile:

| Data Point | Used For |
|---|---|
| Reaction times (per target) | Reflex classification |
| Miss count + decoy hits | Reflex description modifier |
| Moral choices (all 10) | Moral archetype |
| Hover switches between options | Composite profile modifier |
| Answer timeouts | "Decision Avoider" classification |
| Loop depth (max + average) | Loop resistance classification |
| Level 2 fail count | Profile notation |
| Pattern lock accuracy | Signal clarity classification |
| Total loop decisions | Cognitive persistence note |

### Profile Classifications

**Reflex:**
- `APEX PREDATOR` — avg < 180ms, misses < 2
- `ACTIVE GUARDIAN` — avg < 320ms
- `CALCULATED OBSERVER` — avg ≥ 320ms

**Moral Architecture:**
- `DECISION AVOIDER` — 2+ timeouts
- `SYSTEMIC PRAGMATIST` — 0 wrong answers
- `EMPATHIC REALIST` — 1 wrong answer
- `EMOTIONAL ACTOR` — 2+ wrong answers

**Loop Resistance:**
- `SYSTEM RESISTER` — max depth ≤ 4
- `ADAPTIVE NAVIGATOR` — max depth ≤ 13
- `DEEP LOOP SUBJECT` — max depth > 13

**Signal Clarity:**
- `PATTERN SOVEREIGN` — ≥ 82% lock rate
- `SIGNAL NAVIGATOR` — ≥ 55% lock rate
- `NOISE-SATURATED` — < 55% lock rate

---

## 🎨 Visual Systems

- **FX Canvas** — Always-on overlay: scanlines, vignette, grain, chromatic aberration
- **Screen flash** — Color-coded hit/miss/correct/wrong feedback
- **Glitch effect** — Horizontal slice displacement + chromatic offset
- **Screen shake** — CSS animation on collision events
- **Boot sequence** — Typewriter terminal with progress bar
- **Level 1** — Canvas-rendered node grid with timer arcs, glow effects, particle feedback
- **Level 3** — CSS filter distortion (`blur` + `hue-rotate` + `saturate`) based on loop depth
- **Level 4** — 2,500-particle canvas field with signal particle glow rendering

---

## 🔊 Audio System (Web Audio API — fully procedural)

All sounds synthesized from oscillators. No audio files.

| Sound | Character |
|---|---|
| `tick` | High square wave blip (boot sequence) |
| `hit` | Clean sine at 660Hz |
| `miss` | Low sawtooth crash |
| `decoy` | Square + sawtooth dissonance |
| `correct` | Two-note ascending sine |
| `wrong` | Low sawtooth sting |
| `lock` | Three-note ascending confirm |
| `alert` | Two-note descending warning |
| `escape` | Six-note ascending arpeggio |
| `eliminate` | Three-layer distortion crash |
| `levelup` | Four-note harmonic sweep |

---

## 🗂️ File Structure

```
protocol-zero/
├── index.html    — All screens: boot, intro, difficulty, L1–L5, assessment
├── style.css     — Complete UI system (159 lines)
├── game.js       — Complete game engine (900 lines)
└── README.md
```

### game.js Architecture (in order)
1. Game state + difficulty config
2. Web Audio synthesizer
3. FX canvas (vignette, scanlines, grain, glitch, flash, shake)
4. Custom cursor
5. Screen manager + HUD
6. Level transition system
7. Boot sequence
8. Level 1: Signal Intercept (canvas reflex game)
9. Level 2: Ethical Calibration (timed moral dilemmas)
10. Level 3: Recursive Loop (depth + distortion system)
11. Level 4: Pattern Ghost (particle field + signal detection)
12. Level 5: Assessment (data aggregation + profile generation)
13. Composite profile builder
14. Assessment UI renderer

---

## 🌐 Deployment

Works as a static site — no server required.

```bash
# GitHub Pages: push files to repo root
# Netlify: drag folder into netlify.com/drop
# Vercel: vercel deploy --prod

# Local with Python:
python3 -m http.server 8080

# Local with Node:
npx serve .
```

---

## ⚠️ Design Notes

**The Recursive Loop is deliberately unfair.** The "correct" answer is randomly assigned each session. There is no learnable pattern. This is the point — it tests entrainment resistance and the human tendency to find logic in arbitrary systems.

**The moral questions do not have obvious correct answers.** The game defines "correct" based on an internal ethical framework that prioritizes long-term systemic consequence over short-term emotional satisfaction — but never explains this to the player. The confusion is intentional.

**The final reveal is real.** All tracked data in the assessment is genuine — pulled from actual gameplay behavior.

---

*Built for chaos. — ARQADEX LAB 2025*
