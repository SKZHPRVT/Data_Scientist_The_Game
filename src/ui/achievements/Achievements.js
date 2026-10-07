import { t } from '../../i18n/index.js';
import { isDevUnlockAll } from '../../core/dev.js';
import { handleDevCommand } from '../../core/devCommands.js';

const ACHIEVEMENTS = [
  { id: 'DIVIDE', title: 'Разделяй и понимай', titleEn: 'Divide and understand', icon: '⚖️', desc: 'Разделил данные на train и test. И не подглядывал.', descEn: 'Split data into train and test.', code: 'DIVIDE' },
  { id: 'CLEAN', title: 'Чистюля', titleEn: 'Cleaner', icon: '🧼', desc: 'Удалил дубликаты, заполнил пропуски, не потерял важное.', descEn: 'Removed duplicates, filled gaps.', code: 'CLEAN' },
  { id: 'FILTER', title: 'Первое знамение', titleEn: 'First signal', icon: '🔍', desc: 'Отсеял шум и увидел сигнал.', descEn: 'Filtered noise, saw the signal.', code: 'FILTER' },
  { id: 'FEATURES', title: 'Архитектор признаков', titleEn: 'Feature architect', icon: '🏗️', desc: 'Из 200 признаков оставил 10 решающих.', descEn: 'Left 10 decisive features.', code: 'FEATURES' },
  { id: 'CONNECT', title: 'Связующий', titleEn: 'Connector', icon: '🔗', desc: 'Нашёл зависимости там, где другие видели случайность.', descEn: 'Found dependencies in randomness.', code: 'CONNECT' },
  { id: 'MODEL', title: 'Обучил — сохранил', titleEn: 'Trained and saved', icon: '💾', desc: 'pickle.dump() — модель готова к бою.', descEn: 'pickle.dump() — model is ready.', code: 'MODEL' },
  { id: 'SIGNAL', title: 'Хранитель Сигнала', titleEn: 'Signal keeper', icon: '📡', desc: 'Финальная ачивка. Ты прошёл путь от шума до смысла.', descEn: 'Final achievement.', code: 'SIGNAL' },
  { id: 'NAN', title: 'NaN-невидимка', titleEn: 'NaN-invisible', icon: '👻', desc: 'Пропустил 30% данных — и всё равно победил.', descEn: 'Skipped 30% of data.', code: 'NAN', secret: true },
  { id: 'OVERFIT', title: 'Идеальный на трейне', titleEn: 'Perfect on train', icon: '📉', desc: 'Модель знала ответы наизусть. Реальный мир её сломал.', descEn: 'Model knew answers by heart.', code: 'OVERFIT', secret: true },
  { id: 'PANIC', title: 'Stack Overflow', titleEn: 'Stack Overflow', icon: '🚨', desc: 'Не знал что делать — и пошёл гуглить. Это тоже навык.', descEn: 'Googled it. Also a skill.', code: 'PANIC', secret: true },
  { id: 'TITANIC', title: 'Классика жанра', titleEn: 'Classic', icon: '🚢', desc: 'Обучил модель на датасете Титаника. Как и все.', descEn: 'Trained on Titanic.', code: 'TITANIC', secret: true },
  { id: 'COFFEE', title: 'Ночной дожор', titleEn: 'Night owl', icon: '☕', desc: 'Чистил данные до 3 ночи. Датасет не оценил.', descEn: 'Cleaned data until 3 AM.', code: 'COFFEE', secret: true },
  { id: 'PIPELINE', title: 'Конвейер', titleEn: 'Pipeline', icon: '🔧', desc: 'Автоматизировал то, что делал руками. Теперь ты свободен.', descEn: 'Automated what you did by hand.', code: 'PIPELINE' },
  { id: 'FEATURES_MASTER', title: 'Мастер фич', titleEn: 'Features master', icon: '🎨', desc: 'Понял, что хорошие признаки важнее сложной модели.', descEn: 'Good features beat complex models.', code: 'FEATURES_MASTER' },
  { id: 'MODEL_MASTER', title: 'Модельер', titleEn: 'Model master', icon: '🧠', desc: 'Обучил, сохранил, переиспользовал. Профи.', descEn: 'Trained, saved, reused.', code: 'MODEL_MASTER' },
  { id: 'EVAL_MASTER', title: 'Метрик-мастер', titleEn: 'Metrics master', icon: '📏', desc: 'Accuracy не врёт только когда данные сбалансированы.', descEn: 'Accuracy only tells truth with balanced data.', code: 'EVAL_MASTER' },
  { id: 'AB_MASTER', title: 'A/B-мастер', titleEn: 'A/B master', icon: '🧪', desc: 'Ты не веришь без доказательств.', descEn: 'You trust experiments, not opinions.', code: 'AB_MASTER' },
  { id: 'LEAKAGE', title: 'Утечка', titleEn: 'Leakage', icon: '💧', desc: 'Случайно заглянул в test.', descEn: 'Peeked at test.', code: 'LEAKAGE', secret: true },
  { id: 'PEEKING', title: 'Подглядывающий', titleEn: 'Peeker', icon: '👀', desc: 'Остановил A/B тест на третий день. Смело.', descEn: 'Stopped A/B on day 3.', code: 'PEEKING', secret: true },
  { id: 'INCIDENT', title: 'Ночной инцидент', titleEn: 'Night incident', icon: '🚨', desc: 'Прод упал в 3 ночи. Ты поднял.', descEn: 'Prod went down at 3 AM.', code: 'INCIDENT' },
  { id: 'RESEARCH', title: 'Исследователь', titleEn: 'Researcher', icon: '🔬', desc: 'Читал статьи, а не только туториалы.', descEn: 'Read papers, not just tutorials.', code: 'RESEARCH' },
  { id: 'MENTOR', title: 'Ментор', titleEn: 'Mentor', icon: '👥', desc: 'Объяснил джуну то, что сам недавно не понимал.', descEn: 'Explained to a junior.', code: 'MENTOR' },
  { id: 'ARCHITECT', title: 'Архитектор', titleEn: 'Architect', icon: '🏗️', desc: 'Сначала схема — потом код.', descEn: 'Diagram first, code after.', code: 'ARCHITECT' },
  { id: 'MASTER_SIGNAL', title: 'Магистр Сигнала', titleEn: 'Master of Signal', icon: '👑', desc: 'Ты разделил, выстроил, связал.', descEn: 'You divided, built, connected.', code: 'MASTER_SIGNAL' },
  { id: 'COLLECTOR', title: 'Коллекционер', titleEn: 'Collector', icon: '👑', desc: 'Собрал все 38 моделей и победил финального босса.', descEn: 'Collected all 38 models and beat the final boss.', code: 'COLLECTOR', platinum: true },
  { id: 'LINEAR_MAGE', title: 'Линейный маг', titleEn: 'Linear mage', icon: '📏', desc: 'Открыл все 8 линейных моделей.', descEn: 'Unlocked all 8 linear models.', code: 'LINEAR_MAGE' },
  { id: 'FORESTER', title: 'Лесоруб', titleEn: 'Forester', icon: '🌳', desc: 'Открыл все деревья и ансамбли.', descEn: 'Unlocked all trees and ensembles.', code: 'FORESTER' },
  { id: 'CLUSTERER', title: 'Кластеризатор', titleEn: 'Clusterer', icon: '🔵', desc: 'Открыл все модели кластеризации.', descEn: 'Unlocked all clustering models.', code: 'CLUSTERER' },
  { id: 'NEUROMANCER', title: 'Нейромант', titleEn: 'Neuromancer', icon: '🧠', desc: 'Открыл все нейросетевые модели.', descEn: 'Unlocked all neural models.', code: 'NEUROMANCER' },
  // === VISION ===
  { id: 'VISION_FIRST', title: 'Первый график', titleEn: 'First chart', icon: '🎯', desc: 'Решил первую задачу в тренажёре VISION.', descEn: 'Solved first VISION task.', code: 'VISION_FIRST' },
  { id: 'VISION_10', title: 'Видящий', titleEn: 'Seer', icon: '📊', desc: '10 задач в VISION.', descEn: '10 VISION tasks.', code: 'VISION_10' },
  { id: 'VISION_50', title: 'Провидец', titleEn: 'Prophet', icon: '👁', desc: '50 задач в VISION.', descEn: '50 VISION tasks.', code: 'VISION_50' },
  { id: 'VISION_100', title: 'Ясновидящий', titleEn: 'Clairvoyant', icon: '🔮', desc: '100 задач в VISION.', descEn: '100 VISION tasks.', code: 'VISION_100' },
  { id: 'VISION_500', title: 'Мастер визуализации', titleEn: 'Visualization master', icon: '🧙', desc: '500 задач в VISION. Ты видишь данные насквозь.', descEn: '500 VISION tasks.', code: 'VISION_500', platinum: true },
  { id: 'VISION_LINE', title: 'Линейный маг', titleEn: 'Line mage', icon: '📈', desc: 'Все задачи line на 4⭐.', descEn: 'All line tasks at 4⭐.', code: 'VISION_LINE' },
  { id: 'VISION_BAR', title: 'Баронет', titleEn: 'Baronet', icon: '📊', desc: 'Все задачи bar на 4⭐.', descEn: 'All bar tasks at 4⭐.', code: 'VISION_BAR' },
  { id: 'VISION_SCATTER', title: 'Скаттерщик', titleEn: 'Scatterer', icon: '✨', desc: 'Все задачи scatter на 4⭐.', descEn: 'All scatter tasks at 4⭐.', code: 'VISION_SCATTER' },
  { id: 'VISION_HIST', title: 'Гистограммщик', titleEn: 'Histogrammer', icon: '🔔', desc: 'Все задачи histogram на 4⭐.', descEn: 'All histogram tasks at 4⭐.', code: 'VISION_HIST' },
  { id: 'VISION_BOX', title: 'Ящичник', titleEn: 'Boxplotter', icon: '📦', desc: 'Все задачи boxplot на 4⭐.', descEn: 'All boxplot tasks at 4⭐.', code: 'VISION_BOX' },
  { id: 'VISION_PIE', title: 'Круговой', titleEn: 'Pie master', icon: '🥧', desc: 'Все задачи pie на 4⭐.', descEn: 'All pie tasks at 4⭐.', code: 'VISION_PIE' },
  { id: 'VISION_HEAT', title: 'Тепловик', titleEn: 'Heatmaster', icon: '🔥', desc: 'Все задачи heatmap на 4⭐.', descEn: 'All heatmap tasks at 4⭐.', code: 'VISION_HEAT' },

  // === PYTHON ===
  { id: 'PY_FIRST',      title: 'Pythonista',          titleEn: 'Pythonista',          icon: '🐍', desc: 'Начал путь в PYTHON.', descEn: 'Started PYTHON path.', code: 'PY_FIRST' },
  { id: 'PY_IO',         title: 'Первый вывод',        titleEn: 'First output',        icon: '💬', desc: 'Прошёл главу Ввод-вывод.', descEn: 'Completed I/O chapter.', code: 'PY_IO' },
  { id: 'PY_NUMBERS',    title: 'Числодробитель',      titleEn: 'Number crusher',      icon: '🔢', desc: 'Прошёл главу Числа.', descEn: 'Completed Numbers chapter.', code: 'PY_NUMBERS' },
  { id: 'PY_STRINGS',    title: 'Строковед',           titleEn: 'Stringologist',       icon: '📝', desc: 'Прошёл главу Строки.', descEn: 'Completed Strings chapter.', code: 'PY_STRINGS' },
  { id: 'PY_COLLECTIONS',title: 'Коллекционер',        titleEn: 'Collector',           icon: '📦', desc: 'Прошёл главу Коллекции.', descEn: 'Completed Collections chapter.', code: 'PY_COLLECTIONS' },
  { id: 'PY_ITERATION',  title: 'Итератор',            titleEn: 'Iterator',            icon: '🔁', desc: 'Прошёл главу Итерация.', descEn: 'Completed Iteration chapter.', code: 'PY_ITERATION' },
  { id: 'PY_FUNCTIONS',  title: 'Функционал',          titleEn: 'Functional',          icon: '⚙️', desc: 'Прошёл главу Функции.', descEn: 'Completed Functions chapter.', code: 'PY_FUNCTIONS' },
  { id: 'PY_TYPES',      title: 'Типовед',             titleEn: 'Type master',         icon: '🏷️', desc: 'Прошёл главу Типы.', descEn: 'Completed Types chapter.', code: 'PY_TYPES' },
  { id: 'PY_ATTRIBUTES', title: 'Атрибутчик',          titleEn: 'Attr master',         icon: '🔧', desc: 'Прошёл главу Атрибуты.', descEn: 'Completed Attributes chapter.', code: 'PY_ATTRIBUTES' },
  { id: 'PY_META',       title: 'Метамаг',             titleEn: 'Metamage',            icon: '👁', desc: 'Прошёл главу Мета.', descEn: 'Completed Meta chapter.', code: 'PY_META' },
  { id: 'PY_MISC',       title: 'Разнообразный',       titleEn: 'Misc master',         icon: '🎲', desc: 'Прошёл главу Разное.', descEn: 'Completed Misc chapter.', code: 'PY_MISC' },
  { id: 'PY_MASTER',     title: 'Python Master',       titleEn: 'Python Master',       icon: '🐍', desc: 'Прошёл все главы PYTHON.', descEn: 'Completed all PYTHON chapters.', code: 'PY_MASTER', platinum: true },

  // === PLOTS ===
  { id: 'PL_LINE',       title: 'Лайнер',              titleEn: 'Liner',               icon: '📈', desc: 'Прошёл главу Line.', descEn: 'Completed Line chapter.', code: 'PL_LINE' },
  { id: 'PL_STYLES',     title: 'Стилист',             titleEn: 'Stylist',             icon: '🎨', desc: 'Прошёл главу Styles.', descEn: 'Completed Styles chapter.', code: 'PL_STYLES' },
  { id: 'PL_BAR',        title: 'Барон',               titleEn: 'Baron',               icon: '📊', desc: 'Прошёл главу Bar.', descEn: 'Completed Bar chapter.', code: 'PL_BAR' },
  { id: 'PL_MULTIBAR',   title: 'Мульти-барон',        titleEn: 'Multi-Baron',         icon: '📚', desc: 'Прошёл главу Multi-Bar.', descEn: 'Completed Multi-Bar chapter.', code: 'PL_MULTIBAR' },
  { id: 'PL_HIST',       title: 'Гистограммист',       titleEn: 'Histogrammer',        icon: '🔔', desc: 'Прошёл главу Histogram.', descEn: 'Completed Histogram chapter.', code: 'PL_HIST' },
  { id: 'PL_BOX',        title: 'Ящичник',             titleEn: 'Boxplotter',          icon: '📦', desc: 'Прошёл главу Boxplot.', descEn: 'Completed Boxplot chapter.', code: 'PL_BOX' },
  { id: 'PL_SCATTER',    title: 'Скаттерщик',          titleEn: 'Scatterer',           icon: '✨', desc: 'Прошёл главу Scatter.', descEn: 'Completed Scatter chapter.', code: 'PL_SCATTER' },
  { id: 'PL_HEAT',       title: 'Тепловик',            titleEn: 'Heatmaster',          icon: '🔥', desc: 'Прошёл главу Heatmap.', descEn: 'Completed Heatmap chapter.', code: 'PL_HEAT' },
  { id: 'PL_SEABORN',    title: 'Сиборонист',          titleEn: 'Seabornist',          icon: '🎭', desc: 'Прошёл главу Seaborn.', descEn: 'Completed Seaborn chapter.', code: 'PL_SEABORN' },
  { id: 'PL_PLOTLY',     title: 'Плотлист',            titleEn: 'Plotlyst',            icon: '⚡', desc: 'Прошёл главу Plotly.', descEn: 'Completed Plotly chapter.', code: 'PL_PLOTLY' },
  { id: 'PL_READ',       title: 'Графикочёт',          titleEn: 'Chart reader',        icon: '👁', desc: 'Прошёл главу Read Charts.', descEn: 'Completed Read Charts chapter.', code: 'PL_READ' },
  { id: 'PL_CODE',       title: 'Кодер',               titleEn: 'Coder',               icon: '💻', desc: 'Прошёл главу Code.', descEn: 'Completed Code chapter.', code: 'PL_CODE' },
  { id: 'PL_MASTER',     title: 'Plots Master',        titleEn: 'Plots Master',        icon: '📈', desc: 'Прошёл все главы PLOTS.', descEn: 'Completed all PLOTS chapters.', code: 'PL_MASTER', platinum: true },

  // === META (для 72) ===
  { id: 'CENTURION', title: 'Центурион', titleEn: 'Centurion', icon: '💯', desc: 'Собрал 100 звёзд всего.', descEn: 'Collected 100 stars total.', code: 'CENTURION' },
  { id: 'STAR_LORD', title: 'Звёздный лорд', titleEn: 'Star lord', icon: '🌟', desc: 'Собрал 500 звёзд всего.', descEn: 'Collected 500 stars total.', code: 'STAR_LORD' },
  { id: 'WORLD_DONE', title: 'Завершитель', titleEn: 'World finisher', icon: '🎓', desc: 'Прошёл любой мир на 100%.', descEn: 'Completed any world 100%.', code: 'WORLD_DONE' },
  { id: 'ACH_HUNTER', title: 'Коллекционер ачивок', titleEn: 'Achievement hunter', icon: '🏆', desc: 'Открыл 50 других ачивок.', descEn: 'Unlocked 50 other achievements.', code: 'ACH_HUNTER', platinum: true },

  { id: 'ILLUMINATI', title: 'Тот, кто читает описания', titleEn: 'One who reads descriptions', icon: '👁', desc: 'Нашёл то, чего не должно было быть.', descEn: 'Found what should not be there.', code: 'ILLUMINATI', secret: true },
  { id: 'DIVIDE_ET_IMPERA', title: 'Divide et Impera', titleEn: 'Divide et Impera', icon: '🏆', desc: 'Ты разделил, выстроил, связал.', descEn: 'You divided, built, connected.', code: 'DIVIDE-ET-IMPERA', platinum: true },
];

const ACH_KEY = 'achievements_v1';

export class Achievements {
  constructor(options = {}) {
    this.unlocked = this._load();
    this.mode = options.mode || 'achievements';
    this.onAction = options.onAction || null;
  }

  _load() {
    try {
      const raw = localStorage.getItem(ACH_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  _save() {
    localStorage.setItem(ACH_KEY, JSON.stringify(this.unlocked));
  }

  isUnlocked(id) {
    return this.unlocked.includes(id);
  }

  unlock(id) {
    if (!this.isUnlocked(id)) {
      this.unlocked.push(id);
      this._save();
      return true;
    }
    return false;
  }

  render() {
    const isCheatMode = this.mode === 'cheats';
    const visible = ACHIEVEMENTS.filter((a) => !a.secret || this.isUnlocked(a.id));
    const total = ACHIEVEMENTS.length;
    const unlockedCount = this.unlocked.length;
    const devMode = isDevUnlockAll();

    return `
      <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.6;">
        <p style="font-size: 15px; font-weight: 700; color: var(--accent); margin-bottom: 8px;">
          ${isCheatMode ? '🗝 ' + t('cheats_title') : '🏆 ' + t('ach_title') + ' · ' + unlockedCount + ' / ' + total}
        </p>
        ${isCheatMode ? `<p style="color: var(--fg-dim); font-size: 11px;">${t('cheats_hint')}</p>` : ''}

        <div id="ach-list" style="margin-top: 12px; max-height: ${devMode && isCheatMode ? '180px' : '340px'}; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
          ${visible.map((a) => {
            const unlocked = this.isUnlocked(a.id);
            const lang = localStorage.getItem('lang') === 'en' ? 'en' : 'ru';
            const title = lang === 'en' ? (a.titleEn || a.title) : a.title;
            const desc = lang === 'en' ? (a.descEn || a.desc) : a.desc;
            return `
              <div class="ach-item ${unlocked ? 'unlocked' : 'locked'} ${a.platinum ? 'platinum' : ''}" data-ach-idx="${a.id}">
                <div class="ach-icon">${unlocked ? a.icon : '🔒'}</div>
                <div class="ach-body">
                  <div class="ach-title">${title}</div>
                  <div class="ach-desc">${unlocked ? desc : t('ach_locked')}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <p style="margin-top: 16px;">🗝 ${t('ach_code_label')}</p>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <input type="text" id="code-input" placeholder="${t('ach_code_placeholder')}"
                 style="flex: 1; background: transparent; border: 1px solid var(--fg-dim); color: var(--fg);
                        padding: 8px 12px; font-family: var(--font-mono); font-size: 12px; border-radius: 4px;"
                 autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
          <button class="task-btn" id="code-btn" style="flex: 0 0 auto; padding: 8px 16px;">${t('ach_code_ok')}</button>
        </div>
        <div id="code-result" style="margin-top: 8px; font-size: 11px; min-height: 16px; white-space: pre-wrap; font-family: var(--font-mono);"></div>

        ${isCheatMode ? `
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed var(--fg-dim);">
            <p style="color: var(--warn); font-weight: 700; font-size: 12px; margin-bottom: 8px;">
              ⚙️ DEV-КОМАНДЫ
            </p>
            <p style="font-size: 10px; color: var(--fg-dim); line-height: 1.7; font-family: var(--font-mono);">
              sv_cheats 1     — открыть всё<br>
              sv_cheats 0     — закрыть всё<br>
              end             — финал SENIOR<br>
              junior_end      — финал JUNIOR<br>
              middle_end      — карта MIDDLE<br>
              unlock W        — мир на 1⭐ (junior|middle|senior)<br>
              complete W      — мир на 4⭐<br>
              stars N         — всем N звёзд (1..4)<br>
              reset           — сбросить всё<br>
              help            — справка
            </p>
          </div>
        ` : ''}
      </div>
    `;
  }

  _showAchievementModal(ach) {
    const lang = localStorage.getItem('lang') === 'en' ? 'en' : 'ru';
    const title = lang === 'en' ? (ach.titleEn || ach.title) : ach.title;
    const desc = lang === 'en' ? (ach.descEn || ach.desc) : ach.desc;
    const unlocked = this.isUnlocked(ach.id);

    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 10000;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-mono); padding: 20px;
      opacity: 0; transition: opacity 0.25s;
    `;
    modal.innerHTML = `
      <div style="background: #0a0a0a; border: 2px solid ${ach.platinum ? 'var(--warn)' : 'var(--accent)'};
                  border-radius: 12px; padding: 24px; max-width: 400px; width: 100%;
                  box-shadow: 0 0 40px ${ach.platinum ? 'rgba(255,170,0,0.4)' : 'rgba(0,255,65,0.3)'};
                  text-align: center;">
        <pre style="font-size: 10px; line-height: 1.2; color: ${ach.platinum ? 'var(--warn)' : 'var(--accent)'}; margin-bottom: 12px; white-space: pre;">${
          ach.platinum ? '  ╔══════════════════╗\n  ║  ★ PLATINUM ★   ║\n  ╚══════════════════╝' : '  ┌──────────────────┐\n  │   UNLOCKED       │\n  └──────────────────┘'
        }</pre>
        <div style="font-size: 64px; line-height: 1; margin-bottom: 12px;">${unlocked ? ach.icon : '🔒'}</div>
        <div style="font-size: 18px; font-weight: 700; color: ${ach.platinum ? 'var(--warn)' : 'var(--accent)'}; margin-bottom: 12px;">
          ${unlocked ? title : '???'}
        </div>
        <div style="font-size: 12px; color: var(--fg); line-height: 1.7; margin-bottom: 16px;">
          ${unlocked ? desc : 'Заблокировано. Продолжай играть.'}
        </div>
        ${unlocked ? '<div style="font-size: 10px; color: var(--fg-dim);">✅ Разблокировано</div>' : ''}
        <button id="ach-modal-close" class="task-btn" style="margin-top: 16px; padding: 10px 24px;">Закрыть</button>
      </div>
    `;
    document.body.appendChild(modal);

    requestAnimationFrame(() => { modal.style.opacity = '1'; });

    const close = () => {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 300);
    };
    modal.querySelector('#ach-modal-close').onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };

    if (window.__audio && window.__audio.click) {
      try { window.__audio.click('open'); } catch (e) {}
    }
  }

  mount(body) {
    // Обработчики клика на ачивки
    body.querySelectorAll('.ach-item').forEach((el) => {
      el.style.cursor = 'pointer';
      el.onclick = () => {
        const idx = el.dataset.achIdx;
        const ach = ACHIEVEMENTS.find((a) => a.id === idx);
        if (ach) this._showAchievementModal(ach);
      };
    });

    const btn = body.querySelector('#code-btn');
    const input = body.querySelector('#code-input');
    const result = body.querySelector('#code-result');

    if (!btn || !input) return;

    btn.onclick = () => this._tryCode(input.value, result, body);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
  }

  async _tryCode(code, resultEl, body) {
    const raw = code.trim();
    const clean = raw.toUpperCase().replace(/\s+/g, ' ');

    if (!raw) {
      resultEl.innerHTML = `<span style="color: var(--warn);">${t('ach_enter_code')}</span>`;
      return;
    }

    // Дев-команды (всегда доступны в режиме cheats)
    const devResult = await handleDevCommand(raw);
    if (devResult && devResult.ok) {
      resultEl.innerHTML = `<span style="color: var(--accent);">${devResult.message}</span>`;
      if (window.__audio) window.__audio.success();

      if (devResult.action === 'reload') {
        setTimeout(() => location.reload(), 800);
      } else if (devResult.action === 'show_senior_finale') {
        if (this.onAction) this.onAction('show_senior_finale');
        setTimeout(() => {
          const win = body.closest('.window');
          if (win) win.remove();
        }, 500);
      } else if (devResult.action === 'show_junior_finale') {
        if (this.onAction) this.onAction('show_junior_finale');
        setTimeout(() => {
          const win = body.closest('.window');
          if (win) win.remove();
        }, 500);
      } else if (devResult.action === 'show_middle_map') {
        if (this.onAction) this.onAction('show_middle_map');
        setTimeout(() => {
          const win = body.closest('.window');
          if (win) win.remove();
        }, 500);
      }
      return;
    }

    // Игровые ачивки
    const ach = ACHIEVEMENTS.find((a) => a.code === clean);
    if (!ach) {
      resultEl.innerHTML = `<span style="color: var(--error);">${devResult?.message || t('ach_unknown')}</span>`;
      if (window.__audio) window.__audio.error();
      return;
    }
    if (this.isUnlocked(ach.id)) {
      resultEl.innerHTML = `<span style="color: var(--warn);">${t('ach_already')}</span>`;
      return;
    }

    this.unlock(ach.id);
    if (window.__audio) window.__audio.success();
    resultEl.innerHTML = `<span style="color: var(--accent);">✅ ${ach.title} — ${ach.desc}</span>`;

    setTimeout(() => {
      const win = body.closest('.window');
      if (win) {
        const bodyEl = win.querySelector('.window-body');
        if (bodyEl) {
          bodyEl.innerHTML = this.render();
          this.mount(bodyEl);
        }
      }
    }, 1000);
  }
}
