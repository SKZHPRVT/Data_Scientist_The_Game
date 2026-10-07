// Генератор: распределение на histogram
import { SeededRandom } from '../seededRandom.js';

export const histShape = {
  id: 'hist_shape',
  name: 'Форма распределения',
  type: 'histogram',
  icon: '🔔',
  category: 'histogram',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Зарплаты', unit: 'чел.' },
      { name: 'Рост', unit: 'чел.' },
      { name: 'Время отклика', unit: 'запросов' },
      { name: 'Возраст', unit: 'чел.' },
    ]);

    const shape = rng.pick(['normal', 'left', 'right', 'bimodal']);
    const bins = ['30-50', '50-70', '70-90', '90-110', '110-130', '130-150', '150+'];
    let counts;

    if (shape === 'normal') {
      counts = [10, 30, 80, 120, 80, 30, 10];
    } else if (shape === 'right') {
      counts = [15, 40, 90, 130, 90, 50, 25];
    } else if (shape === 'left') {
      counts = [25, 50, 90, 130, 90, 40, 15];
    } else if (shape === 'bimodal') {
      counts = [90, 30, 15, 10, 15, 30, 90];
    }

    // Шум
    counts = counts.map((c) => Math.max(5, c + rng.int(-10, 10)));

    // Верный ответ
    const shapeNames = {
      normal: 'Приблизительно нормальное (симметричный колокол)',
      right: 'Скошено вправо (длинный хвост справа)',
      left: 'Скошено влево (длинный хвост слева)',
      bimodal: 'Бимодальное (два пика)',
    };

    return {
      id: 'vision_hist_shape_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Распределение',
      chart: {
        type: 'histogram',
        title: `Распределение ${theme.name.toLowerCase()}`,
        data: {
          labels: bins,
          datasets: [{ label: theme.unit, values: counts }],
        },
      },
      question: `Какое распределение у ${theme.name.toLowerCase()}?`,
      options: rng.shuffle([
        { id: 'normal', code: 'Приблизительно нормальное (колокол)', correct: shape === 'normal',
          explain: shape === 'normal' ? 'Симметричный колокол: пик в центре, плавно спадает в обе стороны.' : 'Не колокол — форма несимметричная.' },
        { id: 'right', code: 'Скошено вправо (хвост справа)', correct: shape === 'right',
          explain: shape === 'right' ? 'Пик слева, длинный хвост справа — классическое правое скошение.' : 'Хвост не справа.' },
        { id: 'left', code: 'Скошено влево (хвост слева)', correct: shape === 'left',
          explain: shape === 'left' ? 'Пик справа, длинный хвост слева.' : 'Хвост не слева.' },
        { id: 'bimodal', code: 'Бимодальное (два пика)', correct: shape === 'bimodal',
          explain: shape === 'bimodal' ? 'Два пика — возможно, две разные группы в данных.' : 'Не два пика.' },
      ]),
      hint: 'Ищи форму: колокол, скошение, два пика',
    };
  },
};
