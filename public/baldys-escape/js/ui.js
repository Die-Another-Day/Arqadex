// ════════════════════════════════════════════════════════
// UI — screens, level select, HUD, pause, death/win overlays
// ════════════════════════════════════════════════════════

class UI {
  constructor(engine, renderer, save) {
    this.engine = engine;
    this.renderer = renderer;
    this.save = save;
    this.currentWorldTab = 0;
    this.pendingLevelNum = 1;
    this._cache();
    this._bind();
  }

  _cache() {
    this.$menu      = document.getElementById('s-menu');
    this.$levels    = document.getElementById('s-levels');
    this.$how       = document.getElementById('s-how');
    this.$hud       = document.getElementById('hud');
    this.$pause     = document.getElementById('s-pause');
    this.$death     = document.getElementById('s-death');
    this.$complete  = document.getElementById('s-complete');
    this.$finale    = document.getElementById('s-finale');
    this.$worldTabs = document.getElementById('world-tabs');
    this.$levelGrid = document.getElementById('level-grid');
    this.$totalStars= document.getElementById('total-stars');
    this.$progFill  = document.getElementById('prog-fill');
    this.$hudLevel  = document.getElementById('hud-level');
    this.$hudDeaths = document.getElementById('hud-deaths');
    this.$worldBanner = document.getElementById('world-banner');
  }

  _bind() {
    btn('btn-play',        () => this.showLevels());
    btn('btn-how',         () => this.show('how'));
    btn('btn-how-back',    () => this.showMenu());
    btn('btn-levels-back', () => this.showMenu());
    btn('btn-pause',       () => this.openPause());
    btn('btn-resume',      () => this.closePause());
    btn('btn-restart',     () => this.retryLevel());
    btn('btn-pause-menu',  () => this.quitToMenu());
    btn('btn-death-retry', () => this.retryLevel());
    btn('btn-death-menu',  () => this.quitToMenu());
    btn('btn-next-level',  () => this.nextLevel());
    btn('btn-complete-levels', () => this.showLevels());
    btn('btn-complete-retry',  () => this.retryLevel());
    btn('btn-finale-menu', () => this.quitToMenu());
    btn('btn-sound',       () => this.toggleSound());

    this.engine.onDeath = () => setTimeout(() => this.showDeath(), 650);
    this.engine.onWin   = (stats) => setTimeout(() => this.showComplete(stats), 500);
  }

  show(name) {
    ['s-menu','s-levels','s-how'].forEach(id => {
      document.getElementById(id).classList.toggle('hidden', id !== 's-'+name);
    });
    this.hideOverlays();
  }

  hideOverlays() {
    [this.$hud, this.$pause, this.$death, this.$complete, this.$finale].forEach(el => el.classList.add('hidden'));
  }

  showMenu() {
    this.engine.stop();
    this.$totalStars.textContent = this.save.totalStars();
    this.show('menu');
  }

  showLevels() {
    this.engine.stop();
    this.show('levels');
    this._renderWorldTabs();
    this._renderLevelGrid(this.currentWorldTab);
  }

  _renderWorldTabs() {
    this.$worldTabs.innerHTML = '';
    WORLDS.forEach((w, i) => {
      const unlockedCount = this.save.worldUnlockedCount(i);
      const tab = document.createElement('div');
      tab.className = 'world-tab' + (i === this.currentWorldTab ? ' active' : '') + (unlockedCount === 0 ? ' locked' : '');
      tab.style.setProperty('--accent', w.accent);
      tab.innerHTML = `<span class="wt-dot" style="background:${w.accent}"></span>${w.short}`;
      tab.onclick = () => { this.currentWorldTab = i; this._renderWorldTabs(); this._renderLevelGrid(i); };
      this.$worldTabs.appendChild(tab);
    });
  }

  _renderLevelGrid(worldIdx) {
    const w = WORLDS[worldIdx];
    this.$worldBanner.textContent = `World ${worldIdx+1} — ${w.name}`;
    this.$worldBanner.style.color = w.accent;
    this.$levelGrid.innerHTML = '';
    const startLevel = worldIdx * GAME.LEVELS_PER_WORLD + 1;
    for (let i = 0; i < GAME.LEVELS_PER_WORLD; i++) {
      const levelNum = startLevel + i;
      const unlocked = this.save.isUnlocked(levelNum);
      const stars = this.save.getStars(levelNum);
      const isBoss = (i === GAME.LEVELS_PER_WORLD - 1);
      const card = document.createElement('button');
      card.className = 'level-card' + (unlocked ? '' : ' locked') + (isBoss ? ' boss' : '');
      card.disabled = !unlocked;
      card.style.setProperty('--accent', w.accent);
      if (unlocked) {
        card.innerHTML = `
          <div class="lc-num">${isBoss ? '👑' : levelNum}</div>
          <div class="lc-stars">${starIcons(stars)}</div>`;
        card.onclick = () => this.startLevel(levelNum);
      } else {
        card.innerHTML = `<div class="lc-lock">🔒</div>`;
      }
      this.$levelGrid.appendChild(card);
    }
  }

  startLevel(levelNum) {
    this.pendingLevelNum = levelNum;
    this.engine.loadLevel(levelNum);
    this.engine.pauseToggle(true); // hold in paused state during countdown
    this.engine._render(1, 16); // paint one frame behind the countdown overlay
    this.hideOverlays();
    ['s-menu','s-levels','s-how'].forEach(id => document.getElementById(id).classList.add('hidden'));
    this._updateHUDStatic();
    this.startCountdown(() => {
      this.$hud.classList.remove('hidden');
      this.engine.pauseToggle(false);
      this.engine.start();
    });
  }

  startCountdown(cb) {
    const cdEl = document.getElementById('s-cd');
    const numEl = document.getElementById('cd-num');
    const subEl = document.getElementById('cd-sub');
    cdEl.classList.remove('hidden');
    let c = 3;
    numEl.style.color = '#ffd166';
    numEl.textContent = c;
    subEl.textContent = this.engine.theme ? this.engine.theme.name : 'Get Ready';
    SFX.countdown(c);
    const iv = setInterval(() => {
      c--;
      if (c > 0) {
        numEl.textContent = c;
        numEl.style.transform = 'scale(1.4)';
        SFX.countdown(c);
        setTimeout(() => { numEl.style.transform = 'scale(1)'; }, 130);
      } else if (c === 0) {
        numEl.textContent = 'GO!';
        numEl.style.color = '#5fcf8a';
        SFX.countdown(0);
      } else {
        clearInterval(iv);
        cdEl.classList.add('hidden');
        cb();
      }
    }, 550);
  }

  retryLevel() {
    this.hideOverlays();
    this.$hud.classList.remove('hidden');
    this.engine.retry();
  }

  nextLevel() {
    const next = this.pendingLevelNum + 1;
    if (next > GAME.TOTAL_LEVELS) { this.showFinale(); return; }
    this.startLevel(next);
  }

  quitToMenu() {
    this.engine.stop();
    this.showMenu();
  }

  openPause() {
    if (this.engine.state !== ENGSTATE.PLAYING) return;
    this.engine.pauseToggle(true);
    this.$pause.classList.remove('hidden');
  }
  closePause() {
    this.engine.pauseToggle(false);
    this.$pause.classList.add('hidden');
  }

  showDeath() {
    if (this.engine.state !== ENGSTATE.DEAD) return;
    document.getElementById('death-count').textContent = this.engine.deaths;
    this.$death.classList.remove('hidden');
  }

  showComplete(stats) {
    this.save.completeLevel(this.pendingLevelNum, stats.stars, stats.deaths);
    if (this.pendingLevelNum >= GAME.TOTAL_LEVELS) {
      this.showFinale();
      return;
    }
    document.getElementById('complete-time').textContent = stats.time + 's';
    document.getElementById('complete-deaths').textContent = stats.deaths;
    const starEls = document.querySelectorAll('#complete-stars .star');
    starEls.forEach((el, i) => {
      el.classList.remove('lit');
      setTimeout(() => {
        if (i < stats.stars) { el.classList.add('lit'); SFX.starPop(i); }
      }, 300 + i * 250);
    });
    const isBoss = this.pendingLevelNum % GAME.LEVELS_PER_WORLD === 0;
    document.getElementById('complete-title').textContent = isBoss ? '👑 World Conquered!' : 'Level Complete!';
    this.$complete.classList.remove('hidden');
  }

  showFinale() {
    this.engine.stop();
    this.$finale.classList.remove('hidden');
    this._fireConfettiLoop();
  }

  _fireConfettiLoop() {
    let count = 0;
    const iv = setInterval(() => {
      const canvas = document.getElementById('finale-canvas');
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const x = Math.random() * canvas.width;
        this._finaleParticles = this._finaleParticles || new Particles();
        this._finaleParticles.confetti(x, 0, 12);
      }
      count++;
      if (count > 40) clearInterval(iv);
    }, 200);
    this._animateFinale();
  }
  _animateFinale() {
    const canvas = document.getElementById('finale-canvas');
    if (!canvas) return;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const loop = () => {
      if (this.$finale.classList.contains('hidden')) return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if (this._finaleParticles) {
        this._finaleParticles.update(1);
        this._finaleParticles.draw(ctx);
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  toggleSound() {
    const on = SFX.toggle();
    document.getElementById('btn-sound').textContent = on ? '🔊' : '🔇';
    this.save.setSound(on);
  }

  _updateHUDStatic() {
    const d = this.engine.level.diff;
    this.$hudLevel.textContent = `${this.pendingLevelNum} · ${d.world.name}`;
    this.$hudLevel.style.color = d.world.accent;
  }

  tickHUD() {
    if (!this.engine.level || this.$hud.classList.contains('hidden')) return;
    const prog = this.engine.getProgress() * 100;
    this.$progFill.style.width = prog + '%';
    this.$hudDeaths.textContent = '💀 ' + this.engine.deaths;
  }
}

function btn(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}

function starIcons(count) {
  let s = '';
  for (let i = 0; i < 3; i++) s += i < count ? '⭐' : '☆';
  return s;
}
