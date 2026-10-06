// ============================================
// ВСЕ КОМАНДЫ ИГРЫ В ОДНОМ ФАЙЛЕ
// ============================================

export const COMMANDS = {
  // ===== ЗАГРУЗКА =====
  read_csv: {
    world: 'junior',
    level: 1,
    category: 'load',
    signature: "pd.read_csv('file.csv')",
    description: 'Читает CSV-файл в DataFrame',
    example: "pd.read_csv('sales.csv')",
    implemented: (args, fs) => {
      const raw = args[0];
      const path = String(raw ?? '').replace(/['"]/g, '');

      // 1. Пробуем прочитать из виртуальной ФС
      if (fs) {
        try {
          const content = fs.readFile(path);
          return parseCSV(content);
        } catch (e) {}
        // Пробуем с относительным путём от cwd
        try {
          const cwd = fs.getCwd ? fs.getCwd() : '/';
          const abs = (cwd === '/' ? '' : cwd) + '/' + path;
          const content = fs.readFile(abs);
          return parseCSV(content);
        } catch (e) {}
      }

      // 2. Если это sales — возвращаем уже загруженный DataFrame
      if (path.includes('sales') && window.__df) return window.__df;

      // 3. Иначе — ошибка
      throw new Error(`Файл не найден: ${path}`);
    },
    check: (r) => r instanceof VirtualDF,
  },

  // ===== ПРОСМОТР =====
  head: {
    world: 'junior',
    level: 1,
    category: 'view',
    signature: 'df.head(n=5)',
    description: 'Первые n строк',
    example: 'df.head(10)',
    implemented: (df, args) => df.slice(0, args[0] ?? 5),
    check: (r) => r instanceof VirtualDF,
  },

  shape: {
    world: 'junior',
    level: 1,
    category: 'view',
    signature: 'df.shape',
    description: 'Размер: [строки, колонки]',
    implemented: (df) => [df.rows.length, df.columns.length],
    check: (r) => Array.isArray(r) && r.length === 2,
  },

  info: {
    world: 'junior',
    level: 1,
    category: 'view',
    signature: 'df.info()',
    description: 'Информация о колонках и типах',
    implemented: (df) => df.info(),
    check: (r) => typeof r === 'object',
  },

  columns: {
    world: 'junior',
    level: 1,
    category: 'view',
    signature: 'df.columns',
    description: 'Список колонок',
    implemented: (df) => [...df.columns],
    check: (r) => Array.isArray(r),
  },

  // ===== ОЧИСТКА =====
  dropna: {
    world: 'junior',
    level: 2,
    category: 'clean',
    signature: 'df.dropna()',
    description: 'Удаляет строки с пропусками',
    implemented: (df) => df.filter((row) => !row.hasNaN()),
    check: (r) => r instanceof VirtualDF && !r.hasNaN(),
  },

  fillna: {
    world: 'junior',
    level: 2,
    category: 'clean',
    signature: 'df.fillna(value)',
    description: 'Заполняет пропуски значением',
    implemented: (df, args) => df.map((v) => v ?? args[0]),
    check: (r) => r instanceof VirtualDF,
  },

  drop_duplicates: {
    world: 'junior',
    level: 2,
    category: 'clean',
    signature: 'df.drop_duplicates()',
    description: 'Удаляет дубликаты строк',
    implemented: (df) => df.unique(),
    check: (r) => r instanceof VirtualDF,
  },

  astype: {
    world: 'junior',
    level: 2,
    category: 'clean',
    signature: "df['col'].astype(type)",
    description: 'Меняет тип колонки',
    implemented: (df, args) => df.cast(args[0], args[1]),
    check: (r) => r instanceof VirtualDF,
  },

  // ===== ГРУППИРОВКА =====
  groupby: {
    world: 'junior',
    level: 3,
    category: 'group',
    signature: "df.groupby('col')",
    description: 'Группирует по колонке',
    implemented: (df, args) => new GroupBy(df, args[0]),
    check: (r) => r instanceof GroupBy,
  },

  sum: {
    world: 'junior',
    level: 3,
    category: 'group',
    signature: 'df.sum()',
    description: 'Сумма значений',
    implemented: (df) => df.aggregate('sum'),
    check: (r) => typeof r === 'number' || r instanceof VirtualDF,
  },

  mean: {
    world: 'junior',
    level: 3,
    category: 'group',
    signature: 'df.mean()',
    description: 'Среднее значение',
    implemented: (df) => df.aggregate('mean'),
    check: (r) => typeof r === 'number' || r instanceof VirtualDF,
  },

  value_counts: {
    world: 'junior',
    level: 3,
    category: 'group',
    signature: "df['col'].value_counts()",
    description: 'Частота уникальных значений',
    implemented: (df, args) => df.valueCounts(args[0]),
    check: (r) => r instanceof VirtualDF,
  },

  // ===== СОРТИРОВКА =====
  sort_values: {
    world: 'junior',
    level: 3,
    category: 'sort',
    signature: "df.sort_values('col', ascending=False)",
    description: 'Сортирует по колонке',
    implemented: (df, args) => df.sort(args[0], args[1] ?? true),
    check: (r) => r instanceof VirtualDF,
  },

  // ===== ЗАГЛУШКИ для middle/senior =====
  merge: { world: 'middle', implemented: () => { throw new Error('Not implemented'); } },
  concat: { world: 'middle', implemented: () => { throw new Error('Not implemented'); } },
  pivot_table: { world: 'middle', implemented: () => { throw new Error('Not implemented'); } },
  apply: { world: 'middle', implemented: () => { throw new Error('Not implemented'); } },
  train_test_split: { world: 'middle', implemented: () => { throw new Error('Not implemented'); } },
  fit: { world: 'middle', implemented: () => { throw new Error('Not implemented'); } },
  predict: { world: 'middle', implemented: () => { throw new Error('Not implemented'); } },
};

export function getCommandsByWorld(world) {
  return Object.entries(COMMANDS)
    .filter(([_, cmd]) => cmd.world === world)
    .map(([id, cmd]) => ({ id, ...cmd }));
}

// Локальный парсер CSV (не тянем из virtualdf, чтобы не было циклов)
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => {
      const v = values[i]?.trim();
      row[h] = v === '' || v === 'NaN' || v === 'null' ? null
             : !isNaN(v) && v !== '' ? Number(v)
             : v;
    });
    return row;
  });
  // Импортируем VirtualDF динамически, чтобы избежать циклов
  const { VirtualDF } = window.__virtualdf || {};
  if (VirtualDF) return new VirtualDF(rows, headers);
  // Fallback: если класс не доступен, вернём plain объект
  return { rows, columns: headers, __plain: true };
}
