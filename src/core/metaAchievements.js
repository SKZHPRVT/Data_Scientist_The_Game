// Проверка meta-ачивок (100 звёзд, 500 звёзд, мир 100%, 50 ачивок)
import { progress } from './progress.js';
import { Achievements } from '../ui/achievements/Achievements.js';

export async function checkMetaAchievements() {
  const ach = new Achievements();
  const unlocked = [];

  // 1. Считаем общее число звёзд
  const solved = progress.getSolved();
  let totalStars = 0;
  for (const id of solved) {
    totalStars += progress.getStars(id);
  }

  if (totalStars >= 100 && ach.unlock('CENTURION')) {
    unlocked.push({ id: 'CENTURION', title: '💯 Центурион' });
  }
  if (totalStars >= 500 && ach.unlock('STAR_LORD')) {
    unlocked.push({ id: 'STAR_LORD', title: '🌟 Звёздный лорд' });
  }

  // 2. Проверка мира на 100%
  const worlds = ['baby', 'junior', 'middle', 'senior'];
  for (const world of worlds) {
    const worldTasks = solved.filter((id) => id.startsWith(world + '/'));
    // Считаем, что мир завершён, если в нём решено >= 20 задач (примерно)
    // Точнее — надо смотреть на index.json
    if (worldTasks.length >= 20) {
      // Проверим, что все задачи на 4 звезды хотя бы половина
      const perfect = worldTasks.filter((id) => progress.getStars(id) === 4).length;
      if (perfect >= worldTasks.length * 0.8) {
        if (ach.unlock('WORLD_DONE')) {
          unlocked.push({ id: 'WORLD_DONE', title: '🎓 Завершитель' });
        }
        break;
      }
    }
  }

  // 3. 50 других ачивок
  const otherAch = ach.unlocked.filter((id) => id !== 'ACH_HUNTER');
  if (otherAch.length >= 50 && ach.unlock('ACH_HUNTER')) {
    unlocked.push({ id: 'ACH_HUNTER', title: '🏆 Коллекционер ачивок' });
  }

  return unlocked;
}

export async function checkAndNotifyMeta() {
  const unlocked = await checkMetaAchievements();
  if (unlocked.length === 0) return [];
  const { showAchievementToast } = await import('../ui/models/achievementChecker.js');
  unlocked.forEach((a, i) => {
    setTimeout(() => showAchievementToast(a), i * 800);
  });
  return unlocked;
}
