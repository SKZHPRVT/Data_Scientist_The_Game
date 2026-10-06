// Карта квестов семейства — аналог QuestMap
import { progress } from '../../core/progress.js';

export class ModelsQuestMap {
  constructor(familyId, familyData, { onOpenTask } = {}) {
    this.familyId = familyId;
    this.familyData = familyData;   // { family, icon, quests: [...] }
    this.onOpenTask = onOpenTask;
  }

  render() {
    if (!this.familyData || !this.familyData.quests) {
      return '<div style="color: var(--error); font-family: var(--font-mono);">Семейство не загружено.</div>';
    }

    const quests = this.familyData.quests;
    const taskIds = quests.map((q) =>
      progress.makeId('models/' + this.familyId + '/' + q.id)
    );
    const sumStars = progress.sumStars(taskIds);
    const maxStars = progress.maxStars(taskIds);
    const percent = maxStars > 0 ? Math.round((sumStars / maxStars) * 100) : 0;
    const perfect = progress.isChapterPerfect(taskIds);

    return `
      <div class="quest-map">
        <div class="quest-map-header">
          <div class="quest-map-title">${this.familyData.family || this.familyId}${perfect ? ' 🏆' : ''}</div>
          <div class="quest-map-desc">${quests.length} моделей · выбери правильную</div>
          <div class="quest-map-progress">
            <div class="quest-map-bar">
              <div class="quest-map-bar-fill" style="width: ${percent}%"></div>
            </div>
            <div class="quest-map-count">⭐ ${sumStars} / ${maxStars}</div>
          </div>
        </div>

        <div class="quest-list">
          ${quests.map((q, i) => {
            const taskId = progress.makeId('models/' + this.familyId + '/' + q.id);
            const unlocked = progress.isUnlocked(taskId, taskIds);
            const solved = progress.isSolved(taskId);
            const stars = progress.getStars(taskId);

            let status = '🔒';
            let cls = 'locked';
            let sub = 'Сначала пройди предыдущую';

            if (solved) {
              status = stars === 4 ? '🌟' : '✅';
              cls = stars === 4 ? 'solved perfect' : 'solved';
              sub = q.unlocks || 'Пройдено';
            } else if (unlocked) {
              status = '▶️';
              cls = 'active';
              sub = q.unlocks || 'Нажми, чтобы начать';
            }

            const starsStr = solved ? '⭐'.repeat(stars) + '☆'.repeat(4 - stars) : '';

            return `
              <div class="quest-item ${cls}" data-quest="${q.id}">
                <div class="quest-item-status">${status}</div>
                <div class="quest-item-body">
                  <div class="quest-item-title">${q.title || 'Квест ' + (i + 1)}</div>
                  <div class="quest-item-sub">${sub}</div>
                </div>
                ${solved ? `<div class="quest-item-stars">${starsStr}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  mount(body) {
    body.querySelectorAll('.quest-item').forEach((el) => {
      el.onclick = () => {
        if (el.classList.contains('locked')) {
          if (window.__audio) window.__audio.error();
          el.style.background = 'rgba(255,51,51,0.2)';
          setTimeout(() => { el.style.background = ''; }, 300);
          return;
        }
        const questId = el.dataset.quest;
        const quest = this.familyData.quests.find((q) => q.id === questId);
        if (!quest) return;
        if (window.__audio) window.__audio.click('open');

        // Адаптируем модель к формату TaskView
        const task = this._adaptQuest(quest);
        if (this.onOpenTask) this.onOpenTask(task);
      };
    });
  }

  // Модель → TaskView-совместимый объект
  _adaptQuest(quest) {
    const path = 'models/' + this.familyId + '/' + quest.id;
    return {
      id: path,
      _path: path,                              // progress.makeId использует это
      title: quest.title || quest.id,
      world: 'models',
      level: 1,
      question: quest.question,
      // Опционально — сценарий покажем сверху
      _story: quest.story,
      // Адаптация: text → code, why → explain
      options: (quest.options || []).map((o) => ({
        id: o.id,
        code: o.text,           // TaskView рисует .task-option-code
        correct: o.correct,
        explain: o.why,         // TaskView покажет после ответа
      })),
      // Для внутреннего использования
      _unlocks: quest.unlocks,
      _xp: quest.xp,
      _explanation: quest.explanation,
    };
  }
}
