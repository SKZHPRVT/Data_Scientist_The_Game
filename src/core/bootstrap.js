// Загружает ФС и данные при старте
import { parseCSV } from './virtualdf.js';

export async function bootstrapFS() {
  const fs = window.__fs;

  // Монтируем структуру
  fs.mkdir('/junior');
  fs.mkdir('/junior/basics');
  fs.mkdir('/junior/cleaning');
  fs.mkdir('/junior/grouping');
  fs.mkdir('/junior/side_quests');
  fs.mkdir('/junior/bosses');
  fs.mkdir('/middle');
  fs.mkdir('/senior');
  fs.mkdir('/sandbox');

  // Загружаем файлы (из public/)
  const files = [
    ['/README.txt', 'data/README.txt'],
    ['/game.py', 'data/game.py'],
    ['/junior/basics/task1.json', 'tasks/junior/basics/task1.json'],
  ];

  for (const [virtualPath, realPath] of files) {
    try {
      const url = import.meta.env.BASE_URL + realPath;
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const content = await res.text();
      fs.mount(virtualPath, content);
    } catch (e) {
      console.warn('[FS] Не удалось загрузить', realPath, e.message);
    }
  }

  // Загружаем CSV в память как DataFrame
  try {
    const url = import.meta.env.BASE_URL + 'data/sales.csv';
    const res = await fetch(url);
    const csv = await res.text();
    window.__df = parseCSV(csv);
  } catch (e) {
    console.warn('[FS] CSV не загружен', e.message);
  }
}
