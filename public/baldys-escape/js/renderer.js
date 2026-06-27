// ════════════════════════════════════════════════════════
// Renderer — backgrounds, ground, decorations, world themes
// All ground/obstacle/player drawing happens in WORLD SPACE.
// The engine applies one camera ctx.translate() before drawing
// world objects, and resets it for screen-space UI/background.
// ════════════════════════════════════════════════════════

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = 0; this.H = 0;
    this.cameraX = 0;
    this.time = 0;
  }

  resize() {
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = this.W;
    this.canvas.height = this.H;
  }

  // Camera origin: where world (cameraX, GROUND_Y) lands on screen
  get originX() { return this.W * 0.32 - this.cameraX; }
  get originY() { return this.H * 0.62 - GROUND_Y; }

  applyCamera() {
    this.ctx.save();
    this.ctx.translate(this.originX, this.originY);
  }
  resetCamera() {
    this.ctx.restore();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.W, this.H);
  }

  renderSky(theme, dt) {
    this.time += dt;
    const { ctx, W, H } = this;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, theme.sky[0]);
    g.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(W*0.78, H*0.2, 64, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    this._renderClouds();
    if (theme.decoration !== 'sky') this._renderSkyline(theme);
  }

  _renderClouds() {
    const { ctx, W, H } = this;
    const parallax = this.cameraX * 0.05;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 280 - parallax) % (W + 500)) - 250 + (i*37 % 80);
      const cy = 50 + (i % 3) * 55;
      this._cloud(cx, cy, 34 + (i%2)*10);
    }
    ctx.restore();
  }

  _cloud(x, y, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, r*0.6, 0, Math.PI*2);
    ctx.arc(x+r*0.55, y-r*0.22, r*0.5, 0, Math.PI*2);
    ctx.arc(x+r*1.05, y, r*0.55, 0, Math.PI*2);
    ctx.fill();
  }

  _renderSkyline(theme) {
    const { ctx, W, H } = this;
    const baseY = this.H * 0.62;
    const parallax = this.cameraX * 0.22;
    ctx.save();
    ctx.globalAlpha = theme.skylineAlpha;
    ctx.fillStyle = theme.skyline;
    const spacing = 92;
    const startIdx = Math.floor(parallax / spacing) - 1;
    for (let i = startIdx; i < startIdx + Math.ceil(W / spacing) + 3; i++) {
      const bx = i * spacing - parallax;
      const seed = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
      const bh = 70 + seed * 160;
      const bw = 55 + seed * 28;
      ctx.fillRect(bx, baseY - bh, bw, bh + 60);
    }
    ctx.restore();
  }

  // ─── WORLD-SPACE (camera already applied) ─────────
  renderGround(groundSegments, theme) {
    const ctx = this.ctx;
    for (const seg of groundSegments) {
      ctx.fillStyle = theme.ground;
      ctx.fillRect(seg.x, seg.y, seg.w, 500);
      ctx.fillStyle = theme.groundDark;
      ctx.fillRect(seg.x, seg.y, seg.w, 6);
      ctx.fillStyle = theme.accent;
      ctx.fillRect(seg.x, seg.y, seg.w, 2.5);
      ctx.save();
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = '#000000';
      for (let dx = 8; dx < seg.w; dx += 18) {
        for (let dy = 16; dy < 90; dy += 18) {
          if (((dx + dy + Math.floor(seg.x)) % 37) < 4) {
            ctx.beginPath(); ctx.arc(seg.x+dx, seg.y+dy, 1.4, 0, Math.PI*2); ctx.fill();
          }
        }
      }
      ctx.restore();
    }
  }

  renderFinish(finishX, theme) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(finishX, GROUND_Y);
    ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-130); ctx.stroke();
    const wave = Math.sin(this.time * 0.005) * 6;
    ctx.fillStyle = theme.accent;
    ctx.beginPath();
    ctx.moveTo(0, -130);
    ctx.lineTo(46 + wave, -118);
    ctx.lineTo(0, -100);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = '#555';
    ctx.fillRect(-12, -4, 24, 8);
    ctx.restore();
  }

  setCamera(x) { this.cameraX = x; }
}
