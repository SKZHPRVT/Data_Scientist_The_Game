import { storage } from '../../core/storage.js';

export const WALLPAPERS = {
  default: {
    name: 'По умолчанию',
    css: 'radial-gradient(ellipse at top, #0a1a0f 0%, #000 70%)',
  },
  matrix: {
    name: 'Матрица',
    css: 'linear-gradient(180deg, #000 0%, #001a00 50%, #000 100%)',
  },
  neon: {
    name: 'Неон',
    css: 'linear-gradient(135deg, #1a0033 0%, #330066 50%, #1a0033 100%)',
  },
  sunset: {
    name: 'Закат',
    css: 'linear-gradient(180deg, #1a0033 0%, #660044 50%, #ff6600 100%)',
  },
  ocean: {
    name: 'Океан',
    css: 'linear-gradient(180deg, #001a33 0%, #003366 50%, #000 100%)',
  },
  forest: {
    name: 'Лес',
    css: 'radial-gradient(ellipse at bottom, #0a2a0a 0%, #000 70%)',
  },
};

export function applyWallpaper(id) {
  const wp = WALLPAPERS[id] || WALLPAPERS.default;
  const deskEl = document.getElementById('desktop');
  if (deskEl) {
    deskEl.style.backgroundImage = 'none';
    deskEl.style.background = wp.css;
  }
}

export class Settings {
  constructor(desktop) {
    this.desktop = desktop;
  }

  render() {
    const current = storage.get('wallpaper', 'default');
    const volume = +storage.get('volume', 0.3) || 0.3;
    const soundOn = storage.get('sound', 'on') !== 'off';
    const currentLang = storage.get('lang', 'ru');

    return `
      <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.8;">
        <p><strong>⚙️ НАСТРОЙКИ</strong></p>

        <p style="margin-top: 16px;">🎨 Обои:</p>
        <div id="wallpaper-list" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px;">
          ${Object.entries(WALLPAPERS).map(([id, w]) => `
            <div class="wallpaper-opt" data-id="${id}"
                 style="padding: 14px 8px; border: 2px solid ${id === current ? 'var(--accent)' : 'var(--fg-dim)'};
                        border-radius: 6px; text-align: center; cursor: pointer; font-size: 11px;
                        background: ${w.css}; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.9);">
              ${w.name}
            </div>
          `).join('')}
        </div>

        <p style="margin-top: 16px;">🔊 Звук:</p>
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="sound-on" ${soundOn ? 'checked' : ''}>
          Звуки
        </label>

        <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
          <span style="font-size: 11px; color: var(--fg-dim);">Громкость:</span>
          <input type="range" id="volume-range" min="0" max="1" step="0.05"
                 value="${volume}"
                 style="flex: 1; accent-color: var(--accent);">
          <span id="volume-val" style="color: var(--fg-dim); min-width: 40px; font-size: 11px;">
            ${Math.round(volume * 100)}%
          </span>
        </div>

        <p style="margin-top: 16px;">🌐 Язык / Language:</p>
        <div style="display: flex; gap: 8px;">
          <button class="task-btn" data-lang="ru"
                  style="flex: 1; ${currentLang === 'ru' ? 'border-color: var(--accent); background: rgba(0,255,65,0.1);' : ''}">
            🇷🇺 Русский
          </button>
          <button class="task-btn" data-lang="en"
                  style="flex: 1; ${currentLang === 'en' ? 'border-color: var(--accent); background: rgba(0,255,65,0.1);' : ''}">
            🇬🇧 English
          </button>
        </div>

        <p style="margin-top: 16px; font-size: 11px; color: var(--fg-dim);">
          Английский пока только для интерфейса настроек — полный перевод в разработке.
        </p>

        <div style="margin-top: 24px;">
          <button class="taskbar-btn" id="reset-btn" style="color: var(--error);">Сбросить прогресс</button>
        </div>
      </div>
    `;
  }

  mount(body) {
    body.querySelectorAll('.wallpaper-opt').forEach((el) => {
      el.onclick = () => {
        const id = el.dataset.id;
        storage.set('wallpaper', id);
        applyWallpaper(id);
        body.querySelectorAll('.wallpaper-opt').forEach((e) => {
          e.style.borderColor = e.dataset.id === id ? 'var(--accent)' : 'var(--fg-dim)';
        });
        if (window.__audio) window.__audio.click('normal');
      };
    });

    const soundCb = body.querySelector('#sound-on');
    soundCb.onchange = (e) => {
      if (window.__audio) window.__audio.setEnabled(e.target.checked);
    };

    const volRange = body.querySelector('#volume-range');
    const volVal = body.querySelector('#volume-val');
    volRange.oninput = (e) => {
      const v = parseFloat(e.target.value);
      if (window.__audio) {
        window.__audio.setVolume(v);
        window.__audio.key('normal');
      }
      volVal.textContent = Math.round(v * 100) + '%';
    };

    body.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.onclick = () => {
        const lang = btn.dataset.lang;
        storage.set('lang', lang);
        body.querySelectorAll('[data-lang]').forEach((b) => {
          b.style.borderColor = b.dataset.lang === lang ? 'var(--accent)' : 'var(--fg-dim)';
          b.style.background = b.dataset.lang === lang ? 'rgba(0,255,65,0.1)' : '';
        });
        if (window.__audio) window.__audio.click('normal');
      };
    });

    body.querySelector('#reset-btn').onclick = () => {
      if (confirm('Точно сбросить весь прогресс?')) {
        localStorage.clear();
        location.reload();
      }
    };
  }
}
