// Генератор: корреляция на scatter
import { SeededRandom } from '../seededRandom.js';

export const scatterCorr = {
  id: 'scatter_corr',
  name: 'Корреляция',
  type: 'scatter',
  icon: '✨',
  category: 'scatter',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { x: 'Просмотры', y: 'Коммиты' },
      { x: 'Опыт (лет)', y: 'Зарплата' },
      { x: 'Реклама ($)', y: 'Продажи' },
      { x: 'Часы учёбы', y: 'Оценка' },
      { x: 'Население', y: 'Магазины' },
    ]);

    const corrType = rng.pick(['positive', 'negative', 'none']);
    const points = [];

    if (corrType === 'positive') {
      for (let i = 0; i < 25; i++) {
        const x = rng.int(10, 200);
        const y = Math.max(5, x * 0.7 + rng.int(-30, 30));
        points.push({ x, y });
      }
    } else if (corrType === 'negative') {
      for (let i = 0; i < 25; i++) {
        const x = rng.int(10, 200);
        const y = Math.max(5, 180 - x * 0.7 + rng.int(-30, 30));
        points.push({ x, y });
      }
    } else {
      for (let i = 0; i < 25; i++) {
        points.push({ x: rng.int(10, 200), y: rng.int(10, 180) });
      }
    }

    const correctId = corrType === 'positive' ? 'pos' : corrType === 'negative' ? 'neg' : 'none';

    return {
      id: 'vision_scatter_corr_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Связь',
      chart: {
        type: 'scatter',
        title: `${theme.y} vs ${theme.x}`,
        data: {
          labels: [],
          points,
          datasets: [{ label: theme.y, values: [] }],
        },
      },
      question: `Какая связь между ${theme.x.toLowerCase()} и ${theme.y.toLowerCase()}?`,
      options: rng.shuffle([
        {
          id: 'pos',
          code: 'Положительная — чем больше X, тем больше Y',
          correct: correctId === 'pos',
          explain: correctId === 'pos'
            ? 'Точки идут снизу-слева вверх-направо. Больше X → больше Y.'
            : 'Неверно — нет роста снизу-слева вверх-направо.',
        },
        {
          id: 'neg',
          code: 'Отрицательная — чем больше X, тем меньше Y',
          correct: correctId === 'neg',
          explain: correctId === 'neg'
            ? 'Точки идут сверху-слева вниз-направо. Больше X → меньше Y.'
            : 'Неверно — нет падения сверху-слева вниз-направо.',
        },
        {
          id: 'none',
          code: 'Связи нет — облако точек',
          correct: correctId === 'none',
          explain: correctId === 'none'
            ? 'Точки разбросаны хаотично — связи между X и Y нет.'
            : 'Неверно — связь есть, точки складываются в линию.',
        },
      ]),
      hint: 'Если точки складываются в линию — есть корреляция',
    };
  },
};
