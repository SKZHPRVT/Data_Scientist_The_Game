// Фасад лаборатории моделей — открывает окна в стиле миров
import { ModelsGroupMap } from '../ui/models/ModelsGroupMap.js';
import { ModelsQuestMap } from '../ui/models/ModelsQuestMap.js';
import { TaskView } from '../ui/task/TaskView.js';
import { BossView } from '../ui/models/BossView.js';
import { checkAndNotify } from '../ui/models/achievementChecker.js';
import { progress } from '../core/progress.js';

export class ModelsLab {
  constructor(desktop) {
    this.desktop = desktop;
    this.windows = desktop.windows;
  }

  async render() {
    const lab = window.__models;
    if (!lab) {
      this.windows.create({
        id: 'models-lab',
        title: '📦 Лаборатория моделей',
        content: '<div style="color: var(--error); padding: 20px;">Лаборатория не загружена. Проверь Console.</div>',
        width: 600,
        height: 400,
      });
      return;
    }

    if (this.windows.windows.has('models-lab')) {
      this.windows.close('models-lab');
    }

    const map = new ModelsGroupMap({
      onOpenChapter: (familyId) => this._openFamily(familyId),
      onOpenBoss: (bossData) => this._openBoss(bossData),
    });

    await map.load();

    this.windows.create({
      id: 'models-lab',
      title: '📦 Лаборатория моделей',
      content: map.render(),
      onMount: (body) => map.mount(body),
      width: 600,
      height: 620,
    });
  }

  _openBoss(bossData) {
    const view = new BossView(bossData, {
      onComplete: (correct, total) => {
        // Закрываем окно босса
        this.windows.close('boss-final');
        // Обновляем карту лаборатории
        this._refreshLabMapInPlace();
        // Если идеально — даём ачивку
        if (correct === total) {
          // Прямая разблокировка через localStorage
          const ACH_KEY = 'achievements_v1';
          try {
            const arr = JSON.parse(localStorage.getItem(ACH_KEY) || '[]');
            if (!arr.includes('COLLECTOR')) {
              arr.push('COLLECTOR');
              localStorage.setItem(ACH_KEY, JSON.stringify(arr));
            }
          } catch (e) {}
        }
        // Проверяем ачивки после босса
        try {
          import('../ui/models/achievementChecker.js').then((m) => m.checkAndNotify());
        } catch (e) {}
      },
    });

    this.windows.create({
      id: 'boss-final',
      title: '👁 Финальный босс',
      content: view.render(),
      onMount: (body) => view.mount(body),
      width: 600,
      height: 700,
    });
  }

  async _openFamily(familyId) {
    const lab = window.__models;
    const familyData = lab.families[familyId];
    const familyIndex = lab.index.families.find((f) => f.id === familyId);

    if (!familyData) {
      console.warn('[ModelsLab] Семейство не загружено:', familyId);
      return;
    }

    const familyWindowId = 'models-family-' + familyId;
    if (this.windows.windows.has(familyWindowId)) {
      this.windows.close(familyWindowId);
    }

    familyData.family = `${familyIndex.icon} ${familyIndex.name}`;

    const map = new ModelsQuestMap(familyId, familyData, {
      onOpenTask: (task) => this._openTask(task, familyId),
    });

    this.windows.create({
      id: familyWindowId,
      title: familyIndex.icon + ' ' + familyIndex.name,
      content: map.render(),
      onMount: (body) => map.mount(body),
      width: 600,
      height: 620,
    });
  }

  _openTask(task, familyId) {
    this._closeAllTaskWindows();

    const view = new TaskView(task, {
      onSolved: (taskId, stars) => this._onTaskSolved(task, familyId),
    });

    this.windows.create({
      id: 'task-' + task.id.replace(/\//g, '-'),
      title: '📦 ' + (task.title || task.id),
      content: view.render(),
      onMount: (body) => {
        if (task._story) {
          const storyEl = document.createElement('div');
          storyEl.style.cssText = 'padding: 12px; margin: 0 0 12px 0; background: rgba(0,255,65,0.05); border-left: 3px solid var(--accent); font-family: var(--font-mono); font-size: 12px; line-height: 1.5;';
          storyEl.textContent = task._story;
          body.querySelector('.task-view')?.prepend(storyEl);
        }
        view.mount(body);
      },
      width: 540,
      height: 700,
    });
  }

  _closeAllTaskWindows() {
    this.windows.windows.forEach((_, id) => {
      if (id.startsWith('task-')) this.windows.close(id);
    });
  }

  async _onTaskSolved(task, familyId) {
    // Закрываем текущее окно задачи
    this._closeAllTaskWindows();

    // Обновляем карту семейства в фоне (чтобы прогресс в списке был свежим)
    this._refreshFamilyMapInPlace(familyId);
    this._refreshLabMapInPlace();

    // Проверяем ачивки лаборатории (после того, как прогресс записан)
    try {
      await checkAndNotify();
    } catch (e) {
      console.warn('[Achievements]', e.message);
    }

    // Ищем следующий квест в семействе
    const lab = window.__models;
    const familyData = lab.families[familyId];
    if (!familyData || !familyData.quests) return;

    const currentQuestId = task.id.split('/').pop();
    const currentIndex = familyData.quests.findIndex((q) => q.id === currentQuestId);

    if (currentIndex === -1) return;

    const nextIndex = currentIndex + 1;

    // Если есть следующий — открываем сразу
    if (nextIndex < familyData.quests.length) {
      const nextQuest = familyData.quests[nextIndex];
      const nextTask = this._adaptQuest(nextQuest, familyId);
      // Небольшая задержка — чтобы окно задачи успело закрыться
      setTimeout(() => this._openTask(nextTask, familyId), 100);
    }
    // Если это был последний — ничего, вернулись в семейство
  }

  // Адаптер квеста → TaskView (продублирован из ModelsQuestMap)
  _adaptQuest(quest, familyId) {
    const path = 'models/' + familyId + '/' + quest.id;
    return {
      id: path,
      _path: path,
      title: quest.title || quest.id,
      world: 'models',
      level: 1,
      question: quest.question,
      _story: quest.story,
      options: (quest.options || []).map((o) => ({
        id: o.id,
        code: o.text,
        correct: o.correct,
        explain: o.why,
      })),
      _unlocks: quest.unlocks,
      _xp: quest.xp,
      _explanation: quest.explanation,
    };
  }

  _refreshFamilyMapInPlace(familyId) {
    const windowId = 'models-family-' + familyId;
    const win = this.windows.windows.get(windowId);
    if (!win) return;

    const lab = window.__models;
    const familyData = lab.families[familyId];
    const familyIndex = lab.index.families.find((f) => f.id === familyId);
    if (!familyData || !familyIndex) return;

    familyData.family = `${familyIndex.icon} ${familyIndex.name}`;

    const map = new ModelsQuestMap(familyId, familyData, {
      onOpenTask: (task) => this._openTask(task, familyId),
    });

    const body = win.querySelector('.window-body');
    if (!body) return;

    body.innerHTML = map.render();
    map.mount(body);
  }

  async _refreshLabMapInPlace() {
    const windowId = 'models-lab';
    const win = this.windows.windows.get(windowId);
    if (!win) return;

    const map = new ModelsGroupMap({
      onOpenChapter: (familyId) => this._openFamily(familyId),
      onOpenBoss: (bossData) => this._openBoss(bossData),
    });

    await map.load();

    const body = win.querySelector('.window-body');
    if (!body) return;

    body.innerHTML = map.render();
    map.mount(body);
  }
}
