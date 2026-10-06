import { progress } from '../../core/progress.js';

export class Explorer {
  constructor(path, handlers) {
    this.path = path;
    this.handlers = handlers;
  }

  render() {
    let items = [];
    try {
      items = window.__fs.ls(this.path);
    } catch (e) {
      items = [];
    }

    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const taskFiles = items.filter((i) => i.type === 'file' && i.name.endsWith('.json'));
    const taskIds = taskFiles.map((f) => f.name.replace('.json', ''));

    const parent = this.path !== '/' ? `
      <div class="start-item" data-action="up">⬆️ ..</div>
    ` : '';

    return `
      <div style="font-family: var(--font-mono); font-size: 13px;">
        <div style="color: var(--fg-dim); margin-bottom: 12px;">${this.path}</div>
        ${parent}
        ${items.length === 0 ? '<div style="color: var(--fg-dim);">(пусто)</div>' : ''}
        ${items.map((i) => {
          const isDir = i.type === 'dir';
          const isJson = !isDir && i.name.endsWith('.json');

          if (isDir) {
            return `
              <div class="start-item" data-name="${i.name}" data-type="dir">
                📁 ${i.name}
              </div>
            `;
          }

          if (isJson) {
            const taskId = i.name.replace('.json', '');
            const unlocked = progress.isUnlocked(taskId, taskIds);
            const solved = progress.isSolved(taskId);
            const stars = progress.getStars(taskId);

            if (!unlocked) {
              return `
                <div class="start-item locked" data-name="${i.name}" data-type="locked">
                  🔒 ${i.name} <span style="color: var(--fg-dim); font-size: 11px;">— сначала пройди предыдущую</span>
                </div>
              `;
            }

            const starsStr = solved ? ' ' + '⭐'.repeat(stars) : '';
            const icon = solved ? '✅' : '📄';

            return `
              <div class="start-item" data-name="${i.name}" data-type="json">
                ${icon} ${i.name}${starsStr}
              </div>
            `;
          }

          return `
            <div class="start-item" data-name="${i.name}" data-type="file">
              📄 ${i.name}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  mount(body) {
    body.querySelectorAll('.start-item').forEach((el) => {
      el.onclick = () => {
        if (el.dataset.action === 'up') {
          const parts = this.path.split('/').filter(Boolean);
          parts.pop();
          const parent = '/' + parts.join('/');
          window.dispatchEvent(new CustomEvent('open-explorer', { detail: parent }));
          return;
        }

        if (el.dataset.type === 'locked') {
          if (window.__audio) window.__audio.error();
          this._flashLocked(el);
          return;
        }

        const name = el.dataset.name;
        const type = el.dataset.type;
        const fullPath = (this.path === '/' ? '' : this.path) + '/' + name;

        if (type === 'dir') {
          window.dispatchEvent(new CustomEvent('open-explorer', { detail: fullPath }));
        } else if (type === 'json') {
          window.dispatchEvent(new CustomEvent('open-task', { detail: fullPath }));
        } else {
          this.handlers.onOpenFile?.(fullPath);
        }
      };
    });
  }

  _flashLocked(el) {
    el.style.transition = 'background 0.2s';
    el.style.background = 'rgba(255, 51, 51, 0.2)';
    setTimeout(() => { el.style.background = ''; }, 300);

    const tip = document.createElement('div');
    tip.textContent = 'Сначала пройди предыдущую задачу';
    tip.style.cssText = `
      position: absolute;
      background: var(--error);
      color: #fff;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 11px;
      pointer-events: none;
      z-index: 9999;
      white-space: nowrap;
    `;
    const rect = el.getBoundingClientRect();
    tip.style.left = rect.left + 'px';
    tip.style.top = (rect.top - 30) + 'px';
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 1500);
  }
}
