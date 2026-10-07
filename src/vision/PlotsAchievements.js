// Проверка ачивок PLOTS
import { progress } from '../core/progress.js';
import { Achievements } from '../ui/achievements/Achievements.js';

const PL_CHAPTER_ACH = {
  '00_line':       'PL_LINE',
  '01_styles':     'PL_STYLES',
  '02_bar':        'PL_BAR',
  '03_bars_multi': 'PL_MULTIBAR',
  '04_hist':       'PL_HIST',
  '05_boxplot':    'PL_BOX',
  '06_scatter':    'PL_SCATTER',
  '07_heatmap':    'PL_HEAT',
  '08_seaborn':    'PL_SEABORN',
  '09_plotly':     'PL_PLOTLY',
  '10_read':       'PL_READ',
  '11_code':       'PL_CODE',
};

const PL_ACH_TITLES = {
  PL_LINE:    '📈 Лайнер',
  PL_STYLES:  '🎨 Стилист',
  PL_BAR:     '📊 Барон',
  PL_MULTIBAR:'📚 Мульти-барон',
  PL_HIST:    '🔔 Гистограммист',
  PL_BOX:     '📦 Ящичник',
  PL_SCATTER: '✨ Скаттерщик',
  PL_HEAT:    '🔥 Тепловик',
  PL_SEABORN: '🎭 Сиборонист',
  PL_PLOTLY:  '⚡ Плотлист',
  PL_READ:    '👁 Графикочёт',
  PL_CODE:    '💻 Кодер',
  PL_MASTER:  '📈 Plots Master',
};

export async function checkPlotsAchievements() {
  const ach = new Achievements();
  const unlocked = [];

  const solved = progress.getSolved();

  for (const [chapter, achId] of Object.entries(PL_CHAPTER_ACH)) {
    const prefix = `plots/${chapter}/`;
    const chapterTasks = solved.filter((id) => id.startsWith(prefix));
    if (chapterTasks.length >= 2 && ach.unlock(achId)) {
      unlocked.push({ id: achId, title: PL_ACH_TITLES[achId] });
    }
  }

  // PL_MASTER — все главы
  const allDone = Object.keys(PL_CHAPTER_ACH).every((ch) => {
    const prefix = `plots/${ch}/`;
    return solved.filter((id) => id.startsWith(prefix)).length >= 2;
  });
  if (allDone && ach.unlock('PL_MASTER')) {
    unlocked.push({ id: 'PL_MASTER', title: PL_ACH_TITLES.PL_MASTER });
  }

  return unlocked;
}

export async function checkAndNotifyPlots() {
  const unlocked = await checkPlotsAchievements();
  if (unlocked.length === 0) return [];
  const { showAchievementToast } = await import('../ui/models/achievementChecker.js');
  unlocked.forEach((a, i) => {
    setTimeout(() => showAchievementToast(a), i * 800);
  });
  return unlocked;
}
