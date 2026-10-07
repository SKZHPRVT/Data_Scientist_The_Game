// Генератор: определить IQR
import { SeededRandom } from '../seededRandom.js';

export const boxplotIQR = {
  id: 'boxplot_iqr',
  name: 'IQR',
  type: 'boxplot',
  icon: '📦',
  category: 'boxplot',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Время отклика', unit: 'мс', groups: ['Метод A', 'Метод B', 'Метод C'] },
      { name: 'Выручка отделов', unit: 'тыс.', groups: ['Отдел X', 'Отдел Y', 'Отдел Z'] },
    ]);

    const groups = theme.groups;
    const datasets = groups.map((g) => {
      const median = rng.int(60, 120);
      const iqr = rng.int(20, 50);  // размер ящика
      return {
        label: g,
        min: median - iqr - rng.int(5, 15),
        q1: median - Math.floor(iqr / 2),
        median,
        q3: median + Math.floor(iqr / 2),
        max: median + iqr + rng.int(5, 15),
      };
    });

    // Находим группу с самым широким IQR
    let widestIdx = 0;
    let widestIQR = 0;
    datasets.forEach((d, i) => {
      const iqr = d.q3 - d.q1;
      if (iqr > widestIQR) {
        widestIQR = iqr;
        widestIdx = i;
      }
    });

    return {
      id: 'vision_boxplot_iqr_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'IQR',
      chart: {
        type: 'boxplot',
        title: theme.name,
        data: {
          labels: groups,
          datasets: [{ label: theme.unit, values: [], boxData: datasets }],
        },
      },
      question: 'В какой группе самый широкий IQR (размер ящика)?',
      options: rng.shuffle(
        groups.map((g, i) => ({
          id: 'opt_' + i,
          code: g,
          correct: i === widestIdx,
          explain: i === widestIdx
            ? `${g} — самый широкий ящик. Значит, данные в этой группе более разбросаны.`
            : `${g} — ящик уже, данные более однородны.`,
        }))
      ),
      hint: 'IQR = размер ящика. Где он самый большой?',
    };
  },
};
