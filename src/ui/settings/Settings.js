import { storage } from '../../core/storage.js';

export class Settings {
  constructor(desktop) {
    this.desktop = desktop;
  }

  render() {
    const wallpapers = ['default', 'matrix', 'dark', 'neon', 'vaporwave'];
    const current = storage.get('wallpaper', 'default');
    const volume = +storage.get('volume', 0.3) || 0.3;
    const soundOn = storage.get('sound', 'on') !== 'off';
    const timerOn = storage.get('timer', 'on') !== 'off';

    return `
      <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.8;">
        <p><strong>⚙️ НАСТРОЙКИ</strong></p>

        <p style="margin-top: 16px;">🎨 Обои:</p>
        <div id="wallpaper-list" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px;">
          ${wallpapers.map((w) => `
            <div class="wallpaper-opt" data-name="${w}"
                 style="padding: 8px; border: 1px solid ${w === current ? 'var(--accent)' : 'var(--fg-dim)'};
                        border-radius: 4px; text-align: center; cursor: pointer; font-size: 11px;">
              ${w}
            </div>
          `).join('')}
        </div>

        <p style="margin-top: 16px;">🔊 Звук:</p>
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="sound-on" ${soundOn ? 'checked' : ''}>
          Звуки клавиатуры
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

        <p style="margin-top: 16px;">🎮 Геймплей:</p>
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="timer-on" ${timerOn ? 'checked' : ''}>
          Таймер задач
        </label>

        <div style="margin-top: 24px;">
          <button class="taskbar-btn" id="reset-btn" style="color: var(--error);">Сбросить прогресс</button>
        </div>
      </div>
    `;
  }

  mount(body) {
    body.querySelectorAll('.wallpaper-opt').forEach((el) => {
      el.onclick = () => {
        const name = el.dataset.name;
        storage.set('wallpaper', name);
        const desktopEl = document.getElementById('desktop');
        if (desktopEl) desktopEl.style.backgroundImage = `url('${import.meta.env.BASE_URL}assets/wallpapers/${name}.jpg')`;
        body.querySelectorAll('.wallpaper-opt').forEach((e) => {
          e.style.borderColor = e.dataset.name === name ? 'var(--accent)' : 'var(--fg-dim)';
        });
      };
    });

    const soundCb = body.querySelector('#sound-on');
    soundCb.onchange = (e) => {
      if (window.__audio) window.__audio.setEnabled(e.target.checked);
    };

    const volRange = body.querySelector('#volume-range');
    const volVal = body.querySelector('#volume-val');
    if (volRange) {
      volRange.oninput = (e) => {
        const v = parseFloat(e.target.value);
        if (window.__audio) {
          window.__audio.setVolume(v);
          window.__audio.key('normal');
        }
        volVal.textContent = Math.round(v * 100) + '%';
      };
    }

    const timerCb = body.querySelector('#timer-on');
    timerCb.onchange = (e) => {
      storage.set('timer', e.target.checked ? 'on' : 'off');
    };

    body.querySelector('#reset-btn').onclick = () => {
      if (confirm('Точно сбросить весь прогресс?')) {
        storage.clear();
        location.reload();
      }
    };
  }
}
