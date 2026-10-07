// Генератор: топ-N на bar chart
import { SeededRandom } from '../seededRandom.js';

export const barTop = {
  id: 'bar_top',
  name: 'Топ-N',
  type: 'bar',
  icon: '📊',
  category: 'bar',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Продажи по городам', unit: 'шт.', cats: ['Москва', 'СПб', 'Казань', 'Новосибирск', 'Екатеринбург', 'Самара', 'Омск'] },
      { name: 'Скачивания приложений', unit: 'раз', cats: ['App A', 'App B', 'App C', 'App D', 'App E', 'App F'] },
      { name: 'Звёзды на GitHub', unit: '⭐', cats: ['repo_1', 'repo_2', 'repo_3', 'repo_4', 'repo_5'] },
    ]);

    const cats = theme.cats;
    // Генерим значения БЕЗ яркого максимума, чтобы был вопрос на подумать
    const values = cats.map(() => rng.int(20, 180));

    // Топ-2 = два наибольших
    const sorted = values.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
    const top1 = sorted[0].i;
    const top2 = sorted[1].i;

    return {
      id: 'vision_bar_top_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Топ-2',
      chart: {
        type: 'bar',
        title: theme.name,
        data: {
          labels: cats,
          datasets: [{ label: theme.name, values }],
        },
      },
      question: `Какая категория на втором месте по ${theme.unit}?`,
      options: rng.shuffle(
        cats.map((cat, i) => ({
          id: 'opt_' + i,
          code: cat,
          correct: i === top2,
          explain: i === top2
            ? `${cat} — ${values[i]} ${theme.unit}. Второе место после ${cats[top1]}.`
            : i === top1
              ? `Не ${cat.toLowerCase()} — это первое место. Вопрос про второе.`
              : `${cat} — ${values[i]}. Это не второе место.`,
        })).slice(0, 4)
      ),
      hint: 'Сначала найди максимум, потом — кто следующий',
    };
  },
};
