export class Taskbar {
  constructor(root, handlers) {
    this.root = root;
    this.handlers = handlers;
  }

  render() {
    const bar = document.createElement('div');
    bar.className = 'taskbar';
    bar.innerHTML = `
      <button class="taskbar-btn" id="btn-start">🐧 Пуск</button>
      <button class="taskbar-btn" id="btn-term">⌨️ Терминал</button>
      <button class="taskbar-btn" id="btn-files">📁 Файлы</button>
      <button class="taskbar-btn" id="btn-ach">🏆 Ачивки</button>
      <button class="taskbar-btn" id="btn-prog">📊 Прогресс</button>
      <div class="taskbar-spacer"></div>
      <div class="taskbar-tray">
        <span id="clock">--:--</span>
      </div>
    `;
    this.root.querySelector('.desktop').appendChild(bar);

    bar.querySelector('#btn-start').onclick = this.handlers.onStart;
    bar.querySelector('#btn-term').onclick = this.handlers.onTerminal;
    bar.querySelector('#btn-files').onclick = this.handlers.onFiles;
    bar.querySelector('#btn-ach').onclick = this.handlers.onAchievements;
    bar.querySelector('#btn-prog').onclick = this.handlers.onProgress;

    this.updateClock();
    setInterval(() => this.updateClock(), 30000);
  }

  updateClock() {
    const el = document.getElementById('clock');
    if (!el) return;
    const now = new Date();
    el.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
}
