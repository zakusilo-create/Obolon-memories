# Obolon Memories

A `320×200` point-and-click vignette game built with **Godot 4.7.2** and **Popochiu 2.2.1**.

## Tech Stack

- **Engine:** Godot 4.7.2 (`GL Compatibility` renderer)
- **Framework:** [Popochiu](https://github.com/carenalgas/popochiu) 2.2.1
- **Native Resolution:** `320×200` (`viewport` stretch mode, `keep` aspect, nearest-neighbor texture filtering, `1280×800` 4× desktop window override)

## Setup

1. Open this repository in **Godot 4.7.2**.
2. Install **Popochiu 2.2.1** into `addons/popochiu/` (via the AssetLib or from the Popochiu 2.2.1 release archive).
3. Enable the **Popochiu** plugin under **Project → Project Settings → Plugins** and run its initial setup wizard (select `320×200` if prompted).

## Project Structure

```text
├── addons/               # Godot plugins (install Popochiu 2.2.1 here)
├── assets/
│   ├── art/              # Sprites, backgrounds, UI art
│   ├── audio/            # Music, ambience, SFX
│   └── fonts/            # Pixel fonts
├── game/
│   ├── autoloads/        # Custom autoloads
│   ├── characters/       # Popochiu characters
│   ├── dialogs/          # Popochiu dialog trees
│   ├── inventory_items/  # Popochiu inventory items
│   └── rooms/            # Popochiu rooms / vignettes
└── project.godot
```
