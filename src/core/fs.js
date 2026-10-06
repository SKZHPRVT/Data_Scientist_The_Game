// Виртуальная файловая система игры
// Всё в памяти + подгрузка из /src/data/

export class VirtualFS {
  constructor() {
    this.tree = {};
    this.cwd = '/';
  }

  mount(path, content) {
    const parts = path.split('/').filter(Boolean);
    let node = this.tree;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]]) node[parts[i]] = {};
      node = node[parts[i]];
    }
    node[parts[parts.length - 1]] = { type: 'file', content };
  }

  mkdir(path) {
    const parts = path.split('/').filter(Boolean);
    let node = this.tree;
    for (const p of parts) {
      if (!node[p]) node[p] = {};
      node = node[p];
    }
  }

  readFile(path) {
    const parts = path.split('/').filter(Boolean);
    let node = this.tree;
    for (const p of parts) {
      if (!node?.[p]) throw new Error(`File not found: ${path}`);
      node = node[p];
    }
    if (node.type !== 'file') throw new Error(`Not a file: ${path}`);
    return node.content;
  }

  ls(path = this.cwd) {
    const parts = path.split('/').filter(Boolean);
    let node = this.tree;
    for (const p of parts) {
      if (!node?.[p]) throw new Error(`Path not found: ${path}`);
      node = node[p];
    }
    return Object.keys(node).map((name) => ({
      name,
      type: node[name]?.type === 'file' ? 'file' : 'dir',
    }));
  }

  cd(path) {
    if (path === '/') { this.cwd = '/'; return; }
    if (path === '..') {
      const parts = this.cwd.split('/').filter(Boolean);
      parts.pop();
      this.cwd = '/' + parts.join('/');
      return;
    }
    this.cwd = path.startsWith('/') ? path : `${this.cwd}/${path}`.replace('//', '/');
  }

  getCwd() {
    return this.cwd;
  }
}

// Глобальная ФС для команд
window.__fs = new VirtualFS();
