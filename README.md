# Soon Family Christmas Lucky Draw 2025

**Last Light Standing**: a suspense-driven lucky draw for the family Christmas party. Every family member (up to 150) is a bulb on the spiral garland of a painted Christmas tree. Press **Space**:

1. The tree powers up along its garland, then lights go out in waves until four are left. Names appear on the tree once 40 or fewer lights remain.
2. A camera zooms in on each of the last four lights in turn.
3. The four drop in as glass baubles. Cracks land on anyone, at random, and grow like real glass (impact point, radial cracks, spider-web rings, glints, chips flaking off). One bauble at a time bursts into shards that follow its crack lines.
4. The final two fight a crack duel. **Cracks are never a tell**: sometimes the bauble hanging by a thread survives and the clean one bursts. A spotlight swings between them and stops at random, then silence, then one bursts.
5. The winner's bauble rises and lights the star.

**The 1st prize is different.** After the duel, *both* baubles burst together, the room goes black and completely silent for about five seconds, then a single ember breathes on the dark tree. It catches, and that bulb is the winner. The light runs along the garland until the whole tree is lit.

The same tree also picks players for party games.

**Live:** https://marcusneo4.github.io/Christmas-2025/

## Running it

- **Online:** open the link above.
- **Offline:** double-click `index.html`, or run `START_SERVER.bat` (uses Python if installed).

The screen is laid out at 1920×1080 and scales to fit any window. Press F11 for full screen on the TV.

## On the night

1. **Setup:** check the names (the family list is pre-filled; paste or upload up to 150) and the prizes.
   - **Prizes are in rank order: the top row is the 1st prize.** Labels (1st, 2nd, 3rd…) fill in automatically. Drag the grip to reorder (or Alt+↑/↓), Enter adds a row, or use **Paste** to type the whole list, one prize per line.
   - The draw counts **up from the last prize to the 1st**, so the 1st prize is always the finale. The number of rounds follows the list.
   - **Full show for the top N** prizes (default 5). **The rest**: *Quick* (a short show each), *3 at once* or *5 at once* (one round draws several prizes; the last lights standing win, lowest prize first).
   - The line under the start button shows prizes, names, rounds and an estimated running time.
2. **Rehearse (optional):** *With my list* or *With 150 test names* runs the whole show without saving anything; press **F** to fast-forward ×4.
3. **Start the lucky draw:** each round's prize is announced first. Press **Space** to light the tree, then **Space** again for the next round.
4. **Not here?** After a round, **Not here? Redraw** (or **R**) marks the winner as absent and redraws that prize. For batch rounds you choose which winner. Absent people are skipped for the rest of the night.
5. **Results:** after the 1st prize, the full winners board appears. Download it as a text file.

| Key | Action |
| --- | --- |
| Space / Enter / → | Light the tree / next round / pick a player |
| R | Redraw (winner not here) |
| S | Draw every remaining prize instantly (asks first) |
| F | Fast-forward ×4 (rehearsal only) |
| Esc | Back to setup |
| M | Sound on/off |

If the page is reloaded mid-draw, setup shows **Resume draw**. Wins already revealed are kept, and a round that was interrupted replays with the same result.

## Fairness

Nobody is chosen in advance. Each winner is picked the moment the host presses Space, using `crypto.getRandomValues`, the browser's cryptographic random number generator; the waves of lights going out are random too. Everything after that is theatre: cracks, near-misses and where the spotlight stops are chosen independently of who wins. Each person can win once. Names that appear twice are counted once, and setup tells you which ones, so add a surname if two different people share a name.

## Editing defaults

Default names and prizes live in `js/data.js`. Prizes are listed 1st prize first.

## Files

```
index.html        screens: setup, draw, results
css/styles.css    the night-time tree look
js/data.js        default names and prizes
js/store.js       saving to the browser + fair randomness
js/audio.js       synthesized soundscape: heartbeat, bells, sleigh bells, power-downs
js/fx.js          confetti, glass shards, chips and glitter
js/glass.js       crack engine: impact, radial cracks, spider-web rings, shard cells
js/scene.js       painted fir tree, spiral garland, drifting bokeh, falling snow (canvas)
js/tree.js        the show: canvas lights, waves, roll-call, crack duel, spotlight, 1st-prize finale
js/draw.js        rounds, batch rounds, redraws, rehearsal, results
js/draw.js        prize rounds, game-player picks, results
js/app.js         setup screen, keyboard, screen switching
fonts/            Big Shoulders Display and Archivo (self-hosted)
vendor/gsap.min.js  GSAP 3.13 animation library (local copy, works offline)
```

## Pacing and speed

- The show is now slower and more suspenseful at ×1: the lights power up in a ~5s chase, each bulb fades out slowly with a flicker, and near-miss bulbs almost go out before recovering.
- Names are on the tree from the start when 70 or fewer are in (with 150, they appear at the 64 mark).
- Speed ×1 / ×1.5 / ×2 / ×3: corner button or keys 1–4, any time. The default is remembered and the time estimate follows it.
- Each prize is announced with a drumroll and the name building in.
