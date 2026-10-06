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
import { showRewardPopup } from '../rewards/RewardPopup.js';
import { JuniorFinale } from '../rewards/JuniorFinale.js';
import { SeniorFinale } from '../rewards/SeniorFinale.js';
import { storage } from '../../core/storage.js';
import {
  progress, rewards,
  isJuniorComplete, isMiddleComplete, isSeniorComplete,
} from '../../core/progress.js';
import { CHAPTER_REWARDS } from '../../core/rewards.js';
import { DEV_UNLOCK_ALL } from '../../core/dev.js';

const CHEAT_HINTS = {
  // JUNIOR
  basics: 'Найдёшь первое знамение, если вспомнишь про фильтрацию. Код: FILTER',
  cleaning: 'Ты чистюля. И слово подходящее. Код: CLEAN',
  grouping: 'Связующий — тот, кто соединяет. Код: CONNECT',
  merging: 'Разделяй — и понимай. Код: DIVIDE',
  datetime: 'Даты и время... до 3 ночи... Код: COFFEE',
  strings: 'Тексты и пропуски. Слово из 3 букв. Код: NAN',
  bosses: 'Идеальный на трейне — но не на тесте. Код: OVERFIT',
  // MIDDLE
  pipelines: 'Весь путь в одном объекте. Код: PIPELINE',
  features: 'Создай признаки — выиграй соревнование. Код: FEATURES_MASTER',
  models: 'Обучи, сохрани, переиспользуй. Код: MODEL_MASTER',
  eval: 'Accuracy врёт при дисбалансе. Код: EVAL_MASTER',
  experiments: 'A/B — не гадай, а проверяй. Код: AB_MASTER',
  // SENIOR
  incidents: 'Прод упал в 3 ночи — собери логи. Код: INCIDENT',
  research: 'Читай статьи, а не только туториалы. Код: RESEARCH',
  mentoring: 'Объясни джуну то, что сам знаешь. Код: MENTOR',
  architecture: 'Сначала схема — потом код. Код: ARCHITECT',
  final: 'Divide et Impera. Код: MASTER_SIGNAL',
};

export class Desktop {
  constructor(root, tg) {
    this.root = root;
    this.tg = tg;
    this.windows = new WindowManager(root);
    this.startMenu = null;
    this.taskbar = null;
    this.juniorDone = false;
    this.middleDone = false;
    this.seniorDone = false;

    window.addEventListener('open-explorer', (e) => this.openExplorer(e.detail));
    window.addEventListener('open-task', (e) => this.openTaskByPath(e.detail));
    window.addEventListener('lang-change', () => this._rerender());
  }

  _rerender() {
    this.windows.windows.forEach((_, id) => this.windows.close(id));
    this.startMenu?.destroy();
    this.startMenu = null;
    this.root.innerHTML = '';
    this.render();
  }

  async render() {
    this.juniorDone = DEV_UNLOCK_ALL ? true : await isJuniorComplete();
    this.middleDone = DEV_UNLOCK_ALL ? true : await isMiddleComplete();
    this.seniorDone = DEV_UNLOCK_ALL ? true : await isSeniorComplete();

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

    if (!DEV_UNLOCK_ALL) {
      if (this.juniorDone && !rewards.isUnlocked('junior_finale_shown')) {
        setTimeout(() => this._showJuniorFinale(), 800);
      } else if (this.seniorDone && !rewards.isUnlocked('senior_finale_shown')) {
        setTimeout(() => this._showSeniorFinale(), 800);
      }
      setTimeout(() => {
        const solved = progress.getSolved();
        if (solved.length === 0) {
          window.__skipNextOpenSound = true;
          this.runGamePy();
        }
      }, 400);
    }
  }

  renderIcons() {
    const icons = document.getElementById('icons');
    const items = [
      { icon: '🎯', label: 'JUNIOR', action: () => this.openGroupMap('junior') },
      { icon: '🚀', label: 'MIDDLE', action: () => this.openWorldGate('middle') },
      { icon: '👑', label: 'SENIOR', action: () => this.openWorldGate('senior') },
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
      onCheats: () => { this.openCheats(); this.startMenu?.destroy(); this.startMenu = null; },
      onSettings: () => { this.openSettings(); this.startMenu?.destroy(); this.startMenu = null; },
    });
    this.startMenu.render();
  }

  async openWorldGate(worldId) {
    if (DEV_UNLOCK_ALL) {
      this.openGroupMap(worldId);
      return;
    }
    if (worldId === 'middle' && this.juniorDone) {
      this.openGroupMap('middle');
      return;
    }
    if (worldId === 'senior' && this.middleDone) {
      this.openGroupMap('senior');
      return;
    }
    const text = this._getGateText(worldId);
    this.windows.create({
      id: 'worldgate-' + worldId,
      title: '⚡ ' + worldId.toUpperCase() + '.gate',
      content: `<div class="terminal"></div>`,
      onMount: (body) => {
        const termEl = body.querySelector('.terminal');
        this._runGateScript(termEl, text);
      },
      width: 540,
      height: 440,
    });
  }

  _getGateText(worldId) {
    const isJuniorDone = this.juniorDone;
    const isMiddleDone = this.middleDone;

    if (worldId === 'middle') {
      if (isJuniorDone) {
        return [
          { type: 'cmd', text: 'cd middle/' },
          { type: 'ok', text: '✓ Доступ разрешён' },
          { type: 'info', text: '' },
          { type: 'info', text: 'MIDDLE — мир инженера.' },
          { type: 'info', text: 'Тут строят пайплайны, обучают модели,' },
          { type: 'info', text: 'считают метрики и дебажат прод.' },
        ];
      }
      return [
        { type: 'cmd', text: 'cd middle/' },
        { type: 'err', text: '✗ Permission denied' },
        { type: 'err', text: 'ACCESS_DENIED: junior_not_complete' },
        { type: 'info', text: '' },
        { type: 'info', text: 'MIDDLE — мир инженера.' },
        { type: 'info', text: 'Здесь начинают строить настоящие пайплайны:' },
        { type: 'info', text: 'clean → features → train → eval → deploy.' },
        { type: 'info', text: '' },
        { type: 'warn', text: '🔑 Требуется: пройти JUNIOR полностью.' },
      ];
    }

    if (worldId === 'senior') {
      if (isMiddleDone) {
        return [
          { type: 'cmd', text: 'cd senior/' },
          { type: 'ok', text: '✓ Доступ разрешён' },
          { type: 'info', text: '' },
          { type: 'info', text: 'SENIOR — мир архитектора.' },
          { type: 'info', text: 'Тут падает прод. Горят дедлайны.' },
          { type: 'info', text: 'Это не про код. Это про решения.' },
        ];
      }
      return [
        { type: 'cmd', text: 'cd senior/' },
        { type: 'err', text: '✗ Permission denied' },
        { type: 'err', text: 'ACCESS_DENIED: middle_not_complete' },
        { type: 'info', text: '' },
        { type: 'info', text: 'SENIOR — мир архитектора.' },
        { type: 'info', text: 'Сюда приходят те, кто видел, как падает прод в 3 ночи.' },
        { type: 'info', text: '' },
        { type: 'warn', text: '🔑 Требуется: пройти MIDDLE полностью.' },
      ];
    }

    return [{ type: 'info', text: 'Доступ запрещён.' }];
  }

  _runGateScript(el, lines, onDone) {
    if (!el) return;
    let i = 0;
    const typeLine = () => {
      if (i >= lines.length) {
        const cursor = document.createElement('div');
        cursor.className = 'terminal-line';
        cursor.innerHTML = `<span class="terminal-prompt">$ </span><span class="gate-cursor">▊</span>`;
        el.appendChild(cursor);
        el.scrollTop = el.scrollHeight;
        if (onDone) onDone();
        return;
      }
      const line = lines[i];
      const div = document.createElement('div');
      let cls = '';
      let prefix = '';
      if (line.type === 'cmd') { cls = ''; prefix = '$ '; }
      else if (line.type === 'ok') { cls = 'terminal-success'; }
      else if (line.type === 'err') { cls = 'terminal-error'; }
      else if (line.type === 'warn') { cls = 'terminal-warn'; }
      div.className = 'terminal-line ' + cls;
      div.textContent = prefix + line.text;
      el.appendChild(div);
      el.scrollTop = el.scrollHeight;
      i++;
      if (window.__audio && line.text && line.text.length > 0) {
        try { window.__audio.key('normal'); } catch (e) {}
      }
      let delay = 150;
      if (line.type === 'err') delay = 300;
      if (line.type === 'cmd') delay = 400;
      if (line.type === 'warn') delay = 250;
      if (line.text === '') delay = 40;
      setTimeout(typeLine, delay);
    };
    setTimeout(typeLine, 300);
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
      content: `<div style="font-family: var(--font-mono); color: var(--fg-dim);">Загрузка...</div>`,
      width: 520,
      height: 660,
    });

    win._questMap = map;
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
      content: `<div style="font-family: var(--font-mono); color: var(--fg-dim);">Загрузка...</div>`,
      width: 520,
      height: 660,
    });

    win._questMap = map;
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
    let chapterPerfect = false;
    try {
      const idxUrl = import.meta.env.BASE_URL + 'tasks/' + chapterId + '/index.json';
      const res = await fetch(idxUrl);
      const idx = await res.json();
      tasks = idx.tasks || [];
      const ids = tasks.map((x) => progress.makeId(chapterId + '/' + x));
      const solvedList = progress.getSolved();
      const solved = ids.filter((id) => solvedList.includes(id));
      chapterComplete = ids.length > 0 && solved.length >= ids.length;
      chapterPerfect = ids.length > 0 && ids.every((id) => progress.getStars(id) === 4);
    } catch (e) {}

    const currentIdx = tasks.indexOf(currentFile);
    const nextFile = currentIdx >= 0 && currentIdx < tasks.length - 1
      ? tasks[currentIdx + 1]
      : null;

    // Приз за идеальную папку
    if (chapterComplete && chapterPerfect) {
      const chId = chapterId.split('/').pop();
      const reward = CHAPTER_REWARDS[chId];
      if (reward && !rewards.isUnlocked('chapter_' + chId)) {
        rewards.unlock('chapter_' + chId);
        if (reward.achievement) {
          const ach = new Achievements();
          ach.unlock(reward.achievement);
        }
        setTimeout(() => {
          showRewardPopup(reward, (wpId) => applyWallpaper(wpId));
        }, 500);
      }
    }

    // Намёк на чит-код
    if (chapterComplete && !chapterPerfect) {
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
                <p style="margin-top: 16px;">${hint}</p>
                <p style="margin-top: 16px; color: var(--fg-dim);">Открой <strong>Пуск → 🗝 Чит-коды</strong> и введи код.</p>
              </div>
            `,
            width: 440,
            height: 280,
          });
        }, 800);
      }
    }

    if (chapterComplete) {
      const groupWin = this.windows.windows.get('groupmap-' + worldId);
      if (groupWin) {
        groupWin.style.zIndex = ++this.windows.zIndex;
      } else {
        setTimeout(() => this.openGroupMap(worldId), 300);
      }

      if (!DEV_UNLOCK_ALL) {
        if (worldId === 'junior') {
          const done = await isJuniorComplete();
          if (done) {
            this.juniorDone = true;
            if (!rewards.isUnlocked('junior_finale_shown')) {
              setTimeout(() => this._showJuniorFinale(), 2000);
            } else {
              setTimeout(() => this.renderIcons(), 500);
            }
          }
        } else if (worldId === 'senior') {
          const done = await isSeniorComplete();
          if (done) {
            this.seniorDone = true;
            if (!rewards.isUnlocked('senior_finale_shown')) {
              setTimeout(() => this._showSeniorFinale(), 2000);
            }
          }
        }
      }
    } else if (nextFile) {
      const nextPath = '/' + chapterId + '/' + nextFile;
      setTimeout(() => this.openTaskByPath(nextPath), 250);
    } else {
      setTimeout(() => this.openQuestMap(chapterId), 300);
    }
  }

  _showJuniorFinale() {
    rewards.unlock('junior_finale_shown');
    this.juniorDone = true;
    const finale = new JuniorFinale({
      onStartMiddle: () => {
        this.windows.close('junior-finale');
        this.openWorldGate('middle');
      },
    });
    this.windows.create({
      id: 'junior-finale',
      title: '🎉 Junior завершён',
      content: finale.render(),
      onMount: (body) => finale.mount(body),
      width: 500,
      height: 620,
    });
  }

  _showSeniorFinale() {
    rewards.unlock('senior_finale_shown');
    this.seniorDone = true;

    // Открываем титульные ачивки
    const ach = new Achievements();
    ach.unlock('MASTER_SIGNAL');
    ach.unlock('DIVIDE_ET_IMPERA');

    const finale = new SeniorFinale({
      onClose: () => {
        this.windows.close('senior-finale');
      },
    });
    this.windows.create({
      id: 'senior-finale',
      title: '👑 Магистр Сигнала',
      content: finale.render(),
      onMount: (body) => finale.mount(body),
      width: 520,
      height: 720,
    });
  }

  openSandbox() {
    this.windows.create({
      id: 'sandbox',
      title: '🧪 SANDBOX',
      content: `
        <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.7; color: var(--fg);">
          <p style="font-size: 16px; color: var(--accent); font-weight: 700;">🧪 Песочница</p>
          <p style="margin-top: 16px;">Здесь можно экспериментировать с pandas без заданий и таймера.</p>
          <p style="margin-top: 12px; color: var(--fg-dim);">Функционал в разработке.</p>
        </div>
      `,
      width: 480,
      height: 400,
    });
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
    const lines = [
      { type: 'cmd', text: 'python game.py' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Привет.' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Если ты это читаешь — значит ты в DS-отделе.' },
      { type: 'info', text: 'Добро пожаловать.' },
      { type: 'info', text: '' },
      { type: 'warn', text: '─── КТО ТЫ ───' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Ты — джун. Тебе дали доступ к сырым данным.' },
      { type: 'info', text: 'Никто не будет объяснять что делать.' },
      { type: 'info', text: 'Только ты и датасет. Как в реальной работе.' },
      { type: 'info', text: '' },
      { type: 'warn', text: '─── ЧТО ЭТО ЗА ИГРА ───' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Это симулятор карьеры Data Scientist.' },
      { type: 'info', text: 'Три мира: JUNIOR → MIDDLE → SENIOR.' },
      { type: 'info', text: '' },
      { type: 'warn', text: '─── КАК ИГРАТЬ ───' },
      { type: 'info', text: '' },
      { type: 'ok', text: '⭐ ЗВЁЗДЫ' },
      { type: 'info', text: 'Без ошибок — 4 звезды.' },
      { type: 'info', text: '1 ошибка — 3 звезды.' },
      { type: 'info', text: '2 ошибки — 2 звезды.' },
      { type: 'info', text: '3+ ошибки — 1 звезда.' },
      { type: 'info', text: '' },
      { type: 'ok', text: '🔒 ПОСЛЕДОВАТЕЛЬНОСТЬ' },
      { type: 'info', text: 'Квесты открываются по очереди.' },
      { type: 'info', text: 'Папки тоже.' },
      { type: 'info', text: '' },
      { type: 'ok', text: '🗝 ЧИТ-КОДЫ' },
      { type: 'info', text: 'В каждой папке спрятан чит-код.' },
      { type: 'info', text: 'Введи слово — получишь ачивку.' },
      { type: 'info', text: '' },
      { type: 'ok', text: '⌨️ ТЕРМИНАЛ' },
      { type: 'info', text: 'Хочешь писать код — зайди в Терминал.' },
      { type: 'info', text: '' },
      { type: 'warn', text: '─── ЧТО ДАЛЬШЕ ───' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Пройдёшь junior — откроется MIDDLE.' },
      { type: 'info', text: 'Пройдёшь middle — откроется SENIOR.' },
      { type: 'info', text: '' },
      { type: 'ok', text: '─── НАЧНЁМ ───' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Открой карту JUNIOR.' },
      { type: 'info', text: 'Первый квест — прочитать CSV.' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Удачи. Она тебе понадобится.' },
      { type: 'info', text: '' },
    ];

    this.windows.create({
      id: 'gamepy',
      title: '🐍 game.py',
      content: `<div class="terminal"></div>`,
      onMount: (body) => {
        const el = body.querySelector('.terminal');
        if (!el) return;
        this._runGateScript(el, lines, () => {
          const btn = document.createElement('div');
          btn.className = 'terminal-line';
          btn.style.marginTop = '16px';
          btn.innerHTML = `<button class="taskbar-btn active" id="start-btn" style="pointer-events:auto;">[ НАЧАТЬ → ]</button>`;
          el.appendChild(btn);
          el.scrollTop = el.scrollHeight;
          btn.querySelector('#start-btn').onclick = () => {
            this.openGroupMap('junior');
          };
        });
      },
      width: 620,
      height: 620,
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
    const ach = new Achievements({ mode: 'achievements' });
    this.windows.create({
      id: 'achievements',
      title: '🏆 Ачивки',
      content: ach.render(),
      onMount: (body) => ach.mount(body),
      width: 520,
      height: 600,
    });
  }

  openCheats() {
    const ach = new Achievements({
      mode: 'cheats',
      onAction: (action) => this._handleCheatAction(action),
    });
    this.windows.create({
      id: 'cheats',
      title: '🗝 Чит-коды',
      content: ach.render(),
      onMount: (body) => ach.mount(body),
      width: 520,
      height: 720,
    });
  }

  _handleCheatAction(action) {
    if (action === 'show_senior_finale') {
      this._showSeniorFinale();
    } else if (action === 'show_junior_finale') {
      this._showJuniorFinale();
    } else if (action === 'show_middle_map') {
      this.openGroupMap('middle');
    }
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
