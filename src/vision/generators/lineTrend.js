// Генератор: тренд на линейном графике
import { SeededRandom } from '../seededRandom.js';

export const lineTrend = {
  id: 'line_trend',
  name: 'Тренд линии',
  type: 'line',
  icon: '📈',
  category: 'line',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const direction = rng.pick(['up', 'down', 'flat', 'up', 'down']); // перекос в сторону не-flat
    const points = rng.int(6, 12);
    const period = rng.pick(['месяцам', 'неделям', 'дням']);
    const metric = rng.pick([
      { name: 'Выручка', unit: 'тыс.', color: '#00ff41' },
      { name: 'Пользователи', unit: 'чел.', color: '#00ccff' },
      { name: 'Просмотры', unit: 'раз', color: '#ffaa00' },
      { name: 'Продажи', unit: 'шт.', color: '#ff3333' },
    ]);
    const labelsList = {
      'месяцам': ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
      'неделям': ['Нед 1', 'Нед 2', 'Нед 3', 'Нед 4', 'Нед 5', 'Нед 6', 'Нед 7', 'Нед 8', 'Нед 9', 'Нед 10', 'Нед 11', 'Нед 12'],
      'дням': ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс', 'Пн+1', 'Вт+1', 'Ср+1', 'Чт+1', 'Пт+1'],
    };
    const labels = labelsList[period].slice(0, points);

    const values = [];
    let current = rng.int(50, 200);

    for (let i = 0; i < points; i++) {
      if (i > 0) {
        if (direction === 'up') current += rng.int(5, 25);
        else if (direction === 'down') current -= rng.int(5, 25);
        else current += rng.int(-8, 8);
      }
      values.push(Math.max(10, current));
    }

    const correctOption = direction === 'up' ? 'up' : direction === 'down' ? 'down' : 'flat';

    const options = rng.shuffle([
      {
        id: 'up',
        code: 'Растёт',
        correct: correctOption === 'up',
        explain: correctOption === 'up'
          ? `Значения монотонно увеличиваются: ${values[0]} → ${values[values.length - 1]}. Устойчивый рост.`
          : 'Неверно — линия не идёт вверх стабильно.',
      },
      {
        id: 'down',
        code: 'Падает',
        correct: correctOption === 'down',
        explain: correctOption === 'down'
          ? `Значения монотонно уменьшаются: ${values[0]} → ${values[values.length - 1]}. Устойчивое падение.`
          : 'Неверно — линия не идёт вниз стабильно.',
      },
      {
        id: 'flat',
        code: 'Стоит на месте',
        correct: correctOption === 'flat',
        explain: correctOption === 'flat'
          ? `Значения колеблются вокруг одного уровня. Тренда нет.`
          : 'Неверно — есть явный тренд.',
      },
    ]);

    return {
      id: 'read_line_trend_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Тренд на графике',
      chart: {
        type: 'line',
        title: `${metric.name} по ${period}`,
        data: {
          labels,
          datasets: [{ label: metric.name, values, color: metric.color }],
        },
      },
      question: `Что происходит с ${metric.name.toLowerCase()}?`,
      options,
      hint: 'Смотри на наклон линии: вверх — растёт, вниз — падает, горизонтально — стоит',
    };
  },
};
