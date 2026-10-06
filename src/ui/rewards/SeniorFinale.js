import { getLang } from '../../i18n/index.js';

export class SeniorFinale {
  constructor({ onClose } = {}) {
    this.onClose = onClose;
  }

  render() {
    const lang = getLang();
    const isEn = lang === 'en';

    return `
      <div class="senior-finale">
        <div class="finale-eyes">👁</div>
        <div class="finale-crown-big">👑</div>

        <div class="finale-main-title">
          ${isEn ? 'MASTER OF SIGNAL' : 'МАГИСТР СИГНАЛА'}
        </div>

        <div class="finale-divider">═══════════════════════════</div>

        <div class="finale-body">
          <p style="font-size: 15px; color: var(--accent); font-weight: 700; text-align: center;">
            Divide et Impera
          </p>
          <p style="text-align: center; color: var(--fg-dim); font-size: 11px; margin-top: 2px;">
            ${isEn ? 'Noise → Signal' : 'Шум → Сигнал'}
          </p>

          <p style="margin-top: 20px;">
            ${isEn
              ? 'You walked the path from noise to signal.'
              : 'Ты прошёл путь от шума к сигналу.'
            }
          </p>

          <p style="margin-top: 12px;">
            ${isEn
              ? 'You divided the chaos. Built the structure. Connected what seemed unconnected.'
              : 'Ты разделил хаос. Выстроил структуру. Связал несвязуемое.'
            }
          </p>

          <p style="margin-top: 12px;">
            ${isEn
              ? 'From junior who read CSV — to senior who designs systems.'
              : 'От джуна, который читал CSV, — до сеньора, который проектирует системы.'
            }
          </p>

          <p style="margin-top: 20px; color: var(--warn); font-weight: 700;">
            ${isEn
              ? 'Now you see what is hidden from the profane.'
              : 'Теперь ты видишь то, что скрыто от профанов.'
            }
          </p>

          <p style="margin-top: 16px; font-style: italic; color: var(--fg-dim);">
            ${isEn
              ? '"There, where a layman sees chaos, a data scientist sees structure."'
              : '«Там, где профан видит хаос, Data Scientist видит структуру.»'
            }
          </p>
        </div>

        <div class="finale-divider">═══════════════════════════</div>

        <div class="finale-achievements">
          <p style="color: var(--accent); font-weight: 700; text-align: center; margin-bottom: 12px;">
            ${isEn ? 'Your achievements:' : 'Твои достижения:'}
          </p>
          <div style="text-align: center; font-size: 13px; line-height: 1.8;">
            🎯 JUNIOR · ✅<br>
            🚀 MIDDLE · ✅<br>
            👑 SENIOR · ✅
          </div>
        </div>

        <div style="margin-top: 24px; width: 100%;">
          <button class="task-btn task-btn-next" id="finale-close" style="width: 100%;">
            ${isEn ? '→ Continue' : '→ Продолжить'}
          </button>
        </div>

        <p style="margin-top: 16px; font-size: 10px; color: var(--fg-dim); text-align: center;">
          ${isEn
            ? 'This is not the end. This is the beginning.'
            : 'Это не конец. Это начало.'
          }
        </p>
      </div>
    `;
  }

  mount(body) {
    if (window.__audio) {
      try { window.__audio.success(); } catch (e) {}
    }
    const btn = body.querySelector('#finale-close');
    if (btn) {
      btn.onclick = () => {
        if (this.onClose) this.onClose();
      };
    }
  }
}
