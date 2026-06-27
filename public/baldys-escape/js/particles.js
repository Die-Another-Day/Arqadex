// ════════════════════════════════════════════════════════
// Particle System
// ════════════════════════════════════════════════════════

class Particles {
  constructor() { this.list = []; }

  dust(x, y, color, n = 6) {
    for (let i = 0; i < n; i++) {
      const ang = Math.PI + (Math.random() - 0.5) * 1.4;
      const spd = 1 + Math.random() * 2.5;
      this.list.push({
        x, y, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd - 1,
        size: 2 + Math.random()*2.5, color, life: 1, kind: 'circle',
      });
    }
  }

  burst(x, y, color, n = 16) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 4;
      this.list.push({
        x, y, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd - 2,
        size: 2.5 + Math.random()*3.5, color, life: 1, kind: 'circle',
      });
    }
  }

  confetti(x, y, n = 40) {
    const colors = ['#ff2d87','#00ffd1','#ffd166','#7bdc6c','#6fa8ff'];
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI/2 + (Math.random()-0.5) * Math.PI * 0.9;
      const spd = 4 + Math.random() * 6;
      this.list.push({
        x, y, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd,
        size: 4 + Math.random()*3, color: colors[i % colors.length],
        life: 1, kind: 'rect', spin: (Math.random()-0.5)*0.3, rot: Math.random()*Math.PI,
        gravity: 0.12,
      });
    }
  }

  update(dt) {
    for (const p of this.list) {
      p.x += p.vx; p.y += p.vy;
      p.vy += (p.gravity !== undefined ? p.gravity : 0.15);
      if (p.spin) p.rot += p.spin;
      p.life -= 1/ (p.kind==='rect' ? 90 : 35);
    }
    this.list = this.list.filter(p => p.life > 0);
  }

  draw(ctx) {
    for (const p of this.list) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.kind === 'rect') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot || 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * Math.max(0.2,p.life), 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
  }
}
