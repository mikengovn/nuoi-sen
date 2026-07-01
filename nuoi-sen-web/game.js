/* =========================================================================
   Nuôi Sen (Grow Lotus) — VietMoney mini-game
   HTML5 Canvas re-implementation of the original pygame `main.py`.

   Faithful to the original:
     • Logical resolution 736 x 1318, same element positions & sizes
     • Curtain intro (2s), 9 lotus stages, "Nuôi Sen" button, progress bar,
       gift box, looping music, "yay" SFX with music ducking, 7 hop animation
   Web-friendly additions:
     • Petals + heart burst are drawn procedurally (no heavy GIF frames)
     • Responsive scaling, touch support, mute + replay controls
   ========================================================================= */
(() => {
  "use strict";

  // ---- Logical design space (matches the pygame window) -------------------
  const W = 736, H = 1318;

  // Exact placements from main.py
  const MASCOT = { x: 177, y: 587.66, size: 382 };
  const LOGO   = { x: (W - 120) / 2, y: 20, w: 120, h: 138 };     // (308, 20)
  const BAR    = { x: 168, y: 964.83, w: 400, h: 21 };
  const GIFT   = { w: 129, h: 108 };
  GIFT.x = BAR.x + BAR.w - GIFT.w / 2;                            // 503.5
  GIFT.y = BAR.y - 70;                                            // 894.83
  const BTN    = { x: 176.5, y: 1000, w: 383, h: 113 };
  const CURT   = { leftFrom: -957, leftTo: -1350, rightFrom: 343, rightTo: 736, y: -18, w: 1350, h: 1354 };

  const MAX_STAGE   = 8;      // stage index 0..8  → 9 lotus images
  const JUMP_HEIGHT = 20;
  const INTRO_MS    = 2000;   // 60 frames @ 30fps
  const ANIM_MS     = 2400;   // 7 gentle hops on level-up
  const HOPS        = 7;

  const MASCOT_CX = MASCOT.x + MASCOT.size / 2;   // 368
  const MASCOT_CY = MASCOT.y + MASCOT.size / 2;   // 778.66

  // ---- DOM ----------------------------------------------------------------
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const overlay     = document.getElementById("overlay");
  const loadingFill = document.getElementById("loading-fill");
  const loadingText = document.getElementById("loading-text");
  const startBtn    = document.getElementById("start-btn");
  const hint        = document.getElementById("hint");
  const btnSound    = document.getElementById("btn-sound");
  const btnReplay   = document.getElementById("btn-replay");

  // ---- Asset manifest -----------------------------------------------------
  // If a single-file build injected window.__ASSETS__ (name -> data URI),
  // use those; otherwise fall back to the assets/ folder. One codebase, two builds.
  const A = (typeof window !== "undefined" && window.__ASSETS__) || {};
  const asset = (key, path) => A[key] || path;

  const IMG_SRC = {
    background: asset("background", "assets/background1.jpg"),
    logo:      asset("logo",   "assets/logo.png"),
    button:    asset("button", "assets/button_image.png"),
    gift:      asset("gift",   "assets/gift_box.png"),
    barBg:     asset("barBg",  "assets/loading_bar_background.png"),
    curtain:   asset("curtain","assets/curtain.png"),
  };
  for (let i = 1; i <= 9; i++) IMG_SRC["lotus" + i] = asset("lotus" + i, `assets/lotus${i}.png`);
  for (let i = 0; i <= 8; i++) IMG_SRC["fill" + i]  = asset("fill" + i,  `assets/loading_bar_fill_${i}.png`);

  const IMG = {};      // name -> HTMLImageElement
  let music = null, yaySrc = null;

  // ---- Game state ---------------------------------------------------------
  let phase = "loading";        // loading → ready → intro → playing
  let stage = 0;                // 0..8
  let progress = 0;             // fill index 0..8
  let completed = false;

  let introT = 0;               // ms elapsed in intro
  let animating = false;        // hop animation active
  let animT = 0;                // ms elapsed in hop animation

  let petals = [];
  let hearts = [];
  let sparkles = [];

  let btnScale = 1;             // press feedback
  let muted = false;
  let lastTs = 0;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ======================================================================
  //  ASSET LOADING
  // ======================================================================
  function loadImage(src) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error("Failed to load " + src));
      im.src = src;
    });
  }

  async function loadAll() {
    const entries = Object.entries(IMG_SRC);
    let done = 0;
    const total = entries.length + 1; // +1 for audio setup
    const bump = () => {
      done++;
      const pct = Math.round((done / total) * 100);
      loadingFill.style.width = pct + "%";
      loadingText.textContent = `Đang tải… ${pct}%`;
    };

    await Promise.all(entries.map(async ([name, src]) => {
      try { IMG[name] = await loadImage(src); }
      catch (e) { console.warn(e.message); IMG[name] = null; }
      bump();
    }));

    // Audio elements (HTMLAudio works from file:// and satisfies mobile gesture rules)
    music = new Audio(asset("music", "assets/music.mp3"));
    music.loop = true;
    music.volume = 0.5;
    music.preload = "auto";
    yaySrc = new Audio(asset("yay", "assets/yay.mp3"));
    yaySrc.preload = "auto";
    bump();

    // Ready to start
    loadingText.textContent = "Sẵn sàng!";
    startBtn.classList.remove("hidden");
    hint.classList.remove("hidden");
    phase = "ready";
  }

  // ======================================================================
  //  CANVAS SIZING (crisp on retina, scaled by CSS to fit the frame)
  // ======================================================================
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // draw in logical 736x1318 space
    ctx.imageSmoothingQuality = "high";
  }
  window.addEventListener("resize", resize);

  // ======================================================================
  //  AUDIO
  // ======================================================================
  function startMusic() {
    if (!music) return;
    music.muted = muted;
    music.play().catch(() => {});
  }
  let restoreTimer = null;
  function playYay() {
    if (muted || !yaySrc) return;
    if (music) music.volume = 0.12;                 // duck background music
    const s = yaySrc.cloneNode();
    s.play().catch(() => {});
    const restore = () => { if (music && !muted) music.volume = 0.5; };
    s.addEventListener("ended", restore);
    clearTimeout(restoreTimer);
    restoreTimer = setTimeout(restore, 1400);       // fallback
  }
  function toggleMute() {
    muted = !muted;
    if (music) music.muted = muted;
    btnSound.textContent = muted ? "🔇" : "🔊";
  }

  // ======================================================================
  //  PETALS  (continuous, top-most layer — replaces petal.gif)
  // ======================================================================
  const PETAL_COLORS = ["#ff8fc0", "#ff5fa2", "#ffb3d1", "#ffd6e8", "#ff77b0", "#f45d9e"];

  function makePetal(initial) {
    const size = rand(9, 19);
    return {
      x: rand(-20, W + 20),
      y: initial ? rand(-60, H) : rand(-90, -10),
      size,
      vy: rand(48, 105) * (0.7 + size / 26),
      wind: rand(-14, 14),
      sway: rand(16, 44),
      swaySpeed: rand(0.6, 1.5),
      swayPhase: rand(0, Math.PI * 2),
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-1.3, 1.3),
      color: pick(PETAL_COLORS),
      alpha: rand(0.72, 0.95),
    };
  }
  function initPetals() {
    const n = 30;
    petals = Array.from({ length: n }, () => makePetal(true));
  }
  function updatePetals(dt) {
    for (const p of petals) {
      p.swayPhase += p.swaySpeed * dt;
      p.y += p.vy * dt;
      p.x += p.wind * dt;
      p.rot += p.rotSpeed * dt;
      if (p.y > H + 40) Object.assign(p, makePetal(false));
    }
  }
  function petalPath(s) {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.85, -s * 0.4, s * 0.6, s * 0.75, 0, s);
    ctx.bezierCurveTo(-s * 0.6, s * 0.75, -s * 0.85, -s * 0.4, 0, -s);
    ctx.closePath();
  }
  function drawPetals() {
    for (const p of petals) {
      const dx = p.x + Math.sin(p.swayPhase) * p.sway;
      ctx.save();
      ctx.translate(dx, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      petalPath(p.size);
      ctx.fill();
      // soft inner highlight
      ctx.globalAlpha = p.alpha * 0.35;
      ctx.fillStyle = "#ffffff";
      petalPath(p.size * 0.5);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // ======================================================================
  //  HEART BURST  (on each level-up — replaces heart.gif)
  // ======================================================================
  const HEART_COLORS = ["#ff9ecb", "#ffc1dd", "#c9b6ff", "#ffd8a8", "#ffe3ef", "#b7c6ff", "#ffb0a0"];
  const SPARK_COLORS = ["#ffffff", "#fff3fb", "#ffe9c9"];

  function burst(cx, cy, count) {
    for (let i = 0; i < count; i++) {
      const ang = rand(0, Math.PI * 2), spd = rand(90, 250);
      hearts.push({
        x: cx + rand(-12, 12), y: cy + rand(-12, 12),
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - rand(40, 110),   // bias upward
        size: rand(15, 34),
        rot: rand(-0.4, 0.4), rotSpeed: rand(-1.4, 1.4),
        life: 0, ttl: rand(1.1, 1.9),
        color: pick(HEART_COLORS),
      });
    }
    for (let i = 0; i < count * 0.7; i++) {
      sparkles.push({
        x: cx + rand(-90, 90), y: cy + rand(-90, 90),
        size: rand(6, 14),
        life: 0, ttl: rand(0.6, 1.2),
        rot: rand(0, Math.PI),
        color: pick(SPARK_COLORS),
      });
    }
  }
  function updateBurst(dt) {
    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i];
      h.life += dt;
      if (h.life >= h.ttl) { hearts.splice(i, 1); continue; }
      h.vy += 40 * dt;                 // gentle gravity → arc
      h.vx *= (1 - 1.1 * dt);
      h.vy *= (1 - 0.35 * dt);
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.rot += h.rotSpeed * dt;
    }
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i];
      s.life += dt;
      if (s.life >= s.ttl) sparkles.splice(i, 1);
    }
  }
  function heartPath(w) {
    const top = w * 0.3;
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.bezierCurveTo(0, 0, -w / 2, 0, -w / 2, top);
    ctx.bezierCurveTo(-w / 2, w * 0.6, 0, w * 0.75, 0, w);
    ctx.bezierCurveTo(0, w * 0.75, w / 2, w * 0.6, w / 2, top);
    ctx.bezierCurveTo(w / 2, 0, 0, 0, 0, top);
    ctx.closePath();
  }
  function sparkPath(s) {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(0, 0, s, 0);
    ctx.quadraticCurveTo(0, 0, 0, s);
    ctx.quadraticCurveTo(0, 0, -s, 0);
    ctx.quadraticCurveTo(0, 0, 0, -s);
    ctx.closePath();
  }
  function drawBurst() {
    ctx.save();
    ctx.shadowColor = "rgba(255,150,200,.7)";
    ctx.shadowBlur = 12;
    for (const h of hearts) {
      const t = h.life / h.ttl;
      const pop = h.life < 0.16 ? (h.life / 0.16) : 1;      // pop-in
      const sc = (0.4 + 0.6 * pop);
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rot);
      ctx.scale(sc, sc);
      ctx.translate(0, -h.size * 0.5);
      ctx.globalAlpha = clamp(1 - t * t, 0, 1);
      ctx.fillStyle = h.color;
      heartPath(h.size);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    for (const s of sparkles) {
      const t = s.life / s.ttl;
      const a = Math.sin(t * Math.PI);   // fade in & out
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.globalAlpha = clamp(a, 0, 1);
      ctx.fillStyle = s.color;
      sparkPath(s.size);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // ======================================================================
  //  GAME ACTIONS
  // ======================================================================
  function fertilize() {                 // = clicking the "Nuôi Sen" button
    if (phase !== "playing" || animating || completed) return;
    if (stage >= MAX_STAGE) return;

    stage++;
    progress++;
    animating = true;
    animT = 0;
    playYay();
    burst(MASCOT_CX, MASCOT_CY, 26);

    if (stage >= MAX_STAGE) {
      completed = true;
      // extra celebration on full growth
      setTimeout(() => burst(MASCOT_CX, MASCOT_CY - 40, 30), 350);
      hint.classList.add("hidden");
    }
  }

  function restart() {
    stage = 0;
    progress = 0;
    completed = false;
    animating = false;
    animT = 0;
    hearts = [];
    sparkles = [];
    phase = "intro";
    introT = 0;
  }

  function beginGame() {
    overlay.classList.add("hide");
    setTimeout(() => overlay.classList.add("hidden"), 500);
    btnSound.classList.remove("hidden");
    btnReplay.classList.remove("hidden");
    startMusic();
    phase = "intro";
    introT = 0;
  }

  // ======================================================================
  //  UPDATE
  // ======================================================================
  function update(dtMs) {
    const dt = dtMs / 1000;
    updatePetals(dt);
    updateBurst(dt);

    // button press feedback easing (springs back to 1 after a press)
    btnScale += (1 - btnScale) * clamp(dt * 12, 0, 1);

    if (phase === "intro") {
      introT += dtMs;
      if (introT >= INTRO_MS) { phase = "playing"; }
    } else if (phase === "playing" && animating) {
      animT += dtMs;
      if (animT >= ANIM_MS) animating = false;
    }
  }

  // ======================================================================
  //  RENDER
  // ======================================================================
  function drawImg(img, x, y, w, h) {
    if (!img) return;
    if (w == null) ctx.drawImage(img, x, y);
    else ctx.drawImage(img, x, y, w, h);
  }

  function mascotYOffset() {
    if (!animating) return 0;
    const t = clamp(animT / ANIM_MS, 0, 1);
    const phasePos = t * HOPS;                 // 0..7
    const hopProg = phasePos - Math.floor(phasePos);
    // taper the hop height slightly over time so it "settles"
    const damp = 1 - 0.35 * t;
    return -JUMP_HEIGHT * damp * Math.sin(hopProg * Math.PI);
  }

  function render() {
    // Background (scaled to fill)
    if (IMG.background) ctx.drawImage(IMG.background, 0, 0, W, H);
    else { ctx.fillStyle = "#bfe3ff"; ctx.fillRect(0, 0, W, H); }

    // Logo (always, top-center)
    drawImg(IMG.logo, LOGO.x, LOGO.y, LOGO.w, LOGO.h);

    if (phase === "intro") {
      // Curtains slide apart
      const p = clamp(introT / INTRO_MS, 0, 1);
      const lx = CURT.leftFrom + (CURT.leftTo - CURT.leftFrom) * p;
      const rx = CURT.rightFrom + (CURT.rightTo - CURT.rightFrom) * p;
      drawImg(IMG.curtain, lx, CURT.y, CURT.w, CURT.h);
      drawImg(IMG.curtain, rx, CURT.y, CURT.w, CURT.h);
    } else if (phase === "playing") {
      // Mascot (current stage, forced to 382x382 like the original)
      const yoff = mascotYOffset();
      drawImg(IMG["lotus" + (stage + 1)], MASCOT.x, MASCOT.y + yoff, MASCOT.size, MASCOT.size);

      // Heart burst over the mascot
      drawBurst();

      // Progress bar background + fill
      drawImg(IMG.barBg, BAR.x, BAR.y);
      drawImg(IMG["fill" + progress], BAR.x, BAR.y);

      // Gift box (gentle bob; stronger when completed)
      const bob = completed
        ? Math.sin(performance.now() / 180) * 6 - 2
        : Math.sin(performance.now() / 420) * 3;
      if (completed) {
        // glow ring behind gift
        ctx.save();
        const gcx = GIFT.x + GIFT.w / 2, gcy = GIFT.y + GIFT.h / 2 + bob;
        const g = ctx.createRadialGradient(gcx, gcy, 4, gcx, gcy, 92);
        g.addColorStop(0, "rgba(255,220,120,.55)");
        g.addColorStop(1, "rgba(255,220,120,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(gcx, gcy, 92, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      drawImg(IMG.gift, GIFT.x, GIFT.y + bob, GIFT.w, GIFT.h);

      // "Nuôi Sen" button (dim + no pulse when completed)
      ctx.save();
      const bcx = BTN.x + BTN.w / 2, bcy = BTN.y + BTN.h / 2;
      let s = btnScale;
      if (!animating && !completed) s *= 1 + Math.sin(performance.now() / 480) * 0.02; // invite tap
      ctx.translate(bcx, bcy);
      ctx.scale(s, s);
      ctx.translate(-bcx, -bcy);
      if (completed || animating) ctx.globalAlpha = 0.55;
      drawImg(IMG.button, BTN.x, BTN.y, BTN.w, BTN.h);
      ctx.restore();

      // Completed banner
      if (completed) {
        ctx.save();
        ctx.globalAlpha = 0.9 + Math.sin(performance.now() / 300) * 0.1;
        ctx.fillStyle = "#e23a5b";
        ctx.font = "800 40px -apple-system, Segoe UI, Roboto, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "rgba(255,255,255,.9)";
        ctx.lineWidth = 8;
        ctx.lineJoin = "round";
        const msg = "Sen đã nở! 🎉";
        ctx.strokeText(msg, W / 2, 250);
        ctx.fillText(msg, W / 2, 250);
        ctx.font = "600 22px -apple-system, Segoe UI, Roboto, sans-serif";
        ctx.fillStyle = "#7a3050";
        ctx.strokeText("Nhấn ↻ để nuôi lại", W / 2, 300);
        ctx.fillStyle = "#e23a5b";
        ctx.fillText("Nhấn ↻ để nuôi lại", W / 2, 300);
        ctx.restore();
      }
    }

    // Petals — always the top-most layer (matches original)
    drawPetals();
  }

  // ======================================================================
  //  MAIN LOOP
  // ======================================================================
  function frame(ts) {
    if (!lastTs) lastTs = ts;
    let dt = ts - lastTs;
    lastTs = ts;
    if (dt > 60) dt = 60;                 // clamp after tab switch
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  // ======================================================================
  //  INPUT
  // ======================================================================
  function canvasPoint(evt) {
    const r = canvas.getBoundingClientRect();
    const cx = (evt.touches ? evt.touches[0].clientX : evt.clientX);
    const cy = (evt.touches ? evt.touches[0].clientY : evt.clientY);
    return {
      x: (cx - r.left) / r.width * W,
      y: (cy - r.top) / r.height * H,
    };
  }
  function insideBtn(pt) {
    return pt.x >= BTN.x && pt.x <= BTN.x + BTN.w &&
           pt.y >= BTN.y && pt.y <= BTN.y + BTN.h;
  }

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (phase !== "playing") return;
    const pt = canvasPoint(e);
    if (insideBtn(pt) && !animating && !completed) {
      btnScale = 0.9;                     // press feedback
      fertilize();
    }
  }, { passive: false });

  // Start
  const doStart = (e) => { if (e) e.preventDefault(); if (phase === "ready") beginGame(); };
  startBtn.addEventListener("click", doStart);
  overlay.addEventListener("pointerdown", (e) => {
    // tapping anywhere on the overlay (once loaded) also starts
    if (phase === "ready") doStart(e);
  });

  btnSound.addEventListener("click", (e) => { e.stopPropagation(); toggleMute(); });
  btnReplay.addEventListener("click", (e) => { e.stopPropagation(); restart(); });

  // iOS: resume audio if the tab regains focus
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && music && !muted && phase !== "ready" && phase !== "loading") {
      music.play().catch(() => {});
    }
  });

  // ======================================================================
  //  BOOT
  // ======================================================================
  resize();
  initPetals();
  requestAnimationFrame(frame);
  loadAll();
})();
