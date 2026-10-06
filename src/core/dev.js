// ============================================
// РЕЖИМ РАЗРАБОТКИ
// ============================================
// DEV_UNLOCK_ALL = true  → все миры, папки, квесты открыты + доступны дев-команды
// DEV_UNLOCK_ALL = false → нормальная последовательная прогрессия
//
// ПЕРЕД ПУШЕМ В ПРОД ПОСТАВЬ false !!!
// ============================================

export const DEV_UNLOCK_ALL = true;
export const DEV_LOG = true;

export function devLog(...args) {
  if (DEV_LOG) console.log('[dev]', ...args);
}
