/* "Last Light Standing": every contestant is a bulb on the tree.
   Lights go out in waves, the final four lift off under the lights,
   a spotlight decides between the last two, and the winner lights the star. */
(function () {
  const $ = (id) => document.getElementById(id);
  const wrap = $('tree-wrap');
  const lightsEl = $('lights');
  const svg = $('tree-svg');
  const finalsEl = $('finals');
  const beam = $('beam');
  const star = $('star');
  const plate = $('winner-plate');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const CX = 660, TOP = 262, BASE = 832, HALF = 590, CARD_Y = 640;
  const COLORS = ['#ff5a5a', '#ffb43a', '#47d68a', '#56a8ff', '#ff7fc0', '#ffe066'];

  let lights = new Map();   // name → { el, x, y }
  let speed = 1;
  let token = 0;            // cancels a running show

  const wait = (ms) => new Promise((r) => setTimeout(r, ms * speed));
  const rand = (n) => XMAS.random.randomInt(n);
  const pick = (arr, n) => XMAS.random.shuffle(arr).slice(0, n);

  /* ---------- Layout ---------- */
  function rowsFor(n) {
    const R = Math.max(3, Math.min(9, Math.round(Math.sqrt(n * 1.05))));
    const S = (R * (R + 1)) / 2;
    const counts = Array.from({ length: R }, (_, r) => Math.max(1, Math.floor((n * (r + 1)) / S)));
    let diff = n - counts.reduce((a, b) => a + b, 0);
    for (let r = R - 1; diff > 0; r = (r - 1 + R) % R) { counts[r]++; diff--; }
    for (let r = R - 1; diff < 0; r = (r - 1 + R) % R) { if (counts[r] > 1) { counts[r]--; diff++; } }
    return counts;
  }

  function drawTreeSvg(rows) {
    const R = rows.length;
    const tiers = 4;
    let paths = '';
    for (let i = 0; i < tiers; i++) {
      const yTop = 150 + i * 150;
      const yBot = 330 + i * 190;
      const w = 170 + i * 150;
      const bw = Math.min(HALF + 70, w + 120);
      paths += `<path d="M${CX} ${yTop} L${CX + bw} ${yBot} Q${CX + bw * 0.5} ${yBot + 34} ${CX} ${yBot + 10} Q${CX - bw * 0.5} ${yBot + 34} ${CX - bw} ${yBot} Z" fill="url(#needles)" opacity="${0.75 + i * 0.06}"/>`;
    }
    let garlands = '';
    rows.forEach((row) => {
      garlands += `<path d="M${CX - row.w - 30} ${row.y} Q${CX} ${row.y + row.sag * 2} ${CX + row.w + 30} ${row.y}" fill="none" stroke="#2f4a33" stroke-width="3"/>`;
    });
    svg.innerHTML = `
      <defs>
        <linearGradient id="needles" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#16402a"/><stop offset="1" stop-color="#0c2618"/>
        </linearGradient>
        <linearGradient id="trunk" x1="0" x2="1"><stop offset="0" stop-color="#3a2416"/><stop offset=".5" stop-color="#5a3a22"/><stop offset="1" stop-color="#3a2416"/></linearGradient>
      </defs>
      <rect x="${CX - 46}" y="905" width="92" height="80" fill="url(#trunk)"/>
      ${paths}
      ${garlands}`;
    void R;
  }

  function layout(names, { won = new Set(), picked = new Set() } = {}) {
    lightsEl.innerHTML = '';
    lights = new Map();
    const counts = rowsFor(names.length);
    const R = counts.length;
    const n = names.length;
    const fs = Math.max(15, Math.min(28, 30 - (n - 24) * 0.2));
    const rows = counts.map((c, r) => ({
      c,
      y: TOP + (R === 1 ? 0 : (r * (BASE - TOP)) / (R - 1)),
      w: 70 + (HALF - 70) * (R === 1 ? 1 : r / (R - 1)),
      sag: 10 + r * 2
    }));
    drawTreeSvg(rows);

    let i = 0;
    rows.forEach((row) => {
      for (let k = 0; k < row.c; k++) {
        const name = names[i];
        const t = row.c === 1 ? 0.5 : k / (row.c - 1);
        const x = CX - row.w + t * row.w * 2;
        const u = (x - CX) / (row.w + 30);
        const yWire = row.y + row.sag * (1 - u * u);
        const drop = row.c > 4 && k % 2 ? 34 : 6;
        const el = document.createElement('div');
        el.className = 'light';
        el.style.left = x + 'px';
        el.style.top = yWire + 'px';
        el.style.setProperty('--c', COLORS[(i * 7) % COLORS.length]);
        el.style.setProperty('--drop', drop + 'px');
        el.style.setProperty('--fs', fs + 'px');
        const room = row.c === 1 ? 300 : Math.max(90, ((row.w * 2) / (row.c - 1)) * (row.c > 4 ? 1.9 : 0.95));
        el.style.setProperty('--room', room + 'px');
        el.innerHTML = '<i class="bulb"></i><span class="nm"></span>';
        el.lastChild.textContent = name;
        if (won.has(name)) el.classList.add('won');
        if (picked.has(name)) el.classList.add('picked');
        lightsEl.append(el);
        lights.set(name, { el, x, y: yWire + drop, row: rows.indexOf(row) });
        i++;
      }
    });
    // Shrink any label that is wider than its room.
    requestAnimationFrame(() => {
      lights.forEach(({ el }) => {
        const nm = el.lastChild;
        const room = parseFloat(el.style.getPropertyValue('--room'));
        let size = fs;
        while (nm.scrollWidth > room && size > 12) { size -= 1; nm.style.fontSize = size + 'px'; }
      });
    });
  }

  /* ---------- State helpers ---------- */
  function setStatus(num, text) {
    const n = $('status-num');
    const t = $('status-text');
    if (num === null) n.hidden = true;
    else { n.hidden = false; n.textContent = num; }
    t.textContent = text;
  }

  function reset() {
    token++;
    XMAS.audio.stopAll();
    wrap.className = 'tree-wrap';
    wrap.style.setProperty('--dark', 0);
    finalsEl.innerHTML = '';
    beam.className = 'beam';
    plate.className = 'winner-plate';
    star.classList.remove('lit');
    lights.forEach(({ el }) => el.classList.remove('on', 'off', 'hot', 'hotter', 'lifted', 'party', 'flick'));
  }

  function markWon(name) { const l = lights.get(name); if (l) { l.el.classList.add('won'); } }
  function markPicked(name) { const l = lights.get(name); if (l) l.el.classList.add('picked'); }
  function clearPicked() { lights.forEach(({ el }) => el.classList.remove('picked')); }

  function starPoint() {
    const r = star.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  }

  /* ---------- The show ---------- */
  async function run({ pool, winner, grand = false, quick = false, plateLabel = 'Lights the star!', prizeText = '' }) {
    const my = ++token;
    const alive = () => my === token;
    speed = grand ? 1.15 : quick ? 0.55 : 1;
    const A = XMAS.audio;
    const total = pool.length;

    reset();
    token = my; // reset() bumped it; reclaim
    wrap.classList.add('running');

    // 1. Lights on, top to bottom
    setStatus(total, 'lights on the tree');
    pool.forEach((name) => {
      const l = lights.get(name);
      const delay = ((l.y - TOP) / (BASE - TOP)) * 1300 * speed + rand(220);
      l.el.style.transitionDelay = delay + 'ms';
      l.el.classList.add('on');
    });
    A.lightsOn(1.5 * speed + 0.3);
    await wait(2000);
    if (!alive()) return false;
    pool.forEach((name) => { lights.get(name).el.style.transitionDelay = ''; });

    let survivors = pool.slice();
    let bpm = 64;
    A.heartbeat(bpm);
    A.tension(0.05);
    await wait(600);

    // 2. Waves of lights going out
    let wave = 0;
    while (survivors.length > 4) {
      if (!alive()) return false;
      const len = survivors.length;
      const next = len > 12 ? Math.ceil(len / 2) : 4;
      const losers = pick(survivors.filter((n) => n !== winner), len - next);
      setStatus(len, wave === 0 ? 'Lights out…' : 'Lights out again…');
      const dur = (wave === 0 ? 2200 : 1900) * speed;
      A.lightsOut(dur / 1000, Math.min(12, losers.length));
      let remaining = len;
      losers.forEach((name) => {
        const at = Math.random() * dur * 0.85;
        setTimeout(() => {
          if (!alive()) return;
          const el = lights.get(name).el;
          el.classList.add('flick');
          setTimeout(() => { el.classList.remove('on', 'hot', 'hotter', 'flick'); el.classList.add('off'); }, 260);
          remaining--;
          $('status-num').textContent = remaining;
        }, at);
      });
      await wait(dur / speed + 300);
      if (!alive()) return false;
      survivors = survivors.filter((n) => !losers.includes(n));
      setStatus(survivors.length, survivors.length > 4 ? 'still glowing' : 'left standing');
      survivors.forEach((name) => {
        const el = lights.get(name).el;
        el.classList.toggle('hot', survivors.length <= 16);
        el.classList.toggle('hotter', survivors.length <= 8);
      });
      wrap.style.setProperty('--dark', Math.min(0.85, 1 - survivors.length / total));
      wave++;
      bpm += 10;
      A.heartbeat(bpm);
      A.tension(Math.min(0.7, 0.15 + wave * 0.15));
      await wait(1200);
    }
    if (!alive()) return false;

    // 3. The finalists lift off the tree
    const finals = XMAS.random.shuffle(survivors);
    setStatus(finals.length, finals.length === 1 ? 'only one light left' : `Final ${['', 'one', 'two', 'three', 'four'][finals.length]}`);
    wrap.classList.add('focus');
    A.whoosh(1.1 * speed);
    const gap = Math.min(300, 1120 / Math.max(1, finals.length));
    const cards = finals.map((name, i) => {
      const x = CX + (i - (finals.length - 1) / 2) * gap;
      const l = lights.get(name);
      const card = document.createElement('div');
      card.className = 'card';
      card.style.left = x + 'px';
      card.style.top = CARD_Y + 'px';
      card.style.width = (gap - 24) + 'px';
      card.style.setProperty('--c', l.el.style.getPropertyValue('--c'));
      card.innerHTML = '<i class="bulb"></i><b></b>';
      card.lastChild.textContent = name;
      finalsEl.append(card);
      l.el.classList.add('lifted');
      const dx = l.x - x, dy = l.y - CARD_Y;
      if (!reduce.matches) {
        card.animate(
          [{ transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.3)`, opacity: 0.4 },
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }],
          { duration: 1100 * speed, delay: i * 140 * speed, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }
        );
      }
      // fit long names
      requestAnimationFrame(() => {
        const b = card.lastChild;
        let size = 64;
        while (b.scrollWidth > gap - 80 && size > 28) { size -= 2; b.style.fontSize = size + 'px'; }
      });
      return { name, card, x };
    });
    await wait(1100 + finals.length * 140 + 900);
    if (!alive()) return false;

    // 4. Flicker-offs down to the final two
    let left = cards.slice();
    while (left.length > 2) {
      setStatus(left.length, left.length === 4 ? 'Who goes dark?' : 'One more goes dark…');
      left.forEach((c) => c.card.classList.add('flicker'));
      A.tension(0.8);
      await wait(2300);
      if (!alive()) return false;
      const losers = left.filter((c) => c.name !== winner);
      const out = losers[rand(losers.length)];
      left.forEach((c) => c.card.classList.remove('flicker'));
      out.card.classList.add('out');
      A.clunk();
      left = left.filter((c) => c !== out);
      bpm += 8;
      A.heartbeat(bpm);
      await wait(1500);
    }
    if (!alive()) return false;

    // 5. The spotlight decides
    let target = left.find((c) => c.name === winner);
    if (left.length === 2 && cards.length > 2) {
      // the final two step forward, side by side
      cards.filter((c) => !left.includes(c)).forEach((c) => c.card.classList.add('gone'));
      left.forEach((c, i) => {
        c.x = CX + (i - 0.5) * 470;
        c.card.style.left = c.x + 'px';
        c.card.style.width = '440px';
        c.card.classList.add('duel');
        const b = c.card.lastChild;
        let size = 88;
        b.style.fontSize = size + 'px';
        while (b.scrollWidth > 380 && size > 36) { size -= 2; b.style.fontSize = size + 'px'; }
      });
      A.whoosh(0.7);
      await wait(1100);
      if (!alive()) return false;
    }
    if (left.length === 2) {
      setStatus(2, 'Final two');
      A.heartbeat(118);
      A.tension(1);
      beam.classList.add('show');
      let pos = rand(2);
      const winIdx = left.indexOf(target);
      let hops = 10 + rand(5);
      if ((pos + hops) % 2 !== winIdx) hops++;
      const nudge = Math.random() < 0.45;
      let interval = 150;
      for (let h = 0; h <= hops; h++) {
        if (!alive()) return false;
        const c = left[pos];
        beam.style.left = c.x + 'px';
        left.forEach((k) => k.card.classList.toggle('lit', k === c));
        A.tick(1 + (h % 2) * 0.12);
        if (h === hops) break;
        let pause = interval;
        if (nudge && h === hops - 1) pause = interval * 2.4;
        await wait(pause);
        interval *= 1.19;
        pos = 1 - pos;
      }
    } else {
      beam.classList.add('show');
      beam.style.left = target.x + 'px';
      target.card.classList.add('lit');
    }

    // The silence before the reveal
    A.stopHeartbeat();
    A.stopTension(0.25);
    await wait(1700);
    if (!alive()) return false;

    // 6. The winner lights the star
    cards.forEach((c) => { if (c !== target) c.card.classList.add('gone'); });
    setTimeout(() => { if (alive()) finalsEl.innerHTML = ''; }, 1400);
    beam.className = 'beam';
    star.classList.add('lit');
    wrap.classList.remove('focus');
    wrap.classList.add('celebrate');
    wrap.style.setProperty('--dark', 0);
    A.celebrate(grand);
    target.card.classList.add('rise');
    plate.querySelector('.wp-label').textContent = plateLabel;
    plate.querySelector('.wp-name').textContent = winner;
    plate.querySelector('.wp-prize').textContent = prizeText;
    const nameEl = plate.querySelector('.wp-name');
    nameEl.style.fontSize = '';
    plate.className = 'winner-plate show';
    requestAnimationFrame(() => {
      let size = 150;
      nameEl.style.fontSize = size + 'px';
      while (nameEl.scrollWidth > 1100 && size > 60) { size -= 4; nameEl.style.fontSize = size + 'px'; }
    });
    lights.forEach(({ el }) => { el.classList.remove('off', 'flick', 'hot', 'hotter', 'lifted'); el.classList.add('party'); el.style.setProperty('--tw', (Math.random() * 1.6).toFixed(2) + 's'); });
    const [sx, sy] = starPoint();
    XMAS.fx.burst(sx, sy, grand ? 340 : 200);
    if (grand) XMAS.fx.rain(320);
    setStatus(null, grand ? 'Grand prize winner!' : 'We have a winner!');
    await wait(1200);
    return alive();
  }

  /* Instant "winner" state, used when resuming after a reload. */
  function showWinner(winner, { plateLabel, prizeText }) {
    reset();
    star.classList.add('lit');
    wrap.classList.add('celebrate');
    plate.querySelector('.wp-label').textContent = plateLabel;
    plate.querySelector('.wp-name').textContent = winner;
    plate.querySelector('.wp-prize').textContent = prizeText;
    plate.className = 'winner-plate show';
    lights.forEach(({ el }) => { el.classList.add('party'); el.style.setProperty('--tw', (Math.random() * 1.6).toFixed(2) + 's'); });
    setStatus(null, 'We have a winner!');
  }

  XMAS.tree = { layout, reset, run, showWinner, setStatus, markWon, markPicked, clearPicked, cancel: () => { token++; XMAS.audio.stopAll(); } };
})();
