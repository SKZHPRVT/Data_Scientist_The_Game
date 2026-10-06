// ============================================
// ПРОГРЕСС ИГРОКА: какие задачи решены, какие открыты
// ============================================

const STORAGE_KEY_SOLVED = 'tasks_solved';

export const progress = {
  getSolved() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_SOLVED) || '[]');
    } catch {
      return [];
    }
  },

  isSolved(taskId) {
    return this.getSolved().includes(taskId);
  },

  markSolved(taskId) {
    const solved = this.getSolved();
    if (!solved.includes(taskId)) {
      solved.push(taskId);
      localStorage.setItem(STORAGE_KEY_SOLVED, JSON.stringify(solved));
    }
  },

  getStars(taskId) {
    return +localStorage.getItem(`task_${taskId}_stars`) || 0;
  },

  setStars(taskId, stars) {
    const best = this.getStars(taskId);
    if (stars > best) {
      localStorage.setItem(`task_${taskId}_stars`, stars);
    }
  },

  // === ПОСЛЕДОВАТЕЛЬНАЯ ПРОГРЕССИЯ ===
  isUnlocked(taskId, allTaskIds) {
    const idx = allTaskIds.indexOf(taskId);
    if (idx === -1) return false;
    if (idx === 0) return true;
    const prevId = allTaskIds[idx - 1];
    return this.isSolved(prevId);
  },

  firstUnsolved(allTaskIds) {
    for (const id of allTaskIds) {
      if (!this.isSolved(id)) return id;
    }
    return null;
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY_SOLVED);
    const keys = Object.keys(localStorage).filter(
      (k) => k.startsWith('task_') && k.endsWith('_stars')
    );
    keys.forEach((k) => localStorage.removeItem(k));
  },
};
