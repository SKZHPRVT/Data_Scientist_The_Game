import { progress } from '../../core/progress.js';

export class Progress {
  constructor() {
    this.el = null;
    this.worldStats = null;
  }

  async loadWorldStats() {
    // Загружаем прогресс по всем папкам junior
    const stats = { junior: { chapters: [], totalStars: 0, maxStars: 0, solved: 0, totalTasks: 0 } };

    try {
      const url = import.meta.env.BASE_URL + 'tasks/junior/index.json';
      const res = await fetch(url);
      const idx = await res.json();

      for (const ch of idx.chapters || []) {
        try {
          const chUrl = import.meta.env.BASE_URL + 'tasks/junior/' + ch.id + '/index.json';
          const chRes = await fetch(chUrl);
          if (!chRes.ok) continue;
          const chData = await chRes.json();
          const ids = (chData.tasks || []).map((t) => progress.makeId('junior/' + ch.id + '/' + t));
          const solved = ids.filter((id) => progress.isSolved(id)).length;
          const stars = progress.sumStars(ids);
          const maxStars = progress.maxStars(ids);

          stats.junior.chapters.push({
            id: ch.id,
            title: ch.title,
            icon: ch.icon || '📁',
            solved,
            total: ids.length,
            stars,
            maxStars,
          });

          stats.junior.totalStars += stars;
          stats.junior.maxStars += maxStars;
          stats.junior.solved += solved;
          stats.junior.totalTasks += ids.length;
        } catch (e) {}
      }
    } catch (e) {
      console.warn('[Progress] не могу загрузить junior', e);
    }

    this.worldStats = stats;
  }

  render() {
    const j = this.worldStats?.junior || { chapters: [], totalStars: 0, maxStars: 0, solved: 0, totalTasks: 0 };
    const percent = j.maxStars > 0 ? Math.round((j.totalStars / j.maxStars) * 100) : 0;
    const perfect = j.maxStars > 0 && j.totalStars >= j.maxStars;

    return `
      <div class="progress-view">
        <div class="progress-title">📊 ТВОЙ ПРОГРЕСС</div>

        <div class="progress-section">
          <div class="progress-stat">
            <div class="progress-label">Решено задач</div>
            <div class="progress-value">${j.solved} / ${j.totalTasks}</div>
          </div>
          <div class="progress-stat">
            <div class="progress-label">Звёзд всего</div>
            <div class="progress-value">⭐ ${j.totalStars} / ${j.maxStars}</div>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-bar-wrapper">
            <div class="progress-bar">
              <div class="progress-bar-fill" style="width: ${percent}%"></div>
            </div>
            <div class="progress-bar-label">${percent}% ${perfect ? '🏆 ИДЕАЛЬНО' : 'от идеала'}</div>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-section-title">🎯 JUNIOR</div>
          <div class="progress-chapters">
            ${j.chapters.length === 0 ? '<div style="color: var(--fg-dim); font-size: 11px;">Загрузка...</div>' : ''}
            ${j.chapters.map((ch) => {
              const chPercent = ch.maxStars > 0 ? Math.round((ch.stars / ch.maxStars) * 100) : 0;
              const chPerfect = ch.maxStars > 0 && ch.stars >= ch.maxStars;
              return `
                <div class="progress-chapter">
                  <div class="progress-chapter-head">
                    <span>${ch.icon} ${ch.title} ${chPerfect ? '🏆' : ''}</span>
                    <span class="progress-chapter-stats">${ch.solved}/${ch.total} · ⭐ ${ch.stars}/${ch.maxStars}</span>
                  </div>
                  <div class="progress-chapter-bar">
                    <div class="progress-chapter-fill" style="width: ${chPercent}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-section-title">🌍 МИРЫ</div>
          <div class="progress-world">
            <div>🎯 <strong>JUNIOR</strong></div>
            <div class="progress-world-stats">${percent}%</div>
          </div>
          <div class="progress-world locked">
            <div>🔒 <strong>MIDDLE</strong></div>
            <div class="progress-world-stats">Скоро</div>
          </div>
          <div class="progress-world locked">
            <div>🔒 <strong>SENIOR</strong></div>
            <div class="progress-world-stats">Скоро</div>
          </div>
        </div>

        <div class="progress-section">
          <button class="task-btn" id="reset-progress-btn" style="color: var(--error); width: 100%;" type="button">
            Сбросить весь прогресс
          </button>
        </div>
      </div>
    `;
  }

  async mount(body) {
    this.el = body.querySelector('.progress-view');

    // Загружаем статистику и перерисовываем
    await this.loadWorldStats();
    body.innerHTML = this.render();

    const resetBtn = body.querySelector('#reset-progress-btn');
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (confirm('Точно сбросить весь прогресс?')) {
          progress.reset();
          localStorage.clear();
          location.reload();
        }
      };
    }
  }
}
