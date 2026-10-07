// Сессия генеративных задач — бесконечный поток
import { nextSeed } from './seededRandom.js';
import { GENERATORS, GENERATORS_BY_TYPE, getAllGenerators } from './generators/index.js';
import { progress } from '../core/progress.js';

export class VisionSession {
  constructor() {
    this.history = [];       // сыгранные задачи
    this.currentSeed = null;
    this.currentTask = null;
  }

  // Получить новую задачу
  next(generatorId = null) {
    // Если конкретный — берём его, иначе случайный
    let gen;
    if (generatorId && GENERATORS[generatorId]) {
      gen = GENERATORS[generatorId];
    } else {
      const all = getAllGenerators();
      gen = all[Math.floor(Math.random() * all.length)];
    }

    const seed = nextSeed();
    this.currentSeed = seed;

    const task = gen.generate(seed);
    task._path = `read/${gen.id}/${seed}`;   // для progress
    task._generatorId = gen.id;

    this.currentTask = task;
    this.history.push({ seed, generatorId: gen.id });
    return task;
  }

  // Получить по конкретному seed (для воспроизведения)
  fromSeed(generatorId, seed) {
    const gen = GENERATORS[generatorId];
    if (!gen) return null;
    const task = gen.generate(seed);
    task._path = `read/${gen.id}/${seed}`;
    task._generatorId = gen.id;
    return task;
  }

  // Статистика сессии
  getStats() {
    return {
      played: this.history.length,
      generators: this._countByGenerator(),
    };
  }

  _countByGenerator() {
    const counts = {};
    for (const h of this.history) {
      counts[h.generatorId] = (counts[h.generatorId] || 0) + 1;
    }
    return counts;
  }
}
