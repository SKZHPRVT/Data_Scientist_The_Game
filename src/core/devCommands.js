import { isDevUnlockAll } from './dev.js';
import { progress, rewards } from './progress.js';

const CHEAT_KEY = 'sv_cheats';
const ACH_KEY = 'achievements_v1';

export async function handleDevCommand(input) {
  const cmd = input.trim().toLowerCase();
  const parts = cmd.split(/\s+/);
  const name = parts[0];

  if (name === 'sv_cheats') {
    const val = parts[1];
    if (val === '1') {
      localStorage.setItem(CHEAT_KEY, '1');
      return { ok: true, message: '🔓 sv_cheats активированы. Все миры открыты.', action: 'reload' };
    }
    if (val === '0') {
      localStorage.setItem(CHEAT_KEY, '0');
      return { ok: true, message: '🔒 sv_cheats выключены. Прогрессия восстановлена.', action: 'reload' };
    }
    return { ok: false, message: 'Использование: sv_cheats 1 | sv_cheats 0' };
  }

  if (name === 'end') {
    return { ok: true, message: '👑 Открываю финал SENIOR...', action: 'show_senior_finale' };
  }

  if (name === 'junior_end') {
    return { ok: true, message: '🎉 Открываю финал JUNIOR...', action: 'show_junior_finale' };
  }

  if (name === 'middle_end') {
    return { ok: true, message: '🚀 Открываю карту MIDDLE...', action: 'show_middle_map' };
  }

  if (name === 'reset') {
    // Полный сброс — включая rewards и achievements
    progress.reset();
    localStorage.removeItem('rewards_v1');
    localStorage.removeItem(ACH_KEY);
    localStorage.removeItem(CHEAT_KEY);
    return { ok: true, message: '💥 Полный сброс. Всё удалено.', action: 'reload' };
  }

  if (name === 'unlock') {
    const world = parts[1];
    if (!['baby', 'junior', 'middle', 'senior'].includes(world)) {
      return { ok: false, message: 'Использование: unlock baby | junior | middle | senior' };
    }
    return await completeWorldTasks(world, 1);
  }

  if (name === 'complete') {
    const world = parts[1];
    if (!['baby', 'junior', 'middle', 'senior'].includes(world)) {
      return { ok: false, message: 'Использование: complete baby | junior | middle | senior' };
    }
    return await completeWorldTasks(world, 4);
  }

  if (name === 'stars') {
    const n = parseInt(parts[1], 10);
    if (isNaN(n) || n < 1 || n > 4) {
      return { ok: false, message: 'Использование: stars 1..4' };
    }
    return await setAllStars(n);
  }

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
  return { ok: true, message: `✅ ${worldId}: ${tasks.length} задач (${stars}⭐)`, action: 'reload' };
}

async function setAllStars(n) {
  const worlds = ['baby', 'junior', 'middle', 'senior'];
  let total = 0;
  for (const w of worlds) {
    const tasks = await collectWorldTasks(w);
    tasks.forEach((id) => {
      progress.markSolved(id);
      progress.setStars(id, n);
    });
    total += tasks.length;
  }
  return { ok: true, message: `⭐ Всем ${total} задачам поставлено ${n} звёзд.`, action: 'reload' };
}
