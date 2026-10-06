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
import { GaltonBoard } from '../galton/GaltonBoard.js';
import { showRewardPopup } from '../rewards/RewardPopup.js';
import { JuniorFinale } from '../rewards/JuniorFinale.js';
import { SeniorFinale } from '../rewards/SeniorFinale.js';
import { storage } from '../../core/storage.js';
import {
  progress, rewards,
  isBabyComplete, isJuniorComplete, isMiddleComplete, isSeniorComplete,
} from '../../core/progress.js';
import { CHAPTER_REWARDS } from '../../core/rewards.js';
import { isDevUnlockAll } from '../../core/dev.js';

const CHEAT_HINTS = {
  basics: 'Найдёшь первое знамение, если вспомнишь про фильтрацию. Код: FILTER',
  cleaning: 'Ты чистюля. И слово подходящее. Код: CLEAN',
  grouping: 'Связующий — тот, кто соединяет. Код: CONNECT',
  merging: 'Разделяй — и понимай. Код: DIVIDE',
  datetime: 'Даты и время... до 3 ночи... Код: COFFEE',
  strings: 'Тексты и пропуски. Слово из 3 букв. Код: NAN',
  bosses: 'Идеальный на трейне — но не на тесте. Код: OVERFIT',
  pipelines: 'Весь путь в одном объекте. Код: PIPELINE',
  features: 'Создай признаки — выиграй соревнование. Код: FEATURES_MASTER',
  models: 'Обучи, сохрани, переиспользуй. Код: MODEL_MASTER',
  eval: 'Accuracy врёт при дисбалансе. Код: EVAL_MASTER',
  experiments: 'A/B — не гадай, а проверяй. Код: AB_MASTER',
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
    this.babyDone = false;
    this.juniorDone = false;
    this.middleDone = false;
    this.seniorDone = false;
    this.galtonInstance = null;

    window.addEventListener('open-explorer', (e) => this.openExplorer(e.detail));
    window.addEventListener('open-task', (e) => this.openTaskByPath(e.detail));
    window.addEventListener('lang-change', () => this._rerender());
  }

  _rerender() {
    this._closeAllMapWindows();
    this._closeAllTaskWindows();
    this.startMenu?.destroy();
    this.startMenu = null;
    this.root.innerHTML = '';
    this.render();
  }

  // ============================================
  // ЗАКРЫТИЕ ВСЕХ КАРТ И ЗАДАЧ
  // ============================================
  _closeAllMapWindows() {
    this.windows.windows.forEach((_, id) => {
      if (id.startsWith('questmap-') || id.startsWith('groupmap-') || id === 'questmap' || id === 'groupmap') {
        this.windows.close(id);
      }
    });
  }

  _closeAllTaskWindows() {
    this.windows.windows.forEach((_, id) => {
      if (id.startsWith('task-')) this.windows.close(id);
    });
  }

  async render() {
    this.babyDone = isDevUnlockAll() ? true : await isBabyComplete();
    this.juniorDone = isDevUnlockAll() ? true : await isJuniorComplete();
    this.middleDone = isDevUnlockAll() ? true : await isMiddleComplete();
    this.seniorDone = isDevUnlockAll() ? true : await isSeniorComplete();

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

    if (!isDevUnlockAll()) {
      if (this.seniorDone && !rewards.isUnlocked('senior_finale_shown')) {
        setTimeout(() => this._showSeniorFinale(), 800);
      } else if (this.juniorDone && !rewards.isUnlocked('junior_finale_shown')) {
        setTimeout(() => this._showJuniorFinale(), 800);
      } else if (this.babyDone && !rewards.isUnlocked('baby_complete_shown')) {
        setTimeout(() => this._showBabyComplete(), 800);
      }
    }

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
      { icon: '🍼', label: 'BABY SCIENTIST', action: () => this.openGroupMap('baby') },
      { icon: '🎯', label: 'JUNIOR', action: () => this.openGroupMap('junior') },
      { icon: '🚀', label: 'MIDDLE', action: () => this.openWorldGate('middle') },
      { icon: '👑', label: 'SENIOR', action: () => this.openWorldGate('senior') },
      { icon: '📁', label: 'SANDBOX', action: () => this.openSandbox() },
      { icon: '🎲', label: 'GALTON', action: () => this.openGalton() },
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

  openGalton() {
    if (this.galtonInstance) {
      this.galtonInstance.destroy();
      this.galtonInstance = null;
    }
    const galton = new GaltonBoard();
    this.galtonInstance = galton;
    this.windows.create({
      id: 'galton',
      title: '🎲 Galton Board',
      content: galton.render(),
      onMount: (body) => galton.mount(body),
      width: 620,
      height: 720,
    });
  }

  // ============================================
  // GATE MIDDLE/SENIOR
  // ============================================
  async openWorldGate(worldId) {
    // Обновляем флаги перед проверкой
    this.juniorDone = isDevUnlockAll() ? true : await isJuniorComplete();
    this.middleDone = isDevUnlockAll() ? true : await isMiddleComplete();
    this.seniorDone = isDevUnlockAll() ? true : await isSeniorComplete();

    if (isDevUnlockAll()) {
      this.openGroupMap(worldId);
      return;
    }

    // MIDDLE — если junior пройден
    if (worldId === 'middle') {
      if (this.juniorDone) {
        this.openGroupMap('middle');
      } else {
        this._showGateTerminal('middle', this._getGateText('middle'));
      }
      return;
    }

    // SENIOR — если middle пройден
    if (worldId === 'senior') {
      if (this.middleDone) {
        this.openGroupMap('senior');
      } else {
        this._showGateTerminal('senior', this._getGateText('senior'));
      }
      return;
    }
  }

  _showGateTerminal(worldId, text) {
    this._closeAllMapWindows();
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
    if (worldId === 'middle') {
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
    let lineIdx = 0;

    const printLine = () => {
      if (lineIdx >= lines.length) {
        const cursor = document.createElement('div');
        cursor.className = 'terminal-line';
        cursor.innerHTML = `<span class="terminal-prompt">$ </span><span class="gate-cursor">▊</span>`;
        el.appendChild(cursor);
        el.scrollTop = el.scrollHeight;
        if (onDone) onDone();
        return;
      }

      const line = lines[lineIdx];
      const div = document.createElement('div');
      let cls = '';
      let prefix = '';
      if (line.type === 'cmd') { cls = ''; prefix = '$ '; }
      else if (line.type === 'ok') { cls = 'terminal-success'; }
      else if (line.type === 'err') { cls = 'terminal-error'; }
      else if (line.type === 'warn') { cls = 'terminal-warn'; }
      div.className = 'terminal-line ' + cls;
      el.appendChild(div);

      const fullText = prefix + line.text;
      let charIdx = 0;

      if (fullText.length === 0) {
        lineIdx++;
        setTimeout(printLine, 40);
        return;
      }

      const typeChar = () => {
        if (charIdx >= fullText.length) {
          lineIdx++;
          let delay = 150;
          if (line.type === 'err') delay = 300;
          if (line.type === 'cmd') delay = 400;
          if (line.type === 'warn') delay = 250;
          if (line.text === '') delay = 40;
          setTimeout(printLine, delay);
          return;
        }

        div.textContent = fullText.slice(0, charIdx + 1);
        el.scrollTop = el.scrollHeight;

        if (window.__audio && charIdx % 2 === 0) {
          try { window.__audio.key('normal'); } catch (e) {}
        }

        charIdx++;
        const charDelay = 15 + Math.random() * 15;
        setTimeout(typeChar, charDelay);
      };

      typeChar();
    };

    setTimeout(printLine, 300);
  }

  // ============================================
  // КАРТА МИРА — ОДНО ОКНО
  // ============================================
  async openGroupMap(worldId) {
    // Закрываем все карты
    this._closeAllMapWindows();
    await new Promise((r) => setTimeout(r, 60));

    const map = new GroupMap(worldId, {
      onOpenChapter: (chapterId) => this.openQuestMap(chapterId),
    });

    const win = this.windows.create({
      id: 'groupmap',
      title: '🎯 ' + (worldId === 'baby' ? 'BABY SCIENTIST' : worldId.toUpperCase()),
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
    const win = this.windows.windows.get('groupmap');
    if (!win || !win._questMap) return;
    if (win._worldId !== worldId) return;
    try {
      await win._questMap.load();
      const bodyEl = win.querySelector('.window-body');
      bodyEl.innerHTML = win._questMap.render();
      win._questMap.mount(bodyEl);
    } catch (e) {}
  }

  // ============================================
  // КАРТА ГЛАВЫ — ОДНО ОКНО
  // ============================================
  async openQuestMap(chapterId) {
    // Закрываем карту мира и другие карты глав
    this._closeAllMapWindows();
    await new Promise((r) => setTimeout(r, 60));

    const map = new QuestMap(chapterId, {
      onOpenTask: (path) => this.openTaskByPath(path),
    });

    const win = this.windows.create({
      id: 'questmap',
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
    const win = this.windows.windows.get('questmap');
    if (!win || !win._questMap) return;
    if (win._chapterId !== chapterId) return;
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
    this._closeAllTaskWindows();
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

    // Закрываем задачу
    this._closeAllTaskWindows();

    // Обновляем карту главы (если открыта)
    await this.refreshQuestMap(chapterId);

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

    // Призы
    if (chapterComplete && chapterPerfect && worldId !== 'baby') {
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

    // Намёк
    if (chapterComplete && !chapterPerfect && worldId !== 'baby') {
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
                <p style="margin-top: 16px; color: var(--fg-dim);">Открой <strong>Пуск → 🗝 Чит-коды</strong>.</p>
              </div>
            `,
            width: 440,
            height: 280,
          });
        }, 800);
      }
    }

    if (chapterComplete) {
      // Глава пройдена — обновляем карту мира
      await this.refreshGroupMap(worldId);

      // Обновляем флаги
      if (!isDevUnlockAll()) {
        if (worldId === 'baby') {
          const done = await isBabyComplete();
          if (done) {
            this.babyDone = true;
            if (!rewards.isUnlocked('baby_complete_shown')) {
              setTimeout(() => this._showBabyComplete(), 2000);
            }
          }
        } else if (worldId === 'junior') {
          const done = await isJuniorComplete();
          if (done) {
            this.juniorDone = true;
            if (!rewards.isUnlocked('junior_finale_shown')) {
              setTimeout(() => this._showJuniorFinale(), 2000);
            } else {
              setTimeout(() => this.renderIcons(), 500);
            }
          }
        } else if (worldId === 'middle') {
          const done = await isMiddleComplete();
          if (done) {
            this.middleDone = true;
            setTimeout(() => this.renderIcons(), 500);
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
      // Следующая задача
      const nextPath = '/' + chapterId + '/' + nextFile;
      setTimeout(() => this.openTaskByPath(nextPath), 250);
    } else {
      // Fallback
      setTimeout(() => this.openQuestMap(chapterId), 300);
    }
  }

  _showBabyComplete() {
    rewards.unlock('baby_complete_shown');
    this.babyDone = true;
    this.windows.create({
      id: 'baby-complete',
      title: '🍼 BABY SCIENTIST пройден',
      content: `
        <div style="font-family: var(--font-mono); color: var(--fg); text-align: center; padding: 20px; display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 64px; margin-bottom: 8px;">🍼</div>
          <div style="font-size: 22px; font-weight: 800; color: var(--accent); letter-spacing: 2px; margin-bottom: 16px;">
            ПЕРВЫЙ ШАГ СДЕЛАН
          </div>
          <div style="width: 100%; padding: 16px; background: rgba(0, 255, 65, 0.05); border-radius: 8px; border-left: 3px solid var(--accent); text-align: left; font-size: 13px; line-height: 1.7;">
            <p>Ты понял:</p>
            <p style="margin-top: 8px;">📦 Что такое данные</p>
            <p>📋 Что такое таблица</p>
            <p>📊 Что такое колонки и строки</p>
            <p>🧑‍🔬 Кто такой Data Scientist</p>
            <p>🐍 Что такое pandas</p>
            <p style="margin-top: 12px; color: var(--accent); font-weight: 700;">
              Теперь ты готов к серьёзной игре.
            </p>
          </div>
          <div style="font-size: 40px; margin: 20px 0 4px;">🎯</div>
          <div style="font-size: 14px; font-weight: 800; color: var(--warn); letter-spacing: 2px; margin-bottom: 20px;">
            ОТКРЫТ JUNIOR
          </div>
          <button class="task-btn task-btn-next" id="baby-go-junior" style="width: 100%;">
            → Перейти в JUNIOR
          </button>
          <button class="task-btn" id="baby-stay" style="width: 100%; margin-top: 8px;">
            Остаться в BABY SCIENTIST
          </button>
        </div>
      `,
      width: 500,
      height: 620,
      onMount: (body) => {
        if (window.__audio) {
          try { window.__audio.success(); } catch (e) {}
        }
        body.querySelector('#baby-go-junior').onclick = () => {
          this.windows.close('baby-complete');
          this.openGroupMap('junior');
        };
        body.querySelector('#baby-stay').onclick = () => {
          this.windows.close('baby-complete');
        };
      },
    });
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

    const ach = new Achievements();
    ach.unlock('MASTER_SIGNAL');
    ach.unlock('DIVIDE_ET_IMPERA');

    const finale = new SeniorFinale({
      onClose: () => {},
    });
    finale.show();
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
      { type: 'info', text: 'Никто не будет проверять твои гипотезы.' },
      { type: 'info', text: 'Только ты и датасет. Как в реальной работе.' },
      { type: 'info', text: '' },
      { type: 'warn', text: '─── ЧТО ЭТО ЗА ИГРА ───' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Это симулятор карьеры Data Scientist.' },
      { type: 'info', text: 'Четыре мира: BABY SCIENTIST → JUNIOR → MIDDLE → SENIOR.' },
      { type: 'info', text: '' },
      { type: 'info', text: 'В каждом мире — папки с темами.' },
      { type: 'info', text: 'В каждой папке — квесты про pandas.' },
      { type: 'info', text: 'Каждый квест — 4 варианта ответа.' },
      { type: 'info', text: 'Выбираешь правильный — идёшь дальше.' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Если ты никогда не работал с данными —' },
      { type: 'info', text: 'начни с BABY SCIENTIST (🍼).' },
      { type: 'info', text: '' },
      { type: 'info', text: 'Если уже знаешь pandas — сразу JUNIOR (🎯).' },
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
      { type: 'info', text: 'Нельзя прыгнуть в middle, не пройдя junior.' },
      { type: 'info', text: '' },
      { type: 'ok', text: '🗝 ЧИТ-КОДЫ' },
      { type: 'info', text: 'В каждой папке спрятан чит-код.' },
      { type: 'info', text: 'Введи слово — получишь ачивку.' },
      { type: 'info', text: '' },
      { type: 'ok', text: '🎲 GALTON BOARD' },
      { type: 'info', text: 'Иконка GALTON — визуализация случая.' },
      { type: 'info', text: '' },
      { type: 'ok', text: '⌨️ ТЕРМИНАЛ' },
      { type: 'info', text: 'Хочешь писать код — зайди в Терминал.' },
      { type: 'info', text: '' },
      { type: 'warn', text: '─── ЧТО ДАЛЬШЕ ───' },
      { type: 'info', text: '' },
      { type: 'info', text: 'baby → junior → middle → senior → Магистр.' },
      { type: 'info', text: '' },
      { type: 'ok', text: '─── НАЧНЁМ ───' },
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
          btn.innerHTML = `
            <button class="taskbar-btn active" id="start-baby" style="pointer-events:auto;">[ 🍼 BABY SCIENTIST ]</button>
            <button class="taskbar-btn" id="start-junior" style="pointer-events:auto; margin-left: 8px;">[ 🎯 JUNIOR ]</button>
          `;
          el.appendChild(btn);
          el.scrollTop = el.scrollHeight;
          btn.querySelector('#start-baby').onclick = () => {
            this.openGroupMap('baby');
          };
          btn.querySelector('#start-junior').onclick = () => {
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
