import { progress } from '../../core/progress.js';

export class QuestMap {
  constructor(chapterId, { onOpenTask } = {}) {
    this.chapterId = chapterId; // например "junior/basics"
    this.onOpenTask = onOpenTask;
    this.data = null; // манифест
  }

  async load() {
    const url = import.meta.env.BASE_URL + 'tasks/' + this.chapterId + '/index.json';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Не могу загрузить ' + url);
    this.data = await res.json();
  }

  render() {
    if (!this.data) {
      return `<div style="color: var(--fg-dim); font-family: var(--font-mono);">Загрузка...</div>`;
    }

    const tasks = this.data.tasks; // ["task1.json", ...]
    const taskIds = tasks.map((t) => t.replace('.json', ''));
    const solvedCount = taskIds.filter((id) => progress.isSolved(id)).length;
    const total = taskIds.length;
    const percent = Math.round((solvedCount / total) * 100);

    return `
      <div class="quest-map">
        <div class="quest-map-header">
          <div class="quest-map-title">${this.data.icon || '📚'} ${this.data.title}</div>
          <div class="quest-map-desc">${this.data.description || ''}</div>
          <div class="quest-map-progress">
            <div class="quest-map-bar">
              <div class="quest-map-bar-fill" style="width: ${percent}%"></div>
            </div>
            <div class="quest-map-count">${solvedCount} / ${total}</div>
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
            if (solved) { status = '✅'; cls = 'solved'; }
            else if (unlocked) { status = '▶️'; cls = 'active'; }

            return `
              <div class="quest-item ${cls}" data-file="${fileName}" data-idx="${i}">
                <div class="quest-item-status">${status}</div>
                <div class="quest-item-body">
                  <div class="quest-item-title">Квест ${i + 1}</div>
                  <div class="quest-item-sub">${this._taskPreview(fileName) || (solved ? '⭐'.repeat(stars) : unlocked ? 'Нажми, чтобы начать' : 'Сначала пройди предыдущий')}</div>
                </div>
                ${solved ? `<div class="quest-item-stars">${'⭐'.repeat(stars)}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  _taskPreview(fileName) {
    // Возвращает краткое описание задачи, если оно уже подгружено
    const cache = window.__taskCache || {};
    const t = cache[this.chapterId + '/' + fileName];
    return t?.title || null;
  }

  mount(body) {
    body.querySelectorAll('.quest-item').forEach((el) => {
      el.onclick = async () => {
        if (el.classList.contains('locked')) {
          if (window.__audio) window.__audio.error();
          this._flash(el);
          return;
        }
        const file = el.dataset.file;
        const path = '/' + this.chapterId + '/' + file; // например /junior/basics/task1.json
        if (window.__audio) window.__audio.click('open');
        if (this.onOpenTask) this.onOpenTask(path);
      };
    });
  }

  _flash(el) {
    el.style.transition = 'background 0.2s';
    el.style.background = 'rgba(255, 51, 51, 0.2)';
    setTimeout(() => { el.style.background = ''; }, 300);
  }
}
