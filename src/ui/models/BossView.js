// Финальный босс лаборатории — 5 раундов, выбор правильной модели
import { progress } from '../../core/progress.js';

export class BossView {
  constructor(bossData, { onComplete } = {}) {
    this.boss = bossData;
    this.onComplete = onComplete;
    this.round = 0;              // текущий раунд (0..4)
    this.correctCount = 0;       // сколько правильно
    this.history = [];           // ответы игрока
    this.finished = false;
  }

  render() {
    if (this.finished) {
      return this._renderFinal();
    }
    return this._renderRound();
  }

  // === ЭКРАН РАУНДА ===
  _renderRound() {
    const r = this.boss.rounds[this.round];
    const total = this.boss.rounds.length;

    // Все варианты моделей — берём из глобального списка
    const options = this._getOptions(r.correct);

    return `
      <div class="quest-map" style="padding: 16px;">
        <div style="font-family: var(--font-mono); margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong>👁 ${this.boss.title}</strong>
            <span class="terminal-warn">Раунд ${this.round + 1} / ${total}</span>
          </div>
          <div class="quest-map-bar" style="height: 6px;">
            <div class="quest-map-bar-fill" style="width: ${((this.round) / total) * 100}%"></div>
          </div>
        </div>

        <div style="font-family: var(--font-mono); font-size: 12px; color: var(--fg-dim); margin-bottom: 8px;">
          ${this.round === 0 ? this.boss.story : ''}
        </div>

        <div style="font-family: var(--font-mono); padding: 12px; background: rgba(0,255,65,0.05); border-left: 3px solid var(--accent); margin-bottom: 12px; font-size: 12px; line-height: 1.6;">
          <div><strong>📊 ${r.dataset}</strong></div>
          <div>Задача: ${r.task}</div>
          <div>Строк: ${r.rows}</div>
          <div>Признаков: ${r.features}</div>
          <div style="color: var(--fg-dim); margin-top: 4px;">${r.notes}</div>
        </div>

        <div style="font-family: var(--font-mono); font-size: 13px; margin-bottom: 12px;">
          <strong>Какую модель выберешь?</strong>
        </div>

        <div id="boss-options" style="font-family: var(--font-mono);">
          ${options.map((opt) => `
            <div class="boss-option" data-id="${opt}" style="padding: 10px; border: 1px solid var(--fg-dim); border-radius: 4px; margin-bottom: 8px; cursor: pointer; font-size: 12px;">
              ${opt}
            </div>
          `).join('')}
        </div>

        <div id="boss-result" style="margin-top: 16px;"></div>
      </div>
    `;
  }

  _getOptions(correct) {
    // Собираем 4 варианта: правильный + 3 из других раундов
    const all = this.boss.rounds.map((r) => r.correct);
    const others = all.filter((m) => m !== correct);
    // Уникальные
    const unique = [...new Set(others)];
    // Первые 3 уникальных + правильный
    const picked = unique.slice(0, 3);
    const opts = [correct, ...picked];
    // Перемешиваем (стабильно от раунда)
    const seed = this.round * 7919;
    return opts.sort((a, b) => {
      const ha = this._hash(a + seed);
      const hb = this._hash(b + seed);
      return ha - hb;
    });
  }

  _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  // === ЭКРАН ФИНАЛА ===
  _renderFinal() {
    const total = this.boss.rounds.length;
    const perfect = this.correctCount === total;

    return `
      <div class="quest-map" style="padding: 24px; text-align: center; font-family: var(--font-mono);">
        <div style="font-size: 48px; margin-bottom: 16px;">${perfect ? '👑' : '👁'}</div>
        <div style="font-size: 18px; margin-bottom: 12px;">
          ${perfect ? 'МАГИСТР МОДЕЛЕЙ' : 'ИСПЫТАНИЕ ПРОЙДЕНО'}
        </div>
        <div style="color: var(--fg-dim); margin-bottom: 24px;">
          ${this.correctCount} / ${total} правильных ответов
        </div>

        <div style="padding: 16px; background: rgba(0,255,65,0.05); border-left: 3px solid var(--accent); text-align: left; margin-bottom: 24px; font-size: 12px; line-height: 1.7;">
          ${perfect
            ? 'Ты выбрал правильную модель для каждого датасета. Куратор доволен.<br><br>' +
              '<em>Divide et Intellige. Noise → Signal.</em>'
            : 'Ты прошёл испытание. Но не идеально. Куратор качает головой.<br><br>' +
              '<em>Попробуй ещё раз, если хочешь звание Магистра.</em>'
          }
        </div>

        <div style="color: var(--fg-dim); font-size: 11px; margin-bottom: 16px;">
          Награда: ${this.boss.reward.xp} XP${perfect ? ' · Ачивка: «' + this.boss.reward.achievement + '»' : ''}
        </div>

        <button class="taskbar-btn active" id="boss-close" style="padding: 10px 24px; font-size: 14px;">[ ЗАКРЫТЬ ]</button>
      </div>
    `;
  }

  mount(body) {
    if (this.finished) {
      const closeBtn = body.querySelector('#boss-close');
      if (closeBtn) {
        closeBtn.onclick = () => {
          if (this.onComplete) this.onComplete(this.correctCount, this.boss.rounds.length);
        };
      }
      return;
    }

    const options = body.querySelectorAll('.boss-option');
    const result = body.querySelector('#boss-result');
    const currentRound = this.boss.rounds[this.round];

    options.forEach((el) => {
      el.onclick = () => {
        if (el.style.pointerEvents === 'none') return;

        const picked = el.dataset.id;
        const correct = picked === currentRound.correct;

        // Блокируем все
        options.forEach((opt) => {
          opt.style.pointerEvents = 'none';
          if (opt.dataset.id === currentRound.correct) {
            opt.style.borderColor = 'var(--accent)';
            opt.style.background = 'rgba(0,255,65,0.1)';
          } else if (opt.dataset.id === picked && !correct) {
            opt.style.borderColor = 'var(--error)';
            opt.style.background = 'rgba(255,51,51,0.1)';
          }
        });

        if (correct) this.correctCount++;
        this.history.push({ round: this.round, picked, correct });

        if (window.__audio) {
          if (correct) window.__audio.success();
          else window.__audio.error();
        }

        result.innerHTML = `
          <div style="font-family: var(--font-mono); padding: 12px; background: ${correct ? 'rgba(0,255,65,0.05)' : 'rgba(255,51,51,0.05)'}; border-left: 3px solid ${correct ? 'var(--accent)' : 'var(--error)'}; margin-bottom: 12px; font-size: 12px; line-height: 1.6;">
            <div style="margin-bottom: 6px;">${correct ? '✅ Верно' : '❌ Неверно'}</div>
            <div>${currentRound.why}</div>
          </div>
          <button class="taskbar-btn active" id="boss-next" style="padding: 8px 20px;">
            ${this.round + 1 < this.boss.rounds.length ? '[ ДАЛЕЕ → ]' : '[ ЗАВЕРШИТЬ ]'}
          </button>
        `;

        const nextBtn = result.querySelector('#boss-next');
        nextBtn.onclick = () => {
          this.round++;
          if (this.round >= this.boss.rounds.length) {
            this.finished = true;
            // Отмечаем босса как пройденного
            progress.markSolved('models/BOSS_final');
            if (this.correctCount === this.boss.rounds.length) {
              progress.setStars('models/BOSS_final', 4);
            }
          } else {
            progress.markSolved('models/BOSS_final');
          }
          // Перерисовываем окно
          const windowBody = body.closest('.window-body');
          if (windowBody) {
            windowBody.innerHTML = this.render();
            this.mount(windowBody);
          }
        };
      };
    });
  }
}
