import { storage } from '../../core/storage.js';
import { t, getLang, setLang } from '../../i18n/index.js';
import { progress, rewards } from '../../core/progress.js';

// ============================================
// ОБОИ
// ============================================
export const WALLPAPERS = {
  default: {
    css: 'radial-gradient(ellipse at top, #0a1a0f 0%, #000 70%)',
    unlock: null,
  },
  matrix: {
    // Падающие зелёные цифры через canvas (см. MatrixWallpaper)
    special: 'matrix',
    unlock: 'chapter_basics',
  },
  neon: {
    css: 'radial-gradient(circle at 20% 30%, rgba(255,0,255,0.45) 0%, transparent 45%), radial-gradient(circle at 80% 70%, rgba(0,255,255,0.45) 0%, transparent 45%), linear-gradient(135deg, #1a0033 0%, #330066 50%, #1a0033 100%)',
    unlock: 'chapter_cleaning',
  },
  sunset: {
    css: 'radial-gradient(circle at 50% 95%, #ffcc00 0%, #ff6600 20%, #cc0066 50%, #330066 80%, #000 100%)',
    unlock: 'chapter_merging',
  },
  ocean: {
    css: 'radial-gradient(circle at 50% 20%, rgba(0,200,255,0.4) 0%, transparent 50%), linear-gradient(180deg, #001a33 0%, #003366 50%, #000 100%)',
    unlock: 'chapter_strings',
  },
  forest: {
    css: 'radial-gradient(circle at 20% 20%, rgba(0,255,100,0.3) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(0,150,50,0.25) 0%, transparent 45%), radial-gradient(ellipse at bottom, #0a2a0a 0%, #000 80%)',
    unlock: 'chapter_datetime',
  },
  space: {
    // Много звёзд через box-shadow
    css: null,
    special: 'space',
    unlock: 'chapter_bosses',
  },
  cyberpunk: {
    css: 'linear-gradient(0deg, rgba(255,0,150,0.3) 0%, transparent 30%), linear-gradient(180deg, rgba(0,255,255,0.3) 0%, transparent 30%), radial-gradient(ellipse at center, #1a0a1a 0%, #000 100%)',
    unlock: 'chapter_pipelines',
  },
};

export function isWallpaperUnlocked(id) {
  const wp = WALLPAPERS[id];
  if (!wp) return false;
  if (!wp.unlock) return true;
  return rewards.isUnlocked(wp.unlock);
}

// ============================================
// ПРИМЕНЕНИЕ ОБОЕВ
// ============================================
let matrixAnimId = null;
let matrixCanvas = null;

export function applyWallpaper(id) {
  if (!isWallpaperUnlocked(id)) {
    id = 'default';
  }

  const wp = WALLPAPERS[id] || WALLPAPERS.default;
  const deskEl = document.getElementById('desktop');

  // Останавливаем Matrix анимацию
  if (matrixAnimId) {
    cancelAnimationFrame(matrixAnimId);
    matrixAnimId = null;
  }
  if (matrixCanvas) {
    matrixCanvas.remove();
    matrixCanvas = null;
  }

  if (!deskEl) return;

  // Обычные CSS-обои
  deskEl.style.backgroundImage = 'none';
  deskEl.style.background = '';

  if (wp.css) {
    deskEl.style.background = wp.css;
    return;
  }

  // Особые обои
  if (wp.special === 'matrix') {
    deskEl.style.background = '#000';
    startMatrixWallpaper(deskEl);
    return;
  }

  if (wp.special === 'space') {
    // Много звёзд через radial-gradient и box-shadow трюк
    deskEl.style.background = `
      radial-gradient(1.5px 1.5px at 20% 30%, #fff, transparent),
      radial-gradient(1px 1px at 60% 20%, #fff, transparent),
      radial-gradient(2px 2px at 80% 50%, #fff, transparent),
      radial-gradient(1px 1px at 40% 70%, #fff, transparent),
      radial-gradient(1.5px 1.5px at 10% 80%, rgba(255,255,255,0.9), transparent),
      radial-gradient(1px 1px at 90% 10%, #fff, transparent),
      radial-gradient(2px 2px at 70% 90%, rgba(200,200,255,0.9), transparent),
      radial-gradient(1px 1px at 30% 40%, #fff, transparent),
      radial-gradient(1.5px 1.5px at 55% 55%, rgba(150,100,255,0.8), transparent),
      radial-gradient(1px 1px at 85% 25%, #fff, transparent),
      radial-gradient(1px 1px at 15% 15%, #fff, transparent),
      radial-gradient(1.5px 1.5px at 45% 85%, #fff, transparent),
      radial-gradient(1px 1px at 25% 75%, rgba(200,200,255,0.8), transparent),
      radial-gradient(1.5px 1.5px at 75% 45%, #fff, transparent),
      radial-gradient(1px 1px at 5% 50%, #fff, transparent),
      radial-gradient(circle at 50% 50%, rgba(150,100,255,0.25) 0%, transparent 50%),
      radial-gradient(ellipse at center, #0a0a1a 0%, #000 100%)
    `;
    return;
  }
}

// ============================================
// MATRIX WALLPAPER (Canvas)
// ============================================
function startMatrixWallpaper(deskEl) {
  const canvas = document.createElement('canvas');
  canvas.id = 'matrix-canvas';
  canvas.style.cssText = `
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
    opacity: 0.35;
  `;

  // Вставляем canvas первым элементом в desktop, чтобы он был за иконками
  deskEl.insertBefore(canvas, deskEl.firstChild);

  matrixCanvas = canvas;

  const ctx = canvas.getContext('2d');

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const fontSize = 16;
  const columns = Math.floor(canvas.width / fontSize);
  const drops = Array(columns).fill(1);

  const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCXYZ';

  const draw = () => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ff41';
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      // Яркость головы колонки выше
      if (Math.random() < 0.05) {
        ctx.fillStyle = '#aaffaa';
      } else {
        ctx.fillStyle = '#00ff41';
      }

      ctx.fillText(char, x, y);

      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }

    matrixAnimId = requestAnimationFrame(draw);
  };

  draw();
}

// ============================================
// SETTINGS CLASS
// ============================================
export class Settings {
  constructor(desktop) {
    this.desktop = desktop;
  }

  render() {
    const current = storage.get('wallpaper', 'default');
    const volume = +storage.get('volume', 0.3) || 0.3;
    const soundOn = storage.get('sound', 'on') !== 'off';
    const currentLang = getLang();

    const wpKeys = ['default', 'matrix', 'neon', 'sunset', 'ocean', 'forest', 'space', 'cyberpunk'];

    return `
      <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.8;">
        <p><strong>⚙️ ${t('settings_title')}</strong></p>

        <p style="margin-top: 16px;">🎨 ${t('settings_wallpapers')}</p>
        <div id="wallpaper-list" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px;">
          ${wpKeys.map((id) => {
            const unlocked = isWallpaperUnlocked(id);
            const isCurrent = id === current && unlocked;
            const wp = WALLPAPERS[id];

            // Превью: для special — упрощённый
            let preview = '#111';
            if (unlocked) {
              if (wp.css) preview = wp.css;
              else if (wp.special === 'matrix') preview = 'linear-gradient(180deg, #000 0%, #003300 100%)';
              else if (wp.special === 'space') preview = 'radial-gradient(circle at 30% 30%, #fff 0.5%, transparent 0.5%), radial-gradient(circle at 70% 60%, #fff 0.5%, transparent 0.5%), radial-gradient(circle at 50% 50%, rgba(150,100,255,0.3) 0%, transparent 50%), #000';
            }

            return `
              <div class="wallpaper-opt" data-id="${id}"
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
        <p style="margin-top: 8px; font-size: 10px; color: var(--fg-dim);">
          Обои открываются за идеальное прохождение папок (все 4⭐).
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
          return;
        }
        storage.set('wallpaper', id);
        applyWallpaper(id);
        // Обновляем подсветку
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
        location.reload();
      }
    };
  }
}
