import { evaluate } from '../../core/interpreter.js';
import { COMMANDS } from '../../core/commands.js';
import { progress, rewards } from '../../core/progress.js';

export class Terminal {
  constructor(options = {}) {
    this.onOpenLab = options.onOpenLab || null;
    this.history = [];
    this.historyIdx = -1;
    this.el = null;
    this._keyboardUnsub = null;
    this._wasAtBottom = true;
    this._savedRect = null;
    this._win = null;
    this._checkInterval = null;
    this._checkResizeHandler = null;
    this._vvResizeHandler = null;
    this._vvScrollHandler = null;
  }

  render() {
    return `<div class="terminal" id="terminal-body"></div>`;
  }

  mount(body) {
    this.el = body.querySelector('#terminal-body');
    this._win = body.closest('.window');

    this._print('Data Scientist | The Game · Терминал v1.0');
    this._print('Введи help для списка команд.', 'terminal-success');
    this._print('');
    this._prompt();

    this.el.addEventListener('scroll', () => {
      const dist = this.el.scrollHeight - this.el.scrollTop - this.el.clientHeight;
      this._wasAtBottom = dist < 30;
    });

    // ЕДИНЫЙ обработчик тапа на ВСЁ окно терминала
    if (this._win) {
      this._win.addEventListener('click', (e) => {
        const input = e.target.closest('.terminal-input');
        if (input) {
          // Тап по полю ввода — фокус, клавиатура открывается
          input.focus();
        } else {
          // Тап по пустому месту — снимаем фокус, клавиатура закрывается
          if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
          }
        }
      });
    }

    // === МЕХАНИЗМ 1: KeyboardHandler от main.js ===
    if (window.__keyboard) {
      this._keyboardUnsub = window.__keyboard.onKeyboardChange((isOpen, offset) => {
        document.body.classList.toggle('keyboard-open', isOpen);

        if (isOpen) {
          this._saveRect();
          this._stretchUp(offset);
        } else {
          this._restore();
        }

        this._scrollToBottomSoon();
      });
    }

    // === МЕХАНИЗМ 2: Прямой слушатель на visualViewport ===
    if (window.visualViewport) {
      this._vvResizeHandler = () => {
        this._checkViewport();
      };
      this._vvScrollHandler = () => {
        this._checkViewport();
      };
      window.visualViewport.addEventListener('resize', this._vvResizeHandler);
      window.visualViewport.addEventListener('scroll', this._vvScrollHandler);
    }

    // === МЕХАНИЗМ 3: window.resize ===
    this._checkResizeHandler = () => {
      this._checkViewport();
    };
    window.addEventListener('resize', this._checkResizeHandler);
    window.addEventListener('orientationchange', this._checkResizeHandler);

    // МЕХАНИЗМ 4 удалён — setInterval вызывал ложные _restore()
  }

  _saveRect() {
    if (!this._win) return;
    // Сохраняем ТОЛЬКО если ещё не сохранено — иначе потеряем исходный размер
    if (this._savedRect) return;
    const rect = this._win.getBoundingClientRect();
    this._savedRect = {
      top: rect.top,
      height: rect.height,
      left: this._win.style.left,
      width: this._win.style.width,
    };
    // Помечаем, что клавиатура когда-то открывалась
    this._keyboardWasOpen = true;
  }

  _stretchUp(offset) {
    if (!this._win) return;
    // Сначала обязательно сохраняем текущее (исходное) состояние
    if (!this._savedRect) {
      this._saveRect();
    }
    const vh = window.innerHeight;
    const keyboardTop = vh - offset;
    const safeTop = 52;
    const newTop = Math.max(safeTop + 8, (this._savedRect?.top || 60) - 100);
    const newHeight = keyboardTop - newTop - 4;

    if (newHeight > 100) {
      this._win.style.top = newTop + 'px';
      this._win.style.height = newHeight + 'px';
    }
  }

  _restore() {
    if (!this._win || !this._savedRect) return;

    // Восстанавливаем ТОЛЬКО top и height — left/width не трогаем
    this._win.style.top = this._savedRect.top + 'px';
    this._win.style.height = this._savedRect.height + 'px';

    // Сбрасываем — до следующего открытия клавиатуры
    this._savedRect = null;
    this._keyboardWasOpen = false;
  }

  // Проверяем: клавиатура открыта или нет
  _checkViewport() {
    if (!this._win) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const fullHeight = window.innerHeight;
    const vvHeight = vv.height;
    const diff = fullHeight - vvHeight;

    // Клавиатура считается открытой, если разница больше 150px
    const keyboardOpen = diff > 150;

    if (keyboardOpen) {
      // Растягиваем — _stretchUp сам сохранит исходное состояние если надо
      this._stretchUp(diff);
    } else {
      // Клавиатура закрыта — восстанавливаем ТОЛЬКО если реально растянуто
      if (this._savedRect) {
        this._restore();
        this._scrollToBottomSoon();
      }
    }
  }

  _scrollToBottomSoon() {
    const scroll = () => {
      if (this.el && this._wasAtBottom) {
        this.el.scrollTop = this.el.scrollHeight;
      }
    };
    setTimeout(scroll, 50);
    setTimeout(scroll, 200);
    setTimeout(scroll, 400);
  }

  destroy() {
    if (this._keyboardUnsub) this._keyboardUnsub();

    if (this._checkInterval) {
      clearInterval(this._checkInterval);
      this._checkInterval = null;
    }

    if (window.visualViewport) {
      if (this._vvResizeHandler) {
        window.visualViewport.removeEventListener('resize', this._vvResizeHandler);
      }
      if (this._vvScrollHandler) {
        window.visualViewport.removeEventListener('scroll', this._vvScrollHandler);
      }
    }

    if (this._checkResizeHandler) {
      window.removeEventListener('resize', this._checkResizeHandler);
      window.removeEventListener('orientationchange', this._checkResizeHandler);
    }
  }

  _print(text, cls = '') {
    const line = document.createElement('div');
    line.className = 'terminal-line ' + cls;
    line.textContent = text;
    this.el.appendChild(line);
    if (this._wasAtBottom) this.el.scrollTop = this.el.scrollHeight;
  }

  _prompt() {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = `<span class="terminal-prompt">$ </span>`;
    const input = document.createElement('input');
    input.className = 'terminal-input';
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('autocorrect', 'off');
    line.appendChild(input);
    this.el.appendChild(line);
    input.focus();

    input.addEventListener('focus', () => {
      this._scrollToBottomSoon();
    });

    input.addEventListener('keydown', (e) => {
      if (window.__audio) {
        if (e.key === 'Enter') window.__audio.key('enter');
        else if (e.key === 'Backspace') window.__audio.key('backspace');
        else if (e.key === ' ') window.__audio.key('space');
        else if (e.key.length === 1) window.__audio.key('normal');
      }

      if (e.key === 'Enter') {
        const cmd = input.value.trim();
        if (cmd) {
          this.history.push(cmd);
          this.historyIdx = this.history.length;
          this._print('$ ' + cmd);
          this._execute(cmd);
        }
        line.remove();
        this._prompt();
      } else if (e.key === 'ArrowUp') {
        if (this.historyIdx > 0) {
          this.historyIdx--;
          input.value = this.history[this.historyIdx];
        }
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        if (this.historyIdx < this.history.length - 1) {
          this.historyIdx++;
          input.value = this.history[this.historyIdx];
        } else {
          this.historyIdx = this.history.length;
          input.value = '';
        }
        e.preventDefault();
      }
    });
  }

  _execute(cmd) {
    const parts = cmd.split(/\s+/);
    const name = parts[0];
    const args = parts.slice(1);

    try {
      if (name === 'models') {
        this._cmdModels(args);
        return;
      }

      if (name === 'lab') {
        // Открываем лабораторию моделей прямо из терминала
        if (this.onOpenLab) {
          this.onOpenLab();
          this._print('📦 Открываю лабораторию...', 'terminal-success');
        } else {
          this._print('Открой MODELS 📦 на рабочем столе', 'terminal-warn');
        }
        return;
      }
      if (name === 'help') {
        this._print('═══════════════════════════════', 'terminal-success');
        this._print('  ФАЙЛОВАЯ СИСТЕМА', 'terminal-success');
        this._print('═══════════════════════════════', 'terminal-success');
        this._print('  ls, cd, pwd, cat <file>, tree');
        this._print('');
        this._print('═══════════════════════════════', 'terminal-success');
        this._print('  ИГРА', 'terminal-success');
        this._print('═══════════════════════════════', 'terminal-success');
        this._print('  quests, world, stats, achievements');
        this._print('  models [name], lab — лаборатория моделей');
        this._print('');
        this._print('═══════════════════════════════', 'terminal-success');
        this._print('  ПАСХАЛКИ', 'terminal-success');
        this._print('═══════════════════════════════', 'terminal-success');
        this._print('  whoami, matrix, galton, sudo, 42');
        this._print('  import this');
        this._print('');
        this._print('Python: pd.read_csv(\'sales.csv\').head()');
        return;
      }

      if (name === 'ls') {
        const path = args[0] || window.__fs.getCwd();
        try {
          const items = window.__fs.ls(path);
          if (items.length === 0) this._print('(пусто)');
          items.forEach((i) => {
            const icon = i.type === 'dir' ? '📁' : '📄';
            let extra = '';
            if (i.name.endsWith('.json')) {
              const cwd = window.__fs.getCwd().replace(/^\//, '').replace(/\/$/, '');
              const taskId = cwd + '/' + i.name.replace('.json', '');
              const stars = progress.getStars(taskId);
              const solved = progress.isSolved(taskId);
              if (solved) extra = ' ✅ ' + '⭐'.repeat(stars);
            }
            this._print(`  ${icon} ${i.name}${extra}`);
          });
        } catch (e) {
          this._print('[ERROR] ' + e.message, 'terminal-error');
        }
        return;
      }

      if (name === 'cd') {
        const path = args[0] || '/';
        try {
          window.__fs.cd(path);
          this._print('→ ' + window.__fs.getCwd(), 'terminal-success');
        } catch (e) {
          this._print('[ERROR] ' + e.message, 'terminal-error');
        }
        return;
      }

      if (name === 'pwd') {
        this._print(window.__fs.getCwd());
        return;
      }

      if (name === 'cat') {
        if (!args[0]) { this._print('Использование: cat <file>', 'terminal-warn'); return; }
        try {
          const content = window.__fs.readFile(args[0]);
          const lines = content.split('\n');
          if (lines.length > 50) {
            this._print(lines.slice(0, 50).join('\n'));
            this._print(`... ещё ${lines.length - 50} строк`, 'terminal-warn');
          } else {
            this._print(content);
          }
        } catch (e) {
          this._print('[ERROR] ' + e.message, 'terminal-error');
        }
        return;
      }

      if (name === 'tree') {
        this._printTree('/', 0);
        return;
      }

      if (name === 'clear') {
        this.el.innerHTML = '';
        return;
      }

      if (name === 'quests') {
        const cwd = window.__fs.getCwd();
        this._print(`Квесты в ${cwd}:`, 'terminal-success');
        try {
          const items = window.__fs.ls(cwd);
          const tasks = items.filter((i) => i.name.endsWith('.json'));
          if (tasks.length === 0) {
            this._print('  (нет задач в этой папке)', 'terminal-warn');
            this._print('  Попробуй: cd /junior/basics', 'terminal-warn');
            return;
          }
          const cwdClean = cwd.replace(/^\//, '').replace(/\/$/, '');
          tasks.forEach((t, i) => {
            const id = cwdClean + '/' + t.name.replace('.json', '');
            const solved = progress.isSolved(id);
            const stars = progress.getStars(id);
            const status = solved ? '✅ ' + '⭐'.repeat(stars) : '▶️ доступно';
            this._print(`  ${i + 1}. ${t.name}  ${status}`);
          });
        } catch (e) {
          this._print('[ERROR] ' + e.message, 'terminal-error');
        }
        return;
      }

      if (name === 'world') {
        this._print('МИРЫ:', 'terminal-success');
        this._print('  🍼 BABY SCIENTIST');
        this._print('  🎯 JUNIOR');
        this._print('  🚀 MIDDLE');
        this._print('  👑 SENIOR');
        return;
      }

      if (name === 'stats' || name === 'progress') {
        const solved = progress.getSolved();
        this._print('ТВОЙ ПРОГРЕСС:', 'terminal-success');
        this._print(`  Решено задач: ${solved.length}`);
        let totalStars = 0;
        solved.forEach((id) => { totalStars += progress.getStars(id); });
        this._print(`  Звёзд всего: ⭐ ${totalStars}`);
        return;
      }

      if (name === 'achievements' || name === 'ach') {
        const ach = rewards.getUnlocked();
        this._print(`Ачивок открыто: ${ach.length}`, 'terminal-success');
        ach.forEach((id) => this._print(`  ✅ ${id}`));
        return;
      }

      if (name === 'whoami') {
        const solved = progress.getSolved().length;
        if (solved === 0) this._print('Никто. Пока.', 'terminal-warn');
        else if (solved < 10) this._print('Джун. Только начал.');
        else if (solved < 30) this._print('Джун с опытом.');
        else if (solved < 60) this._print('Почти мидл.');
        else if (solved < 90) this._print('Мидл. Уже не джун.');
        else this._print('Senior. Или очень упорный.', 'terminal-success');
        return;
      }

      if (name === 'matrix') {
        this._print('Wake up, Neo...', 'terminal-success');
        setTimeout(() => this._print('The Matrix has you...', 'terminal-success'), 800);
        setTimeout(() => this._print('Follow the white rabbit.', 'terminal-success'), 1600);
        setTimeout(() => this._print('Knock, knock, Neo.', 'terminal-success'), 2400);
        return;
      }

      if (name === 'galton') {
        this._print('Случайность — не хаос. Это распределение.', 'terminal-success');
        return;
      }

      if (name === 'sudo' || name === 'su') {
        this._print('nice try 😏', 'terminal-warn');
        this._print('Ты не в админах. Ты ещё джун.', 'terminal-warn');
        return;
      }

      if (name === '42') {
        this._print('Ответ на главный вопрос жизни, Вселенной и всего такого.', 'terminal-success');
        return;
      }

      if (name === 'import' && args[0] === 'this') {
        this._print('The Zen of Python, by Tim Peters', 'terminal-success');
        this._print('');
        this._print('Beautiful is better than ugly.');
        this._print('Explicit is better than implicit.');
        this._print('Simple is better than complex.');
        this._print('...');
        return;
      }

      if (name === 'pip') {
        this._print('ERROR: Ты в игре, а не в питоне.', 'terminal-error');
        return;
      }

      const result = evaluate(cmd, { df: window.__df });
      if (result && result.toJSON) {
        const json = result.toJSON();
        this._print(`rows: ${json.rows.length}, columns: ${json.columns.length}`, 'terminal-success');
        this._print(JSON.stringify(json.rows.slice(0, 5), null, 2));
      } else if (Array.isArray(result)) {
        this._print(JSON.stringify(result), 'terminal-success');
      } else {
        this._print(String(result), 'terminal-success');
      }
    } catch (e) {
      this._print('[ERROR] ' + e.message, 'terminal-error');
      this._print('Введи help.', 'terminal-warn');
    }
  }

  _cmdModels(args) {
    const lab = window.__models;
    if (!lab) {
      this._print('[ERROR] Лаборатория не загружена', 'terminal-error');
      return;
    }

    // Если указано имя модели — показываем карточку
    if (args && args.length > 0) {
      const query = args.join(' ').toLowerCase();
      const found = this._findModel(query);
      if (!found) {
        this._print(`Модель "${args.join(' ')}" не найдена`, 'terminal-warn');
        this._print('Введи "models" чтобы увидеть все.', 'terminal-warn');
        return;
      }
      this._printModelCard(found);
      return;
    }

    // Иначе — обзор
    const p = lab.getProgress();
    this._print('═══════════════════════════════', 'terminal-success');
    this._print('  📦 ЛАБОРАТОРИЯ МОДЕЛЕЙ', 'terminal-success');
    this._print('═══════════════════════════════', 'terminal-success');
    this._print(`  Прогресс: ${p.unlocked} / ${p.total} моделей`);
    this._print('');

    lab.listAll().forEach((fam) => {
      const total = fam.models.length;
      const unlockedCount = fam.models.filter((m) => m.unlocked).length;
      const status = unlockedCount === total ? '✅' : (unlockedCount > 0 ? '▶️' : '🔒');
      const bar = '█'.repeat(Math.round((unlockedCount / total) * 10)) + '░'.repeat(10 - Math.round((unlockedCount / total) * 10));
      this._print(`${status} ${fam.icon} ${fam.family}`, 'terminal-warn');
      this._print(`     ${bar}  ${unlockedCount} / ${total}`);
    });

    this._print('');
    this._print('  👁 ФИНАЛЬНЫЙ БОСС: ' + (p.unlocked >= 38 ? 'открыт' : `нужно ${38 - p.unlocked} моделей`), 'terminal-success');
    this._print('');
    this._print('Введи "models <name>" — карточка модели', 'terminal-success');
    this._print('Введи "lab" — открыть лабораторию', 'terminal-success');
  }

  _findModel(query) {
    const lab = window.__models;
    if (!lab) return null;
    for (const family of lab.index.families) {
      const familyData = lab.families[family.id];
      if (!familyData || !familyData.quests) continue;
      for (const quest of familyData.quests) {
        const name = (quest.unlocks || quest.title || '').toLowerCase();
        const id = (quest.id || '').toLowerCase();
        if (name.includes(query) || id.includes(query)) {
          return {
            family: family,
            familyId: family.id,
            quest: quest,
            unlocked: lab.isUnlocked(quest.unlocks),
          };
        }
      }
    }
    return null;
  }

  _printModelCard(found) {
    const { family, quest, unlocked } = found;
    this._print('═══════════════════════════════', 'terminal-success');
    this._print(`  📦 ${quest.unlocks || quest.title}`, 'terminal-success');
    this._print('═══════════════════════════════', 'terminal-success');
    this._print(`  Семейство: ${family.icon} ${family.name}`);
    this._print(`  Статус:    ${unlocked ? '✅ открыта' : '🔒 закрыта'}`);
    this._print('');
    if (quest.story) {
      this._print('  Сценарий:', 'terminal-warn');
      this._print(`    ${quest.story}`);
      this._print('');
    }
    if (quest.explanation) {
      this._print('  Объяснение:', 'terminal-warn');
      this._print(`    ${quest.explanation}`);
    }
  }

  _printTree(path, depth) {
    const indent = '  '.repeat(depth);
    const items = window.__fs.ls(path);
    items.forEach((i) => {
      const icon = i.type === 'dir' ? '📁' : '📄';
      this._print(`${indent}${icon} ${i.name}`);
      if (i.type === 'dir' && depth < 2) {
        const newPath = path === '/' ? '/' + i.name : path + '/' + i.name;
        this._printTree(newPath, depth + 1);
      }
    });
  }
}
