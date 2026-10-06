import { isDevUnlockAll } from './dev.js';

const KEY = 'tasks_solved_v9';
const STAR_KEY = (id) => `task_${id}_stars_v9`;
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

  getStars(taskId) {
    const v = localStorage.getItem(STAR_KEY(taskId));
    return v ? parseInt(v, 10) : 0;
  },

  setStars(taskId, stars) {
    const clamped = Math.max(1, Math.min(MAX_STARS, stars));
    const current = this.getStars(taskId);
    if (clamped > current) {
      localStorage.setItem(STAR_KEY(taskId), String(clamped));
    }
  },

  sumStars(taskIds) {
    return taskIds.reduce((sum, id) => sum + this.getStars(id), 0);
  },

  maxStars(taskIds) {
    return taskIds.length * MAX_STARS;
  },

  isUnlocked(taskId, allTaskIds) {
    if (isDevUnlockAll()) return true;
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
      .filter((k) => k.startsWith('task_') && k.endsWith('_stars_v9'))
      .forEach((k) => localStorage.removeItem(k));
  },

  resetAll() {
    this.reset();
    localStorage.removeItem('rewards_v1');
    localStorage.removeItem('achievements_v1');
    localStorage.removeItem('sv_cheats');
    localStorage.removeItem('wallpaper');
    localStorage.removeItem('wallpapers_unlocked_v1');
    localStorage.removeItem('perfect_chapters_v1');
  },
};

const REWARD_KEY = 'rewards_v1';

export const rewards = {
  getUnlocked() {
    try {
      const raw = localStorage.getItem(REWARD_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },
  isUnlocked(id) {
    return this.getUnlocked().includes(id);
  },
  unlock(id) {
    const arr = this.getUnlocked();
    if (!arr.includes(id)) {
      arr.push(id);
      localStorage.setItem(REWARD_KEY, JSON.stringify(arr));
      return true;
    }
    return false;
  },
  reset() {
    localStorage.removeItem(REWARD_KEY);
  },
};

async function checkWorldComplete(worldId) {
  if (isDevUnlockAll()) return true;
  try {
    const base = import.meta.env.BASE_URL + 'tasks/' + worldId + '/';
    const res = await fetch(base + 'index.json');
    const worldIdx = await res.json();
    for (const ch of worldIdx.chapters || []) {
      try {
        const chRes = await fetch(base + ch.id + '/index.json');
        if (!chRes.ok) continue;
        const chData = await chRes.json();
        const ids = (chData.tasks || []).map((x) => progress.makeId(worldId + '/' + ch.id + '/' + x));
        if (ids.length > 0 && !ids.every((id) => progress.isSolved(id))) return false;
      } catch (e) {}
    }
    return true;
  } catch (e) { return false; }
}

export function isBabyComplete() { return checkWorldComplete('baby'); }
export function isJuniorComplete() { return checkWorldComplete('junior'); }
export function isMiddleComplete() { return checkWorldComplete('middle'); }
export function isSeniorComplete() { return checkWorldComplete('senior'); }
