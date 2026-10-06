// Проверка ачивок лаборатории моделей
import { progress } from '../../core/progress.js';
import { Achievements } from '../achievements/Achievements.js';

const FAMILY_ACHIEVEMENTS = {
  '01_linear':       { id: 'LINEAR_MAGE',  name: '📏 Линейный маг' },
  '05_trees':        { id: 'FORESTER',     name: '🌳 Лесоруб' },
  '06_clustering':   { id: 'CLUSTERER',    name: '🔵 Кластеризатор' },
  '07_neural':       { id: 'NEUROMANCER',  name: '🧠 Нейромант' },
};

// Проверить все ачивки лаборатории — вернуть список новых
export async function checkLabAchievements() {
  const lab = window.__models;
  if (!lab || !lab.index) return [];

  const ach = new Achievements();
  const newlyUnlocked = [];

  // Проверяем каждое семейство — все ли модели открыты
  for (const family of lab.index.families) {
    const familyData = lab.families[family.id];
    if (!familyData || !familyData.quests) continue;

    const total = familyData.quests.length;
    const solved = familyData.quests.filter((q) => {
      const id = progress.makeId('models/' + family.id + '/' + q.id);
      return progress.isSolved(id);
    }).length;

    if (solved >= total && FAMILY_ACHIEVEMENTS[family.id]) {
      const achId = FAMILY_ACHIEVEMENTS[family.id].id;
      if (ach.unlock(achId)) {
        newlyUnlocked.push({
          id: achId,
          title: FAMILY_ACHIEVEMENTS[family.id].name,
          icon: '🏆',
        });
      }
    }
  }

  // Проверяем все 38 моделей
  let totalSolved = 0;
  let totalModels = 0;
  for (const family of lab.index.families) {
    const familyData = lab.families[family.id];
    if (!familyData || !familyData.quests) continue;
    totalModels += familyData.quests.length;
    totalSolved += familyData.quests.filter((q) => {
      const id = progress.makeId('models/' + family.id + '/' + q.id);
      return progress.isSolved(id);
    }).length;
  }

  // Если все 38 — ачивка «Коллекционер» (если ещё нет)
  if (totalSolved >= 38) {
    if (ach.unlock('COLLECTOR')) {
      newlyUnlocked.push({
        id: 'COLLECTOR',
        title: '👑 Коллекционер',
        icon: '🏆',
      });
    }
  }

  return newlyUnlocked;
}

// Показать уведомление об ачивке
export function showAchievementToast(achievement) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 60px;
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    background: rgba(10, 10, 10, 0.95);
    border: 2px solid var(--accent);
    border-radius: 8px;
    padding: 12px 20px;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--accent);
    z-index: 9999;
    box-shadow: 0 4px 20px rgba(0, 255, 65, 0.4);
    opacity: 0;
    transition: opacity 0.3s, transform 0.3s;
    pointer-events: none;
    text-align: center;
    max-width: 320px;
  `;
  toast.innerHTML = `
    <div style="font-size: 20px; margin-bottom: 4px;">🏆</div>
    <div style="font-weight: 700;">АЧИВКА</div>
    <div style="margin-top: 4px;">${achievement.title}</div>
  `;
  document.body.appendChild(toast);

  // Появление
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  // Исчезновение через 3 секунды
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => toast.remove(), 400);
  }, 3000);

  // Звук
  if (window.__audio && window.__audio.success) {
    try { window.__audio.success(); } catch (e) {}
  }
}

// Полная проверка + показ уведомлений
export async function checkAndNotify() {
  const unlocked = await checkLabAchievements();
  unlocked.forEach((a, i) => {
    setTimeout(() => showAchievementToast(a), i * 800);
  });
  return unlocked;
}
