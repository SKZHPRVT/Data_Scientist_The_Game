// Экран итогов сессии
export class SessionSummaryView {
  constructor(progress, typeMeta, { onNextSession, onBack } = {}) {
    this.progress = progress;
    this.typeMeta = typeMeta;
    this.onNextSession = onNextSession;
    this.onBack = onBack;
  }

  render() {
    const p = this.progress;
    const percent = Math.round((p.correct / p.max) * 100);
    const perfect = p.correct === p.max;

    return `
      <div class="quest-map" style="padding: 24px; font-family: var(--font-mono); text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">${perfect ? '🏆' : '📊'}</div>
        <div style="font-size: 18px; color: var(--accent); margin-bottom: 8px;">
          ${this.typeMeta.icon} СЕССИЯ ЗАВЕРШЕНА
        </div>
        <div style="font-size: 12px; color: var(--fg-dim); margin-bottom: 24px;">
          ${this.typeMeta.name}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; text-align: left;">
          <div style="padding: 12px; background: rgba(0,255,65,0.05); border-left: 3px solid var(--accent);">
            <div style="font-size: 11px; color: var(--fg-dim);">Правильно</div>
            <div style="font-size: 20px; color: var(--accent);">${p.correct} / ${p.max}</div>
          </div>
          <div style="padding: 12px; background: rgba(0,255,65,0.05); border-left: 3px solid var(--accent);">
            <div style="font-size: 11px; color: var(--fg-dim);">Точность</div>
            <div style="font-size: 20px; color: var(--accent);">${percent}%</div>
          </div>
          <div style="padding: 12px; background: rgba(0,255,65,0.05); border-left: 3px solid var(--accent);">
            <div style="font-size: 11px; color: var(--fg-dim);">Звёзд</div>
            <div style="font-size: 20px; color: var(--warn);">⭐ ${p.stars} / ${p.maxStars}</div>
          </div>
          <div style="padding: 12px; background: rgba(0,255,65,0.05); border-left: 3px solid var(--accent);">
            <div style="font-size: 11px; color: var(--fg-dim);">Оценка</div>
            <div style="font-size: 20px;">${perfect ? '🏆' : percent >= 70 ? '🥈' : percent >= 40 ? '🥉' : '📉'}</div>
          </div>
        </div>

        <div style="display: flex; gap: 8px; justify-content: center;">
          <button class="taskbar-btn active" id="sess-next" style="padding: 12px 20px;">[ ЕЩЁ СЕССИЮ ]</button>
          <button class="taskbar-btn" id="sess-back" style="padding: 12px 20px;">[ К КАРТЕ ]</button>
        </div>
      </div>
    `;
  }

  mount(body) {
    const nextBtn = body.querySelector('#sess-next');
    const backBtn = body.querySelector('#sess-back');

    if (nextBtn) nextBtn.onclick = () => {
      if (this.onNextSession) this.onNextSession();
    };
    if (backBtn) backBtn.onclick = () => {
      if (this.onBack) this.onBack();
    };
  }
}
