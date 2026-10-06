import { getLang } from '../../i18n/index.js';

export class JuniorFinale {
  constructor({ onStartMiddle }) {
    this.onStartMiddle = onStartMiddle;
  }

  render() {
    const lang = getLang();
    const isEn = lang === 'en';

    return `
      <div class="finale-view">
        <div class="finale-icon">🎉</div>
        <div class="finale-title">${isEn ? 'JUNIOR COMPLETE!' : 'JUNIOR ПРОЙДЕН!'}</div>

        <div class="finale-body">
          <p>${isEn
            ? 'You mastered the basics of pandas. From reading CSV to grouping and merging.'
            : 'Ты освоил основы pandas. От чтения CSV до группировки и соединения таблиц.'
          }</p>
          <p style="margin-top: 12px;">${isEn
            ? 'But this is just the beginning. Real data is messy. Real models overfit. Real projects fail.'
            : 'Но это только начало. Реальные данные грязные. Модели переобучаются. Проекты падают.'
          }</p>
          <p style="margin-top: 12px; color: var(--accent); font-weight: 700;">
            ${isEn
              ? 'Next: MIDDLE — where you learn to build pipelines and train models.'
              : 'Дальше: MIDDLE — где ты научишься строить пайплайны и обучать модели.'
            }
          </p>
        </div>

        <div class="finale-key">🔑</div>
        <div class="finale-key-label">${isEn ? 'KEY TO MIDDLE' : 'КЛЮЧ В MIDDLE'}</div>

        <div class="finale-actions">
          <button class="task-btn task-btn-next" id="finale-middle" style="width: 100%;">
            ${isEn ? '→ Open MIDDLE' : '→ Открыть MIDDLE'}
          </button>
          <button class="task-btn" id="finale-close" style="width: 100%; margin-top: 8px;">
            ${isEn ? 'Stay in JUNIOR' : 'Остаться в JUNIOR'}
          </button>
        </div>
      </div>
    `;
  }

  mount(body) {
    body.querySelector('#finale-middle').onclick = () => {
      if (window.__audio) window.__audio.success();
      if (this.onStartMiddle) this.onStartMiddle();
    };
    body.querySelector('#finale-close').onclick = () => {
      const win = body.closest('.window');
      if (win) win.remove();
    };
  }
}
