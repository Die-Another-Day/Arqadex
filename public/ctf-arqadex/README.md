# ⚡ ARQADEX CTF DIVISION
### ctf.arqadex.site — Premium Challenge Engineering Platform

> *We do not deliver challenges. We deliver experiences.*

A complete futuristic cybersecurity platform showcasing ARQADEX as a premium CTF challenge development team. Built to match the ARQADEX cyberpunk aesthetic — cinematic, immersive, interactive.

---

## 🚀 Deploy

```bash
# Zero dependencies — just open or serve statically
open index.html

# Or serve:
python3 -m http.server 8080
npx serve .

# For subdomain deployment (GitHub Pages / Netlify / Vercel):
# Push all 3 files to repo root or /docs folder
# Point ctf.arqadex.site CNAME to your hosting
```

---

## 📋 Platform Sections

| Section | Purpose |
|---|---|
| **Hero** | Cinematic landing with animated stats counter |
| **Mission Brief** | What ARQADEX CTF builds — with live terminal |
| **Categories** | 10 discipline cards, each links to filtered challenges |
| **Challenge Showcase** | 20 sample challenges, filterable, with working modal |
| **Mission Terminal** | 6-step booking system with transmission animation |
| **Division** | Team profile, expertise bars, trust indicators |
| **Footer** | Links, contact, attribution |

---

## 🏆 20 Sample Challenges (2 per category)

### Web Exploitation
- `JWT_NIGHTMARE` ★★★ — Algorithm confusion attack (350 pts)
- `GRAPHQL_INTRUSION` ★★★★ — Introspection + mass assignment (500 pts)

### Reverse Engineering
- `BINARY_PHANTOM` ★★★ — Anti-debug + Feistel cipher (400 pts)
- `VM_LABYRINTH` ★★★★★ — Custom stack VM bytecode (650 pts)

### Cryptography
- `ORACLE_WHISPERS` ★★★ — AES-CBC padding oracle (400 pts)
- `LATTICE_DREAMS` ★★★★★ — LWE with LLL reduction (650 pts)

### DFIR
- `PHANTOM_BREACH` ★★★ — Memory dump / DLL injection (350 pts)
- `LOG_GHOST` ★★★ — EVTX timeline / Pass-the-Hash (300 pts)

### OSINT
- `SHADOW_PROFILE` ★★★ — Cross-platform identity tracing (300 pts)
- `METADATA_GHOST` ★★ — EXIF geolocation + shadow analysis (200 pts)

### Pwn
- `STACK_PHANTOM` ★★★★★ — ROP chain + format string leak (600 pts)
- `HEAP_LABYRINTH` ★★★★★ — Tcache poisoning + __free_hook (700 pts)

### Steganography
- `FREQUENCY_GHOST` ★★ — Spectrogram QR + DTMF decode (250 pts)
- `LSB_LABYRINTH` ★★★ — Three-layer XOR LSB stego (350 pts)

### Malware Analysis
- `DARK_PAYLOAD` ★★★ — 7-layer Python deobfuscation (400 pts)
- `ROOTKIT_SHADOW` ★★★★★ — Linux kernel hook forensics (600 pts)

### AI Security
- `PROMPT_ARCHITECT` ★★★ — System prompt bypass + tool abuse (350 pts)
- `MODEL_INVERSION` ★★★★★ — Training data extraction attack (550 pts)

### Cloud Security
- `S3_NIGHTMARE` ★★★ — SSRF to IMDSv1 credential theft (400 pts)
- `ROLE_CONFUSION` ★★★★ — IAM privilege escalation chain (550 pts)

---

## ⚙️ Interactive Systems

### Challenge Modal
- Full challenge description with realistic scenario context
- Attached file listings (simulated)
- Expandable hint system with point costs
- **Working flag validation** — each challenge has a real flag
- Correct submission triggers success animation

### Mission Terminal (6-step booking)
1. **Operation Type** — Single / Pack / Full CTF
2. **Categories** — Multi-select discipline grid
3. **Parameters** — Count stepper, difficulty toggle, timeline, hardness slider
4. **Special Directives** — Free-text requirements
5. **Operative ID** — Name, email, organization
6. **Transmit** — Animated terminal transmission sequence

### Canvas Background
- 120-node neural network with connection lines
- Animated beacon sweep
- Particle drift with twinkling

### Other
- Custom dual-ring cursor
- Scroll-triggered reveal animations
- Animated stats counters
- Category filter with smooth transitions
- Expertise progress bars (intersection-triggered)
- Mobile-responsive layout

---

## 🎨 Design System

Matches the ARQADEX visual identity exactly:

| Token | Value |
|---|---|
| Background | `#020208` |
| Cyan accent | `#00F5FF` |
| Magenta accent | `#FF2DA6` |
| Purple accent | `#7A5CFF` |
| Lime accent | `#C7FF4D` |
| Display font | Orbitron |
| Mono font | Space Mono |

Each category has its own accent color used consistently across cards, filters, and modals.

---

## 🗂️ File Structure

```
ctf-arqadex/
├── index.html   — Complete HTML (454 lines) — all screens & sections
├── style.css    — Complete UI system (297 lines)
├── main.js      — All interactive systems (644 lines)
└── README.md
```

**Zero external dependencies.** Google Fonts loaded via CDN. No build step. No framework. No Node required.

---

## 📡 Subdomain Deployment

### GitHub Pages
```bash
# In repo settings → Pages → Source: main branch / root
# Add CNAME file containing: ctf.arqadex.site
# In DNS: add CNAME record ctf → your-username.github.io
```

### Netlify
```bash
# Drag folder to netlify.com/drop
# Site settings → Domain → Add custom domain: ctf.arqadex.site
```

### Cloudflare Pages
```bash
# Connect GitHub repo → Build: none (static)
# Custom domain: ctf.arqadex.site
```

---

*ARQADEX CTF DIVISION — Built for chaos. © 2025*
