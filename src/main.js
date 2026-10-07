import './ui/styles.css';
import './core/fs.js';
import { bootstrapFS, bootstrapModels } from './core/bootstrap.js';
import { Desktop } from './ui/desktop/Desktop.js';
import { TelegramSDK } from './core/telegram.js';
import { KeyboardHandler } from './core/keyboard.js';
import { audio } from './core/audio.js';
import { progress } from './core/progress.js';

window.__audio = audio;
window.__progress = progress;

if (location.search.includes('reset=1')) {
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.log('[reset] localStorage cleared');
  } catch (e) {}
  history.replaceState({}, '', location.pathname);
}

window.addEventListener('error', (e) => {
  console.error('[GLOBAL ERROR]', e.error || e.message);
  const app = document.getElementById('app');
  if (app && !app.innerHTML.trim()) {
    app.innerHTML = `
      <div style="padding: 40px; font-family: monospace; color: #00ff41; background: #000; height: 100vh; overflow: auto;">
        <h2>⚠ Ошибка</h2>
        <pre style="white-space: pre-wrap; margin-top: 20px; font-size: 12px;">${(e.error?.stack || e.message || 'Unknown').replace(/</g, '&lt;')}</pre>
        <button onclick="localStorage.clear(); location.reload();"
                style="margin-top: 20px; padding: 10px 20px; background: #00ff41; color: #000; border: none; cursor: pointer; font-family: monospace; font-size: 14px;">
          Сбросить и перезагрузить
        </button>
      </div>
    `;
  }
});

// ============================================
// ЗАГРУЗОЧНЫЙ ЭКРАН
// ============================================
function createLoader() {
  const el = document.createElement('div');
  el.className = 'loading';
  el.innerHTML = `
    <div class="loading-content">
      <div class="loading-lines">
        <div class="loading-line" id="load-line-1">0000</div>
        <div class="loading-line" id="load-line-2">000000000</div>
      </div>
      <div class="loading-status" id="load-status">Инициализация...</div>
      <div class="loading-progress">
        <div class="loading-progress-bar" id="load-bar"></div>
      </div>
      <div class="loading-percent" id="load-percent">0%</div>
    </div>
  `;
  document.body.appendChild(el);

  // === Анимация цифр → DATA SCIENTIST ===
  const target1 = 'DATA';
  const target2 = 'SCIENTIST';
  const line1 = document.getElementById('load-line-1');
  const line2 = document.getElementById('load-line-2');

  let display1 = target1.split('').map(() => String(Math.floor(Math.random() * 10))).join('');
  let display2 = target2.split('').map(() => String(Math.floor(Math.random() * 10))).join('');

  const interval = setInterval(() => {
    let newDisplay1 = '';
    for (let i = 0; i < target1.length; i++) {
      if (display1[i] === target1[i]) newDisplay1 += target1[i];
      else if (Math.random() < 0.15) newDisplay1 += target1[i];
      else newDisplay1 += String(Math.floor(Math.random() * 10));
    }
    let newDisplay2 = '';
    for (let i = 0; i < target2.length; i++) {
      if (display2[i] === target2[i]) newDisplay2 += target2[i];
      else if (Math.random() < 0.15) newDisplay2 += target2[i];
      else newDisplay2 += String(Math.floor(Math.random() * 10));
    }
    display1 = newDisplay1;
    display2 = newDisplay2;
    if (line1) line1.textContent = display1;
    if (line2) line2.textContent = display2;
  }, 55);

  // === Методы управления ===
  const setStatus = (text, percent) => {
    const statusEl = document.getElementById('load-status');
    const barEl = document.getElementById('load-bar');
    const percentEl = document.getElementById('load-percent');
    if (statusEl) statusEl.textContent = text;
    if (barEl) barEl.style.width = percent + '%';
    if (percentEl) percentEl.textContent = percent + '%';
  };

  const hide = () => {
    // Ждём, чтобы цифры успели сложиться в DATA SCIENTIST
    setTimeout(() => {
      clearInterval(interval);
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 600);
    }, 400);
  };

  return { setStatus, hide };
}

// ============================================
// СТАРТ
// ============================================
async function start() {
  const loader = createLoader();

  // Шаг 1: Инициализация
  loader.setStatus('Инициализация...', 5);
  await new Promise((r) => setTimeout(r, 300));

  // Шаг 2: Файловая система
  loader.setStatus('Загрузка файловой системы...', 20);
  await bootstrapFS();
  loader.setStatus('Файловая система загружена', 45);
  await new Promise((r) => setTimeout(r, 200));

  // Шаг 3: Модели
  loader.setStatus('Загрузка моделей...', 60);
  await bootstrapModels();
  loader.setStatus('Модели загружены', 80);
  await new Promise((r) => setTimeout(r, 200));

  // Шаг 4: Telegram + клавиатура
  loader.setStatus('Подключение к Telegram...', 85);
  const tg = new TelegramSDK();
  tg.init();

  const keyboard = new KeyboardHandler();
  window.__keyboard = keyboard;

  // Шаг 5: Рабочий стол
  loader.setStatus('Запуск рабочего стола...', 95);
  await new Promise((r) => setTimeout(r, 200));

  document.getElementById('app').innerHTML = '';
  const desktop = new Desktop(document.getElementById('app'), tg);
  desktop.render();

  // Шаг 6: Готово
  loader.setStatus('Готово', 100);
  loader.hide();

  // === Форс-ресайз для Telegram ===
  let _maxH = window.innerHeight;
  const forceResize = () => {
    _maxH = Math.max(_maxH, window.innerHeight);
    const h = _maxH;
    document.documentElement.style.height = h + 'px';
    document.body.style.height = h + 'px';
    const app = document.getElementById('app');
    if (app) app.style.height = h + 'px';
  };

  window.addEventListener('resize', forceResize);
  window.addEventListener('orientationchange', () => {
    setTimeout(forceResize, 100);
    setTimeout(forceResize, 500);
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', forceResize);
  }

  forceResize();
}

start();
