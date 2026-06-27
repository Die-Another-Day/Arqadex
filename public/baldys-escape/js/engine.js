// ════════════════════════════════════════════════════════
// Engine — game loop, collisions, camera, input, states
// ════════════════════════════════════════════════════════

const ENGSTATE = { LOADING:'loading', PLAYING:'playing', PAUSED:'paused', DEAD:'dead', WON:'won' };

class Engine {
  constructor(renderer) {
    this.renderer = renderer;
    this.particles = new Particles();
    this.player = new Player();
    this.state = ENGSTATE.LOADING;
    this.level = null;
    this.theme = null;
    this.cameraX = 0;
    this.shake = 0;
    this.raf = null;
    this.lastT = 0;
    this.jumpHeld = false;
    this.deaths = 0;
    this.startTime = 0;
    this.elapsed = 0;

    this.onDeath = null;
    this.onWin = null;

    this._bindInput();
  }

  loadLevel(levelNum) {
    this.levelNum = levelNum;
    this.level = buildLevel(levelNum);
    this.theme = this.level.diff.world;
    this.player.reset(this.level.startX, GROUND_Y);
    this.cameraX = this.level.startX;
    this.renderer.setCamera(this.cameraX);
    this.deaths = 0;
    this.elapsed = 0;
    this.startTime = performance.now();
    this.shake = 0;
    this.state = ENGSTATE.PLAYING;
    SFX.startMusic(this.theme);
  }

  retry() {
    this.player.reset(this.level.startX, GROUND_Y);
    this.cameraX = this.level.startX;
    this.renderer.setCamera(this.cameraX);
    // reset obstacle dynamic state by rebuilding (deterministic, identical layout)
    this.level = buildLevel(this.levelNum);
    this.startTime = performance.now();
    this.elapsed = 0;
    this.state = ENGSTATE.PLAYING;
  }

  start() {
    this.lastT = 0;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(t => this._loop(t));
  }

  stop() {
    if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
    SFX.stopMusic();
  }

  pauseToggle(forceState) {
    if (forceState !== undefined) {
      this.state = forceState ? ENGSTATE.PAUSED : ENGSTATE.PLAYING;
      return;
    }
    if (this.state === ENGSTATE.PLAYING) this.state = ENGSTATE.PAUSED;
    else if (this.state === ENGSTATE.PAUSED) this.state = ENGSTATE.PLAYING;
  }

  _loop(ts) {
    const dtMs = this.lastT ? Math.min(ts - this.lastT, 40) : 16;
    this.lastT = ts;
    const dt = dtMs / 16.67;

    if (this.state === ENGSTATE.PLAYING) {
      this._update(dt, dtMs);
    }
    this._render(dt, dtMs);
    this.raf = requestAnimationFrame(t => this._loop(t));
  }

  // ─── UPDATE ──────────────────────────────────────
  _update(dt, dtMs) {
    const p = this.player;
    this.elapsed += dtMs;

    if (this.jumpHeld) p.holdJump(dtMs);

    const wasAlive = p.alive, wasWon = p.won;

    // Update obstacles (only those near the camera, for perf)
    for (const obs of this.level.obstacles) {
      if (Math.abs(obs.x - this.cameraX) > 1400) continue;
      obs.update(dt, dtMs, p, this.theme);
    }

    p.update(dt, dtMs, this.level.diff);

    if (p.alive && !p.won) {
      this._resolveGround();
      this._checkFinish();
    }

    // footstep sound occasionally while walking
    if (p.state === PSTATE.WALK && p.onGround && Math.random() < 0.02) SFX.footstep();

    // Camera follow with lead
    const lead = 130;
    const targetCam = p.alive ? p.x + lead : this.cameraX;
    this.cameraX += (targetCam - this.cameraX) * 0.09;
    this.renderer.setCamera(this.cameraX);

    if (this.shake > 0) this.shake *= 0.88;

    this.particles.update(dt);

    // Detect new death
    if (wasAlive && !p.alive) {
      this.deaths++;
      this.shake = 14;
      this.particles.burst(p.x, p.y - 20, '#ffffff', 10);
      this.state = ENGSTATE.DEAD;
      if (this.onDeath) this.onDeath({ deaths: this.deaths });
    }
    // Detect new win
    if (wasAlive && p.won && !wasWon) {
      this.shake = 6;
      this.particles.confetti(p.x, p.y - 30, 60);
      this.state = ENGSTATE.WON;
      const stars = starsForDeaths(this.deaths);
      const timeSec = Math.round(this.elapsed / 100) / 10;
      if (this.onWin) this.onWin({ deaths: this.deaths, stars, time: timeSec });
    }
  }

  _resolveGround() {
    const p = this.player;
    if (p.state === PSTATE.SWING) return; // managed independently

    // Static ground lookup
    let groundY = null;
    for (const seg of this.level.groundSegments) {
      if (p.x >= seg.x && p.x <= seg.x + seg.w) { groundY = seg.y; break; }
    }

    // Dynamic supports (crumble, fallen rubble, moving platforms handle themselves)
    for (const obs of this.level.obstacles) {
      if (Math.abs(obs.x - p.x) > 200) continue;
      const res = obs.interact(p, groundY);
      if (res && res.supportY !== undefined) {
        if (groundY === null || res.supportY < groundY) groundY = res.supportY;
      }
      if (res === 'die_spike' && p.alive) { p.die('spike'); }
    }

    if (p.state === PSTATE.SEESAW) {
      // seesaw obstacle manages its own y/onGround; just check fall-through already handled
      return;
    }

    if (groundY !== null) {
      if (p.y >= groundY && p.vy >= 0) {
        p.y = groundY;
        p.vy = 0;
        if (!p.onGround) {
          if (p.state === PSTATE.JUMP || p.state === PSTATE.FALL) {
            this.particles.dust(p.x, p.y, 'rgba(255,255,255,0.5)', 5);
            if (p.vy > 4) SFX.land(0.6);
          }
        }
        p.onGround = true;
        p.isJumping = false;
        if (p.state !== PSTATE.WIN) p.state = PSTATE.WALK;
      } else if (p.y < groundY) {
        p.onGround = false;
        if (p.state === PSTATE.WALK) p.state = p.vy < 0 ? PSTATE.JUMP : PSTATE.FALL;
      }
    } else {
      // no ground beneath — falling into pit/gap
      p.onGround = false;
      if (p.state === PSTATE.WALK) p.state = PSTATE.FALL;
      if (p.y > GROUND_Y + 90 && p.state !== PSTATE.SWING) {
        p.die('water');
      }
    }
  }

  _checkFinish() {
    const p = this.player;
    if (p.x >= this.level.finishX - 14 && p.onGround) {
      p.win();
    }
  }

  // ─── RENDER ──────────────────────────────────────
  _render(dt, dtMs) {
    const r = this.renderer;
    r.clear();

    const shakeX = this.shake ? (Math.random()-0.5)*this.shake : 0;
    const shakeY = this.shake ? (Math.random()-0.5)*this.shake : 0;

    r.renderSky(this.theme, dtMs);

    r.ctx.save();
    r.ctx.translate(shakeX, shakeY);
    r.applyCamera();

    r.renderGround(this.level.groundSegments, this.theme);
    for (const obs of this.level.obstacles) {
      if (Math.abs(obs.x - this.cameraX) > 900) continue;
      obs.draw(r.ctx, this.theme);
    }
    r.renderFinish(this.level.finishX, this.theme);
    this.player.draw(r.ctx, this.theme);
    this.particles.draw(r.ctx);

    r.resetCamera();
    r.ctx.restore();
  }

  // ─── INPUT ───────────────────────────────────────
  _bindInput() {
    const down = () => {
      if (this.state !== ENGSTATE.PLAYING) return;
      this.jumpHeld = true;
      this.player.startJump();
    };
    const up = () => {
      this.jumpHeld = false;
      this.player.releaseJump();
    };
    window.addEventListener('keydown', e => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); down(); }
    });
    window.addEventListener('keyup', e => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { up(); }
    });
    this._down = down;
    this._up = up;
  }

  bindCanvasPointer(canvas) {
    canvas.addEventListener('pointerdown', e => { e.preventDefault(); this._down(); });
    window.addEventListener('pointerup', () => this._up());
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  getProgress() {
    if (!this.level) return 0;
    return Math.max(0, Math.min(1, (this.player.x - this.level.startX) / (this.level.finishX - this.level.startX)));
  }
}
