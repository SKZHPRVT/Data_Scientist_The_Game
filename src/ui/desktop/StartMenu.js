export class StartMenu {
  constructor(root, handlers) {
    this.root = root;
    this.handlers = handlers;
    this.el = null;
  }

  render() {
    this.el = document.createElement('div');
    this.el.className = 'start-menu';
    this.el.innerHTML = `
      <div class="start-item" data-action="terminal">⌨️ Терминал</div>
      <div class="start-item" data-action="explorer">📁 Файлы</div>
      <div class="start-divider"></div>
      <div class="start-item" data-action="progress">📊 Прогресс</div>
      <div class="start-item" data-action="achievements">🏆 Ачивки</div>
      <div class="start-divider"></div>
      <div class="start-item" data-action="settings">⚙️ Настройки</div>
    `;
    this.root.querySelector('.desktop').appendChild(this.el);

    this.el.querySelectorAll('.start-item').forEach((item) => {
      item.onclick = () => {
        const action = item.dataset.action;
        this.handlers['on' + action.charAt(0).toUpperCase() + action.slice(1)]?.();
      };
    });

    // Закрытие по клику вне
    setTimeout(() => {
      document.addEventListener('click', this._closeHandler = (e) => {
        if (!this.el.contains(e.target) && !e.target.closest('#btn-start')) {
          this.destroy();
        }
      });
    }, 0);
  }

  destroy() {
    this.el?.remove();
    this.el = null;
    document.removeEventListener('click', this._closeHandler);
  }
}
