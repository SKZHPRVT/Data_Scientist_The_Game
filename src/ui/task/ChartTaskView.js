// ChartTaskView — задача с графиком (Chart.js)
import { progress } from '../../core/progress.js';
import { t } from '../../i18n/index.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export class ChartTaskView {
  constructor(task, { onSolved } = {}) {
    this.task = task;
    this.onSolved = onSolved;
    this.el = null;
    this.answered = false;
    this.wrongTries = 0;
    this.fileId = this._computeFileId();
    this.shuffledOptions = this._shuffleOptions(task.options || []);
    this.chart = null;
  }

  _computeFileId() {
    if (this.task._path) return progress.makeId(this.task._path);
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

  _calculateStars() {
    return Math.max(1, 4 - this.wrongTries);
  }

  render() {
    const t2 = this.task;
    return `
      <div class="task-view">
        <div class="task-header">
          <div class="task-title">${t2.title || t2.id}</div>
          <div class="task-meta">${t2.world || 'plots'} · ${t2.level || 1}</div>
        </div>

        <div class="task-body">
          <div class="task-chart-wrapper" style="position: relative; height: 260px; margin-bottom: 16px; background: rgba(0,255,65,0.03); border: 1px solid var(--fg-dim); border-radius: 6px; padding: 12px;">
            <canvas id="task-chart-canvas"></canvas>
          </div>

          <div class="task-question">${t2.question}</div>

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

  mount(body) {
    this.el = body.querySelector('.task-view');
    const result = body.querySelector('#task-result');
    const canvas = body.querySelector('#task-chart-canvas');

    this._drawChart(canvas);

    body.querySelectorAll('.task-option').forEach((btn) => {
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._onPick(btn, result);
      });
    });
  }

  _drawChart(canvas) {
    const cfg = this.task.chart;
    if (!cfg) return;

    const ctx = canvas.getContext('2d');
    const baseColor = '#00ff41';

    const datasets = (cfg.data.datasets || []).map((ds, i) => {
      const colors = ['#00ff41', '#00ccff', '#ffaa00', '#ff3333', '#aa66ff'];
      const color = ds.color || colors[i % colors.length];
      return {
        label: ds.label || '',
        data: ds.values || [],
        backgroundColor: (cfg.type === 'bar' || cfg.type === 'histogram') ? color + '88' : 'rgba(0, 255, 65, 0.2)',
        borderColor: color,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: cfg.type === 'scatter' ? 6 : 3,
        pointBackgroundColor: color,
      };
    });

    const chartType = cfg.type === 'histogram' ? 'bar' : cfg.type;

    if (cfg.type === 'scatter' && cfg.data.points) {
      datasets.forEach((ds) => {
        ds.data = cfg.data.points.map((p) => ({ x: p.x, y: p.y }));
      });
    }

    this.chart = new Chart(ctx, {
      type: chartType,
      data: {
        labels: cfg.data.labels || [],
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!cfg.title,
            text: cfg.title || '',
            color: baseColor,
            font: { family: 'monospace', size: 14 },
          },
          legend: {
            display: datasets.length > 1,
            labels: { color: baseColor, font: { family: 'monospace', size: 11 } },
          },
        },
        scales: {
          x: {
            ticks: { color: baseColor, font: { family: 'monospace', size: 10 } },
            grid: { color: 'rgba(0, 255, 65, 0.1)' },
          },
          y: {
            ticks: { color: baseColor, font: { family: 'monospace', size: 10 } },
            grid: { color: 'rgba(0, 255, 65, 0.1)' },
            beginAtZero: cfg.beginAtZero !== false,
          },
        },
      },
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
    const stars = this._calculateStars();
    const starsStr = '⭐'.repeat(stars) + '☆'.repeat(4 - stars);

    btn.classList.add('correct');
    this.el.querySelectorAll('.task-option').forEach((b) => {
      b.style.pointerEvents = 'none';
      if (b !== btn) b.style.opacity = '0.4';
    });

    progress.markSolved(this.fileId);
    progress.setStars(this.fileId, stars);

    resultEl.innerHTML = `
      <div class="task-result-success">
        <div class="task-result-title">✅ ${t('task_correct')}</div>
        <div class="task-result-stars">${starsStr} (${stars}/4)</div>
        <div class="task-result-expl">${opt.explain}</div>
        <button class="task-btn task-btn-next" id="task-next" type="button">${t('btn_next')}</button>
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

    const nextReward = Math.max(1, 4 - this.wrongTries);

    resultEl.innerHTML = `
      <div class="task-result-error">
        <div class="task-result-title">❌ ${t('task_wrong')} (${t('task_errors')}: ${this.wrongTries})</div>
        <div class="task-result-code">${this._esc(opt.code)}</div>
        <div class="task-result-expl">${opt.explain}</div>
        <div class="task-result-hint">
          ${this.wrongTries <= 3
            ? `${t('task_will_get')} ⭐ ${nextReward}/4 ${t('task_stars')}.`
            : t('task_minimum')
          }
        </div>
      </div>
    `;
    setTimeout(() => resultEl.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
  }

  destroy() {
    if (this.chart) {
      try { this.chart.destroy(); } catch (e) {}
      this.chart = null;
    }
  }
}
