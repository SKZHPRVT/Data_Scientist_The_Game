// Генератор: сравнение двух периодов
import { SeededRandom } from '../seededRandom.js';

export const barTrend = {
  id: 'bar_trend',
  name: 'Динамика',
  type: 'bar',
  icon: '📊',
  category: 'bar',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Продажи по месяцам', unit: 'шт.', cats: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'] },
      { name: 'Трафик по дням', unit: 'раз', cats: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] },
      { name: 'Заказы по неделям', unit: 'шт.', cats: ['Нед 1', 'Нед 2', 'Нед 3', 'Нед 4'] },
    ]);
    const cats = theme.cats;
    const trendType = rng.pick(['growth', 'decline', 'volatile']);

    let values;
    if (trendType === 'growth') {
      values = cats.map((_, i) => 40 + i * 15 + rng.int(-10, 10));
    } else if (trendType === 'decline') {
      values = cats.map((_, i) => 140 - i * 15 + rng.int(-10, 10));
    } else {
      values = cats.map(() => rng.int(40, 120));
    }

    const last = values[values.length - 1];
    const first = values[0];
    const diff = last - first;

    return {
      id: 'vision_bar_trend_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Динамика',
      chart: {
        type: 'bar',
        title: theme.name,
        data: {
          labels: cats,
          datasets: [{ label: theme.name, values }],
        },
      },
      question: 'Как меняется значение со временем?',
      options: rng.shuffle([
        { id: 'up', code: 'Растёт', correct: trendType === 'growth',
          explain: trendType === 'growth'
            ? `Да — от ${first} до ${last}. Значения увеличиваются.`
            : 'Нет — нет устойчивого роста.' },
        { id: 'down', code: 'Падает', correct: trendType === 'decline',
          explain: trendType === 'decline'
            ? `Да — от ${first} до ${last}. Значения уменьшаются.`
            : 'Нет — нет устойчивого падения.' },
        { id: 'flat', code: 'Колеблется без тренда', correct: trendType === 'volatile',
          explain: trendType === 'volatile'
            ? 'Да — значения скачут случайно, без устойчивого направления.'
            : 'Нет — есть явный тренд.' },
      ]),
      hint: 'Сравни первый и последний столбик',
    };
  },
};
