// Карта лаборатории моделей — аналог GroupMap для 8 семейств
import { progress } from '../../core/progress.js';

export class ModelsGroupMap {
  constructor({ onOpenChapter, onOpenBoss } = {}) {
    this.onOpenChapter = onOpenChapter;
    this.onOpenBoss = onOpenBoss;
    this.data = null;
    this.families = {};
    this.familyStats = {};
    this.bossData = null;
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

    // Грузим босса
    try {
      this.bossData = await fetch(base + 'BOSS_final.json').then((r) => r.json());
    } catch (e) {
      this.bossData = null;
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

    // Босс разблокируется, когда решено 38 / 38
    const bossUnlocked = totalSolved >= 38;
    const bossSolved = progress.isSolved('models/BOSS_final');
    const bossStars = progress.getStars('models/BOSS_final');

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

          ${this.bossData ? `
            <div class="quest-item ${bossSolved ? 'solved perfect' : (bossUnlocked ? 'active' : 'locked')}" data-boss="1"
                 style="margin-top: 12px; border-top: 1px solid var(--fg-dim); padding-top: 12px;">
              <div class="quest-item-status">${bossSolved ? '👑' : (bossUnlocked ? '👁' : '🔒')}</div>
              <div class="quest-item-body">
                <div class="quest-item-title">${this.bossData.icon} ФИНАЛЬНЫЙ БОСС: ${this.bossData.title}</div>
                <div class="quest-item-sub">
                  ${bossSolved
                    ? `Пройден · ⭐ ${bossStars}/4`
                    : bossUnlocked
                      ? 'Готов к испытанию · нажми'
                      : `Нужно открыть 38 / 38 · сейчас ${totalSolved}`
                  }
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  mount(body) {
    body.querySelectorAll('.quest-item').forEach((el) => {
      el.onclick = () => {
        // Босс
        if (el.dataset.boss) {
          if (el.classList.contains('locked')) {
            if (window.__audio) window.__audio.error();
            el.style.background = 'rgba(255,51,51,0.2)';
            setTimeout(() => { el.style.background = ''; }, 300);
            return;
          }
          if (window.__audio) window.__audio.click('open');
          if (this.onOpenBoss) this.onOpenBoss(this.bossData);
          return;
        }

        // Семейство
        const familyId = el.dataset.family;
        if (window.__audio) window.__audio.click('open');
        if (this.onOpenChapter) this.onOpenChapter(familyId);
      };
    });
  }
}
