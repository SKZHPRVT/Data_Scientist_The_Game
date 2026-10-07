// Генератор: одно или два модальных значения
import { SeededRandom } from '../seededRandom.js';

export const histTwoModes = {
  id: 'hist_two_modes',
  name: 'Одна или две моды?',
  type: 'histogram',
  icon: '🔔',
  category: 'histogram',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Зарплаты', unit: 'чел.' },
      { name: 'Время на сайте', unit: 'сессий' },
      { name: 'Рост', unit: 'чел.' },
    ]);

    const hasTwoModes = rng.next() > 0.5;

    const bins = ['0-20', '20-40', '40-60', '60-80', '80-100', '100-120'];

    let counts;
    if (hasTwoModes) {
      counts = [90, 40, 15, 15, 40, 90];
    } else {
      counts = [10, 50, 120, 80, 30, 5];
    }

    counts = counts.map((c) => Math.max(3, c + rng.int(-10, 10)));

    return {
      id: 'vision_hist_two_modes_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Моды',
      chart: {
        type: 'histogram',
        title: theme.name,
        data: {
          labels: bins,
          datasets: [{ label: theme.unit, values: counts }],
        },
      },
      question: 'Сколько мод (пиков) на графике?',
      options: rng.shuffle([
        { id: 'one', code: 'Одна мода (один пик)', correct: !hasTwoModes,
          explain: !hasTwoModes
            ? 'Да, один явный пик. Стандартное распределение.'
            : 'Нет, два пика.' },
        { id: 'two', code: 'Две моды (два пика)', correct: hasTwoModes,
          explain: hasTwoModes
            ? 'Да, два пика. Возможно, две разные группы в данных.'
            : 'Нет, только один пик.' },
      ]),
      hint: 'Посчитай горбы',
    };
  },
};
