// Генератор: круговая диаграмма, доли
import { SeededRandom } from '../seededRandom.js';

export const pieProportion = {
  id: 'pie_proportion',
  name: 'Доля',
  type: 'pie',
  icon: '🥧',
  category: 'pie',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Распределение времени', cats: ['Кодинг', 'Митинги', 'Ревью', 'Другое'] },
      { name: 'Источники трафика', cats: ['Органика', 'Реклама', 'Соцсети', 'Прямые'] },
      { name: 'Доля рынка', cats: ['Компания A', 'Компания B', 'Компания C', 'Другие'] },
    ]);

    const cats = theme.cats;
    // Генерим доли, сумма ≈ 100
    let values = cats.map(() => rng.int(10, 40));
    const sum = values.reduce((a, b) => a + b, 0);
    values = values.map((v) => Math.round((v / sum) * 100));
    // Корректируем последнее значение, чтобы сумма была 100
    const diff = 100 - values.reduce((a, b) => a + b, 0);
    values[values.length - 1] += diff;

    // Находим максимум
    let maxIdx = 0;
    values.forEach((v, i) => {
      if (v > values[maxIdx]) maxIdx = i;
    });

    return {
      id: 'vision_pie_prop_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Пропорции',
      chart: {
        type: 'doughnut',
        title: theme.name,
        data: {
          labels: cats,
          datasets: [{ label: '%', values, colors: ['#00ff41', '#00ccff', '#ffaa00', '#ff3333', '#aa66ff'] }],
        },
      },
      question: `Какая категория занимает больше всего?`,
      options: rng.shuffle(
        cats.map((c, i) => ({
          id: 'opt_' + i,
          code: `${c} (${values[i]}%)`,
          correct: i === maxIdx,
          explain: i === maxIdx
            ? `${c} — ${values[i]}% — самый крупный сектор.`
            : `${c} — ${values[i]}%, меньше чем у лидера.`,
        }))
      ),
      hint: 'Самый большой сектор',
    };
  },
};
