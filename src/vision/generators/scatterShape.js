// Генератор: форма связи
import { SeededRandom } from '../seededRandom.js';

export const scatterShape = {
  id: 'scatter_shape',
  name: 'Форма связи',
  type: 'scatter',
  icon: '✨',
  category: 'scatter',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { x: 'Опыт', y: 'Зарплата' },
      { x: 'Время', y: 'Скорость' },
      { x: 'Доза', y: 'Эффект' },
    ]);

    const shapeType = rng.pick(['linear', 'curve-up', 'curve-down', 'none']);
    const points = [];

    for (let i = 0; i < 30; i++) {
      const x = rng.int(10, 190);
      let y;
      if (shapeType === 'linear') y = x * 0.7 + rng.int(-20, 20);
      else if (shapeType === 'curve-up') y = Math.pow(x / 20, 2) + rng.int(-10, 10);
      else if (shapeType === 'curve-down') y = 180 - Math.pow((x - 100) / 15, 2) + rng.int(-10, 10);
      else y = rng.int(10, 180);
      points.push({ x, y: Math.max(5, y) });
    }

    const shapeLabels = {
      linear: 'Прямая линия',
      'curve-up': 'Изгиб вверх (экспонента)',
      'curve-down': 'Изгиб вниз (парабола)',
      none: 'Хаос, нет формы',
    };

    return {
      id: 'vision_scatter_shape_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Форма связи',
      chart: {
        type: 'scatter',
        title: `${theme.y} vs ${theme.x}`,
        data: {
          labels: [],
          points,
          datasets: [{ label: theme.y, values: [] }],
        },
      },
      question: 'Какая форма связи между X и Y?',
      options: rng.shuffle([
        { id: 'linear', code: 'Прямая линия', correct: shapeType === 'linear',
          explain: shapeType === 'linear' ? 'Точки складываются в прямую линию.' : 'Форма не прямая.' },
        { id: 'curve-up', code: 'Изгиб вверх', correct: shapeType === 'curve-up',
          explain: shapeType === 'curve-up' ? 'Кривая растёт всё быстрее — экспоненциальный рост.' : 'Нет изгиба вверх.' },
        { id: 'curve-down', code: 'Изгиб вниз', correct: shapeType === 'curve-down',
          explain: shapeType === 'curve-down' ? 'Кривая сначала растёт, потом падает — парабола.' : 'Нет изгиба вниз.' },
        { id: 'none', code: 'Хаос, формы нет', correct: shapeType === 'none',
          explain: shapeType === 'none' ? 'Точки разбросаны хаотично.' : 'Форма есть.' },
      ]),
      hint: 'Смотри на общую форму облака точек',
    };
  },
};
