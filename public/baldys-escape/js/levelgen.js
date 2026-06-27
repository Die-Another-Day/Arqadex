// ════════════════════════════════════════════════════════
// Level Generator — chunk-based, deterministic, always fair
// ════════════════════════════════════════════════════════

const GROUND_Y = 460; // baseline ground top in world-space px

class LevelBuilder {
  constructor(levelNum) {
    this.levelNum = levelNum;
    this.diff = getLevelDifficulty(levelNum);
    this.rng = new RNG(this.diff.seed);
    this.cursorX = 240; // starting safe runway
    this.obstacles = [];
    this.groundSegments = [{ x: 0, w: this.cursorX, y: GROUND_Y }];
    this.decorations = [];
  }

  // Safe max gap player can clear with a tap-jump (conservative 88%)
  maxSafeGapPx() {
    const d = jumpDistance(this.diff.speed, PHYS.JUMP_MAX);
    return d * 0.84;
  }
  minTapGapPx() {
    return jumpDistance(this.diff.speed, PHYS.JUMP_MIN) * 0.5;
  }

  addGround(w) {
    const last = this.groundSegments[this.groundSegments.length - 1];
    const x = this.cursorX;
    this.groundSegments.push({ x, w, y: GROUND_Y });
    this.cursorX += w;
  }

  addGap(w) {
    // gap = no ground segment; cursor just advances
    this.cursorX += w;
  }

  build() {
    const { world, chunkCount, gapMin, gapMax, timingTightness, isBossLevel } = this.diff;
    const pool = world.hazards;
    const rng = this.rng;

    // Opening runway already added.
    for (let i = 0; i < chunkCount; i++) {
      const isFinalChunk = i === chunkCount - 1;
      if (isFinalChunk && isBossLevel) {
        this._bossFinale();
        continue;
      }
      const kind = rng.pick(pool);
      this._buildChunk(kind, gapMin, gapMax, timingTightness, rng);
      // safe runway between chunks (shrinks slightly at higher difficulty but never below playable min)
      const runway = Math.max(70, 150 - this.diff.globalProgress * 60);
      this.addGround(runway + rng.range(0, 40));
    }

    // Finish platform + flag
    this.addGround(160);
    this.finishX = this.cursorX - 80;

    return {
      levelNum: this.levelNum,
      diff: this.diff,
      groundSegments: this.groundSegments,
      obstacles: this.obstacles,
      totalWidth: this.cursorX + 200,
      finishX: this.finishX,
      startX: 80,
    };
  }

  _buildChunk(kind, gapMin, gapMax, tight, rng) {
    const gap = rng.range(gapMin, gapMax);
    switch (kind) {
      case HAZARD.PIT: {
        const w = Math.min(gap, this.maxSafeGapPx());
        const startX = this.cursorX;
        this.addGap(w);
        this.obstacles.push(Obstacles.pit(startX, w, GROUND_Y));
        break;
      }
      case HAZARD.SPIKE_FENCE: {
        const h = 30 + this.diff.globalProgress * 26;
        const w = 26;
        const x = this.cursorX + 40;
        this.addGround(w + 80);
        this.obstacles.push(Obstacles.spikeFence(x, w, h, GROUND_Y));
        break;
      }
      case HAZARD.CATAPULT: {
        const standW = 60;
        const x = this.cursorX + 30;
        this.addGround(standW + 90);
        const fireDelay = 1100 * tight + rng.range(0, 300);
        const catapultX = x + 70;
        const landX = catapultX - 50; // fixed, reliable spot in the player's path
        this.obstacles.push(Obstacles.catapult(catapultX, GROUND_Y, fireDelay, landX));
        break;
      }
      case HAZARD.ROPE_SWING: {
        const shaftW = Math.min(170, this.maxSafeGapPx() * 1.6);
        const startX = this.cursorX;
        this.addGap(shaftW);
        const pivotX = startX + shaftW * 0.5;
        const pivotY = GROUND_Y - 150;
        const swingLength = shaftW * 0.74; // ensures pendulum reach exceeds half-width with margin
        this.obstacles.push(Obstacles.ropeSwing(startX, shaftW, GROUND_Y - 220, GROUND_Y, pivotX, pivotY, swingLength));
        break;
      }
      case HAZARD.LADDER_BOULDER: {
        const ladderH = 90 + rng.range(0, 30);
        const x = this.cursorX + 20;
        this.addGround(120);
        this.obstacles.push(Obstacles.ladderBoulder(x, GROUND_Y, ladderH));
        break;
      }
      case HAZARD.SEESAW: {
        const plankCount = 2 + (this.diff.globalProgress > 0.4 ? 1 : 0);
        const plankW = 110;
        const gapEach = Math.min(70, this.maxSafeGapPx() * 0.65);
        const trailingGap = Math.min(85, this.maxSafeGapPx() * 0.78);
        const startX = this.cursorX;
        let px = startX + plankW/2;
        const planks = [];
        for (let p = 0; p < plankCount; p++) {
          planks.push({ x: px, y: GROUND_Y, w: plankW, thickness: 12, maxAngle: 0.5 });
          px += plankW + gapEach;
        }
        const lastPlankRightEdge = px - plankW/2 - gapEach; // px advanced past last plank by (plankW+gapEach)
        const totalSpan = (lastPlankRightEdge - startX) + trailingGap;
        this.addGap(totalSpan);
        this.obstacles.push(Obstacles.seesaw(planks));
        break;
      }
      case HAZARD.SAW_BLADE: {
        const x = this.cursorX + 60;
        this.addGround(140);
        const y = GROUND_Y - 30 - rng.range(0, 10);
        const speed = 0.0020 * tight + 0.0007;
        this.obstacles.push(Obstacles.sawBlade(x, y, 16, 50, speed));
        break;
      }
      case HAZARD.CRUMBLE: {
        const w = 70;
        const x = this.cursorX;
        this.addGap(w);
        this.obstacles.push(Obstacles.crumble(x, w, GROUND_Y));
        break;
      }
      case HAZARD.MOVING_PLATFORM: {
        const span = Math.min(95, this.maxSafeGapPx() * 0.85);
        const startX = this.cursorX;
        this.addGap(span);
        const speed = 0.0016 * tight + 0.0008; // slow, readable drift
        const bob = this.diff.world.id >= 7;
        this.obstacles.push(Obstacles.movingPlatform(startX + span/2, GROUND_Y - 6, 70, span*0.22, speed, bob, 16));
        break;
      }
      case HAZARD.CEILING_DROP: {
        const x = this.cursorX + 50;
        this.addGround(110);
        this.obstacles.push(Obstacles.ceilingDrop(x, GROUND_Y - 160, GROUND_Y));
        break;
      }
      case HAZARD.LASER_GATE: {
        const x = this.cursorX + 40;
        this.addGround(90);
        const onMs = Math.max(420, 900 - this.diff.globalProgress * 400);
        const offMs = Math.max(500, 1000 - this.diff.globalProgress * 300);
        this.obstacles.push(Obstacles.laserGate(x, 70, GROUND_Y, onMs, offMs));
        break;
      }
      case HAZARD.TURRET: {
        const x = this.cursorX + 30;
        this.addGround(150);
        const interval = Math.max(1200, 1900 - this.diff.globalProgress * 700);
        this.obstacles.push(Obstacles.turret(x, GROUND_Y, interval, 2.3));
        break;
      }
      case HAZARD.WIND_GUST: {
        // Wind pushes backward while airborne, effectively shortening the jump —
        // size the gap well under max jump distance to leave real margin.
        const w = Math.min(95, this.maxSafeGapPx() * 0.72);
        const startX = this.cursorX;
        this.addGap(w);
        this.obstacles.push(Obstacles.windGust(startX, w, 0.4 + this.diff.globalProgress * 0.3));
        this.obstacles.push(Obstacles.pit(startX, w, GROUND_Y));
        break;
      }
    }
  }

  // Every 10th level gets a hand-tuned signature finale combining hazards
  _bossFinale() {
    const rng = this.rng;
    this.addGround(40);
    // Combo: swing across spikes, then immediately a seesaw run, then catapult gauntlet
    const shaftW = Math.min(150, this.maxSafeGapPx() * 1.5);
    const startX = this.cursorX;
    this.addGap(shaftW);
    this.obstacles.push(Obstacles.ropeSwing(startX, shaftW, GROUND_Y - 220, GROUND_Y, startX + shaftW*0.5, GROUND_Y - 150, shaftW * 0.74));
    this.addGround(90);

    const x2 = this.cursorX + 30;
    this.addGround(150);
    const catapultX2 = x2 + 60;
    this.obstacles.push(Obstacles.catapult(catapultX2, GROUND_Y, 700, catapultX2 - 50));

    this.addGround(60);
    const plankW = 100, gapEach = 60;
    const trailingGapBoss = Math.min(80, this.maxSafeGapPx() * 0.75);
    let px = this.cursorX + plankW/2;
    const seesawStart = this.cursorX;
    const planks = [];
    for (let p = 0; p < 3; p++) {
      planks.push({ x: px, y: GROUND_Y, w: plankW, thickness: 12, maxAngle: 0.5 });
      px += plankW + gapEach;
    }
    this.addGap((px - plankW/2 - gapEach - seesawStart) + trailingGapBoss);
    this.obstacles.push(Obstacles.seesaw(planks));
    this.addGround(60);

    const x3 = this.cursorX + 20;
    this.addGround(120);
    this.obstacles.push(Obstacles.ladderBoulder(x3, GROUND_Y, 110));
  }
}

function buildLevel(levelNum) {
  return new LevelBuilder(levelNum).build();
}
