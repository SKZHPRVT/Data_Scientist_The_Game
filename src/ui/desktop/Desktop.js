import { Taskbar } from './Taskbar.js';
import { StartMenu } from './StartMenu.js';
import { WindowManager } from './WindowManager.js';
import { Terminal } from '../terminal/Terminal.js';
import { Explorer } from '../explorer/Explorer.js';
import { Settings, applyWallpaper } from '../settings/Settings.js';
import { Achievements } from '../achievements/Achievements.js';
import { Progress } from '../settings/Progress.js';
import { TaskView } from '../task/TaskView.js';
import { QuestMap } from '../quest/QuestMap.js';
import { GroupMap } from '../quest/GroupMap.js';
import { storage } from '../../core/storage.js';
import { progress } from '../../core/progress.js';

export class Desktop {
  constructor(root, tg) {
    this.root = root;
    this.tg = tg;
    this.windows = new WindowManager(root);
    this.startMenu = null;
    this.taskbar = null;

    window.addEventListener('open-explorer', (e) => this.openExplorer(e.detail));
    window.addEventListener('open-task', (e) => this.openTaskByPath(e.detail));
  }

  render() {
    this.root.innerHTML = `
      <div class="desktop" id="desktop">
        <div class="desktop-icons" id="icons"></div>
      </div>
    `;

    // Применяем сохранённые обои
    const wpId = storage.get('wallpaper', 'default');
    applyWallpaper(wpId);

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
      { icon: '🎯', label: 'JUNIOR', action: () => this.openGroupMap('junior') },
      { icon: '📁', label: 'SANDBOX', action: () => this.openSandbox() },
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
    if (this.startMenu) { this.startMenu.destroy(); this.startMenu = null; return; }
    this.startMenu = new StartMenu(this.root, {
      onTerminal: () => { this.openTerminal(); this.startMenu?.destroy(); this.startMenu = null; },
      onExplorer: () => { this.openExplorer('/'); this.startMenu?.destroy(); this.startMenu = null; },
      onProgress: () => { this.openProgress(); this.startMenu?.destroy(); this.startMenu = null; },
      onAchievements: () => { this.openAchievements(); this.startMenu?.destroy(); this.startMenu = null; },
      onSettings: () => { this.openSettings(); this.startMenu?.destroy(); this.startMenu = null; },
    });
    this.startMenu.render();
  }

  // =================== SANDBOX ===================
  openSandbox() {
    this.windows.create({
      id: 'sandbox',
      title: '🧪 SANDBOX',
      content: `
        <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.7; color: var(--fg);">
          <p style="font-size: 16px; color: var(--accent); font-weight: 700;">🧪 Песочница</p>
          <p style="margin-top: 16px;">Здесь можно экспериментировать с pandas без заданий и таймера.</p>
          <p style="margin-top: 12px; color: var(--fg-dim);">
            Функционал в разработке. Скоро:
          </p>
          <p>• Свободный ввод pandas-команд</p>
          <p>• Свой CSV-датасет</p>
          <p>• Сохранение скриптов</p>
          <p>• Графики (plotly)</p>
          <p style="margin-top: 16px;">А пока — используй <strong>Терминал</strong> для экспериментов.</p>
        </div>
      `,
      width: 480,
      height: 400,
    });
  }

  // =================== GROUP MAP ===================
  async openGroupMap(worldId) {
    const oldId = 'groupmap-' + worldId;
    if (this.windows.windows.has(oldId)) {
      this.windows.close(oldId);
      await new Promise((r) => setTimeout(r, 100));
    }

    const map = new GroupMap(worldId, {
      onOpenChapter: (chapterId) => this.openQuestMap(chapterId),
    });

    const win = this.windows.create({
      id: oldId,
      title: '🎯 ' + worldId.toUpperCase(),
      content: `<div style="font-family: var(--font-mono); color: var(--fg-dim);">Загрузка...</div>`,
      width: 520,
      height: 660,
    });

    win._questMap = map;
    win._mapType = 'group';
    win._worldId = worldId;

    try {
      await map.load();
      const bodyEl = win.querySelector('.window-body');
      bodyEl.innerHTML = map.render();
      map.mount(bodyEl);
    } catch (e) {
      console.error('[GroupMap]', e);
      const bodyEl = win.querySelector('.window-body');
      bodyEl.innerHTML = `
        <div style="color: var(--error); font-family: var(--font-mono); font-size: 12px;">
          <div>❌ Не могу загрузить мир</div>
          <pre style="margin-top: 8px; white-space: pre-wrap;">${e.message}</pre>
        </div>
      `;
    }
  }

  async refreshGroupMap(worldId) {
    const win = this.windows.windows.get('groupmap-' + worldId);
    if (!win || !win._questMap) return;
    try {
      await win._questMap.load();
      const bodyEl = win.querySelector('.window-body');
      bodyEl.innerHTML = win._questMap.render();
      win._questMap.mount(bodyEl);
    } catch (e) {
      console.error('[refreshGroupMap] fail', e);
    }
  }

  // =================== QUEST MAP ===================
  async openQuestMap(chapterId) {
    const oldId = 'questmap-' + chapterId;
    if (this.windows.windows.has(oldId)) {
      this.windows.close(oldId);
      await new Promise((r) => setTimeout(r, 100));
    }

    const map = new QuestMap(chapterId, {
      onOpenTask: (path) => this.openTaskByPath(path),
    });

    const win = this.windows.create({
      id: oldId,
      title: '🗺 ' + chapterId.split('/').pop(),
      content: `<div style="font-family: var(--font-mono); color: var(--fg-dim);">Загрузка...</div>`,
      width: 520,
      height: 660,
    });

    win._questMap = map;
    win._mapType = 'chapter';
    win._chapterId = chapterId;

    try {
      await map.load();
      const bodyEl = win.querySelector('.window-body');
      bodyEl.innerHTML = map.render();
      map.mount(bodyEl);
    } catch (e) {
      console.error('[QuestMap]', e);
      const bodyEl = win.querySelector('.window-body');
      bodyEl.innerHTML = `
        <div style="color: var(--error); font-family: var(--font-mono); font-size: 12px;">
          <div>❌ Не могу загрузить квесты</div>
          <pre style="margin-top: 8px; white-space: pre-wrap;">${e.message}</pre>
        </div>
      `;
    }
  }

  async refreshQuestMap(chapterId) {
    const win = this.windows.windows.get('questmap-' + chapterId);
    if (!win || !win._questMap) return;
    try {
      await win._questMap.load();
      const bodyEl = win.querySelector('.window-body');
      bodyEl.innerHTML = win._questMap.render();
      win._questMap.mount(bodyEl);
    } catch (e) {
      console.error('[refreshQuestMap] fail', e);
    }
  }

  // =================== TERMINAL / EXPLORER ===================
  openTerminal() {
    const term = new Terminal();
    this.windows.create({
      id: 'terminal',
      title: '⌨️ Терминал',
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
      let cleanPath = path.startsWith('/') ? path : '/' + path;
      const url = import.meta.env.BASE_URL + 'tasks' + cleanPath;
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const task = await res.json();
      task._path = cleanPath;
      this.openTask(task);
    } catch (e) {
      console.error('[openTaskByPath] fail', path, e);
      this.windows.create({
        id: 'task-error',
        title: '⚠ Ошибка задачи',
        content: `<div style="font-family: var(--font-mono); color: var(--error);">
          <div>Не могу открыть: <code>${path}</code></div>
          <pre style="margin-top: 8px; white-space: pre-wrap; color: var(--fg-dim);">${e.message}</pre>
        </div>`,
        width: 480,
        height: 240,
      });
    }
  }

  openTask(task) {
    this.windows.windows.forEach((_, id) => {
      if (id.startsWith('task-')) this.windows.close(id);
    });

    const view = new TaskView(task, {
      onSolved: () => this._onTaskSolved(task._path),
    });
    this.windows.create({
      id: 'task-' + task.id,
      title: '📄 ' + (task.title || task.id),
      content: view.render(),
      onMount: (body) => view.mount(body),
      width: 540,
      height: 700,
    });
  }

  async _onTaskSolved(currentPath) {
    const parts = currentPath.split('/').filter(Boolean);
    const worldId = parts[0];
    const chapterId = parts.slice(0, -1).join('/');
    const currentFile = parts[parts.length - 1];

    await this.refreshQuestMap(chapterId);
    await this.refreshGroupMap(worldId);

    this.windows.windows.forEach((_, id) => {
      if (id.startsWith('task-')) this.windows.close(id);
    });

    let tasks = [];
    let chapterComplete = false;
    try {
      const idxUrl = import.meta.env.BASE_URL + 'tasks/' + chapterId + '/index.json';
      const res = await fetch(idxUrl);
      const idx = await res.json();
      tasks = idx.tasks || [];

      const ids = tasks.map((t) => progress.makeId(chapterId + '/' + t));
      const solvedList = progress.getSolved();
      const solved = ids.filter((id) => solvedList.includes(id));
      chapterComplete = ids.length > 0 && solved.length >= ids.length;
    } catch (e) {}

    const currentIdx = tasks.indexOf(currentFile);
    const nextFile = currentIdx >= 0 && currentIdx < tasks.length - 1
      ? tasks[currentIdx + 1]
      : null;

    if (chapterComplete) {
      const groupWin = this.windows.windows.get('groupmap-' + worldId);
      if (groupWin) {
        groupWin.style.zIndex = ++this.windows.zIndex;
      } else {
        setTimeout(() => this.openGroupMap(worldId), 300);
      }
    } else if (nextFile) {
      const nextPath = '/' + chapterId + '/' + nextFile;
      setTimeout(() => this.openTaskByPath(nextPath), 250);
    } else {
      setTimeout(() => this.openQuestMap(chapterId), 300);
    }
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
          <p style="margin-top: 12px;">Ты — джун в DS-отделе.</p>
          <p style="margin-top: 12px;">Цель: пройти junior, получить ключ в middle.</p>
          <p style="margin-top: 16px;">Начни с карты JUNIOR.</p>
          <p style="margin-top: 16px;"><button class="taskbar-btn active" id="start-btn">[ НАЧАТЬ → ]</button></p>
        </div>
      `,
      width: 520,
      height: 420,
      onMount: (body) => {
        body.querySelector('#start-btn')?.addEventListener('click', () => {
          this.openGroupMap('junior');
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
      width: 520,
      height: 620,
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
      height: 600,
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
      height: 620,
    });
  }
}
