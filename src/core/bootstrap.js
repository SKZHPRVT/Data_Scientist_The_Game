import { parseCSV } from './virtualdf.js';

export async function bootstrapFS() {
  const fs = window.__fs;

  // Монтируем структуру папок
  fs.mkdir('/junior');
  fs.mkdir('/junior/basics');
  fs.mkdir('/junior/cleaning');
  fs.mkdir('/junior/grouping');
  fs.mkdir('/junior/merging');
  fs.mkdir('/junior/datetime');
  fs.mkdir('/junior/strings');
  fs.mkdir('/junior/side_quests');
  fs.mkdir('/junior/bosses');
  fs.mkdir('/middle');
  fs.mkdir('/middle/pipelines');
  fs.mkdir('/middle/features');
  fs.mkdir('/middle/models');
  fs.mkdir('/middle/eval');
  fs.mkdir('/middle/experiments');
  fs.mkdir('/middle/bosses');
  fs.mkdir('/senior');
  fs.mkdir('/senior/incidents');
  fs.mkdir('/senior/research');
  fs.mkdir('/senior/mentoring');
  fs.mkdir('/senior/architecture');
  fs.mkdir('/senior/final');
  fs.mkdir('/baby');
  fs.mkdir('/baby/what_is_data');
  fs.mkdir('/baby/first_table');
  fs.mkdir('/baby/columns_rows');
  fs.mkdir('/baby/what_is_ds');
  fs.mkdir('/baby/first_step');
  fs.mkdir('/sandbox');

  // Загружаем статические файлы
  const files = [
    ['/README.txt', 'data/README.txt'],
    ['/game.py', 'data/game.py'],
    ['/NOTES.txt', 'data/NOTES.txt'],
    ['/todo.txt', 'data/todo.txt'],
    ['/about.txt', 'data/about.txt'],
    ['/CHEATS.txt', 'data/CHEATS.txt'],
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

  // CSV
  try {
    const url = import.meta.env.BASE_URL + 'data/sales.csv';
    const res = await fetch(url);
    const csv = await res.text();
    window.__df = parseCSV(csv);
    window.__csv_sales = csv;
    fs.mount('/sales.csv', csv);
  } catch (e) {
    console.warn('[FS] CSV не загружен', e.message);
  }
}
