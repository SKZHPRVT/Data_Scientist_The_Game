// Генератор: boxplot с медианой
import { SeededRandom } from '../seededRandom.js';

export const boxplotMedian = {
  id: 'boxplot_median',
  name: 'Медиана',
  type: 'boxplot',
  icon: '📦',
  category: 'boxplot',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Зарплаты', unit: 'тыс.', groups: ['Backend', 'Frontend', 'Data', 'QA'] },
      { name: 'Оценки', unit: 'баллов', groups: ['Группа A', 'Группа B', 'Группа C'] },
      { name: 'Время отклика', unit: 'мс', groups: ['Endpoint 1', 'Endpoint 2', 'Endpoint 3'] },
    ]);

    const groups = theme.groups;

    // Для каждой группы генерим boxplot-данные
    const datasets = groups.map((g) => {
      const median = rng.int(40, 120);
      const iqr = rng.int(15, 40);
      const min = Math.max(5, median - iqr - rng.int(10, 30));
      const max = median + iqr + rng.int(10, 30);
      return {
        label: g,
        min,
        q1: median - Math.floor(iqr / 2),
        median,
        q3: median + Math.floor(iqr / 2),
        max,
      };
    });

    // Находим медиану-максимум
    let maxMedianIdx = 0;
    datasets.forEach((d, i) => {
      if (d.median > datasets[maxMedianIdx].median) maxMedianIdx = i;
    });

    // Вопрос: у какой группы медиана выше?
    const otherIndices = datasets.map((_, i) => i).filter((i) => i !== maxMedianIdx);
    const options = rng.shuffle([
      ...datasets.map((d, i) => ({
        id: 'opt_' + i,
        code: d.label,
        correct: i === maxMedianIdx,
        explain: i === maxMedianIdx
          ? `${d.label} — медиана ${d.median} ${theme.unit}. Самая высокая линия в ящике.`
          : `${d.label} — медиана ${d.median}, ниже чем у лидера.`,
      })),
    ]);

    return {
      id: 'vision_boxplot_median_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Медиана',
      chart: {
        type: 'boxplot',
        title: theme.name,
        data: {
          labels: groups,
          datasets: [{ label: theme.unit, values: [], boxData: datasets }],
        },
      },
      question: `У какой группы медиана выше?`,
      options,
      hint: 'Медиана — это линия внутри ящика',
    };
  },
};
