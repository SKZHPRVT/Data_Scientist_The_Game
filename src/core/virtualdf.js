// Виртуальный DataFrame — не pandas, но похож
export class VirtualDF {
  constructor(rows, columns) {
    this.rows = rows;       // массив объектов {col: value}
    this.columns = columns; // массив имён колонок
  }

  slice(start, end) {
    return new VirtualDF(this.rows.slice(start, end), [...this.columns]);
  }

  filter(predicate) {
    return new VirtualDF(this.rows.filter(predicate), [...this.columns]);
  }

  map(fn) {
    return new VirtualDF(
      this.rows.map((row) => {
        const newRow = {};
        for (const col of this.columns) newRow[col] = fn(row[col], col, row);
        return newRow;
      }),
      [...this.columns]
    );
  }

  unique() {
    const seen = new Set();
    const uniqueRows = [];
    for (const row of this.rows) {
      const key = JSON.stringify(row);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRows.push(row);
      }
    }
    return new VirtualDF(uniqueRows, [...this.columns]);
  }

  sort(col, ascending = true) {
    const sorted = [...this.rows].sort((a, b) => {
      const av = a[col], bv = b[col];
      if (av < bv) return ascending ? -1 : 1;
      if (av > bv) return ascending ? 1 : -1;
      return 0;
    });
    return new VirtualDF(sorted, [...this.columns]);
  }

  aggregate(op) {
    // Если одна числовая колонка — возвращаем число, иначе объект
    const numericCols = this.columns.filter((c) =>
      this.rows.every((r) => typeof r[c] === 'number' || r[c] == null)
    );
    if (numericCols.length === 1) {
      const col = numericCols[0];
      const values = this.rows.map((r) => r[col]).filter((v) => v != null);
      return op === 'sum' ? values.reduce((a, b) => a + b, 0)
           : op === 'mean' ? values.reduce((a, b) => a + b, 0) / values.length
           : 0;
    }
    // Иначе — объект по колонкам
    const result = {};
    for (const col of numericCols) {
      const values = this.rows.map((r) => r[col]).filter((v) => v != null);
      result[col] = op === 'sum' ? values.reduce((a, b) => a + b, 0)
                  : op === 'mean' ? values.reduce((a, b) => a + b, 0) / values.length
                  : 0;
    }
    return result;
  }

  valueCounts(col) {
    const counts = {};
    for (const row of this.rows) {
      const v = row[col];
      counts[v] = (counts[v] || 0) + 1;
    }
    const rows = Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);
    return new VirtualDF(rows, ['value', 'count']);
  }

  cast(col, type) {
    return this.map((v, c) => {
      if (c !== col) return v;
      if (type === 'int') return parseInt(v, 10);
      if (type === 'float') return parseFloat(v);
      if (type === 'str') return String(v);
      return v;
    });
  }

  hasNaN() {
    return this.rows.some((row) => Object.values(row).some((v) => v == null || Number.isNaN(v)));
  }

  info() {
    return {
      rows: this.rows.length,
      columns: this.columns.length,
      columnNames: [...this.columns],
      dtypes: this.columns.reduce((acc, col) => {
        const sample = this.rows.find((r) => r[col] != null)?.[col];
        acc[col] = typeof sample;
        return acc;
      }, {}),
    };
  }

  equals(other) {
    if (!(other instanceof VirtualDF)) return false;
    if (this.rows.length !== other.rows.length) return false;
    return JSON.stringify(this.rows) === JSON.stringify(other.rows);
  }

  toJSON() {
    return { rows: this.rows, columns: this.columns };
  }
}

export class GroupBy {
  constructor(df, col) {
    this.df = df;
    this.col = col;
    this.groups = this._group();
  }

  _group() {
    const groups = {};
    for (const row of this.df.rows) {
      const key = row[this.col];
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }
    return groups;
  }

  sum() {
    return this._aggregate('sum');
  }

  mean() {
    return this._aggregate('mean');
  }

  count() {
    return this._aggregate('count');
  }

  _aggregate(op) {
    const rows = [];
    for (const [key, groupRows] of Object.entries(this.groups)) {
      const result = { [this.col]: key };
      const numericCols = this.df.columns.filter((c) =>
        c !== this.col && groupRows.every((r) => typeof r[c] === 'number' || r[c] == null)
      );
      for (const col of numericCols) {
        const values = groupRows.map((r) => r[col]).filter((v) => v != null);
        if (op === 'sum') result[col] = values.reduce((a, b) => a + b, 0);
        else if (op === 'mean') result[col] = values.reduce((a, b) => a + b, 0) / values.length;
        else if (op === 'count') result[col] = values.length;
      }
      rows.push(result);
    }
    return new VirtualDF(rows, [this.col, ...Object.keys(rows[0] || {}).filter((k) => k !== this.col)]);
  }
}

// ===== ПАРСЕР CSV =====
export function parseCSV(content) {
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
  return new VirtualDF(rows, headers);
}
