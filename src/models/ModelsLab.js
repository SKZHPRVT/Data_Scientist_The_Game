// UI Лаборатории моделей
// Открывает окно со списком семейств и квестов

export class ModelsLab {
  constructor(windows) {
    this.windows = windows;
  }

  render() {
    const lab = window.__models;
    if (!lab) {
      this.windows.create({
        id: 'models-lab',
        title: '📦 Лаборатория моделей',
        content: '<div style="color: var(--error); padding: 20px;">Лаборатория не загружена. Проверь Console.</div>',
        width: 600,
        height: 400,
      });
      return;
    }

    const progress = lab.getProgress();

    const html = `
      <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.6;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <strong>📦 ЛАБОРАТОРИЯ МОДЕЛЕЙ</strong>
          <span class="terminal-success">${progress.unlocked} / ${progress.total}</span>
        </div>
        <div style="height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; margin-bottom: 16px;">
          <div style="height: 100%; width: ${(progress.unlocked / progress.total) * 100}%; background: var(--accent); transition: width 0.3s;"></div>
        </div>
        <div id="families-list">
          ${lab.index.families.map((f) => {
            const unlockedCount = f.models.filter((m) => lab.isUnlocked(m.name)).length;
            return `
              <div class="family-item" data-family="${f.id}"
                   style="padding: 10px; border-left: 3px solid var(--fg-dim); margin-bottom: 8px; cursor: pointer;">
                <div style="display: flex; justify-content: space-between;">
                  <span>${f.icon} <strong>${f.name}</strong></span>
                  <span class="terminal-success">${unlockedCount} / ${f.count}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.windows.create({
      id: 'models-lab',
      title: '📦 Лаборатория моделей',
      content: html,
      width: 600,
      height: 500,
      onMount: (body) => {
        body.querySelectorAll('.family-item').forEach((el) => {
          el.onclick = () => this.openFamily(el.dataset.family);
        });
      },
    });
  }

  openFamily(familyId) {
    const lab = window.__models;
    const familyData = lab.families[familyId];
    const familyIndex = lab.index.families.find((f) => f.id === familyId);

    if (!familyData) {
      this.windows.create({
        id: 'family-' + familyId,
        title: '📦 ' + familyId,
        content: '<div style="color: var(--error); padding: 20px;">Семейство не загружено.</div>',
        width: 600,
        height: 400,
      });
      return;
    }

    const quests = familyData.quests || [];

    const html = `
      <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.6;">
        <div style="margin-bottom: 12px;">
          <strong>${familyIndex.icon} ${familyIndex.name}</strong>
        </div>
        <div id="quests-list">
          ${quests.map((q) => {
            const unlocked = lab.isUnlocked(q.unlocks);
            return `
              <div class="quest-item" data-quest="${q.id}"
                   style="padding: 10px; border-left: 3px solid ${unlocked ? 'var(--accent)' : 'var(--fg-dim)'};
                          margin-bottom: 8px; cursor: pointer; opacity: ${unlocked ? 0.7 : 1};">
                <div style="display: flex; justify-content: space-between;">
                  <span>${unlocked ? '✅' : '🔒'} <strong>${q.title}</strong></span>
                  <span class="terminal-warn">+${q.xp} XP</span>
                </div>
                <div style="color: var(--fg-dim); font-size: 11px; margin-top: 4px;">${q.unlocks}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.windows.create({
      id: 'family-' + familyId,
      title: familyIndex.icon + ' ' + familyIndex.name,
      content: html,
      width: 600,
      height: 500,
      onMount: (body) => {
        body.querySelectorAll('.quest-item').forEach((el) => {
          el.onclick = () => this.openQuest(familyId, el.dataset.quest);
        });
      },
    });
  }

  openQuest(familyId, questId) {
    const lab = window.__models;
    const quest = lab.getQuest(familyId, questId);
    if (!quest) return;

    const html = `
      <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.6;">
        <div style="color: var(--fg-dim); margin-bottom: 8px;">Сценарий:</div>
        <div style="padding: 12px; background: rgba(0,255,65,0.05); border-left: 3px solid var(--accent); margin-bottom: 16px;">
          ${quest.story}
        </div>

        <div style="margin-bottom: 12px;"><strong>${quest.question}</strong></div>

        <div id="options-list">
          ${quest.options.map((o) => `
            <div class="opt-item" data-opt="${o.id}"
                 style="padding: 10px; border: 1px solid var(--fg-dim); border-radius: 4px;
                        margin-bottom: 8px; cursor: pointer;">
              ${o.text}
            </div>
          `).join('')}
        </div>

        <div id="result" style="margin-top: 16px;"></div>
      </div>
    `;

    this.windows.create({
      id: 'quest-' + questId,
      title: '📦 ' + quest.title,
      content: html,
      width: 600,
      height: 500,
      onMount: (body) => {
        body.querySelectorAll('.opt-item').forEach((el) => {
          el.onclick = () => this.answer(quest, el.dataset.opt, body);
        });
      },
    });
  }

  answer(quest, optId, body) {
    const opt = quest.options.find((o) => o.id === optId);
    if (!opt) return;

    body.querySelectorAll('.opt-item').forEach((el) => {
      el.style.pointerEvents = 'none';
      if (el.dataset.opt === optId) {
        el.style.borderColor = opt.correct ? 'var(--accent)' : 'var(--error)';
        el.style.background = opt.correct ? 'rgba(0,255,65,0.1)' : 'rgba(255,51,51,0.1)';
      } else if (opt.correct === false) {
        const correctOpt = quest.options.find((o) => o.correct);
        if (correctOpt && el.dataset.opt === correctOpt.id) {
          el.style.borderColor = 'var(--accent)';
          el.style.background = 'rgba(0,255,65,0.05)';
        }
      }
    });

    const result = body.querySelector('#result');
    if (opt.correct) {
      window.__models.unlock(quest.unlocks);
      result.innerHTML = `
        <div class="terminal-success" style="margin-bottom: 8px;">✅ Верно! +${quest.xp} XP</div>
        <div style="color: var(--fg); margin-bottom: 8px;">${opt.why}</div>
        <div style="color: var(--fg-dim); font-size: 11px; padding: 8px; border-left: 2px solid var(--fg-dim);">
          ${quest.explanation}
        </div>
        <div style="margin-top: 12px;" class="terminal-success">🔓 Разблокировано: ${quest.unlocks}</div>
      `;
    } else {
      result.innerHTML = `
        <div class="terminal-error" style="margin-bottom: 8px;">❌ Неверно</div>
        <div style="color: var(--fg); margin-bottom: 8px;">${opt.why}</div>
        <div style="color: var(--fg-dim); font-size: 11px;">
          Правильный ответ выделен зелёным. Попробуй ещё раз или закрой окно.
        </div>
      `;
    }
  }
}
