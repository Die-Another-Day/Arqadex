// ════════════════════════════════════════════════════════
// Save System — localStorage progress persistence
// ════════════════════════════════════════════════════════

const SAVE_KEY = 'baldys_escape_save_v1';

class SaveData {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { unlocked: 1, stars: {}, totalDeaths: 0, soundOn: true };
  }

  _persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) {}
  }

  isUnlocked(levelNum) { return levelNum <= this.data.unlocked; }

  getStars(levelNum) { return this.data.stars[levelNum] || 0; }

  completeLevel(levelNum, stars, deaths) {
    if (stars > this.getStars(levelNum)) this.data.stars[levelNum] = stars;
    if (levelNum + 1 > this.data.unlocked) this.data.unlocked = Math.min(GAME.TOTAL_LEVELS, levelNum + 1);
    this.data.totalDeaths = (this.data.totalDeaths || 0) + deaths;
    this._persist();
  }

  totalStars() {
    return Object.values(this.data.stars).reduce((a,b) => a+b, 0);
  }

  worldUnlockedCount(worldIdx) {
    const startLevel = worldIdx * GAME.LEVELS_PER_WORLD + 1;
    const endLevel = startLevel + GAME.LEVELS_PER_WORLD - 1;
    let count = 0;
    for (let l = startLevel; l <= endLevel; l++) if (this.isUnlocked(l)) count++;
    return count;
  }

  setSound(on) { this.data.soundOn = on; this._persist(); }

  reset() {
    this.data = { unlocked: 1, stars: {}, totalDeaths: 0, soundOn: true };
    this._persist();
  }
}
