const ACHIEVEMENTS = [
  { id: 'DIVIDE', title: 'Разделяй и понимай', desc: 'Ты разделил данные на train и test.', code: 'DIVIDE' },
  { id: 'CLEAN', title: 'Чистюля', desc: 'Удалил дубликаты и не потерял важное.', code: 'CLEAN' },
  { id: 'FILTER', title: 'Первое знамение', desc: 'Отсеял шум и увидел сигнал.', code: 'FILTER' },
  { id: 'FEATURES', title: 'Архитектор признаков', desc: 'Из 200 признаков оставил 10.', code: 'FEATURES' },
  { id: 'CONNECT', title: 'Связующий', desc: 'Нашёл зависимости там, где видели случайность.', code: 'CONNECT' },
  { id: 'MODEL', title: 'Обучил — сохранил', desc: 'pickle.dump() — модель готова.', code: 'MODEL' },
  { id: 'SIGNAL', title: 'Хранитель Сигнала', desc: 'Финальная ачивка.', code: 'SIGNAL' },
  { id: 'NAN', title: 'NaN-невидимка', desc: 'Пропустил 30% данных — и победил.', code: 'NAN' },
  { id: 'OVERFIT', title: 'Идеальный на трейне', desc: 'Модель знала ответы наизусть.', code: 'OVERFIT' },
  { id: 'ILLUMINATI', title: 'Тот, кто читает описания', desc: 'Ты нашёл то, чего не должно было быть. 👁', code: 'ILLUMINATI', secret: true },
  { id: 'DIVIDE-ET-IMPERA', title: 'Магистр Сигнала', desc: 'Ты разделил, выстроил, связал.', code: 'DIVIDE-ET-IMPERA', platinum: true },
];

export class Achievements {
  constructor() {
    this.unlocked = JSON.parse(localStorage.getItem('achievements') || '[]');
  }

  render() {
    return `
      <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.6;">
        <p><strong>🏆 АЧИВКИ</strong></p>
        <div id="ach-list" style="margin-top: 12px; max-height: 280px; overflow-y: auto;">
          ${ACHIEVEMENTS.filter((a) => !a.secret || this.unlocked.includes(a.id)).map((a) => `
            <div style="padding: 8px; border-left: 3px solid ${this.unlocked.includes(a.id) ? 'var(--accent)' : 'var(--border)'};
                        margin-bottom: 6px; opacity: ${this.unlocked.includes(a.id) ? 1 : 0.4};">
              <div><strong>${this.unlocked.includes(a.id) ? '✅' : '🔒'} ${a.title}</strong></div>
              <div style="color: var(--fg-dim); font-size: 11px;">${a.desc}</div>
            </div>
          `).join('')}
        </div>

        <p style="margin-top: 16px;">🗝 Чит-код:</p>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <input type="text" id="code-input" placeholder="Введи код..."
                 style="flex: 1; background: transparent; border: 1px solid var(--fg-dim); color: var(--fg);
                        padding: 6px 10px; font-family: var(--font-mono); font-size: 12px; border-radius: 4px;">
          <button class="taskbar-btn active" id="code-btn">OK</button>
        </div>
        <div id="code-result" style="margin-top: 8px; font-size: 11px;"></div>
      </div>
    `;
  }

  mount(body) {
    const btn = body.querySelector('#code-btn');
    const input = body.querySelector('#code-input');
    const result = body.querySelector('#code-result');

    btn.onclick = () => this._tryCode(input.value.trim().toUpperCase(), result);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
  }

  _tryCode(code, resultEl) {
    const ach = ACHIEVEMENTS.find((a) => a.code === code);
    if (!ach) {
      resultEl.innerHTML = '<span style="color: var(--error);">Неизвестный код.</span>';
      return;
    }
    if (this.unlocked.includes(ach.id)) {
      resultEl.innerHTML = '<span style="color: var(--warn);">Уже разблокировано.</span>';
      return;
    }
    this.unlocked.push(ach.id);
    localStorage.setItem('achievements', JSON.stringify(this.unlocked));
    resultEl.innerHTML = `<span style="color: var(--accent);">✅ ${ach.title} — ${ach.desc}</span>`;
    setTimeout(() => location.reload(), 1500);
  }
}
