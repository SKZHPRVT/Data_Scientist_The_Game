import { t } from '../../i18n/index.js';

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
    this.el.innerHTML = `
      <div class="start-item" data-action="terminal">${t('start_terminal')}</div>
      <div class="start-item" data-action="explorer">${t('start_files')}</div>
      <div class="start-divider"></div>
      <div class="start-item" data-action="progress">${t('start_progress')}</div>
      <div class="start-item" data-action="achievements">${t('start_achievements')}</div>
      <div class="start-item" data-action="cheats">${t('start_cheats')}</div>
      <div class="start-divider"></div>
      <div class="start-item" data-action="settings">${t('start_settings')}</div>
    `;
    this.root.querySelector('.desktop').appendChild(this.el);

    this.el.querySelectorAll('.start-item').forEach((item) => {
      item.onclick = () => {
        const action = item.dataset.action;
        this.handlers['on' + action.charAt(0).toUpperCase() + action.slice(1)]?.();
      };
    });

    setTimeout(() => {
      this._closeHandler = (e) => {
        if (!this.el) return;
        if (!this.el.contains(e.target) && !e.target.closest('#btn-start')) {
          this.destroy();
        }
      };
      document.addEventListener('click', this._closeHandler);
    }, 0);
  }

  destroy() {
    if (this._closeHandler) document.removeEventListener('click', this._closeHandler);
    this.el?.remove();
    this.el = null;
  }
}
