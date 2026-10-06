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

    const parent = this.path !== '/' ? `
      <div class="start-item" data-action="up">⬆️ ..</div>
    ` : '';

    return `
      <div style="font-family: var(--font-mono); font-size: 13px;">
        <div style="color: var(--fg-dim); margin-bottom: 12px;">${this.path}</div>
        ${parent}
        ${items.length === 0 ? '<div style="color: var(--fg-dim);">(пусто)</div>' : ''}
        ${items.map((i) => {
          let stars = '';
          if (i.type === 'file' && i.name.endsWith('.json')) {
            const id = i.name.replace('.json', '');
            const s = +localStorage.getItem(`task_${id}_stars`) || 0;
            stars = s > 0 ? ' ' + '⭐'.repeat(s) : '';
          }
          return `
            <div class="start-item" data-name="${i.name}" data-type="${i.type}">
              ${i.type === 'dir' ? '📁' : '📄'} ${i.name}${stars}
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
        const name = el.dataset.name;
        const type = el.dataset.type;
        const fullPath = (this.path === '/' ? '' : this.path) + '/' + name;

        if (type === 'dir') {
          window.dispatchEvent(new CustomEvent('open-explorer', { detail: fullPath }));
        } else if (name.endsWith('.json')) {
          window.dispatchEvent(new CustomEvent('open-task', { detail: fullPath }));
        } else {
          this.handlers.onOpenFile?.(fullPath);
        }
      };
    });
  }
}
