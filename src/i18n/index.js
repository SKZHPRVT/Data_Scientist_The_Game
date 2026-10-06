import { storage } from '../core/storage.js';
import { STRINGS, tRaw } from './strings.js';

export function getLang() {
  return storage.get('lang', 'ru') || 'ru';
}

export function setLang(lang) {
  storage.set('lang', lang);
  window.dispatchEvent(new CustomEvent('lang-change', { detail: lang }));
}

export function t(key) {
  return tRaw(key, getLang());
}

export { STRINGS };
