# Soon Family Christmas Lucky Draw 2025

A live, TV-lottery-style lucky draw for the family Christmas party. Plug a laptop into the TV, press **Space**, and reveal 17 prizes one by one: drum spin, ball drop, winner banner, confetti. Includes a claw machine for picking party-game players.

**Live:** https://marcusneo4.github.io/Christmas-2025/

## Running it

- **Online:** open the link above.
- **Offline:** double-click `index.html`, or run `START_SERVER.bat` (uses Python if installed).

The screen is laid out at 1920×1080 and scales to fit any window. Press F11 for full screen on the TV.

## On the night

1. **Setup:** check the contestant list (the family list is pre-filled) and the prize board. Both are editable, and edits are saved in this browser. You can also upload a CSV or TXT file of names.
2. **Go live:** each prize is announced first. Press **Space** (or click the white banner) to draw the winner, then **Space** again for the next prize.
3. **Results:** after the grand prize, the full winners board appears. Download it as a text file.

| Key | Action |
| --- | --- |
| Space / Enter / → | Draw / next prize / pick a player |
| S | Skip to results (asks first) |
| Esc | Back to setup |
| M | Sound on/off |

If the page is reloaded mid-draw, setup shows **Resume draw**, and nobody's win is lost.

## Fairness

Winners are chosen up front with a Fisher–Yates shuffle driven by `crypto.getRandomValues`, the browser's cryptographic random number generator. Each person can win once. Names that appear twice are counted once, and setup tells you which ones, so add a surname if two different people share a name.

## Editing defaults

Default names and prizes live in `js/data.js`. Prizes are drawn top to bottom; any prize label containing "Bonus" gets a blue ball.

## Files

```
index.html        screens: setup, draw, claw machine, results
css/styles.css    the studio look
js/data.js        default names and prizes
js/store.js       saving to the browser + fair randomness
js/audio.js       synthesized sound effects and music
js/fx.js          confetti
js/draw.js        the live draw and results
js/claw.js        claw machine
js/app.js         setup screen, keyboard, screen switching
fonts/            Big Shoulders Display and Archivo (self-hosted)
```
