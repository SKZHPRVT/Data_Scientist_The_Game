import { VirtualDF } from './virtualdf.js';

// ============================================
// ПРОВЕРКА ОТВЕТОВ
// 3 режима: exact, property, columns
// ============================================

export function checkAnswer(userResult, task) {
  const mode = task.checkMode || 'exact';

  try {
    if (mode === 'exact') {
      return checkExact(userResult, task.expected);
    }
    if (mode === 'property') {
      return checkProperty(userResult, task);
    }
    if (mode === 'columns') {
      return checkColumns(userResult, task);
    }
    return { ok: false, reason: 'unknown_mode' };
  } catch (e) {
    return { ok: false, reason: 'error', message: e.message };
  }
}

function checkExact(user, expected) {
  if (user instanceof VirtualDF && expected instanceof VirtualDF) {
    return { ok: user.equals(expected), reason: user.equals(expected) ? 'ok' : 'not_equal' };
  }
  if (Array.isArray(user) && Array.isArray(expected)) {
    return { ok: JSON.stringify(user) === JSON.stringify(expected), reason: 'array_mismatch' };
  }
  if (typeof user === 'number' && typeof expected === 'number') {
    return { ok: Math.abs(user - expected) < 1e-6, reason: 'number_mismatch' };
  }
  return { ok: user === expected, reason: 'value_mismatch' };
}

function checkProperty(user, task) {
  // task.property — функция (result) => boolean
  const result = task.property(user);
  return { ok: !!result, reason: result ? 'ok' : 'property_failed' };
}

function checkColumns(user, task) {
  if (!(user instanceof VirtualDF)) {
    return { ok: false, reason: 'not_dataframe' };
  }
  const expectedCols = task.expectedColumns;
  const hasAll = expectedCols.every((c) => user.columns.includes(c));
  return { ok: hasAll, reason: hasAll ? 'ok' : 'missing_columns' };
}
