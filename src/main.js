import './ui/styles.css';
import './core/fs.js';
import { bootstrapFS } from './core/bootstrap.js';
import { Desktop } from './ui/desktop/Desktop.js';
import { TelegramSDK } from './core/telegram.js';
import { KeyboardHandler } from './core/keyboard.js';
import { audio } from './core/audio.js';
import { progress } from './core/progress.js';

window.__audio = audio;

// === АВТОСБРОС ЧЕРЕЗ ?reset=1 ===
if (location.search.includes('reset=1')) {
  try {
    localStorage.clear();
    sessionStorage.clear();
    console.log('[reset] localStorage cleared');
  } catch (e) {}
  history.replaceState({}, '', location.pathname);
}

// === ОТЛАДОЧНАЯ КОМАНДА ===
window.__progress = progress;
console.log('[main] progress helper available: window.__progress');

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

async function start() {
  showLoading();
  await bootstrapFS();

  const tg = new TelegramSDK();
  tg.init();

  const keyboard = new KeyboardHandler();
  window.__keyboard = keyboard;

  document.getElementById('app').innerHTML = '';
  const desktop = new Desktop(document.getElementById('app'), tg);
  desktop.render();

  const forceResize = () => {
    const h = window.visualViewport?.height ?? window.innerHeight;
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

function showLoading() {
  const el = document.createElement('div');
  el.className = 'loading';
  el.innerHTML = '<div class="loading-digits" id="load-digits">00000000000000</div>';
  document.body.appendChild(el);

  const target = 'DATA SCIENTIST';
  let display = '00000000000000';

  const interval = setInterval(() => {
    let done = true;
    for (let i = 0; i < target.length; i++) {
      if (display[i] !== target[i]) {
        done = false;
        if (Math.random() < 0.2) {
          display = display.slice(0, i) + target[i] + display.slice(i + 1);
        } else {
          const r = String(Math.floor(Math.random() * 10));
          display = display.slice(0, i) + r + display.slice(i + 1);
        }
      }
    }
    const digits = document.getElementById('load-digits');
    if (digits) digits.textContent = display;
    if (done) {
      clearInterval(interval);
      setTimeout(() => el.remove(), 600);
    }
  }, 60);
}

start();
