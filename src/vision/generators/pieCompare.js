// Генератор: сравнение двух секторов
import { SeededRandom } from '../seededRandom.js';

export const pieCompare = {
  id: 'pie_compare',
  name: 'Что больше?',
  type: 'pie',
  icon: '🥧',
  category: 'pie',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Источники трафика', cats: ['Google', 'Yandex', 'Соцсети', 'Прямые', 'Email'] },
      { name: 'Бюджет проекта', cats: ['Разработка', 'Маркетинг', 'Оборудование', 'Зарплаты', 'Прочее'] },
    ]);

    const cats = theme.cats;
    let values = cats.map(() => rng.int(5, 40));
    const sum = values.reduce((a, b) => a + b, 0);
    values = values.map((v) => Math.round((v / sum) * 100));
    values[values.length - 1] += 100 - values.reduce((a, b) => a + b, 0);

    // Находим топ-2
    const sorted = values.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
    const top1 = sorted[0].i;
    const top2 = sorted[1].i;

    // Вопрос: что больше — топ-1 или топ-2?
    return {
      id: 'vision_pie_compare_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Что больше?',
      chart: {
        type: 'doughnut',
        title: theme.name,
        data: {
          labels: cats,
          datasets: [{ label: '%', values, colors: ['#00ff41', '#00ccff', '#ffaa00', '#ff3333', '#aa66ff'] }],
        },
      },
      question: `Что больше: ${cats[top1]} или ${cats[top2]}?`,
      options: rng.shuffle([
        { id: 'first', code: cats[top1], correct: true,
          explain: `${cats[top1]} — ${values[top1]}%, больше чем ${cats[top2]} (${values[top2]}%).` },
        { id: 'second', code: cats[top2], correct: false,
          explain: `${cats[top2]} — ${values[top2]}%, меньше чем ${cats[top1]} (${values[top1]}%).` },
        { id: 'equal', code: 'Они равны', correct: false,
          explain: `Нет, ${values[top1]}% vs ${values[top2]}%.` },
      ]),
      hint: 'Сравни размеры двух секторов',
    };
  },
};
