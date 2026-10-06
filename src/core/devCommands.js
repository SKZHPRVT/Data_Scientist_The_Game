// ============================================
// ДЕВ-КОМАНДЫ (только при DEV_UNLOCK_ALL = true)
// ============================================

import { DEV_UNLOCK_ALL } from './dev.js';
import { progress, rewards } from './progress.js';

const CHEAT_KEY = 'sv_cheats';
const ACH_KEY = 'achievements_v1';

export function isDevMode() {
  return DEV_UNLOCK_ALL;
}

// ============================================
// ОБРАБОТЧИК ДЕВ-КОМАНД
// ============================================
// Возвращает: { ok: boolean, message: string, action?: string }
// ============================================
export async function handleDevCommand(input, context = {}) {
  if (!DEV_UNLOCK_ALL) {
    return { ok: false, message: 'DEV mode выключен' };
  }

  const cmd = input.trim().toLowerCase();
  const parts = cmd.split(/\s+/);
  const name = parts[0];

  // === sv_cheats 1 / 0 ===
  if (name === 'sv_cheats') {
    const val = parts[1];
    if (val === '1') {
      localStorage.setItem(CHEAT_KEY, '1');
      return {
        ok: true,
        message: '🔓 sv_cheats активированы. Все миры открыты.',
        action: 'reload',
      };
    }
    if (val === '0') {
      localStorage.setItem(CHEAT_KEY, '0');
      return {
        ok: true,
        message: '🔒 sv_cheats выключены. Прогрессия восстановлена.',
        action: 'reload',
      };
    }
    return { ok: false, message: 'Использование: sv_cheats 1 | sv_cheats 0' };
  }

  // === end — финал SENIOR ===
  if (name === 'end') {
    return {
      ok: true,
      message: '👑 Открываю финал SENIOR...',
      action: 'show_senior_finale',
    };
  }

  // === junior_end ===
  if (name === 'junior_end') {
    return {
      ok: true,
      message: '🎉 Открываю финал JUNIOR...',
      action: 'show_junior_finale',
    };
  }

  // === middle_end ===
  if (name === 'middle_end') {
    // Просто открываем карту MIDDLE (спец. финала нет)
    return {
      ok: true,
      message: '🚀 Открываю карту MIDDLE...',
      action: 'show_middle_map',
    };
  }

  // === reset ===
  if (name === 'reset') {
    progress.reset();
    localStorage.removeItem('rewards_v1');
    localStorage.removeItem(ACH_KEY);
    localStorage.removeItem(CHEAT_KEY);
    return {
      ok: true,
      message: '💥 Прогресс сброшен.',
      action: 'reload',
    };
  }

  // === unlock [world] ===
  if (name === 'unlock') {
    const world = parts[1];
    if (!['junior', 'middle', 'senior'].includes(world)) {
      return { ok: false, message: 'Использование: unlock junior | middle | senior' };
    }
    // Пометим все задачи мира как решённые на 1 звезду
    return await completeWorldTasks(world, 1);
  }

  // === complete [world] ===
  if (name === 'complete') {
    const world = parts[1];
    if (!['junior', 'middle', 'senior'].includes(world)) {
      return { ok: false, message: 'Использование: complete junior | middle | senior' };
    }
    return await completeWorldTasks(world, 4);
  }

  // === stars [n] ===
  if (name === 'stars') {
    const n = parseInt(parts[1], 10);
    if (isNaN(n) || n < 1 || n > 4) {
      return { ok: false, message: 'Использование: stars 1..4' };
    }
    return await setAllStars(n);
  }

  // === help ===
  if (name === 'help' || name === '?') {
    return {
      ok: true,
      message: [
        'sv_cheats 1     — открыть всё',
        'sv_cheats 0     — закрыть всё',
        'end             — финал SENIOR',
        'junior_end      — финал JUNIOR',
        'middle_end      — карта MIDDLE',
        'unlock W        — разблокировать мир (1⭐)',
        'complete W      — завершить мир (4⭐)',
        'stars N         — поставить N звёзд',
        'reset           — сбросить всё',
        'help            — эта справка',
      ].join('\n'),
    };
  }

  return { ok: false, message: `Неизвестная команда: ${name}. Введи help.` };
}

// ============================================
// ХЕЛПЕРЫ
// ============================================
async function collectWorldTasks(worldId) {
  const tasks = [];
  const base = import.meta.env.BASE_URL + 'tasks/' + worldId + '/';
  try {
    const worldIdx = await fetch(base + 'index.json').then((r) => r.json());
    for (const ch of worldIdx.chapters || []) {
      try {
        const chIdx = await fetch(base + ch.id + '/index.json').then((r) => r.json());
        (chIdx.tasks || []).forEach((t) => {
          tasks.push(`${worldId}/${ch.id}/${t.replace('.json', '')}`);
        });
      } catch (e) {}
    }
  } catch (e) {}
  return tasks;
}

async function completeWorldTasks(worldId, stars) {
  const tasks = await collectWorldTasks(worldId);
  if (tasks.length === 0) {
    return { ok: false, message: `Не найдено задач в ${worldId}` };
  }
  tasks.forEach((id) => {
    progress.markSolved(id);
    progress.setStars(id, stars);
  });
  return {
    ok: true,
    message: `✅ ${worldId}: ${tasks.length} задач отмечены (${stars}⭐)`,
    action: 'reload',
  };
}

async function setAllStars(n) {
  const worlds = ['junior', 'middle', 'senior'];
  let total = 0;
  for (const w of worlds) {
    const tasks = await collectWorldTasks(w);
    tasks.forEach((id) => {
      progress.markSolved(id);
      progress.setStars(id, n);
    });
    total += tasks.length;
  }
  return {
    ok: true,
    message: `⭐ Всем ${total} задачам поставлено ${n} звёзд.`,
    action: 'reload',
  };
}

// ============================================
// ПРОВЕРКА sv_cheats
// ============================================
export function isCheatModeOn() {
  return localStorage.getItem(CHEAT_KEY) === '1';
}
