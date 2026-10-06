import { t } from '../../i18n/index.js';

const ACHIEVEMENTS = [
  { id: 'DIVIDE', title: 'Разделяй и понимай', titleEn: 'Divide and understand', icon: '⚖️', desc: 'Разделил данные на train и test. И не подглядывал.', descEn: 'Split data into train and test. And did not peek.', code: 'DIVIDE' },
  { id: 'CLEAN', title: 'Чистюля', titleEn: 'Cleaner', icon: '🧼', desc: 'Удалил дубликаты, заполнил пропуски, не потерял важное.', descEn: 'Removed duplicates, filled gaps, kept what matters.', code: 'CLEAN' },
  { id: 'FILTER', title: 'Первое знамение', titleEn: 'First signal', icon: '🔍', desc: 'Отсеял шум и увидел сигнал.', descEn: 'Filtered noise and saw the signal.', code: 'FILTER' },
  { id: 'FEATURES', title: 'Архитектор признаков', titleEn: 'Feature architect', icon: '🏗️', desc: 'Из 200 признаков оставил 10 решающих.', descEn: 'Left 10 decisive features out of 200.', code: 'FEATURES' },
  { id: 'CONNECT', title: 'Связующий', titleEn: 'Connector', icon: '🔗', desc: 'Нашёл зависимости там, где другие видели случайность.', descEn: 'Found dependencies where others saw randomness.', code: 'CONNECT' },
  { id: 'MODEL', title: 'Обучил — сохранил', titleEn: 'Trained and saved', icon: '💾', desc: 'pickle.dump() — модель готова к бою.', descEn: 'pickle.dump() — model is ready.', code: 'MODEL' },
  { id: 'SIGNAL', title: 'Хранитель Сигнала', titleEn: 'Signal keeper', icon: '📡', desc: 'Финальная ачивка. Ты прошёл путь от шума до смысла.', descEn: 'Final achievement. From noise to meaning.', code: 'SIGNAL' },

  { id: 'NAN', title: 'NaN-невидимка', titleEn: 'NaN-invisible', icon: '👻', desc: 'Пропустил 30% данных — и всё равно победил.', descEn: 'Skipped 30% of data — and still won.', code: 'NAN', secret: true },
  { id: 'OVERFIT', title: 'Идеальный на трейне', titleEn: 'Perfect on train', icon: '📉', desc: 'Модель знала ответы наизусть. Реальный мир её сломал.', descEn: 'Model knew answers by heart. Real world broke it.', code: 'OVERFIT', secret: true },
  { id: 'PANIC', title: 'Stack Overflow', titleEn: 'Stack Overflow', icon: '🚨', desc: 'Не знал что делать — и пошёл гуглить. Это тоже навык.', descEn: 'Did not know what to do — and googled. Also a skill.', code: 'PANIC', secret: true },
  { id: 'TITANIC', title: 'Классика жанра', titleEn: 'Classic', icon: '🚢', desc: 'Обучил модель на датасете Титаника. Как и все.', descEn: 'Trained model on Titanic dataset. Like everyone.', code: 'TITANIC', secret: true },
  { id: 'COFFEE', title: 'Ночной дожор', titleEn: 'Night owl', icon: '☕', desc: 'Чистил данные до 3 ночи. Датасет не оценил.', descEn: 'Cleaned data until 3 AM. Dataset did not care.', code: 'COFFEE', secret: true },
  { id: 'ILLUMINATI', title: 'Тот, кто читает описания', titleEn: 'One who reads descriptions', icon: '👁', desc: 'Нашёл то, чего не должно было быть. Око видит тебя.', descEn: 'Found what should not be there. The Eye sees you.', code: 'ILLUMINATI', secret: true },
  { id: 'DIVIDE_ET_IMPERA', title: 'Магистр Сигнала', titleEn: 'Master of Signal', icon: '🏆', desc: 'Ты разделил, выстроил, связал. Ты прошёл путь целиком.', descEn: 'You divided, built, connected. You did it all.', code: 'DIVIDE-ET-IMPERA', platinum: true },
];

const ACH_KEY = 'achievements_v1';

export class Achievements {
  constructor(options = {}) {
    this.unlocked = this._load();
    this.mode = options.mode || 'achievements'; // 'achievements' | 'cheats'
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

    return `
      <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.6;">
        <p style="font-size: 15px; font-weight: 700; color: var(--accent); margin-bottom: 8px;">
          ${isCheatMode ? '🗝 ' + t('cheats_title') : '🏆 ' + t('ach_title') + ' · ' + unlockedCount + ' / ' + total}
        </p>
        ${isCheatMode ? `<p style="color: var(--fg-dim); font-size: 11px;">${t('cheats_hint')}</p>` : ''}

        <div id="ach-list" style="margin-top: 12px; max-height: 340px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
          ${visible.map((a) => {
            const unlocked = this.isUnlocked(a.id);
            const lang = localStorage.getItem('lang') === 'en' ? 'en' : 'ru';
            const title = lang === 'en' ? (a.titleEn || a.title) : a.title;
            const desc = lang === 'en' ? (a.descEn || a.desc) : a.desc;
            return `
              <div class="ach-item ${unlocked ? 'unlocked' : 'locked'} ${a.platinum ? 'platinum' : ''}">
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
                        padding: 8px 12px; font-family: var(--font-mono); font-size: 12px; border-radius: 4px;
                        text-transform: uppercase;">
          <button class="task-btn" id="code-btn" style="flex: 0 0 auto; padding: 8px 16px;">${t('ach_code_ok')}</button>
        </div>
        <div id="code-result" style="margin-top: 8px; font-size: 11px; min-height: 16px;"></div>
      </div>
    `;
  }

  mount(body) {
    const btn = body.querySelector('#code-btn');
    const input = body.querySelector('#code-input');
    const result = body.querySelector('#code-result');

    btn.onclick = () => this._tryCode(input.value.trim(), result, body);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
    input.addEventListener('input', (e) => {
      const pos = e.target.selectionStart;
      e.target.value = e.target.value.toUpperCase();
      e.target.setSelectionRange(pos, pos);
    });
  }

  _tryCode(code, resultEl, body) {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      resultEl.innerHTML = `<span style="color: var(--warn);">${t('ach_enter_code')}</span>`;
      return;
    }

    const ach = ACHIEVEMENTS.find((a) => a.code === clean);
    if (!ach) {
      resultEl.innerHTML = `<span style="color: var(--error);">${t('ach_unknown')}</span>`;
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
