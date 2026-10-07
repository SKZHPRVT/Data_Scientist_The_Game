// Генератор: сравнение категорий столбиками
import { SeededRandom } from '../seededRandom.js';

export const barCompare = {
  id: 'bar_compare',
  name: 'Сравнение категорий',
  type: 'bar',
  icon: '📊',
  category: 'bar',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Коммиты по отделам', unit: 'коммитов', cats: ['Backend', 'Frontend', 'Data', 'DevOps', 'QA'] },
      { name: 'Продажи по регионам', unit: 'шт.', cats: ['Москва', 'СПб', 'Казань', 'Новосибирск', 'Екатеринбург'] },
      { name: 'Пользователи по платформам', unit: 'чел.', cats: ['iOS', 'Android', 'Web', 'Desktop'] },
      { name: 'Заказы по дням', unit: 'заказов', cats: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] },
      { name: 'Выручка по продуктам', unit: 'тыс.', cats: ['Продукт A', 'Продукт B', 'Продукт C', 'Продукт D'] },
    ]);

    const cats = theme.cats;
    const values = cats.map(() => rng.int(30, 200));

    // Находим максимум и минимум
    let maxIdx = 0;
    let minIdx = 0;
    values.forEach((v, i) => {
      if (v > values[maxIdx]) maxIdx = i;
      if (v < values[minIdx]) minIdx = i;
    });

    const questionType = rng.pick(['max', 'min']);

    // Собираем 4 варианта, включая правильный
    const correctIdx = questionType === 'max' ? maxIdx : minIdx;
    const indices = [correctIdx];
    while (indices.length < Math.min(4, cats.length)) {
      const idx = rng.int(0, cats.length - 1);
      if (!indices.includes(idx)) indices.push(idx);
    }
    const shuffled = rng.shuffle(indices);

    const options = shuffled.map((idx) => ({
      id: 'opt_' + idx,
      code: cats[idx],
      correct: idx === correctIdx,
      explain: idx === correctIdx
        ? `${cats[idx]} — ${values[idx]} ${theme.unit}. ${questionType === 'max' ? 'Самый высокий' : 'Самый низкий'} столбик.`
        : `Не ${cats[idx].toLowerCase()} — значение ${values[idx]}. Сравни высоту столбиков.`,
    }));

    return {
      id: 'vision_bar_compare_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Сравнение',
      chart: {
        type: 'bar',
        title: theme.name,
        data: {
          labels: cats,
          datasets: [{ label: theme.name, values }],
        },
      },
      question: questionType === 'max'
        ? `Где больше всего ${theme.unit}?`
        : `Где меньше всего ${theme.unit}?`,
      options,
      hint: questionType === 'max'
        ? 'Самый высокий столбик'
        : 'Самый низкий столбик',
    };
  },
};
