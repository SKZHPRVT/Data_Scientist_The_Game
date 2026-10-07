// Генератор: есть ли тренд
import { SeededRandom } from '../seededRandom.js';

export const lineNoTrend = {
  id: 'line_no_trend',
  name: 'Есть ли тренд?',
  type: 'line',
  icon: '📈',
  category: 'line',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const points = rng.int(8, 12);
    const labelsList = {
      8: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг'],
      10: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт'],
      12: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
    };
    const labels = labelsList[points];
    const metric = rng.pick([{ name: 'Выручка' }, { name: 'Активность' }, { name: 'Заказы' }]);

    // Паттерн: тренд или нет
    const hasTrend = rng.next() > 0.5;
    const level = rng.int(80, 120);

    let values;
    if (hasTrend) {
      const dir = rng.next() > 0.5 ? 1 : -1;
      values = labels.map((_, i) => {
        const trend = dir * i * rng.int(5, 12);
        return Math.max(10, level + trend + rng.int(-10, 10));
      });
    } else {
      values = labels.map(() => level + rng.int(-25, 25));
    }

    return {
      id: 'vision_line_no_trend_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Тренд',
      chart: {
        type: 'line',
        title: metric.name,
        data: {
          labels,
          datasets: [{ label: metric.name, values }],
        },
      },
      question: 'Есть ли тренд на графике?',
      options: rng.shuffle([
        { id: 'yes', code: 'Да, значения систематически растут или падают', correct: hasTrend,
          explain: hasTrend
            ? `Да — линия идёт ${values[values.length-1] > values[0] ? 'вверх' : 'вниз'} монотонно. Это тренд.`
            : 'Нет — значения колеблются вокруг одного уровня.' },
        { id: 'no', code: 'Нет, значения колеблются случайно', correct: !hasTrend,
          explain: !hasTrend
            ? 'Да — нет систематического роста или падения. Только случайные колебания.'
            : 'Нет — тренд есть, линия стабильно движется в одну сторону.' },
      ]),
      hint: 'Тренд — это систематическое движение в одну сторону',
    };
  },
};
