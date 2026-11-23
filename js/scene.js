/* The room: a painted fir tree with depth (canvas, painted once and cached), the spiral
   light garland that wraps it, drifting bokeh behind and slow snow in front. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Tree geometry, in tree-stage coordinates (1320×1080). Shared with tree.js. */
  const G = { CX: 660, TIP: 168, BASE: 928, HALF: 545, W: 1320, H: 1080 };
  G.halfAt = (y) => {
    const v = Math.max(0, Math.min(1, (y - G.TIP) / (G.BASE - G.TIP)));
    return G.HALF * Math.pow(v, 0.9);
  };

  /* Seeded RNG so the tree looks the same every time it is painted. */
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  const TIERS = [
    { top: 168, bot: 318 },
    { top: 236, bot: 430 },
    { top: 330, bot: 548 },
    { top: 432, bot: 668 },
    { top: 540, bot: 790 },
    { top: 652, bot: 928 }
  ];

  function tierOutline(g, t, r) {
    const w0 = Math.max(6, G.halfAt(t.top) * 0.55);
    const w1 = G.halfAt(t.bot) * 1.02;
    g.beginPath();
    g.moveTo(G.CX - w0, t.top);
    g.lineTo(G.CX + w0, t.top);
    g.lineTo(G.CX + w1, t.bot - 22);
    const tips = Math.max(3, Math.round(w1 / 30));
    for (let i = 0; i <= tips; i++) {
      const x = G.CX + w1 - (i / tips) * w1 * 2;
      const sag = 12 + r() * 16;
      g.quadraticCurveTo(x + (w1 / tips) * 0.5, t.bot + sag, x, t.bot - 6 - r() * 12);
    }
    g.closePath();
    return { w0, w1 };
  }

  /* ---------- The tree itself, painted once into an offscreen canvas ---------- */
  let base = null;
  const SC = 1.5;

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => Math.max(0, Math.min(255, Math.round(c * (1 + amt))));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }

  function paintBase() {
    base = document.createElement('canvas');
    base.width = G.W * SC;
    base.height = G.H * SC;
    const g = base.getContext('2d');
    g.setTransform(SC, 0, 0, SC, 0, 0);
    const r = rng(20251225);
    const CX = G.CX;

    // warm floor glow
    const floor = g.createRadialGradient(CX, 985, 20, CX, 985, 560);
    floor.addColorStop(0, 'rgba(255,180,110,.16)');
    floor.addColorStop(1, 'rgba(255,180,110,0)');
    g.fillStyle = floor;
    g.fillRect(0, 760, G.W, 320);

    // trunk
    const trunk = g.createLinearGradient(CX - 44, 0, CX + 44, 0);
    trunk.addColorStop(0, '#22140a'); trunk.addColorStop(0.45, '#5a3a22'); trunk.addColorStop(1, '#1d1108');
    g.fillStyle = trunk;
    g.fillRect(CX - 40, 890, 80, 180);

    // skirt
    const sk = g.createRadialGradient(CX, 1050, 40, CX, 1060, 340);
    sk.addColorStop(0, '#7a1c22'); sk.addColorStop(1, '#3a0b0f');
    g.fillStyle = sk;
    g.beginPath(); g.ellipse(CX, 1060, 330, 34, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.07)';
    g.beginPath(); g.ellipse(CX, 1052, 330, 22, 0, Math.PI, Math.PI * 2); g.fill();

    // tiers, bottom first so each upper tier's skirt overlaps the one below
    const greens = ['#061a0e', '#0a2414', '#0e301b', '#133c23', '#19492b', '#205735', '#2a6741', '#367a4f', '#4a8f60', '#64a674'];
    const WID = [0.9, 1.4, 2];
    TIERS.slice().reverse().forEach((t, ri) => {
      const ti = TIERS.length - 1 - ri;
      g.save();
      const { w0, w1 } = tierOutline(g, t, r);
      const fill = g.createLinearGradient(0, t.top, 0, t.bot);
      fill.addColorStop(0, '#0d2c19');
      fill.addColorStop(1, '#06180d');
      g.fillStyle = fill;
      g.fill();
      g.clip();

      // fronds: needles bucketed by colour and width so the paint is fast
      const buckets = new Map();
      const add = (ci, wi, x1, y1, x2, y2) => {
        const k = ci * 3 + wi;
        let p = buckets.get(k);
        if (!p) { p = new Path2D(); buckets.set(k, p); }
        p.moveTo(x1, y1); p.lineTo(x2, y2);
      };
      const fronds = 150 + ti * 70;
      for (let f = 0; f < fronds; f++) {
        const v = Math.pow(r(), 0.7);                       // more fronds near the tier's lower edge
        const y = t.top + v * (t.bot - t.top);
        const W = w0 + (w1 - w0) * v;
        const u = (r() * 2 - 1);
        const side = u < 0 ? -1 : 1;
        const edge = Math.abs(u);
        const sx = CX + u * W * 0.45;
        const ex = CX + u * W * (0.75 + r() * 0.35);
        const ey = y + 14 + r() * 26 + edge * 14;
        const len = Math.hypot(ex - sx, ey - y);
        const ang = Math.atan2(ey - y, ex - sx);
        const steps = Math.max(4, Math.round(len / 3.2));
        // lit from the front-top and from the warm lights; darker in the core and underneath
        const lightBase = edge * 3.2 + (1 - v) * 2.4 + (ti / TIERS.length) * 0.6;
        for (let s = 0; s < steps; s++) {
          const k = s / steps;
          const px = sx + (ex - sx) * k;
          const py = y + (ey - y) * k + Math.sin(k * Math.PI) * -4;
          const nl = 5 + r() * 7 * (1 - k * 0.4);
          for (const dir of [-1, 1]) {
            const a = ang + dir * (0.75 + r() * 0.35) + 0.25 * side * 0;
            const ci = Math.max(0, Math.min(greens.length - 1, Math.floor(lightBase + k * 2.2 + (r() - 0.35) * 2.6)));
            add(ci, Math.floor(r() * 3), px, py, px + Math.cos(a) * nl, py + Math.sin(a) * nl);
          }
        }
      }
      buckets.forEach((p, k) => {
        g.strokeStyle = greens[Math.floor(k / 3)];
        g.lineWidth = WID[k % 3];
        g.globalAlpha = 0.9;
        g.stroke(p);
      });
      g.globalAlpha = 1;

      // shadow cast by the tier above onto this one
      if (ti > 0) {
        const above = TIERS[ti - 1];
        const sh = g.createLinearGradient(0, above.bot - 40, 0, above.bot + 60);
        sh.addColorStop(0, 'rgba(0,0,0,0)');
        sh.addColorStop(0.5, 'rgba(0,0,0,.45)');
        sh.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = sh;
        g.fillRect(0, above.bot - 40, G.W, 100);
      }
      // core shading: the middle of the tree recedes
      const core = g.createRadialGradient(CX, (t.top + t.bot) / 2, 10, CX, (t.top + t.bot) / 2, w1);
      core.addColorStop(0, 'rgba(0,0,0,.28)');
      core.addColorStop(0.6, 'rgba(0,0,0,.08)');
      core.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = core;
      g.fillRect(CX - w1, t.top, w1 * 2, t.bot - t.top + 40);
      g.restore();

      // frosted tips along the scalloped lower edge
      g.save();
      g.fillStyle = 'rgba(235,245,255,.5)';
      const tips = Math.round(w1 / 9);
      for (let i = 0; i < tips; i++) {
        const x = CX - w1 + r() * w1 * 2;
        const yy = t.bot - 4 + r() * 18 - Math.abs(x - CX) / w1 * 18;
        g.globalAlpha = 0.15 + r() * 0.35;
        g.beginPath(); g.ellipse(x, yy, 2 + r() * 4, 1 + r() * 1.6, (r() - 0.5) * 0.6, 0, Math.PI * 2); g.fill();
      }
      g.restore();
    });

    // warm inner glow, as if the lights are lighting the needles from inside
    g.save();
    g.globalCompositeOperation = 'soft-light';
    const warm = g.createRadialGradient(CX, 640, 40, CX, 640, 520);
    warm.addColorStop(0, 'rgba(255,190,110,.55)');
    warm.addColorStop(1, 'rgba(255,190,110,0)');
    g.fillStyle = warm;
    g.fillRect(0, 150, G.W, 800);
    g.restore();

    // gold bead swags
    for (let s = 1; s < TIERS.length; s++) {
      const t = TIERS[s];
      const ya = t.top + (t.bot - t.top) * 0.5;
      const wa = G.halfAt(ya) * 0.86;
      const steps = 70 + s * 12;
      for (let i = 0; i <= steps; i++) {
        const k = i / steps;
        const x = CX - wa + wa * 2 * k;
        const y = ya + Math.sin(k * Math.PI) * (20 + s * 4) + (k - 0.5) * 30;
        const gr = g.createRadialGradient(x - 0.8, y - 0.8, 0, x, y, 2.8);
        gr.addColorStop(0, '#fff3c6'); gr.addColorStop(0.5, '#c9962e'); gr.addColorStop(1, 'rgba(90,60,10,0)');
        g.fillStyle = gr;
        g.globalAlpha = 0.55;
        g.beginPath(); g.arc(x, y, 2.8, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
    }

    // glass ornaments with a reflection of the room
    const ballColors = [['#ffe9a8', '#9a6c12'], ['#ff9c9c', '#7d161c'], ['#e9eef7', '#5d6678'], ['#9fd0ff', '#173a6c'], ['#b9f0c8', '#185c33']];
    for (let i = 0; i < 26; i++) {
      const t = TIERS[1 + Math.floor(r() * 5)];
      const v = 0.35 + r() * 0.55;
      const y = t.top + v * (t.bot - t.top);
      const half = G.halfAt(y) * 0.78;
      const x = CX + (r() * 2 - 1) * half;
      const rad = 8 + r() * 7;
      const [hi, lo] = ballColors[i % ballColors.length];
      g.fillStyle = 'rgba(0,0,0,.4)';
      g.beginPath(); g.arc(x + 2, y + 4, rad, 0, Math.PI * 2); g.fill();
      const gr = g.createRadialGradient(x - rad * 0.4, y - rad * 0.45, rad * 0.08, x, y, rad);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.22, hi); gr.addColorStop(1, lo);
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1;
      g.beginPath(); g.arc(x, y, rad * 0.7, Math.PI * 0.15, Math.PI * 0.55); g.stroke();
      g.fillStyle = '#c9a23c';
      g.fillRect(x - 2.5, y - rad - 3, 5, 4);
    }

    // presents under the tree
    const gifts = [
      { x: CX - 270, w: 96, h: 46, c: '#9c1f2a', rib: '#f2d27a' },
      { x: CX - 160, w: 70, h: 62, c: '#1d4f7a', rib: '#e9eef7' },
      { x: CX + 140, w: 100, h: 40, c: '#d9b45a', rib: '#9c1f2a' },
      { x: CX + 262, w: 66, h: 54, c: '#1f6a43', rib: '#f2d27a' },
      { x: CX - 40, w: 54, h: 32, c: '#e9e2d0', rib: '#c2333a' },
      { x: CX + 40, w: 60, h: 44, c: '#5b2a7a', rib: '#f2d27a' }
    ];
    gifts.forEach((p) => {
      const top = 1070 - p.h;
      g.fillStyle = 'rgba(0,0,0,.45)';
      g.fillRect(p.x - p.w / 2 + 6, top + 8, p.w, p.h);
      const gr = g.createLinearGradient(p.x - p.w / 2, 0, p.x + p.w / 2, 0);
      gr.addColorStop(0, p.c); gr.addColorStop(1, shade(p.c, -0.4));
      g.fillStyle = gr;
      g.fillRect(p.x - p.w / 2, top, p.w, p.h);
      g.fillStyle = 'rgba(255,255,255,.08)';
      g.fillRect(p.x - p.w / 2, top, p.w, 5);
      g.fillStyle = p.rib;
      g.fillRect(p.x - 5, top, 10, p.h);
      g.fillRect(p.x - p.w / 2, top + p.h * 0.42, p.w, 8);
      g.beginPath();
      g.ellipse(p.x - 11, top - 5, 12, 7, -0.5, 0, Math.PI * 2);
      g.ellipse(p.x + 11, top - 5, 12, 7, 0.5, 0, Math.PI * 2);
      g.fill();
    });
  }

  /* ---------- The garland: a spiral wrapping the cone; only its front half is visible ---------- */
  function garland(n) {
    const T = Math.max(4, Math.min(10, Math.round(n / 15) + 3));
    const y0 = 262, y1 = 884;
    const steps = T * 160;
    const arcs = [];
    let cur = null;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const th = u * T * Math.PI * 2 - Math.PI / 2;
      const depth = Math.cos(th);
      const y = y0 + u * (y1 - y0) + 18 * depth;
      const rr = G.halfAt(y) * 0.86;
      const x = G.CX + rr * Math.sin(th);
      if (depth > 0.1) {
        if (!cur) { cur = { pts: [] }; arcs.push(cur); }
        cur.pts.push({ x, y, d: depth });
      } else cur = null;
    }
    // cumulative arc length across all front arcs
    let total = 0;
    arcs.forEach((a) => {
      a.start = total;
      a.pts.forEach((p, i) => {
        if (i) total += Math.hypot(p.x - a.pts[i - 1].x, p.y - a.pts[i - 1].y);
        p.s = total;
      });
      a.end = total;
    });
    return { arcs, length: total, turns: T };
  }

  /* Point on the garland at arc-length s (0…length). */
  function along(gl, s) {
    s = Math.max(0, Math.min(gl.length, s));
    let a = gl.arcs[gl.arcs.length - 1];
    for (const arc of gl.arcs) { if (s <= arc.end) { a = arc; break; } }
    const pts = a.pts;
    let lo = 0, hi = pts.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m].s < s) lo = m; else hi = m; }
    const p = pts[lo], q = pts[hi];
    const k = q.s === p.s ? 0 : (s - p.s) / (q.s - p.s);
    return { x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k, d: p.d + (q.d - p.d) * k };
  }

  function paintTree(canvas, gl) {
    if (!base) paintBase();
    canvas.width = G.W * SC;
    canvas.height = G.H * SC;
    const g = canvas.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(base, 0, 0);
    if (!gl) return;
    g.setTransform(SC, 0, 0, SC, 0, 0);
    g.lineCap = 'round';
    gl.arcs.forEach((a) => {
      g.beginPath();
      a.pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
      g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 3.2; g.stroke();
      g.strokeStyle = '#1d3a24'; g.lineWidth = 1.8; g.stroke();
    });
  }

  /* ---------- Bokeh (behind) and snow (in front) ---------- */
  const bokeh = document.getElementById('bokeh');
  const snow = document.getElementById('snow');
  const bg = bokeh.getContext('2d');
  const sg = snow.getContext('2d');
  let dots = [];
  let flakes = [];
  let raf = null;
  let dim = 0;
  let snowRate = 1;

  function sizeCanvas(c) {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = c.getBoundingClientRect();
    c.width = Math.max(1, rect.width * dpr);
    c.height = Math.max(1, rect.height * dpr);
    c.getContext('2d').setTransform(c.width / 1920, 0, 0, c.height / 1080, 0, 0);
  }

  function seed() {
    const r = rng(7);
    const warm = ['255,196,110', '255,140,90', '255,220,150', '120,170,255', '255,110,140', '150,230,170'];
    dots = Array.from({ length: 46 }, () => ({
      x: r() * 1920, y: r() * 1080, rad: 18 + r() * 70,
      c: warm[Math.floor(r() * warm.length)], a: 0.04 + r() * 0.1,
      vx: (r() - 0.5) * 0.08, vy: -0.03 - r() * 0.08, ph: r() * 6.28
    }));
    flakes = Array.from({ length: 130 }, () => {
      const near = r() < 0.12;
      return {
        x: r() * 1920, y: r() * 1080, rad: near ? 4 + r() * 5 : 1 + r() * 2.2,
        a: near ? 0.12 + r() * 0.1 : 0.25 + r() * 0.4, vy: near ? 0.9 + r() * 0.6 : 0.25 + r() * 0.5,
        sway: r() * 6.28, near
      };
    });
  }

  function frame(t) {
    bg.clearRect(0, 0, 1920, 1080);
    dots.forEach((d) => {
      d.x += d.vx; d.y += d.vy;
      if (d.y < -100) d.y = 1180;
      if (d.x < -100) d.x = 2020; if (d.x > 2020) d.x = -100;
      const tw = 0.75 + Math.sin(t / 1800 + d.ph) * 0.25;
      const a = d.a * tw * (1 - dim);
      if (a <= 0.002) return;
      const gr = bg.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.rad);
      gr.addColorStop(0, `rgba(${d.c},${a})`);
      gr.addColorStop(0.7, `rgba(${d.c},${a * 0.6})`);
      gr.addColorStop(1, `rgba(${d.c},0)`);
      bg.fillStyle = gr;
      bg.beginPath(); bg.arc(d.x, d.y, d.rad, 0, Math.PI * 2); bg.fill();
    });
    sg.clearRect(0, 0, 1920, 1080);
    flakes.forEach((f) => {
      f.y += f.vy * snowRate; f.sway += 0.01 * snowRate;
      const x = f.x + Math.sin(f.sway) * (f.near ? 18 : 8);
      if (f.y > 1090) { f.y = -10; f.x = Math.random() * 1920; }
      sg.fillStyle = `rgba(255,255,255,${f.a * (1 - dim * 0.6)})`;
      sg.beginPath(); sg.arc(x, f.y, f.rad, 0, Math.PI * 2); sg.fill();
    });
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf) return;
    if (reduce.matches) { frame(0); cancelAnimationFrame(raf); raf = null; return; }
    raf = requestAnimationFrame(frame);
  }
  function stop() { cancelAnimationFrame(raf); raf = null; }

  function resize() { sizeCanvas(bokeh); sizeCanvas(snow); }
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  seed();
  requestAnimationFrame(() => { resize(); start(); });

  XMAS.scene = {
    G,
    garland,
    along,
    paintTree,
    setDim(v) { dim = Math.max(0, Math.min(1, v)); },
    setSnow(rate) { snowRate = rate; },
    resize
  };
})();
