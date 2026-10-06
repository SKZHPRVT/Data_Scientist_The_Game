export class GaltonBoard {
  constructor({ width = 500, height = 500 } = {}) {
    this.width = width;
    this.height = height;
    this.canvas = null;
    this.ctx = null;
    this.balls = [];
    this.bins = [];
    this.pegs = [];
    this.animId = null;
    this.numPegRows = 10;
    this.numBins = 11;
    this.spawnInterval = 80;
    this.lastSpawn = 0;
    this.ballRadius = 4;
    this.pegRadius = 3;
    this.color = '#00ff41';
    this.bg = '#000';
    this.totalBalls = 0;
    this.maxBalls = 500;
    this.pegSpacing = 0;
  }

  render() {
    return `
      <div class="galton-wrapper">
        <canvas id="galton-canvas"></canvas>
        <div class="galton-stats">
          <div>Шаров: <span id="galton-count">0</span></div>
          <div>Бинов: ${this.numBins}</div>
        </div>
        <div class="galton-hint">
          Тапни по колышку — шары изменят траекторию
        </div>
      </div>
    `;
  }

  mount(body) {
    this.canvas = body.querySelector('#galton-canvas');
    if (!this.canvas) return;

    const wrap = body.querySelector('.galton-wrapper');
    const w = wrap.clientWidth - 20;
    const h = Math.min(w, window.innerHeight - 200);
    this.width = w;
    this.height = h;

    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';

    this.ctx = this.canvas.getContext('2d');

    this._buildBoard();
    this._bindClick();

    this.lastSpawn = performance.now();
    this._loop();
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = null;
  }

  _buildBoard() {
    this.pegs = [];
    const startY = 60;
    const endY = this.height - 100;
    const rowHeight = (endY - startY) / (this.numPegRows + 1);
    const pegSpacing = this.width / (this.numPegRows + 2);
    this.pegSpacing = pegSpacing;

    for (let row = 0; row < this.numPegRows; row++) {
      const numPegs = row + 1;
      const rowWidth = numPegs * pegSpacing;
      const startX = (this.width - rowWidth) / 2 + pegSpacing / 2;
      for (let i = 0; i < numPegs; i++) {
        this.pegs.push({
          x: startX + i * pegSpacing,
          y: startY + row * rowHeight,
          r: this.pegRadius,
          glow: 0,
        });
      }
    }

    this.bins = [];
    const binY = this.height - 60;
    const binSpacing = this.width / this.numBins;
    const binWidth = binSpacing - 4;
    for (let i = 0; i < this.numBins; i++) {
      this.bins.push({
        x: i * binSpacing + 2,
        y: binY,
        w: binWidth,
        h: 0,
        count: 0,
      });
    }
  }

  _bindClick() {
    const onClick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
      const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;

      for (const peg of this.pegs) {
        const dx = x - peg.x;
        const dy = y - peg.y;
        if (dx * dx + dy * dy < 400) {
          peg.glow = 1;
          for (const ball of this.balls) {
            const bdx = ball.x - peg.x;
            const bdy = ball.y - peg.y;
            if (bdx * bdx + bdy * bdy < 900) {
              ball.vx += (Math.random() - 0.5) * 1.5;
            }
          }
          if (window.__audio) window.__audio.key('normal');
          break;
        }
      }
    };

    this.canvas.addEventListener('click', onClick);
    this.canvas.addEventListener('touchstart', onClick, { passive: true });
  }

  _spawnBall() {
    if (this.balls.length >= this.maxBalls) return;
    const startX = this.width / 2 + (Math.random() - 0.5) * 2;
    this.balls.push({
      x: startX,
      y: 20,
      vx: (Math.random() - 0.5) * 0.3,
      vy: 1.5,
      r: this.ballRadius,
      trail: [],
      lastPeg: null,
    });
    this.totalBalls++;
    const countEl = document.getElementById('galton-count');
    if (countEl) countEl.textContent = this.totalBalls;
  }

  _updateBall(ball) {
    // Гравитация
    ball.vy += 0.12;
    ball.vy = Math.min(ball.vy, 4.5);
    // Затухание vx
    ball.vx *= 0.94;

    // Проверка столкновений с колышками
    for (const peg of this.pegs) {
      const dx = ball.x - peg.x;
      const dy = ball.y - peg.y;
      const distSq = dx * dx + dy * dy;
      const minDist = peg.r + ball.r;
      const minDistSq = minDist * minDist;

      if (distSq < minDistSq && distSq > 0 && ball.lastPeg !== peg) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;

        // Отталкивание по нормали
        const overlap = minDist - dist;
        ball.x += nx * overlap;
        ball.y += ny * overlap;

        // Отражаем скорость по нормали (с потерей энергии)
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= 1.5 * dot * nx;
        ball.vy -= 1.5 * dot * ny;

        // МАЛЕНЬКОЕ случайное отклонение влево/вправо — вот ключ к нормальному распределению
        ball.vx += (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.4);

        // Замедление по вертикали при столкновении
        ball.vy *= 0.65;

        ball.lastPeg = peg;
      }
    }

    // Если шар уже далеко от всех колышек — сбрасываем lastPeg
    if (ball.lastPeg) {
      const dx = ball.x - ball.lastPeg.x;
      const dy = ball.y - ball.lastPeg.y;
      if (dx * dx + dy * dy > 400) ball.lastPeg = null;
    }

    // Движение
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Границы по X
    if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx) * 0.5; }
    if (ball.x > this.width - ball.r) { ball.x = this.width - ball.r; ball.vx = -Math.abs(ball.vx) * 0.5; }

    // Достигла низа — попадает в бин
    if (ball.y > this.height - 60) {
      const binIndex = Math.floor(ball.x / (this.width / this.numBins));
      if (binIndex >= 0 && binIndex < this.bins.length) {
        const bin = this.bins[binIndex];
        bin.count++;
        bin.h = Math.min(bin.h + 2, this.height - 120);
      }
      return false;
    }

    return true;
  }

  _loop() {
    const now = performance.now();
    if (now - this.lastSpawn > this.spawnInterval) {
      this._spawnBall();
      this.lastSpawn = now;
    }

    this.balls = this.balls.filter((b) => this._updateBall(b));

    this.ctx.fillStyle = this.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Колышки
    for (const peg of this.pegs) {
      const brightness = peg.glow > 0 ? 1 : 0.5;
      this.ctx.fillStyle = `rgba(0, 255, 65, ${brightness})`;
      this.ctx.beginPath();
      this.ctx.arc(peg.x, peg.y, peg.r + peg.glow * 2, 0, Math.PI * 2);
      this.ctx.fill();
      peg.glow *= 0.9;
    }

    // Бины (гистограмма)
    for (const bin of this.bins) {
      const y = bin.y - bin.h;
      this.ctx.fillStyle = 'rgba(0, 255, 65, 0.4)';
      this.ctx.fillRect(bin.x, y, bin.w, bin.h);
      this.ctx.strokeStyle = 'rgba(0, 255, 65, 0.9)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(bin.x, y, bin.w, bin.h);
      if (bin.count > 0) {
        this.ctx.fillStyle = '#00ff41';
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(String(bin.count), bin.x + bin.w / 2, bin.y + 15);
      }
    }

    // Шары
    for (const ball of this.balls) {
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 6) ball.trail.shift();

      for (let i = 0; i < ball.trail.length; i++) {
        const t = ball.trail[i];
        const alpha = i / ball.trail.length;
        this.ctx.fillStyle = `rgba(0, 255, 65, ${alpha * 0.3})`;
        this.ctx.beginPath();
        this.ctx.arc(t.x, t.y, ball.r * alpha, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.fillStyle = '#00ff41';
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowColor = '#00ff41';
      this.ctx.shadowBlur = 6;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    // Заголовок
    this.ctx.fillStyle = 'rgba(0, 255, 65, 0.5)';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GALTON BOARD · NoiSe → SigNal', this.width / 2, 20);

    this.animId = requestAnimationFrame(() => this._loop());
  }
}
