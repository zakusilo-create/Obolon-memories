const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = 1024;
const HEIGHT = 576;

const splashImg = new Image();
splashImg.src = "assets/art/splash_screen.jpeg";

let state = "fade_in"; // fade_in -> ready -> fade_out -> vignette
let fadeAlpha = 1.0;
let titleAlpha = 0.0;
let elapsed = 0;
let lastTime = performance.now();
let messageText = "";
let messageTimer = 0;

// Hotspots positioned for 1024x576
const hotspots = [
  {
    name: "Вход в West Line",
    x: 135,
    y: 255,
    w: 165,
    h: 175,
    text: "Автоматические двери тихо гудят. Тёплый воздух пахнет свежим хлебом и летней пылью."
  },
  {
    name: "Фонарь",
    x: 485,
    y: 250,
    w: 72,
    h: 215,
    text: "Три тёплых шара светятся на фоне оболонского заката."
  },
  {
    name: "Вывеска West Line",
    x: 545,
    y: 95,
    w: 165,
    h: 160,
    text: "WEST LINE. Здесь хоть раз встречался каждый на районе."
  }
];

let mouse = { x: -1, y: -1 };
let hoveredHotspot = null;

// --- Calm Ambient Electronic Soundtrack (Web Audio API) ---
const music = {
  ctx: null,
  master: null,
  delay: null,
  started: false,
  muted: false,
  stepTimer: null,
  step: 0,
  // Warm nostalgic progression: Fmaj7 -> Dm9 -> Bbmaj7 -> C6
  chords: [
    [174.61, 220.0, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
    [146.83, 220.0, 261.63, 329.63], // Dm9   (D3, A3, C4, E4)
    [116.54, 174.61, 220.0, 293.66], // Bbmaj7 (Bb2, F3, A3, D4)
    [130.81, 196.0, 220.0, 329.63]   // C6    (C3, G3, A3, E4)
  ],
  melody: [
    523.25, 0, 659.25, 587.33,
    440.0, 0, 523.25, 0,
    587.33, 523.25, 440.0, 0,
    392.0, 0, 440.0, 523.25
  ],

  start() {
    if (this.started) {
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.started = true;

    this.master = this.ctx.createGain();
    this.master.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.master.gain.exponentialRampToValueAtTime(0.28, this.ctx.currentTime + 2.2);
    this.master.connect(this.ctx.destination);

    // Gentle tape-style echo bus
    this.delay = this.ctx.createDelay(1.0);
    this.delay.delayTime.value = 0.42;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.34;
    const delayFilter = this.ctx.createBiquadFilter();
    delayFilter.type = "lowpass";
    delayFilter.frequency.value = 1400;

    this.delay.connect(delayFilter);
    delayFilter.connect(feedback);
    feedback.connect(this.delay);
    delayFilter.connect(this.master);

    this.playTick();
    this.stepTimer = setInterval(() => this.playTick(), 1000);
  },

  playPad(freqs, duration) {
    const now = this.ctx.currentTime;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.linearRampToValueAtTime(920, now + duration * 0.5);
    filter.frequency.linearRampToValueAtTime(480, now + duration);

    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.0001, now);
    padGain.gain.linearRampToValueAtTime(0.14, now + 1.1);
    padGain.gain.linearRampToValueAtTime(0.11, now + duration - 0.9);
    padGain.gain.linearRampToValueAtTime(0.0001, now + duration);

    filter.connect(padGain);
    padGain.connect(this.master);

    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = idx === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(f, now);
      // Subtle warm analog detune
      osc.detune.setValueAtTime((idx % 2 === 0 ? 1 : -1) * 4.5, now);
      osc.connect(filter);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    });
  },

  playPluck(freq) {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    const harmonic = this.ctx.createOscillator();
    harmonic.type = "triangle";
    harmonic.frequency.setValueAtTime(freq * 2, now);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.09, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    const hg = this.ctx.createGain();
    hg.gain.setValueAtTime(0.02, now);
    hg.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc.connect(g);
    harmonic.connect(hg);
    hg.connect(g);

    g.connect(this.master);
    g.connect(this.delay);

    osc.start(now);
    harmonic.start(now);
    osc.stop(now + 1.5);
    harmonic.stop(now + 0.6);
  },

  playTick() {
    if (!this.ctx || this.ctx.state !== "running") return;
    const barStep = this.step % 4;
    const chordIdx = Math.floor(this.step / 4) % this.chords.length;

    if (barStep === 0) {
      this.playPad(this.chords[chordIdx], 4.2);
    }

    const note = this.melody[this.step % this.melody.length];
    if (note > 0) {
      this.playPluck(note);
    }

    this.step++;
  },

  toggleMute() {
    if (!this.started) {
      this.start();
      return;
    }
    this.muted = !this.muted;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(this.muted ? 0.0001 : 0.28, now, 0.15);
  }
};

const muteBtn = { x: WIDTH - 94, y: 14, w: 80, h: 28 };

function isInRect(pos, r) {
  return pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h;
}

function drawCoverImage(img) {
  if (!img.complete || img.naturalWidth === 0) return;
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = WIDTH / HEIGHT;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

  if (imgRatio > canvasRatio) {
    sw = img.naturalHeight * canvasRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / canvasRatio;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, WIDTH, HEIGHT);
}

function drawOutlinedText(text, x, y, font, fill, outline, outlineWidth = 4, align = "center") {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";

  ctx.lineJoin = "round";
  ctx.lineWidth = outlineWidth;
  ctx.strokeStyle = outline;
  ctx.strokeText(text, Math.round(x), Math.round(y));

  ctx.fillStyle = "rgba(20, 12, 30, 0.85)";
  ctx.fillText(text, Math.round(x + 2), Math.round(y + 4));

  ctx.fillStyle = fill;
  ctx.fillText(text, Math.round(x), Math.round(y));
}

function wrapText(text, maxWidth, font = "20px Georgia, serif") {
  ctx.font = font;
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function update(dt) {
  elapsed += dt;

  if (state === "fade_in") {
    fadeAlpha = Math.max(0, fadeAlpha - dt / 1.2);
    if (fadeAlpha === 0) {
      titleAlpha = Math.min(1, titleAlpha + dt / 0.8);
      if (titleAlpha === 1) {
        state = "ready";
      }
    }
  } else if (state === "fade_out") {
    fadeAlpha = Math.min(1, fadeAlpha + dt / 0.7);
    if (fadeAlpha === 1) {
      state = "vignette";
      messageText = "Оболонь, конец лета. Нажимайте вокруг, чтобы вспомнить.";
      messageTimer = 4.0;
    }
  } else if (state === "vignette") {
    if (fadeAlpha > 0) {
      fadeAlpha = Math.max(0, fadeAlpha - dt / 0.9);
    }
    if (messageTimer > 0) {
      messageTimer = Math.max(0, messageTimer - dt);
    }
  }
}

function render() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawCoverImage(splashImg);

  if (state === "fade_in" || state === "ready" || state === "fade_out") {
    // Subtle top gradient scrim for title readability
    const grad = ctx.createLinearGradient(0, 0, 0, 130);
    grad.addColorStop(0, `rgba(13, 10, 23, ${0.65 * titleAlpha})`);
    grad.addColorStop(1, "rgba(13, 10, 23, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, 130);

    if (titleAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = titleAlpha;
      drawOutlinedText(
        "Воспоминания об Оболони",
        WIDTH / 2,
        62,
        "bold 48px Georgia, serif",
        "#fff0c8",
        "#1a1224",
        7
      );
      ctx.restore();
    }

    if (state === "ready") {
      const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(elapsed * 3.2));
      ctx.save();
      ctx.globalAlpha = pulse;
      drawOutlinedText(
        "Нажмите, чтобы продолжить",
        WIDTH / 2,
        HEIGHT - 34,
        "bold 20px monospace",
        "#fff0d2",
        "#140c1e",
        5
      );
      ctx.restore();
    }
  } else if (state === "vignette") {
    // Hover label
    if (hoveredHotspot) {
      drawOutlinedText(
        hoveredHotspot.name,
        WIDTH / 2,
        34,
        "bold 22px monospace",
        "#ffe5a3",
        "#140c1e",
        5
      );
    }

    // Dialog / narration box at bottom
    if (messageTimer > 0 && messageText) {
      const font = "22px Georgia, serif";
      const lines = wrapText(messageText, WIDTH - 80, font);
      const lineHeight = 30;
      const boxH = lines.length * lineHeight + 28;
      const boxY = HEIGHT - boxH - 18;

      ctx.fillStyle = "rgba(13, 10, 23, 0.84)";
      ctx.fillRect(24, boxY, WIDTH - 48, boxH);
      ctx.strokeStyle = "rgba(255, 229, 163, 0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(25, boxY + 1, WIDTH - 50, boxH - 2);

      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#fff4dc";
      lines.forEach((line, i) => {
        ctx.fillText(line, WIDTH / 2, boxY + 14 + i * lineHeight);
      });
    }
  }

  // Subtle music toggle pill (top-right)
  if (fadeAlpha < 0.9) {
    const label = !music.started ? "♪ Звук" : music.muted ? "♪ Выкл" : "♪ Вкл";
    ctx.fillStyle = "rgba(13, 10, 23, 0.65)";
    ctx.fillRect(muteBtn.x, muteBtn.y, muteBtn.w, muteBtn.h);
    ctx.strokeStyle = "rgba(255, 229, 163, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(muteBtn.x + 0.5, muteBtn.y + 0.5, muteBtn.w - 1, muteBtn.h - 1);
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffe5a3";
    ctx.fillText(label, muteBtn.x + muteBtn.w / 2, muteBtn.y + muteBtn.h / 2);
  }

  if (fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function loop(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * WIDTH,
    y: ((e.clientY - rect.top) / rect.height) * HEIGHT
  };
}

canvas.addEventListener("mousemove", (e) => {
  mouse = getCanvasCoords(e);
  if (isInRect(mouse, muteBtn)) {
    canvas.style.cursor = "pointer";
    return;
  }
  if (state === "vignette") {
    hoveredHotspot = hotspots.find((h) => isInRect(mouse, h)) || null;
    canvas.style.cursor = hoveredHotspot ? "pointer" : "default";
  } else {
    canvas.style.cursor = "pointer";
  }
});

function handleContinue() {
  music.start();
  if (state === "ready") {
    state = "fade_out";
  }
}

canvas.addEventListener("click", (e) => {
  const pos = getCanvasCoords(e);
  if (isInRect(pos, muteBtn)) {
    music.toggleMute();
    return;
  }
  music.start();
  if (state === "ready") {
    handleContinue();
    return;
  }
  if (state === "vignette") {
    const hit = hotspots.find((h) => isInRect(pos, h));
    if (hit) {
      messageText = hit.text;
      messageTimer = 4.5;
    }
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "m") {
    music.toggleMute();
    return;
  }
  handleContinue();
});

requestAnimationFrame(loop);
