import { Taskbar } from './Taskbar.js';
import { StartMenu } from './StartMenu.js';
import { WindowManager } from './WindowManager.js';
import { Terminal } from '../terminal/Terminal.js';
import { Explorer } from '../explorer/Explorer.js';
import { Settings } from '../settings/Settings.js';
import { Achievements } from '../achievements/Achievements.js';
import { Progress } from '../settings/Progress.js';
import { TaskView } from '../task/TaskView.js';
import { QuestMap } from '../quest/QuestMap.js';
import { storage } from '../../core/storage.js';
import { progress } from '../../core/progress.js';

export class Desktop {
  constructor(root, tg) {
    this.root = root;
    this.tg = tg;
    this.windows = new WindowManager(root);
    this.startMenu = null;
    this.taskbar = null;
    this.wallpaper = storage.get('wallpaper', 'default');
    if (typeof this.wallpaper !== 'string') this.wallpaper = 'default';

    window.addEventListener('open-explorer', (e) => this.openExplorer(e.detail));
    window.addEventListener('open-task', (e) => this.openTaskByPath(e.detail));
    window.addEventListener('open-questmap', (e) => this.openQuestMap(e.detail));
  }

  render() {
    this.root.innerHTML = `
      <div class="desktop" id="desktop">
        <div class="desktop-icons" id="icons"></div>
      </div>
    `;

    this.renderIcons();

    this.taskbar = new Taskbar(this.root, {
      onStart: () => this.toggleStartMenu(),
      onTerminal: () => this.openTerminal(),
      onFiles: () => this.openExplorer('/'),
      onAchievements: () => this.openAchievements(),
      onProgress: () => this.openProgress(),
    });
    this.taskbar.render();

    setTimeout(() => {
      const solved = progress.getSolved();
      if (solved.length === 0) {
        window.__skipNextOpenSound = true;
        this.runGamePy();
      }
    }, 400);
  }

  renderIcons() {
    const icons = document.getElementById('icons');
    const items = [
      // JUNIOR — открывает карту квестов, а не Explorer
      { icon: '🎯', label: 'JUNIOR', action: () => this.openQuestMap('junior/basics') },
      { icon: '📁', label: 'SANDBOX', action: () => this.openExplorer('/sandbox') },
      { icon: '📄', label: 'README.txt', action: () => this.openReadme() },
      { icon: '🐍', label: 'game.py', action: () => this.runGamePy() },
      { icon: '⌨️', label: 'Терминал', action: () => this.openTerminal() },
    ];

    icons.innerHTML = items
      .map((item, i) => `
        <div class="desktop-icon" data-idx="${i}">
          <div class="icon">${item.icon}</div>
          <div class="label">${item.label}</div>
        </div>
      `)
      .join('');

    icons.querySelectorAll('.desktop-icon').forEach((el) => {
      el.addEventListener('click', () => {
        this.tg.haptic('light');
        items[+el.dataset.idx].action();
      });
    });
  }

  toggleStartMenu() {
    this.tg.haptic('light');
    if (this.startMenu) {
      this.startMenu.destroy();
      this.startMenu = null;
      return;
    }
    this.startMenu = new StartMenu(this.root, {
      onTerminal: () => { this.openTerminal(); this.startMenu?.destroy(); this.startMenu = null; },
      onExplorer: () => { this.openExplorer('/'); this.startMenu?.destroy(); this.startMenu = null; },
      onProgress: () => { this.openProgress(); this.startMenu?.destroy(); this.startMenu = null; },
      onAchievements: () => { this.openAchievements(); this.startMenu?.destroy(); this.startMenu = null; },
      onSettings: () => { this.openSettings(); this.startMenu?.destroy(); this.startMenu = null; },
    });
    this.startMenu.render();
  }

  async openQuestMap(chapterId) {
    const map = new QuestMap(chapterId, {
      onOpenTask: (path) => this.openTaskByPath(path),
    });

    // Открываем окно сразу с "Загрузка..."
    const win = this.windows.create({
      id: 'questmap-' + chapterId,
      title: '🗺 ' + (chapterId.split('/').pop()),
      content: `<div style="font-family: var(--font-mono); color: var(--fg-dim);">Загрузка...</div>`,
      width: 520,
      height: 640,
    });

    try {
      await map.load();
      // Обновляем содержимое окна
      const bodyEl = win.querySelector('.window-body');
      bodyEl.innerHTML = map.render();
      map.mount(bodyEl);
    } catch (e) {
      const bodyEl = win.querySelector('.window-body');
      bodyEl.innerHTML = `<div style="color: var(--error); font-family: var(--font-mono);">
        Не могу загрузить квесты: ${e.message}
      </div>`;
    }
  }

  openTerminal() {
    const term = new Terminal();
    this.windows.create({
      id: 'terminal',
      title: '⌨️ Терминал (хардкор)',
      content: term.render(),
      onMount: (body) => term.mount(body),
      width: 640,
      height: 420,
    });
  }

  openExplorer(path) {
    const explorer = new Explorer(path, {
      onOpenFile: (file) => this.openFile(file),
    });
    this.windows.create({
      id: 'explorer-' + path.replace(/\//g, '_'),
      title: '📁 ' + path,
      content: explorer.render(),
      onMount: (body) => explorer.mount(body),
      width: 560,
      height: 420,
    });
  }

  openFile(file) {
    if (file.endsWith('.py')) this.runGamePy();
    else if (file.endsWith('.txt')) this.openReadme();
    else if (file.endsWith('.json')) this.openTaskByPath(file);
  }

  async openTaskByPath(path) {
    try {
      let raw = null;

      try { raw = window.__fs.readFile(path); } catch (e) {}

      let isStub = false;
      if (raw) {
        try {
          const test = JSON.parse(raw);
          if (test._stub || test.id === undefined) isStub = true;
        } catch (e) { isStub = true; }
      }

      if (!raw || isStub) {
        const url = import.meta.env.BASE_URL + 'tasks' + path;
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        raw = await res.text();
        try { window.__fs.mount(path, raw); } catch (e) {}
      }

      const task = JSON.parse(raw);
      task._path = path;
      this.openTask(task);
    } catch (e) {
      console.error('Не могу открыть задачу', path, e);
    }
  }

  openTask(task) {
    this.windows.windows.forEach((_, id) => {
      if (id.startsWith('task-')) this.windows.close(id);
    });

    const view = new TaskView(task, {
      onSolved: () => this._openNextTask(task._path),
    });
    this.windows.create({
      id: 'task-' + task.id,
      title: '📄 ' + (task.title || task.id),
      content: view.render(),
      onMount: (body) => view.mount(body),
      width: 540,
      height: 660,
    });
  }

  _openNextTask(currentPath) {
    // currentPath: /junior/basics/task1.json
    const parts = currentPath.split('/').filter(Boolean); // ["junior", "basics", "task1.json"]
    const chapterId = parts.slice(0, -1).join('/'); // "junior/basics"

    // Закрываем окно задачи
    this.windows.windows.forEach((_, id) => {
      if (id.startsWith('task-')) this.windows.close(id);
    });

    // Открываем карту квестов заново — она покажет обновлённый прогресс
    setTimeout(() => this.openQuestMap(chapterId), 200);
  }

  openReadme() {
    let content = 'README.txt';
    try { content = window.__fs.readFile('/README.txt'); } catch (e) {}
    this.windows.create({
      id: 'readme',
      title: '📄 README.txt',
      content: `<div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.7; color: var(--fg); white-space: pre-wrap;">${content}</div>`,
      width: 480,
      height: 360,
    });
  }

  runGamePy() {
    this.windows.create({
      id: 'gamepy',
      title: '🐍 game.py',
      content: `
        <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.7; color: var(--fg);">
          <p class="terminal-success">$ python game.py</p>
          <p style="margin-top: 16px;">Привет.</p>
          <p style="margin-top: 12px;">Ты — джун в DS-отделе. Тебе дали доступ к сырым данным.</p>
          <p style="margin-top: 12px;">Цель: пройти junior, получить ключ в middle.</p>
          <p style="margin-top: 12px;">Условия:</p>
          <p>• Закрой basics, cleaning, grouping</p>
          <p>• Победи 3 боссов</p>
          <p>• Набери 80 звёзд из 120</p>
          <p style="margin-top: 16px;">Начни с квестов в junior/basics/.</p>
          <p style="margin-top: 16px;"><button class="taskbar-btn active" id="start-btn">[ НАЧАТЬ → ]</button></p>
        </div>
      `,
      width: 520,
      height: 420,
      onMount: (body) => {
        body.querySelector('#start-btn')?.addEventListener('click', () => {
          this.openQuestMap('junior/basics');
        });
      },
    });
  }

  openProgress() {
    const progressView = new Progress();
    this.windows.create({
      id: 'progress',
      title: '📊 Прогресс',
      content: progressView.render(),
      onMount: (body) => progressView.mount(body),
      width: 480,
      height: 480,
    });
  }

  openAchievements() {
    const ach = new Achievements();
    this.windows.create({
      id: 'achievements',
      title: '🏆 Ачивки',
      content: ach.render(),
      onMount: (body) => ach.mount(body),
      width: 520,
      height: 480,
    });
  }

  openSettings() {
    const settings = new Settings(this);
    this.windows.create({
      id: 'settings',
      title: '⚙️ Настройки',
      content: settings.render(),
      onMount: (body) => settings.mount(body),
      width: 480,
      height: 520,
    });
  }
}
