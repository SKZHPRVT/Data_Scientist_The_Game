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
import { t } from '../../i18n/index.js';

const CHEAT_HINTS = {
  basics: { code: 'FILTER', text: 'Найдёшь первое знамение, если вспомнишь про фильтрацию. Код: FILTER' },
  cleaning: { code: 'CLEAN', text: 'Ты чистюля. И слово подходящее. Код: CLEAN' },
  grouping: { code: 'CONNECT', text: 'Связующий — тот, кто соединяет. Код: CONNECT' },
  merging: { code: 'DIVIDE', text: 'Разделяй — и понимай. Код: DIVIDE' },
  datetime: { code: 'COFFEE', text: 'Даты и время... до 3 ночи... Код: COFFEE' },
  strings: { code: 'NAN', text: 'Тексты и пропуски. Слово из 3 букв. Код: NAN' },
  bosses: { code: 'OVERFIT', text: 'Идеальный на трейне — но не на тесте. Код: OVERFIT' },
};

export class Desktop {
  constructor(root, tg) {
    this.root = root;
    this.tg = tg;
    this.windows = new WindowManager(root);
    this.startMenu = null;
    this.taskbar = null;

    window.addEventListener('open-explorer', (e) => this.openExplorer(e.detail));
    window.addEventListener('open-task', (e) => this.openTaskByPath(e.detail));
    window.addEventListener('lang-change', () => {
      // Перерисовываем рабочий стол
      this._rerender();
    });
  }

  _rerender() {
    // Закрываем все окна
    this.windows.windows.forEach((_, id) => this.windows.close(id));
    this.startMenu?.destroy();
    this.startMenu = null;
    this.root.innerHTML = '';
    this.render();
  }

  render() {
    this.root.innerHTML = `
      <div class="desktop" id="desktop">
        <div class="desktop-icons" id="icons"></div>
      </div>
    `;

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
      { icon: '🎯', label: t('desktop_junior'), action: () => this.openGroupMap('junior') },
      { icon: '📁', label: t('desktop_sandbox'), action: () => this.openSandbox() },
      { icon: '📄', label: t('desktop_readme'), action: () => this.openReadme() },
      { icon: '🐍', label: t('desktop_gamepy'), action: () => this.runGamePy() },
      { icon: '⌨️', label: t('desktop_terminal'), action: () => this.openTerminal() },
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
      onCheats: () => { this.openCheats(); this.startMenu?.destroy(); this.startMenu = null; },
      onSettings: () => { this.openSettings(); this.startMenu?.destroy(); this.startMenu = null; },
    });
    this.startMenu.render();
  }

  openSandbox() {
    this.windows.create({
      id: 'sandbox',
      title: '🧪 ' + t('desktop_sandbox'),
      content: `
        <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.7; color: var(--fg);">
          <p style="font-size: 16px; color: var(--accent); font-weight: 700;">${t('sandbox_title')}</p>
          <p style="margin-top: 16px;">${t('sandbox_desc')}</p>
          <p style="margin-top: 12px; color: var(--fg-dim);">${t('sandbox_soon')}</p>
          <p>${t('sandbox_item1')}</p>
          <p>${t('sandbox_item2')}</p>
          <p>${t('sandbox_item3')}</p>
          <p>${t('sandbox_item4')}</p>
          <p style="margin-top: 16px;">${t('sandbox_use_terminal')}</p>
        </div>
      `,
      width: 480,
      height: 400,
    });
  }

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
      content: `<div style="font-family: var(--font-mono); color: var(--fg-dim);">${t('progress_loading')}</div>`,
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
      bodyEl.innerHTML = `<div style="color: var(--error); font-family: var(--font-mono); font-size: 12px;">
        <div>❌ ${e.message}</div>
      </div>`;
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
    } catch (e) {}
  }

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
      content: `<div style="font-family: var(--font-mono); color: var(--fg-dim);">${t('progress_loading')}</div>`,
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
      bodyEl.innerHTML = `<div style="color: var(--error); font-family: var(--font-mono); font-size: 12px;">
        <div>❌ ${e.message}</div>
      </div>`;
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
    } catch (e) {}
  }

  openTerminal() {
    const term = new Terminal();
    this.windows.create({
      id: 'terminal',
      title: '⌨️ ' + t('desktop_terminal'),
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
      const ids = tasks.map((x) => progress.makeId(chapterId + '/' + x));
      const solvedList = progress.getSolved();
      const solved = ids.filter((id) => solvedList.includes(id));
      chapterComplete = ids.length > 0 && solved.length >= ids.length;
    } catch (e) {}

    const currentIdx = tasks.indexOf(currentFile);
    const nextFile = currentIdx >= 0 && currentIdx < tasks.length - 1
      ? tasks[currentIdx + 1]
      : null;

    if (chapterComplete) {
      // Показываем намёк на чит-код
      const chId = chapterId.split('/').pop();
      const hint = CHEAT_HINTS[chId];
      if (hint) {
        setTimeout(() => {
          this.windows.create({
            id: 'cheat-hint-' + chId,
            title: '🗝 Намёк на чит-код',
            content: `
              <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.7; color: var(--fg);">
                <p style="color: var(--warn); font-size: 15px; font-weight: 700;">🗝 НАМЁК НА ЧИТ-КОД</p>
                <p style="margin-top: 16px;">${hint.text}</p>
                <p style="margin-top: 16px; color: var(--fg-dim);">Открой <strong>Пуск → 🗝 Чит-коды</strong> и введи этот код.</p>
              </div>
            `,
            width: 440,
            height: 280,
          });
        }, 800);
      }

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
    let content = t('readme_title');
    try { content = window.__fs.readFile('/README.txt'); } catch (e) {}
    this.windows.create({
      id: 'readme',
      title: '📄 ' + t('desktop_readme'),
      content: `<div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.7; color: var(--fg); white-space: pre-wrap;">${content}</div>`,
      width: 480,
      height: 360,
    });
  }

  runGamePy() {
    this.windows.create({
      id: 'gamepy',
      title: '🐍 ' + t('desktop_gamepy'),
      content: `
        <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.7; color: var(--fg);">
          <p class="terminal-success">$ python game.py</p>
          <p style="margin-top: 16px;">${t('gamepy_title')}</p>
          <p style="margin-top: 12px;">${t('gamepy_line1')}</p>
          <p style="margin-top: 12px;">${t('gamepy_line2')}</p>
          <p style="margin-top: 16px;">${t('gamepy_line3')}</p>
          <p style="margin-top: 16px;"><button class="taskbar-btn active" id="start-btn">${t('gamepy_start')}</button></p>
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
      title: '📊 ' + t('taskbar_progress'),
      content: progressView.render(),
      onMount: (body) => progressView.mount(body),
      width: 520,
      height: 620,
    });
  }

  openAchievements() {
    const ach = new Achievements({ mode: 'achievements' });
    this.windows.create({
      id: 'achievements',
      title: '🏆 ' + t('taskbar_achievements'),
      content: ach.render(),
      onMount: (body) => ach.mount(body),
      width: 520,
      height: 600,
    });
  }

  openCheats() {
    const ach = new Achievements({ mode: 'cheats' });
    this.windows.create({
      id: 'cheats',
      title: '🗝 ' + t('cheats_title'),
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
      title: '⚙️ ' + t('settings_title'),
      content: settings.render(),
      onMount: (body) => settings.mount(body),
      width: 480,
      height: 620,
    });
  }
}
