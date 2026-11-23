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
  autoplayBlocked: false,
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
      this.autoplayBlocked = false;
      this.fadeTo(this.muted ? 0 : this.targetVolume, 1500);
    }).catch(() => {
      this.started = false;
      this.autoplayBlocked = true;
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
// Try playing immediately on splash screen load; if browser blocks autoplay,
// any pointer/key interaction on the splash screen unlocks it immediately.
music.start();

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
        text: "Тяжёлые стеклянные двери открываются вручную со знакомым скрипом. Внутри пахнет свежим хлебом и летней пылью."
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
        name: "Вывеска «Супермакет»",
        x: 775,
        y: 112,
        w: 122,
        h: 92,
        text: "Буква «Р» в слове «Супермаркет» вечно не загоралась, и по вечерам над Оболонью гордо светилось «Супермакет»."
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
// currentSceneId is "title", "west_line", or "embankment"
let currentSceneId = "title";
let pendingSceneId = null;
let mode = "title_fade_in"; // title_fade_in | title_ready | scene | transition
let fadeAlpha = 1.0;
let fadeDir = 0; // +1 fading to black, -1 fading in from black
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

const muteBtn = { x: WIDTH - 102, y: 14, w: 88, h: 28 };
const startBtn = { x: WIDTH / 2 - 95, y: HEIGHT - 76, w: 190, h: 42 };

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

// --- Seamless 10-Second Looping Ambient Animation for West Line ---
const WEST_LINE_LOOP_SEC = 10.0;
const lampMotes = [
  { cx: 528, cy: 263, rx: 22, ry: 12, kx: 1, ky: 2, px: 0.2, py: 0.7, size: 2 },
  { cx: 510, cy: 278, rx: 16, ry: 10, kx: 2, ky: 1, px: 1.8, py: 0.4, size: 2 },
  { cx: 546, cy: 277, rx: 17, ry: 11, kx: 1, ky: 3, px: 3.1, py: 1.5, size: 2 },
  { cx: 528, cy: 272, rx: 32, ry: 15, kx: 1, ky: 2, px: 4.4, py: 2.6, size: 2 },
  { cx: 522, cy: 258, rx: 14, ry: 9,  kx: 3, ky: 2, px: 0.9, py: 3.8, size: 2 },
  { cx: 538, cy: 268, rx: 24, ry: 13, kx: 2, ky: 3, px: 5.1, py: 0.9, size: 2 }
];

function pulseWindow(u, center, halfWidth) {
  const d = Math.abs(u - center);
  if (d >= halfWidth) return 0;
  return Math.pow(Math.cos((d / halfWidth) * (Math.PI / 2)), 2);
}

// Maps source pixel coords (1024x571) of splash_screen.jpeg to canvas coords (1024x576)
function getWestLineTransform(img) {
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
  const scaleX = WIDTH / sw;
  const scaleY = HEIGHT / sh;
  return {
    sx, sy, scaleX, scaleY,
    x: (ix) => (ix - sx) * scaleX,
    y: (iy) => (iy - sy) * scaleY,
    w: (iw) => iw * scaleX,
    h: (ih) => ih * scaleY
  };
}

// Subtle pixel-art idle bob for a person slice from the background image
function drawAnimatedSlice(img, tf, ix, iy, iw, ih, dx, dy) {
  if (dx === 0 && dy === 0) return;
  const cx = tf.x(ix);
  const cy = tf.y(iy);
  const cw = tf.w(iw);
  const ch = tf.h(ih);
  ctx.drawImage(img, ix, iy, iw, ih, Math.round(cx + dx), Math.round(cy + dy), Math.ceil(cw), Math.ceil(ch));
}

function drawWestLineAmbient() {
  const img = images.west_line;
  if (!img.complete || img.naturalWidth === 0) return;
  const tf = getWestLineTransform(img);

  const u = (((elapsed % WEST_LINE_LOOP_SEC) + WEST_LINE_LOOP_SEC) % WEST_LINE_LOOP_SEC) / WEST_LINE_LOOP_SEC;
  const tau = u * Math.PI * 2;

  ctx.save();

  // 1. Subtle golden sunset breathing behind the roof (1 cycle / 10s)
  const sunBreath = 0.5 + 0.5 * Math.sin(tau);
  const sunX = tf.x(484), sunY = tf.y(108);
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 175);
  sunGrad.addColorStop(0, `rgba(255, 224, 148, ${0.14 + 0.08 * sunBreath})`);
  sunGrad.addColorStop(0.5, `rgba(255, 172, 92, ${0.06 + 0.04 * sunBreath})`);
  sunGrad.addColorStop(1, "rgba(255, 150, 80, 0)");
  ctx.fillStyle = sunGrad;
  ctx.fillRect(290, 0, 390, 290);

  // 2. Distant evening birds gliding across the upper-right sky (seamless 10s wrap)
  const birds = [
    { startU: 0.08, dur: 0.42, x0: 470, x1: 990, y0: 54, y1: 28, amp: 7, flapFreq: 22 },
    { startU: 0.14, dur: 0.44, x0: 455, x1: 975, y0: 66, y1: 38, amp: 6, flapFreq: 20 }
  ];
  birds.forEach((b) => {
    const localU = (u - b.startU) / b.dur;
    if (localU > 0 && localU < 1) {
      const fade = Math.sin(localU * Math.PI);
      const bx = Math.round(b.x0 + (b.x1 - b.x0) * localU);
      const by = Math.round(b.y0 + (b.y1 - b.y0) * localU + Math.sin(localU * Math.PI * 2) * b.amp);
      const wing = Math.sin(tau * b.flapFreq) > 0 ? -2 : 1;
      ctx.fillStyle = `rgba(54, 34, 64, ${0.75 * fade})`;
      ctx.fillRect(bx, by, 2, 2);
      ctx.fillRect(bx - 3, by + wing, 3, 1);
      ctx.fillRect(bx + 2, by + wing, 3, 1);
    }
  });

  // 3. Warm interior glow breathing softly inside the manual entrance doors
  const doorBreath = 0.5 + 0.5 * Math.sin(tau + 1.3);
  const doorX = tf.x(212), doorY = tf.y(405);
  const doorGrad = ctx.createRadialGradient(doorX, doorY, 8, doorX, doorY, 64);
  doorGrad.addColorStop(0, `rgba(255, 212, 132, ${0.15 + 0.08 * doorBreath})`);
  doorGrad.addColorStop(1, "rgba(255, 180, 96, 0)");
  ctx.fillStyle = doorGrad;
  ctx.fillRect(140, 335, 145, 135);

  // 4. Pixel-exact broken "Р" in "СУПЕРМАРКЕТ" (strictly x: 864..871, y: 156..176 in image coords)
  // Stays mostly dark ("СУПЕРМАКЕТ") and flickers briefly twice per 10s loop with zero bleed onto А or К
  const flicker =
    0.95 * pulseWindow(u, 0.30, 0.016) +
    0.65 * pulseWindow(u, 0.335, 0.011) +
    1.00 * pulseWindow(u, 0.73, 0.014) +
    0.55 * pulseWindow(u, 0.76, 0.009);
  const rLit = Math.min(1, flicker);

  const rx1 = tf.x(863.8), rx2 = tf.x(871.3);
  const ryTopL = tf.y(155.5), ryTopR = tf.y(158.0);
  const ryBotL = tf.y(176.2), ryBotR = tf.y(178.5);
  const stemR = tf.x(866.8);
  const loopBot = tf.y(169.2);

  // Clip strictly to the "Р" letter silhouette (vertical stem + upper loop)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(rx1, ryTopL);
  ctx.lineTo(rx2, ryTopR);
  ctx.lineTo(rx2, loopBot);
  ctx.lineTo(stemR, loopBot - 0.5);
  ctx.lineTo(stemR, ryBotL + 1);
  ctx.lineTo(rx1, ryBotL);
  ctx.closePath();

  // Darken ONLY the "Р" to the navy sign backing when unlit
  ctx.fillStyle = `rgba(30, 44, 72, ${0.88 * (1 - rLit)})`;
  ctx.fill();

  // Crisp bright flash strictly inside the "Р" silhouette when it sparks on
  if (rLit > 0.08) {
    ctx.fillStyle = `rgba(235, 245, 255, ${0.55 * rLit})`;
    ctx.fill();
  }
  ctx.restore();

  // 5. Subtle idle animations on the people around West Line (all integer cycles / 10s)
  // Guy sitting & raising his bottle/hand (x: 372..397, y: 374..416)
  const toastBob = Math.round(Math.sin(tau * 2) * 1.3);
  drawAnimatedSlice(img, tf, 374, 374, 23, 38, 0, toastBob);

  // Friend sitting beside him in green (x: 400..421, y: 388..422)
  const nodBob = Math.round(Math.sin(tau * 2 + 2.1) * 1.1);
  drawAnimatedSlice(img, tf, 401, 388, 19, 28, 0, nodBob);

  // Guy leaning on the wall holding a drink (x: 455..479, y: 368..410)
  const leanSway = Math.round(Math.sin(tau + 0.8) * 1.2);
  drawAnimatedSlice(img, tf, 456, 369, 22, 36, 0, leanSway);

  // Person chatting by the West Line entrance (x: 224..242, y: 366..406)
  const entranceBob = Math.round(Math.sin(tau + 2.5) * 1.1);
  drawAnimatedSlice(img, tf, 225, 367, 16, 36, 0, entranceBob);

  // Pedestrian walking past the streetlamp (x: 545..567, y: 386..440)
  const walkBob = Math.round(Math.sin(tau * 3) * 1.2);
  drawAnimatedSlice(img, tf, 546, 387, 20, 46, 0, walkBob);

  // 6. Parked silver Mercedes double alarm/lock turn-signal blink (once per 10s loop at u = 0.52 & 0.56)
  const carBlink =
    pulseWindow(u, 0.52, 0.015) +
    pulseWindow(u, 0.56, 0.015);
  if (carBlink > 0.05) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    [
      { ix: 256, iy: 440 },
      { ix: 349, iy: 441 }
    ].forEach((pt) => {
      const lx = tf.x(pt.ix), ly = tf.y(pt.iy);
      const grad = ctx.createRadialGradient(lx, ly, 1, lx, ly, 16);
      grad.addColorStop(0, `rgba(255, 190, 70, ${0.85 * carBlink})`);
      grad.addColorStop(0.5, `rgba(255, 130, 30, ${0.35 * carBlink})`);
      grad.addColorStop(1, "rgba(255, 110, 20, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(lx - 16, ly - 16, 32, 32);
    });
    ctx.restore();
  }

  // 7. Three streetlamp globes warm breathing halos (periodic 2 cycles / 10s)
  const globes = [
    { ix: 528, iy: 263, r: 46, phase: 0.0 },
    { ix: 510, iy: 278, r: 34, phase: 1.2 },
    { ix: 546, iy: 277, r: 34, phase: 2.4 }
  ];
  ctx.globalCompositeOperation = "lighter";
  globes.forEach((g) => {
    const gx = tf.x(g.ix), gy = tf.y(g.iy);
    const glow = 0.5 + 0.5 * Math.sin(tau * 2 + g.phase);
    const rad = g.r * (0.94 + 0.1 * glow);
    const grad = ctx.createRadialGradient(gx, gy, 2, gx, gy, rad);
    grad.addColorStop(0, `rgba(255, 238, 178, ${0.26 + 0.1 * glow})`);
    grad.addColorStop(0.45, `rgba(255, 192, 108, ${0.12 + 0.05 * glow})`);
    grad.addColorStop(1, "rgba(255, 160, 70, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(gx - rad, gy - rad, rad * 2, rad * 2);
  });

  // 8. Crisp pixel-art evening motes orbiting the streetlamp in closed 10-second loops
  lampMotes.forEach((m, idx) => {
    const x = Math.round(tf.x(m.cx) + Math.cos(m.kx * tau + m.px) * m.rx);
    const y = Math.round(tf.y(m.cy) + Math.sin(m.ky * tau + m.py) * m.ry);
    const a = 0.35 + 0.55 * (0.5 + 0.5 * Math.sin(2 * tau + idx * 1.1));
    ctx.fillStyle = `rgba(255, 240, 186, ${a})`;
    ctx.fillRect(x, y, m.size, m.size);
  });

  // 9. Subtle apartment window twilight shimmer in upper-left building (1 cycle / 10s)
  const winGlow1 = 0.5 + 0.5 * Math.sin(tau + 0.5);
  const winGlow2 = 0.5 + 0.5 * Math.sin(tau + 3.6);
  ctx.fillStyle = `rgba(255, 206, 118, ${0.16 * winGlow1})`;
  ctx.fillRect(tf.x(156), tf.y(98), 12, 16);
  ctx.fillStyle = `rgba(255, 198, 104, ${0.16 * winGlow2})`;
  ctx.fillRect(tf.x(240), tf.y(62), 11, 15);

  ctx.restore();
}

// --- Pixel-Art Character Sprites (Lena & Andrey on the Embankment) ---
function drawPixelRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawEmbankmentCharacters() {
  const bobL = Math.round(Math.sin(elapsed * 2.2) * 1.5);
  const bobA = Math.round(Math.sin(elapsed * 2.2 + 1.1) * 1.5);

  ctx.fillStyle = "rgba(12, 8, 22, 0.45)";
  ctx.beginPath();
  ctx.ellipse(446, 452, 22, 7, 0, 0, Math.PI * 2);
  ctx.ellipse(512, 452, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- LENA ---
  const lx = 432;
  const ly = 342 + bobL;
  drawPixelRect(lx + 4, ly + 4, 24, 28, "#3e2723");
  drawPixelRect(lx + 9, ly + 8, 14, 15, "#f0c8b4");
  drawPixelRect(lx + 6, ly + 4, 20, 7, "#4e342e");
  drawPixelRect(lx + 5, ly + 10, 5, 19, "#4e342e");
  drawPixelRect(lx + 22, ly + 10, 5, 19, "#3e2723");
  drawPixelRect(lx + 11, ly + 13, 3, 2, "#4f9aa8");
  drawPixelRect(lx + 18, ly + 13, 3, 2, "#4f9aa8");
  drawPixelRect(lx + 8, ly + 25, 16, 30, "#a9cbe0");
  drawPixelRect(lx + 8, ly + 25, 16, 4, "#8fb6cf");
  drawPixelRect(lx + 4, ly + 27, 4, 25, "#e6baa4");
  drawPixelRect(lx + 24, ly + 27, 4, 25, "#dca992");
  drawPixelRect(lx + 8, ly + 55, 7, 44, "#2c3e5e");
  drawPixelRect(lx + 17, ly + 55, 7, 44, "#24334f");
  drawPixelRect(lx + 6, ly + 99, 9, 6, "#e8e2d8");
  drawPixelRect(lx + 17, ly + 99, 9, 6, "#d4cec4");

  // --- ANDREY ---
  const ax = 496;
  const ay = 330 + bobA;
  drawPixelRect(ax + 7, ay + 2, 20, 10, "#2f241f");
  drawPixelRect(ax + 6, ay + 6, 4, 8, "#2f241f");
  drawPixelRect(ax + 24, ay + 6, 4, 8, "#2f241f");
  drawPixelRect(ax + 9, ay + 9, 16, 17, "#eab89a");
  drawPixelRect(ax + 10, ay + 14, 6, 4, "#3b2320");
  drawPixelRect(ax + 18, ay + 14, 6, 4, "#3b2320");
  drawPixelRect(ax + 11, ay + 15, 4, 2, "#c8e0ea");
  drawPixelRect(ax + 19, ay + 15, 4, 2, "#c8e0ea");
  drawPixelRect(ax + 16, ay + 15, 2, 1, "#3b2320");
  drawPixelRect(ax + 5, ay + 28, 24, 36, "#e86a24");
  drawPixelRect(ax + 5, ay + 28, 24, 5, "#f4823c");
  drawPixelRect(ax + 1, ay + 30, 5, 14, "#d45a1a");
  drawPixelRect(ax + 28, ay + 30, 5, 14, "#c45016");
  drawPixelRect(ax + 2, ay + 44, 4, 18, "#dfa98b");
  drawPixelRect(ax + 28, ay + 44, 4, 18, "#d49c7e");
  drawPixelRect(ax + 7, ay + 64, 9, 50, "#273754");
  drawPixelRect(ax + 18, ay + 64, 9, 50, "#1f2c45");
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

function drawTitleControls() {
  const hovered = isInRect(mouse, startBtn);
  ctx.save();
  ctx.fillStyle = hovered ? "rgba(42, 26, 62, 0.92)" : "rgba(16, 11, 28, 0.78)";
  ctx.fillRect(startBtn.x, startBtn.y, startBtn.w, startBtn.h);
  ctx.strokeStyle = hovered ? "#ffe9be" : "rgba(255, 218, 148, 0.75)";
  ctx.lineWidth = 2;
  ctx.strokeRect(startBtn.x + 1, startBtn.y + 1, startBtn.w - 2, startBtn.h - 2);

  drawOutlinedText(
    "НАЧАТЬ",
    startBtn.x + startBtn.w / 2,
    startBtn.y + startBtn.h / 2 + 1,
    "bold 18px monospace",
    hovered ? "#fff8e0" : "#ffe5a3",
    "#140c1e",
    4
  );
  ctx.restore();

  if (!music.started) {
    const pulse = 0.55 + 0.45 * Math.sin(elapsed * 3.0);
    ctx.save();
    ctx.globalAlpha = pulse;
    drawOutlinedText(
      "♪ Нажмите в любом месте, чтобы включить музыку",
      WIDTH / 2,
      HEIGHT - 16,
      "14px monospace",
      "#ffe9be",
      "#140c1e",
      4
    );
    ctx.restore();
  }
}

function drawKathyRainDialog() {
  const line = dialog.lines[dialog.index];
  if (!line) return;
  const speaker = speakers[line.speaker];
  const portrait = speaker.portrait();

  const boxX = 28;
  const boxH = 132;
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

  // Kathy Rain-style oval portrait popping slightly above the dialog bar
  const pW = 114;
  const pH = 152;
  const px = boxX + 14;
  const py = boxY + boxH - pH - 8;

  if (portrait && portrait.complete && portrait.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(portrait, px, py, pW, pH);
    ctx.restore();
  }

  // Speaker name
  const textX = px + pW + 20;
  const textMaxW = boxX + boxW - textX - 24;
  ctx.font = "bold 18px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = speaker.color;
  ctx.fillText(speaker.name, textX, boxY + 16);

  // Typewriter text
  const visibleText = line.text.slice(0, Math.floor(dialog.charCount));
  const font = "21px Georgia, serif";
  const wrapped = wrapText(visibleText, textMaxW, font);
  ctx.font = font;
  ctx.fillStyle = "#f7efe0";
  wrapped.forEach((l, i) => {
    ctx.fillText(l, textX, boxY + 46 + i * 28);
  });

  // Advance indicator
  if (dialog.charCount >= line.text.length) {
    const bob = Math.sin(elapsed * 6) * 2.5;
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffe5a3";
    ctx.fillText("▼", boxX + boxW - 18, boxY + boxH - 22 + bob);
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
        if (sc && sc.enterMessage) {
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

  if (currentSceneId === "title") {
    drawCoverImage(images.title);
    if (titleAlpha > 0) drawTitleLockup(titleAlpha);
    if (mode === "title_ready") drawTitleControls();
  } else {
    const sc = scenes[currentSceneId];
    drawCoverImage(sc.bg());

    if (currentSceneId === "west_line") {
      drawWestLineAmbient();
    } else if (currentSceneId === "embankment") {
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

  // Music toggle pill (top-right)
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
  if (currentSceneId === "title") {
    canvas.style.cursor = isInRect(mouse, startBtn) || !music.started ? "pointer" : "default";
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
    canvas.style.cursor = "default";
  }
});

canvas.addEventListener("click", (e) => {
  const pos = getCanvasCoords(e);
  if (isInRect(pos, muteBtn)) {
    music.toggleMute();
    return;
  }

  if (currentSceneId === "title") {
    music.start();
    if (mode === "title_ready" && isInRect(pos, startBtn)) {
      transitionToScene("west_line");
    }
    return;
  }

  music.start();
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
        messageTimer = 5.0;
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
  if (mode === "title_ready" && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    transitionToScene("west_line");
  } else if (mode === "scene" && dialog.active && (e.key === " " || e.key === "Enter")) {
    e.preventDefault();
    advanceDialog();
  }
});

requestAnimationFrame(loop);
