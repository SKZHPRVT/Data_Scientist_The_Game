// Загрузчик моделей из public/models/
// Данные грузятся один раз при старте игры.
// UI — отдельно (src/models/ModelsLab.js), появится в следующих коммитах.

export class ModelsLab {
  constructor() {
    this.index = null;      // INDEX.json (метаданные семейств)
    this.families = {};     // семейство → данные с квестами
    this.unlocked = JSON.parse(localStorage.getItem('unlocked_models') || '[]');
  }

  async load() {
    const base = import.meta.env.BASE_URL + 'models/';

    this.index = await fetch(base + 'INDEX.json').then((r) => r.json());

    for (const family of this.index.families) {
      try {
        const data = await fetch(base + family.id + '.json').then((r) => r.json());
        this.families[family.id] = data;
      } catch (e) {
        console.warn('[Models] Не удалось загрузить', family.id, e.message);
      }
    }

    // Финальный босс
    try {
      const boss = await fetch(base + 'BOSS_final.json').then((r) => r.json());
      this.families['BOSS_final'] = { quests: [boss], boss: true };
    } catch (e) {
      console.warn('[Models] Босс не загружен');
    }

    return this;
  }

  getFamily(id) {
    return this.families[id];
  }

  getQuest(familyId, questId) {
    return this.families[familyId]?.quests?.find((q) => q.id === questId);
  }

  isUnlocked(modelName) {
    return this.unlocked.includes(modelName);
  }

  unlock(modelName) {
    if (!this.unlocked.includes(modelName)) {
      this.unlocked.push(modelName);
      localStorage.setItem('unlocked_models', JSON.stringify(this.unlocked));
    }
  }

  getProgress() {
    return {
      unlocked: this.unlocked.length,
      total: this.index?.total || 38,
    };
  }

  listAll() {
    const result = [];
    for (const family of this.index.families) {
      result.push({
        family: family.name,
        icon: family.icon,
        models: family.models.map((m) => ({
          name: m.name,
          unlocked: this.isUnlocked(m.name),
        })),
      });
    }
    return result;
  }
}
