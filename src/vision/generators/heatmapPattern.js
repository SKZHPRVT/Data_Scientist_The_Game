// Генератор: heatmap с паттерном
import { SeededRandom } from '../seededRandom.js';

export const heatmapPattern = {
  id: 'heatmap_pattern',
  name: 'Паттерн на heatmap',
  type: 'heatmap',
  icon: '🔥',
  category: 'heatmap',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const rows = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const cols = ['9:00', '12:00', '15:00', '18:00', '21:00'];

    const pattern = rng.pick(['weekday', 'weekend', 'random']);

    const matrix = rows.map((row, ri) => {
      return cols.map((col, ci) => {
        if (pattern === 'weekday') {
          // Будни — активно, выходные — тихо
          const isWeekend = ri >= 5;
          if (isWeekend) return rng.int(5, 15);
          // В будни пик в середине дня
          const hourFactor = [0.6, 1.0, 0.9, 1.0, 0.7][ci];
          return Math.round(rng.int(50, 80) * hourFactor);
        } else if (pattern === 'weekend') {
          // Выходные — активно, будни — тихо
          const isWeekend = ri >= 5;
          if (!isWeekend) return rng.int(10, 20);
          const hourFactor = [0.5, 0.9, 1.0, 0.9, 0.7][ci];
          return Math.round(rng.int(60, 90) * hourFactor);
        } else {
          return rng.int(10, 80);
        }
      });
    });

    const correctId = pattern === 'weekday' ? 'weekday' : pattern === 'weekend' ? 'weekend' : 'random';

    return {
      id: 'vision_heat_pattern_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Паттерн на heatmap',
      chart: {
        type: 'heatmap',
        title: 'Активность по дням и часам',
        data: {
          labels: cols,
          rows,
          matrix,
          datasets: [{ label: '', values: [] }],
        },
      },
      question: 'Какой паттерн виден на heatmap?',
      options: rng.shuffle([
        {
          id: 'weekday',
          code: 'Будни активнее выходных, пик днём',
          correct: correctId === 'weekday',
          explain: correctId === 'weekday'
            ? 'Пн-Пт — яркие, Сб-Вс — тёмные. Пик в 12:00-18:00. Классический рабочий паттерн.'
            : 'Неверно — не видно явного доминирования будней.',
        },
        {
          id: 'weekend',
          code: 'Выходные активнее будней',
          correct: correctId === 'weekend',
          explain: correctId === 'weekend'
            ? 'Сб-Вс — яркие, Пн-Пт — тёмные. Похоже на B2C-сервис или развлечения.'
            : 'Неверно — выходные не выделяются.',
        },
        {
          id: 'random',
          code: 'Паттерна нет, хаос',
          correct: correctId === 'random',
          explain: correctId === 'random'
            ? 'Яркость распределена случайно. Паттерна нет.'
            : 'Неверно — паттерн есть, он повторяется.',
        },
        {
          id: 'night',
          code: 'Ночью активнее днём',
          correct: false,
          explain: 'Неверно — на графике часы 9-21, ночного паттерна не видно.',
        },
      ]),
      hint: 'Ищи яркие/тёмные строки или столбцы',
    };
  },
};
