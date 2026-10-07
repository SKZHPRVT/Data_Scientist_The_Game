// ChartVisionView — рендер задачи чтения графика с кнопкой "Следующая"
import { progress } from '../core/progress.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export class ChartVisionView {
  constructor(task, { onNext, onBack, sessionProgress, combo } = {}) {
    this.task = task;
    this.onNext = onNext;
    this.onBack = onBack;
    this.sessionProgress = sessionProgress || null;
    this.combo = combo || 0;
    this.el = null;
    this.answered = false;
    this.wrongTries = 0;
    this.shuffledOptions = this._shuffleOptions(task.options || []);
    this.chart = null;
  }

  _shuffleOptions(options) {
    const arr = [...options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  _calculateStars() {
    return Math.max(1, 4 - this.wrongTries);
  }

  render() {
    const t2 = this.task;
    const sp = this.sessionProgress;
    const sessionBar = sp ? `
      <div style="margin-bottom: 12px; padding: 8px 12px; background: rgba(0,255,65,0.05); border-left: 3px solid var(--accent); font-family: var(--font-mono); font-size: 11px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span>Задача ${sp.current + 1} / ${sp.max}</span>
          <span>
            ${this.combo >= 3 ? `<span style="color: var(--warn); font-weight: 700;">🔥 Комбо ×${this.combo}</span> · ` : ''}
            ⭐ ${sp.stars} / ${sp.maxStars}
          </span>
        </div>
        <div style="height: 4px; background: var(--border); border-radius: 2px; overflow: hidden;">
          <div style="height: 100%; width: ${(sp.current / sp.max) * 100}%; background: var(--accent); transition: width 0.3s;"></div>
        </div>
      </div>
    ` : '';

    return `
      <div class="task-view">
        <div class="task-header">
          <div class="task-title">${t2.title || 'Чтение графика'}</div>
          <div class="task-meta">vision · генеративная</div>
        </div>

        ${sessionBar}

        <div class="task-body">
          <div class="task-chart-wrapper" style="position: relative; height: 260px; margin-bottom: 16px; background: rgba(0,255,65,0.03); border: 1px solid var(--fg-dim); border-radius: 6px; padding: 12px;">
            <canvas id="read-chart-canvas"></canvas>
          </div>

          <div class="task-question">${t2.question}</div>

          <div class="task-options">
            ${this.shuffledOptions.map((opt) => `
              <button class="task-option" data-id="${opt.id}" type="button">
                <div class="task-option-code">${opt.code}</div>
              </button>
            `).join('')}
          </div>

          <div class="task-result" id="read-result"></div>
        </div>
      </div>
    `;
  }

  mount(body) {
    this.el = body.querySelector('.task-view');
    const result = body.querySelector('#read-result');
    const canvas = body.querySelector('#read-chart-canvas');

    this._drawChart(canvas);

    body.querySelectorAll('.task-option').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._onPick(btn, result);
      });
    });
  }

  _drawChart(canvas) {
    const cfg = this.task.chart;
    if (!cfg || !canvas) return;

    // Boxplot рисуем вручную
    if (cfg.type === 'boxplot') {
      this._drawBoxplot(canvas, cfg);
      return;
    }

    // Heatmap тоже вручную
    if (cfg.type === 'heatmap') {
      this._drawHeatmap(canvas, cfg);
      return;
    }

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
      data: { labels: cfg.data.labels || [], datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
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

  _drawBoxplot(canvas, cfg) {
    const ctx = canvas.getContext('2d');
    const baseColor = '#00ff41';
    const boxData = cfg.data.datasets[0]?.boxData || [];
    if (!boxData.length) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const padding = { left: 50, right: 20, top: 40, bottom: 40 };
    const plotW = W - padding.left - padding.right;
    const plotH = H - padding.top - padding.bottom;

    // Находим min/max по всем данным
    let globalMin = Infinity;
    let globalMax = -Infinity;
    for (const d of boxData) {
      globalMin = Math.min(globalMin, d.min, ...(d.outliers || []));
      globalMax = Math.max(globalMax, d.max, ...(d.outliers || []));
    }
    const range = globalMax - globalMin || 1;

    const yScale = (v) => padding.top + plotH - ((v - globalMin) / range) * plotH;

    // Оси
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();

      // Подпись
      const val = globalMax - (range / 4) * i;
      ctx.fillStyle = '#00ff41';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(val), padding.left - 6, y);
    }

    // Рисуем каждый box
    const n = boxData.length;
    const slotW = plotW / n;
    const boxW = Math.min(slotW * 0.5, 50);

    for (let i = 0; i < n; i++) {
      const d = boxData[i];
      const cx = padding.left + slotW * (i + 0.5);
      const x1 = cx - boxW / 2;
      const x2 = cx + boxW / 2;

      const yMin = yScale(d.min);
      const yQ1 = yScale(d.q1);
      const yMedian = yScale(d.median);
      const yQ3 = yScale(d.q3);
      const yMax = yScale(d.max);

      // Усы
      ctx.strokeStyle = '#00ff41';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, yMax);
      ctx.lineTo(cx, yQ3);
      ctx.moveTo(cx, yQ1);
      ctx.lineTo(cx, yMin);
      ctx.stroke();
      ctx.setLineDash([]);

      // Горизонтальные линии усов
      ctx.beginPath();
      ctx.moveTo(x1 + 8, yMax);
      ctx.lineTo(x2 - 8, yMax);
      ctx.moveTo(x1 + 8, yMin);
      ctx.lineTo(x2 - 8, yMin);
      ctx.stroke();

      // Ящик
      ctx.fillStyle = 'rgba(0, 255, 65, 0.15)';
      ctx.fillRect(x1, yQ3, boxW, yQ1 - yQ3);
      ctx.strokeStyle = '#00ff41';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x1, yQ3, boxW, yQ1 - yQ3);

      // Медиана
      ctx.strokeStyle = '#00ff41';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, yMedian);
      ctx.lineTo(x2, yMedian);
      ctx.stroke();

      // Выбросы
      if (d.outliers) {
        for (const o of d.outliers) {
          const yo = yScale(o);
          ctx.fillStyle = '#ff3333';
          ctx.beginPath();
          ctx.arc(cx, yo, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Подпись группы
      ctx.fillStyle = '#00ff41';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(d.label, cx, H - padding.bottom + 8);
    }

    // Заголовок
    if (cfg.title) {
      ctx.fillStyle = '#00ff41';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(cfg.title, W / 2, 12);
    }
  }

  _drawHeatmap(canvas, cfg) {
    const ctx = canvas.getContext('2d');
    const rows = cfg.data.rows || [];
    const cols = cfg.data.labels || [];
    const matrix = cfg.data.matrix || [];
    if (!rows.length || !cols.length) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const padding = { left: 70, right: 20, top: 40, bottom: 30 };
    const plotW = W - padding.left - padding.right;
    const plotH = H - padding.top - padding.bottom;

    // Находим min/max
    let minV = Infinity, maxV = -Infinity;
    for (const row of matrix) {
      for (const v of row) {
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
    }
    const range = maxV - minV || 1;

    const cellW = plotW / cols.length;
    const cellH = plotH / rows.length;

    // Рисуем ячейки
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < cols.length; c++) {
        const v = matrix[r][c];
        const t = (v - minV) / range;   // 0..1
        // Зелёный градиент: тёмный (0) → яркий (1)
        const alpha = 0.15 + t * 0.85;
        ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`;
        const x = padding.left + c * cellW;
        const y = padding.top + r * cellH;
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

        // Значение внутри ячейки
        if (cellW > 30) {
          ctx.fillStyle = t > 0.5 ? '#000' : '#00ff41';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(Math.round(v), x + cellW / 2, y + cellH / 2);
        }
      }
    }

    // Подписи строк (слева)
    ctx.fillStyle = '#00ff41';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < rows.length; r++) {
      const y = padding.top + r * cellH + cellH / 2;
      ctx.fillText(rows[r], padding.left - 6, y);
    }

    // Подписи столбцов (сверху)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (let c = 0; c < cols.length; c++) {
      const x = padding.left + c * cellW + cellW / 2;
      ctx.fillText(cols[c], x, padding.top - 4);
    }

    // Заголовок
    if (cfg.title) {
      ctx.fillStyle = '#00ff41';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(cfg.title, W / 2, 12);
    }
  }

  _onPick(btn, resultEl) {
    if (this.answered) return;
    if (btn.disabled) return;

    const optId = btn.dataset.id;
    const opt = this.task.options.find((o) => o.id === optId);
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

    // Сохраняем прогресс
    progress.markSolved(this.task._path);
    progress.setStars(this.task._path, stars);

    resultEl.innerHTML = `
      <div class="task-result-success">
        <div class="task-result-title">✅ Верно</div>
        <div class="task-result-stars">${starsStr} (${stars}/4)</div>
        <div class="task-result-expl">${opt.explain}</div>
        <button class="task-btn task-btn-next" id="read-next" type="button" style="margin-top: 12px;">[ СЛЕДУЮЩИЙ ГРАФИК → ]</button>
      </div>
    `;
    if (window.__audio) window.__audio.success();
    setTimeout(() => resultEl.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);

    resultEl.querySelector('#read-next').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.onNext) this.onNext();
    });
  }

  _onWrong(btn, opt, resultEl) {
    btn.classList.add('wrong');
    btn.disabled = true;
    if (window.__audio) window.__audio.error();

    const nextReward = Math.max(1, 4 - this.wrongTries);

    resultEl.innerHTML = `
      <div class="task-result-error">
        <div class="task-result-title">❌ Неверно (ошибок: ${this.wrongTries})</div>
        <div class="task-result-expl">${opt.explain}</div>
        <div class="task-result-hint">
          ${this.wrongTries <= 3
            ? `Будет ⭐ ${nextReward}/4 за 3 попытки.`
            : 'Минимум ⭐ 1/4.'
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
