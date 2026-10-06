export class WindowManager {
  constructor(root) {
    this.root = root;
    this.windows = new Map();
    this.zIndex = 100;
    this.offset = 0;
    this._safeCache = null;
  }

  // === ЧТЕНИЕ SAFE-AREA (реальные пиксели) ===
  _getSafeArea() {
    if (this._safeCache) return this._safeCache;

    const test = document.createElement('div');
    test.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      visibility: hidden;
      padding-top: env(safe-area-inset-top, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      padding-left: env(safe-area-inset-left, 0px);
      padding-right: env(safe-area-inset-right, 0px);
    `;
    document.body.appendChild(test);
    const cs = getComputedStyle(test);
    const result = {
      top: parseFloat(cs.paddingTop) || 0,
      bottom: parseFloat(cs.paddingBottom) || 0,
      left: parseFloat(cs.paddingLeft) || 0,
      right: parseFloat(cs.paddingRight) || 0,
    };
    test.remove();

    // Дополнительный отступ для кнопок Telegram — 52px сверху
    // (кнопки "закрыть", "свернуть", "меню" в шапке Mini App)
    result.top = Math.max(result.top, 0) + 52;

    this._safeCache = result;
    return result;
  }

  create({ id, title, content, onMount, width = 500, height = 400 }) {
    if (this.windows.has(id)) {
      this.focus(id);
      return this.windows.get(id);
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const taskbarH = 44;
    const safe = this._getSafeArea();

    const finalW = width;
    const finalH = Math.min(height, vh - taskbarH - safe.top - safe.bottom - 20);

    this.offset = (this.offset + 1) % 5;
    const defaultLeft = Math.min(40 + this.offset * 30, vw - finalW - 8);
    const defaultTop = safe.top + this.offset * 20;

    const win = document.createElement('div');
    win.className = 'window';
    win.style.width = finalW + 'px';
    win.style.height = finalH + 'px';
    win.style.left = Math.max(8, defaultLeft) + 'px';
    win.style.top = Math.max(safe.top, defaultTop) + 'px';
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

    win.querySelector('.close').onclick = (e) => {
      e.stopPropagation();
      this.close(id);
    };
    win.querySelector('.minimize').onclick = (e) => {
      e.stopPropagation();
      this.minimize(id);
    };
    win.addEventListener('mousedown', () => this.focus(id));
    win.addEventListener('touchstart', () => this.focus(id));

    // === ПЕРЕТАСКИВАНИЕ ЗА ШАПКУ ===
    this._makeDraggable(win, win.querySelector('.window-title'), safe, taskbarH);

    const onResize = () => {
      this._safeCache = null; // сбросить кэш
      this._clampWindow(win, this._getSafeArea(), taskbarH);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    win._onResize = onResize;

    if (window.__audio) window.__audio.open();

    if (onMount) onMount(win.querySelector('.window-body'));

    return win;
  }

  _clampWindow(win, safe, taskbarH) {
    if (!win || !win.parentNode) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = win.getBoundingClientRect();

    // Окно не должно вылезать за верхнюю safe-зону
    const minTop = safe.top;
    const maxTop = vh - taskbarH - safe.bottom - 40;
    const minLeft = -rect.width + 80;
    const maxLeft = vw - 80;

    const newTop = Math.max(minTop, Math.min(rect.top, maxTop));
    const newLeft = Math.max(minLeft, Math.min(rect.left, maxLeft));

    win.style.top = newTop + 'px';
    win.style.left = newLeft + 'px';
  }

  focus(id) {
    const win = this.windows.get(id);
    if (win) win.style.zIndex = ++this.zIndex;
  }

  close(id) {
    const win = this.windows.get(id);
    if (win) {
      if (window.__audio) window.__audio.close();
      if (win._onResize) {
        window.removeEventListener('resize', win._onResize);
        window.removeEventListener('orientationchange', win._onResize);
      }
      win.remove();
      this.windows.delete(id);
    }
  }

  minimize(id) {
    const win = this.windows.get(id);
    if (win) win.style.display = win.style.display === 'none' ? 'flex' : 'none';
  }

  // === ПЕРЕТАСКИВАНИЕ ===
  _makeDraggable(win, handle, safe, taskbarH) {
    let offsetX = 0, offsetY = 0, dragging = false, activePointer = null;

    const start = (e) => {
      // Только левая кнопка мыши / основной палец
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest('.controls')) return; // не тащим за кнопки

      dragging = true;
      const rect = win.getBoundingClientRect();
      const cx = e.touches?.[0]?.clientX ?? e.clientX;
      const cy = e.touches?.[0]?.clientY ?? e.clientY;
      offsetX = cx - rect.left;
      offsetY = cy - rect.top;
      win.style.zIndex = ++this.zIndex;
      win.style.transition = 'none';

      if (e.pointerId !== undefined) activePointer = e.pointerId;
      e.preventDefault?.();
    };

    const move = (e) => {
      if (!dragging) return;
      if (activePointer !== null && e.pointerId !== undefined && e.pointerId !== activePointer) return;

      const cx = e.touches?.[0]?.clientX ?? e.clientX;
      const cy = e.touches?.[0]?.clientY ?? e.clientY;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = win.offsetWidth;
      const h = win.offsetHeight;

      let newLeft = cx - offsetX;
      let newTop = cy - offsetY;

      // Верхняя граница — safe-area + 4 (нельзя под кнопки Telegram)
      newTop = Math.max(safe.top + 4, Math.min(newTop, vh - taskbarH - safe.bottom - 40));
      // По горизонтали можно частично вылезать
      newLeft = Math.max(-w + 80, Math.min(newLeft, vw - 80));

      win.style.left = newLeft + 'px';
      win.style.top = newTop + 'px';
    };

    const end = () => {
      if (!dragging) return;
      dragging = false;
      activePointer = null;
      win.style.transition = '';
      this._clampWindow(win, safe, taskbarH);
    };

    // Mouse
    handle.addEventListener('mousedown', start);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);

    // Touch (iOS + Android)
    handle.addEventListener('touchstart', start, { passive: false });
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end);
    document.addEventListener('touchcancel', end);
  }
}
