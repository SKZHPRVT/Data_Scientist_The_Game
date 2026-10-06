export class Explorer {
  constructor(path, handlers) {
    this.path = path;
    this.handlers = handlers;
  }

  render() {
    const items = window.__fs.ls(this.path);
    return `
      <div style="font-family: var(--font-mono); font-size: 13px;">
        <div style="color: var(--fg-dim); margin-bottom: 12px;">${this.path}</div>
        ${items.map((i) => `
          <div class="start-item" data-name="${i.name}" data-type="${i.type}">
            ${i.type === 'dir' ? '📁' : '📄'} ${i.name}
          </div>
        `).join('')}
      </div>
    `;
  }

  mount(body) {
    body.querySelectorAll('.start-item').forEach((el) => {
      el.onclick = () => {
        const name = el.dataset.name;
        const type = el.dataset.type;
        const fullPath = (this.path === '/' ? '' : this.path) + '/' + name;
        if (type === 'dir') {
          window.dispatchEvent(new CustomEvent('open-explorer', { detail: fullPath }));
        } else {
          this.handlers.onOpenFile?.(fullPath);
        }
      };
    });
  }
}
