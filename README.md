# Soon Family Christmas Lucky Draw 2025

**Last Light Standing**: a suspense-driven lucky draw for the family Christmas party. Every family member is a glowing bulb on a painted Christmas tree. Press **Space**:

1. The tree powers up and the lights flicker, then go out in waves until four are left.
2. A camera zooms in on each of the last four lights in turn.
3. The four drop in as glass baubles on ribbons. They crack (sometimes just to tease), and two shatter.
4. A spotlight swings between the final two and slows down. After a beat of silence, the loser shatters.
5. The winner's bauble rises and lights the star, and the whole tree relights.

The same tree also picks players for party games.

**Live:** https://marcusneo4.github.io/Christmas-2025/

## Running it

- **Online:** open the link above.
- **Offline:** double-click `index.html`, or run `START_SERVER.bat` (uses Python if installed).

The screen is laid out at 1920×1080 and scales to fit any window. Press F11 for full screen on the TV.

## On the night

1. **Setup:** check the contestant list (the family list is pre-filled) and the prize board. Both are editable, and edits are saved in this browser. You can also upload a CSV or TXT file of names.
2. **Start the lucky draw:** each prize is announced first. Press **Space** (or click the tree) to light the tree and run the round, then **Space** again for the next prize. The *Suspense* setting on the setup screen controls the length of each round:
   - *Auto* (default): the full show (about 50 seconds) for ranked prizes, a quick version (about 25 seconds) for bonus prizes.
   - *Full*: the full show for every prize.
   - *Quick*: the quick version for every prize.

   The grand prize always gets the full show.
3. **Results:** after the grand prize, the full winners board appears. Download it as a text file.

| Key | Action |
| --- | --- |
| Space / Enter / → | Light the tree / next prize / pick a player |
| S | Draw every remaining prize instantly (asks first) |
| Esc | Back to setup |
| M | Sound on/off |

If the page is reloaded mid-draw, setup shows **Resume draw**. Wins already revealed are kept, and a round that was interrupted replays with the same result.

## Fairness

Nobody is chosen in advance. Each winner is picked the moment the host presses Space, using `crypto.getRandomValues`, the browser's cryptographic random number generator; the waves of lights going out are random too. Each person can win once. Names that appear twice are counted once, and setup tells you which ones, so add a surname if two different people share a name.

## Editing defaults

Default names and prizes live in `js/data.js`. Prizes are drawn top to bottom; any prize label containing "Bonus" gets a blue ball.

## Files

```
index.html        screens: setup, draw, results
css/styles.css    the night-time tree look
js/data.js        default names and prizes
js/store.js       saving to the browser + fair randomness
js/audio.js       synthesized soundscape: heartbeat, bells, sleigh bells, power-downs
js/fx.js          confetti
js/scene.js       painted fir tree, drifting bokeh, falling snow (canvas)
js/tree.js        the show: light waves, camera roll-call, glass baubles, spotlight, star
js/draw.js        prize rounds, game-player picks, results
js/app.js         setup screen, keyboard, screen switching
fonts/            Big Shoulders Display and Archivo (self-hosted)
vendor/gsap.min.js  GSAP 3.13 animation library (local copy, works offline)
```
