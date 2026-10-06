const KEY = 'tasks_solved_v8';
const STAR_KEY = (id) => `task_${id}_stars_v8`;
const MAX_STARS = 4;

export const progress = {
  MAX_STARS,

  makeId(path) {
    if (!path) return '';
    return String(path).replace(/^\//, '').replace(/\.json$/, '');
  },

  getSolved() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  },

  isSolved(taskId) {
    return this.getSolved().includes(taskId);
  },

  markSolved(taskId) {
    const solved = this.getSolved();
    if (!solved.includes(taskId)) {
      solved.push(taskId);
      localStorage.setItem(KEY, JSON.stringify(solved));
      console.log('[progress] markSolved:', taskId, '| total:', solved.length);
    }
  },

  getStars(taskId) {
    const v = localStorage.getItem(STAR_KEY(taskId));
    const n = v ? parseInt(v, 10) : 0;
    return n;
  },

  setStars(taskId, stars) {
    const clamped = Math.max(1, Math.min(MAX_STARS, stars)); // минимум 1
    const current = this.getStars(taskId);
    console.log('[progress] setStars:', taskId, '| current:', current, '→ new:', clamped);
    if (clamped > current) {
      localStorage.setItem(STAR_KEY(taskId), String(clamped));
      console.log('[progress] SAVED:', taskId, '=', clamped);
    } else {
      console.log('[progress] not saved (current >= new)');
    }
  },

  sumStars(taskIds) {
    const total = taskIds.reduce((sum, id) => sum + this.getStars(id), 0);
    return total;
  },

  maxStars(taskIds) {
    return taskIds.length * MAX_STARS;
  },

  isUnlocked(taskId, allTaskIds) {
    const idx = allTaskIds.indexOf(taskId);
    if (idx === -1) return false;
    if (idx === 0) return true;
    return this.isSolved(allTaskIds[idx - 1]);
  },

  isChapterComplete(taskIds) {
    return taskIds.length > 0 && taskIds.every((id) => this.isSolved(id));
  },

  isChapterPerfect(taskIds) {
    return taskIds.length > 0 && taskIds.every((id) => this.getStars(id) === MAX_STARS);
  },

  reset() {
    localStorage.removeItem(KEY);
    Object.keys(localStorage)
      .filter((k) => k.startsWith('task_') && k.endsWith('_stars_v8'))
      .forEach((k) => localStorage.removeItem(k));
  },

  debug() {
    console.log('=== SOLVED ===');
    console.log(this.getSolved());
    console.log('=== STARS ===');
    const starsKeys = Object.keys(localStorage).filter(k => k.includes('stars_v8'));
    starsKeys.forEach(k => console.log(k, '=', localStorage.getItem(k)));
  },
};
