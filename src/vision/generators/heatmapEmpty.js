// Генератор: пустая зона на heatmap
import { SeededRandom } from '../seededRandom.js';

export const heatmapEmpty = {
  id: 'heatmap_empty',
  name: 'Пустая зона',
  type: 'heatmap',
  icon: '🔥',
  category: 'heatmap',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const rows = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
    const cols = ['Ночь', 'Утро', 'День', 'Вечер'];

    // Одна колонка явно пустая (низкие значения)
    const emptyColIdx = rng.int(0, cols.length - 1);
    const matrix = rows.map(() => cols.map((_, ci) => {
      if (ci === emptyColIdx) return rng.int(2, 12);
      return rng.int(50, 120);
    }));

    return {
      id: 'vision_heat_empty_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Пустая зона',
      chart: {
        type: 'heatmap',
        title: 'Активность по времени',
        data: {
          labels: cols,
          rows,
          matrix,
          datasets: [{ label: '', values: [] }],
        },
      },
      question: 'Когда активность самая низкая?',
      options: rng.shuffle(
        cols.map((c, i) => ({
          id: 'opt_' + i,
          code: c,
          correct: i === emptyColIdx,
          explain: i === emptyColIdx
            ? `${c} — вся колонка тёмная, значения 2-12. Пользователи почти не активны.`
            : `${c} — значения 50-120, активное время.`,
        }))
      ),
      hint: 'Ищи самую тёмную колонку',
    };
  },
};
