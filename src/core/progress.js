// ============================================
// ЕДИНЫЙ МОДУЛЬ ПРОГРЕССА
// Все операции только через эти функции
// ============================================

const KEY = 'tasks_solved_v6';
const STAR_KEY = (id) => `task_${id}_stars_v6`;

export const progress = {
  // Единый ID из любого пути: /junior/basics/task1.json → junior/basics/task1
  makeId(path) {
    if (!path) return '';
    return String(path)
      .replace(/^\//, '')
      .replace(/\.json$/, '');
  },

  getSolved() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.warn('[progress] getSolved error', e);
      return [];
    }
  },

  isSolved(taskId) {
    const solved = this.getSolved();
    const result = solved.includes(taskId);
    return result;
  },

  markSolved(taskId) {
    const solved = this.getSolved();
    if (!solved.includes(taskId)) {
      solved.push(taskId);
      localStorage.setItem(KEY, JSON.stringify(solved));
      console.log('[progress] SOLVED:', taskId, '| total:', solved.length, '| list:', solved);
    } else {
      console.log('[progress] already solved:', taskId);
    }
  },

  getStars(taskId) {
    const v = localStorage.getItem(STAR_KEY(taskId));
    return v ? parseInt(v, 10) : 0;
  },

  setStars(taskId, stars) {
    const current = this.getStars(taskId);
    if (stars > current) {
      localStorage.setItem(STAR_KEY(taskId), String(stars));
    }
  },

  isUnlocked(taskId, allTaskIds) {
    const idx = allTaskIds.indexOf(taskId);
    if (idx === -1) return false;
    if (idx === 0) return true;
    const prevId = allTaskIds[idx - 1];
    const unlocked = this.isSolved(prevId);
    return unlocked;
  },

  // Сброс всего
  reset() {
    localStorage.removeItem(KEY);
    Object.keys(localStorage)
      .filter((k) => k.startsWith('task_') && k.endsWith('_stars_v6'))
      .forEach((k) => localStorage.removeItem(k));
    console.log('[progress] RESET done');
  },

  // Отладка
  debug() {
    console.log('=== PROGRESS DEBUG ===');
    console.log('solved:', this.getSolved());
    console.log('raw:', localStorage.getItem(KEY));
    console.log('=== END DEBUG ===');
  },
};
