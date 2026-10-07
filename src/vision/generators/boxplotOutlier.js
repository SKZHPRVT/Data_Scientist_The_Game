// Генератор: boxplot с выбросом
import { SeededRandom } from '../seededRandom.js';

export const boxplotOutlier = {
  id: 'boxplot_outlier',
  name: 'Выброс на boxplot',
  type: 'boxplot',
  icon: '📦',
  category: 'boxplot',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Время отклика API', unit: 'мс', groups: ['GET /users', 'POST /orders', 'GET /items'] },
      { name: 'Цены товаров', unit: 'руб.', groups: ['Категория A', 'Категория B', 'Категория C'] },
    ]);

    const groups = theme.groups;
    const datasets = groups.map((g) => {
      const median = rng.int(60, 120);
      const iqr = rng.int(20, 40);
      return {
        label: g,
        min: median - iqr - rng.int(5, 20),
        q1: median - Math.floor(iqr / 2),
        median,
        q3: median + Math.floor(iqr / 2),
        max: median + iqr + rng.int(5, 20),
        outliers: [],
      };
    });

    // Один выброс в случайной группе
    const outlierIdx = rng.int(0, groups.length - 1);
    const highOutlier = rng.next() > 0.5;
    const outlierValue = highOutlier
      ? datasets[outlierIdx].max + rng.int(80, 150)
      : Math.max(5, datasets[outlierIdx].min - rng.int(30, 60));

    datasets[outlierIdx].outliers.push(outlierValue);

    return {
      id: 'vision_boxplot_outlier_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Выброс на boxplot',
      chart: {
        type: 'boxplot',
        title: theme.name,
        data: {
          labels: groups,
          datasets: [{ label: theme.unit, values: [], boxData: datasets }],
        },
      },
      question: `В какой группе есть выброс?`,
      options: rng.shuffle(
        groups.map((g, i) => ({
          id: 'opt_' + i,
          code: g,
          correct: i === outlierIdx,
          explain: i === outlierIdx
            ? `${g} — есть точка вне "усов" (${outlierValue} ${theme.unit}). Это выброс.`
            : `${g} — все точки внутри усов, выбросов нет.`,
        }))
      ),
      hint: 'Выброс — точка за пределами "усов"',
    };
  },
};
