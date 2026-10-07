// Генератор: одна категория резко отличается
import { SeededRandom } from '../seededRandom.js';

export const barDistribution = {
  id: 'bar_distribution',
  name: 'Аномалия',
  type: 'bar',
  icon: '📊',
  category: 'bar',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Продажи по дням', unit: 'шт.', cats: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
      { name: 'Заказы по часам', unit: 'заказов', cats: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] },
      { name: 'Трафик по минутам', unit: 'раз', cats: ['Мин 1', 'Мин 2', 'Мин 3', 'Мин 4', 'Мин 5', 'Мин 6', 'Мин 7', 'Мин 8'] },
    ]);

    const cats = theme.cats;
    const baseLevel = rng.int(40, 60);

    // Обычные значения — плавают вокруг baseLevel
    const values = cats.map(() => baseLevel + rng.int(-10, 10));

    // Один — аномальный (либо сильно выше, либо сильно ниже)
    const anomalyType = rng.pick(['high', 'low']);
    const anomalyIdx = rng.int(1, cats.length - 2);
    values[anomalyIdx] = anomalyType === 'high'
      ? baseLevel + rng.int(80, 150)
      : Math.max(5, baseLevel - rng.int(30, 40));

    const anomalyValue = values[anomalyIdx];
    const isHigh = anomalyType === 'high';

    return {
      id: 'vision_bar_dist_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Аномалия',
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
          id: 'anomaly',
          code: `${cats[anomalyIdx]} — ${isHigh ? 'аномально высокий' : 'аномально низкий'} (${anomalyValue} ${theme.unit})`,
          correct: true,
          explain: `Все значения около ${baseLevel}, но ${cats[anomalyIdx]} резко отличается (${anomalyValue}). Это выброс — проверь, может акция или ошибка.`,
        },
        {
          id: 'none',
          code: 'Ничего — все значения одинаковые',
          correct: false,
          explain: 'Нет, есть явный выброс.',
        },
        {
          id: 'first',
          code: `${cats[0]} самый низкий`,
          correct: false,
          explain: `${cats[0]} — ${values[0]}, обычное значение.`,
        },
        {
          id: 'all',
          code: 'Все значения плавают случайно',
          correct: false,
          explain: 'Не совсем — большинство значений близко, но есть один выброс.',
        },
      ]),
      hint: 'Ищи столбик, который резко выбивается',
    };
  },
};
