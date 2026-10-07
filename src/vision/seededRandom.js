// Seed-based RNG — детерминированный рандом
export class SeededRandom {
  constructor(seed) {
    // Mulberry32 — быстрый, качественный
    this.state = (typeof seed === 'string' ? this._hash(seed) : seed) >>> 0;
  }

  _hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  next() {
    this.state |= 0;
    this.state = (this.state + 0x6D2B79F5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  }

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

// Глобальный счётчик для новых seed
let _counter = 0;
export function nextSeed() {
  _counter++;
  return Date.now().toString(36) + '_' + _counter;
}
