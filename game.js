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

// --- Soundtrack: Kyiv Summer.mp3 ---
const music = {
  audio: new Audio("assets/audio/Kyiv%20Summer.mp3"),
  started: false,
  muted: false,
  targetVolume: 0.65,
  fadeTimer: null,

  init() {
    this.audio.loop = true;
    this.audio.preload = "auto";
    this.audio.volume = 0;
  },

  start() {
    if (this.started) {
      if (this.audio.paused && !this.muted) {
        this.audio.play().catch(() => {});
      }
      return;
    }
    this.started = true;
    this.audio.volume = 0;
    this.audio.play().then(() => {
      this.fadeTo(this.muted ? 0 : this.targetVolume, 1500);
    }).catch(() => {
      this.started = false;
    });
  },

  fadeTo(target, durationMs) {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    const steps = 30;
    const stepMs = durationMs / steps;
    const startVol = this.audio.volume;
    let currentStep = 0;
    this.fadeTimer = setInterval(() => {
      currentStep++;
      const t = Math.min(1, currentStep / steps);
      this.audio.volume = Math.max(0, Math.min(1, startVol + (target - startVol) * t));
      if (t >= 1) {
        clearInterval(this.fadeTimer);
        this.fadeTimer = null;
      }
    }, stepMs);
  },

  toggleMute() {
    if (!this.started) {
      this.muted = false;
      this.start();
      return;
    }
    this.muted = !this.muted;
    this.fadeTo(this.muted ? 0 : this.targetVolume, 300);
  }
};
music.init();

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

function drawTitleLockup(alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;

  // Soft twilight sky scrim behind the title
  const grad = ctx.createLinearGradient(0, 0, 0, 175);
  grad.addColorStop(0, "rgba(18, 12, 28, 0.72)");
  grad.addColorStop(0.7, "rgba(18, 12, 28, 0.32)");
  grad.addColorStop(1, "rgba(18, 12, 28, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, 175);

  const cx = WIDTH / 2;
  const cy = 68;
  const titleText = "OBOLON MEMORIES";

  ctx.font = "bold 54px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Subtle warm outer glow
  ctx.save();
  ctx.shadowColor = "rgba(255, 186, 102, 0.45)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(255, 224, 160, 0.25)";
  ctx.fillText(titleText, cx, cy);
  ctx.restore();

  // Deep layered drop shadow
  ctx.fillStyle = "rgba(16, 9, 26, 0.9)";
  ctx.fillText(titleText, cx + 3, cy + 5);

  // Crisp dark outline
  ctx.lineJoin = "round";
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#1b1026";
  ctx.strokeText(titleText, cx, cy);

  // Warm sunset gold gradient fill
  const textGrad = ctx.createLinearGradient(0, cy - 26, 0, cy + 26);
  textGrad.addColorStop(0, "#fff9e4");
  textGrad.addColorStop(0.55, "#ffd584");
  textGrad.addColorStop(1, "#e6944c");
  ctx.fillStyle = textGrad;
  ctx.fillText(titleText, cx, cy);

  // Ornamental golden divider with center diamond
  const ruleY = cy + 36;
  const ruleHalf = 148;
  const lineGrad = ctx.createLinearGradient(cx - ruleHalf, ruleY, cx + ruleHalf, ruleY);
  lineGrad.addColorStop(0, "rgba(255, 213, 132, 0)");
  lineGrad.addColorStop(0.25, "rgba(255, 213, 132, 0.85)");
  lineGrad.addColorStop(0.5, "rgba(255, 245, 214, 1)");
  lineGrad.addColorStop(0.75, "rgba(255, 213, 132, 0.85)");
  lineGrad.addColorStop(1, "rgba(255, 213, 132, 0)");
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - ruleHalf, ruleY);
  ctx.lineTo(cx - 10, ruleY);
  ctx.moveTo(cx + 10, ruleY);
  ctx.lineTo(cx + ruleHalf, ruleY);
  ctx.stroke();

  // Center diamond
  ctx.fillStyle = "#ffe6aa";
  ctx.beginPath();
  ctx.moveTo(cx, ruleY - 4);
  ctx.lineTo(cx + 4, ruleY);
  ctx.lineTo(cx, ruleY + 4);
  ctx.lineTo(cx - 4, ruleY);
  ctx.closePath();
  ctx.fill();

  // Tracked subtitle
  drawOutlinedText(
    "К И Е В   ·   О Б О Л О Н Ь",
    cx,
    ruleY + 18,
    "bold 14px monospace",
    "#ffe9be",
    "#191024",
    4
  );

  ctx.restore();
}

function render() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const isTitle = state === "fade_in" || state === "ready" || state === "fade_out";
  drawCoverImage(isTitle ? titleImg : westLineImg);

  if (isTitle) {
    if (titleAlpha > 0) {
      drawTitleLockup(titleAlpha);
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
