// CodeView — задача с редактором кода (CodeMirror)
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { progress } from '../../core/progress.js';
import { t } from '../../i18n/index.js';

export class CodeView {
  constructor(task, { onSolved } = {}) {
    this.task = task;
    this.onSolved = onSolved;
    this.el = null;
    this.editor = null;
    this.answered = false;
    this.wrongTries = 0;
    this.fileId = this._computeFileId();
  }

  _computeFileId() {
    if (this.task._path) return progress.makeId(this.task._path);
    return this.task.id;
  }

  _calculateStars() {
    return Math.max(1, 4 - this.wrongTries);
  }

  render() {
    const t2 = this.task;
    return `
      <div class="task-view">
        <div class="task-header">
          <div class="task-title">${t2.title || 'Код'}</div>
          <div class="task-meta">${t2.world || 'plots'} · код</div>
        </div>

        <div class="task-body">
          ${t2.story ? `
            <div style="padding: 10px 12px; background: rgba(0,255,65,0.05); border-left: 3px solid var(--accent); margin-bottom: 12px; font-family: var(--font-mono); font-size: 12px; line-height: 1.5;">
              ${t2.story}
            </div>
          ` : ''}

          ${t2.dataset ? `
            <div class="task-dataset">
              <div class="task-dataset-title">📊 ${t2.dataset}</div>
              <pre class="task-dataset-preview">${this._previewDataset()}</pre>
            </div>
          ` : ''}

          <div class="task-question">${t2.question}</div>

          ${t2.requirements ? `
            <div style="margin: 12px 0; padding: 10px 12px; background: rgba(0,204,255,0.05); border-left: 3px solid #00ccff; font-family: var(--font-mono); font-size: 11px; line-height: 1.7;">
              <strong>Требования:</strong><br>
              ${t2.requirements.map((r) => `• ${r}`).join('<br>')}
            </div>
          ` : ''}

          <div class="task-code-editor" id="code-editor" style="margin-bottom: 12px; border: 1px solid var(--fg-dim); border-radius: 4px; overflow: hidden; min-height: 120px;"></div>

          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <button class="task-btn task-btn-check" id="code-check" type="button" style="flex: 1;">[ ПРОВЕРИТЬ ]</button>
            <button class="task-btn" id="code-hint" type="button" style="flex: 0 0 auto;">[ 💡 ]</button>
          </div>

          <div class="task-result" id="code-result"></div>
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
      return header + '\n' + lines.join('\n') + (window.__df.rows.length > 5 ? '\n...' : '');
    }
    return '(данные загружаются)';
  }

  mount(body) {
    this.el = body.querySelector('.task-view');
    const editorEl = body.querySelector('#code-editor');
    const result = body.querySelector('#code-result');
    const checkBtn = body.querySelector('#code-check');
    const hintBtn = body.querySelector('#code-hint');

    // CodeMirror
    this.editor = new EditorView({
      state: EditorState.create({
        doc: this.task.starterCode || '',
        extensions: [
          basicSetup,
          python(),
          oneDark,
          EditorView.theme({
            '&': { fontSize: '12px', fontFamily: 'var(--font-mono)' },
            '.cm-content': { padding: '8px 0', minHeight: '100px' },
            '.cm-gutters': { background: 'rgba(0,255,65,0.03)', border: 'none' },
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) this._code = update.state.doc.toString();
          }),
        ],
      }),
      parent: editorEl,
    });
    this._code = this.task.starterCode || '';

    checkBtn.onclick = () => this._check(result);
    hintBtn.onclick = () => this._showHint(result);

    // Ctrl/Cmd+Enter — проверить
    editorEl.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this._check(result);
      }
    });
  }

  _getCode() {
    return this.editor ? this.editor.state.doc.toString() : (this._code || '');
  }

  _check(resultEl) {
    if (this.answered) return;

    const code = this._getCode().trim();
    if (!code) {
      resultEl.innerHTML = `<div style="color: var(--warn); font-family: var(--font-mono); font-size: 12px;">Напиши код перед проверкой</div>`;
      return;
    }

    const checks = this.task.checks || [];
    const results = checks.map((check) => ({
      check,
      passed: this._checkPattern(code, check),
    }));

    const allPassed = results.every((r) => r.passed);

    if (allPassed) {
      this.answered = true;
      this._onCorrect(resultEl);
    } else {
      this.wrongTries++;
      this._onWrong(results, resultEl);
    }
  }

  _checkPattern(code, check) {
    const c = code.replace(/\s+/g, ' ').trim();
    switch (check.type) {
      case 'has':
        return c.includes(check.value);
      case 'has_regex':
        try { return new RegExp(check.value).test(c); } catch (e) { return false; }
      case 'not_has':
        return !c.includes(check.value);
      case 'min_length':
        return c.length >= check.value;
      default:
        return false;
    }
  }

  _onCorrect(resultEl) {
    const stars = this._calculateStars();
    const starsStr = '⭐'.repeat(stars) + '☆'.repeat(4 - stars);

    progress.markSolved(this.fileId);
    progress.setStars(this.fileId, stars);

    resultEl.innerHTML = `
      <div class="task-result-success">
        <div class="task-result-title">✅ ${t('task_correct')}</div>
        <div class="task-result-stars">${starsStr} (${stars}/4)</div>
        ${this.task.explanation ? `<div class="task-result-expl">${this.task.explanation}</div>` : ''}
        <button class="task-btn task-btn-next" id="code-next" type="button">${t('btn_next')}</button>
      </div>
    `;
    if (window.__audio) window.__audio.success();
    setTimeout(() => resultEl.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);

    resultEl.querySelector('#code-next').addEventListener('click', () => {
      if (this.onSolved) this.onSolved(this.fileId, stars);
    });
  }

  _onWrong(results, resultEl) {
    const failed = results.filter((r) => !r.passed);
    if (window.__audio) window.__audio.error();

    const nextReward = Math.max(1, 4 - this.wrongTries);

    resultEl.innerHTML = `
      <div class="task-result-error">
        <div class="task-result-title">❌ Не всё готово (ошибок: ${this.wrongTries})</div>
        <div style="margin-top: 8px; font-family: var(--font-mono); font-size: 11px; line-height: 1.7;">
          <strong>Что не так:</strong><br>
          ${failed.map((r) => `<span style="color: var(--error);">✗</span> ${r.check.hint || r.check.value}`).join('<br>')}
        </div>
        <div class="task-result-hint" style="margin-top: 8px;">
          ${this.wrongTries <= 3 ? `Будет ⭐ ${nextReward}/4.` : 'Минимум ⭐ 1/4.'}
        </div>
      </div>
    `;
    setTimeout(() => resultEl.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
  }

  _showHint(resultEl) {
    if (!this.task.hint) return;
    resultEl.innerHTML = `
      <div style="padding: 10px; background: rgba(255,170,0,0.05); border-left: 3px solid var(--warn); font-family: var(--font-mono); font-size: 12px;">
        💡 ${this.task.hint}
      </div>
    `;
  }

  destroy() {
    if (this.editor) {
      try { this.editor.destroy(); } catch (e) {}
      this.editor = null;
    }
  }
}
