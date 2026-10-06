export class WindowManager {
  constructor(root) {
    this.root = root;
    this.windows = new Map();
    this.zIndex = 100;
    this.offset = 0;
  }

  create({ id, title, content, onMount, width = 500, height = 400 }) {
    if (this.windows.has(id)) {
      this.focus(id);
      return this.windows.get(id);
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const taskbarH = 44;
    const safeTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0;
    const safeBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom')) || 0;

    const isMobile = vw < 600;
    const maxW = vw - 16;
    const maxH = vh - taskbarH - safeTop - safeBottom - 40;

    const finalW = Math.min(width, maxW);
    const finalH = Math.min(height, maxH);

    this.offset = (this.offset + 1) % 5;
    const defaultLeft = isMobile ? 8 : 40 + this.offset * 30;
    const defaultTop = isMobile ? 8 + safeTop : 60 + this.offset * 30;

    const win = document.createElement('div');
    win.className = 'window';
    win.style.width = finalW + 'px';
    win.style.height = finalH + 'px';
    win.style.left = Math.min(defaultLeft, Math.max(8, vw - finalW - 8)) + 'px';
    win.style.top = Math.min(defaultTop, Math.max(8, vh - finalH - taskbarH - safeBottom - 8)) + 'px';
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
    win.addEventListener('touchstart', () => this.focus(id));

    if (!isMobile) {
      this._makeDraggable(win, win.querySelector('.window-title'));
    }

    const onResize = () => this._clampWindow(win);
    window.addEventListener('resize', onResize);
    win._onResize = onResize;

    if (window.__audio) window.__audio.open();

    if (onMount) onMount(win.querySelector('.window-body'));

    return win;
  }

  _clampWindow(win) {
    if (!win || !win.parentNode) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const taskbarH = 44;
    const rect = win.getBoundingClientRect();

    const maxLeft = vw - rect.width - 8;
    const maxTop = vh - rect.height - taskbarH - 8;

    const newLeft = Math.max(8, Math.min(rect.left, maxLeft));
    const newTop = Math.max(8, Math.min(rect.top, maxTop));

    win.style.left = newLeft + 'px';
    win.style.top = newTop + 'px';

    if (rect.width > vw - 16) win.style.width = (vw - 16) + 'px';
    if (rect.height > vh - taskbarH - 16) win.style.height = (vh - taskbarH - 16) + 'px';
  }

  focus(id) {
    const win = this.windows.get(id);
    if (win) win.style.zIndex = ++this.zIndex;
  }

  close(id) {
    const win = this.windows.get(id);
    if (win) {
      if (window.__audio) window.__audio.close();
      if (win._onResize) window.removeEventListener('resize', win._onResize);
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
      win.style.zIndex = ++this.zIndex;
    };

    const move = (e) => {
      if (!dragging) return;
      const cx = e.touches?.[0]?.clientX ?? e.clientX;
      const cy = e.touches?.[0]?.clientY ?? e.clientY;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const taskbarH = 44;
      const w = win.offsetWidth;

      let newLeft = cx - offsetX;
      let newTop = cy - offsetY;

      newLeft = Math.max(-w + 60, Math.min(newLeft, vw - 60));
      newTop = Math.max(0, Math.min(newTop, vh - taskbarH - 30));

      win.style.left = newLeft + 'px';
      win.style.top = newTop + 'px';
    };

    const end = () => {
      dragging = false;
      this._clampWindow(win);
    };

    handle.addEventListener('mousedown', start);
    handle.addEventListener('touchstart', start, { passive: true });
    document.addEventListener('mousemove', move);
    document.addEventListener('touchmove', move, { passive: true });
    document.addEventListener('mouseup', end);
    document.addEventListener('touchend', end);
  }
}
