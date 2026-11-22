const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = 1024;
const HEIGHT = 576;

// --- Assets ---
const images = {
  title: new Image(),
  west_line: new Image(),
  embankment: new Image(),
  portrait_andrey: new Image(),
  portrait_lena: new Image()
};
images.title.src = "assets/art/title_screen.jpg";
images.west_line.src = "assets/art/splash_screen.jpeg";
images.embankment.src = "assets/art/embankment.jpg";
images.portrait_andrey.src = "assets/art/portrait_andrey.png";
images.portrait_lena.src = "assets/art/portrait_lena.png";

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

// --- Kathy Rain-Style Dialog Data ---
const speakers = {
  lena: {
    name: "ЛЕНА",
    color: "#8fd3ff",
    portrait: () => images.portrait_lena
  },
  andrey: {
    name: "АНДРЕЙ",
    color: "#ffb36b",
    portrait: () => images.portrait_andrey
  }
};

const embankmentDialog = [
  {
    speaker: "lena",
    text: "Наконец-то дошёл! Я уже думала, ты застрял в очереди у West Line."
  },
  {
    speaker: "andrey",
    text: "Почти. Зато посмотри на небо — летом на Оболони закаты всегда какие-то нереальные."
  },
  {
    speaker: "lena",
    text: "Ага, и воздух у Днепра сразу прохладнее. Люблю это время, когда фонари только зажигаются."
  },
  {
    speaker: "andrey",
    text: "Помнишь, как мы в прошлом году сидели тут на ступеньках до полуночи и слушали музыку с телефона?"
  },
  {
    speaker: "lena",
    text: "Конечно помню. Ты тогда ещё сказал, что это лучший вечер лета."
  },
  {
    speaker: "andrey",
    text: "Похоже, сегодня у нас есть шанс его повторить. Пройдёмся вдоль воды?"
  },
  {
    speaker: "lena",
    text: "Пошли. Только не слишком быстро — хочется запомнить этот вечер."
  }
];

// --- Scene Definitions ---
const scenes = {
  west_line: {
    bg: () => images.west_line,
    enterMessage: "Оболонь, конец лета. Нажимайте вокруг или идите к набережной.",
    hotspots: [
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
      },
      {
        name: "К набережной →",
        x: 845,
        y: 230,
        w: 165,
        h: 240,
        isExit: true,
        targetScene: "embankment"
      }
    ]
  },
  embankment: {
    bg: () => images.embankment,
    enterMessage: "",
    hotspots: [
      {
        name: "Лена",
        x: 418,
        y: 332,
        w: 58,
        h: 122,
        onClick: () => startDialog(embankmentDialog)
      },
      {
        name: "Андрей",
        x: 482,
        y: 320,
        w: 62,
        h: 134,
        onClick: () => startDialog(embankmentDialog)
      },
      {
        name: "Днепр",
        x: 700,
        y: 270,
        w: 300,
        h: 150,
        text: "Розовые отблески заката дрожат на тёмной воде."
      },
      {
        name: "← К West Line",
        x: 14,
        y: 250,
        w: 155,
        h: 220,
        isExit: true,
        targetScene: "west_line"
      }
    ]
  }
};

// --- Game State ---
let mode = "title_fade_in"; // title_fade_in | title_ready | scene | transition
let currentSceneId = "west_line";
let pendingSceneId = null;
let fadeAlpha = 1.0;
let fadeDir = 0; // -1 fading in, +1 fading out
let titleAlpha = 0.0;
let elapsed = 0;
let lastTime = performance.now();
let messageText = "";
let messageTimer = 0;
let embankmentVisited = false;

// --- Dialog State ---
let dialog = {
  active: false,
  lines: [],
  index: 0,
  charCount: 0,
  charsPerSec: 42
};

let mouse = { x: -1, y: -1 };
let hoveredHotspot = null;
const muteBtn = { x: WIDTH - 94, y: 14, w: 80, h: 28 };

function isInRect(pos, r) {
  return pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h;
}

function startDialog(lines) {
  dialog.active = true;
  dialog.lines = lines;
  dialog.index = 0;
  dialog.charCount = 0;
  messageTimer = 0;
}

function advanceDialog() {
  if (!dialog.active) return;
  const line = dialog.lines[dialog.index];
  if (dialog.charCount < line.text.length) {
    dialog.charCount = line.text.length;
    return;
  }
  dialog.index++;
  if (dialog.index >= dialog.lines.length) {
    dialog.active = false;
  } else {
    dialog.charCount = 0;
  }
}

function transitionToScene(sceneId) {
  if (mode === "transition") return;
  pendingSceneId = sceneId;
  mode = "transition";
  fadeDir = 1;
  hoveredHotspot = null;
  dialog.active = false;
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

function wrapText(text, maxWidth, font = "21px Georgia, serif") {
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

// --- Pixel-Art Character Sprites (Lena & Andrey on the Embankment) ---
function drawPixelRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawEmbankmentCharacters() {
  const bobL = Math.round(Math.sin(elapsed * 2.2) * 1.5);
  const bobA = Math.round(Math.sin(elapsed * 2.2 + 1.1) * 1.5);

  // Ground shadows
  ctx.fillStyle = "rgba(12, 8, 22, 0.45)";
  ctx.beginPath();
  ctx.ellipse(446, 452, 22, 7, 0, 0, Math.PI * 2);
  ctx.ellipse(512, 452, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- LENA (left, pale blue top, dark jeans, chestnut hair) ---
  const lx = 432;
  const ly = 342 + bobL;
  // Hair back
  drawPixelRect(lx + 4, ly + 4, 24, 28, "#3e2723");
  // Face
  drawPixelRect(lx + 9, ly + 8, 14, 15, "#f0c8b4");
  // Bangs & hair sides
  drawPixelRect(lx + 6, ly + 4, 20, 7, "#4e342e");
  drawPixelRect(lx + 5, ly + 10, 5, 19, "#4e342e");
  drawPixelRect(lx + 22, ly + 10, 5, 19, "#3e2723");
  // Eyes (blue-green)
  drawPixelRect(lx + 11, ly + 13, 3, 2, "#4f9aa8");
  drawPixelRect(lx + 18, ly + 13, 3, 2, "#4f9aa8");
  // Pale blue sleeveless top
  drawPixelRect(lx + 8, ly + 25, 16, 30, "#a9cbe0");
  drawPixelRect(lx + 8, ly + 25, 16, 4, "#8fb6cf");
  // Arms
  drawPixelRect(lx + 4, ly + 27, 4, 25, "#e6baa4");
  drawPixelRect(lx + 24, ly + 27, 4, 25, "#dca992");
  // Jeans
  drawPixelRect(lx + 8, ly + 55, 7, 44, "#2c3e5e");
  drawPixelRect(lx + 17, ly + 55, 7, 44, "#24334f");
  // Sneakers
  drawPixelRect(lx + 6, ly + 99, 9, 6, "#e8e2d8");
  drawPixelRect(lx + 17, ly + 99, 9, 6, "#d4cec4");

  // --- ANDREY (right, orange t-shirt, glasses, dark jeans) ---
  const ax = 496;
  const ay = 330 + bobA;
  // Hair
  drawPixelRect(ax + 7, ay + 2, 20, 10, "#2f241f");
  drawPixelRect(ax + 6, ay + 6, 4, 8, "#2f241f");
  drawPixelRect(ax + 24, ay + 6, 4, 8, "#2f241f");
  // Face
  drawPixelRect(ax + 9, ay + 9, 16, 17, "#eab89a");
  // Glasses
  drawPixelRect(ax + 10, ay + 14, 6, 4, "#3b2320");
  drawPixelRect(ax + 18, ay + 14, 6, 4, "#3b2320");
  drawPixelRect(ax + 11, ay + 15, 4, 2, "#c8e0ea");
  drawPixelRect(ax + 19, ay + 15, 4, 2, "#c8e0ea");
  drawPixelRect(ax + 16, ay + 15, 2, 1, "#3b2320");
  // Orange t-shirt
  drawPixelRect(ax + 5, ay + 28, 24, 36, "#e86a24");
  drawPixelRect(ax + 5, ay + 28, 24, 5, "#f4823c");
  // Sleeves & arms
  drawPixelRect(ax + 1, ay + 30, 5, 14, "#d45a1a");
  drawPixelRect(ax + 28, ay + 30, 5, 14, "#c45016");
  drawPixelRect(ax + 2, ay + 44, 4, 18, "#dfa98b");
  drawPixelRect(ax + 28, ay + 44, 4, 18, "#d49c7e");
  // Jeans
  drawPixelRect(ax + 7, ay + 64, 9, 50, "#273754");
  drawPixelRect(ax + 18, ay + 64, 9, 50, "#1f2c45");
  // Shoes
  drawPixelRect(ax + 6, ay + 114, 10, 6, "#2c2426");
  drawPixelRect(ax + 18, ay + 114, 10, 6, "#241d1f");
}

function drawTitleLockup(alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;

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

  ctx.save();
  ctx.shadowColor = "rgba(255, 186, 102, 0.45)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(255, 224, 160, 0.25)";
  ctx.fillText(titleText, cx, cy);
  ctx.restore();

  ctx.fillStyle = "rgba(16, 9, 26, 0.9)";
  ctx.fillText(titleText, cx + 3, cy + 5);

  ctx.lineJoin = "round";
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#1b1026";
  ctx.strokeText(titleText, cx, cy);

  const textGrad = ctx.createLinearGradient(0, cy - 26, 0, cy + 26);
  textGrad.addColorStop(0, "#fff9e4");
  textGrad.addColorStop(0.55, "#ffd584");
  textGrad.addColorStop(1, "#e6944c");
  ctx.fillStyle = textGrad;
  ctx.fillText(titleText, cx, cy);

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

  ctx.fillStyle = "#ffe6aa";
  ctx.beginPath();
  ctx.moveTo(cx, ruleY - 4);
  ctx.lineTo(cx + 4, ruleY);
  ctx.lineTo(cx, ruleY + 4);
  ctx.lineTo(cx - 4, ruleY);
  ctx.closePath();
  ctx.fill();

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

function drawKathyRainDialog() {
  const line = dialog.lines[dialog.index];
  if (!line) return;
  const speaker = speakers[line.speaker];
  const portrait = speaker.portrait();

  const boxX = 28;
  const boxH = 138;
  const boxY = HEIGHT - boxH - 16;
  const boxW = WIDTH - 56;

  // Dark plum-charcoal adventure dialog panel
  ctx.fillStyle = "rgba(14, 10, 24, 0.92)";
  ctx.fillRect(boxX, boxY, boxW, boxH);

  // Double retro border
  ctx.strokeStyle = "#d9b06c";
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX + 1, boxY + 1, boxW - 2, boxH - 2);
  ctx.strokeStyle = "rgba(255, 229, 163, 0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX + 5, boxY + 5, boxW - 10, boxH - 10);

  // Portrait frame (left)
  const pSize = 112;
  const px = boxX + 14;
  const py = boxY + 13;
  ctx.fillStyle = "#09060f";
  ctx.fillRect(px, py, pSize, pSize);

  if (portrait && portrait.complete && portrait.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(portrait, px, py, pSize, pSize);
    ctx.restore();
  }

  ctx.strokeStyle = speaker.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, pSize, pSize);

  // Speaker name
  const textX = px + pSize + 20;
  const textMaxW = boxX + boxW - textX - 24;
  ctx.font = "bold 18px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = speaker.color;
  ctx.fillText(speaker.name, textX, py + 2);

  // Typewriter text
  const visibleText = line.text.slice(0, Math.floor(dialog.charCount));
  const font = "21px Georgia, serif";
  const wrapped = wrapText(visibleText, textMaxW, font);
  ctx.font = font;
  ctx.fillStyle = "#f7efe0";
  wrapped.forEach((l, i) => {
    ctx.fillText(l, textX, py + 30 + i * 28);
  });

  // Advance indicator
  if (dialog.charCount >= line.text.length) {
    const bob = Math.sin(elapsed * 6) * 2.5;
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffe5a3";
    ctx.fillText("▼", boxX + boxW - 18, boxY + boxH - 24 + bob);
  }
}

function drawExitHints(scene) {
  if (dialog.active) return;
  scene.hotspots.forEach((h) => {
    if (!h.isExit) return;
    const isHovered = hoveredHotspot === h;
    const pulse = isHovered ? 1.0 : 0.65 + 0.25 * Math.sin(elapsed * 2.5);
    const pillW = 158;
    const pillH = 32;
    const px = h.x > WIDTH / 2 ? WIDTH - pillW - 18 : 18;
    const py = HEIGHT / 2 - pillH / 2;

    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = isHovered ? "rgba(38, 24, 56, 0.9)" : "rgba(13, 10, 23, 0.68)";
    ctx.fillRect(px, py, pillW, pillH);
    ctx.strokeStyle = isHovered ? "#ffe5a3" : "rgba(255, 229, 163, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 0.5, py + 0.5, pillW - 1, pillH - 1);

    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffe9be";
    ctx.fillText(h.name, px + pillW / 2, py + pillH / 2);
    ctx.restore();
  });
}

function update(dt) {
  elapsed += dt;

  if (mode === "title_fade_in") {
    fadeAlpha = Math.max(0, fadeAlpha - dt / 1.1);
    if (fadeAlpha === 0) {
      titleAlpha = Math.min(1, titleAlpha + dt / 0.8);
      if (titleAlpha === 1) mode = "title_ready";
    }
  } else if (mode === "transition") {
    if (fadeDir > 0) {
      fadeAlpha = Math.min(1, fadeAlpha + dt / 0.55);
      if (fadeAlpha === 1) {
        currentSceneId = pendingSceneId;
        pendingSceneId = null;
        fadeDir = -1;
        const sc = scenes[currentSceneId];
        if (sc.enterMessage) {
          messageText = sc.enterMessage;
          messageTimer = 4.0;
        } else {
          messageText = "";
          messageTimer = 0;
        }
        if (currentSceneId === "embankment" && !embankmentVisited) {
          embankmentVisited = true;
          startDialog(embankmentDialog);
        }
      }
    } else if (fadeDir < 0) {
      fadeAlpha = Math.max(0, fadeAlpha - dt / 0.65);
      if (fadeAlpha === 0) {
        fadeDir = 0;
        mode = "scene";
      }
    }
  } else if (mode === "scene") {
    if (messageTimer > 0) {
      messageTimer = Math.max(0, messageTimer - dt);
    }
    if (dialog.active) {
      const line = dialog.lines[dialog.index];
      if (line && dialog.charCount < line.text.length) {
        dialog.charCount = Math.min(line.text.length, dialog.charCount + dt * dialog.charsPerSec);
      }
    }
  }
}

function render() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const isTitle = mode === "title_fade_in" || mode === "title_ready" || (mode === "transition" && fadeDir > 0 && pendingSceneId === "west_line" && titleAlpha > 0 && currentSceneId === "west_line" && !embankmentVisited && messageTimer === 0);

  if (mode === "title_fade_in" || mode === "title_ready") {
    drawCoverImage(images.title);
    if (titleAlpha > 0) drawTitleLockup(titleAlpha);
    if (mode === "title_ready") {
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
  } else {
    const sc = scenes[currentSceneId];
    drawCoverImage(sc.bg());

    if (currentSceneId === "embankment") {
      drawEmbankmentCharacters();
    }

    drawExitHints(sc);

    if (!dialog.active && hoveredHotspot) {
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

    if (dialog.active) {
      drawKathyRainDialog();
    } else if (messageTimer > 0 && messageText) {
      const font = "21px Georgia, serif";
      const lines = wrapText(messageText, WIDTH - 80, font);
      const lineHeight = 29;
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
  if (mode === "scene") {
    if (dialog.active) {
      canvas.style.cursor = "pointer";
      return;
    }
    const sc = scenes[currentSceneId];
    hoveredHotspot = sc.hotspots.find((h) => isInRect(mouse, h)) || null;
    canvas.style.cursor = hoveredHotspot ? "pointer" : "default";
  } else {
    canvas.style.cursor = "pointer";
  }
});

canvas.addEventListener("click", (e) => {
  const pos = getCanvasCoords(e);
  if (isInRect(pos, muteBtn)) {
    music.toggleMute();
    return;
  }
  music.start();

  if (mode === "title_ready") {
    transitionToScene("west_line");
    return;
  }
  if (mode === "scene") {
    if (dialog.active) {
      advanceDialog();
      return;
    }
    const sc = scenes[currentSceneId];
    const hit = sc.hotspots.find((h) => isInRect(pos, h));
    if (hit) {
      if (hit.isExit && hit.targetScene) {
        transitionToScene(hit.targetScene);
      } else if (hit.onClick) {
        hit.onClick();
      } else if (hit.text) {
        messageText = hit.text;
        messageTimer = 4.5;
      }
    }
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "m") {
    music.toggleMute();
    return;
  }
  music.start();
  if (mode === "title_ready") {
    transitionToScene("west_line");
  } else if (mode === "scene" && dialog.active && (e.key === " " || e.key === "Enter")) {
    e.preventDefault();
    advanceDialog();
  }
});

requestAnimationFrame(loop);
