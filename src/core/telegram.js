import { storage } from './storage.js';

export class TelegramSDK {
  constructor() {
    this.tg = window.Telegram?.WebApp;
    this.user = null;
    this.isAvailable = !!this.tg;
  }

  init() {
    if (!this.isAvailable) {
      console.warn('[TG] Not in Telegram, running in browser mode');
      this.user = { id: 'local', first_name: 'Аноним', username: 'local' };
      return;
    }

    // === БАЗОВАЯ ИНИЦИАЛИЗАЦИЯ ===
    this.tg.ready();
    this.tg.expand();

    // === ПОЛНЫЙ ЭКРАН (Bot API 8.0+) ===
    if (typeof this.tg.requestFullscreen === 'function') {
      try {
        this.tg.requestFullscreen();
        console.log('[TG] fullscreen requested');
      } catch (e) {
        console.log('[TG] fullscreen failed:', e);
      }
    }

    // === БЛОКИРОВКА ЖЕСТОВ ЗАКРЫТИЯ ===
    if (typeof this.tg.disableVerticalSwipes === 'function') {
      try {
        this.tg.disableVerticalSwipes();
      } catch (e) {}
    }

    // === ЦВЕТА ПОД ТЕМУ ИГРЫ ===
    if (this.tg.setHeaderColor) this.tg.setHeaderColor('#000000');
    if (this.tg.setBackgroundColor) this.tg.setBackgroundColor('#000000');
    if (this.tg.BackButton) this.tg.BackButton.hide();

    this.user = this.tg.initDataUnsafe?.user || { id: 'unknown' };
    console.log('[TG] version:', this.tg.version, 'platform:', this.tg.platform);
  }

  // Прогресс в облаке Telegram
  async save(key, value) {
    if (!this.isAvailable) {
      storage.set(key, value);
      return;
    }
    return new Promise((resolve) => {
      this.tg.CloudStorage.setItem(key, JSON.stringify(value), resolve);
    });
  }

  async load(key) {
    if (!this.isAvailable) {
      return storage.get(key);
    }
    return new Promise((resolve) => {
      this.tg.CloudStorage.getItem(key, (err, value) => {
        if (err || !value) return resolve(null);
        try {
          resolve(JSON.parse(value));
        } catch {
          resolve(null);
        }
      });
    });
  }

  haptic(type = 'light') {
    if (!this.isAvailable) return;
    try {
      this.tg.HapticFeedback.impactOccurred(type);
    } catch (e) {}
  }

  notify(type, text) {
    if (!this.isAvailable) return;
    this.tg.showPopup({ title: type, message: text, buttons: [{ type: 'ok' }] });
  }
}
