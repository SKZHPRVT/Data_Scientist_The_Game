// Генератор: аномалия на линии
import { SeededRandom } from '../seededRandom.js';

export const lineAnomaly = {
  id: 'line_anomaly',
  name: 'Аномалия на линии',
  type: 'line',
  icon: '📈',
  category: 'line',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const points = rng.int(8, 12);
    const metric = rng.pick([
      { name: 'Просмотры' },
      { name: 'Продажи' },
      { name: 'Заказы' },
      { name: 'Регистрации' },
    ]);
    const labelsList = {
      8: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс', 'Пн+1'],
      9: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'],
      10: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт'],
      11: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
      12: ['Нед1', 'Нед2', 'Нед3', 'Нед4', 'Нед5', 'Нед6', 'Нед7', 'Нед8', 'Нед9', 'Нед10', 'Нед11', 'Нед12'],
    };
    const labels = labelsList[points];

    const baseLevel = rng.int(80, 120);
    const anomalyType = rng.pick(['high', 'low']);
    const anomalyIdx = rng.int(2, points - 3);

    const values = labels.map((_, i) => {
      if (i === anomalyIdx) {
        return anomalyType === 'high'
          ? baseLevel + rng.int(80, 140)
          : Math.max(5, baseLevel - rng.int(50, 70));
      }
      return baseLevel + rng.int(-15, 15);
    });

    const anomalyValue = values[anomalyIdx];
    const isHigh = anomalyType === 'high';

    return {
      id: 'vision_line_anomaly_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Аномалия',
      chart: {
        type: 'line',
        title: `${metric.name}`,
        data: {
          labels,
          datasets: [{ label: metric.name, values }],
        },
      },
      question: 'Что здесь выделяется?',
      options: rng.shuffle([
        {
          id: 'anomaly',
          code: `${labels[anomalyIdx]} — ${isHigh ? 'аномальный пик' : 'аномальный провал'} (${anomalyValue})`,
          correct: true,
          explain: `Все значения около ${baseLevel}, но ${labels[anomalyIdx]} резко отличается (${anomalyValue}). Это аномалия — проверь, может ошибка или акция.`,
        },
        {
          id: 'first',
          code: `${labels[0]} — самый низкий`,
          correct: false,
          explain: `${labels[0]} — ${values[0]}, обычное значение.`,
        },
        {
          id: 'trend',
          code: 'Линия плавно растёт',
          correct: false,
          explain: 'Нет тренда, есть резкий выброс.',
        },
        {
          id: 'none',
          code: 'Ничего необычного',
          correct: false,
          explain: 'Нет, есть явная аномалия.',
        },
      ]),
      hint: 'Ищи точку, которая резко выбивается',
    };
  },
};
