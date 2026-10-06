import { evaluate } from '../../core/interpreter.js';
import { COMMANDS } from '../../core/commands.js';

export class Terminal {
  constructor() {
    this.history = [];
    this.historyIdx = -1;
    this.el = null;
  }

  render() {
    return `<div class="terminal" id="terminal-body"></div>`;
  }

  mount(body) {
    this.el = body.querySelector('#terminal-body');
    this._print('Data Scientist | The Game · v0.1.0');
    this._print('Введи help для списка команд.');
    this._prompt();

    this.el.addEventListener('click', () => {
      this.el.querySelector('.terminal-input')?.focus();
    });
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
    line.appendChild(input);
    this.el.appendChild(line);
    input.focus();

    input.addEventListener('keydown', (e) => {
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
      // Встроенные команды
      if (cmd === 'help') {
        this._print('Доступные команды:', 'terminal-success');
        for (const [id, c] of Object.entries(COMMANDS)) {
          if (c.world === 'junior') this._print(`  ${c.signature} — ${c.description}`);
        }
        return;
      }
      if (cmd === 'ls') {
        const items = window.__fs.ls();
        items.forEach((i) => this._print(`  ${i.type === 'dir' ? '📁' : '📄'} ${i.name}`));
        return;
      }
      if (cmd.startsWith('cd ')) {
        window.__fs.cd(cmd.slice(3).trim());
        this._print('→ ' + window.__fs.getCwd(), 'terminal-success');
        return;
      }
      if (cmd.startsWith('cat ')) {
        const content = window.__fs.readFile(cmd.slice(4).trim());
        this._print(content);
        return;
      }
      if (cmd === 'pwd') {
        this._print(window.__fs.getCwd());
        return;
      }

      // Python-выражение
      const result = evaluate(cmd, { df: window.__df });
      if (result && result.toJSON) {
        this._print(JSON.stringify(result.toJSON(), null, 2));
      } else {
        this._print(String(result), 'terminal-success');
      }
    } catch (e) {
      this._print('[ERROR] ' + e.message, 'terminal-error');
    }
  }
}
