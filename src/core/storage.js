// Безопасная обёртка над localStorage
export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    } catch (e) {
      console.warn('[storage] get failed', key, e);
      return fallback;
    }
  },

  set(key, value) {
    try {
      const raw = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, raw);
    } catch (e) {
      console.warn('[storage] set failed', key, e);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  },

  clear() {
    try {
      localStorage.clear();
    } catch (e) {}
  },
};
