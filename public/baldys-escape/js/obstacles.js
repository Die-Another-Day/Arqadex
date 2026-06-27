// ════════════════════════════════════════════════════════
// Obstacles — every hazard kind, real update + draw + collision
// ════════════════════════════════════════════════════════

function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

class Obstacle {
  constructor(kind, x, opts) {
    this.kind = kind;
    this.x = x;
    Object.assign(this, opts);
    this.t = 0;
    this.triggered = false;
    this.done = false;
  }

  update(dt, dtMs, player, world) {
    this.t += dtMs;
    const fn = this['update_' + this.kind];
    if (fn) fn.call(this, dt, dtMs, player, world);
  }

  draw(ctx, theme) {
    const fn = this['draw_' + this.kind];
    if (fn) fn.call(this, ctx, theme);
  }

  // Returns 'die'|'safe'|null  — null means no special interaction
  interact(player, groundY) {
    const fn = this['interact_' + this.kind];
    if (fn) return fn.call(this, player, groundY);
    return null;
  }

  // ════════════════ PIT (water/lava/chasm/void/quicksand-visual) ════════════════
  draw_pit(ctx, theme) {
    const w = this.w, x0 = this.x;
    const y = this.groundY;
    const grad = ctx.createLinearGradient(x0, y, x0, y + 140);
    grad.addColorStop(0, theme.pitColor);
    grad.addColorStop(1, theme.pitColor2);
    ctx.fillStyle = grad;
    ctx.fillRect(x0, y, w, 400);
    // surface ripple line
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    const wob = Math.sin(this.t * 0.003) * 3;
    ctx.beginPath();
    ctx.moveTo(x0, y + 3 + wob);
    ctx.lineTo(x0 + w, y + 3 - wob);
    ctx.stroke();
    // bubbles for lava
    if (theme.dark) {
      for (let i = 0; i < 3; i++) {
        const bx = x0 + ((this.t * 0.02 + i * 40) % w);
        const by = y + 20 + Math.sin(this.t * 0.005 + i) * 10;
        ctx.fillStyle = 'rgba(255,200,100,0.5)';
        ctx.beginPath(); ctx.arc(bx, by, 2 + i, 0, Math.PI*2); ctx.fill();
      }
    }
  }

  // ════════════════ SPIKE FENCE ════════════════
  draw_spike_fence(ctx) {
    const x = this.x, y = this.groundY, w = this.w, h = this.h;
    ctx.fillStyle = '#caa45a';
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x, y - h*0.45, w, h*0.45);
    ctx.strokeRect(x, y - h*0.45, w, h*0.45);
    // spikes on top
    const n = Math.max(2, Math.floor(w / 11));
    ctx.fillStyle = '#3a3a3a';
    for (let i = 0; i < n; i++) {
      const sx = x + (i + 0.5) * (w / n);
      ctx.beginPath();
      ctx.moveTo(sx - 5, y - h*0.45);
      ctx.lineTo(sx, y - h);
      ctx.lineTo(sx + 5, y - h*0.45);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
  }
  interact_spike_fence(player) {
    const top = this.groundY - this.h;
    const inX = player.x + player.w*0.3 > this.x && player.x - player.w*0.3 < this.x + this.w;
    if (inX && player.y > top + 6 && !player.won) return 'die_spike';
    return null;
  }

  // ════════════════ CATAPULT + BOMB ════════════════
  update_catapult(dt, dtMs, player) {
    if (!this.fired && this.t > this.fireDelay) {
      this.fired = true;
      this.bomb = {
        x: this.landX, y: this.groundY - 230,
        vy: 2.2, exploded: false, explodeT: 0,
      };
      SFX.catapultFire();
    }
    if (this.bomb && !this.bomb.exploded) {
      this.bomb.vy += PHYS.GRAVITY * 0.9;
      this.bomb.y += this.bomb.vy;
      if (this.bomb.y >= this.groundY - 8) {
        this.bomb.y = this.groundY - 8;
        this.bomb.exploded = true;
        this.bomb.explodeT = 0;
        SFX.explosion();
      }
      if (!player.won && player.alive) {
        const d = Math.hypot(player.x - this.bomb.x, player.y - 20 - this.bomb.y);
        if (d < 20) player.die('explosion');
      }
    }
    if (this.bomb && this.bomb.exploded) {
      this.bomb.explodeT += dtMs;
      if (this.bomb.explodeT < 420 && !player.won && player.alive) {
        const d = Math.hypot(player.x - this.bomb.x, this.groundY - 10 - player.y);
        if (this.bomb.explodeT > 60 && d < 46) player.die('explosion');
      }
      if (this.bomb.explodeT > 1000) {
        this.fired = false; this.t = 0; this.bomb = null;
      }
    }
  }
  draw_catapult(ctx, theme) {
    const x = this.x, gy = this.groundY;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2;
    ctx.fillStyle = '#5fcf8a';
    ctx.beginPath();
    ctx.moveTo(x-10, gy); ctx.lineTo(x+22, gy-78); ctx.lineTo(x+34, gy-78); ctx.lineTo(x+44, gy);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9aa0a8';
    ctx.beginPath(); ctx.arc(x+28, gy-78, 11, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    const windPhase = Math.min(1, this.t / this.fireDelay);
    const armAngle = -0.5 - windPhase * 0.9 + (this.fired ? 1.5 : 0);
    ctx.save();
    ctx.translate(x+28, gy-78);
    ctx.rotate(armAngle);
    ctx.fillStyle = '#e0b34a';
    ctx.fillRect(-46, -6, 92, 12);
    ctx.strokeRect(-46, -6, 92, 12);
    for (let i=-40;i<46;i+=14) { ctx.beginPath(); ctx.moveTo(i,-6); ctx.lineTo(i,6); ctx.stroke(); }
    ctx.restore();

    // Warning shadow on landing spot before impact
    if (this.fired && this.bomb && !this.bomb.exploded) {
      const fallProg = Math.max(0, Math.min(1, (this.groundY - 8 - this.bomb.y) / (this.groundY - 8 - (this.groundY-230))));
      ctx.save();
      ctx.globalAlpha = 0.25 + fallProg * 0.35;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(this.landX, gy - 4, 18 + fallProg*8, 6, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    if (this.bomb) {
      if (!this.bomb.exploded) {
        ctx.save();
        ctx.translate(this.bomb.x, this.bomb.y);
        ctx.fillStyle = '#2b2b2b';
        ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle='#000'; ctx.stroke();
        ctx.strokeStyle = '#ffaa33'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(0,-9); ctx.lineTo(3,-15); ctx.stroke();
        ctx.fillStyle='#ffd34d';
        ctx.beginPath(); ctx.arc(3,-16,2,0,Math.PI*2); ctx.fill();
        ctx.restore();
      } else if (this.bomb.explodeT < 500) {
        const r = (this.bomb.explodeT / 500) * 50;
        const alpha = 1 - this.bomb.explodeT/500;
        ctx.fillStyle = `rgba(255,140,40,${alpha*0.65})`;
        ctx.beginPath(); ctx.arc(this.bomb.x, this.bomb.y-6, r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = `rgba(255,230,140,${alpha})`;
        ctx.beginPath(); ctx.arc(this.bomb.x, this.bomb.y-6, r*0.5, 0, Math.PI*2); ctx.fill();
      }
    }
  }

  // ════════════════ ROPE SWING ════════════════
  draw_rope_swing(ctx) {
    const s = this.swing;
    const bx = s.pivotX + Math.sin(s.angle) * s.length;
    const by = s.pivotY + Math.cos(s.angle) * s.length;
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.pivotX-14, s.pivotY); ctx.lineTo(bx-12, by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s.pivotX+14, s.pivotY); ctx.lineTo(bx+12, by); ctx.stroke();
    ctx.fillStyle = '#c8923f';
    ctx.fillRect(bx-16, by-5, 32, 10);
    ctx.strokeRect(bx-16, by-5, 32, 10);
    // spikes flanking the shaft
    this._drawSpikeWall(ctx, this.x - 4, this.groundTop, this.groundY, 'left');
    this._drawSpikeWall(ctx, this.x + this.w - 18, this.groundTop, this.groundY, 'right');
  }
  _drawSpikeWall(ctx, x, top, bottom, side) {
    ctx.fillStyle = '#444';
    const n = Math.floor((bottom - top) / 16);
    for (let i = 0; i < n; i++) {
      const y = top + i * 16;
      ctx.beginPath();
      if (side === 'left') {
        ctx.moveTo(x, y); ctx.lineTo(x+16, y+8); ctx.lineTo(x, y+16);
      } else {
        ctx.moveTo(x+18, y); ctx.lineTo(x+2, y+8); ctx.lineTo(x+18, y+16);
      }
      ctx.closePath(); ctx.fill();
    }
  }
  update_rope_swing(dt, dtMs, player) {
    // Auto-grab: whenever the player is airborne and within the shaft's x-range
    // and anywhere in its vertical span, they catch the rope. Generous by design —
    // the skill is jumping into the shaft and timing the RELEASE, not pixel-perfect grabbing.
    if (player.state !== PSTATE.SWING && player.alive && !player.won) {
      const inShaftX = player.x > this.x - 6 && player.x < this.x + this.w + 6;
      const inShaftY = player.y > this.groundTop && player.y < this.groundY + 20;
      const airborne = player.state === PSTATE.JUMP || player.state === PSTATE.FALL;
      if (inShaftX && inShaftY && airborne) {
        player.state = PSTATE.SWING;
        player.swingRef = this.swing;
        // snap swing angle so the bob starts near the player's current position for a smooth catch
        const relX = player.x - this.swing.pivotX;
        const relY = player.y - this.swing.pivotY;
        const ang = Math.atan2(relX, relY);
        this.swing.angle = Math.max(-1.1, Math.min(1.1, ang));
        SFX.swingCreak();
      }
    }
    // death if falls into shaft without ever grabbing
    if (player.alive && !player.won && player.state !== PSTATE.SWING) {
      const inShaft = player.x > this.x && player.x < this.x + this.w;
      if (inShaft && player.y > this.groundY - 4 && player.y < this.groundY + 30) {
        player.die('spike');
      }
    }
  }

  // ════════════════ LADDER + BOULDER ════════════════
  draw_ladder_boulder(ctx) {
    const x = this.x, gy = this.groundY;
    const ladderH = this.ladderHeight;
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x-9, gy); ctx.lineTo(x-9, gy-ladderH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+9, gy); ctx.lineTo(x+9, gy-ladderH); ctx.stroke();
    ctx.lineWidth = 3;
    for (let y = gy-12; y > gy-ladderH; y -= 16) {
      ctx.beginPath(); ctx.moveTo(x-9,y); ctx.lineTo(x+9,y); ctx.stroke();
    }
    // boulder
    if (!this.boulderFallen) {
      const wobble = this.boulderShaking ? Math.sin(this.t*0.08)*2 : 0;
      ctx.save();
      ctx.translate(x + wobble, gy - ladderH - 14);
      this._drawBoulder(ctx, 26);
      ctx.restore();
    } else {
      // rubble pile player climbs over
      ctx.save();
      ctx.translate(x, this.boulderY);
      this._drawBoulder(ctx, 26, true);
      ctx.restore();
    }
  }
  _drawBoulder(ctx, r, cracked) {
    ctx.fillStyle = '#9a9a9a';
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i=0;i<8;i++){
      const ang = i/8*Math.PI*2;
      const rad = r * (0.85 + ((i%3)*0.07));
      const px = Math.cos(ang)*rad, py = Math.sin(ang)*rad;
      if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (cracked) {
      ctx.beginPath(); ctx.moveTo(-8,-10); ctx.lineTo(2,0); ctx.lineTo(-4,10); ctx.stroke();
    }
  }
  update_ladder_boulder(dt, dtMs, player) {
    if (this.boulderFallen) return;
    const nearLadder = Math.abs(player.x - this.x) < 16 && player.y > this.groundY - this.ladderHeight - 10 && player.alive && !player.won;
    if (nearLadder && !this.triggered) {
      this.triggered = true;
      this.boulderShaking = true;
      this.shakeStart = this.t;
      SFX.boulderCrack();
    }
    if (this.boulderShaking && this.t - this.shakeStart > 550) {
      this.boulderShaking = false;
      this.boulderFalling = true;
      this.boulderY = this.groundY - this.ladderHeight - 14;
      this.boulderVY = 0;
    }
    if (this.boulderFalling) {
      this.boulderVY += PHYS.GRAVITY * 1.1;
      this.boulderY += this.boulderVY;
      const restY = this.groundY - 14;
      if (this.boulderY >= restY) {
        this.boulderY = restY;
        this.boulderFalling = false;
        this.boulderFallen = true;
        SFX.boulderCrash();
      }
      // crush check
      if (player.alive && !player.won) {
        const d = Math.hypot(player.x - this.x, player.y - 20 - this.boulderY);
        if (d < 26) player.die('crush');
      }
    }
  }
  interact_ladder_boulder(player) {
    // Once fallen, rubble becomes a small climbable bump (no further death risk)
    if (this.boulderFallen && Math.abs(player.x - this.x) < 24) {
      return { supportY: this.boulderY - 8 };
    }
    return null;
  }

  // ════════════════ SEESAW PLANKS ════════════════
  draw_seesaw(ctx, theme) {
    this.planks.forEach(s => {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.fillStyle = '#c8923f';
      ctx.fillRect(-s.w/2, -s.thickness/2, s.w, s.thickness);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.4;
      ctx.strokeRect(-s.w/2, -s.thickness/2, s.w, s.thickness);
      ctx.restore();
      // fulcrum
      ctx.fillStyle = '#7a5a32';
      ctx.beginPath();
      ctx.moveTo(s.x-7, s.y+14); ctx.lineTo(s.x+7, s.y+14); ctx.lineTo(s.x, s.y);
      ctx.closePath(); ctx.fill();
    });
  }
  update_seesaw(dt, dtMs, player) {
    this.planks.forEach(s => {
      const onThis = player.seesawRef === s;
      if (onThis) {
        const offset = Math.max(-1, Math.min(1, (player.x - s.x) / (s.w/2)));
        const targetAngle = offset * s.maxAngle;
        s.angle += (targetAngle - s.angle) * 0.15;
      } else {
        s.angle += (0 - s.angle) * 0.08;
      }
    });
    // auto-attach when walking onto a plank while grounded/falling
    if (player.alive && !player.won && player.state !== PSTATE.SEESAW) {
      for (const s of this.planks) {
        const surfaceY = s.y - Math.tan(s.angle) * (player.x - s.x) * -1;
        if (Math.abs(player.x - s.x) < s.w/2 && player.y > surfaceY - 14 && player.y < surfaceY + 30 && player.vy >= 0) {
          player.state = PSTATE.SEESAW;
          player.seesawRef = s;
          player.y = surfaceY;
          player.vy = 0;
          player.onGround = true;
          break;
        }
      }
    }
    // if riding and angle too steep & off edge -> fall through pit
    if (player.state === PSTATE.SEESAW && player.seesawRef) {
      const s = player.seesawRef;
      if (player.x > s.x + s.w/2 + 6 || player.x < s.x - s.w/2 - 6) {
        player.state = PSTATE.FALL;
        player.seesawRef = null;
        player.onGround = false;
      } else if (Math.abs(s.angle) > s.maxAngle * 0.92 && Math.abs(player.x - s.x) > s.w*0.36) {
        // slide risk handled by natural walk; if very steep, drop through
        if (Math.abs(s.angle) > s.maxAngle * 0.97) {
          player.state = PSTATE.FALL;
          player.seesawRef = null;
          player.onGround = false;
        }
      }
    }
  }

  // ════════════════ SAW BLADE ════════════════
  draw_saw_blade(ctx) {
    const b = this.blade;
    const x = this.x + Math.sin(this.t * b.swingSpeed) * b.swingRange;
    const y = b.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.t * 0.02);
    ctx.fillStyle = '#cfd4d8';
    ctx.beginPath(); ctx.arc(0,0,b.radius,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#7a8088'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle = '#7a8088';
    for (let i=0;i<8;i++){
      const ang = i/8*Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang)*b.radius, Math.sin(ang)*b.radius);
      ctx.lineTo(Math.cos(ang+0.18)*(b.radius+7), Math.sin(ang+0.18)*(b.radius+7));
      ctx.lineTo(Math.cos(ang+0.36)*b.radius, Math.sin(ang+0.36)*b.radius);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    this._bladeX = x; this._bladeY = y;
  }
  update_saw_blade(dt, dtMs, player) {
    if (!player.alive || player.won) return;
    const bx = this._bladeX !== undefined ? this._bladeX : this.x;
    const by = this.blade.y;
    const d = Math.hypot(player.x - bx, player.y - player.h*0.5 - by);
    if (d < this.blade.radius + 8) player.die('spike');
  }

  // ════════════════ CRUMBLE PLATFORM ════════════════
  draw_crumble(ctx) {
    const alpha = this.collapsing ? Math.max(0, 1 - this.collapseT / 500) : 1;
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#8a6a4a';
    const shake = this.collapsing ? (Math.random()-0.5)*4 : 0;
    ctx.fillRect(this.x+shake, this.groundY-12, this.w, 12);
    ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=1.4;
    ctx.strokeRect(this.x+shake, this.groundY-12, this.w, 12);
    // crack lines
    ctx.beginPath();
    ctx.moveTo(this.x+this.w*0.3, this.groundY-12); ctx.lineTo(this.x+this.w*0.45, this.groundY);
    ctx.moveTo(this.x+this.w*0.7, this.groundY-12); ctx.lineTo(this.x+this.w*0.6, this.groundY);
    ctx.stroke();
    ctx.restore();
  }
  update_crumble(dt, dtMs, player) {
    if (this.collapsing) {
      this.collapseT += dtMs;
      if (this.collapseT > 500) this.gone = true;
      return;
    }
    const onIt = player.x > this.x && player.x < this.x + this.w &&
                 player.y > this.groundY - 18 && player.y < this.groundY + 4 && player.alive;
    if (onIt && !this.triggered) {
      this.triggered = true;
      this.collapsing = true;
      this.collapseT = 0;
      SFX.crumble();
    }
  }
  interact_crumble(player) {
    if (this.gone) return null;
    const top = this.groundY;
    if (player.x > this.x && player.x < this.x + this.w) return { supportY: top };
    return null;
  }

  // ════════════════ MOVING PLATFORM ════════════════
  _platPos() {
    const p = this.plat;
    const x = this.x + Math.sin(this.t * p.speed) * p.range;
    const y = p.bob ? p.y0 + Math.sin(this.t * p.speed * 1.4) * p.bobRange : p.y0;
    return { x, y };
  }
  draw_moving_platform(ctx) {
    const { x, y } = this._platPos();
    ctx.fillStyle = '#7fae6a';
    ctx.fillRect(x - this.plat.w/2, y, this.plat.w, 12);
    ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=1.4;
    ctx.strokeRect(x - this.plat.w/2, y, this.plat.w, 12);
  }
  update_moving_platform(dt, dtMs, player) {
    const { x } = this._platPos();
    if (this._prevPlatX !== undefined && player.movingPlatformRef === this) {
      player.x += (x - this._prevPlatX);
    }
    this._prevPlatX = x;
  }
  interact_moving_platform(player) {
    const { x, y } = this._platPos();
    const onTop = player.x > x - this.plat.w/2 - 6 && player.x < x + this.plat.w/2 + 6;
    if (onTop) {
      player.movingPlatformRef = this;
      return { supportY: y };
    }
    if (player.movingPlatformRef === this) player.movingPlatformRef = null;
    return null;
  }

  // ════════════════ CEILING DROP (icicle / rock) ════════════════
  draw_ceiling_drop(ctx, theme) {
    const c = this.drop;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.fillStyle = theme.dark ? '#8a8a9a' : '#bfe6f2';
    ctx.beginPath();
    ctx.moveTo(-7,0); ctx.lineTo(7,0); ctx.lineTo(0,22); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.stroke();
    ctx.restore();
  }
  update_ceiling_drop(dt, dtMs, player) {
    const c = this.drop;
    if (!c.falling && !c.fallen) {
      // Trigger well before the player arrives, giving a real warning window
      if (player.x < c.x && (c.x - player.x) < 95 && !this.triggered) {
        this.triggered = true;
        c.falling = true;
        c.triggerT = this.t;
      }
    }
    if (c.falling) {
      const elapsed = this.t - c.triggerT;
      c.y = c.startY + Math.pow(elapsed/180, 2) * 30;
      if (c.y > this.groundY - 6) { c.y = this.groundY - 6; c.falling = false; c.fallen = true; }
      if (player.alive && !player.won) {
        const d = Math.hypot(player.x - c.x, player.y - 20 - c.y);
        if (d < 16) player.die('spike');
      }
    }
  }

  // ════════════════ LASER GATE ════════════════
  draw_laser_gate(ctx, theme) {
    const on = this._laserOn(theme);
    if (!on) return;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 5;
    ctx.shadowColor = theme.accent; ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(this.x, this.groundY);
    ctx.lineTo(this.x, this.groundY - this.h);
    ctx.stroke();
    ctx.restore();
  }
  _laserOn(theme) {
    const cycle = this.laserOnMs + this.laserOffMs;
    return (this.t % cycle) < this.laserOnMs;
  }
  update_laser_gate(dt, dtMs, player, world) {
    if (!player.alive || player.won) return;
    const on = this._laserOn(world.theme || {});
    if (on && Math.abs(player.x - this.x) < 8 && player.y > this.groundY - this.h) {
      player.die('spike');
    }
  }

  // ════════════════ TURRET (horizontal dart) ════════════════
  draw_turret(ctx) {
    ctx.fillStyle = '#555';
    ctx.fillRect(this.x-8, this.groundY-26, 16, 26);
    if (this.dart && !this.dart.dead) {
      ctx.save();
      ctx.translate(this.dart.x, this.dart.y);
      ctx.fillStyle = '#333';
      ctx.fillRect(-7,-2,14,4);
      ctx.restore();
    }
  }
  update_turret(dt, dtMs, player) {
    if (!this.fireTimer) this.fireTimer = 0;
    this.fireTimer += dtMs;
    // Only fire once the player is approaching from the left and within range —
    // dart flies LEFTWARD toward them for a clean, readable, dodgeable threat.
    const approaching = player.x < this.x && (this.x - player.x) < 380;
    if (this.fireTimer > this.fireInterval && approaching) {
      this.fireTimer = 0;
      this.dart = { x: this.x, y: this.groundY - 14, vx: -this.dartSpeed, dead: false };
      SFX.turretFire();
    }
    if (this.dart && !this.dart.dead) {
      this.dart.x += this.dart.vx;
      if (player.alive && !player.won) {
        const d = Math.hypot(player.x - this.dart.x, (player.y - 14) - this.dart.y);
        if (d < 13) player.die('spike');
      }
      if (this.dart.x < this.x - 420 || this.dart.x > this.x + 50) this.dart.dead = true;
    }
  }

  // ════════════════ WIND GUST ════════════════
  draw_wind_gust(ctx, theme) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = theme.particleColor;
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const yy = this.groundY - 20 - i*22;
      const phase = (this.t * 0.004 + i * 0.7) % (Math.PI*2);
      const xx = this.x + (this.w/2) + Math.sin(phase) * (this.w/2);
      ctx.beginPath();
      ctx.moveTo(xx - 14, yy);
      ctx.lineTo(xx + 14, yy);
      ctx.stroke();
    }
    ctx.restore();
  }
  update_wind_gust(dt, dtMs, player) {
    if (player.x > this.x && player.x < this.x + this.w && !player.onGround) {
      player.windForce = -this.strength;
    }
  }
}

// ─── FACTORY HELPERS ───────────────────────────────────
const Obstacles = {
  pit(x, w, groundY) {
    return new Obstacle(HAZARD.PIT, x, { w, groundY });
  },
  spikeFence(x, w, h, groundY) {
    return new Obstacle(HAZARD.SPIKE_FENCE, x, { w, h, groundY });
  },
  catapult(x, groundY, fireDelay, landX) {
    return new Obstacle(HAZARD.CATAPULT, x, { groundY, fireDelay, landX, fired:false, bomb:null });
  },
  ropeSwing(x, w, groundTop, groundY, pivotX, pivotY, length) {
    return new Obstacle(HAZARD.ROPE_SWING, x, {
      w, groundTop, groundY,
      swing: { pivotX, pivotY, length, angle: -0.9, angularVel: 0, gravity: 0.018, damping: 0.999 },
    });
  },
  ladderBoulder(x, groundY, ladderHeight) {
    return new Obstacle(HAZARD.LADDER_BOULDER, x, { groundY, ladderHeight, boulderFallen:false, boulderFalling:false, boulderShaking:false });
  },
  seesaw(planksData) {
    // planksData: [{x,y,w,thickness,maxAngle}]
    return new Obstacle(HAZARD.SEESAW, planksData[0].x, {
      planks: planksData.map(p => ({ ...p, angle: 0 })),
    });
  },
  sawBlade(x, y, radius, swingRange, swingSpeed) {
    return new Obstacle(HAZARD.SAW_BLADE, x, { blade: { y, radius, swingRange, swingSpeed } });
  },
  crumble(x, w, groundY) {
    return new Obstacle(HAZARD.CRUMBLE, x, { w, groundY, collapsing:false, gone:false });
  },
  movingPlatform(x, y0, w, range, speed, bob, bobRange) {
    return new Obstacle(HAZARD.MOVING_PLATFORM, x, { plat: { y0, w, range, speed, bob, bobRange: bobRange||0 } });
  },
  ceilingDrop(x, startY, groundY) {
    return new Obstacle(HAZARD.CEILING_DROP, x, { groundY, drop: { x, y: startY, startY, falling:false, fallen:false } });
  },
  laserGate(x, h, groundY, onMs, offMs) {
    return new Obstacle(HAZARD.LASER_GATE, x, { h, groundY, laserOnMs: onMs, laserOffMs: offMs });
  },
  turret(x, groundY, fireInterval, dartSpeed) {
    return new Obstacle(HAZARD.TURRET, x, { groundY, fireInterval, dartSpeed, fireTimer:0, dart:null });
  },
  windGust(x, w, strength) {
    return new Obstacle(HAZARD.WIND_GUST, x, { w, strength });
  },
};
