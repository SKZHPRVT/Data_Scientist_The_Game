// Карта тренажёра чтения графиков
import { GENERATORS_BY_TYPE } from './generators/index.js';
import { progress } from '../core/progress.js';

const TYPE_META = {
  line:      { icon: '📈', name: 'Линии',       desc: 'Тренды, пики, пересечения' },
  bar:       { icon: '📊', name: 'Столбцы',     desc: 'Сравнение категорий' },
  scatter:   { icon: '✨', name: 'Рассеяние',   desc: 'Корреляция, кластеры' },
  histogram: { icon: '🔔', name: 'Гистограммы', desc: 'Распределения' },
  boxplot:   { icon: '📦', name: 'Ящики',       desc: 'Медиана, квартили, выбросы' },
  pie:       { icon: '🥧', name: 'Круги',       desc: 'Доли от целого' },
  heatmap:   { icon: '🔥', name: 'Тепловые',    desc: 'Паттерны по двум осям' },
};

export class VisionMap {
  constructor({ onOpenType } = {}) {
    this.onOpenType = onOpenType;
  }

  render() {
    const types = Object.keys(TYPE_META);

    // Прогресс по каждому типу из localStorage
    const stats = {};
    let totalSolved = 0;
    let totalStars = 0;

    for (const type of types) {
      const gens = GENERATORS_BY_TYPE[type] || [];
      const genIds = gens.map((g) => g.id);
      let solved = 0;
      let stars = 0;

      // Считаем из localStorage: read/{genId}/*
      for (const genId of genIds) {
        const prefix = `read/${genId}/`;
        const solvedList = progress.getSolved();
        const ids = solvedList.filter((id) => id.startsWith(prefix));
        solved += ids.length;
        for (const id of ids) {
          stars += progress.getStars(id);
        }
      }

      stats[type] = { solved, stars, generators: gens.length };
      totalSolved += solved;
      totalStars += stars;
    }

    return `
      <div class="quest-map">
        <div class="quest-map-header">
          <div class="quest-map-title">📊 ЧТЕНИЕ ГРАФИКОВ</div>
          <div class="quest-map-desc">Бесконечный тренажёр · генеративные задачи</div>
          <div class="quest-map-progress">
            <div class="quest-map-bar">
              <div class="quest-map-bar-fill" style="width: ${Math.min(100, totalSolved * 2)}%"></div>
            </div>
            <div class="quest-map-count">⭐ ${totalStars} · ${totalSolved} решено</div>
          </div>
        </div>

        <div class="quest-list">
          ${types.map((type) => {
            const meta = TYPE_META[type];
            const s = stats[type];
            const hasGens = s.generators > 0;

            return `
              <div class="quest-item ${hasGens ? 'active' : 'locked'}" data-type="${type}">
                <div class="quest-item-status">${hasGens ? '▶️' : '🔒'}</div>
                <div class="quest-item-body">
                  <div class="quest-item-title">${meta.icon} ${meta.name}</div>
                  <div class="quest-item-sub">
                    ${hasGens
                      ? `${meta.desc} · ⭐ ${s.stars} · ${s.solved} решено`
                      : `${meta.desc} · скоро`
                    }
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top: 16px; padding: 12px; background: rgba(0,255,65,0.05); border-left: 3px solid var(--accent); font-family: var(--font-mono); font-size: 11px; line-height: 1.6;">
          <strong>💡 Как это работает</strong><br>
          Каждая задача генерируется заново. Никогда не кончается. Решил одну — получил звёзды — открыл следующую. Можно переигрывать бесконечно.
        </div>
      </div>
    `;
  }

  mount(body) {
    body.querySelectorAll('.quest-item').forEach((el) => {
      el.onclick = () => {
        if (el.classList.contains('locked')) {
          if (window.__audio) window.__audio.error();
          el.style.background = 'rgba(255,51,51,0.2)';
          setTimeout(() => { el.style.background = ''; }, 300);
          return;
        }
        const type = el.dataset.type;
        if (window.__audio) window.__audio.click('open');
        if (this.onOpenType) this.onOpenType(type);
      };
    });
  }
}
