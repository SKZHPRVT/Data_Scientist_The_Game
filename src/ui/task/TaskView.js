import { progress } from '../../core/progress.js';

export class TaskView {
  constructor(task, { onSolved } = {}) {
    this.task = task;
    this.onSolved = onSolved;
    this.el = null;
    this.startTime = Date.now();
    this.answered = false;
    this.wrongTries = 0;
    this.fileId = this._getFileId();
    this.shuffledOptions = this._shuffleOptions(task.options || []);
  }

  _getFileId() {
    if (this.task._path) {
      return this.task._path.split('/').pop().replace('.json', '');
    }
    return this.task.id;
  }

  _shuffleOptions(options) {
    const seed = this._hashCode(this.fileId);
    const arr = [...options];
    let s = seed;
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280;
      const j = Math.floor((s / 233280) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  _hashCode(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  render() {
    const t = this.task;
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

          <div class="task-options">
            ${this.shuffledOptions.map((opt) => `
              <button class="task-option" data-id="${opt.id}" type="button">
                <div class="task-option-code">${this._esc(opt.code)}</div>
              </button>
            `).join('')}
          </div>

          <div class="task-result" id="task-result"></div>
        </div>
      </div>
    `;
  }

  _esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  _previewDataset() {
    if (window.__df && window.__df.rows) {
      const rows = window.__df.rows.slice(0, 5);
      const cols = window.__df.columns;
      const header = cols.join('  ');
      const lines = rows.map((r) => cols.map((c) => String(r[c] ?? '—')).join('  '));
      return header + '\n' + lines.join('\n') + (window.__df.rows.length > 5 ? '\n...' : '');
    }
    return '(данные загружаются)';
  }

  mount(body) {
    this.el = body.querySelector('.task-view');
    const result = body.querySelector('#task-result');

    body.querySelectorAll('.task-option').forEach((btn) => {
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
      btn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._onPick(btn, result);
      });
    });
  }

  _onPick(btn, resultEl) {
    if (this.answered) return;
    if (btn.disabled) return;

    const optId = btn.dataset.id;
    const opt = (this.task.options || []).find((o) => o.id === optId);
    if (!opt) return;

    if (window.__audio) window.__audio.click('normal');

    if (opt.correct) {
      this.answered = true;
      this._onCorrect(btn, opt, resultEl);
    } else {
      this.wrongTries++;
      this._onWrong(btn, opt, resultEl);
    }
  }

  _onCorrect(btn, opt, resultEl) {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    let stars = 3;
    if (this.wrongTries > 0) stars = Math.max(1, 3 - this.wrongTries);
    if (elapsed > 60) stars = Math.max(1, stars - 1);

    btn.classList.add('correct');
    this.el.querySelectorAll('.task-option').forEach((b) => {
      b.style.pointerEvents = 'none';
      if (b !== btn) b.style.opacity = '0.4';
    });

    progress.markSolved(this.fileId);
    progress.setStars(this.fileId, stars);

    resultEl.innerHTML = `
      <div class="task-result-success">
        <div class="task-result-title">✅ Верно!</div>
        <div class="task-result-stars">${'⭐'.repeat(stars)} · ${elapsed} сек</div>
        <div class="task-result-expl">${opt.explain}</div>
        <button class="task-btn task-btn-next" id="task-next" type="button">Следующий квест →</button>
      </div>
    `;
    if (window.__audio) window.__audio.success();

    setTimeout(() => resultEl.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);

    resultEl.querySelector('#task-next').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.onSolved) this.onSolved(this.fileId, stars);
    });
  }

  _onWrong(btn, opt, resultEl) {
    btn.classList.add('wrong');
    btn.disabled = true;
    if (window.__audio) window.__audio.error();
    resultEl.innerHTML = `
      <div class="task-result-error">
        <div class="task-result-title">❌ Не то</div>
        <div class="task-result-code">${this._esc(opt.code)}</div>
        <div class="task-result-expl">${opt.explain}</div>
        <div class="task-result-hint">Попробуй другой вариант.</div>
      </div>
    `;
    setTimeout(() => resultEl.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
  }
}
