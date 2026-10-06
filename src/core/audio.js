import { storage } from './storage.js';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = storage.get('sound', 'on') !== 'off';
    this.volume = +storage.get('volume', 0.3) || 0.3;
    this._noiseBuffer = null;
  }

  _ensureContext() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  _getNoiseBuffer(ctx) {
    if (this._noiseBuffer) return this._noiseBuffer;
    // 2 секунды белого шума — хватает для всех импульсов
    const len = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this._noiseBuffer = buffer;
    return buffer;
  }

  setEnabled(on) {
    this.enabled = !!on;
    storage.set('sound', on ? 'on' : 'off');
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    storage.set('volume', this.volume);
  }

  // ============================================
  // ЩЕЛЧОК — базовый строительный блок
  // Использует шум через полосовой фильтр
  // ============================================
  _click(ctx, when, { freq, q, dur, vol, type = 'bandpass' }) {
    const src = ctx.createBufferSource();
    src.buffer = this._getNoiseBuffer(ctx);
    // Стартуем с случайной позиции — чтобы каждый клик был уникален
    const offset = Math.random() * 1.5;

    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q ?? 1;

    const gain = ctx.createGain();
    const peak = Math.max(0.0001, this.volume * vol);

    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    src.start(when, offset, dur + 0.01);
    src.stop(when + dur + 0.01);
  }

  // ============================================
  // НИЗКИЙ РЕЗОНАНС — «корпус» мыши / плата клавиатуры
  // ============================================
  _thump(ctx, when, { freq, dur, vol }) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, when);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, when + dur);

    const gain = ctx.createGain();
    const peak = Math.max(0.0001, this.volume * vol);

    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(when);
    osc.stop(when + dur + 0.01);
  }

  // ============================================
  // КЛАВИАТУРА — механический клик (3 компонента)
  // ============================================
  key(pitch = 'normal') {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Разные профили для разных клавиш
    const profiles = {
      normal:    { down: 2600, bump: 3200, thump: 180, dThump: 0.025, vol: 0.32 },
      space:     { down: 1400, bump: 1800, thump: 120, dThump: 0.045, vol: 0.42 },
      enter:     { down: 1200, bump: 2400, thump: 140, dThump: 0.05,  vol: 0.5  },
      backspace: { down: 3000, bump: 3400, thump: 220, dThump: 0.02,  vol: 0.36 },
      tab:       { down: 1800, bump: 2400, thump: 160, dThump: 0.035, vol: 0.38 },
    };

    const p = profiles[pitch] || profiles.normal;

    // 1. Downstroke — резкий щелчок нажатия
    this._click(ctx, now, {
      freq: p.down,
      q: 1.8,
      dur: 0.008,
      vol: p.vol,
    });

    // 2. Bump — срабатывание (чуть выше)
    this._click(ctx, now + 0.012, {
      freq: p.bump,
      q: 2.2,
      dur: 0.006,
      vol: p.vol * 0.7,
    });

    // 3. Bottom-out — глухой стук в дно (самое главное для "механики")
    this._thump(ctx, now + 0.02, {
      freq: p.thump,
      dur: p.dThump,
      vol: p.vol * 0.55,
    });
  }

  // ============================================
  // МЫШЬ — клик с корпусом
  // ============================================
  click(pitch = 'normal') {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const profiles = {
      normal: { down: 2200, up: 2800, thump: 320, dThump: 0.03, vol: 0.28 },
      open:   { down: 2000, up: 2600, thump: 280, dThump: 0.035, vol: 0.30 },
      close:  { down: 2400, up: 3000, thump: 360, dThump: 0.025, vol: 0.26 },
      folder: { down: 2100, up: 2700, thump: 300, dThump: 0.032, vol: 0.29 },
    };

    const p = profiles[pitch] || profiles.normal;

    // 1. Down — нажатие кнопки
    this._click(ctx, now, {
      freq: p.down,
      q: 2.5,
      dur: 0.01,
      vol: p.vol,
    });

    // 2. Низкий резонанс корпуса — "тело" клика
    this._thump(ctx, now + 0.001, {
      freq: p.thump,
      dur: p.dThump,
      vol: p.vol * 0.6,
    });

    // 3. Up — отпускание кнопки (через 45 мс)
    this._click(ctx, now + 0.045, {
      freq: p.up,
      q: 2.8,
      dur: 0.007,
      vol: p.vol * 0.85,
    });
  }

  // Совместимость
  open() { this.click('open'); }
  close() { this.click('close'); }

  // ============================================
  // СИСТЕМНЫЕ
  // ============================================
  success() {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.06;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(this.volume * 0.1, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  error() {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Низкий "бзз"
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(this.volume * 0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  notify() {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(this.volume * 0.08, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}

export const audio = new AudioEngine();
