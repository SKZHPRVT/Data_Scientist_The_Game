import { storage } from '../../core/storage.js';
import { t, getLang, setLang } from '../../i18n/index.js';
import { progress } from '../../core/progress.js';
import {
  WALLPAPERS,
  isWallpaperUnlocked,
  applyWallpaper,
  refreshWallpapers,
} from '../../core/wallpapers.js';

export class Settings {
  constructor(desktop) {
    this.desktop = desktop;
  }

  render() {
    // Обновляем разблокированные
    refreshWallpapers();

    const current = storage.get('wallpaper', 'default');
    const volume = +storage.get('volume', 0.3) || 0.3;
    const soundOn = storage.get('sound', 'on') !== 'off';
    const currentLang = getLang();

    // Порядок: default, forest, neon, sunset, ocean, space, cyberpunk, matrix (финал)
    const wpKeys = ['default', 'forest', 'neon', 'sunset', 'ocean', 'space', 'cyberpunk', 'matrix'];

    return `
      <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.8;">
        <p><strong>⚙️ ${t('settings_title')}</strong></p>

        <p style="margin-top: 16px;">🎨 ${t('settings_wallpapers')}</p>
        <div id="wallpaper-list" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px;">
          ${wpKeys.map((id) => {
            const unlocked = isWallpaperUnlocked(id);
            const isCurrent = id === current && unlocked;
            const wp = WALLPAPERS[id];

            let preview = '#111';
            if (unlocked) {
              if (wp.css) preview = wp.css;
              else if (wp.special === 'matrix') preview = 'linear-gradient(180deg, #000 0%, #003300 100%)';
              else if (wp.special === 'space') preview = 'radial-gradient(circle at 30% 30%, #fff 0.5%, transparent 0.5%), radial-gradient(circle at 70% 60%, #fff 0.5%, transparent 0.5%), radial-gradient(circle at 50% 50%, rgba(150,100,255,0.3) 0%, transparent 50%), #000';
            }

            return `
              <div class="wallpaper-opt" data-id="${id}"
                   title="${unlocked ? '' : wp.hint || ''}"
                   style="padding: 16px 8px; border: 2px solid ${isCurrent ? 'var(--accent)' : 'var(--fg-dim)'};
                          border-radius: 6px; text-align: center; cursor: ${unlocked ? 'pointer' : 'not-allowed'};
                          font-size: 11px; background: ${preview};
                          color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.95); min-height: 44px;
                          display: flex; align-items: center; justify-content: center;
                          opacity: ${unlocked ? 1 : 0.4}; position: relative;
                          background-size: cover;">
                ${unlocked ? t('wp_' + id) : '🔒 ' + t('wp_' + id)}
              </div>
            `;
          }).join('')}
        </div>
        <p style="margin-top: 8px; font-size: 10px; color: var(--fg-dim); line-height: 1.5;">
          Зажми обоину, чтобы увидеть условие.<br>
          Матрица — за прохождение всей игры.
        </p>

        <p style="margin-top: 16px;">🔊 ${t('settings_sound')}</p>
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="sound-on" ${soundOn ? 'checked' : ''}>
          ${t('settings_sound_on')}
        </label>

        <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
          <span style="font-size: 11px; color: var(--fg-dim);">${t('settings_volume')}</span>
          <input type="range" id="volume-range" min="0" max="1" step="0.05"
                 value="${volume}" style="flex: 1; accent-color: var(--accent);">
          <span id="volume-val" style="color: var(--fg-dim); min-width: 40px; font-size: 11px;">
            ${Math.round(volume * 100)}%
          </span>
        </div>

        <p style="margin-top: 16px;">🌐 ${t('settings_lang')}</p>
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

        <div style="margin-top: 24px;">
          <button class="taskbar-btn" id="reset-btn" style="color: var(--error);">${t('settings_reset')}</button>
        </div>
      </div>
    `;
  }

  mount(body) {
    body.querySelectorAll('.wallpaper-opt').forEach((el) => {
      el.onclick = () => {
        const id = el.dataset.id;
        if (!isWallpaperUnlocked(id)) {
          if (window.__audio) window.__audio.error();
          const wp = WALLPAPERS[id];
          if (wp && wp.hint) {
            alert('🔒 ' + wp.hint);
          }
          return;
        }
        storage.set('wallpaper', id);
        applyWallpaper(id);
        body.querySelectorAll('.wallpaper-opt').forEach((e) => {
          const unlocked = isWallpaperUnlocked(e.dataset.id);
          const isCurrent = e.dataset.id === id && unlocked;
          e.style.borderColor = isCurrent ? 'var(--accent)' : 'var(--fg-dim)';
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
        setLang(lang);
        if (window.__audio) window.__audio.click('normal');
      };
    });

    body.querySelector('#reset-btn').onclick = () => {
      if (confirm(t('settings_reset_confirm'))) {
        progress.resetAll();
        localStorage.removeItem('wallpapers_unlocked_v1');
        localStorage.removeItem('perfect_chapters_v1');
        location.reload();
      }
    };
  }
}
