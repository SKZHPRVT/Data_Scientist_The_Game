// Фасад тренажёра чтения графиков — с сессиями
import { VisionMap } from './VisionMap.js';
import { VisionSession, SESSION_SIZE } from './VisionSession.js';
import { ChartVisionView } from './ChartVisionView.js';
import { SessionSummaryView } from './SessionSummaryView.js';
import { GENERATORS_BY_TYPE } from './generators/index.js';
import { checkAndNotifyVision } from './VisionAchievements.js';

const TYPE_META = {
  line:      { icon: '📈', name: 'Линии' },
  bar:       { icon: '📊', name: 'Столбцы' },
  scatter:   { icon: '✨', name: 'Рассеяние' },
  histogram: { icon: '🔔', name: 'Гистограммы' },
  boxplot:   { icon: '📦', name: 'Ящики' },
  pie:       { icon: '🥧', name: 'Круги' },
  heatmap:   { icon: '🔥', name: 'Тепловые' },
};

export class VisionLab {
  constructor(desktop) {
    this.desktop = desktop;
    this.windows = desktop.windows;
    this.session = new VisionSession();
    this.currentType = 'line';
    this.combo = 0;
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
    this.combo = 0;
    this.session.startSession(type, SESSION_SIZE);
    this._closeTask();
    this._openNextTask(type);
  }

  _openNextTask(type = null) {
    const t = type || this.currentType;

    // Проверяем: сессия закончена?
    if (this.session.getSessionProgress().finished) {
      this._openSummary(t);
      return;
    }

    const gens = GENERATORS_BY_TYPE[t] || [];
    if (gens.length === 0) return;

    const gen = gens[Math.floor(Math.random() * gens.length)];
    const task = this.session.next(gen.id);

    this._closeTask();

    const view = new ChartVisionView(task, {
      onNext: () => this._onAnswer(),
      onBack: () => this._closeTask(),
      sessionProgress: this.session.getSessionProgress(),
      combo: this.combo,
    });

    const win = this.windows.create({
      id: 'vision-task',
      title: '📊 ' + (task.title || 'Чтение графика'),
      content: view.render(),
      onMount: (body) => view.mount(body),
      width: 600,
      height: 720,
    });

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

  // Вызывается после правильного ответа
  async _onAnswer() {
    // Считаем комбо
    this.combo++;
    const stars = this.combo >= 3 ? 4 : 3;  // условно
    const sp = this.session.getSessionProgress();

    // Записываем результат (звёзды уже сохранены в ChartVisionView._onCorrect)
    this.session.recordResult(stars, true);

    // Проверяем ачивки
    try {
      await checkAndNotifyVision();
    } catch (e) {
      console.warn('[VISION ach]', e.message);
    }

    // Открываем следующий или финал
    if (this.session.getSessionProgress().finished) {
      this._openSummary(this.currentType);
    } else {
      this._openNextTask();
    }
  }

  _openSummary(type) {
    const meta = TYPE_META[type] || { icon: '📊', name: type };
    const sp = this.session.getSessionProgress();

    this._closeTask();

    const view = new SessionSummaryView(sp, meta, {
      onNextSession: () => {
        this.combo = 0;
        this.session.startSession(type, SESSION_SIZE);
        this._openNextTask(type);
      },
      onBack: () => {
        this._closeTask();
        this.render();
      },
    });

    this.windows.create({
      id: 'vision-summary',
      title: '📊 Итоги сессии',
      content: view.render(),
      onMount: (body) => view.mount(body),
      width: 500,
      height: 500,
    });
  }

  _closeTask() {
    if (this.windows.windows.has('vision-task')) {
      this.windows.close('vision-task');
    }
    if (this.windows.windows.has('vision-summary')) {
      this.windows.close('vision-summary');
    }
  }
}
