import { progress } from '../../core/progress.js';

// ============================================
// СПИСОК АЧИВОК
// ============================================
const ACHIEVEMENTS = [
  // === Основные (открываются по чит-коду) ===
  { id: 'DIVIDE', title: 'Разделяй и понимай', icon: '⚖️', desc: 'Ты разделил данные на train и test. И не подглядывал.', code: 'DIVIDE' },
  { id: 'CLEAN', title: 'Чистюля', icon: '🧼', desc: 'Удалил дубликаты, заполнил пропуски, не потерял важное.', code: 'CLEAN' },
  { id: 'FILTER', title: 'Первое знамение', icon: '🔍', desc: 'Отсеял шум и увидел сигнал.', code: 'FILTER' },
  { id: 'FEATURES', title: 'Архитектор признаков', icon: '🏗️', desc: 'Из 200 признаков оставил 10 решающих.', code: 'FEATURES' },
  { id: 'CONNECT', title: 'Связующий', icon: '🔗', desc: 'Нашёл зависимости там, где другие видели случайность.', code: 'CONNECT' },
  { id: 'MODEL', title: 'Обучил — сохранил', icon: '💾', desc: 'pickle.dump() — модель готова к бою.', code: 'MODEL' },
  { id: 'SIGNAL', title: 'Хранитель Сигнала', icon: '📡', desc: 'Финальная ачивка. Ты прошёл путь от шума до смысла.', code: 'SIGNAL' },

  // === Юмористические (секретные) ===
  { id: 'NAN', title: 'NaN-невидимка', icon: '👻', desc: 'Пропустил 30% данных — и всё равно победил.', code: 'NAN', secret: true },
  { id: 'OVERFIT', title: 'Идеальный на трейне', icon: '📉', desc: 'Модель знала ответы наизусть. Реальный мир её сломал.', code: 'OVERFIT', secret: true },
  { id: 'PANIC', title: 'Stack Overflow', icon: '🚨', desc: 'Не знал что делать — и пошёл гуглить. Это тоже навык.', code: 'PANIC', secret: true },
  { id: 'TITANIC', title: 'Классика жанра', icon: '🚢', desc: 'Обучил модель на датасете Титаника. Как и все. Добро пожаловать в клуб.', code: 'TITANIC', secret: true },
  { id: 'COFFEE', title: 'Ночной дожор', icon: '☕', desc: 'Чистил данные до 3 ночи. Датасет не оценил.', code: 'COFFEE', secret: true },

  // === Секретная ===
  { id: 'ILLUMINATI', title: 'Тот, кто читает описания', icon: '👁', desc: 'Нашёл то, чего не должно было быть. Око видит тебя.', code: 'ILLUMINATI', secret: true },

  // === Платиновая ===
  { id: 'DIVIDE_ET_IMPERA', title: 'Магистр Сигнала', icon: '🏆', desc: 'Ты разделил, выстроил, связал. Ты прошёл путь целиком.', code: 'DIVIDE-ET-IMPERA', platinum: true },
];

const ACH_KEY = 'achievements_v1';

export class Achievements {
  constructor() {
    this.unlocked = this._load();
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
    const visible = ACHIEVEMENTS.filter((a) => !a.secret || this.isUnlocked(a.id));
    const total = ACHIEVEMENTS.length;
    const unlockedCount = this.unlocked.length;

    return `
      <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.6;">
        <p style="font-size: 15px; font-weight: 700; color: var(--accent); margin-bottom: 8px;">
          🏆 АЧИВКИ · ${unlockedCount} / ${total}
        </p>

        <div id="ach-list" style="margin-top: 12px; max-height: 340px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
          ${visible.map((a) => {
            const unlocked = this.isUnlocked(a.id);
            return `
              <div class="ach-item ${unlocked ? 'unlocked' : 'locked'} ${a.platinum ? 'platinum' : ''}">
                <div class="ach-icon">${unlocked ? a.icon : '🔒'}</div>
                <div class="ach-body">
                  <div class="ach-title">${a.title}</div>
                  <div class="ach-desc">${unlocked ? a.desc : 'Заблокировано'}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <p style="margin-top: 16px;">🗝 Чит-код:</p>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <input type="text" id="code-input" placeholder="Введи код..."
                 style="flex: 1; background: transparent; border: 1px solid var(--fg-dim); color: var(--fg);
                        padding: 8px 12px; font-family: var(--font-mono); font-size: 12px; border-radius: 4px;
                        text-transform: uppercase;">
          <button class="task-btn" id="code-btn" style="flex: 0 0 auto; padding: 8px 16px;">OK</button>
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
    input.addEventListener('keyup', (e) => {
      // Автоматически подставляем в верхний регистр
      const pos = e.target.selectionStart;
      e.target.value = e.target.value.toUpperCase();
      e.target.setSelectionRange(pos, pos);
    });
  }

  _tryCode(code, resultEl, body) {
    const clean = code.trim().toUpperCase();
    if (!clean) {
      resultEl.innerHTML = '<span style="color: var(--warn);">Введи код.</span>';
      return;
    }

    const ach = ACHIEVEMENTS.find((a) => a.code === clean);
    if (!ach) {
      resultEl.innerHTML = '<span style="color: var(--error);">Неизвестный код.</span>';
      if (window.__audio) window.__audio.error();
      return;
    }
    if (this.isUnlocked(ach.id)) {
      resultEl.innerHTML = '<span style="color: var(--warn);">Уже разблокировано.</span>';
      return;
    }

    this.unlock(ach.id);
    if (window.__audio) window.__audio.success();
    resultEl.innerHTML = `<span style="color: var(--accent);">✅ ${ach.title} — ${ach.desc}</span>`;

    // Обновляем список ачивок
    setTimeout(() => {
      const win = body.closest('.window');
      if (win) {
        const bodyEl = win.querySelector('.window-body');
        if (bodyEl) {
          bodyEl.innerHTML = this.render();
          this.mount(bodyEl);
        }
      }
    }, 800);
  }
}
