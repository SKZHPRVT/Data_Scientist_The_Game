// Генератор: пик на линейном графике
import { SeededRandom } from '../seededRandom.js';

export const linePeak = {
  id: 'line_peak',
  name: 'Пик линии',
  type: 'line',
  icon: '📈',
  category: 'line',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const points = rng.int(7, 10);
    const metric = rng.pick([
      { name: 'Просмотры', unit: 'раз' },
      { name: 'Продажи', unit: 'шт.' },
      { name: 'Заказы', unit: 'шт.' },
      { name: 'Регистрации', unit: 'чел.' },
    ]);
    const labelsList = {
      7: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
      8: ['Нед 1', 'Нед 2', 'Нед 3', 'Нед 4', 'Нед 5', 'Нед 6', 'Нед 7', 'Нед 8'],
      9: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'],
      10: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт'],
    };
    const labels = labelsList[points] || labelsList[7];

    // Генерим базовый уровень и пик в случайной позиции
    const baseLevel = rng.int(40, 100);
    const peakValue = baseLevel + rng.int(60, 120);
    const peakIndex = rng.int(1, points - 2); // не первый и не последний

    const values = labels.map((_, i) => {
      if (i === peakIndex) return peakValue;
      const dist = Math.abs(i - peakIndex);
      return Math.max(10, baseLevel + rng.int(-15, 15) - dist * 5);
    });

    // Собираем варианты: 4 случайных дня, включая правильный
    const indices = [peakIndex];
    while (indices.length < 4) {
      const idx = rng.int(0, points - 1);
      if (!indices.includes(idx)) indices.push(idx);
    }
    const shuffledIndices = rng.shuffle(indices);

    const options = shuffledIndices.map((idx) => ({
      id: 'opt_' + idx,
      code: labels[idx],
      correct: idx === peakIndex,
      explain: idx === peakIndex
        ? `${labels[idx]} — ${peakValue} ${metric.unit}. Самый высокий пик на графике.`
        : `Не ${labels[idx].toLowerCase()} — на графике значение ${values[idx]}, это не максимум.`,
    }));

    return {
      id: 'vision_line_peak_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Найди пик',
      chart: {
        type: 'line',
        title: `${metric.name}`,
        data: {
          labels,
          datasets: [{ label: metric.name, values }],
        },
      },
      question: `В какой точке пик ${metric.name.toLowerCase()}?`,
      options,
      hint: 'Найди самую высокую точку на линии',
    };
  },
};
