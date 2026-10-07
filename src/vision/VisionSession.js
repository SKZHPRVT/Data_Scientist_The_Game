// Сессия генеративных задач — с лимитом
import { nextSeed } from './seededRandom.js';
import { GENERATORS, GENERATORS_BY_TYPE, getAllGenerators } from './generators/index.js';

export const SESSION_SIZE = 10;

export class VisionSession {
  constructor() {
    this.history = [];        // сыгранные задачи всей жизни
    this.sessionHistory = []; // только текущая сессия
    this.currentSeed = null;
    this.currentTask = null;
    this.sessionType = null;
    this.sessionMax = SESSION_SIZE;
  }

  // Начать сессию
  startSession(type, size = SESSION_SIZE) {
    this.sessionType = type;
    this.sessionMax = size;
    this.sessionHistory = [];
  }

  // Прогресс сессии
  getSessionProgress() {
    return {
      current: this.sessionHistory.length,
      max: this.sessionMax,
      stars: this.sessionHistory.reduce((s, h) => s + (h.stars || 0), 0),
      maxStars: this.sessionMax * 4,
      correct: this.sessionHistory.filter((h) => h.correct).length,
      finished: this.sessionHistory.length >= this.sessionMax,
    };
  }

  // Следующая задача
  next(generatorId = null) {
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
    task._path = `vision/${gen.id}/${seed}`;
    task._generatorId = gen.id;
    task._type = gen.type;

    this.currentTask = task;
    return task;
  }

  // Записать результат
  recordResult(stars, correct) {
    this.sessionHistory.push({
      seed: this.currentSeed,
      generatorId: this.currentTask?._generatorId,
      stars,
      correct,
    });
    this.history.push({
      seed: this.currentSeed,
      generatorId: this.currentTask?._generatorId,
    });
  }

  // Статистика
  getStats() {
    return {
      played: this.history.length,
      sessionPlayed: this.sessionHistory.length,
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
