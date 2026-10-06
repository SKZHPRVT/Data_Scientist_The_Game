import './ui/styles.css';
import './core/fs.js';          // ← сначала создаём window.__fs
import { bootstrapFS } from './core/bootstrap.js';
import { Desktop } from './ui/desktop/Desktop.js';
import { TelegramSDK } from './core/telegram.js';

async function start() {
  showLoading();
  await bootstrapFS();
  const tg = new TelegramSDK();
  tg.init();
  document.getElementById('app').innerHTML = '';
  const desktop = new Desktop(document.getElementById('app'), tg);
  desktop.render();
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
