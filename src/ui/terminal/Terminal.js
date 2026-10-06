import { evaluate } from '../../core/interpreter.js';
import { COMMANDS } from '../../core/commands.js';

export class Terminal {
  constructor() {
    this.history = [];
    this.historyIdx = -1;
    this.el = null;
    this._keyboardUnsub = null;
  }

  render() {
    return `<div class="terminal" id="terminal-body"></div>`;
  }

  mount(body) {
    this.el = body.querySelector('#terminal-body');
    this._print('Data Scientist | The Game · v0.1.0');
    this._print('Введи help для списка команд.', 'terminal-success');
    this._prompt();

    this.el.addEventListener('click', () => {
      this.el.querySelector('.terminal-input')?.focus();
    });

    // Клавиатура: поднять терминал при открытии
    if (window.__keyboard) {
      this._keyboardUnsub = window.__keyboard.onKeyboardChange((isOpen) => {
        if (isOpen) {
          document.body.classList.add('keyboard-open');
          setTimeout(() => {
            if (this.el) this.el.scrollTop = this.el.scrollHeight;
          }, 100);
        } else {
          document.body.classList.remove('keyboard-open');
        }
      });
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
    this.el.scrollTop = this.el.scrollHeight;
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
        if (this.el) this.el.scrollTop = this.el.scrollHeight;
      }, 300);
    });

    input.addEventListener('keydown', (e) => {
      // Звук клавиши
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
    try {
      if (cmd === 'help') {
        this._print('Доступные команды:', 'terminal-success');
        this._print('  ls, cd <path>, cat <file>, pwd');
        this._print('  python <file> — запустить питон-скрипт');
        this._print('  clear — очистить терминал');
        this._print('');
        this._print('Методы pandas (junior):', 'terminal-success');
        for (const [id, c] of Object.entries(COMMANDS)) {
          if (c.world === 'junior' && c.signature) {
            this._print(`  ${c.signature} — ${c.description}`);
          }
        }
        return;
      }
      if (cmd === 'clear') {
        this.el.innerHTML = '';
        return;
      }
      if (cmd === 'ls') {
        const items = window.__fs.ls();
        if (items.length === 0) this._print('(пусто)');
        items.forEach((i) => this._print(`  ${i.type === 'dir' ? '📁' : '📄'} ${i.name}`));
        return;
      }
      if (cmd.startsWith('cd ')) {
        window.__fs.cd(cmd.slice(3).trim());
        this._print('→ ' + window.__fs.getCwd(), 'terminal-success');
        return;
      }
      if (cmd.startsWith('cat ')) {
        try {
          const content = window.__fs.readFile(cmd.slice(4).trim());
          this._print(content);
        } catch (e) {
          if (window.__audio) window.__audio.error();
          this._print('[ERROR] ' + e.message, 'terminal-error');
        }
        return;
      }
      if (cmd === 'pwd') {
        this._print(window.__fs.getCwd());
        return;
      }
      if (cmd.startsWith('python ')) {
        const file = cmd.slice(7).trim();
        try {
          const content = window.__fs.readFile(file);
          this._print('$ python ' + file, 'terminal-success');
          this._print(content);
        } catch (e) {
          if (window.__audio) window.__audio.error();
          this._print('[ERROR] ' + e.message, 'terminal-error');
        }
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
      if (window.__audio) window.__audio.error();
      this._print('[ERROR] ' + e.message, 'terminal-error');
    }
  }
}
