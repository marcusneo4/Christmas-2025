/* "Last Light Standing", act by act:
   1. the tree powers up            4. the finalists drop in as glass baubles
   2. waves of lights go out        5. baubles crack… and shatter
   3. a camera roll-call of the     6. a spotlight decides the final two,
      last four lights                 silence, and the winner lights the star
   Choreographed with GSAP; every wait is cancellable. */
(function () {
  const $ = (id) => document.getElementById(id);
  const wrap = $('tree-wrap');
  const camera = $('camera');
  const canvas = $('tree-canvas');
  const lightsEl = $('lights');
  const halosEl = $('halos');
  const svg = $('tree-svg');
  const finalsEl = $('finals');
  const beam = $('beam');
  const star = $('star');
  const plate = $('winner-plate');
  const closeup = $('closeup');
  const flash = $('flash');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const CX = 660, CY = 540, TOP = 262, BASE = 836, HALF = 540, HANG_Y = 640;
  const COLORS = ['#ff4d4d', '#ffae2b', '#3fd27f', '#4da3ff', '#ff73bd', '#ffe14d'];
  const BULB = '<svg class="c9" viewBox="0 0 20 34" aria-hidden="true"><rect class="sock" x="5.5" y="0" width="9" height="10" rx="1.5"/><path class="ridge" d="M5.5 3.5h9M5.5 6.5h9"/><path class="glass" d="M10 8.5c-5.2 2.6-6.6 10.6-4.2 17.6 1 2.9 2.6 5.4 4.2 6.4 1.6-1 3.2-3.5 4.2-6.4 2.4-7 1-15-4.2-17.6z"/><path class="shine" d="M7.4 14.5c-1 3.2-1 7.4.3 11"/></svg>';

  let lights = new Map();   // name → { el, halo, x, y }
  let speed = 1;
  let token = 0;
  let painted = false;
  let sway = null;

  const S = (sec) => sec * speed;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms * speed));
  const rand = (n) => XMAS.random.randomInt(n);
  const pick = (arr, n) => XMAS.random.shuffle(arr).slice(0, n);
  const tween = (target, vars) => new Promise((res) => gsap.to(target, { ...vars, onComplete: res }));

  /* ---------- Layout ---------- */
  function rowsFor(n) {
    const R = Math.max(3, Math.min(9, Math.round(Math.sqrt(n * 1.05))));
    const sum = (R * (R + 1)) / 2;
    const counts = Array.from({ length: R }, (_, r) => Math.max(1, Math.floor((n * (r + 1)) / sum)));
    let diff = n - counts.reduce((a, b) => a + b, 0);
    for (let r = R - 1; diff > 0; r = (r - 1 + R) % R) { counts[r]++; diff--; }
    for (let r = R - 1; diff < 0; r = (r - 1 + R) % R) { if (counts[r] > 1) { counts[r]--; diff++; } }
    return counts;
  }

  function layout(names, { won = new Set(), picked = new Set() } = {}) {
    if (!painted) { XMAS.scene.paintTree(canvas); painted = true; }
    lightsEl.innerHTML = '';
    halosEl.innerHTML = '';
    lights = new Map();
    const counts = rowsFor(names.length);
    const R = counts.length;
    const fs = Math.max(15, Math.min(28, 30 - (names.length - 24) * 0.2));
    const rows = counts.map((c, r) => ({
      c,
      y: TOP + (R === 1 ? 0 : (r * (BASE - TOP)) / (R - 1)),
      w: 60 + (HALF - 60) * (R === 1 ? 1 : r / (R - 1)),
      sag: 12 + r * 2.5
    }));
    svg.innerHTML = rows.map((row) =>
      `<path d="M${CX - row.w - 40} ${row.y - 6} Q${CX} ${row.y + row.sag * 2} ${CX + row.w + 40} ${row.y - 6}" fill="none" stroke="#132a19" stroke-width="2.4"/>`).join('');

    let i = 0;
    rows.forEach((row) => {
      for (let k = 0; k < row.c; k++) {
        const name = names[i];
        const t = row.c === 1 ? 0.5 : k / (row.c - 1);
        const x = CX - row.w + t * row.w * 2;
        const u = (x - CX) / (row.w + 40);
        const yWire = row.y + row.sag * (1 - u * u);
        const drop = row.c > 4 && k % 2 ? 34 : 6;
        const color = COLORS[(i * 7) % COLORS.length];
        const el = document.createElement('div');
        el.className = 'light';
        el.style.left = x + 'px';
        el.style.top = yWire + 'px';
        el.style.setProperty('--c', color);
        el.style.setProperty('--drop', drop + 'px');
        el.style.setProperty('--fs', fs + 'px');
        const room = row.c === 1 ? 300 : Math.max(86, ((row.w * 2) / (row.c - 1)) * (row.c > 4 ? 1.9 : 0.95));
        el.style.setProperty('--room', room + 'px');
        el.innerHTML = BULB + '<span class="nm"></span>';
        el.lastChild.textContent = name;
        if (won.has(name)) el.classList.add('won');
        if (picked.has(name)) el.classList.add('picked');
        lightsEl.append(el);
        const halo = document.createElement('i');
        halo.className = 'halo';
        halo.style.left = x + 'px';
        halo.style.top = (yWire + drop + 20) + 'px';
        halo.style.setProperty('--c', color);
        halosEl.append(halo);
        lights.set(name, { el, halo, x, y: yWire + drop + 20, color });
        i++;
      }
    });
    requestAnimationFrame(() => {
      lights.forEach(({ el }) => {
        const nm = el.lastChild;
        const room = parseFloat(el.style.getPropertyValue('--room'));
        let size = fs;
        while (nm.scrollWidth > room && size > 12) { size -= 1; nm.style.fontSize = size + 'px'; }
      });
    });
  }

  function lit(name, on) {
    const l = lights.get(name);
    l.el.classList.toggle('on', on);
    l.el.classList.toggle('off', !on);
    l.halo.classList.toggle('on', on);
  }

  /* ---------- Helpers ---------- */
  function setStatus(num, text) {
    const n = $('status-num');
    if (num === null) n.hidden = true;
    else { n.hidden = false; n.textContent = num; }
    $('status-text').textContent = text;
  }

  function camTo(px, py, scale, dur, ease = 'power3.inOut') {
    return tween(camera, { x: CX - px * scale, y: CY - py * scale, scale, duration: reduce.matches ? 0 : S(dur), ease });
  }
  function camHome(dur = 1.2) { return tween(camera, { x: 0, y: 0, scale: 1, duration: reduce.matches ? 0 : S(dur), ease: 'power3.inOut' }); }

  function flashOnce(strength = 0.55) {
    gsap.fromTo(flash, { opacity: strength }, { opacity: 0, duration: 0.5, ease: 'power2.out' });
  }

  function reset() {
    token++;
    XMAS.audio.stopAll();
    if (sway) { sway.kill(); sway = null; }
    gsap.killTweensOf([camera, flash, closeup, '.hang', '.bauble', '.crack-lvl', '.ribbon']);
    gsap.set(camera, { x: 0, y: 0, scale: 1, transformOrigin: '0 0' });
    wrap.className = 'tree-wrap';
    wrap.style.setProperty('--dark', 0);
    XMAS.scene.setDim(0);
    finalsEl.innerHTML = '';
    beam.className = 'beam';
    plate.className = 'winner-plate';
    closeup.className = 'closeup';
    star.classList.remove('lit');
    lights.forEach(({ el, halo }) => {
      el.classList.remove('on', 'off', 'hot', 'hotter', 'lifted', 'party', 'flick', 'dip', 'focus');
      halo.className = 'halo';
    });
  }

  function markWon(name) { const l = lights.get(name); if (l) l.el.classList.add('won'); }
  function markPicked(name) { const l = lights.get(name); if (l) l.el.classList.add('picked'); }
  function clearPicked() { lights.forEach(({ el }) => el.classList.remove('picked')); }

  /* ---------- Baubles ---------- */
  function crackSvg() {
    const levels = [];
    for (let lv = 0; lv < 3; lv++) {
      let paths = '';
      const ox = 70 + Math.random() * 60, oy = 70 + Math.random() * 60;
      const arms = 2 + lv;
      for (let a = 0; a < arms; a++) {
        let x = ox, y = oy;
        let ang = Math.random() * Math.PI * 2;
        let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
        const segs = 4 + Math.floor(Math.random() * 4);
        for (let s = 0; s < segs; s++) {
          ang += (Math.random() - 0.5) * 1.1;
          const len = 10 + Math.random() * 18;
          x += Math.cos(ang) * len; y += Math.sin(ang) * len;
          d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
        }
        paths += `<path pathLength="1" d="${d}"/>`;
      }
      levels.push(`<g class="crack-lvl">${paths}</g>`);
    }
    return `<svg class="cracks" viewBox="0 0 200 200" aria-hidden="true">${levels.join('')}</svg>`;
  }

  function makeHang(name, color, x) {
    const hang = document.createElement('div');
    hang.className = 'hang';
    hang.style.left = x + 'px';
    hang.style.height = HANG_Y + 'px';
    hang.innerHTML = `<i class="ribbon"></i><div class="bauble"><i class="cap"></i><div class="glass">${crackSvg()}<b class="bn"></b></div></div>`;
    hang.style.setProperty('--c', color);
    hang.querySelector('.bn').textContent = name;
    finalsEl.append(hang);
    const bn = hang.querySelector('.bn');
    requestAnimationFrame(() => {
      let size = 54;
      bn.style.fontSize = size + 'px';
      while (bn.scrollWidth > 176 && size > 22) { size -= 2; bn.style.fontSize = size + 'px'; }
    });
    return { name, hang, x, crack: 0, bauble: hang.querySelector('.bauble') };
  }

  function addCrack(b, sound = 0.6) {
    if (b.crack >= 3) return;
    const lvl = b.hang.querySelectorAll('.crack-lvl')[b.crack];
    b.crack++;
    gsap.set(lvl, { opacity: 1 });
    gsap.fromTo(lvl.querySelectorAll('path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.out' });
    gsap.fromTo(b.bauble, { rotation: -4 }, { rotation: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    XMAS.audio.crack(sound);
  }

  async function smash(b, alive) {
    while (b.crack < 3) { addCrack(b, 1); await wait(260); if (!alive()) return; }
    gsap.to(b.bauble, { x: '+=6', duration: 0.05, repeat: 9, yoyo: true, ease: 'none' });
    await wait(550);
    if (!alive()) return;
    const r = b.bauble.querySelector('.glass').getBoundingClientRect();
    XMAS.fx.shatter(r.left + r.width / 2, r.top + r.height / 2, b.hang.style.getPropertyValue('--c'), r.width / 220);
    XMAS.audio.shatter();
    flashOnce(0.35);
    gsap.set(b.bauble, { opacity: 0 });
    gsap.to(b.hang.querySelector('.ribbon'), { scaleY: 0, transformOrigin: '50% 0%', duration: 0.5, ease: 'power3.in' });
  }

  /* ---------- The show ---------- */
  async function run({ pool, winner, grand = false, quick = false, plateLabel = 'Lights the star!', prizeText = '' }) {
    reset();
    const my = token;
    const alive = () => my === token;
    speed = grand ? 1.15 : quick ? 0.6 : 1;
    const A = XMAS.audio;
    const total = pool.length;
    wrap.classList.add('running');

    // ACT 1 — power up, top to bottom
    setStatus(total, 'lights on the tree');
    A.powerUp();
    const order = pool.slice().sort((a, b) => lights.get(a).y - lights.get(b).y);
    order.forEach((name) => {
      const l = lights.get(name);
      const at = ((l.y - TOP) / (BASE - TOP)) * 1.2 + Math.random() * 0.15;
      gsap.delayedCall(S(at), () => { if (alive()) lit(name, true); });
    });
    A.lightsOn(S(1.4) + 0.2);
    await wait(2000);
    if (!alive()) return false;
    gsap.to(camera, { x: CX - CX * 1.05, y: CY - 600 * 1.05, scale: 1.05, duration: S(16), ease: 'none' });

    let survivors = pool.slice();
    let bpm = 64;
    A.heartbeat(bpm);
    A.tension(0.05);
    await wait(500);

    // ACT 2 — waves of lights going out
    let wave = 0;
    while (survivors.length > 4) {
      if (!alive()) return false;
      const len = survivors.length;
      const next = len > 12 ? Math.max(4, Math.round(len * 0.4)) : 4;
      const losers = pick(survivors.filter((n) => n !== winner), len - next);

      // anticipation: every light dips at once
      setStatus(len, wave === 0 ? 'The lights are flickering…' : 'Here it comes again…');
      survivors.forEach((n) => lights.get(n).el.classList.add('dip'));
      A.buzz(0.7);
      await wait(800);
      survivors.forEach((n) => lights.get(n).el.classList.remove('dip'));
      if (!alive()) return false;

      setStatus(len, 'Lights out…');
      const dur = (wave === 0 ? 2200 : 1800) * speed;
      A.lightsOut(dur / 1000, Math.min(12, losers.length));
      let remaining = len;
      losers.forEach((name) => {
        const at = Math.random() * dur * 0.85;
        setTimeout(() => {
          if (!alive()) return;
          const el = lights.get(name).el;
          el.classList.add('flick');
          setTimeout(() => { el.classList.remove('flick', 'hot', 'hotter'); lit(name, false); }, 260);
          remaining--;
          $('status-num').textContent = remaining;
        }, at);
      });
      await wait(dur / speed + 300);
      if (!alive()) return false;
      survivors = survivors.filter((n) => !losers.includes(n));
      setStatus(survivors.length, survivors.length > 4 ? 'still glowing' : 'lights left');
      survivors.forEach((name) => {
        const el = lights.get(name).el;
        el.classList.toggle('hot', survivors.length <= 30);
        el.classList.toggle('hotter', survivors.length <= 12);
      });
      const darkness = Math.min(0.85, 1 - survivors.length / total);
      wrap.style.setProperty('--dark', darkness);
      XMAS.scene.setDim(darkness);
      wave++;
      bpm += 12;
      A.heartbeat(bpm);
      A.tension(Math.min(0.7, 0.2 + wave * 0.18));
      await wait(1100);
    }
    if (!alive()) return false;

    // ACT 3 — roll call: the camera visits each remaining light
    const finals = XMAS.random.shuffle(survivors);
    gsap.killTweensOf(camera);
    if (!quick && finals.length > 1) {
      setStatus(finals.length, finals.length === 4 ? 'Four lights left' : `${finals.length} lights left`);
      wrap.classList.add('rollcall');
      for (const name of finals) {
        if (!alive()) return false;
        const l = lights.get(name);
        lights.forEach((o, n) => o.el.classList.toggle('focus', n === name));
        await camTo(l.x, l.y - 10, 2.6, 0.9);
        if (!alive()) return false;
        closeup.querySelector('b').textContent = name;
        closeup.className = 'closeup show';
        A.boom();
        await wait(1000);
        closeup.className = 'closeup';
      }
      lights.forEach((o) => o.el.classList.remove('focus'));
      wrap.classList.remove('rollcall');
      await camHome(1.1);
      if (!alive()) return false;
    } else {
      await camHome(0.6);
    }

    // ACT 4 — the finalists drop in as glass baubles
    setStatus(finals.length, finals.length === 1 ? 'only one light left' : 'Who will crack?');
    wrap.classList.add('focus');
    const gap = 280;
    const baubles = finals.map((name, i) => {
      const x = CX + (i - (finals.length - 1) / 2) * gap;
      const l = lights.get(name);
      l.el.classList.add('lifted');
      return makeHang(name, l.color, x);
    });
    A.whoosh(1);
    const hangs = baubles.map((b) => b.hang);
    gsap.fromTo(hangs, { y: -900, rotation: () => (Math.random() - 0.5) * 24 },
      { y: 0, duration: reduce.matches ? 0 : S(1.2), ease: 'bounce.out', stagger: S(0.2) });
    gsap.to(hangs, { rotation: 0, duration: S(2.6), ease: 'elastic.out(1, 0.25)', delay: S(0.9) });
    await wait(1600 + baubles.length * 200);
    if (!alive()) return false;
    if (!reduce.matches) {
      sway = gsap.to(hangs, { rotation: '+=1.6', duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: 0.35, from: 'random' } });
    }

    // ACT 5 — cracks, teases and shattering
    let left = baubles.slice();
    while (left.length > 2) {
      setStatus(left.length, left.length === 4 ? 'Who will crack?' : 'One more will break…');
      A.tension(0.8);
      const teases = 2 + rand(2);
      for (let t = 0; t < teases; t++) {
        const b = left[rand(left.length)];
        if (b.crack < 2) addCrack(b, 0.5);
        await wait(650 + rand(500));
        if (!alive()) return false;
      }
      const losers = left.filter((b) => b.name !== winner);
      const out = losers[rand(losers.length)];
      await smash(out, alive);
      if (!alive()) return false;
      left = left.filter((b) => b !== out);
      bpm += 10;
      A.heartbeat(bpm);
      await wait(1400);
    }
    if (!alive()) return false;

    // ACT 6 — the final two and the spotlight
    const target = left.find((b) => b.name === winner);
    if (left.length === 2) {
      setStatus(2, 'Final two');
      left.forEach((b, i) => {
        b.x = CX + (i - 0.5) * 520;
        gsap.to(b.hang, { left: b.x, duration: S(1), ease: 'power3.inOut' });
        gsap.to(b.bauble, { scale: 1.3, duration: S(1), ease: 'power3.inOut' });
      });
      A.whoosh(0.8);
      await wait(1300);
      if (!alive()) return false;
      A.heartbeat(122);
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
        const b = left[pos];
        beam.style.left = b.x + 'px';
        left.forEach((k) => k.hang.classList.toggle('lit', k === b));
        A.tick(1 + (h % 2) * 0.12);
        if (h === hops) break;
        let pause = interval;
        if (nudge && h === hops - 1) pause = interval * 2.6;
        await wait(pause);
        interval *= 1.19;
        pos = 1 - pos;
      }
    } else {
      beam.style.left = target.x + 'px';
      beam.classList.add('show');
      target.hang.classList.add('lit');
    }

    // silence
    A.stopHeartbeat();
    A.stopTension(0.25);
    wrap.classList.add('hush');
    if (sway) { sway.kill(); sway = null; }
    await wait(1700);
    if (!alive()) return false;

    const loser = left.find((b) => b !== target);
    if (loser) {
      await smash(loser, alive);
      if (!alive()) return false;
      await wait(500);
    }

    // ACT 7 — the winner's bauble rises and lights the star
    beam.className = 'beam';
    wrap.classList.remove('hush');
    target.hang.classList.add('chosen');
    target.hang.querySelectorAll('.crack-lvl').forEach((g) => gsap.to(g, { opacity: 0, duration: 0.4 }));
    gsap.set(target.hang, { rotation: 0 });
    A.whoosh(1.2);
    await tween(target.hang, { left: CX, y: -(HANG_Y - 150), duration: reduce.matches ? 0 : S(1.3), ease: 'power2.in' });
    gsap.to(target.bauble, { scale: 0.2, opacity: 0, duration: 0.3 });
    if (!alive()) return false;

    star.classList.add('lit');
    flashOnce(0.7);
    wrap.classList.remove('focus', 'running');
    wrap.classList.add('celebrate');
    wrap.style.setProperty('--dark', 0);
    XMAS.scene.setDim(0);
    A.celebrate(grand);
    lights.forEach(({ el, halo, x, y }) => {
      const d = Math.hypot(x - CX, y - 150) / 900;
      gsap.delayedCall(d * 1.1, () => {
        el.classList.remove('off', 'flick', 'hot', 'hotter', 'lifted');
        el.classList.add('party');
        el.style.setProperty('--tw', (Math.random() * 1.6).toFixed(2) + 's');
        halo.className = 'halo party';
      });
    });
    const sr = star.getBoundingClientRect();
    XMAS.fx.burst(sr.left + sr.width / 2, sr.top + sr.height / 2, grand ? 340 : 200);
    if (grand) XMAS.fx.rain(320);

    plate.querySelector('.wp-label').textContent = plateLabel;
    const nameEl = plate.querySelector('.wp-name');
    nameEl.textContent = winner;
    plate.querySelector('.wp-prize').textContent = prizeText;
    plate.className = 'winner-plate show';
    requestAnimationFrame(() => {
      let size = 150;
      nameEl.style.fontSize = size + 'px';
      while (nameEl.scrollWidth > 1100 && size > 60) { size -= 4; nameEl.style.fontSize = size + 'px'; }
    });
    setStatus(null, grand ? 'Grand prize winner!' : 'We have a winner!');
    setTimeout(() => { if (alive()) finalsEl.innerHTML = ''; }, 800);
    await wait(1200);
    return alive();
  }

  /* Instant winner state, used when resuming after a reload. */
  function showWinner(winner, { plateLabel, prizeText }) {
    reset();
    star.classList.add('lit');
    wrap.classList.add('celebrate');
    plate.querySelector('.wp-label').textContent = plateLabel;
    plate.querySelector('.wp-name').textContent = winner;
    plate.querySelector('.wp-prize').textContent = prizeText;
    plate.className = 'winner-plate show';
    lights.forEach(({ el, halo }) => {
      el.classList.add('party');
      el.style.setProperty('--tw', (Math.random() * 1.6).toFixed(2) + 's');
      halo.className = 'halo party';
    });
    setStatus(null, 'We have a winner!');
  }

  XMAS.tree = { layout, reset, run, showWinner, setStatus, markWon, markPicked, clearPicked, cancel: () => { reset(); } };
})();
