# 🌸 Nuôi Sen (Grow Lotus) — Web Game
https://mikengovn.github.io/nuoi-sen/

The **VietMoney "Nuôi Sen"** mini-game was built in plain
HTML5 + Canvas + JavaScript from the original `main.py` by Michael Ngo @ EUI VietMoney in 2025. 
The target of the game is to build deep and profitable customer life-cycle through this gamification, 
boosting interactions and retention rates of the VietMoney Remittance APP.

**Core Mechanic**     → Virtual lotus flower-growing with the frequency of money transfers within the APP. 
**Primary Goal**      → Increase remittance activity and user retention
**Rewards**           → Gifts every round, lottery opportunities, final real gold-asset prizes
**Progress Tracking** → Levels (e.g., Level 7/9), XP progress
**Social Features**   → Ranking, Grow Lotus Together
**Other Elements**    → Daily tasks, time-limited offers

Users need to complete missions or remit to obtain chance to grow the lotus Tap the **Nuôi Sen**
button to grow your lotus mascot, fill the progress bar toward the final gift, and reach the golden bloom.

---

## ✨ Design Guidelines

**Stages of Growth**

- The 10 mascots should represent a progression from a baby lotus bud to a fully mature, blooming lotus.

- Consider organizing them into 5 main growth stages with 2 variations per stage for distinct designs:

**Baby Bud 1**: Tiny closed bud, pale pink, small shy face, tiny beige hat.
**Baby Bud 2**: Closed bud with a leaf accessory, curious expression.
**Opening Bud 1**: Slightly open bud, light pink petals, small hat, timid smile.
**Opening Bud 2**: Bud with a few petals, yellow star pin, confident grin.
**Half-Bloom 1**: Half-open lotus, medium pink petals, hat, cheerful smile.
**Half-Bloom 2**: Half-open with red shirt, playful wink.
**Near-Mature 1**: Mostly open lotus, bright pink petals, full hat, joyful face.
**Near-Mature 2**: Near-bloom with red overalls, coin accessory, big smile.
**Mature 1**: Full bloom, vibrant pink petals, hat, red/yellow outfit with confident stance.
**Mature 2**: Full bloom, alternate outfit color (e.g., yellow overalls), proud expression.

**Cultural Elements**
The lotus, widely considered a symbol of Vietnam, has long been used as a metaphor to describe Vietnamese people: 
from the mud grows a strong and resilient flower. Using lotus and conical hat - nón lá, which have been 
the familiar companion, evoking the simple and rustic beauty of Vietnamese diasporas living abroad. 

---

## ▶️ Run it locally

**Double-click** `index.html` — it opens in your browser and works offline.

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
belong to their respective owners (Michael Ngo).*
