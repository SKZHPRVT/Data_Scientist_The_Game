import { evaluate } from '../../core/interpreter.js';
import { COMMANDS } from '../../core/commands.js';
import { VirtualDF } from '../../core/virtualdf.js';

export class TaskView {
  constructor(task, { onSolved } = {}) {
    this.task = task;
    this.onSolved = onSolved;
    this.el = null;
    this.attempts = 0;
    this.startTime = Date.now();
  }

  render() {
    const t = this.task;

    // Все команды мира junior (или те, что разрешены в задаче)
    const availableCommands = t.commands
      ? t.commands.map((id) => COMMANDS[id]).filter(Boolean)
      : Object.entries(COMMANDS)
          .filter(([_, c]) => c.world === 'junior')
          .map(([id, c]) => ({ ...c, id }));

    return `
      <div class="task-view">
        <div class="task-header">
          <div class="task-title">${t.title || t.id}</div>
          <div class="task-meta">${t.world || 'junior'} · уровень ${t.level || 1}</div>
        </div>

        <div class="task-body">
          <div class="task-question">${t.question}</div>

          ${t.dataset ? `
            <div class="task-dataset">
              <div class="task-dataset-title">📊 ${t.dataset}</div>
              <pre class="task-dataset-preview">${this._previewDataset()}</pre>
            </div>
          ` : ''}

          <div class="task-commands">
            <div class="task-commands-label">Доступные команды (тапни, чтобы вставить):</div>
            <div class="task-commands-list">
              ${availableCommands.map((c) => {
                const short = (c.signature || '').match(/[a-z_]+\(/i)?.[0]?.replace('(', '') || c.signature;
                return `<button class="task-cmd" data-cmd="${short}">${c.signature || c.id}</button>`;
              }).join('')}
            </div>
          </div>

          <div class="task-input-wrapper">
            <span class="task-input-prompt">$ </span>
            <input type="text" class="task-input" id="task-input"
              placeholder="Напиши решение или тапни команду..." autocomplete="off"
              autocorrect="off" autocapitalize="off" spellcheck="false">
          </div>

          <div class="task-actions">
            <button class="task-btn task-btn-hint" id="task-hint">💡 Подсказка</button>
            <button class="task-btn task-btn-check" id="task-check">✓ Проверить</button>
          </div>

          <div class="task-result" id="task-result"></div>
        </div>
      </div>
    `;
  }

  _previewDataset() {
    if (window.__df && window.__df.rows) {
      const rows = window.__df.rows.slice(0, 5);
      const cols = window.__df.columns;
      const header = cols.join('  ');
      const lines = rows.map((r) => cols.map((c) => String(r[c] ?? '—')).join('  '));
      return header + '\n' + lines.join('\n') +
             (window.__df.rows.length > 5 ? '\n...' : '');
    }
    return '(данные загружаются)';
  }

  mount(body) {
    this.el = body.querySelector('.task-view');
    const input = body.querySelector('#task-input');
    const result = body.querySelector('#task-result');

    setTimeout(() => input?.focus(), 200);

    input.addEventListener('keydown', (e) => {
      if (window.__audio) {
        if (e.key === 'Enter') window.__audio.key('enter');
        else if (e.key === 'Backspace') window.__audio.key('backspace');
        else if (e.key === ' ') window.__audio.key('space');
        else if (e.key.length === 1) window.__audio.key('normal');
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        this._check(result);
      }
    });

    body.querySelectorAll('.task-cmd').forEach((btn) => {
      btn.onclick = () => {
        const cmd = btn.dataset.cmd;
        const val = input.value;
        // Умная вставка
        if (!val || val.endsWith('(')) {
          input.value = val + cmd;
        } else if (val.endsWith(')')) {
          input.value = val + '.' + cmd;
        } else {
          input.value = val + cmd;
        }
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        if (window.__audio) window.__audio.click('normal');
      };
    });

    body.querySelector('#task-hint').onclick = () => {
      const hint = this.task.hint || this.task.explanation || 'Внимательно прочитай вопрос.';
      result.innerHTML = `<div class="task-result-hint">💡 ${hint}</div>`;
      if (window.__audio) window.__audio.notify();
    };

    body.querySelector('#task-check').onclick = () => this._check(result);
  }

  _check(resultEl) {
    const input = this.el.querySelector('#task-input');
    const code = input.value.trim();

    if (!code) {
      resultEl.innerHTML = '<div class="task-result-error">Введи решение.</div>';
      if (window.__audio) window.__audio.error();
      return;
    }

    this.attempts++;
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);

    try {
      const userResult = evaluate(code, { df: window.__df });
      const task = this.task;

      let ok = false;
      let expected = null;

      if (Array.isArray(task.expectedShape)) {
        expected = task.expectedShape;
        ok = Array.isArray(userResult) &&
             userResult[0] === expected[0] &&
             userResult[1] === expected[1];
      } else if (task.expected !== undefined) {
        expected = task.expected;
        ok = this._compare(userResult, expected);
      } else if (task.validation) {
        // validation — функция-строка: например "r => r[0]===9 && r[1]===3"
        try {
          const validator = eval(task.validation);
          ok = validator(userResult);
          expected = task.expectedShape || task.expected || 'как в задаче';
        } catch (e) { ok = false; }
      } else {
        ok = true;
      }

      if (ok) this._onSuccess(resultEl, userResult, elapsed);
      else this._onFail(resultEl, userResult, expected, code);
    } catch (e) {
      resultEl.innerHTML = `
        <div class="task-result-error">
          <div>❌ Ошибка выполнения</div>
          <div class="task-result-detail">${e.message}</div>
          <div class="task-result-hint">Проверь синтаксис. Помощь: <code>read_csv('sales.csv').shape</code></div>
        </div>
      `;
      if (window.__audio) window.__audio.error();
    }
  }

  _compare(user, expected) {
    if (typeof expected === 'number' && typeof user === 'number') {
      return Math.abs(user - expected) < 1e-6;
    }
    if (Array.isArray(expected) && Array.isArray(user)) {
      return JSON.stringify(user) === JSON.stringify(expected);
    }
    if (expected instanceof VirtualDF && user instanceof VirtualDF) {
      return user.equals(expected);
    }
    return user === expected;
  }

  _onSuccess(resultEl, userResult, elapsed) {
    const stars = elapsed < 20 ? 3 : elapsed < 40 ? 2 : 1;
    const starsStr = '⭐'.repeat(stars);

    // Объяснение успеха — кастомное или дефолт
    const right = this.task.explanationRight
      || this.task.explanation
      || 'Верно. Ты применил подходящую команду.';

    resultEl.innerHTML = `
      <div class="task-result-success">
        <div>✅ Верно!</div>
        <div class="task-result-detail">Результат: ${this._fmt(userResult)}</div>
        <div class="task-result-stars">${starsStr} · ${elapsed} сек</div>
        <div class="task-result-expl">
          <strong>Почему правильно:</strong> ${right}
        </div>
        <button class="task-btn task-btn-next" id="task-next">Следующая задача →</button>
      </div>
    `;

    if (window.__audio) window.__audio.success();
    this._saveProgress(stars);

    const nextBtn = resultEl.querySelector('#task-next');
    if (nextBtn) {
      nextBtn.onclick = () => {
        if (this.onSolved) this.onSolved(this.task.id, stars);
      };
    }
  }

  _onFail(resultEl, userResult, expected, code) {
    // Ищем объяснение для конкретной команды/выражения
    const wrongMap = this.task.explanationWrong || {};
    let why = '';

    // Пробуем найти по названию команды, которую ввёл игрок
    for (const [key, text] of Object.entries(wrongMap)) {
      if (code.includes(key)) {
        why = text;
        break;
      }
    }

    if (!why) {
      why = this.task.explanationWrongDefault
        || 'Результат не совпал с ожидаемым. Проверь, что команда делает и какие данные возвращает.';
    }

    resultEl.innerHTML = `
      <div class="task-result-error">
        <div>❌ Не то</div>
        <div class="task-result-detail">
          Твой результат: ${this._fmt(userResult)}<br>
          ${expected !== null ? `Ожидалось: ${this._fmt(expected)}` : ''}
        </div>
        <div class="task-result-expl">
          <strong>Почему неправильно:</strong> ${why}
        </div>
        <div class="task-result-hint">Попытка ${this.attempts}. Попробуй ещё раз или нажми «Подсказка».</div>
      </div>
    `;
    if (window.__audio) window.__audio.error();
  }

  _fmt(v) {
    if (v === null || v === undefined) return '—';
    if (v instanceof VirtualDF) {
      const j = v.toJSON();
      return `DataFrame(${j.rows.length} × ${j.columns.length})`;
    }
    if (Array.isArray(v)) return JSON.stringify(v);
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }

  _saveProgress(stars) {
    const id = this.task.id;
    const best = +localStorage.getItem(`task_${id}_stars`) || 0;
    if (stars > best) localStorage.setItem(`task_${id}_stars`, stars);
    const solved = JSON.parse(localStorage.getItem('tasks_solved') || '[]');
    if (!solved.includes(id)) solved.push(id);
    localStorage.setItem('tasks_solved', JSON.stringify(solved));
  }
}
