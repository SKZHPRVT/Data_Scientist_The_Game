export class WindowManager {
  constructor(root) {
    this.root = root;
    this.windows = new Map();
    this.zIndex = 100;
    this.offset = 0;
    this._safeCache = null;
    this._refitTimers = new WeakMap();

    // Следим за изменением окна — сбрасываем кэш
    window.addEventListener('resize', () => { this._safeCache = null; });
    window.addEventListener('orientationchange', () => {
      this._safeCache = null;
      // Пересчитываем каждое окно с задержкой (важно для Telegram)
      setTimeout(() => this._refitAll(), 100);
      setTimeout(() => this._refitAll(), 400);
      setTimeout(() => this._refitAll(), 800);
    });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        this._safeCache = null;
        // НЕ вызываем _refitAll при клавиатуре — окна прыгают
      });
    }
  }

  // === ПЕРЕСЧИТАТЬ ВСЕ ОКНА ===
  _refitAll() {
    this.windows.forEach((win) => this._refitWindow(win));
  }

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

    // Доп. отступ ТОЛЬКО в портрете (в ландшафте Telegram убирает верхнюю панель)
    const isPortrait = window.innerHeight >= window.innerWidth;
    const telegramOffset = isPortrait ? 52 : 0;
    result.top = Math.max(result.top, 0) + telegramOffset;

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
    const padding = 8;

    const availableW = vw - safe.left - safe.right - padding * 2;
    const availableH = vh - safe.top - safe.bottom - taskbarH - padding * 2;

    const finalW = Math.min(width, availableW);
    const finalH = Math.min(height, availableH);

    this.offset = (this.offset + 1) % 5;
    const defaultLeft = Math.max(
      safe.left + padding,
      Math.min(safe.left + padding + this.offset * 20, vw - finalW - safe.right - padding)
    );
    const defaultTop = Math.max(safe.top + padding + this.offset * 12, safe.top + 8);

    const win = document.createElement('div');
    win.className = 'window';
    win.style.width = finalW + 'px';
    win.style.height = finalH + 'px';
    win.style.left = defaultLeft + 'px';
    win.style.top = defaultTop + 'px';
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

    this._makeDraggable(win, win.querySelector('.window-title'), taskbarH);

    if (window.__audio && !window.__skipNextOpenSound) {
      window.__audio.open();
    }
    window.__skipNextOpenSound = false;

    if (onMount) onMount(win.querySelector('.window-body'));

    return win;
  }

  // === ПОДГОНЯЕМ РАЗМЕРЫ И ПОЗИЦИЮ ПОД ЭКРАН ===
  _refitWindow(win) {
    if (!win || !win.parentNode) return;

    const vw = window.innerWidth;
    // Берём МАКСИМУМ из innerHeight и visualViewport.height —
    // чтобы клавиатура НЕ заставляла окна сжиматься
    const vh = Math.max(
      window.innerHeight,
      window.visualViewport?.height || 0
    );
    const taskbarH = 44;
    const safe = this._getSafeArea();
    const padding = 8;

    const availableW = vw - safe.left - safe.right - padding * 2;
    const availableH = vh - safe.top - safe.bottom - taskbarH - padding * 2;

    const currentW = win.offsetWidth;
    const currentH = win.offsetHeight;

    // Желаемый размер — из dataset или текущий
    const desiredW = parseFloat(win.dataset.desiredW || currentW);
    const desiredH = parseFloat(win.dataset.desiredH || currentH);

    if (!win.dataset.desiredW) win.dataset.desiredW = currentW;
    if (!win.dataset.desiredH) win.dataset.desiredH = currentH;

    const targetW = Math.min(desiredW, availableW);
    const targetH = Math.min(desiredH, availableH);

    win.style.width = targetW + 'px';
    win.style.height = targetH + 'px';

    this._clampWindow(win, taskbarH);
  }

  _clampWindow(win, taskbarH) {
    if (!win || !win.parentNode) return;

    const vw = window.innerWidth;
    // МАКСИМУМ из innerHeight и visualViewport.height — клавиатура НЕ сдвигает окна
    const vh = Math.max(
      window.innerHeight,
      window.visualViewport?.height || 0
    );
    const safe = this._getSafeArea();
    const padding = 8;

    const rect = win.getBoundingClientRect();

    // Границы, куда окно может попасть
    const minLeft = safe.left + padding;
    const maxLeft = Math.max(minLeft, vw - rect.width - safe.right - padding);
    const minTop = safe.top + padding;
    const maxTop = Math.max(minTop, vh - rect.height - taskbarH - safe.bottom - padding);

    const newLeft = Math.max(minLeft, Math.min(rect.left, maxLeft));
    const newTop = Math.max(minTop, Math.min(rect.top, maxTop));

    win.style.left = newLeft + 'px';
    win.style.top = newTop + 'px';
  }

  focus(id) {
    const win = this.windows.get(id);
    if (win) win.style.zIndex = ++this.zIndex;
  }

  close(id) {
    const win = this.windows.get(id);
    if (win) {
      if (window.__audio) window.__audio.close();
      clearTimeout(this._refitTimers.get(win));
      win.remove();
      this.windows.delete(id);
    }
  }

  minimize(id) {
    const win = this.windows.get(id);
    if (win) win.style.display = win.style.display === 'none' ? 'flex' : 'none';
  }

  _makeDraggable(win, handle, taskbarH) {
    let offsetX = 0, offsetY = 0, dragging = false, activePointer = null;

    const start = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      if (e.target.closest('.controls')) return;

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
      const safe = this._getSafeArea();
      const padding = 8;

      const minLeft = safe.left + padding;
      const maxLeft = Math.max(minLeft, vw - w - safe.right - padding);
      const minTop = safe.top + padding;
      const maxTop = Math.max(minTop, vh - h - taskbarH - safe.bottom - padding);

      let newLeft = cx - offsetX;
      let newTop = cy - offsetY;

      newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
      newTop = Math.max(minTop, Math.min(newTop, maxTop));

      win.style.left = newLeft + 'px';
      win.style.top = newTop + 'px';
    };

    const end = () => {
      if (!dragging) return;
      dragging = false;
      activePointer = null;
      win.style.transition = '';
    };

    handle.addEventListener('mousedown', start);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);

    handle.addEventListener('touchstart', start, { passive: false });
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end);
    document.addEventListener('touchcancel', end);
  }
}
