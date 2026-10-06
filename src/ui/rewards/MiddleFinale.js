import { getLang } from '../../i18n/index.js';

export class MiddleFinale {
  constructor({ onClose } = {}) {
    this.onClose = onClose;
    this.el = null;
  }

  render() {
    const lang = getLang();
    const isEn = lang === 'en';

    return `
      <div class="finale-view">
        <div class="finale-icon">🚀</div>
        <div class="finale-title">
          ${isEn ? 'MIDDLE COMPLETE!' : 'MIDDLE ПРОЙДЕН!'}
        </div>

        <div class="finale-body">
          <p>${isEn
            ? 'You learned to build pipelines. You trained models. You measured quality.'
            : 'Ты научился строить пайплайны. Обучал модели. Измерял качество.'
          }</p>
          <p style="margin-top: 12px;">${isEn
            ? 'But real work is not about clean notebooks. It is about things breaking at 3 AM.'
            : 'Но настоящая работа — не про чистые ноутбуки. Она про то, что ломается в 3 ночи.'
          }</p>
          <p style="margin-top: 12px; color: var(--accent); font-weight: 700;">
            ${isEn
              ? 'Next: SENIOR — where production falls, deadlines burn, and decisions matter more than code.'
              : 'Дальше: SENIOR — где падает прод, горят дедлайны, и решения важнее кода.'
            }
          </p>
        </div>

        <div class="finale-key">🔑</div>
        <div class="finale-key-label">
          ${isEn ? 'KEY TO SENIOR' : 'КЛЮЧ В SENIOR'}
        </div>

        <div class="finale-actions">
          <button class="task-btn task-btn-next" id="finale-senior" style="width: 100%;">
            ${isEn ? '→ Open SENIOR' : '→ Открыть SENIOR'}
          </button>
          <button class="task-btn" id="finale-close" style="width: 100%; margin-top: 8px;">
            ${isEn ? 'Stay in MIDDLE' : 'Остаться в MIDDLE'}
          </button>
        </div>
      </div>
    `;
  }

  mount(body) {
    if (window.__audio) {
      try { window.__audio.success(); } catch (e) {}
    }
    body.querySelector('#finale-senior').onclick = () => {
      if (window.__audio) window.__audio.success();
      if (this.onClose) this.onClose('senior');
    };
    body.querySelector('#finale-close').onclick = () => {
      if (this.onClose) this.onClose();
    };
  }
}
