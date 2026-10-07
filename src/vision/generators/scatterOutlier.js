// Генератор: выброс на scatter
import { SeededRandom } from '../seededRandom.js';

export const scatterOutlier = {
  id: 'scatter_outlier',
  name: 'Выброс',
  type: 'scatter',
  icon: '✨',
  category: 'scatter',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { x: 'Возраст', y: 'Зарплата' },
      { x: 'Площадь', y: 'Цена' },
      { x: 'Опыт', y: 'Оклад' },
    ]);

    // Обычная корреляция
    const points = [];
    for (let i = 0; i < 22; i++) {
      const x = rng.int(20, 60);
      const y = x * 3 + rng.int(-20, 20);
      points.push({ x, y, outlier: false });
    }

    // Один выброс — резко выше или ниже
    const outlierType = rng.pick(['high', 'low']);
    const outlierX = rng.int(25, 55);
    const outlierY = outlierType === 'high' ? 250 + rng.int(0, 50) : 20 + rng.int(0, 10);
    points.push({ x: outlierX, y: outlierY, outlier: true });

    return {
      id: 'vision_scatter_outlier_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Выброс на scatter',
      chart: {
        type: 'scatter',
        title: `${theme.y} vs ${theme.x}`,
        data: {
          labels: [],
          points,
          datasets: [{ label: theme.y, values: [] }],
        },
      },
      question: 'Что не так с этим графиком?',
      options: rng.shuffle([
        {
          id: 'outlier',
          code: 'Есть одна точка-выброс, которая резко отличается',
          correct: true,
          explain: `Точка (${outlierX}, ${outlierY}) далеко от облака. Это выброс — стоит проверить вручную.`,
        },
        {
          id: 'none',
          code: 'Всё нормально, точки по прямой',
          correct: false,
          explain: 'Не совсем — одна точка стоит в стороне от общей линии.',
        },
        {
          id: 'linear',
          code: 'Точки линейны, выбросов нет',
          correct: false,
          explain: 'Линейность есть, но одна точка явно выбивается.',
        },
        {
          id: 'corr',
          code: 'Корреляция отрицательная',
          correct: false,
          explain: 'Корреляция положительная (X растёт → Y растёт).',
        },
      ]),
      hint: 'Ищи точку, которая не вписывается в общий паттерн',
    };
  },
};
