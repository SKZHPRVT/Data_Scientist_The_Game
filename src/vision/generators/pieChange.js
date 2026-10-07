// Генератор: pie с аномально большой долей
import { SeededRandom } from '../seededRandom.js';

export const pieChange = {
  id: 'pie_change',
  name: 'Доминирующая доля',
  type: 'pie',
  icon: '🥧',
  category: 'pie',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Продажи по продуктам', cats: ['Продукт A', 'Продукт B', 'Продукт C', 'Продукт D'] },
      { name: 'Бюджет проекта', cats: ['Разработка', 'Маркетинг', 'Инфраструктура', 'Прочее'] },
    ]);

    const cats = theme.cats;
    // Одна категория доминирует (60-75%)
    const dominantIdx = rng.int(0, cats.length - 1);
    const dominantValue = rng.int(60, 75);

    const remaining = 100 - dominantValue;
    const othersCount = cats.length - 1;
    const othersValues = [];
    let left = remaining;
    for (let i = 0; i < othersCount - 1; i++) {
      const v = rng.int(3, Math.floor(left / 2));
      othersValues.push(v);
      left -= v;
    }
    othersValues.push(left);

    const values = [];
    let oi = 0;
    for (let i = 0; i < cats.length; i++) {
      if (i === dominantIdx) values.push(dominantValue);
      else values.push(othersValues[oi++]);
    }

    const others = values.filter((_, i) => i !== dominantIdx);
    const maxOther = Math.max(...others);

    return {
      id: 'vision_pie_change_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Доминирование',
      chart: {
        type: 'doughnut',
        title: theme.name,
        data: {
          labels: cats,
          datasets: [{ label: '%', values, colors: ['#00ff41', '#00ccff', '#ffaa00', '#ff3333', '#aa66ff'] }],
        },
      },
      question: 'Что здесь видно?',
      options: rng.shuffle([
        {
          id: 'dom',
          code: `${cats[dominantIdx]} доминирует — ${dominantValue}% рынка`,
          correct: true,
          explain: `${cats[dominantIdx]} занимает ${dominantValue}% — это больше чем все остальные вместе.`,
        },
        {
          id: 'equal',
          code: 'Все категории примерно равны',
          correct: false,
          explain: 'Нет, есть явный лидер.',
        },
        {
          id: 'small',
          code: 'Все доли маленькие, кроме одной',
          correct: false,
          explain: 'Формально так, но правильнее сказать — один доминирует.',
        },
        {
          id: 'two',
          code: 'Два крупных сектора',
          correct: false,
          explain: 'Нет, только один крупный.',
        },
      ]),
      hint: 'Ищи сектор, который больше половины',
    };
  },
};
