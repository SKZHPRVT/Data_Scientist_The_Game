import { Taskbar } from './Taskbar.js';
import { StartMenu } from './StartMenu.js';
import { WindowManager } from './WindowManager.js';
import { Terminal } from '../terminal/Terminal.js';
import { Explorer } from '../explorer/Explorer.js';
import { Settings } from '../settings/Settings.js';
import { Achievements } from '../achievements/Achievements.js';
import { Progress } from '../settings/Progress.js';

export class Desktop {
  constructor(root, tg) {
    this.root = root;
    this.tg = tg;
    this.windows = new WindowManager(root);
    this.startMenu = null;
    this.taskbar = null;
    this.wallpaper = localStorage.getItem('wallpaper') || 'default';
  }

  render() {
    this.root.innerHTML = `
      <div class="desktop" id="desktop" style="background-image: url('/assets/wallpapers/${this.wallpaper}.jpg')">
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

    // Автозапуск: открываем README и game.py
    this.showWelcome();
  }

  renderIcons() {
    const icons = document.getElementById('icons');
    const items = [
      { icon: '📁', label: 'JUNIOR', action: () => this.openExplorer('/junior') },
      { icon: '📁', label: 'SANDBOX', action: () => this.openExplorer('/sandbox') },
      { icon: '📄', label: 'README.txt', action: () => this.openReadme() },
      { icon: '🐍', label: 'game.py', action: () => this.runGamePy() },
      { icon: '⌨️', label: 'Терминал', action: () => this.openTerminal() },
    ];

    icons.innerHTML = items
      .map(
        (item, i) => `
        <div class="desktop-icon" data-idx="${i}">
          <div class="icon">${item.icon}</div>
          <div class="label">${item.label}</div>
        </div>
      `
      )
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

  openTerminal() {
    const term = new Terminal();
    this.windows.create({
      id: 'terminal',
      title: 'Терминал',
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
      id: 'explorer-' + path,
      title: '📁 ' + path,
      content: explorer.render(),
      onMount: (body) => explorer.mount(body),
      width: 560,
      height: 400,
    });
  }

  openFile(file) {
    if (file.endsWith('.py')) this.runGamePy();
    if (file.endsWith('.txt')) this.openReadme();
    if (file.endsWith('.json')) this.openTask(file);
  }

  openTask(file) {
    // Открыть задачу в терминале
    this.openTerminal();
  }

  openReadme() {
    this.windows.create({
      id: 'readme',
      title: '📄 README.txt',
      content: `
        <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.7; color: var(--fg);">
          <p><strong>Джун. Добро пожаловать.</strong></p>
          <p style="margin-top: 12px;">Ты не будешь учить синтаксис. Ты будешь решать задачи.</p>
          <p style="margin-top: 12px;">В <code>junior/</code> — твой путь. Начни с <code>basics/</code>.</p>
          <p style="margin-top: 12px;">Если застрянешь — <code>side_quests/</code>. За них дают звёзды.</p>
          <p style="margin-top: 12px; color: var(--fg-dim);">— Тимлид</p>
        </div>
      `,
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
          <p style="margin-top: 16px;">Начни с README.txt в basics/.</p>
          <p style="margin-top: 16px;"><button class="taskbar-btn active" id="start-btn">[ НАЧАТЬ → ]</button></p>
        </div>
      `,
      width: 520,
      height: 420,
      onMount: (body) => {
        body.querySelector('#start-btn')?.addEventListener('click', () => {
          this.openExplorer('/junior/basics');
        });
      },
    });
  }

  openProgress() {
    const progress = new Progress();
    this.windows.create({
      id: 'progress',
      title: '📊 Прогресс',
      content: progress.render(),
      onMount: (body) => progress.mount(body),
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

  showWelcome() {
    // Первый запуск — показать game.py
    setTimeout(() => this.runGamePy(), 300);
  }
}
