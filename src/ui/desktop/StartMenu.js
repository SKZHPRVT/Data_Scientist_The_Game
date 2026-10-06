export class StartMenu {
  constructor(root, handlers) {
    this.root = root;
    this.handlers = handlers;
    this.el = null;
    this._closeHandler = null;
  }

  render() {
    this.el = document.createElement('div');
    this.el.className = 'start-menu';

    // Определяем ориентацию
    const isLandscape = window.innerWidth > window.innerHeight;

    this.el.innerHTML = `
      <div class="start-item" data-action="terminal">⌨️ Терминал</div>
      <div class="start-item" data-action="explorer">📁 Файлы</div>
      <div class="start-divider"></div>
      <div class="start-item" data-action="progress">📊 Прогресс</div>
      <div class="start-item" data-action="achievements">🏆 Ачивки</div>
      <div class="start-divider"></div>
      <div class="start-item" data-action="settings">⚙️ Настройки</div>
    `;

    if (isLandscape) this.el.classList.add('landscape');

    this.root.querySelector('.desktop').appendChild(this.el);

    // Позиционируем по кнопке "Пуск"
    this._position();

    this.el.querySelectorAll('.start-item').forEach((item) => {
      item.onclick = () => {
        const action = item.dataset.action;
        this.handlers['on' + action.charAt(0).toUpperCase() + action.slice(1)]?.();
      };
    });

    // Закрытие по клику вне
    setTimeout(() => {
      this._closeHandler = (e) => {
        if (!this.el) return;
        if (!this.el.contains(e.target) && !e.target.closest('#btn-start')) {
          this.destroy();
        }
      };
      document.addEventListener('click', this._closeHandler);
      document.addEventListener('touchstart', this._closeHandler);
    }, 0);

    // Пересчёт при повороте
    this._resizeHandler = () => {
      if (this.el) this._position();
    };
    window.addEventListener('resize', this._resizeHandler);
    window.addEventListener('orientationchange', this._resizeHandler);
  }

  _position() {
    if (!this.el) return;

    const isLandscape = window.innerWidth > window.innerHeight;
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const taskbarH = 44;

    // Реальная safe-area
    const test = document.createElement('div');
    test.style.cssText = `
      position: fixed; top: 0; left: 0;
      padding-top: env(safe-area-inset-top, 0px);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      visibility: hidden;
    `;
    document.body.appendChild(test);
    const cs = getComputedStyle(test);
    const safeTop = parseFloat(cs.paddingTop) || 0;
    const safeBottom = parseFloat(cs.paddingBottom) || 0;
    test.remove();

    // Максимальная высота: от верхней safe-зоны до панели задач
    const maxHeight = vh - taskbarH - safeTop - safeBottom - 16;

    this.el.style.maxHeight = maxHeight + 'px';

    if (isLandscape) {
      // В ландшафте — широкое меню в 2 колонки
      this.el.style.width = Math.min(vw - 16, 520) + 'px';
      this.el.style.left = (8 + safeBottom) + 'px';
      this.el.style.right = 'auto';
    } else {
      this.el.style.width = '260px';
      this.el.style.left = '8px';
      this.el.style.right = 'auto';
    }

    // Позиция снизу: над панелью задач
    this.el.style.bottom = (taskbarH + 4) + 'px';
    this.el.style.top = 'auto';
  }

  destroy() {
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      window.removeEventListener('orientationchange', this._resizeHandler);
    }
    if (this._closeHandler) {
      document.removeEventListener('click', this._closeHandler);
      document.removeEventListener('touchstart', this._closeHandler);
    }
    this.el?.remove();
    this.el = null;
  }
}
