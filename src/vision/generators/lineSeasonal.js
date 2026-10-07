// Генератор: сезонность на линии
import { SeededRandom } from '../seededRandom.js';

export const lineSeasonal = {
  id: 'line_seasonal',
  name: 'Сезонность',
  type: 'line',
  icon: '📈',
  category: 'line',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const weeks = rng.int(2, 4);
    const daysPerWeek = 7;
    const points = weeks * daysPerWeek;
    const labels = [];
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < daysPerWeek; d++) {
        labels.push(dayNames[d]);
      }
    }

    // Паттерн: пик в середине недели (ср-чт-пт), спад на выходных
    const baseLevel = rng.int(80, 120);
    const peakMultiplier = 1.2 + rng.next() * 0.3;
    const weekendMultiplier = 0.4 + rng.next() * 0.2;

    const weekdayPattern = [0.85, 0.95, 1.0, 0.95, 0.9, weekendMultiplier, weekendMultiplier * 0.8];

    const values = labels.map((_, i) => {
      const dayOfWeek = i % daysPerWeek;
      const base = baseLevel * weekdayPattern[dayOfWeek];
      return Math.round(base + rng.int(-10, 10));
    });

    return {
      id: 'vision_line_seasonal_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Паттерн по неделям',
      chart: {
        type: 'line',
        title: 'Активность за ' + weeks + ' недели',
        data: {
          labels,
          datasets: [{ label: 'Активность', values }],
        },
      },
      question: 'Какой паттерн виден на графике?',
      options: rng.shuffle([
        {
          id: 'seasonal',
          code: 'Еженедельный паттерн: рост в середине недели, спад на выходных',
          correct: true,
          explain: 'Паттерн повторяется каждые 7 точек: пик в середине, спад на выходных. Это типичная сезонность.',
        },
        {
          id: 'up',
          code: 'Постоянный рост',
          correct: false,
          explain: 'Неверно — значения не растут монотонно, есть откаты.',
        },
        {
          id: 'random',
          code: 'Хаос, нет паттерна',
          correct: false,
          explain: 'Неверно — паттерн виден чётко, он повторяется каждую неделю.',
        },
        {
          id: 'down',
          code: 'Постоянное падение',
          correct: false,
          explain: 'Неверно — нет монотонного падения.',
        },
      ]),
      hint: 'Ищи повторяющийся паттерн',
    };
  },
};
