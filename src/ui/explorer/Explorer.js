import { progress } from '../../core/progress.js';

export class Explorer {
  constructor(path, handlers) {
    this.path = path;
    this.handlers = handlers;
  }

  render() {
    let items = [];
    try {
      items = window.__fs.ls(this.path);
    } catch (e) {
      items = [];
    }

    // Сортируем: сначала папки, потом файлы
    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    // Если папка — считаем прогресс
    let folderProgress = null;
    if (this.path !== '/') {
      folderProgress = this._getFolderProgress(items);
    }

    const parent = this.path !== '/' ? `
      <div class="start-item explorer-item" data-action="up">
        <span class="exp-icon">⬆️</span>
        <span class="exp-name">..</span>
        <span class="exp-info">наверх</span>
      </div>
    ` : '';

    return `
      <div class="explorer-view">
        <div class="explorer-path">
          📁 ${this.path}
          ${folderProgress ? `<span style="color: var(--fg-dim); margin-left: 8px;">· ${folderProgress}</span>` : ''}
        </div>

        <div class="explorer-list">
          ${parent}
          ${items.length === 0 ? '<div style="color: var(--fg-dim); padding: 8px;">(пусто)</div>' : ''}
          ${items.map((i) => {
            const isDir = i.type === 'dir';
            const isJson = !isDir && i.name.endsWith('.json');
            const isCsv = !isDir && i.name.endsWith('.csv');
            const isTxt = !isDir && i.name.endsWith('.txt');
            const isPy = !isDir && i.name.endsWith('.py');

            let icon = isDir ? '📁' : '📄';
            if (isJson) icon = '🎯';
            else if (isCsv) icon = '📊';
            else if (isTxt) icon = '📝';
            else if (isPy) icon = '🐍';

            let info = '';
            let stars = 0;
            if (isJson) {
              const taskId = this._makeTaskId(i.name);
              stars = progress.getStars(taskId);
              const solved = progress.isSolved(taskId);
              info = solved ? '✅ ' + '⭐'.repeat(stars) : 'не решено';
            } else if (isCsv) {
              info = 'данные';
            } else if (isTxt) {
              info = 'текст';
            } else if (isPy) {
              info = 'скрипт';
            }

            return `
              <div class="start-item explorer-item"
                   data-name="${i.name}"
                   data-type="${i.type}"
                   data-ext="${i.name.split('.').pop()}">
                <span class="exp-icon">${icon}</span>
                <span class="exp-name">${i.name}</span>
                <span class="exp-info">${info}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  _makeTaskId(fileName) {
    // /junior/basics/task1.json → junior/basics/task1
    let cleanPath = this.path.replace(/^\//, '');
    const base = fileName.replace('.json', '');
    return cleanPath + '/' + base;
  }

  _getFolderProgress(items) {
    const jsonFiles = items.filter((i) => i.type === 'file' && i.name.endsWith('.json'));
    if (jsonFiles.length === 0) return null;

    let solved = 0;
    let total = jsonFiles.length;
    let stars = 0;
    let maxStars = total * 4;

    jsonFiles.forEach((f) => {
      const id = this._makeTaskId(f.name);
      if (progress.isSolved(id)) solved++;
      stars += progress.getStars(id);
    });

    return `${solved}/${total} · ⭐ ${stars}/${maxStars}`;
  }

  mount(body) {
    body.querySelectorAll('.explorer-item').forEach((el) => {
      el.onclick = () => {
        if (el.dataset.action === 'up') {
          const parts = this.path.split('/').filter(Boolean);
          parts.pop();
          const parent = '/' + parts.join('/');
          window.dispatchEvent(new CustomEvent('open-explorer', { detail: parent }));
          return;
        }

        const name = el.dataset.name;
        const type = el.dataset.type;
        const ext = el.dataset.ext;
        const fullPath = (this.path === '/' ? '' : this.path) + '/' + name;

        if (type === 'dir') {
          window.dispatchEvent(new CustomEvent('open-explorer', { detail: fullPath }));
        } else if (ext === 'json') {
          window.dispatchEvent(new CustomEvent('open-task', { detail: fullPath }));
        } else if (ext === 'csv') {
          window.dispatchEvent(new CustomEvent('open-csv', { detail: fullPath }));
        } else if (ext === 'txt' || ext === 'py') {
          window.dispatchEvent(new CustomEvent('open-file-viewer', { detail: fullPath }));
        } else {
          // Неизвестный тип — открываем как текст
          window.dispatchEvent(new CustomEvent('open-file-viewer', { detail: fullPath }));
        }
      };
    });
  }
}
