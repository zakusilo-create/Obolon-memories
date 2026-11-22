const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const WIDTH = 320;
const HEIGHT = 200;

const splashImg = new Image();
splashImg.src = "assets/art/splash_screen.jpeg";

let state = "fade_in"; // fade_in -> ready -> fade_out -> vignette
let fadeAlpha = 1.0;
let titleAlpha = 0.0;
let elapsed = 0;
let lastTime = performance.now();
let messageText = "";
let messageTimer = 0;

// Example hotspots for after the splash screen
const hotspots = [
  {
    name: "West Line Entrance",
    x: 45,
    y: 92,
    w: 50,
    h: 58,
    text: "The automatic doors hum softly. Warm air smells like fresh bread and summer dust."
  },
  {
    name: "Streetlamp",
    x: 150,
    y: 88,
    w: 24,
    h: 72,
    text: "Three globes glowing against the Obolon sunset."
  },
  {
    name: "West Line Sign",
    x: 170,
    y: 34,
    w: 52,
    h: 54,
    text: "WEST LINE. Everyone in the neighborhood met here at least once."
  }
];

let mouse = { x: -1, y: -1 };
let hoveredHotspot = null;

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

function drawOutlinedText(text, x, y, font, fill, outline, align = "center") {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";

  ctx.fillStyle = outline;
  for (let ox = -1; ox <= 1; ox++) {
    for (let oy = -1; oy <= 1; oy++) {
      if (ox !== 0 || oy !== 0) {
        ctx.fillText(text, Math.round(x + ox), Math.round(y + oy));
      }
    }
  }
  ctx.fillStyle = "rgba(20, 12, 30, 0.9)";
  ctx.fillText(text, Math.round(x + 1), Math.round(y + 2));

  ctx.fillStyle = fill;
  ctx.fillText(text, Math.round(x), Math.round(y));
}

function wrapText(text, maxWidth) {
  ctx.font = "8px monospace";
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
      messageText = "Obolon, late summer. Click around to remember.";
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
    // Subtle top scrim for title readability
    ctx.fillStyle = `rgba(13, 10, 23, ${0.42 * titleAlpha})`;
    ctx.fillRect(0, 0, WIDTH, 44);

    if (titleAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = titleAlpha;
      drawOutlinedText(
        "Obolon Memories",
        WIDTH / 2,
        22,
        "bold 18px Georgia, serif",
        "#fff0c8",
        "#1a1224"
      );
      ctx.restore();
    }

    if (state === "ready") {
      const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(elapsed * 3.2));
      ctx.save();
      ctx.globalAlpha = pulse;
      drawOutlinedText(
        "Click or press any key",
        WIDTH / 2,
        HEIGHT - 12,
        "8px monospace",
        "#fff0d2",
        "#140c1e"
      );
      ctx.restore();
    }
  } else if (state === "vignette") {
    // Hover label
    if (hoveredHotspot) {
      drawOutlinedText(
        hoveredHotspot.name,
        WIDTH / 2,
        12,
        "bold 8px monospace",
        "#ffe5a3",
        "#140c1e"
      );
    }

    // Dialog / narration box at bottom
    if (messageTimer > 0 && messageText) {
      const lines = wrapText(messageText, WIDTH - 24);
      const boxH = lines.length * 10 + 10;
      const boxY = HEIGHT - boxH - 4;
      ctx.fillStyle = "rgba(13, 10, 23, 0.82)";
      ctx.fillRect(6, boxY, WIDTH - 12, boxH);
      ctx.strokeStyle = "rgba(255, 229, 163, 0.45)";
      ctx.strokeRect(6.5, boxY + 0.5, WIDTH - 13, boxH - 1);

      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#fff4dc";
      lines.forEach((line, i) => {
        ctx.fillText(line, WIDTH / 2, boxY + 5 + i * 10);
      });
    }
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
  if (state === "vignette") {
    hoveredHotspot =
      hotspots.find(
        (h) => mouse.x >= h.x && mouse.x <= h.x + h.w && mouse.y >= h.y && mouse.y <= h.y + h.h
      ) || null;
    canvas.style.cursor = hoveredHotspot ? "pointer" : "default";
  } else {
    canvas.style.cursor = "pointer";
  }
});

function handleContinue() {
  if (state === "ready") {
    state = "fade_out";
  }
}

canvas.addEventListener("click", (e) => {
  if (state === "ready") {
    handleContinue();
    return;
  }
  if (state === "vignette") {
    const pos = getCanvasCoords(e);
    const hit = hotspots.find(
      (h) => pos.x >= h.x && pos.x <= h.x + h.w && pos.y >= h.y && pos.y <= h.y + h.h
    );
    if (hit) {
      messageText = hit.text;
      messageTimer = 4.5;
    }
  }
});

window.addEventListener("keydown", () => {
  handleContinue();
});

requestAnimationFrame(loop);
