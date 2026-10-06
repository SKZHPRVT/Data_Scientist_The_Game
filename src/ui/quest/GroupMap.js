import { progress } from '../../core/progress.js';
import { isDevUnlockAll } from '../../core/dev.js';

export class GroupMap {
  constructor(worldId, { onOpenChapter } = {}) {
    this.worldId = worldId;
    this.onOpenChapter = onOpenChapter;
    this.data = null;
    this.chapterStats = {};
  }

  async load() {
    const url = import.meta.env.BASE_URL + 'tasks/' + this.worldId + '/index.json';
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    this.data = await res.json();

    for (const ch of this.data.chapters) {
      try {
        const chUrl = import.meta.env.BASE_URL + 'tasks/' + this.worldId + '/' + ch.id + '/index.json';
        const chRes = await fetch(chUrl);
        if (!chRes.ok) {
          this.chapterStats[ch.id] = { solved: 0, total: 0, stars: 0, maxStars: 0, ids: [], soon: true };
          continue;
        }
        const chData = await chRes.json();
        const ids = (chData.tasks || []).map((x) =>
          progress.makeId(this.worldId + '/' + ch.id + '/' + x)
        );
        const solved = ids.filter((id) => progress.isSolved(id)).length;
        const stars = progress.sumStars(ids);
        const maxStars = progress.maxStars(ids);
        const soon = ids.length === 0;
        this.chapterStats[ch.id] = { solved, total: ids.length, stars, maxStars, ids, soon };
      } catch (e) {
        this.chapterStats[ch.id] = { solved: 0, total: 0, stars: 0, maxStars: 0, ids: [], soon: true };
      }
    }
  }

  _isChapterUnlocked(ch) {
    if (isDevUnlockAll()) return true;
    if (ch.unlockAfter === null || ch.unlockAfter === undefined) {
      const idx = this.data.chapters.findIndex((c) => c.id === ch.id);
      return idx === 0;
    }
    const prev = this.chapterStats[ch.unlockAfter];
    if (!prev) return false;
    return prev.total > 0 && prev.solved >= prev.total;
  }

  render() {
    if (!this.data) return '<div style="color: var(--fg-dim); font-family: var(--font-mono);">Загрузка...</div>';

    const isBaby = this.worldId === 'baby';

    const totalStars = Object.values(this.chapterStats).reduce((s, c) => s + c.stars, 0);
    const totalMax = Object.values(this.chapterStats).reduce((s, c) => s + c.maxStars, 0);
    const totalSolved = Object.values(this.chapterStats).reduce((s, c) => s + c.solved, 0);
    const totalTasks = Object.values(this.chapterStats).reduce((s, c) => s + c.total, 0);

    const percent = isBaby
      ? (totalTasks > 0 ? Math.round((totalSolved / totalTasks) * 100) : 0)
      : (totalMax > 0 ? Math.round((totalStars / totalMax) * 100) : 0);

    const progressText = isBaby ? `${totalSolved} / ${totalTasks}` : `⭐ ${totalStars} / ${totalMax}`;

    return `
      <div class="quest-map">
        <div class="quest-map-header">
          <div class="quest-map-title">${this.data.icon || '🎯'} ${this.data.title}</div>
          <div class="quest-map-desc">${this.data.description || ''}</div>
          <div class="quest-map-progress">
            <div class="quest-map-bar">
              <div class="quest-map-bar-fill" style="width: ${percent}%"></div>
            </div>
            <div class="quest-map-count">${progressText}</div>
          </div>
        </div>

        <div class="quest-list">
          ${this.data.chapters.map((ch) => {
            const stats = this.chapterStats[ch.id] || { solved: 0, total: 0, stars: 0, maxStars: 0, soon: true };
            const unlocked = this._isChapterUnlocked(ch);
            const complete = stats.total > 0 && stats.solved >= stats.total;
            const perfect = stats.maxStars > 0 && stats.stars >= stats.maxStars;

            let status = '🔒';
            let cls = 'locked';
            let sub = 'Сначала закрой предыдущую';

            if (stats.soon) {
              status = '🚧'; cls = 'locked soon'; sub = 'Скоро';
            } else if (!unlocked) {
              status = '🔒'; cls = 'locked'; sub = 'Сначала закрой предыдущую';
            } else if (isBaby) {
              if (complete) {
                status = '✅'; cls = 'solved'; sub = 'Пройдено';
              } else if (stats.solved > 0) {
                status = '▶️'; cls = 'active'; sub = `${stats.solved}/${stats.total}`;
              } else {
                status = '▶️'; cls = 'active'; sub = `${stats.total} уроков`;
              }
            } else if (perfect) {
              status = '🏆'; cls = 'solved perfect'; sub = `${stats.solved}/${stats.total} · ${stats.stars}/${stats.maxStars} ⭐`;
            } else if (complete) {
              status = '✅'; cls = 'solved'; sub = `${stats.solved}/${stats.total} · ${stats.stars}/${stats.maxStars} ⭐`;
            } else if (stats.solved > 0) {
              status = '▶️'; cls = 'active'; sub = `${stats.solved}/${stats.total} · ${stats.stars}/${stats.maxStars} ⭐`;
            } else {
              status = '▶️'; cls = 'active'; sub = `${stats.total} · 0/${stats.maxStars} ⭐`;
            }

            return `
              <div class="quest-item ${cls}" data-chapter="${ch.id}">
                <div class="quest-item-status">${status}</div>
                <div class="quest-item-body">
                  <div class="quest-item-title">${ch.icon || '📁'} ${ch.title}</div>
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
        if (el.classList.contains('locked')) {
          if (window.__audio) window.__audio.error();
          el.style.background = 'rgba(255,51,51,0.2)';
          setTimeout(() => { el.style.background = ''; }, 300);
          return;
        }
        const chapterId = el.dataset.chapter;
        if (window.__audio) window.__audio.click('open');
        if (this.onOpenChapter) this.onOpenChapter(this.worldId + '/' + chapterId);
      };
    });
  }
}
