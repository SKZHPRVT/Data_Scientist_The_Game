const KEY = 'tasks_solved_v7';
const STAR_KEY = (id) => `task_${id}_stars_v7`;
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
    }
  },

  // Звёзды за конкретный квест (0–4)
  getStars(taskId) {
    const v = localStorage.getItem(STAR_KEY(taskId));
    return v ? parseInt(v, 10) : 0;
  },

  // Ставим максимум (перепрохождение улучшает)
  setStars(taskId, stars) {
    const clamped = Math.max(0, Math.min(MAX_STARS, stars));
    const current = this.getStars(taskId);
    if (clamped > current) {
      localStorage.setItem(STAR_KEY(taskId), String(clamped));
    }
  },

  // Сумма звёзд по всем задачам
  sumStars(taskIds) {
    return taskIds.reduce((sum, id) => sum + this.getStars(id), 0);
  },

  // Максимум звёзд для N задач
  maxStars(taskIds) {
    return taskIds.length * MAX_STARS;
  },

  isUnlocked(taskId, allTaskIds) {
    const idx = allTaskIds.indexOf(taskId);
    if (idx === -1) return false;
    if (idx === 0) return true;
    return this.isSolved(allTaskIds[idx - 1]);
  },

  // Папка пройдена (все задачи решены, не обязательно на 4)
  isChapterComplete(taskIds) {
    return taskIds.length > 0 && taskIds.every((id) => this.isSolved(id));
  },

  // Папка идеальна (все задачи на 4 звезды)
  isChapterPerfect(taskIds) {
    return taskIds.length > 0 && taskIds.every((id) => this.getStars(id) === MAX_STARS);
  },

  reset() {
    localStorage.removeItem(KEY);
    Object.keys(localStorage)
      .filter((k) => k.startsWith('task_') && k.endsWith('_stars_v7'))
      .forEach((k) => localStorage.removeItem(k));
  },

  debug() {
    console.log('solved:', this.getSolved());
    console.log('raw:', localStorage.getItem(KEY));
  },
};
