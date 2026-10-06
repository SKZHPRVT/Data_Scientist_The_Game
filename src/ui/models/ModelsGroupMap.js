// Карта лаборатории моделей — аналог GroupMap для 8 семейств
import { progress } from '../../core/progress.js';

export class ModelsGroupMap {
  constructor({ onOpenChapter } = {}) {
    this.onOpenChapter = onOpenChapter;
    this.data = null;         // INDEX.json
    this.families = {};       // id → { quests: [...] }
    this.familyStats = {};    // id → { solved, total, stars, maxStars, ids }
  }

  async load() {
    const base = import.meta.env.BASE_URL + 'models/';
    this.data = await fetch(base + 'INDEX.json').then((r) => r.json());

    for (const family of this.data.families) {
      try {
        const data = await fetch(base + family.id + '.json').then((r) => r.json());
        this.families[family.id] = data;

        const quests = data.quests || [];
        const ids = quests.map((q) =>
          progress.makeId('models/' + family.id + '/' + q.id)
        );
        const solved = ids.filter((id) => progress.isSolved(id)).length;
        const stars = progress.sumStars(ids);
        const maxStars = progress.maxStars(ids);

        this.familyStats[family.id] = {
          solved,
          total: ids.length,
          stars,
          maxStars,
          ids,
        };
      } catch (e) {
        this.familyStats[family.id] = {
          solved: 0, total: 0, stars: 0, maxStars: 0, ids: [],
        };
      }
    }
  }

  render() {
    if (!this.data) {
      return '<div style="color: var(--fg-dim); font-family: var(--font-mono);">Загрузка...</div>';
    }

    const totalStars = Object.values(this.familyStats).reduce((s, c) => s + c.stars, 0);
    const totalMax = Object.values(this.familyStats).reduce((s, c) => s + c.maxStars, 0);
    const totalSolved = Object.values(this.familyStats).reduce((s, c) => s + c.solved, 0);
    const totalTasks = Object.values(this.familyStats).reduce((s, c) => s + c.total, 0);
    const percent = totalMax > 0 ? Math.round((totalStars / totalMax) * 100) : 0;

    return `
      <div class="quest-map">
        <div class="quest-map-header">
          <div class="quest-map-title">📦 ЛАБОРАТОРИЯ МОДЕЛЕЙ</div>
          <div class="quest-map-desc">38 моделей · 8 семейств · Divide et Intellige</div>
          <div class="quest-map-progress">
            <div class="quest-map-bar">
              <div class="quest-map-bar-fill" style="width: ${percent}%"></div>
            </div>
            <div class="quest-map-count">⭐ ${totalStars} / ${totalMax} · ${totalSolved}/${totalTasks}</div>
          </div>
        </div>

        <div class="quest-list">
          ${this.data.families.map((f) => {
            const stats = this.familyStats[f.id] || { solved: 0, total: 0, stars: 0, maxStars: 0 };
            const complete = stats.total > 0 && stats.solved >= stats.total;
            const perfect = stats.maxStars > 0 && stats.stars >= stats.maxStars;

            let status = '▶️';
            let cls = 'active';
            let sub = `${stats.total} · 0/${stats.maxStars} ⭐`;

            if (perfect) {
              status = '🏆'; cls = 'solved perfect';
              sub = `${stats.solved}/${stats.total} · ${stats.stars}/${stats.maxStars} ⭐`;
            } else if (complete) {
              status = '✅'; cls = 'solved';
              sub = `${stats.solved}/${stats.total} · ${stats.stars}/${stats.maxStars} ⭐`;
            } else if (stats.solved > 0) {
              status = '▶️'; cls = 'active';
              sub = `${stats.solved}/${stats.total} · ${stats.stars}/${stats.maxStars} ⭐`;
            }

            return `
              <div class="quest-item ${cls}" data-family="${f.id}">
                <div class="quest-item-status">${status}</div>
                <div class="quest-item-body">
                  <div class="quest-item-title">${f.icon} ${f.name}</div>
                  <div class="quest-item-sub">${sub}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  mount(body) {
    body.querySelectorAll('.quest-item').forEach((el) => {
      el.onclick = () => {
        const familyId = el.dataset.family;
        if (window.__audio) window.__audio.click('open');
        if (this.onOpenChapter) this.onOpenChapter(familyId);
      };
    });
  }
}
