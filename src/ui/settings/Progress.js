export class Progress {
  constructor() {
    this.stars = +(localStorage.getItem('stars') || 0);
    this.xp = +(localStorage.getItem('xp') || 0);
    this.combo = +(localStorage.getItem('maxCombo') || 0);
  }

  render() {
    return `
      <div style="font-family: var(--font-mono); font-size: 13px; line-height: 1.8;">
        <p><strong>📊 ПРОГРЕСС</strong></p>
        <p style="margin-top: 16px;">Мир: <span class="terminal-success">JUNIOR</span></p>
        <p>Звёзды: <span class="terminal-success">${this.stars} / 162</span></p>
        <p>XP: <span class="terminal-success">${this.xp}%</span></p>
        <p>Макс. комбо: <span class="terminal-warn">×${this.combo}</span></p>
        <p style="margin-top: 16px;">🔑 До MIDDLE:</p>
        <p>✅ basics/</p>
        <p>⏳ cleaning/</p>
        <p>🔒 grouping/</p>
        <p>🔒 bosses/</p>
      </div>
    `;
  }

  mount() {}
}
