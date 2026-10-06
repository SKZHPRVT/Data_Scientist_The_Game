export class Settings {
  constructor(desktop) {
    this.desktop = desktop;
  }

  render() {
    const wallpapers = ['default', 'matrix', 'dark', 'neon', 'vaporwave'];
    const current = localStorage.getItem('wallpaper') || 'default';
    return `
      <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.8;">
        <p><strong>⚙️ НАСТРОЙКИ</strong></p>

        <p style="margin-top: 16px;">🎨 Обои:</p>
        <div id="wallpaper-list" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px;">
          ${wallpapers.map((w) => `
            <div class="wallpaper-opt" data-name="${w}"
                 style="padding: 8px; border: 1px solid ${w === current ? 'var(--accent)' : 'var(--fg-dim)'};
                        border-radius: 4px; text-align: center; cursor: pointer;">
              ${w}
            </div>
          `).join('')}
        </div>

        <p style="margin-top: 16px;">🔊 Звук:</p>
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="sound-on" ${localStorage.getItem('sound') !== 'off' ? 'checked' : ''}>
          Звуки клавиатуры
        </label>

        <p style="margin-top: 16px;">🎮 Геймплей:</p>
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="timer-on" ${localStorage.getItem('timer') !== 'off' ? 'checked' : ''}>
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
        localStorage.setItem('wallpaper', name);
        document.getElementById('desktop').style.backgroundImage = `url('/assets/wallpapers/${name}.jpg')`;
        body.querySelectorAll('.wallpaper-opt').forEach((e) => {
          e.style.borderColor = e.dataset.name === name ? 'var(--accent)' : 'var(--fg-dim)';
        });
      };
    });

    body.querySelector('#sound-on').onchange = (e) => {
      localStorage.setItem('sound', e.target.checked ? 'on' : 'off');
    };

    body.querySelector('#timer-on').onchange = (e) => {
      localStorage.setItem('timer', e.target.checked ? 'on' : 'off');
    };

    body.querySelector('#reset-btn').onclick = () => {
      if (confirm('Точно сбросить весь прогресс?')) {
        localStorage.clear();
        location.reload();
      }
    };
  }
}
