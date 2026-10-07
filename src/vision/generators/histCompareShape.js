// Генератор: определить форму распределения
import { SeededRandom } from '../seededRandom.js';

export const histCompareShape = {
  id: 'hist_compare_shape',
  name: 'Сравнить форму',
  type: 'histogram',
  icon: '🔔',
  category: 'histogram',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Возраст сотрудников', unit: 'чел.' },
      { name: 'Оценки за тест', unit: 'студентов' },
      { name: 'Высоты зданий', unit: 'зданий' },
    ]);
    const shape = rng.pick(['normal', 'right', 'bimodal']);

    const bins = ['0-20', '20-40', '40-60', '60-80', '80-100'];
    let counts;
    if (shape === 'normal') counts = [10, 60, 120, 60, 10];
    else if (shape === 'right') counts = [80, 100, 60, 30, 10];
    else counts = [90, 20, 40, 20, 90];

    counts = counts.map((c) => Math.max(5, c + rng.int(-10, 10)));

    const shapeDescriptions = {
      normal: 'Колокол — симметричное',
      right: 'Скошено влево — длинный хвост справа',
      bimodal: 'Два пика — бимодальное',
    };

    return {
      id: 'vision_hist_shape_cmp_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Сравнить форму',
      chart: {
        type: 'histogram',
        title: theme.name,
        data: {
          labels: bins,
          datasets: [{ label: theme.unit, values: counts }],
        },
      },
      question: 'Какая форма распределения?',
      options: rng.shuffle([
        { id: 'normal', code: 'Колокол (нормальное)', correct: shape === 'normal',
          explain: 'Симметричный пик в центре, плавный спад в обе стороны.' },
        { id: 'right', code: 'Скошено вправо (хвост справа)', correct: shape === 'right',
          explain: 'Пик слева, длинный хвост вправо.' },
        { id: 'bimodal', code: 'Бимодальное (два пика)', correct: shape === 'bimodal',
          explain: 'Два пика — возможно, две группы.' },
        { id: 'left', code: 'Скошено влево', correct: false,
          explain: 'Не влево — форма другая.' },
      ]),
      hint: 'Колокол, хвост, два пика?',
    };
  },
};
