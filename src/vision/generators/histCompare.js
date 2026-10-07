// Генератор: две гистограммы наложены
import { SeededRandom } from '../seededRandom.js';

export const histCompare = {
  id: 'hist_compare',
  name: 'Сравнение групп',
  type: 'histogram',
  icon: '🔔',
  category: 'histogram',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { name: 'Рост', unit: 'чел.', groupA: 'Мужчины', groupB: 'Женщины' },
      { name: 'Время на сайте', unit: 'сессий', groupA: 'Desktop', groupB: 'Mobile' },
      { name: 'Продолжительность жизни', unit: 'особей', groupA: 'Вид A', groupB: 'Вид B' },
    ]);

    const bins = ['0-20', '20-40', '40-60', '60-80', '80-100', '100-120'];

    // Группа A — сдвиг влево, B — вправо
    const valuesA = [80, 150, 120, 60, 20, 5];
    const valuesB = [10, 40, 100, 140, 80, 30];

    // Добавляем шум
    const a = valuesA.map((v) => Math.max(5, v + rng.int(-15, 15)));
    const b = valuesB.map((v) => Math.max(5, v + rng.int(-15, 15)));

    return {
      id: 'vision_hist_compare_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Сравнение групп',
      chart: {
        type: 'histogram',
        title: `Распределение ${theme.name.toLowerCase()}`,
        data: {
          labels: bins,
          datasets: [
            { label: theme.groupA, values: a, color: '#00ccff' },
            { label: theme.groupB, values: b, color: '#ffaa00' },
          ],
        },
      },
      question: `Какая группа в среднем выше по ${theme.name.toLowerCase()}?`,
      options: rng.shuffle([
        { id: 'a', code: theme.groupA, correct: false,
          explain: `${theme.groupA} смещена влево — пик в диапазоне 20-40, значения ниже.` },
        { id: 'b', code: theme.groupB, correct: true,
          explain: `${theme.groupB} смещена вправо — пик в диапазоне 60-80, значения выше.` },
        { id: 'same', code: 'Одинаковые', correct: false,
          explain: 'Не одинаковые — распределения сдвинуты.' },
        { id: 'cant', code: 'По гистограмме нельзя определить', correct: false,
          explain: 'Можно — видно, что одно распределение правее другого.' },
      ]),
      hint: 'Сравни, где находятся пики обоих распределений',
    };
  },
};
