// Генератор: сравнить медианы групп
import { SeededRandom } from '../seededRandom.js';

export const boxplotCompare = {
  id: 'boxplot_compare',
  name: 'Сравнить группы',
  type: 'boxplot',
  icon: '📦',
  category: 'boxplot',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Зарплаты по уровням', unit: 'тыс.', groups: ['Junior', 'Middle', 'Senior'] },
      { name: 'Цены по категориям', unit: 'руб.', groups: ['Эконом', 'Бизнес', 'Премиум'] },
    ]);

    const groups = theme.groups;
    const baseLevels = [50, 90, 140];
    const datasets = groups.map((g, i) => {
      const median = baseLevels[i] + rng.int(-15, 15);
      const iqr = rng.int(20, 40);
      return {
        label: g,
        min: median - iqr - rng.int(5, 15),
        q1: median - Math.floor(iqr / 2),
        median,
        q3: median + Math.floor(iqr / 2),
        max: median + iqr + rng.int(5, 15),
      };
    });

    let maxIdx = 0;
    datasets.forEach((d, i) => {
      if (d.median > datasets[maxIdx].median) maxIdx = i;
    });

    return {
      id: 'vision_boxplot_cmp_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Сравнение',
      chart: {
        type: 'boxplot',
        title: theme.name,
        data: {
          labels: groups,
          datasets: [{ label: theme.unit, values: [], boxData: datasets }],
        },
      },
      question: 'У какой группы медиана выше?',
      options: rng.shuffle(
        groups.map((g, i) => ({
          id: 'opt_' + i,
          code: g,
          correct: i === maxIdx,
          explain: i === maxIdx
            ? `${g} — медиана ${datasets[i].median}. Линия в ящике самая высокая.`
            : `${g} — медиана ${datasets[i].median}, ниже чем у лидера.`,
        }))
      ),
      hint: 'Медиана — линия внутри ящика',
    };
  },
};
