import { progress } from '../../core/progress.js';

export class Explorer {
  constructor(path, handlers) {
    this.path = path;
    this.handlers = handlers;
    this.dynamicItems = null;
    this.loading = false;
  }

  // Проверяем: соответствует ли путь папке задач
  _worldFromPath() {
    const parts = this.path.split('/').filter(Boolean);
    if (parts.length === 0) return null;
    const world = parts[0];
    if (!['baby', 'junior', 'middle', 'senior'].includes(world)) return null;
    return { world, chapter: parts[1] || null };
  }

  async loadDynamic() {
    const ctx = this._worldFromPath();
    if (!ctx) return;

    try {
      if (ctx.chapter) {
        const url = import.meta.env.BASE_URL + `tasks/${ctx.world}/${ctx.chapter}/index.json`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        this.dynamicItems = (data.tasks || []).map((t) => ({
          name: t,
          type: 'file',
        }));
      } else {
        const url = import.meta.env.BASE_URL + `tasks/${ctx.world}/index.json`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        this.dynamicItems = (data.chapters || []).map((ch) => ({
          name: ch.id,
          type: 'dir',
          title: ch.title,
          icon: ch.icon,
        }));
      }
    } catch (e) {
      console.warn('[Explorer] dynamic load fail', e);
    }
  }

  render() {
    let items = [];
    try {
      items = window.__fs.ls(this.path);
    } catch (e) {
      items = [];
    }

    // Если динамика загружена — используем её для задачных папок
    if (this.dynamicItems) {
      const dynamicNames = new Set(this.dynamicItems.map((i) => i.name));
      const localItems = items.filter((i) => !dynamicNames.has(i.name));
      items = [...this.dynamicItems, ...localItems];
    }

    items.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    let folderProgress = null;
    if (this.path !== '/' && this.dynamicItems && this.dynamicItems.some((i) => i.type === 'file' && i.name.endsWith('.json'))) {
      folderProgress = this._getFolderProgress(items);
    }

    // Показываем "Наверх" только если не в корне
    const showUp = this.path !== '/' && this.path !== '';
    const upPath = (() => {
      const parts = this.path.split('/').filter(Boolean);
      parts.pop();
      return '/' + parts.join('/');
    })();

    return `
      <div class="explorer-view">
        <div class="explorer-path">
          📁 ${this.path === '/' ? 'Корень' : this.path}
          ${folderProgress ? `<span style="color: var(--fg-dim); margin-left: 8px;">· ${folderProgress}</span>` : ''}
        </div>

        <div class="explorer-list">
          ${showUp ? `
            <div class="explorer-item" data-action="up" data-up="${upPath}">
              <span class="exp-icon">⬆️</span>
              <span class="exp-name">..</span>
              <span class="exp-info">наверх</span>
            </div>
          ` : ''}
          ${items.length === 0 ? '<div style="color: var(--fg-dim); padding: 12px;">(пусто)</div>' : ''}
          ${items.map((i) => {
            const isDir = i.type === 'dir';
            const name = i.name;
            const isJson = !isDir && name.endsWith('.json');
            const isCsv = !isDir && name.endsWith('.csv');
            const isTxt = !isDir && name.endsWith('.txt');
            const isPy = !isDir && name.endsWith('.py');

            let icon = isDir ? '📁' : '📄';
            if (isJson) icon = '🎯';
            else if (isCsv) icon = '📊';
            else if (isTxt) icon = '📝';
            else if (isPy) icon = '🐍';

            if (isDir && i.icon) icon = i.icon;

            let info = '';
            if (isJson) {
              const taskId = this._makeTaskId(name);
              const stars = progress.getStars(taskId);
              const solved = progress.isSolved(taskId);
              info = solved ? '✅ ' + '⭐'.repeat(stars) : 'не решено';
            } else if (isDir && i.title) {
              info = i.title;
            } else if (isCsv) {
              info = 'данные';
            } else if (isTxt) {
              info = 'текст';
            } else if (isPy) {
              info = 'скрипт';
            } else if (isDir) {
              info = 'папка';
            }

            return `
              <div class="explorer-item"
                   data-name="${name}"
                   data-type="${i.type}"
                   data-ext="${name.includes('.') ? name.split('.').pop() : ''}">
                <span class="exp-icon">${icon}</span>
                <span class="exp-name">${name}</span>
                <span class="exp-info">${info}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  _makeTaskId(fileName) {
    let cleanPath = this.path.replace(/^\//, '').replace(/\/$/, '');
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
          const up = el.dataset.up || '/';
          window.dispatchEvent(new CustomEvent('open-explorer', { detail: up }));
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
        } else {
          window.dispatchEvent(new CustomEvent('open-file-viewer', { detail: fullPath }));
        }
      };
    });
  }
}
