export class WindowManager {
  constructor(root) {
    this.root = root;
    this.windows = new Map();
    this.zIndex = 100;
  }

  create({ id, title, content, onMount, width = 500, height = 400 }) {
    if (this.windows.has(id)) {
      this.focus(id);
      return this.windows.get(id);
    }

    const win = document.createElement('div');
    win.className = 'window';
    win.style.width = width + 'px';
    win.style.height = height + 'px';
    win.style.left = (40 + this.windows.size * 30) + 'px';
    win.style.top = (60 + this.windows.size * 30) + 'px';
    win.style.zIndex = ++this.zIndex;

    win.innerHTML = `
      <div class="window-title">
        <span>${title}</span>
        <div class="controls">
          <span class="minimize" title="Свернуть"></span>
          <span class="close" title="Закрыть"></span>
        </div>
      </div>
      <div class="window-body">${content}</div>
    `;

    this.root.querySelector('.desktop').appendChild(win);
    this.windows.set(id, win);

    win.querySelector('.close').onclick = () => this.close(id);
    win.querySelector('.minimize').onclick = () => this.minimize(id);
    win.addEventListener('mousedown', () => this.focus(id));

    this._makeDraggable(win, win.querySelector('.window-title'));

    if (onMount) onMount(win.querySelector('.window-body'));

    return win;
  }

  focus(id) {
    const win = this.windows.get(id);
    if (win) win.style.zIndex = ++this.zIndex;
  }

  close(id) {
    const win = this.windows.get(id);
    if (win) {
      win.remove();
      this.windows.delete(id);
    }
  }

  minimize(id) {
    const win = this.windows.get(id);
    if (win) win.style.display = win.style.display === 'none' ? 'flex' : 'none';
  }

  _makeDraggable(win, handle) {
    let offsetX = 0, offsetY = 0, dragging = false;

    const start = (e) => {
      dragging = true;
      const rect = win.getBoundingClientRect();
      offsetX = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
      offsetY = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
    };

    const move = (e) => {
      if (!dragging) return;
      const cx = e.touches?.[0]?.clientX ?? e.clientX;
      const cy = e.touches?.[0]?.clientY ?? e.clientY;
      win.style.left = (cx - offsetX) + 'px';
      win.style.top = Math.max(0, cy - offsetY) + 'px';
    };

    const end = () => { dragging = false; };

    handle.addEventListener('mousedown', start);
    handle.addEventListener('touchstart', start, { passive: true });
    document.addEventListener('mousemove', move);
    document.addEventListener('touchmove', move, { passive: true });
    document.addEventListener('mouseup', end);
    document.addEventListener('touchend', end);
  }
}
