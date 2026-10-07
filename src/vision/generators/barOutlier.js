// Генератор: bar с выбросом
import { SeededRandom } from '../seededRandom.js';

export const barOutlier = {
  id: 'bar_outlier',
  name: 'Выброс на bar',
  type: 'bar',
  icon: '📊',
  category: 'bar',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Зарплаты по отделам', unit: 'тыс.', cats: ['Backend', 'Frontend', 'Data', 'QA', 'HR', 'Sales'] },
      { name: 'Цены товаров', unit: 'руб.', cats: ['Товар A', 'Товар B', 'Товар C', 'Товар D', 'Товар E'] },
    ]);

    const cats = theme.cats;
    const baseLevel = rng.int(50, 80);
    const values = cats.map(() => baseLevel + rng.int(-15, 15));

    // Один выброс
    const outlierIdx = rng.int(1, cats.length - 2);
    const isHigh = rng.next() > 0.5;
    values[outlierIdx] = isHigh ? baseLevel + rng.int(100, 180) : Math.max(5, baseLevel - rng.int(30, 45));

    const outlierValue = values[outlierIdx];

    return {
      id: 'vision_bar_outlier_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Выброс',
      chart: {
        type: 'bar',
        title: theme.name,
        data: {
          labels: cats,
          datasets: [{ label: theme.name, values }],
        },
      },
      question: 'Что здесь выделяется?',
      options: rng.shuffle([
        {
          id: 'outlier',
          code: `${cats[outlierIdx]} — ${isHigh ? 'аномально высокий' : 'аномально низкий'} (${outlierValue} ${theme.unit})`,
          correct: true,
          explain: `Большинство значений ~${baseLevel}, но ${cats[outlierIdx]} резко отличается. Выброс.`,
        },
        {
          id: 'first',
          code: `${cats[0]} — ${values[0]}`,
          correct: false,
          explain: `${cats[0]} — обычное значение.`,
        },
        {
          id: 'all',
          code: 'Все значения одинаковые',
          correct: false,
          explain: 'Нет, есть явный выброс.',
        },
        {
          id: 'none',
          code: 'Ничего не выделяется',
          correct: false,
          explain: 'Нет, один столбик сильно отличается.',
        },
      ]),
      hint: 'Ищи самый высокий или самый низкий столбик',
    };
  },
};
