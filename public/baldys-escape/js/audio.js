// ════════════════════════════════════════════════════════
// Audio Engine — fully synthesized, no external files
// ════════════════════════════════════════════════════════

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.enabled = true;
    this.musicPlaying = false;
    this.musicWorldId = -1;
    this._musicTimeout = null;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.14;
      this.musicGain.connect(this.master);
    } catch (e) { this.enabled = false; }
  }

  ensure() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.enabled && this.ctx;
  }

  tone(freq, type, vol, dur, delay = 0, slideTo = null) {
    if (!this.ensure()) return;
    const now = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, now);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(this.master);
    o.start(now); o.stop(now + dur + 0.05);
  }

  noise(vol, dur, filterFreq, delay = 0, type = 'lowpass') {
    if (!this.ensure()) return;
    const now = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.ceil(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = type; filt.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(filt); filt.connect(g); g.connect(this.master);
    src.start(now); src.stop(now + dur + 0.05);
  }

  // ─── SFX ─────────────────────────────────────────
  jump()        { this.tone(220, 'sine', 0.1, 0.1, 0, 380); }
  land(f=1)     { this.noise(0.1*f, 0.08, 180+f*80); }
  footstep()    { this.noise(0.04, 0.04, 700); }
  death()       { this.tone(220, 'sawtooth', 0.12, 0.1, 0, 60); this.noise(0.2, 0.35, 350, 0.05); }
  splash()      { this.noise(0.25, 0.3, 900); this.tone(150, 'sine', 0.08, 0.2, 0.02, 60); }
  catapultFire(){ this.noise(0.15, 0.12, 1200); this.tone(140, 'sawtooth', 0.12, 0.18, 0, 80); }
  explosion()   { this.noise(0.35, 0.4, 500); this.tone(70, 'sine', 0.25, 0.5, 0, 30); }
  boulderCrack(){ this.tone(90, 'sawtooth', 0.15, 0.3, 0, 50); }
  boulderCrash(){ this.noise(0.4, 0.5, 300); this.tone(55, 'sine', 0.3, 0.6, 0, 25); }
  swingCreak()  { this.tone(400, 'triangle', 0.05, 0.15, 0, 320); }
  bladeWhoosh() { this.noise(0.12, 0.2, 2000, 0, 'highpass'); }
  crumble()     { this.noise(0.18, 0.25, 600); }
  laserZap()    { this.tone(880, 'square', 0.08, 0.1); this.tone(440, 'square', 0.06, 0.1, 0.04); }
  turretFire()  { this.noise(0.12, 0.08, 1500); this.tone(300, 'square', 0.07, 0.08); }
  windGust()    { this.noise(0.1, 0.6, 400, 0, 'bandpass'); }
  coinChime()   { this.tone(880, 'sine', 0.1, 0.15); this.tone(1318, 'sine', 0.08, 0.15, 0.06); }
  click()       { this.tone(600, 'sine', 0.06, 0.05); }
  uiHover()     { this.tone(440, 'sine', 0.03, 0.04); }
  countdown(n)  { this.tone(n > 0 ? 300 + n*70 : 740, 'sine', 0.12, n>0?0.1:0.22); }

  victoryFanfare() {
    [523, 659, 784, 1047, 1318].forEach((f, i) => this.tone(f, 'sine', 0.13, 0.3, i*0.09));
  }
  starPop(i) {
    this.tone(660 + i*220, 'sine', 0.12, 0.2, 0, 880 + i*220);
  }
  gameOverJingle() {
    [330, 280, 220, 165].forEach((f, i) => this.tone(f, 'sawtooth', 0.1, 0.25, i*0.12));
  }

  // ─── PER-WORLD AMBIENT MUSIC LOOP ────────────────
  startMusic(world) {
    if (!this.ensure()) return;
    this.musicWorldId = world.id;
    this.musicPlaying = true;
    this._loop(world);
  }
  stopMusic() {
    this.musicPlaying = false;
    if (this._musicTimeout) clearTimeout(this._musicTimeout);
  }
  setWorld(world) {
    if (this.musicWorldId === world.id) return;
    this.musicWorldId = world.id;
  }

  _loop(world) {
    if (!this.musicPlaying || !this.ensure()) return;
    const bpm = 118 + world.id * 4;
    const beat = 60 / bpm;
    const bar = beat * 4;
    const now = this.ctx.currentTime;
    const scale = world.musicScale;
    const root = world.musicRoot;

    // Kick on 1 and 9 (16th grid)
    [0, 8].forEach(i => this._kick(now + i * (bar / 16)));
    // Hat every 2 steps
    for (let i = 0; i < 16; i += 2) this._hat(now + i * (bar / 16), 0.18);
    // Simple bass arpeggio from scale
    for (let i = 0; i < 8; i++) {
      const deg = scale[Math.floor(Math.random() * scale.length)];
      const freq = root * Math.pow(2, deg / 12) * 0.5;
      this._bass(now + i * (bar / 8), freq);
    }
    this._musicTimeout = setTimeout(() => this._loop(world), bar * 1000 * 0.98);
  }

  _kick(t) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(this.musicGain);
    o.start(t); o.stop(t + 0.25);
  }
  _hat(t, vol) {
    const len = Math.ceil(this.ctx.sampleRate * 0.04);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const filt = this.ctx.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol * 0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    src.connect(filt); filt.connect(g); g.connect(this.musicGain);
    src.start(t); src.stop(t + 0.06);
  }
  _bass(t, freq) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    const filt = this.ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 280;
    o.type = 'sawtooth'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.07, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(filt); filt.connect(g); g.connect(this.musicGain);
    o.start(t); o.stop(t + 0.22);
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.master) this.master.gain.value = this.enabled ? 0.55 : 0;
    return this.enabled;
  }
}

const SFX = new AudioEngine();
