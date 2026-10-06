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

  // Загружаем файлы
  const files = [
    ['/README.txt', '/src/data/README.txt'],
    ['/game.py', '/src/data/game.py'],
    ['/junior/basics/task1.json', '/src/tasks/junior/basics/task1.json'],
  ];

  for (const [virtualPath, realPath] of files) {
    try {
      const res = await fetch(realPath);
      const content = await res.text();
      fs.mount(virtualPath, content);
    } catch (e) {
      console.warn('Не удалось загрузить', realPath);
    }
  }

  // Загружаем CSV в память как DataFrame
  try {
    const res = await fetch('/src/data/sales.csv');
    const csv = await res.text();
    window.__df = parseCSV(csv);
  } catch (e) {
    console.warn('CSV не загружен');
  }
}
