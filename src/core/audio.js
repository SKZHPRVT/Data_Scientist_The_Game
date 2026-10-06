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
    const len = ctx.sampleRate * 0.1;
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
  // КЛАВИАТУРА — механический «клак»
  // ============================================
  key(pitch = 'normal') {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const cfg = {
      normal:    { vol: 0.35, hp: 2000, dur: 0.03 },
      space:     { vol: 0.45, hp: 1500, dur: 0.04 },
      enter:     { vol: 0.55, hp: 1200, dur: 0.05 },
      backspace: { vol: 0.40, hp: 2200, dur: 0.03 },
    }[pitch] || { vol: 0.35, hp: 2000, dur: 0.03 };

    this._noiseClick(ctx, now, cfg, 1.0);
    this._noiseClick(ctx, now + 0.012, cfg, 0.4);
  }

  // ============================================
  // КЛИК МЫШЬЮ — сухой, короткий, высокий
  // Для открытия/закрытия окон, папок, файлов
  // ============================================
  click(pitch = 'normal') {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const cfg = {
      normal: { vol: 0.22, hp: 3500, dur: 0.02 },
      open:   { vol: 0.25, hp: 3000, dur: 0.025 },
      close:  { vol: 0.20, hp: 4000, dur: 0.018 },
      folder: { vol: 0.24, hp: 3200, dur: 0.022 },
    }[pitch] || { vol: 0.22, hp: 3500, dur: 0.02 };

    this._noiseClick(ctx, now, cfg, 1.0);
    this._noiseClick(ctx, now + 0.008, cfg, 0.35);
  }

  // Совместимость — старые вызовы
  open() { this.click('open'); }
  close() { this.click('close'); }

  // ============================================
  // ВНУТРЕННИЙ ГЕНЕРАТОР ЩЕЛЧКА
  // ============================================
  _noiseClick(ctx, time, cfg, scale) {
    const src = ctx.createBufferSource();
    src.buffer = this._getNoiseBuffer(ctx);

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = cfg.hp;
    hp.Q.value = 0.7;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 8000;

    const gain = ctx.createGain();
    const vol = this.volume * cfg.vol * scale;

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + cfg.dur);

    src.connect(hp);
    hp.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);

    src.start(time);
    src.stop(time + cfg.dur + 0.01);
  }

  // ============================================
  // СИСТЕМНЫЕ ЗВУКИ
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
      gain.gain.setValueAtTime(0, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(this.volume * 0.1, now + i * 0.06 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.25);
    });
  }

  error() {
    if (!this.enabled) return;
    const ctx = this._ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.15);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
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
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.08, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}

export const audio = new AudioEngine();
