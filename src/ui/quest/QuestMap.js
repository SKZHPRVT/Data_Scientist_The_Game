import { progress } from '../../core/progress.js';

export class QuestMap {
  constructor(chapterId, { onOpenTask } = {}) {
    this.chapterId = chapterId;
    this.onOpenTask = onOpenTask;
    this.data = null;
  }

  async load() {
    const url = import.meta.env.BASE_URL + 'tasks/' + this.chapterId + '/index.json';
    console.log('[QuestMap] loading', url);
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status + ' для ' + url);
    this.data = await res.json();
    console.log('[QuestMap] loaded', this.data);
  }

  render() {
    if (!this.data) {
      return `<div style="color: var(--fg-dim); font-family: var(--font-mono);">Загрузка...</div>`;
    }

    const tasks = this.data.tasks || [];
    const taskIds = tasks.map((t) => t.replace('.json', ''));
    const solvedCount = taskIds.filter((id) => progress.isSolved(id)).length;
    const total = taskIds.length || 1;
    const percent = Math.round((solvedCount / total) * 100);

    return `
      <div class="quest-map">
        <div class="quest-map-header">
          <div class="quest-map-title">${this.data.icon || '📚'} ${this.data.title || 'Квесты'}</div>
          <div class="quest-map-desc">${this.data.description || ''}</div>
          <div class="quest-map-progress">
            <div class="quest-map-bar">
              <div class="quest-map-bar-fill" style="width: ${percent}%"></div>
            </div>
            <div class="quest-map-count">${solvedCount} / ${taskIds.length}</div>
          </div>
        </div>

        <div class="quest-list">
          ${tasks.map((fileName, i) => {
            const taskId = fileName.replace('.json', '');
            const unlocked = progress.isUnlocked(taskId, taskIds);
            const solved = progress.isSolved(taskId);
            const stars = progress.getStars(taskId);

            let status = '🔒';
            let cls = 'locked';
            let sub = 'Сначала пройди предыдущий';

            if (solved) { status = '✅'; cls = 'solved'; sub = ''; }
            else if (unlocked) { status = '▶️'; cls = 'active'; sub = 'Нажми, чтобы начать'; }

            return `
              <div class="quest-item ${cls}" data-file="${fileName}">
                <div class="quest-item-status">${status}</div>
                <div class="quest-item-body">
                  <div class="quest-item-title">Квест ${i + 1}</div>
                  <div class="quest-item-sub">${sub}</div>
                </div>
                ${solved ? `<div class="quest-item-stars">${'⭐'.repeat(stars)}</div>` : ''}
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
