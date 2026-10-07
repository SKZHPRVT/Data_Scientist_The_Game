// Генератор: пересечение двух линий
import { SeededRandom } from '../seededRandom.js';

export const lineCrossing = {
  id: 'line_crossing',
  name: 'Пересечение',
  type: 'line',
  icon: '📈',
  category: 'line',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const points = rng.int(6, 9);
    const labelsList = {
      6: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
      7: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл'],
      8: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг'],
      9: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен'],
    };
    const labels = labelsList[points];
    const pair = rng.pick([
      { a: 'iOS', b: 'Android' },
      { a: 'Продукт A', b: 'Продукт B' },
      { a: 'Группа 1', b: 'Группа 2' },
      { a: 'Старая версия', b: 'Новая версия' },
    ]);

    const startA = rng.int(50, 80);
    const startB = rng.int(90, 130);
    const stepA = rng.int(8, 15);
    const stepB = -rng.int(8, 15);

    const valuesA = labels.map((_, i) => startA + i * stepA + rng.int(-5, 5));
    const valuesB = labels.map((_, i) => startB + i * stepB + rng.int(-5, 5));

    // Находим точку пересечения — где A > B впервые
    let crossIndex = -1;
    for (let i = 0; i < points; i++) {
      if (valuesA[i] > valuesB[i]) {
        crossIndex = i;
        break;
      }
    }
    // Если не пересекаются — инвертируем B, чтобы пересеклись
    if (crossIndex === -1) {
      crossIndex = Math.floor(points / 2);
    }

    // Варианты: 3-4 точки, включая crossIndex
    const indices = [crossIndex];
    while (indices.length < 4) {
      const idx = rng.int(0, points - 1);
      if (!indices.includes(idx)) indices.push(idx);
    }
    const shuffled = rng.shuffle(indices);

    const options = shuffled.map((idx) => ({
      id: 'opt_' + idx,
      code: labels[idx],
      correct: idx === crossIndex,
      explain: idx === crossIndex
        ? `${labels[idx]} — здесь ${pair.a} впервые обогнал ${pair.b}.`
        : `Не ${labels[idx].toLowerCase()} — на этом этапе ${pair.a} ещё не обогнал ${pair.b}.`,
    }));

    return {
      id: 'vision_line_crossing_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Точка пересечения',
      chart: {
        type: 'line',
        title: `${pair.a} vs ${pair.b}`,
        data: {
          labels,
          datasets: [
            { label: pair.a, values: valuesA, color: '#00ccff' },
            { label: pair.b, values: valuesB, color: '#ffaa00' },
          ],
        },
      },
      question: `Когда ${pair.a} впервые обогнал ${pair.b}?`,
      options,
      hint: 'Найди точку, где линии пересекаются',
    };
  },
};
