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
    this.tg.ready();
    this.tg.expand();
    this.user = this.tg.initDataUnsafe?.user || { id: 'unknown' };
    this.tg.setHeaderColor('#0a0a0a');
    this.tg.setBackgroundColor('#0a0a0a');
  }

  // Прогресс в облаке Telegram
  async save(key, value) {
    if (!this.isAvailable) {
      localStorage.setItem(key, JSON.stringify(value));
      return;
    }
    return new Promise((resolve) => {
      this.tg.CloudStorage.setItem(key, JSON.stringify(value), resolve);
    });
  }

  async load(key) {
    if (!this.isAvailable) {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    }
    return new Promise((resolve) => {
      this.tg.CloudStorage.getItem(key, (err, value) => {
        resolve(value ? JSON.parse(value) : null);
      });
    });
  }

  haptic(type = 'light') {
    if (!this.isAvailable) return;
    this.tg.HapticFeedback.impactOccurred(type);
  }

  notify(type, text) {
    if (!this.isAvailable) return;
    this.tg.showPopup({ title: type, message: text, buttons: [{ type: 'ok' }] });
  }
}
