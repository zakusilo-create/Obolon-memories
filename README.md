# Obolon Memories

A `320×200` pixel-art point-and-click vignette game running directly in the browser (HTML5 Canvas).

## Play Locally

Just open `index.html` in your browser, or run any local static server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Project Structure

```text
├── index.html          # 320x200 crisp-scaled game page
├── style.css           # Pixel-perfect framing & layout
├── game.js             # Splash screen & vignette scene engine
└── assets/
    └── art/
        └── splash_screen.jpeg
```
