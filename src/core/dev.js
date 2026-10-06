// ============================================
// DEV-РЕЖИМ через localStorage (sv_cheats 1)
// ============================================

export const DEV_LOG = true;

export function devLog(...args) {
  if (DEV_LOG) console.log('[dev]', ...args);
}

export function isDevUnlockAll() {
  try {
    return localStorage.getItem('sv_cheats') === '1';
  } catch {
    return false;
  }
}

export function isCheatModeOn() {
  return isDevUnlockAll();
}
