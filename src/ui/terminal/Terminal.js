import { evaluate } from '../../core/interpreter.js';
import { COMMANDS } from '../../core/commands.js';
import { progress, rewards } from '../../core/progress.js';

export class Terminal {
  constructor() {
    this.history = [];
    this.historyIdx = -1;
    this.el = null;
    this._keyboardUnsub = null;
    this._wasAtBottom = true;
    this._savedRect = null;  // { top, height } до открытия клавиатуры
  }

  render() {
    return `<div class="terminal" id="terminal-body"></div>`;
  }

  mount(body) {
    this.el = body.querySelector('#terminal-body');
    this._print('Data Scientist | The Game · Терминал v1.0');
    this._print('Введи help для списка команд.', 'terminal-success');
    this._print('');
    this._prompt();

    this.el.addEventListener('click', () => {
      this.el.querySelector('.terminal-input')?.focus();
    });

    this.el.addEventListener('scroll', () => {
      const dist = this.el.scrollHeight - this.el.scrollTop - this.el.clientHeight;
      this._wasAtBottom = dist < 30;
    });

    if (window.__keyboard) {
      this._keyboardUnsub = window.__keyboard.onKeyboardChange((isOpen, offset) => {
        document.body.classList.toggle('keyboard-open', isOpen);

        const win = body.closest('.window');
        if (!win) return;

        if (isOpen) {
          // Сохраняем оригинальную позицию и высоту ТОЛЬКО один раз
          if (!this._savedRect) {
            const rect = win.getBoundingClientRect();
            this._savedRect = {
              top: rect.top,
              height: rect.height,
              left: win.style.left,
              width: win.style.width,
            };
          }

          // Растягиваем окно вверх — низ прижимается к клавиатуре
          const vh = window.innerHeight;
          const taskbarH = 44;
          const keyboardTop = vh - offset;

          // Верхняя граница = 8px от safe-area или сохранённый top, что меньше
          const safeTop = 52;
          const newTop = Math.max(safeTop + 8, this._savedRect.top - 100);
          const newHeight = keyboardTop - newTop - 4;

          if (newHeight > 100) {
            win.style.top = newTop + 'px';
            win.style.height = newHeight + 'px';
          }
        } else {
          // Восстанавливаем точь-в-точь
          if (this._savedRect) {
            win.style.top = this._savedRect.top + 'px';
            win.style.height = this._savedRect.height + 'px';
            if (this._savedRect.left) win.style.left = this._savedRect.left;
            if (this._savedRect.width) win.style.width = this._savedRect.width;
            this._savedRect = null;
          }
        }

        // Прокрутка вниз — несколько раз с задержкой
        const scrollToBottom = () => {
          if (this.el && this._wasAtBottom) {
            this.el.scrollTop = this.el.scrollHeight;
          }
        };
        setTimeout(scrollToBottom, 50);
        setTimeout(scrollToBottom, 150);
        setTimeout(scrollToBottom, 300);
        setTimeout(scrollToBottom, 500);
      });
    }

    // На случай если клавиатура закрыта через системную кнопку
    if (window.visualViewport) {
      const resizeHandler = () => {
        const vh = window.visualViewport.height;
        const fullH = window.innerHeight;
        // Если viewport вернулся к полному — значит клавиатура закрыта
        if (Math.abs(vh - fullH) < 50 && this._savedRect) {
          const win = body.closest('.window');
          if (win) {
            win.style.top = this._savedRect.top + 'px';
            win.style.height = this._savedRect.height + 'px';
            this._savedRect = null;
          }
        }
      };
      window.visualViewport.addEventListener('resize', resizeHandler);
    }
  }

  destroy() {
    if (this._keyboardUnsub) this._keyboardUnsub();
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
      setTimeout(() => {
        if (this.el && this._wasAtBottom) this.el.scrollTop = this.el.scrollHeight;
      }, 300);
      setTimeout(() => {
        if (this.el && this._wasAtBottom) this.el.scrollTop = this.el.scrollHeight;
      }, 600);
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
      // === HELP ===
      if (name === 'help') {
        this._print('═══════════════════════════════', 'terminal-success');
        this._print('  ФАЙЛОВАЯ СИСТЕМА', 'terminal-success');
        this._print('═══════════════════════════════', 'terminal-success');
        this._print('  ls              — что в текущей папке');
        this._print('  ls <path>       — что в папке');
        this._print('  cd <path>       — перейти');
        this._print('  pwd             — где я');
        this._print('  cat <file>      — прочитать файл');
        this._print('  tree            — всё дерево');
        this._print('');
        this._print('═══════════════════════════════', 'terminal-success');
        this._print('  ИГРА', 'terminal-success');
        this._print('═══════════════════════════════', 'terminal-success');
        this._print('  quests          — список квестов текущей папки');
        this._print('  world           — карта миров');
        this._print('  stats           — прогресс');
        this._print('  achievements    — ачивки');
        this._print('');
        this._print('═══════════════════════════════', 'terminal-success');
        this._print('  ПАСХАЛКИ', 'terminal-success');
        this._print('═══════════════════════════════', 'terminal-success');
        this._print('  whoami          — кто ты');
        this._print('  matrix          — красная или синяя');
        this._print('  galton          — о случайности');
        this._print('  import this     — Zen of Python');
        this._print('  sudo            — попробуй');
        this._print('  42              — ответ');
        this._print('');
        this._print('Python: pd.read_csv(\'sales.csv\').head()');
        return;
      }

      // === ФАЙЛОВАЯ СИСТЕМА ===
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
            this._print(`... ещё ${lines.length - 50} строк (файл целиком — через Файлы)`, 'terminal-warn');
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

      // === ИГРОВЫЕ КОМАНДЫ ===
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
          this._print('');
          this._print('Открой через Файлы или карту мира.', 'terminal-success');
        } catch (e) {
          this._print('[ERROR] ' + e.message, 'terminal-error');
        }
        return;
      }

      if (name === 'world') {
        this._print('МИРЫ:', 'terminal-success');
        this._print('  🍼 BABY SCIENTIST   — если ты новичок');
        this._print('  🎯 JUNIOR            — основы pandas');
        this._print('  🚀 MIDDLE            — пайплайны, модели');
        this._print('  👑 SENIOR            — инциденты, архитектура');
        return;
      }

      if (name === 'stats' || name === 'progress') {
        const solved = progress.getSolved();
        this._print('ТВОЙ ПРОГРЕСС:', 'terminal-success');
        this._print(`  Решено задач: ${solved.length}`);
        let totalStars = 0;
        solved.forEach((id) => { totalStars += progress.getStars(id); });
        this._print(`  Звёзд всего: ⭐ ${totalStars}`);
        this._print(`  Максимум: ${solved.length * 4}`);
        const percent = solved.length > 0 ? Math.round(totalStars / (solved.length * 4) * 100) : 0;
        this._print(`  Качество: ${percent}%`);
        return;
      }

      if (name === 'achievements' || name === 'ach') {
        const ach = rewards.getUnlocked();
        this._print(`Ачивок открыто: ${ach.length}`, 'terminal-success');
        ach.forEach((id) => this._print(`  ✅ ${id}`));
        return;
      }

      // === ПАСХАЛКИ ===
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
        this._print('Открой иконку GALTON на рабочем столе.');
        this._print('Увидишь нормальное распределение в действии.');
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
        this._print('Complex is better than complicated.');
        this._print('Readability counts.');
        this._print('...');
        return;
      }

      if (name === 'import' && args[0] === 'antigravity') {
        this._print('🪁 Открываю xkcd.com/353...', 'terminal-success');
        this._print('(но у нас тут мини-апп, так что просто представь)', 'terminal-warn');
        return;
      }

      if (name === 'pip') {
        this._print('ERROR: Ты в игре, а не в питоне.', 'terminal-error');
        this._print('Попробуй настоящий pandas-синтаксис: pd.read_csv(...)', 'terminal-warn');
        return;
      }

      // === PYTHON-ВЫРАЖЕНИЕ ===
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
      this._print('Введи help для списка команд.', 'terminal-warn');
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
