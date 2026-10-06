import { storage } from './storage.js';
import { rewards } from './progress.js';

// ============================================
// УСЛОВИЯ РАЗБЛОКИРОВКИ ОБОЕВ
// ============================================
// Проверяют прогресс игрока
// ============================================

const UNLOCK_KEY = 'wallpapers_unlocked_v1';

export const WALLPAPERS = {
  default: {
    css: 'radial-gradient(ellipse at top, #0a1a0f 0%, #000 70%)',
    condition: () => true,
    hint: 'Доступно сразу',
  },
  space: {
    special: 'space',
    condition: () => hasPerfectChapter(),
    hint: 'Идеально пройди любую папку (4⭐ во всех квестах)',
  },
  forest: {
    css: 'radial-gradient(circle at 20% 20%, rgba(0,255,100,0.3) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(0,150,50,0.25) 0%, transparent 45%), radial-gradient(ellipse at bottom, #0a2a0a 0%, #000 80%)',
    condition: () => hasFlag('baby_complete'),
    hint: 'Пройди BABY SCIENTIST полностью',
  },
  neon: {
    css: 'radial-gradient(circle at 20% 30%, rgba(255,0,255,0.45) 0%, transparent 45%), radial-gradient(circle at 80% 70%, rgba(0,255,255,0.45) 0%, transparent 45%), linear-gradient(135deg, #1a0033 0%, #330066 50%, #1a0033 100%)',
    condition: () => hasFlag('junior_complete'),
    hint: 'Пройди JUNIOR полностью',
  },
  sunset: {
    css: 'radial-gradient(circle at 50% 95%, #ffcc00 0%, #ff6600 20%, #cc0066 50%, #330066 80%, #000 100%)',
    condition: () => hasFlag('middle_complete'),
    hint: 'Пройди MIDDLE полностью',
  },
  ocean: {
    css: 'radial-gradient(circle at 50% 20%, rgba(0,200,255,0.4) 0%, transparent 50%), linear-gradient(180deg, #001a33 0%, #003366 50%, #000 100%)',
    condition: () => hasFlag('senior_complete'),
    hint: 'Пройди SENIOR полностью',
  },
  cyberpunk: {
    css: 'linear-gradient(0deg, rgba(255,0,150,0.3) 0%, transparent 30%), linear-gradient(180deg, rgba(0,255,255,0.3) 0%, transparent 30%), radial-gradient(ellipse at center, #1a0a1a 0%, #000 100%)',
    condition: () => countPerfectChapters() >= 3,
    hint: 'Идеально пройди 3 папки',
  },
  matrix: {
    special: 'matrix',
    condition: () => hasFlag('game_complete'),
    hint: 'Пройди ВСЮ игру (BABY + JUNIOR + MIDDLE + SENIOR)',
  },
};

// ============================================
// ПРОВЕРКА ФЛАГОВ (сохраняются при завершении мира)
// ============================================
function hasFlag(flag) {
  if (rewards.isUnlocked(flag)) return true;
  // Также проверяем постоянное хранилище разблокированных обоев
  return isSaved(flag);
}

function hasPerfectChapter() {
  const perfect = storage.get('perfect_chapters_v1', []);
  return Array.isArray(perfect) && perfect.length > 0;
}

function countPerfectChapters() {
  const perfect = storage.get('perfect_chapters_v1', []);
  return Array.isArray(perfect) ? perfect.length : 0;
}

// ============================================
// ПОСТОЯННОЕ ХРАНИЛИЩЕ РАЗБЛОКИРОВАННЫХ ОБОЕВ
// ============================================
export function getSaved() {
  try {
    const raw = localStorage.getItem(UNLOCK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save(id) {
  const arr = getSaved();
  if (!arr.includes(id)) {
    arr.push(id);
    localStorage.setItem(UNLOCK_KEY, JSON.stringify(arr));
  }
}

export function isSaved(id) {
  return getSaved().includes(id);
}

// ============================================
// ГЛАВНАЯ ФУНКЦИЯ: разблокированы ли обои
// ============================================
export function isWallpaperUnlocked(id) {
  const wp = WALLPAPERS[id];
  if (!wp) return false;

  // Уже сохранены — навсегда
  if (isSaved(id)) return true;

  // Проверяем условие
  try {
    if (wp.condition()) {
      save(id);
      return true;
    }
  } catch (e) {}

  return false;
}

// ============================================
// ОБНОВЛЕНИЕ ВСЕХ ОБОЕВ (вызывается после каждого действия)
// ============================================
export function refreshWallpapers() {
  const unlocked = [];
  Object.keys(WALLPAPERS).forEach((id) => {
    if (isWallpaperUnlocked(id)) {
      unlocked.push(id);
    }
  });
  return unlocked;
}

// ============================================
// СОХРАНЕНИЕ ФЛАГОВ ЗАВЕРШЕНИЯ МИРОВ
// ============================================
export function markBabyComplete() {
  rewards.unlock('baby_complete');
  save('forest');
  refreshWallpapers();
}

export function markJuniorComplete() {
  rewards.unlock('junior_complete');
  save('neon');
  refreshWallpapers();
}

export function markMiddleComplete() {
  rewards.unlock('middle_complete');
  save('sunset');
  refreshWallpapers();
}

export function markSeniorComplete() {
  rewards.unlock('senior_complete');
  save('ocean');
  refreshWallpapers();
}

export function markGameComplete() {
  rewards.unlock('game_complete');
  save('matrix');
  refreshWallpapers();
}

export function markPerfectChapter(chapterId) {
  const perfect = storage.get('perfect_chapters_v1', []);
  const arr = Array.isArray(perfect) ? perfect : [];
  if (!arr.includes(chapterId)) {
    arr.push(chapterId);
    storage.set('perfect_chapters_v1', arr);
  }
  // Если первая идеальная папка — открыть space
  if (arr.length >= 1) save('space');
  if (arr.length >= 3) save('cyberpunk');
  refreshWallpapers();
}

// ============================================
// ПРИМЕНЕНИЕ ОБОЕВ
// ============================================
let matrixAnimId = null;
let matrixCanvas = null;

export function applyWallpaper(id) {
  // Проверяем разблокировку — если нет, ставим default
  if (!isWallpaperUnlocked(id)) {
    id = 'default';
  }

  const wp = WALLPAPERS[id] || WALLPAPERS.default;
  const deskEl = document.getElementById('desktop');
  if (!deskEl) return;

  // Останавливаем предыдущую Matrix-анимацию
  if (matrixAnimId) {
    cancelAnimationFrame(matrixAnimId);
    matrixAnimId = null;
  }
  if (matrixCanvas) {
    matrixCanvas.remove();
    matrixCanvas = null;
  }

  // Сброс
  deskEl.style.backgroundImage = 'none';
  deskEl.style.background = '';

  // Обычные CSS-обои
  if (wp.css) {
    deskEl.style.background = wp.css;
    return;
  }

  // Особые
  if (wp.special === 'matrix') {
    deskEl.style.background = '#000';
    startMatrixWallpaper(deskEl);
    return;
  }

  if (wp.special === 'space') {
    deskEl.style.background = `
      radial-gradient(1.5px 1.5px at 20% 30%, #fff, transparent),
      radial-gradient(1px 1px at 60% 20%, #fff, transparent),
      radial-gradient(2px 2px at 80% 50%, #fff, transparent),
      radial-gradient(1px 1px at 40% 70%, #fff, transparent),
      radial-gradient(1.5px 1.5px at 10% 80%, rgba(255,255,255,0.9), transparent),
      radial-gradient(1px 1px at 90% 10%, #fff, transparent),
      radial-gradient(2px 2px at 70% 90%, rgba(200,200,255,0.9), transparent),
      radial-gradient(1px 1px at 30% 40%, #fff, transparent),
      radial-gradient(1.5px 1.5px at 55% 55%, rgba(150,100,255,0.8), transparent),
      radial-gradient(1px 1px at 85% 25%, #fff, transparent),
      radial-gradient(1px 1px at 15% 15%, #fff, transparent),
      radial-gradient(1.5px 1.5px at 45% 85%, #fff, transparent),
      radial-gradient(1px 1px at 25% 75%, rgba(200,200,255,0.8), transparent),
      radial-gradient(1.5px 1.5px at 75% 45%, #fff, transparent),
      radial-gradient(1px 1px at 5% 50%, #fff, transparent),
      radial-gradient(circle at 50% 50%, rgba(150,100,255,0.25) 0%, transparent 50%),
      radial-gradient(ellipse at center, #0a0a1a 0%, #000 100%)
    `;
    return;
  }
}

// ============================================
// MATRIX CANVAS
// ============================================
function startMatrixWallpaper(deskEl) {
  const canvas = document.createElement('canvas');
  canvas.id = 'matrix-canvas';

  deskEl.insertBefore(canvas, deskEl.firstChild);
  matrixCanvas = canvas;

  const ctx = canvas.getContext('2d');

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const fontSize = 16;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = Array(columns).fill(1);
  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCXYZ';

  const draw = () => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      if (Math.random() < 0.05) {
        ctx.fillStyle = '#aaffaa';
      } else {
        ctx.fillStyle = '#00ff41';
      }

      ctx.fillText(char, x, y);

      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }

    matrixAnimId = requestAnimationFrame(draw);
  };

  draw();
}

// Сброс обоев
export function resetWallpapers() {
  localStorage.removeItem(UNLOCK_KEY);
  localStorage.removeItem('perfect_chapters_v1');
}
