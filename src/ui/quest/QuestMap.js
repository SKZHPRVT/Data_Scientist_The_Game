import { progress } from '../../core/progress.js';
import { t } from '../../i18n/index.js';

export class QuestMap {
  constructor(chapterId, { onOpenTask } = {}) {
    this.chapterId = chapterId;
    this.onOpenTask = onOpenTask;
    this.data = null;
  }

  async load() {
    const url = import.meta.env.BASE_URL + 'tasks/' + this.chapterId + '/index.json';
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    this.data = await res.json();
  }

  render() {
    if (!this.data) return `<div style="color: var(--fg-dim); font-family: var(--font-mono);">${t('progress_loading')}</div>`;

    const tasks = this.data.tasks || [];
    const taskIds = tasks.map((x) => progress.makeId(this.chapterId + '/' + x));
    const sumStars = progress.sumStars(taskIds);
    const maxStars = progress.maxStars(taskIds);
    const percent = maxStars > 0 ? Math.round((sumStars / maxStars) * 100) : 0;
    const perfect = progress.isChapterPerfect(taskIds);

    return `
      <div class="quest-map">
        <div class="quest-map-header">
          <div class="quest-map-title">${this.data.icon || '📚'} ${this.data.title || 'Quests'}${perfect ? ' 🏆' : ''}</div>
          <div class="quest-map-desc">${this.data.description || ''}</div>
          <div class="quest-map-progress">
            <div class="quest-map-bar">
              <div class="quest-map-bar-fill" style="width: ${percent}%"></div>
            </div>
            <div class="quest-map-count">⭐ ${sumStars} / ${maxStars}</div>
          </div>
        </div>

        <div class="quest-list">
          ${tasks.map((fileName, i) => {
            const taskId = progress.makeId(this.chapterId + '/' + fileName);
            const unlocked = progress.isUnlocked(taskId, taskIds);
            const solved = progress.isSolved(taskId);
            const stars = progress.getStars(taskId);

            let status = '🔒';
            let cls = 'locked';
            let sub = t('quest_locked');

            if (solved) {
              status = stars === 4 ? '🌟' : '✅';
              cls = stars === 4 ? 'solved perfect' : 'solved';
              sub = t('quest_solved');
            } else if (unlocked) {
              status = '▶️';
              cls = 'active';
              sub = t('quest_active');
            }

            const starsStr = solved ? '⭐'.repeat(stars) + '☆'.repeat(4 - stars) : '';

            return `
              <div class="quest-item ${cls}" data-file="${fileName}">
                <div class="quest-item-status">${status}</div>
                <div class="quest-item-body">
                  <div class="quest-item-title">${t('quest_number')} ${i + 1}</div>
                  <div class="quest-item-sub">${sub}</div>
                </div>
                ${solved ? `<div class="quest-item-stars">${starsStr}</div>` : ''}
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
        const file = el.dataset.file;
        const path = '/' + this.chapterId + '/' + file;
        if (window.__audio) window.__audio.click('open');
        if (this.onOpenTask) this.onOpenTask(path);
      };
    });
  }
}
