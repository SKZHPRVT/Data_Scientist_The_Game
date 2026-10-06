// Фасад лаборатории моделей — открывает окна в стиле миров
import { ModelsGroupMap } from '../ui/models/ModelsGroupMap.js';
import { ModelsQuestMap } from '../ui/models/ModelsQuestMap.js';
import { TaskView } from '../ui/task/TaskView.js';
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

    // ЗАКРЫВАЕМ старое окно — иначе create() вернёт старое DOM с устаревшими данными
    if (this.windows.windows.has('models-lab')) {
      this.windows.close('models-lab');
    }

    const map = new ModelsGroupMap({
      onOpenChapter: (familyId) => this._openFamily(familyId),
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

  async _openFamily(familyId) {
    const lab = window.__models;
    const familyData = lab.families[familyId];
    const familyIndex = lab.index.families.find((f) => f.id === familyId);

    if (!familyData) {
      console.warn('[ModelsLab] Семейство не загружено:', familyId);
      return;
    }

    // ЗАКРЫВАЕМ старое окно этого семейства
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
    // Закрываем задачу и перезагружаем карту семейства — прогресс обновится
    this._closeAllTaskWindows();
    await this._refreshFamilyMap(familyId);
  }

  async _refreshFamilyMap(familyId) {
    const windowId = 'models-family-' + familyId;
    if (this.windows.windows.has(windowId)) {
      this.windows.close(windowId);
    }

    const lab = window.__models;
    const familyData = lab.families[familyId];
    const familyIndex = lab.index.families.find((f) => f.id === familyId);
    familyData.family = `${familyIndex.icon} ${familyIndex.name}`;

    const map = new ModelsQuestMap(familyId, familyData, {
      onOpenTask: (task) => this._openTask(task, familyId),
    });

    this.windows.create({
      id: windowId,
      title: familyIndex.icon + ' ' + familyIndex.name,
      content: map.render(),
      onMount: (body) => map.mount(body),
      width: 600,
      height: 620,
    });
  }
}
