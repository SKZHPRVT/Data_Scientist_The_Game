import { storage } from '../../core/storage.js';
import { rewards } from '../../core/progress.js';
import { getLang } from '../../i18n/index.js';

export function showRewardPopup(reward, onApplyWallpaper) {
  const lang = getLang();
  const isEn = lang === 'en';

  const popup = document.createElement('div');
  popup.className = 'reward-popup';
  popup.innerHTML = `
    <div class="reward-backdrop"></div>
    <div class="reward-panel">
      <div class="reward-crown">🏆</div>
      <div class="reward-title">${isEn ? 'PERFECT CHAPTER!' : 'ИДЕАЛЬНАЯ ПАПКА!'}</div>
      <div class="reward-text">
        ${isEn ? reward.textEn : reward.text}
      </div>
      <div class="reward-wallpaper-preview" style="background: var(--wp-preview-${reward.wallpaper}, #000);">
        <span>${isEn ? reward.wallpaperNameEn : reward.wallpaperName}</span>
      </div>
      <button class="reward-btn" id="reward-accept">
        ${isEn ? 'Apply wallpaper' : 'Применить обои'}
      </button>
      <button class="reward-btn reward-btn-secondary" id="reward-later">
        ${isEn ? 'Later' : 'Позже'}
      </button>
    </div>
  `;
  document.body.appendChild(popup);

  // Применяем обои
  const apply = () => {
    storage.set('wallpaper', reward.wallpaper);
    if (onApplyWallpaper) onApplyWallpaper(reward.wallpaper);
    close();
  };

  const close = () => {
    popup.remove();
  };

  popup.querySelector('#reward-accept').onclick = apply;
  popup.querySelector('#reward-later').onclick = close;

  if (window.__audio) window.__audio.success();
}
