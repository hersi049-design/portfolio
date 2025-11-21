// Simple "Catch the Falling Stars" game.
// Place at /Users/college1/Desktop/misproject1/js/star-game.js
(() => {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const startBtn = document.getElementById('startBtnStar');
  const scoreEl = document.getElementById('scoreStar');
  const goalEl = document.getElementById('goalStar');
  const missesEl = document.getElementById('missesStar');
  const messageEl = document.getElementById('messageStar');
  const music = document.getElementById('bgMusicStar');

  const W = canvas.width;
  const H = canvas.height;
  const groundY = H - 60;

  // Gameplay config
  const GOAL = 30;          // number of stars to catch to win (beatable)
  const LIVES = 6;          // allowed misses before game over
  const SPAWN_BASE = 900;   // ms between spawns (will randomize slightly)
  const STAR_MIN_R = 6;
  const STAR_MAX_R = 14;
  const GRAVITY = 0.02;

  // Player basket
  const basket = {
    x: W / 2,
    y: groundY - 6,
    w: 120,
    h: 20,
    speed: 6
  };

  let state = {
    running: false,
    score: 0,
    misses: 0,
    stars: [],
    lastSpawn: 0,
    spawnInterval: SPAWN_BASE,
    lastTime: 0,
    dropSpeedBase: 0.6, // initial vertical speed
    dropSpeedIncrease: 0.00025 // increases slowly for mild difficulty ramp
  };

  function reset() {
    state.running = true;
    state.score = 0;
    state.misses = 0;
    state.stars = [];
    state.lastSpawn = 0;
    state.spawnInterval = SPAWN_BASE;
    state.lastTime = performance.now();
    state.dropSpeedBase = 0.6;
    messageEl.textContent = '';
    updateHUD();
    // attempt to play music on user interaction
    try { music.currentTime = 0; music.play(); } catch (e) {}
    requestAnimationFrame(loop);
  }

  function endGame(win) {
    state.running = false;
    if (win) {
      messageEl.textContent = 'You Win! Great catching.';
    } else {
      messageEl.textContent = 'Game Over — too many misses.';
    }
    try { music.pause(); } catch (e) {}
  }

  function spawnStar() {
    const r = STAR_MIN_R + Math.random() * (STAR_MAX_R - STAR_MIN_R);
    const x = r + Math.random() * (W - 2 * r);
    const y = -20 - Math.random() * 60;
    const vy = state.dropSpeedBase + Math.random() * 0.6;
    const s = { x, y, r, vy };
    state.stars.push(s);
  }

  function updateHUD() {
    scoreEl.textContent = state.score;
    goalEl.textContent = GOAL;
    missesEl.textContent = state.misses;
  }

  function update(dt) {
    if (!state.running) return;

    // Slightly increase drop speed over time
    state.dropSpeedBase += state.dropSpeedIncrease * dt;

    // spawning
    state.lastSpawn += dt;
    if (state.lastSpawn >= state.spawnInterval) {
      state.lastSpawn = 0;
      spawnStar();
      // small randomization and gentle increase difficulty by reducing interval slightly
      state.spawnInterval = SPAWN_BASE - Math.random() * 300 - Math.min(350, state.score * 8);
    }

    // update stars position
    for (let i = state.stars.length - 1; i >= 0; i--) {
      const s = state.stars[i];
      // simple gravity
      s.vy += GRAVITY * (dt / 16);
      s.y += s.vy * (dt / 16) * 6; // scale to pixels/frame
      // if star reaches ground area -> miss
      if (s.y - s.r > groundY) {
        state.stars.splice(i, 1);
        state.misses += 1;
        updateHUD();
        if (state.misses >= LIVES) {
          endGame(false);
          return;
        }
      } else {
        // catch check: if star intersects basket rectangle
        const left = basket.x - basket.w / 2;
        const right = basket.x + basket.w / 2;
        const top = basket.y - basket.h;
        if (s.y + s.r >= top && s.x >= left && s.x <= right) {
          // caught
          state.stars.splice(i, 1);
          state.score += 1;
          updateHUD();
          // win condition
          if (state.score >= GOAL) {
            endGame(true);
            return;
          }
        }
      }
    }
  }

  function drawStar(s) {
    // glowing yellow star as circle with shadow
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = '#fff6a8';
    ctx.shadowColor = 'rgba(255,230,120,0.9)';
    ctx.shadowBlur = 18;
    ctx.globalCompositeOperation = 'lighter';
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    // core brighten
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(s.x, s.y, Math.max(1, s.r * 0.6), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    // background gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#001d3d');
    g.addColorStop(1, '#002a4d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // subtle stars background
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 47) % W;
      const sy = (i * 89) % (H - 120);
      ctx.fillRect(sx, sy, 2, 2);
    }

    // draw falling stars
    for (const s of state.stars) drawStar(s);

    // draw basket
    const bx = basket.x - basket.w / 2;
    const by = basket.y - basket.h;
    // basket shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(bx - 6, by + 8, basket.w + 12, 10);
    // basket body
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(bx, by, basket.w, basket.h);
    // basket rim
    ctx.fillStyle = '#b06b00';
    ctx.fillRect(bx, by - 8, basket.w, 8);

    // ground line
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, groundY, W, 2);

    // HUD drawn on canvas as well
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(12, 12, 220, 36);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${state.score}   Goal: ${GOAL}   Misses: ${state.misses}/${LIVES}`, 22, 36);

    // overlays
    if (!state.running && (state.score >= GOAL || state.misses >= LIVES)) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      const txt = state.score >= GOAL ? 'You Win!' : 'Game Over';
      ctx.fillText(txt, W / 2 - 80, H / 2 - 10);
      ctx.font = '18px sans-serif';
      ctx.fillText('Press Start to play again', W / 2 - 110, H / 2 + 20);
    }
  }

  function loop(now) {
    const dt = Math.min(40, now - (state.lastTime || now));
    state.lastTime = now;
    update(dt);
    draw();
    if (state.running) requestAnimationFrame(loop);
  }

  // controls
  window.addEventListener('keydown', (e) => {
    if (!state.running) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      basket.x = Math.max(basket.w / 2, basket.x - basket.speed * 6);
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      basket.x = Math.min(W - basket.w / 2, basket.x + basket.speed * 6);
    }
  });

  // mouse move
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    basket.x = Math.max(basket.w / 2, Math.min(W - basket.w / 2, mx));
  });

  // touch move
  canvas.addEventListener('touchmove', (ev) => {
    if (!ev.touches || ev.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const mx = ev.touches[0].clientX - rect.left;
    basket.x = Math.max(basket.w / 2, Math.min(W - basket.w / 2, mx));
    ev.preventDefault();
  }, { passive: false });

  // Start button
  startBtn.addEventListener('click', () => {
    reset();
  });

  // initial draw
  draw();
})();