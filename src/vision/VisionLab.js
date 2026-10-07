// Фасад тренажёра чтения графиков
import { VisionMap } from './VisionMap.js';
import { VisionSession } from './VisionSession.js';
import { ChartVisionView } from './ChartVisionView.js';
import { GENERATORS_BY_TYPE } from './generators/index.js';

export class VisionLab {
  constructor(desktop) {
    this.desktop = desktop;
    this.windows = desktop.windows;
    this.session = new VisionSession();
    this.currentType = 'line';
  }

  async render() {
    const windowId = 'vision-lab';
    if (this.windows.windows.has(windowId)) {
      this.windows.close(windowId);
    }

    const map = new VisionMap({
      onOpenType: (type) => this._openType(type),
    });

    this.windows.create({
      id: windowId,
      title: '📊 Чтение графиков',
      content: map.render(),
      onMount: (body) => map.mount(body),
      width: 600,
      height: 700,
    });
  }

  _openType(type) {
    this.currentType = type;

    // Закрываем старую задачу, если была
    this._closeTask();

    // Открываем первую задачу типа
    this._openNextTask(type);
  }

  _openNextTask(type = null) {
    const t = type || this.currentType;
    const gens = GENERATORS_BY_TYPE[t] || [];
    if (gens.length === 0) return;

    // Случайный генератор этого типа
    const gen = gens[Math.floor(Math.random() * gens.length)];
    const task = this.session.next(gen.id);

    this._closeTask();

    const view = new ChartVisionView(task, {
      onNext: () => this._openNextTask(t),
      onBack: () => this._closeTask(),
    });

    const win = this.windows.create({
      id: 'vision-task',
      title: '📊 ' + (task.title || 'Чтение графика'),
      content: view.render(),
      onMount: (body) => view.mount(body),
      width: 600,
      height: 700,
    });

    // При закрытии — destroy chart
    const closeBtn = win.querySelector('.close');
    if (closeBtn) {
      const origClose = closeBtn.onclick;
      closeBtn.onclick = (e) => {
        try { view.destroy(); } catch (err) {}
        if (origClose) origClose(e);
        else this.windows.close('vision-task');
      };
    }
  }

  _closeTask() {
    if (this.windows.windows.has('vision-task')) {
      this.windows.close('vision-task');
    }
  }
}
