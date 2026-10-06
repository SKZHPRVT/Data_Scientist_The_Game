// ============================================
// ВСЕ КОМАНДЫ ИГРЫ В ОДНОМ ФАЙЛЕ
// Добавляешь команду — она появляется везде
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
      const path = args[0];
      const content = fs.readFile(path);
      return parseCSV(content);
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
