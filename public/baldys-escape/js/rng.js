// ════════════════════════════════════════════════════════
// Seeded RNG — Mulberry32
// Same seed always produces the same sequence (deterministic levels)
// ════════════════════════════════════════════════════════

function mulberry32(seed) {
  let a = seed >>> 0;
  return function() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class RNG {
  constructor(seed) {
    this.rand = mulberry32(seed);
  }
  next() { return this.rand(); }
  range(min, max) { return min + this.rand() * (max - min); }
  int(min, max) { return Math.floor(this.range(min, max + 1)); }
  pick(arr) { return arr[Math.floor(this.rand() * arr.length)]; }
  chance(p) { return this.rand() < p; }
}
