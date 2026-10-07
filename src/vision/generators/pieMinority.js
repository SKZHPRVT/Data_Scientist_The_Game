// Генератор: найти самый маленький сектор
import { SeededRandom } from '../seededRandom.js';

export const pieMinority = {
  id: 'pie_minority',
  name: 'Самый маленький',
  type: 'pie',
  icon: '🥧',
  category: 'pie',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Распределение ошибок', cats: ['TypeError', 'KeyError', 'ValueError', 'IndexError', 'Другие'] },
      { name: 'Причины оттока', cats: ['Цена', 'Качество', 'Конкуренты', 'Переезд', 'Другое'] },
    ]);

    const cats = theme.cats;
    let values = cats.map(() => rng.int(5, 40));
    // Один явно маленький
    const minIdx = rng.int(0, cats.length - 1);
    values[minIdx] = rng.int(2, 6);

    const sum = values.reduce((a, b) => a + b, 0);
    const norm = values.map((v) => Math.round((v / sum) * 100));
    norm[norm.length - 1] += 100 - norm.reduce((a, b) => a + b, 0);

    return {
      id: 'vision_pie_minority_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Самый маленький',
      chart: {
        type: 'doughnut',
        title: theme.name,
        data: {
          labels: cats,
          datasets: [{ label: '%', values: norm, colors: ['#00ff41', '#00ccff', '#ffaa00', '#ff3333', '#aa66ff'] }],
        },
      },
      question: 'Какая категория самая маленькая?',
      options: rng.shuffle(
        cats.map((c, i) => ({
          id: 'opt_' + i,
          code: `${c} (${norm[i]}%)`,
          correct: i === minIdx,
          explain: i === minIdx
            ? `${c} — ${norm[i]}%, самый тонкий сектор.`
            : `${c} — ${norm[i]}%, не самый маленький.`,
        }))
      ),
      hint: 'Ищи самый тонкий кусочек',
    };
  },
};
