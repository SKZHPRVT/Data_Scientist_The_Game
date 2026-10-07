// Генератор: кластеры на scatter
import { SeededRandom } from '../seededRandom.js';

export const scatterCluster = {
  id: 'scatter_cluster',
  name: 'Кластеры',
  type: 'scatter',
  icon: '✨',
  category: 'scatter',

  generate(seed) {
    const rng = new SeededRandom(seed);
    const theme = rng.pick([
      { x: 'Рост', y: 'Вес' },
      { x: 'Возраст', y: 'Доход' },
      { x: 'Опыт', y: 'Зарплата' },
    ]);

    const numClusters = rng.pick([1, 2, 3]);
    const points = [];

    if (numClusters === 1) {
      // Один плотный кластер
      const cx = rng.int(80, 120);
      const cy = rng.int(80, 120);
      for (let i = 0; i < 30; i++) {
        points.push({
          x: cx + rng.int(-30, 30),
          y: cy + rng.int(-30, 30),
        });
      }
    } else if (numClusters === 2) {
      // Два кластера
      const clusters = [
        { cx: rng.int(40, 70), cy: rng.int(40, 70) },
        { cx: rng.int(140, 180), cy: rng.int(140, 180) },
      ];
      for (const c of clusters) {
        for (let i = 0; i < 18; i++) {
          points.push({
            x: Math.max(5, c.cx + rng.int(-20, 20)),
            y: Math.max(5, c.cy + rng.int(-20, 20)),
          });
        }
      }
    } else {
      // Три кластера
      const clusters = [
        { cx: 50, cy: 50 },
        { cx: 150, cy: 70 },
        { cx: 100, cy: 160 },
      ];
      for (const c of clusters) {
        for (let i = 0; i < 12; i++) {
          points.push({
            x: Math.max(5, c.cx + rng.int(-15, 15)),
            y: Math.max(5, c.cy + rng.int(-15, 15)),
          });
        }
      }
    }

    return {
      id: 'vision_scatter_cluster_' + seed,
      world: 'vision',
      level: 1,
      type: 'chart',
      title: 'Кластеры',
      chart: {
        type: 'scatter',
        title: `${theme.y} vs ${theme.x}`,
        data: {
          labels: [],
          points,
          datasets: [{ label: theme.y, values: [] }],
        },
      },
      question: 'Сколько кластеров видно на графике?',
      options: rng.shuffle(
        [1, 2, 3, 4].map((n) => ({
          id: 'opt_' + n,
          code: n === 1 ? 'Один' : n === 2 ? 'Два' : n === 3 ? 'Три' : 'Четыре',
          correct: n === numClusters,
          explain: n === numClusters
            ? `Правильно — ${numClusters === 1 ? 'все точки в одной группе' : `${numClusters} отдельные группы точек`}.`
            : `Неверно — ${n === 1 ? 'есть разделение на группы' : 'столько групп не видно'}.`,
        }))
      ),
      hint: 'Ищи группы точек, отделённые друг от друга',
    };
  },
};
