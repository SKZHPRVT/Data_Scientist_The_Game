// Проверка ачивок VISION
import { progress } from '../core/progress.js';
import { Achievements } from '../ui/achievements/Achievements.js';
import { GENERATORS_BY_TYPE } from './generators/index.js';

// Проверить все ачивки VISION
export function checkVisionAchievements() {
  const ach = new Achievements();
  const newlyUnlocked = [];

  const solved = progress.getSolved();
  const visionIds = solved.filter((id) => id.startsWith('vision/'));
  const count = visionIds.length;

  // Вехи по количеству
  const milestones = [
    { count: 1,   id: 'VISION_FIRST', title: '🎯 Первый график' },
    { count: 10,  id: 'VISION_10',    title: '📊 Видящий' },
    { count: 50,  id: 'VISION_50',    title: '👁 Провидец' },
    { count: 100, id: 'VISION_100',   title: '🔮 Ясновидящий' },
    { count: 500, id: 'VISION_500',   title: '🧙 Мастер визуализации' },
  ];

  for (const m of milestones) {
    if (count >= m.count && ach.unlock(m.id)) {
      newlyUnlocked.push({ id: m.id, title: m.title });
    }
  }

  // Ачивки по типам (все задачи типа на 4⭐)
  const typeAch = {
    line:      { id: 'VISION_LINE',    title: '📈 Линейный маг' },
    bar:       { id: 'VISION_BAR',     title: '📊 Баронет' },
    scatter:   { id: 'VISION_SCATTER', title: '✨ Скаттерщик' },
    histogram: { id: 'VISION_HIST',    title: '🔔 Гистограммщик' },
    boxplot:   { id: 'VISION_BOX',     title: '📦 Ящичник' },
    pie:       { id: 'VISION_PIE',     title: '🥧 Круговой' },
    heatmap:   { id: 'VISION_HEAT',    title: '🔥 Тепловик' },
  };

  for (const [type, meta] of Object.entries(typeAch)) {
    const gens = GENERATORS_BY_TYPE[type] || [];
    if (gens.length === 0) continue;

    // Проверяем: у каждого генератора этого типа есть хотя бы одна задача на 4⭐
    let allPerfect = true;
    for (const gen of gens) {
      const prefix = `vision/${gen.id}/`;
      const genIds = solved.filter((id) => id.startsWith(prefix));
      const hasPerfect = genIds.some((id) => progress.getStars(id) === 4);
      if (!hasPerfect) {
        allPerfect = false;
        break;
      }
    }

    if (allPerfect && ach.unlock(meta.id)) {
      newlyUnlocked.push({ id: meta.id, title: meta.title });
    }
  }

  return newlyUnlocked;
}

// Показать toast (переиспользуем из achievementChecker)
export async function checkAndNotifyVision() {
  const unlocked = checkVisionAchievements();
  if (unlocked.length === 0) return [];

  // Импортируем showAchievementToast из существующего модуля
  const { showAchievementToast } = await import('../ui/models/achievementChecker.js');
  unlocked.forEach((a, i) => {
    setTimeout(() => showAchievementToast(a), i * 800);
  });
  return unlocked;
}
