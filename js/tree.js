/* "Last Light Standing", act by act:
   1. the tree powers up along its garland   5. baubles crack… and shatter (cracks never tell)
   2. waves of lights go out                 6. a crack duel and a spotlight for the final two
   3. a camera roll-call of the last four    7. the winner lights the star
   4. the finalists drop in as glass baubles
   The 1st prize gets its own ending: both finalists explode, the room goes black and silent,
   and a single ember on the tree reveals the winner.
   Lights are drawn on a canvas (smooth with 150+ names); choreography uses GSAP. */
(function () {
  const $ = (id) => document.getElementById(id);
  const wrap = $('tree-wrap');
  const camera = $('camera');
  const cams = [camera, $('camera-top')];
  const canvas = $('tree-canvas');
  const lc = $('lights-canvas');
  const lg = lc.getContext('2d');
  const labelsEl = $('labels');
  const finalsEl = $('finals');
  const beam = $('beam');
  const star = $('star');
  const plate = $('winner-plate');
  const closeup = $('closeup');
  const flash = $('flash');
  const blackout = $('blackout');
  const ember = $('ember');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const G = XMAS.scene.G;
  const CX = G.CX, CY = 540, HANG_Y = 640;
  const NAMES_AT = 40;
  const COLORS = ['#ff4d4d', '#ffae2b', '#3fd27f', '#4da3ff', '#ff73bd', '#ffe14d', '#b48cff'];

  let lights = new Map();   // name → light
  let order = [];           // lights in garland order
  let gl = null;            // garland geometry
  let glFor = -1;
  let speed = 1;
  let timeScale = 1;
  let token = 0;
  let sway = null;
  let timers = new Set();
  let dipUntil = 0;
  let labelsDirty = false;
  const look = { alpha: 1 };

  const S = (sec) => sec * speed;
  const wait = (ms) => new Promise((r) => { const id = setTimeout(() => { timers.delete(id); r(); }, (ms * speed) / timeScale); timers.add(id); });
  const waitRaw = (ms) => new Promise((r) => { const id = setTimeout(() => { timers.delete(id); r(); }, ms / timeScale); timers.add(id); });
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms / timeScale); timers.add(id); };
  const rand = (n) => XMAS.random.randomInt(n);
  const pickOne = (arr) => arr[rand(arr.length)];
  const pick = (arr, n) => XMAS.random.shuffle(arr).slice(0, n);
  const tween = (target, vars) => new Promise((res) => gsap.to(target, { ...vars, onComplete: res }));
  const A = () => XMAS.audio;

  function rgbOf(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

  /* ---------- Glow sprites (one per colour, drawn additively) ---------- */
  const sprites = new Map();
  function sprite(hex) {
    if (sprites.has(hex)) return sprites.get(hex);
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const [r, gg, b] = rgbOf(hex);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${r},${gg},${b},1)`);
    gr.addColorStop(0.18, `rgba(${r},${gg},${b},.55)`);
    gr.addColorStop(0.5, `rgba(${r},${gg},${b},.14)`);
    gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    sprites.set(hex, c);
    return c;
  }

  /* ---------- Canvas sizing ---------- */
  let px = 1;
  function sizeLights() {
    const rect = lc.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = rect.width / G.W || 1;
    px = scale * dpr;
    lc.width = Math.max(1, Math.round(G.W * px));
    lc.height = Math.max(1, Math.round(G.H * px));
  }
  addEventListener('resize', () => requestAnimationFrame(sizeLights));

  /* ---------- Layout ---------- */
  function layout(names, { won = new Set(), picked = new Set() } = {}) {
    if (glFor !== names.length) {
      gl = XMAS.scene.garland(names.length);
      XMAS.scene.paintTree(canvas, gl);
      glFor = names.length;
    }
    labelsEl.innerHTML = '';
    lights = new Map();
    order = [];
    const n = names.length;
    names.forEach((name, i) => {
      const s = ((i + 0.5) / n) * gl.length;
      const p = XMAS.scene.along(gl, s);
      const color = COLORS[(i * 5 + (i >> 2)) % COLORS.length];
      const label = document.createElement('span');
      label.className = 'tag';
      label.textContent = name;
      labelsEl.append(label);
      const L = {
        name, color, s0: s, s, x: p.x, y: p.y, d: p.d,
        tilt: ((i * 7919) % 100) / 100 * 0.5 - 0.25,
        b: 0, tb: 0, fl: 0, pop: 0, hot: 0, tw: Math.random() * 6.28,
        won: won.has(name), picked: picked.has(name), lifted: false, party: false, dead: false,
        label, lx: 0, ly: 0, show: false
      };
      lights.set(name, L);
      order.push(L);
    });
    sizeLights();
    showLabels(n <= 24 ? order : [], false);
  }

  function setPos(L, s) {
    L.s = s;
    const p = XMAS.scene.along(gl, s);
    L.x = p.x; L.y = p.y; L.d = p.d;
  }

  /* ---------- Name labels: only shown once the field is small enough to read ---------- */
  function labelSize(count) { return count <= 4 ? 40 : count <= 12 ? 32 : count <= 24 ? 27 : 23; }

  function placeLabels(list, positions) {
    const fs = labelSize(list.length);
    labelsEl.style.setProperty('--lfs', fs + 'px');
    const placed = [];
    const items = list.map((L) => ({ L, pos: positions.get(L) || { x: L.x, y: L.y } }))
      .sort((a, b) => a.pos.y - b.pos.y);
    items.forEach(({ L, pos }) => {
      const w = L.label.offsetWidth || fs * L.name.length * 0.5;
      const h = fs * 1.05;
      const bulb = 30 * (0.78 + 0.3 * (pos.d ?? 1));
      const options = [bulb + 2, -bulb - h + 6, bulb + h + 2, -bulb - h * 2 + 2, bulb + h * 2 + 2];
      let best = options[0];
      for (const dy of options) {
        const r = { x: pos.x - w / 2 - 6, y: pos.y + dy, w: w + 12, h };
        if (!placed.some((q) => r.x < q.x + q.w && r.x + r.w > q.x && r.y < q.y + q.h && r.y + r.h > q.y)) { best = dy; break; }
      }
      placed.push({ x: pos.x - w / 2 - 6, y: pos.y + best, w: w + 12, h });
      L.ly = best;
    });
  }

  function showLabels(list, animate = true) {
    const set = new Set(list);
    order.forEach((L) => {
      L.show = set.has(L);
      L.label.classList.toggle('on', L.show);
      L.label.classList.toggle('instant', !animate);
    });
    if (list.length) placeLabels(list, new Map());
    labelsDirty = true;
  }

  /* Survivors slide along the garland to spread out evenly, so their names have room. */
  function spread(list, dur = 1) {
    const sorted = list.slice().sort((a, b) => a.s - b.s);
    const m = sorted.length;
    const margin = gl.length * 0.04;
    const targets = new Map();
    sorted.forEach((L, i) => {
      const s = margin + ((i + 0.5) / m) * (gl.length - margin * 2);
      targets.set(L, { s, ...XMAS.scene.along(gl, s) });
    });
    order.forEach((L) => { L.show = targets.has(L); L.label.classList.toggle('on', L.show); L.label.classList.remove('instant'); });
    placeLabels(sorted, targets);
    sorted.forEach((L) => {
      const t = targets.get(L);
      const o = { s: L.s };
      gsap.to(o, { s: t.s, duration: reduce.matches ? 0 : S(dur), ease: 'power2.inOut', onUpdate: () => { setPos(L, o.s); labelsDirty = true; } });
    });
    labelsDirty = true;
  }

  function updateLabels() {
    order.forEach((L) => {
      if (!L.show) return;
      L.label.style.transform = `translate(${L.x.toFixed(1)}px, ${(L.y + L.ly).toFixed(1)}px) translateX(-50%)`;
      L.label.classList.toggle('lit', L.b > 0.5 && !L.dead);
      L.label.classList.toggle('dead', L.dead);
    });
  }

  /* ---------- Render loop ---------- */
  const FLICK = [1, 0.15, 0.9, 0.05, 0.7, 0, 0.35, 0];
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!wrap.offsetParent) return;
    if (labelsDirty) { updateLabels(); labelsDirty = false; }

    const cx = gsap.getProperty(camera, 'x') || 0;
    const cy = gsap.getProperty(camera, 'y') || 0;
    const cs = gsap.getProperty(camera, 'scaleX') || 1;
    lg.setTransform(px, 0, 0, px, 0, 0);
    lg.clearRect(0, 0, G.W, G.H);
    if (look.alpha <= 0.01) return;

    const dip = now < dipUntil ? (Math.floor(now / 70) % 3 === 0 ? 0.25 : 0.85) : 1;
    order.forEach((L) => {
      if (L.party) L.b = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(now / 380 + L.tw));
      else L.b += (L.tb - L.b) * Math.min(1, dt * 14);
      if (L.fl) {
        const k = Math.floor((now - L.fl) / 40);
        if (k >= FLICK.length) { L.fl = 0; L.b = 0; L.tb = 0; L.pop = 1; L.dead = true; labelsDirty = true; }
        else L.b = FLICK[k];
      }
      if (L.pop > 0) L.pop = Math.max(0, L.pop - dt * 3);
      L.eb = L.lifted ? 0 : L.b * (L.party || L.fl ? 1 : dip);
      L.sx = L.x * cs + cx;
      L.sy = L.y * cs + cy;
      L.sc = cs * (0.78 + 0.3 * L.d) * (1 + L.hot * 0.28);
    });

    // pass 1: light cast onto the needles
    lg.globalCompositeOperation = 'lighter';
    order.forEach((L) => {
      if (L.eb < 0.05) return;
      const col = L.won && !L.party ? '#ffd56b' : L.picked && !L.party ? '#47d68a' : L.color;
      const r = 62 * L.sc * (0.6 + L.eb * 0.6);
      lg.globalAlpha = Math.min(1, 0.55 * L.eb * look.alpha);
      lg.drawImage(sprite(col), L.sx - r, L.sy + 14 * L.sc - r, r * 2, r * 2);
    });

    // pass 2: the bulbs themselves
    lg.globalCompositeOperation = 'source-over';
    order.forEach((L) => {
      if (L.lifted) return;
      const sc = L.sc;
      lg.save();
      lg.translate(L.sx, L.sy);
      lg.rotate(L.tilt);
      lg.scale(sc, sc);
      lg.globalAlpha = look.alpha * (L.dead && !L.party ? 0.7 : 1);
      // socket
      lg.fillStyle = '#163222';
      lg.fillRect(-4.5, -2, 9, 9);
      lg.fillStyle = '#2c5a3c';
      lg.fillRect(-4.5, 1, 9, 1.2);
      lg.fillRect(-4.5, 4, 9, 1.2);
      // glass
      lg.beginPath();
      lg.moveTo(0, 6);
      lg.bezierCurveTo(-7.5, 9, -8, 21, -3.2, 28);
      lg.quadraticCurveTo(0, 32, 3.2, 28);
      lg.bezierCurveTo(8, 21, 7.5, 9, 0, 6);
      const col = L.won && !L.party ? '#ffd56b' : L.picked && !L.party ? '#47d68a' : L.color;
      const e = L.eb;
      if (e > 0.06) {
        const [r, g, b] = rgbOf(col);
        const gr = lg.createRadialGradient(-1, 16, 0.5, 0, 18, 11);
        const hot = Math.min(1, e);
        gr.addColorStop(0, `rgba(255,255,255,${0.35 + hot * 0.65})`);
        gr.addColorStop(0.35, `rgba(${r},${g},${b},${0.35 + hot * 0.65})`);
        gr.addColorStop(1, `rgba(${Math.round(r * 0.45)},${Math.round(g * 0.45)},${Math.round(b * 0.45)},${0.6 + hot * 0.4})`);
        lg.fillStyle = gr;
      } else {
        const [r, g, b] = rgbOf(col);
        lg.fillStyle = L.dead ? '#20242e' : `rgb(${Math.round(r * 0.3 + 18)},${Math.round(g * 0.3 + 18)},${Math.round(b * 0.3 + 22)})`;
      }
      lg.fill();
      lg.strokeStyle = `rgba(255,255,255,${0.12 + e * 0.5})`;
      lg.lineWidth = 1.1;
      lg.beginPath();
      lg.moveTo(-3.6, 12); lg.quadraticCurveTo(-5, 18, -3, 24);
      lg.stroke();
      lg.restore();
    });

    // pass 3: hot cores and the pop of a bulb dying
    lg.globalCompositeOperation = 'lighter';
    order.forEach((L) => {
      if (L.lifted) return;
      if (L.eb > 0.3) {
        const col = L.won && !L.party ? '#ffd56b' : L.color;
        const r = 20 * L.sc * L.eb;
        lg.globalAlpha = Math.min(1, L.eb * look.alpha);
        lg.drawImage(sprite(col), L.sx - r, L.sy + 18 * L.sc - r, r * 2, r * 2);
      }
      if (L.pop > 0) {
        const r = 30 * L.sc * (1.4 - L.pop);
        lg.globalAlpha = L.pop * 0.8 * look.alpha;
        lg.drawImage(sprite('#ffffff'), L.sx - r, L.sy + 18 * L.sc - r, r * 2, r * 2);
      }
    });
    lg.globalAlpha = 1;
    lg.globalCompositeOperation = 'source-over';
  }
  requestAnimationFrame(frame);

  /* ---------- Helpers ---------- */
  function setStatus(num, text) {
    const n = $('status-num');
    if (num === null) n.hidden = true;
    else { n.hidden = false; n.textContent = num; }
    $('status-text').textContent = text;
  }

  function camTo(x, y, scale, dur, ease = 'power3.inOut') {
    return tween(cams, { x: CX - x * scale, y: CY - y * scale, scale, duration: reduce.matches ? 0 : S(dur), ease });
  }
  function camHome(dur = 1.2) { return tween(cams, { x: 0, y: 0, scale: 1, duration: reduce.matches ? 0 : S(dur), ease: 'power3.inOut' }); }

  function flashOnce(strength = 0.55) {
    gsap.fromTo(flash, { opacity: strength }, { opacity: 0, duration: 0.5, ease: 'power2.out' });
  }

  let shakeRaf = null;
  function shake(intensity = 6, seconds = 0.4) {
    if (reduce.matches) return;
    cancelAnimationFrame(shakeRaf);
    const t0 = performance.now();
    const step = (now) => {
      const k = (now - t0) / (seconds * 1000);
      if (k >= 1) { wrap.style.translate = ''; return; }
      const a = intensity * (1 - k);
      wrap.style.translate = `${((Math.random() - 0.5) * 2 * a).toFixed(1)}px ${((Math.random() - 0.5) * 2 * a).toFixed(1)}px`;
      shakeRaf = requestAnimationFrame(step);
    };
    shakeRaf = requestAnimationFrame(step);
  }

  function setLook(alpha, dur = 0.8) { gsap.to(look, { alpha, duration: dur }); }

  function reset() {
    token++;
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
    XMAS.audio.stopAll();
    if (sway) { sway.kill(); sway = null; }
    gsap.killTweensOf([...cams, flash, closeup, blackout, ember, look, '.hang', '.bauble', '.ribbon']);
    gsap.set(cams, { x: 0, y: 0, scale: 1, transformOrigin: '0 0' });
    gsap.set(blackout, { opacity: 0 });
    gsap.set(ember, { opacity: 0 });
    blackout.classList.remove('on');
    look.alpha = 1;
    wrap.className = 'tree-wrap';
    wrap.style.setProperty('--dark', 0);
    wrap.style.translate = '';
    XMAS.scene.setDim(0);
    XMAS.scene.setSnow(1);
    finalsEl.innerHTML = '';
    beam.className = 'beam';
    plate.className = 'winner-plate';
    closeup.className = 'closeup';
    star.classList.remove('lit');
    order.forEach((L) => {
      gsap.killTweensOf(L);
      setPos(L, L.s0);
      L.tb = L.won || L.picked ? 0.5 : 0;
      L.fl = 0; L.pop = 0; L.hot = 0; L.lifted = false; L.party = false; L.dead = false;
    });
    showLabels(order.length <= 24 ? order : [], false);
  }

  function markWon(name) { const L = lights.get(name); if (L) { L.won = true; L.tb = 0.5; } }
  function unmarkWon(name) { const L = lights.get(name); if (L) { L.won = false; L.tb = 0; } }
  function markPicked(name) { const L = lights.get(name); if (L) { L.picked = true; L.tb = 0.5; } }
  function clearPicked() { order.forEach((L) => { L.picked = false; }); }

  /* ---------- Baubles ---------- */
  function makeHang(name, color, x) {
    const hang = document.createElement('div');
    hang.className = 'hang';
    hang.style.left = x + 'px';
    hang.style.height = HANG_Y + 'px';
    hang.innerHTML = '<i class="ribbon"></i><div class="bauble"><i class="cap"></i><div class="glass"><b class="bn"></b></div></div>';
    hang.style.setProperty('--c', color);
    hang.querySelector('.bn').textContent = name;
    finalsEl.append(hang);
    const glassEl = hang.querySelector('.glass');
    const bn = hang.querySelector('.bn');
    requestAnimationFrame(() => {
      let size = 54;
      bn.style.fontSize = size + 'px';
      while (bn.scrollWidth > 176 && size > 32) { size -= 2; bn.style.fontSize = size + 'px'; }
      if (bn.scrollWidth > 176) {
        // long names wrap onto two lines rather than shrinking out of sight
        bn.classList.add('wrap');
        while (bn.scrollHeight > size * 2.1 && size > 24) { size -= 2; bn.style.fontSize = size + 'px'; }
      }
    });
    return { name, hang, x, color, glassEl, bauble: hang.querySelector('.bauble'), glass: XMAS.glass.create(glassEl), gone: false };
  }

  function chipsFrom(b, n = 2) {
    if (b.gone) return;
    const r = b.glassEl.getBoundingClientRect();
    XMAS.fx.chips(r.left + r.width / 2, r.bottom - r.height * 0.12, b.color, n);
  }

  function setCritical(b, alive) {
    if (b.critical) return;
    b.critical = true;
    b.hang.classList.add('critical');
    const drip = () => {
      if (!alive() || b.gone) return;
      chipsFrom(b, 1 + rand(2));
      if (Math.random() < 0.5) A().tinkle();
      later(drip, 900 + Math.random() * 1300);
    };
    later(drip, 600);
  }

  function jolt(b, amt = 5) {
    gsap.fromTo(b.bauble, { rotation: (Math.random() < 0.5 ? -1 : 1) * amt }, { rotation: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
  }

  function hit(b, alive, n = 1) {
    if (b.gone || b.glass.level >= 5) return 0;
    const t = b.glass.add(n, { speed: 220 + b.glass.level * 40 });
    const lv = b.glass.level;
    A().crack(0.35 + lv * 0.13);
    if (lv >= 3) A().creak(0.3 + lv * 0.1);
    jolt(b, 3 + lv * 1.5);
    shake(1.5 + lv * 1.2, 0.3);
    if (lv >= 3) chipsFrom(b, lv - 2);
    if (lv >= 5) setCritical(b, alive);
    return t;
  }

  /* A bauble groans, sheds a chip, wobbles… and holds. */
  async function fakeOut(b, alive) {
    if (b.gone) return;
    A().creak(0.9);
    gsap.to(b.bauble, { x: '+=4', duration: 0.04, repeat: 11, yoyo: true, ease: 'none' });
    shake(3, 0.5);
    chipsFrom(b, 3);
    if (b.glass.level < 5 && Math.random() < 0.6) hit(b, alive);
    await wait(900);
  }

  function shatterNow(b, power = 1) {
    if (b.gone) return;
    b.gone = true;
    const r = b.glassEl.getBoundingClientRect();
    XMAS.fx.shatterCells(b.glass.cells(), r, b.color, b.glass.impact, power, XMAS.glass.SIZE);
    gsap.set(b.bauble, { opacity: 0 });
    gsap.to(b.hang.querySelector('.ribbon'), { scaleY: 0, transformOrigin: '50% 0%', duration: 0.5, ease: 'power3.in' });
  }

  /* Escalate to breaking point, then burst. A clean bauble can go from a hairline to nothing. */
  async function burst(b, alive) {
    if (b.glass.level < 5) {
      A().stress(0.8, 0.8);
      const t = b.glass.setLevel(5, { speed: 650 });
      A().crack(1);
      b.hang.classList.add('critical');
      shake(4, 0.6);
      await wait(Math.max(450, t * 1000));
      if (!alive()) return;
    }
    gsap.to(b.bauble, { x: '+=6', duration: 0.04, repeat: 9, yoyo: true, ease: 'none' });
    await wait(420);
    if (!alive()) return;
    shatterNow(b, 1);
    A().shatter();
    flashOnce(0.35);
    shake(9, 0.45);
  }

  /* ---------- Shared acts ---------- */
  async function powerUp(pool, alive) {
    setStatus(pool.length, 'lights on the tree');
    A().powerUp();
    const sorted = pool.map((n) => lights.get(n)).sort((a, b) => a.s - b.s);
    sorted.forEach((L, i) => {
      const at = (i / sorted.length) * 1.6 + Math.random() * 0.08;
      gsap.delayedCall(S(at), () => { if (alive()) L.tb = 1; });
    });
    A().lightsOn(S(1.7) + 0.2);
    await wait(2200);
  }

  /* Waves of lights going out until `target` remain. Those in `keep` are never put out. */
  async function waves(pool, keep, target, alive, total) {
    let survivors = pool.slice();
    let bpm = 64;
    let wave = 0;
    A().heartbeat(bpm);
    A().tension(0.05);
    await wait(500);
    while (survivors.length > target) {
      if (!alive()) return null;
      const len = survivors.length;
      let next = len > 12 ? Math.max(target, Math.round(len * 0.4)) : target;
      const losers = pick(survivors.filter((n) => !keep.includes(n)), len - next);

      setStatus(len, wave === 0 ? 'The lights are flickering…' : 'Here it comes again…');
      dipUntil = performance.now() + 800;
      A().buzz(0.7);
      await wait(800);
      if (!alive()) return null;

      setStatus(len, 'Lights out…');
      const dur = (wave === 0 ? 2300 : 1900) * speed;
      A().lightsOut(dur / 1000, Math.min(14, losers.length));
      let remaining = len;
      losers.forEach((name) => {
        const at = Math.random() * dur * 0.85;
        later(() => {
          if (!alive()) return;
          const L = lights.get(name);
          L.fl = performance.now();
          L.hot = 0;
          remaining--;
          $('status-num').textContent = remaining;
        }, at);
      });
      await waitRaw(dur + 500);
      if (!alive()) return null;
      survivors = survivors.filter((n) => !losers.includes(n));
      setStatus(survivors.length, survivors.length > target ? 'still glowing' : 'lights left');
      const hot = survivors.length <= 12 ? 1 : survivors.length <= 30 ? 0.5 : 0;
      survivors.forEach((n) => { gsap.to(lights.get(n), { hot, duration: 0.6 }); });
      if (survivors.length <= NAMES_AT) {
        spread(survivors.map((n) => lights.get(n)), 1.1);
      }
      const darkness = Math.min(0.85, 1 - survivors.length / total);
      wrap.style.setProperty('--dark', darkness);
      XMAS.scene.setDim(darkness);
      wave++;
      bpm += 12;
      A().heartbeat(bpm);
      A().tension(Math.min(0.7, 0.2 + wave * 0.18));
      await wait(1300);
    }
    return survivors;
  }

  async function rollCall(names, alive, { caption = () => 'Still glowing', zoom = 2.6, hold = 1000 } = {}) {
    wrap.classList.add('rollcall');
    for (let i = 0; i < names.length; i++) {
      if (!alive()) return false;
      const L = lights.get(names[i]);
      order.forEach((o) => { o.hot = o === L ? 1.4 : Math.min(o.hot, 1); });
      await camTo(L.x, L.y + 10, zoom, 0.9);
      if (!alive()) return false;
      closeup.querySelector('span').textContent = caption(i);
      closeup.querySelector('b').textContent = names[i];
      fitText(closeup.querySelector('b'), 1100, 120, 60);
      closeup.className = 'closeup show';
      A().boom();
      await wait(hold);
      closeup.className = 'closeup';
    }
    wrap.classList.remove('rollcall');
    return true;
  }

  function fitText(el, max, start, min) {
    let size = start;
    el.style.fontSize = size + 'px';
    while (el.scrollWidth > max && size > min) { size -= 4; el.style.fontSize = size + 'px'; }
  }

  function partyLights(fromS = null, seconds = 1.1) {
    const my = token;
    order.forEach((L) => {
      const d = fromS === null ? Math.hypot(L.x - CX, L.y - 150) / 900 : Math.abs(L.s - fromS) / gl.length;
      gsap.delayedCall(d * seconds, () => {
        if (my !== token) return;
        L.fl = 0; L.dead = false; L.lifted = false; L.hot = 0;
        L.party = true;
        L.tb = 1;
      });
    });
    if (fromS === null) later(() => { showLabels([], true); }, 300);
  }

  function showPlate({ label, name, prize, lines }) {
    plate.querySelector('.wp-label').textContent = label;
    const nameEl = plate.querySelector('.wp-name');
    const list = plate.querySelector('.wp-list');
    list.innerHTML = '';
    if (lines) {
      plate.classList.add('multi');
      nameEl.textContent = '';
      plate.querySelector('.wp-prize').textContent = '';
      lines.forEach(({ rank, prize: p, who }) => {
        const li = document.createElement('li');
        li.innerHTML = '<span class="r"></span><span class="p"></span><b></b>';
        li.children[0].textContent = rank;
        li.children[1].textContent = p;
        li.children[2].textContent = who;
        list.append(li);
      });
    } else {
      plate.classList.remove('multi');
      nameEl.textContent = name;
      plate.querySelector('.wp-prize').textContent = prize;
      requestAnimationFrame(() => fitText(nameEl, 1100, 150, 60));
    }
    plate.classList.add('show');
  }

  function celebrate(grand) {
    star.classList.add('lit');
    flashOnce(0.7);
    wrap.classList.remove('focus', 'running', 'hush');
    wrap.classList.add('celebrate');
    wrap.style.setProperty('--dark', 0);
    XMAS.scene.setDim(0);
    setLook(1, 0.6);
    A().celebrate(grand);
    const sr = star.getBoundingClientRect();
    XMAS.fx.burst(sr.left + sr.width / 2, sr.top + sr.height / 2, grand ? 340 : 200);
    if (grand) XMAS.fx.rain(360);
  }

  /* ---------- The show ---------- */
  async function run(o) {
    const { pool, winners, mode = 'full' } = o;
    reset();
    const my = token;
    const alive = () => my === token;
    const batch = mode === 'batch';
    const grand = mode === 'grand';
    const quick = mode === 'quick';
    speed = grand ? 1.12 : quick ? 0.62 : batch ? 0.78 : 1;
    const winner = winners[0];
    const total = pool.length;
    wrap.classList.add('running');

    // ACT 1 — power up along the garland
    await powerUp(pool, alive);
    if (!alive()) return false;
    gsap.to(cams, { x: CX - CX * 1.05, y: CY - 600 * 1.05, scale: 1.05, duration: S(16), ease: 'none' });

    // ACT 2 — waves of lights going out
    const target = batch ? winners.length : Math.min(4, pool.length);
    const survivors = await waves(pool, winners, target, alive, total);
    if (!survivors || !alive()) return false;
    gsap.killTweensOf(cams);

    if (batch) return runBatchEnding(o, survivors, alive);

    // ACT 3 — roll call: the camera visits each remaining light
    const finals = XMAS.random.shuffle(survivors);
    if (!quick && finals.length > 1) {
      setStatus(finals.length, `${finals.length} lights left`);
      if (!(await rollCall(finals, alive))) return false;
      await camHome(1.1);
      if (!alive()) return false;
    } else {
      await camHome(0.6);
    }

    // ACT 4 — the finalists drop in as glass baubles
    setStatus(finals.length, finals.length === 1 ? 'only one light left' : 'Who will crack?');
    wrap.classList.add('focus');
    setLook(0.25, 1);
    const gap = 290;
    const baubles = finals.map((name, i) => {
      const x = CX + (i - (finals.length - 1) / 2) * gap;
      const L = lights.get(name);
      L.lifted = true;
      L.show = false; L.label.classList.remove('on');
      return makeHang(name, L.color, x);
    });
    A().whoosh(1);
    const hangs = baubles.map((b) => b.hang);
    gsap.fromTo(hangs, { y: -900, rotation: () => (Math.random() - 0.5) * 24 },
      { y: 0, duration: reduce.matches ? 0 : S(1.2), ease: 'bounce.out', stagger: S(0.2) });
    gsap.to(hangs, { rotation: 0, duration: S(2.6), ease: 'elastic.out(1, 0.25)', delay: S(0.9) });
    await wait(1600 + baubles.length * 200);
    if (!alive()) return false;
    if (!reduce.matches) {
      sway = gsap.to(hangs, { rotation: '+=1.6', duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: 0.35, from: 'random' } });
    }

    // ACT 5 — cracks land on anyone; one bauble at a time breaks
    let left = baubles.slice();
    let bpm = 96;
    while (left.length > 2) {
      setStatus(left.length, left.length === 4 ? 'Who will crack?' : 'One more will break…');
      A().tension(0.8);
      const hits = (quick ? 1 : 2) + rand(3);
      for (let h = 0; h < hits; h++) {
        const b = pickOne(left);
        hit(b, alive, Math.random() < 0.25 ? 2 : 1);
        await wait(700 + rand(500));
        if (!alive()) return false;
      }
      if (!quick && Math.random() < 0.5) { await fakeOut(pickOne(left), alive); if (!alive()) return false; }
      const out = pickOne(left.filter((b) => b.name !== winner));
      await burst(out, alive);
      if (!alive()) return false;
      left = left.filter((b) => b !== out);
      bpm += 10;
      A().heartbeat(bpm);
      await wait(1400);
    }
    if (!alive()) return false;

    // ACT 6 — the final two: a crack duel, then the spotlight
    const target6 = left.find((b) => b.name === winner);
    const other = left.find((b) => b !== target6);
    if (other) {
      setStatus(2, 'Final two');
      left.forEach((b, i) => {
        b.x = CX + (i - 0.5) * 540;
        gsap.to(b.hang, { left: b.x, duration: S(1), ease: 'power3.inOut' });
        gsap.to(b.bauble, { scale: 1.3, duration: S(1), ease: 'power3.inOut' });
      });
      A().whoosh(0.8);
      await wait(1300);
      if (!alive()) return false;
      A().heartbeat(110);
      A().tension(1);

      // The script is chosen at random and is independent of who wins:
      // sometimes the winner is the one hanging by a thread, sometimes the clean one, sometimes both.
      const script = pickOne(['wounded', 'clean', 'both']);
      const goals = new Map();
      const lo = () => 1 + rand(2);
      if (script === 'wounded') { goals.set(target6, 5); goals.set(other, lo()); }
      else if (script === 'clean') { goals.set(target6, lo()); goals.set(other, 4 + rand(2)); }
      else { goals.set(target6, 5); goals.set(other, 5); }
      // the scripts are symmetric, so swap the roles half the time for visual variety
      setStatus(2, 'Hold your breath…');
      let pause = quick ? 650 : 950;
      let guard = 0;
      while (guard++ < 14) {
        const need = left.filter((b) => b.glass.level < goals.get(b));
        if (!need.length) break;
        const b = pickOne(need);
        hit(b, alive);
        await wait(pause);
        if (!alive()) return false;
        pause = Math.max(480, pause * 0.9);
      }
      if (!quick) { await fakeOut(pickOne(left), alive); if (!alive()) return false; }

      // spotlight: lands on either one, at random. It decides nothing.
      setStatus(2, 'Final two');
      A().heartbeat(124);
      beam.classList.add('show');
      let pos = rand(2);
      const hops = 9 + rand(6);
      let interval = 150;
      for (let h = 0; h <= hops; h++) {
        if (!alive()) return false;
        const b = left[pos];
        beam.style.left = b.x + 'px';
        left.forEach((k) => k.hang.classList.toggle('lit', k === b));
        A().tick(1 + (h % 2) * 0.12);
        if (h === hops) break;
        await wait(interval * (h === hops - 1 && Math.random() < 0.45 ? 2.6 : 1));
        interval *= 1.19;
        pos = 1 - pos;
      }

      // silence, with the glass still creaking
      A().stopHeartbeat();
      A().stopTension(0.25);
      wrap.classList.add('hush');
      if (sway) { sway.kill(); sway = null; }
      setStatus(2, '');
      await wait(900);
      if (!alive()) return false;
      const creaks = quick ? 1 : 2 + rand(2);
      for (let c = 0; c < creaks; c++) {
        const b = pickOne(left);
        A().creak(0.7);
        jolt(b, 2);
        if (b.glass.level >= 4) chipsFrom(b, 1);
        await wait(700 + rand(500));
        if (!alive()) return false;
      }

      if (grand) return runGrandFinale(o, left, target6, alive);

      await burst(other, alive);
      if (!alive()) return false;
      await wait(500);
    } else if (target6) {
      beam.style.left = target6.x + 'px';
      beam.classList.add('show');
      target6.hang.classList.add('lit');
      await wait(900);
      if (grand) return runGrandFinale(o, left, target6, alive);
    }

    // ACT 7 — the winner's bauble rises and lights the star
    beam.className = 'beam';
    wrap.classList.remove('hush');
    target6.hang.classList.remove('critical');
    target6.hang.classList.add('chosen');
    target6.glass.heal(0.5);
    gsap.set(target6.hang, { rotation: 0 });
    A().whoosh(1.2);
    await tween(target6.hang, { left: CX, y: -(HANG_Y - 150), duration: reduce.matches ? 0 : S(1.3), ease: 'power2.in' });
    gsap.to(target6.bauble, { scale: 0.2, opacity: 0, duration: 0.3 });
    if (!alive()) return false;

    celebrate(false);
    partyLights();
    showPlate({ label: o.plateLabel || 'Lights the star!', name: winner, prize: o.prizeText || '' });
    setStatus(null, 'We have a winner!');
    later(() => { if (alive()) finalsEl.innerHTML = ''; }, 800);
    await wait(1200);
    return alive();
  }

  /* 1st prize: both baubles burst, the room goes black and silent, and an ember finds the winner. */
  async function runGrandFinale(o, left, target, alive) {
    const winner = target.name;
    beam.classList.remove('show');
    left.forEach((b) => b.hang.classList.remove('lit'));
    // both start breaking at once
    A().stress(2.4, 1.2);
    left.forEach((b) => { b.hang.classList.add('critical'); b.glass.setLevel(5, { speed: 380 }); });
    A().crack(1);
    for (let k = 0; k < 6; k++) {
      shake(2 + k * 1.6, 0.4);
      left.forEach((b) => { jolt(b, 3 + k); if (k % 2) chipsFrom(b, 1 + (k >> 1)); });
      if (k % 2) A().crack(0.6 + k * 0.08);
      gsap.fromTo(flash, { opacity: 0.04 + k * 0.03 }, { opacity: 0, duration: 0.25 });
      await waitRaw(400);
      if (!alive()) return false;
    }
    left.forEach((b) => gsap.to(b.bauble, { x: '+=7', duration: 0.035, repeat: 11, yoyo: true, ease: 'none' }));
    await waitRaw(420);
    if (!alive()) return false;

    // BOOM — both explode together
    left.forEach((b) => shatterNow(b, 1.7));
    A().bigBurst();
    flashOnce(0.95);
    shake(16, 0.7);
    if (sway) { sway.kill(); sway = null; }
    await waitRaw(650);
    if (!alive()) return false;

    // black and silent
    A().silence(0.06);
    XMAS.fx.clear();
    blackout.classList.add('on');
    gsap.set(blackout, { opacity: 1 });
    look.alpha = 0;
    order.forEach((L) => { L.tb = 0; L.b = 0; L.hot = 0; });
    showLabels([], false);
    XMAS.scene.setDim(1);
    XMAS.scene.setSnow(0.35);
    wrap.style.setProperty('--dark', 1);
    finalsEl.innerHTML = '';
    setStatus(null, '');
    await waitRaw(5000);
    if (!alive()) return false;

    // an ember breathes on the tree where the winner's light hangs
    const L = lights.get(winner);
    const wr = wrap.getBoundingClientRect();
    const st = document.getElementById('stage').getBoundingClientRect();
    const k = wr.width / G.W;
    const ex = (wr.left - st.left) / k + L.x;
    const ey = (wr.top - st.top) / k + L.y + 18;
    ember.style.left = ex + 'px';
    ember.style.top = ey + 'px';
    for (const peak of [0.28, 0.55]) {
      await tween(ember, { opacity: peak, duration: 1.3, ease: 'sine.inOut' });
      await tween(ember, { opacity: 0.02, duration: 1.2, ease: 'sine.inOut' });
      if (!alive()) return false;
      await waitRaw(400);
    }
    await tween(ember, { opacity: 1, duration: 1.8, ease: 'sine.in' });
    if (!alive()) return false;

    // it catches
    A().restore();
    A().ignite();
    L.lifted = false; L.dead = false; L.tb = 1; L.b = 1; L.hot = 1.4;
    look.alpha = 1;
    order.forEach((o2) => { if (o2 !== L) { o2.tb = 0; o2.b = 0; } });
    gsap.to(ember, { opacity: 0, duration: 0.8 });
    gsap.to(blackout, { opacity: 0.55, duration: 1.6 });
    wrap.style.setProperty('--dark', 0.85);
    await camTo(L.x, L.y + 10, 2.4, 2.2, 'power2.inOut');
    if (!alive()) return false;
    closeup.querySelector('span').textContent = o.prizeLabel || 'The 1st prize';
    closeup.querySelector('b').textContent = winner;
    fitText(closeup.querySelector('b'), 1100, 120, 60);
    closeup.className = 'closeup show';
    await waitRaw(2400);
    if (!alive()) return false;

    // the light runs along the garland and the whole tree comes back
    closeup.className = 'closeup';
    A().lightsOn(2.6);
    partyLights(L.s, 2.6);
    gsap.to(blackout, { opacity: 0, duration: 2.4, onComplete: () => blackout.classList.remove('on') });
    XMAS.scene.setDim(0);
    XMAS.scene.setSnow(1);
    await camHome(2.4);
    if (!alive()) return false;
    later(() => showLabels([], true), 200);
    celebrate(true);
    showPlate({ label: o.plateLabel || '1st prize winner', name: winner, prize: o.prizeText || '' });
    setStatus(null, '1st prize winner!');
    await waitRaw(1400);
    return alive();
  }

  /* Batch rounds: several prizes at once. The last lights standing win, lowest prize first. */
  async function runBatchEnding(o, survivors, alive) {
    const ordered = o.winners.filter((w) => survivors.includes(w));
    setStatus(ordered.length, 'lights left — all winners!');
    await camHome(0.8);
    wrap.classList.add('rollcall');
    for (let i = 0; i < ordered.length; i++) {
      if (!alive()) return false;
      const L = lights.get(ordered[i]);
      order.forEach((x) => { x.hot = x === L ? 1.5 : Math.min(x.hot, 1); });
      await camTo(L.x, L.y + 10, 2.2, 0.8);
      if (!alive()) return false;
      const line = o.lines[i];
      closeup.querySelector('span').textContent = `${line.rank} · ${line.prize}`;
      closeup.querySelector('b').textContent = L.name;
      fitText(closeup.querySelector('b'), 1100, 120, 60);
      closeup.className = 'closeup show';
      A().boom();
      L.won = true;
      await wait(1500);
      closeup.className = 'closeup';
    }
    wrap.classList.remove('rollcall');
    await camHome(0.9);
    if (!alive()) return false;
    celebrate(false);
    partyLights();
    showPlate({ label: o.plateLabel || 'They light the star!', lines: o.lines.map((l, i) => ({ ...l, who: ordered[i] })) });
    setStatus(null, `${ordered.length} winners!`);
    await wait(1200);
    return alive();
  }

  /* Instant winner state, used when resuming after a reload. */
  function showWinner(winners, { plateLabel, prizeText, lines } = {}) {
    reset();
    star.classList.add('lit');
    wrap.classList.add('celebrate');
    order.forEach((L) => { L.party = true; });
    showLabels([], false);
    if (lines) showPlate({ label: plateLabel, lines: lines.map((l, i) => ({ ...l, who: winners[i] })) });
    else showPlate({ label: plateLabel, name: winners[0], prize: prizeText });
    setStatus(null, 'We have a winner!');
  }

  XMAS.tree = {
    layout, reset, run, showWinner, setStatus, markWon, unmarkWon, markPicked, clearPicked,
    cancel: () => { reset(); },
    setTimeScale(x) { timeScale = x; gsap.globalTimeline.timeScale(x); },
    get timeScale() { return timeScale; }
  };
})();
