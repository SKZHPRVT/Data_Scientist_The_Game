const KEY = 'tasks_solved_v4';

export const progress = {
  getSolved() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  },

  isSolved(taskId) {
    return this.getSolved().includes(taskId);
  },

  markSolved(taskId) {
    const s = this.getSolved();
    if (!s.includes(taskId)) {
      s.push(taskId);
      localStorage.setItem(KEY, JSON.stringify(s));
    }
  },

  getStars(taskId) {
    return +localStorage.getItem(`task_${taskId}_stars_v4`) || 0;
  },

  setStars(taskId, stars) {
    const best = this.getStars(taskId);
    if (stars > best) localStorage.setItem(`task_${taskId}_stars_v4`, stars);
  },

  isUnlocked(taskId, allTaskIds) {
    const idx = allTaskIds.indexOf(taskId);
    if (idx === -1) return false;
    if (idx === 0) return true;
    return this.isSolved(allTaskIds[idx - 1]);
  },

  reset() {
    localStorage.removeItem(KEY);
    Object.keys(localStorage)
      .filter((k) => k.startsWith('task_') && k.endsWith('_stars_v4'))
      .forEach((k) => localStorage.removeItem(k));
  },
};
