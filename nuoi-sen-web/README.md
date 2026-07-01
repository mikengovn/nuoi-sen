# 🌸 Nuôi Sen (Grow Lotus) — Web Game

A phone-friendly web version of the **VietMoney "Nuôi Sen"** mini-game, rebuilt in plain
HTML5 + Canvas + JavaScript from the original `main.py` (pygame). Tap the **Nuôi Sen**
button to grow your lotus mascot through **9 evolving stages**, fill the progress bar toward
the gift, and reach the golden bloom.

No build tools, no frameworks, no server code — just static files. It runs by opening
`index.html`, and it's ready to publish to **GitHub Pages** for public viewing.

---

## ✨ Features

- **Faithful to the original** — same 9 lotus stages, curtain intro, "Nuôi Sen" button,
  progress bar, gift box, background music, and level-up sound (with music ducking).
- **Phone-first** — responsive portrait layout, touch controls, safe-area (notch) support,
  no accidental scroll/zoom.
- **Light & fast** — ~1.3 MB of assets total (the original pygame→WASM build was ~6.7 MB
  plus the Python runtime). Petals and the heart burst are drawn procedurally, so no heavy
  GIF frames are shipped.
- **Extra web niceties** — 🔊 mute toggle, ↻ replay, a loading screen, and a completion
  celebration.

---

## ▶️ Run it locally

**Easiest:** double-click `index.html` — it opens in your browser and works offline.

**If audio doesn't start** on a double-clicked file (some browsers restrict `file://`),
run a tiny local server instead:

```bash
# from inside this folder
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Tap **"Bắt đầu · Tap to start"** once — this is required so the browser allows the music
to play (all browsers block autoplay until the first tap).

---

## 🚀 Publish to GitHub Pages (public link)

### Option A — GitHub website (no command line)

1. Create a new repository on GitHub, e.g. **`nuoi-sen`** (Public).
2. Click **Add file → Upload files**, then drag in **everything inside this folder**
   (`index.html`, `style.css`, `game.js`, the `assets/` folder, and `.nojekyll`).
   > Keep the structure — `index.html` must be at the repository root.
3. Commit the files.
4. Go to **Settings → Pages**.
5. Under **Build and deployment → Source**, choose **Deploy from a branch**.
6. Select branch **`main`** and folder **`/ (root)`**, then **Save**.
7. Wait ~1 minute. Your game will be live at:

   ```
   https://<your-username>.github.io/nuoi-sen/
   ```

### Option B — Command line (git)

```bash
cd nuoi-sen-web                 # this folder

git init
git add .
git commit -m "Nuôi Sen web game"
git branch -M main
git remote add origin https://github.com/<your-username>/nuoi-sen.git
git push -u origin main
```

Then enable Pages via **Settings → Pages → Deploy from a branch → main / root**.

> Tip: to host it at `https://<your-username>.github.io/` (no sub-path), name the repo
> exactly `<your-username>.github.io`.

---

## 📁 Project structure

```
nuoi-sen-web/
├── index.html      # page shell (canvas + loading/start overlay + controls)
├── style.css       # responsive, phone-friendly layout
├── game.js         # the whole game (Canvas port of main.py)
├── .nojekyll       # tells GitHub Pages to serve files as-is
└── assets/
    ├── background1.jpg
    ├── logo.png
    ├── button_image.png
    ├── gift_box.png
    ├── loading_bar_background.png
    ├── loading_bar_fill_0.png … loading_bar_fill_8.png
    ├── lotus1.png … lotus9.png       # the 9 growth stages
    ├── curtain.png
    ├── music.mp3                     # looping background track
    └── yay.mp3                       # level-up sound
```

---

## 🎮 How to play

- Tap **Nuôi Sen** to fertilize — the mascot hops, hearts burst, and it grows one stage.
- The bar fills toward the 🎁 gift; reach stage 9 (the golden lotus) to see **"Sen đã nở!"**.
- **↻** (top-left) restarts. **🔊 / 🔇** (top-right) toggles sound.

---

## 🛠️ Notes on the port

- The canvas renders in the original **736 × 1318** logical space (scaled to fit any screen
  crisply via `devicePixelRatio`), so every element keeps its exact position from `main.py`.
- The two `petal.gif` / `heart.gif` animations (500+ frames combined) are replaced by
  lightweight JavaScript particle systems that reproduce the same effect at any resolution.
- Audio uses `HTMLAudioElement`, which works from `file://` and satisfies mobile
  gesture/autoplay rules once you tap **Start**.

---

*Built from the original `nuoi_sen` pygame project. Mascot art, logo, sounds, and background
belong to their respective owners (VietMoney).*
