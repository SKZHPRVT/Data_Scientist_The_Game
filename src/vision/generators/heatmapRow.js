// Генератор: самая активная строка на heatmap
import { SeededRandom } from '../seededRandom.js';

export const heatmapRow = {
  id: 'heatmap_row',
  name: 'Самая активная строка',
  type: 'heatmap',
  icon: '🔥',
  category: 'heatmap',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const rows = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const cols = ['9:00', '12:00', '15:00', '18:00', '21:00'];

    // Одна строка явно ярче
    const hotRowIdx = rng.int(0, rows.length - 1);
    const matrix = rows.map((_, ri) => {
      if (ri === hotRowIdx) {
        return cols.map(() => rng.int(120, 180));
      }
      return cols.map(() => rng.int(10, 60));
    });

    return {
      id: 'vision_heat_row_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Активная строка',
      chart: {
        type: 'heatmap',
        title: 'Активность по дням и часам',
        data: {
          labels: cols,
          rows,
          matrix,
          datasets: [{ label: '', values: [] }],
        },
      },
      question: 'В какой день активность самая высокая?',
      options: rng.shuffle(
        rows.map((r, i) => ({
          id: 'opt_' + i,
          code: r,
          correct: i === hotRowIdx,
          explain: i === hotRowIdx
            ? `${r} — вся строка яркая, значения 120-180. Самый активный день.`
            : `${r} — значения 10-60, обычный день.`,
        }))
      ),
      hint: 'Ищи самую яркую строку',
    };
  },
};
