import { COMMANDS } from './commands.js';
import { VirtualDF, GroupBy } from './virtualdf.js';

// Регистрируем классы глобально, чтобы commands.js мог их использовать
window.__virtualdf = { VirtualDF, GroupBy };

// ============================================
// ТОКЕНИЗАЦИЯ
// ============================================
export function tokenize(code) {
  const tokens = [];
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '#') {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }
    if (ch === '.' || ch === '(' || ch === ')' || ch === '[' || ch === ']' || ch === ',') {
      tokens.push({ type: 'punct', value: ch });
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      let str = '';
      const quote = ch;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\') { i++; str += code[i]; }
        else str += code[i];
        i++;
      }
      i++;
      tokens.push({ type: 'string', value: str });
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < code.length && /[0-9.]/.test(code[i])) { num += code[i]; i++; }
      tokens.push({ type: 'number', value: parseFloat(num) });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) { ident += code[i]; i++; }
      tokens.push({ type: 'ident', value: ident });
      continue;
    }
    if ('=<>!'.includes(ch)) {
      let op = ch;
      i++;
      if ('='.includes(code[i])) { op += code[i]; i++; }
      tokens.push({ type: 'op', value: op });
      continue;
    }
    i++;
  }
  return tokens;
}

// ============================================
// ВЫЧИСЛЕНИЕ
// ============================================
export function evaluate(code, context) {
  const tokens = tokenize(code);
  return parseExpression(tokens, 0, context).value;
}

function parseExpression(tokens, pos, context) {
  let token = tokens[pos];
  if (!token) throw new Error('Пустое выражение');

  let value;
  let i = pos;

  if (token.type === 'ident') {
    const name = token.value;
    if (name in context) {
      value = context[name];
      i++;
    } else if (name === 'pd') {
      value = { __module__: 'pandas' };
      i++;
    } else if (name === 'np') {
      value = { __module__: 'numpy' };
      i++;
    } else {
      value = { __identifier__: name };
      i++;
    }
  } else if (token.type === 'number') {
    value = token.value;
    i++;
  } else if (token.type === 'string') {
    value = token.value;
    i++;
  } else {
    throw new Error(`Неожиданный токен: ${token.value}`);
  }

  // Парсим цепочку .method(args) / .property / [key] / (args)
  while (i < tokens.length) {
    const t = tokens[i];
    if (t.type === 'punct' && t.value === '.') {
      i++;
      const method = tokens[i];
      if (!method || method.type !== 'ident') throw new Error('Ожидалось имя метода');
      i++;
      const methodName = method.value;

      // Аргументы
      let args = [];
      if (tokens[i]?.value === '(') {
        i++;
        while (i < tokens.length && tokens[i].value !== ')') {
          if (tokens[i].value === ',') { i++; continue; }
          const argResult = parseExpression(tokens, i, context);
          args.push(argResult.value);
          i = argResult.pos;
        }
        i++;
      }

      value = callMember(value, methodName, args, context);
    } else if (t.type === 'punct' && t.value === '[') {
      i++;
      const key = parseExpression(tokens, i, context);
      i = key.pos;
      if (tokens[i]?.value === ']') i++;
      value = getItem(value, key.value);
    } else if (t.type === 'punct' && t.value === '(') {
      i++;
      const args = [];
      while (i < tokens.length && tokens[i].value !== ')') {
        if (tokens[i].value === ',') { i++; continue; }
        const argResult = parseExpression(tokens, i, context);
        args.push(argResult.value);
        i = argResult.pos;
      }
      i++;
      value = callFunction(value, args, context);
    } else {
      break;
    }
  }

  return { value, pos: i };
}

function callMember(obj, name, args, context) {
  // pd.read_csv(...) / np.array(...)
  if (obj && (obj.__module__ === 'pandas' || obj.__module__ === 'numpy')) {
    const cmd = COMMANDS[name];
    if (!cmd) throw new Error(`Неизвестная функция: ${name}`);
    return cmd.implemented(args, window.__fs, context);
  }

  if (obj instanceof VirtualDF || obj instanceof GroupBy || obj?.__plain) {
    const cmd = COMMANDS[name];

    // Если args пустой и это свойство (не метод) — возвращаем свойство
    if (args.length === 0) {
      if (name === 'shape' && obj.rows && obj.columns) {
        return [obj.rows.length, obj.columns.length];
      }
      if (name === 'columns' && obj.columns) {
        return [...obj.columns];
      }
    }

    if (cmd && cmd.implemented) {
      return cmd.implemented(obj, args, context);
    }

    if (typeof obj[name] === 'function') {
      return obj[name](...args);
    }

    if (name in obj && typeof obj[name] !== 'function') {
      return obj[name];
    }

    throw new Error(`Метод не найден: ${name}`);
  }

  if (typeof obj?.[name] === 'function') {
    return obj[name](...args);
  }
  if (obj && name in obj) return obj[name];

  throw new Error(`Не могу вызвать "${name}" у ${typeof obj}`);
}

function callFunction(fn, args, context) {
  if (fn && fn.__identifier__) {
    const name = fn.__identifier__;
    const cmd = COMMANDS[name];
    if (cmd) return cmd.implemented(args, window.__fs, context);
    throw new Error(`Неизвестная функция: ${name}`);
  }
  if (typeof fn === 'function') return fn(...args);
  throw new Error('Не функция');
}

function getItem(obj, key) {
  if (obj instanceof VirtualDF) {
    if (typeof key === 'string') {
      return new Series(obj, key);
    }
  }
  return obj?.[key];
}

// Series — обёртка над колонкой
export class Series {
  constructor(df, col) {
    this.df = df;
    this.col = col;
  }
  value_counts() { return this.df.valueCounts(this.col); }
  mean() {
    const values = this.df.rows.map((r) => r[this.col]).filter((v) => typeof v === 'number');
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  sum() {
    const values = this.df.rows.map((r) => r[this.col]).filter((v) => typeof v === 'number');
    return values.reduce((a, b) => a + b, 0);
  }
  unique() { return [...new Set(this.df.rows.map((r) => r[this.col]))]; }
  astype(type) { return this.df.cast(this.col, type)[this.col]; }
}
