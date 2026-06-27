// ════════════════════════════════════════════════════════
// Player — physics body, state machine, vector character draw
// ════════════════════════════════════════════════════════

const PSTATE = {
  WALK: 'walk', JUMP: 'jump', FALL: 'fall', CLIMB: 'climb',
  SWING: 'swing', SEESAW: 'seesaw', DEAD: 'dead', WIN: 'win', IDLE: 'idle',
};

class Player {
  constructor() {
    this.reset(0, 0);
  }

  reset(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.w = PHYS.PLAYER_W; this.h = PHYS.PLAYER_H;
    this.onGround = false;
    this.state = PSTATE.WALK;
    this.facing = 1;
    this.distTraveled = 0;
    this.jumpHeldTime = 0;
    this.isJumping = false;
    this.alive = true;
    this.won = false;
    this.swingRef = null;
    this.seesawRef = null;
    this.ladderRef = null;
    this.deathTimer = 0;
    this.deathSpin = 0;
    this.deathVX = 0; this.deathVY = 0;
    this.winTimer = 0;
    this.squashX = 1; this.squashY = 1;
    this.windForce = 0;
    this.slowFactor = 1;
  }

  get bounds() {
    return { x: this.x - this.w/2, y: this.y - this.h, w: this.w, h: this.h };
  }

  startJump() {
    if (this.state === PSTATE.SWING) {
      // release swing with current velocity
      this.state = this.vy < 0 ? PSTATE.JUMP : PSTATE.FALL;
      this.swingRef = null;
      SFX.jump();
      return;
    }
    if ((this.onGround || this.state === PSTATE.SEESAW) && this.alive && !this.won) {
      this.isJumping = true;
      this.jumpHeldTime = 0;
      this.vy = PHYS.JUMP_MIN;
      this.onGround = false;
      this.seesawRef = null;
      this.state = PSTATE.JUMP;
      this.squashY = 1.3; this.squashX = 0.75;
      SFX.jump();
    }
  }

  holdJump(dtMs) {
    if (this.isJumping && this.vy < 0) {
      this.jumpHeldTime += dtMs;
      if (this.jumpHeldTime <= PHYS.JUMP_HOLD_MS) {
        const t = Math.min(1, this.jumpHeldTime / PHYS.JUMP_HOLD_MS);
        const targetVy = PHYS.JUMP_MIN + (PHYS.JUMP_MAX - PHYS.JUMP_MIN) * t;
        this.vy = Math.min(this.vy, targetVy);
      }
    }
  }

  releaseJump() {
    this.isJumping = false;
  }

  die(reason) {
    if (!this.alive) return;
    this.alive = false;
    this.state = PSTATE.DEAD;
    this.deathTimer = 0;
    this.deathVX = this.vx * 0.5 + (reason === 'spike' ? this.facing * 1.5 : 0);
    this.deathVY = -4;
    this.deathSpin = (Math.random() - 0.5) * 0.3 + (reason === 'fall' ? 0 : 0.25);
    if (reason === 'water') SFX.splash();
    else if (reason === 'explosion') SFX.explosion();
    else if (reason === 'crush') SFX.boulderCrash();
    else SFX.death();
  }

  win() {
    if (this.won) return;
    this.won = true;
    this.state = PSTATE.WIN;
    this.winTimer = 0;
    this.vx = 0;
    SFX.victoryFanfare();
  }

  update(dt, dtMs, level) {
    if (this.state === PSTATE.DEAD) {
      this.deathTimer += dtMs;
      this.x += this.deathVX;
      this.y += this.deathVY;
      this.deathVY += PHYS.GRAVITY * 0.7;
      this.deathRot = (this.deathRot || 0) + this.deathSpin;
      return;
    }
    if (this.state === PSTATE.WIN) {
      this.winTimer += dtMs;
      return;
    }

    // Recover squash
    this.squashX += (1 - this.squashX) * 0.18;
    this.squashY += (1 - this.squashY) * 0.18;

    if (this.state === PSTATE.SWING && this.swingRef) {
      this._updateSwing();
      return;
    }
    if (this.state === PSTATE.SEESAW && this.seesawRef) {
      this._updateSeesaw(level);
      // gravity still applies if plank logic ever releases onGround
      if (!this.onGround) this.vy = Math.min(this.vy + PHYS.GRAVITY, PHYS.TERMINAL_VELOCITY);
      this.distTraveled += this.vx;
      this.windForce *= 0.9;
      return;
    }

    this.vx = level.speed * this.slowFactor + this.windForce;

    // Gravity
    this.vy = Math.min(this.vy + PHYS.GRAVITY, PHYS.TERMINAL_VELOCITY);

    this.x += this.vx;
    this.y += this.vy;

    this.distTraveled += this.vx;
    this.windForce *= 0.9;
    this.slowFactor = 1;
  }

  _updateSwing() {
    const s = this.swingRef;
    s.angle += s.angularVel;
    s.angularVel += -Math.sin(s.angle) * s.gravity;
    s.angularVel *= s.damping;
    this.x = s.pivotX + Math.sin(s.angle) * s.length;
    this.y = s.pivotY + Math.cos(s.angle) * s.length - this.h * 0.3;
    this.vx = Math.cos(s.angle) * s.angularVel * s.length;
    this.vy = -Math.sin(s.angle) * s.angularVel * s.length;
  }

  _updateSeesaw(level) {
    const s = this.seesawRef;
    // player rides plank; plank angle determined by player's offset from fulcrum
    const offset = (this.x - s.x) / (s.w / 2); // -1..1
    const targetAngle = Math.max(-s.maxAngle, Math.min(s.maxAngle, offset * s.maxAngle));
    s.angle += (targetAngle - s.angle) * 0.12;
    const plankY = s.y + Math.sin(s.angle) * (s.w / 2) * (this.x > s.x ? -1 : 1) * -1;
    // Walk forward along plank
    this.vx = level.speed * this.slowFactor;
    this.x += this.vx;
    // Height follows plank surface at player's x
    const relX = this.x - s.x;
    this.y = s.y - Math.tan(s.angle) * relX * -1 + s.thickness;
    // If tipped too steep and player is past balance point, slide check happens in obstacle update
  }

  // ─── DRAW ────────────────────────────────────────
  draw(ctx, theme) {
    const t = performance.now();
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.state === PSTATE.DEAD) {
      ctx.rotate(this.deathRot || 0);
      this._drawBody(ctx, theme, 'dead', 0);
      ctx.restore();
      return;
    }

    ctx.scale(this.facing, 1);
    ctx.scale(this.squashX, this.squashY);

    let walkCycle = 0;
    if (this.state === PSTATE.WALK || this.state === PSTATE.SEESAW) {
      walkCycle = Math.sin(this.distTraveled * 0.25);
    }

    if (this.state === PSTATE.WIN) {
      this._drawBody(ctx, theme, 'win', Math.sin(t * 0.01));
    } else if (this.state === PSTATE.JUMP || this.state === PSTATE.FALL) {
      this._drawBody(ctx, theme, 'jump', 0);
    } else if (this.state === PSTATE.SWING) {
      this._drawBody(ctx, theme, 'swing', 0);
    } else if (this.state === PSTATE.CLIMB) {
      this._drawBody(ctx, theme, 'climb', Math.sin(t * 0.012));
    } else {
      this._drawBody(ctx, theme, 'walk', walkCycle);
    }

    ctx.restore();
  }

  _drawBody(ctx, theme, pose, cyclePhase) {
    const skin = '#ffd9b8';
    const shirt = '#ffffff';
    const shorts = '#2f6fb0';
    const shoe = '#f5f5f5';
    const outline = 'rgba(0,0,0,0.55)';

    ctx.lineWidth = 1.6;
    ctx.strokeStyle = outline;

    let legSwing = cyclePhase * 12;
    let armSwing = cyclePhase * 10;
    let bodyBob = Math.abs(cyclePhase) * -2;
    let headTiltY = 0;

    if (pose === 'jump') { legSwing = -8; armSwing = -14; bodyBob = -3; }
    if (pose === 'climb') { legSwing = cyclePhase * 6; armSwing = -cyclePhase * 6; }
    if (pose === 'swing') { legSwing = 6; armSwing = 0; }
    if (pose === 'win') { armSwing = -28 - cyclePhase*6; legSwing = cyclePhase * 8; bodyBob = -4; }
    if (pose === 'dead') { legSwing = 0; armSwing = 0; }

    const hipY = -22 + bodyBob;
    const shoulderY = -38 + bodyBob;
    const headY = -46 + bodyBob;

    // Back leg
    ctx.fillStyle = shorts;
    this._limb(ctx, 0, hipY, -legSwing*0.6, 16, 5, shoe, pose==='dead');
    // Back arm
    this._limb(ctx, -3, shoulderY+4, -armSwing*0.7, 13, 4.2, skin, pose==='dead', true);

    // Torso
    ctx.beginPath();
    ctx.fillStyle = shirt;
    ctx.moveTo(-9, shoulderY);
    ctx.quadraticCurveTo(-11, hipY, -8, hipY+2);
    ctx.lineTo(8, hipY+2);
    ctx.quadraticCurveTo(11, hipY, 9, shoulderY);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Shorts hip band
    ctx.fillStyle = shorts;
    ctx.fillRect(-9, hipY-3, 18, 9);
    ctx.strokeRect(-9, hipY-3, 18, 9);

    // Front leg
    this._limb(ctx, 0, hipY+4, legSwing*0.6, 17, 5.2, shoe, pose==='dead');
    // Front arm
    this._limb(ctx, 3, shoulderY+4, armSwing*0.7, 14, 4.4, skin, pose==='dead', true);

    // Head
    ctx.save();
    ctx.translate(0, headY);
    ctx.beginPath();
    ctx.fillStyle = skin;
    ctx.arc(0, 0, 9.5, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    // Ear
    ctx.beginPath(); ctx.fillStyle = skin;
    ctx.arc(8.5, 1, 2, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Eye
    ctx.fillStyle = '#1a1a1a';
    const eyeOpen = pose === 'dead' ? 0.3 : 1;
    ctx.beginPath();
    ctx.ellipse(4.5, -1, 1.6, 2.1 * eyeOpen, 0, 0, Math.PI*2);
    ctx.fill();
    // Eyebrow (worried look matches reference)
    ctx.strokeStyle = outline; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(2.5,-4.5); ctx.lineTo(6.5,-5.2); ctx.stroke();
    // Mouth
    ctx.beginPath();
    if (pose === 'win') { ctx.arc(4, 3, 2.6, 0, Math.PI); }
    else { ctx.moveTo(3,4); ctx.lineTo(7,4); }
    ctx.stroke();
    ctx.restore();

    // Win sparkle
    if (pose === 'win') {
      ctx.fillStyle = '#ffe066';
      for (let i = 0; i < 3; i++) {
        const ang = (performance.now() * 0.004 + i * 2.1);
        ctx.beginPath();
        ctx.arc(Math.cos(ang)*16, headY - 6 + Math.sin(ang)*6, 1.6, 0, Math.PI*2);
        ctx.fill();
      }
    }
  }

  _limb(ctx, x, y, swingDeg, len, w, color, limp, isArm) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((swingDeg * Math.PI) / 180);
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 1.4;
    const rx = w/2;
    ctx.moveTo(-rx, 0);
    ctx.lineTo(-rx*0.7, len);
    ctx.lineTo(rx*0.7, len);
    ctx.lineTo(rx, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    if (!isArm) {
      // shoe
      ctx.beginPath();
      ctx.ellipse(0, len+2, 6, 3.2, 0, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
}
