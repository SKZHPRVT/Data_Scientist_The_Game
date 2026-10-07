// Генератор: heatmap с пиком
import { SeededRandom } from '../seededRandom.js';

export const heatmapPeak = {
  id: 'heatmap_peak',
  name: 'Пик на heatmap',
  type: 'heatmap',
  icon: '🔥',
  category: 'heatmap',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Активность по дням и часам', rows: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'], cols: ['9:00', '12:00', '15:00', '18:00', '21:00'] },
      { name: 'Продажи по регионам и категориям', rows: ['Москва', 'СПб', 'Казань', 'Новосибирск'], cols: ['Одежда', 'Еда', 'Техника', 'Книги', 'Спорт'] },
      { name: 'Трафик по дням и источникам', rows: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'], cols: ['Google', 'Yandex', 'Соцсети', 'Прямые'] },
    ]);

    const rows = theme.rows;
    const cols = theme.cols;

    // Генерим матрицу с одним явным пиком
    const matrix = rows.map(() => cols.map(() => rng.int(10, 60)));

    const peakRow = rng.int(0, rows.length - 1);
    const peakCol = rng.int(0, cols.length - 1);
    matrix[peakRow][peakCol] = rng.int(150, 250);

    // Варианты: 3 других клетки + правильная
    const wrongCells = [];
    while (wrongCells.length < 3) {
      const r = rng.int(0, rows.length - 1);
      const c = rng.int(0, cols.length - 1);
      const key = `${r}-${c}`;
      if (r === peakRow && c === peakCol) continue;
      if (wrongCells.some((wc) => wc.key === key)) continue;
      wrongCells.push({ key, row: r, col: c });
    }

    const options = rng.shuffle([
      ...wrongCells.map((wc) => ({
        id: 'opt_' + wc.key,
        code: `${rows[wc.row]} × ${cols[wc.col]}`,
        correct: false,
        explain: `${rows[wc.row]} × ${cols[wc.col]} — ${matrix[wc.row][wc.col]}. Не пик.`,
      })),
      {
        id: 'opt_correct',
        code: `${rows[peakRow]} × ${cols[peakCol]}`,
        correct: true,
        explain: `${rows[peakRow]} × ${cols[peakCol]} — ${matrix[peakRow][peakCol]}. Самый яркий квадрат на heatmap.`,
      },
    ]);

    return {
      id: 'vision_heat_peak_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Пик на heatmap',
      chart: {
        type: 'heatmap',
        title: theme.name,
        data: {
          labels: cols,
          rows: rows,
          matrix,
          datasets: [{ label: '', values: [] }],
        },
      },
      question: 'Где самый яркий квадрат (максимум)?',
      options,
      hint: 'Ищи самую тёмную/яркую клетку',
    };
  },
};
