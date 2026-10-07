// Проверка ачивок PYTHON
import { progress } from '../core/progress.js';
import { Achievements } from '../ui/achievements/Achievements.js';

// Маппинг: глава → ачивка
const PY_CHAPTER_ACH = {
  '01_io':         'PY_IO',
  '02_numbers':    'PY_NUMBERS',
  '03_strings':    'PY_STRINGS',
  '04_collections':'PY_COLLECTIONS',
  '05_iteration':  'PY_ITERATION',
  '06_functions':  'PY_FUNCTIONS',
  '07_types':      'PY_TYPES',
  '08_attributes': 'PY_ATTRIBUTES',
  '09_meta':       'PY_META',
  '10_misc':       'PY_MISC',
};

const PY_ACH_TITLES = {
  PY_FIRST:      '🐍 Pythonista',
  PY_IO:         '💬 Первый вывод',
  PY_NUMBERS:    '🔢 Числодробитель',
  PY_STRINGS:    '📝 Строковед',
  PY_COLLECTIONS:'📦 Коллекционер',
  PY_ITERATION:  '🔁 Итератор',
  PY_FUNCTIONS:  '⚙️ Функционал',
  PY_TYPES:      '🏷️ Типовед',
  PY_ATTRIBUTES: '🔧 Атрибутчик',
  PY_META:       '👁 Метамаг',
  PY_MISC:       '🎲 Разнообразный',
  PY_MASTER:     '🐍 Python Master',
};

export async function checkPythonAchievements() {
  const ach = new Achievements();
  const unlocked = [];

  // Проверяем, есть ли хотя бы одна задача из python
  const solved = progress.getSolved();
  const pyTasks = solved.filter((id) => id.startsWith('python/'));
  if (pyTasks.length > 0 && ach.unlock('PY_FIRST')) {
    unlocked.push({ id: 'PY_FIRST', title: PY_ACH_TITLES.PY_FIRST });
  }

  // Проверяем каждую главу
  for (const [chapter, achId] of Object.entries(PY_CHAPTER_ACH)) {
    const prefix = `python/${chapter}/`;
    const chapterTasks = solved.filter((id) => id.startsWith(prefix));
    // Проверяем, что все задачи главы решены
    // Для простоты — достаточно, что есть хотя бы 1-2 задачи
    if (chapterTasks.length >= 2 && ach.unlock(achId)) {
      unlocked.push({ id: achId, title: PY_ACH_TITLES[achId] });
    }
  }

  // PY_MASTER — все 10 глав
  const allChaptersDone = Object.keys(PY_CHAPTER_ACH).every((ch) => {
    const prefix = `python/${ch}/`;
    return solved.filter((id) => id.startsWith(prefix)).length >= 2;
  });
  if (allChaptersDone && ach.unlock('PY_MASTER')) {
    unlocked.push({ id: 'PY_MASTER', title: PY_ACH_TITLES.PY_MASTER });
  }

  return unlocked;
}

export async function checkAndNotifyPython() {
  const unlocked = await checkPythonAchievements();
  if (unlocked.length === 0) return [];
  const { showAchievementToast } = await import('../ui/models/achievementChecker.js');
  unlocked.forEach((a, i) => {
    setTimeout(() => showAchievementToast(a), i * 800);
  });
  return unlocked;
}
