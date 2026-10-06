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

  // Загружаем только README и game.py — задачи fetch-им по клику
  const files = [
    ['/README.txt', 'data/README.txt'],
    ['/game.py', 'data/game.py'],
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

  // === ЗАГРУЖАЕМ СПИСОК ЗАДАЧ В BASICS ===
  // Чтобы Explorer видел файлы, монтируем "пустышки" — реальное содержимое грузится по клику
  const basicsTasks = ['task1', 'task2', 'task3', 'task4', 'task5', 'task6'];
  for (const name of basicsTasks) {
    // Монтируем stub — содержимое подгрузится через fetch при открытии
    fs.mount(`/junior/basics/${name}.json`, '{"_stub":true}');
  }

  // CSV
  try {
    const url = import.meta.env.BASE_URL + 'data/sales.csv';
    const res = await fetch(url);
    const csv = await res.text();
    window.__df = parseCSV(csv);
    window.__csv_sales = csv;
    fs.mount('/sales.csv', csv);
    fs.mount('/junior/sales.csv', csv);
    fs.mount('/junior/basics/sales.csv', csv);
  } catch (e) {
    console.warn('[FS] CSV не загружен', e.message);
  }
}
