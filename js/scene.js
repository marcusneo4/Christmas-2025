/* The room: a painted fir tree (canvas, drawn once per layout), drifting bokeh lights
   behind it and slow snow in front. */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const CX = 660;

  /* Seeded RNG so the tree looks the same every time it is painted. */
  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  const TIERS = [
    { top: 168, bot: 340, w0: 8, w1: 150 },
    { top: 250, bot: 480, w0: 60, w1: 270 },
    { top: 370, bot: 630, w0: 120, w1: 390 },
    { top: 500, bot: 780, w0: 190, w1: 500 },
    { top: 640, bot: 915, w0: 260, w1: 610 }
  ];

  function tierPath(g, t, r) {
    g.beginPath();
    g.moveTo(CX - t.w0, t.top);
    g.lineTo(CX + t.w0, t.top);
    // right flank
    g.lineTo(CX + t.w1, t.bot - 18);
    // drooping branch tips along the bottom edge, right to left
    const tips = Math.round(t.w1 / 34);
    for (let i = 0; i <= tips; i++) {
      const x = CX + t.w1 - (i / tips) * t.w1 * 2;
      const sag = 14 + r() * 14;
      g.quadraticCurveTo(x + (t.w1 / tips) * 0.5, t.bot + sag, x, t.bot - 4 - r() * 10);
    }
    g.lineTo(CX - t.w0, t.top);
    g.closePath();
  }

  function paintTree(canvas) {
    const S = 2;
    canvas.width = 1320 * S;
    canvas.height = 1080 * S;
    const g = canvas.getContext('2d');
    g.setTransform(S, 0, 0, S, 0, 0);
    g.clearRect(0, 0, 1320, 1080);
    const r = rng(20251225);

    // tree skirt + floor glow
    const floor = g.createRadialGradient(CX, 960, 20, CX, 960, 520);
    floor.addColorStop(0, 'rgba(255,190,120,.10)');
    floor.addColorStop(1, 'rgba(255,190,120,0)');
    g.fillStyle = floor;
    g.fillRect(0, 760, 1320, 320);

    // trunk
    const trunk = g.createLinearGradient(CX - 40, 0, CX + 40, 0);
    trunk.addColorStop(0, '#2a180d'); trunk.addColorStop(0.5, '#563620'); trunk.addColorStop(1, '#2a180d');
    g.fillStyle = trunk;
    g.fillRect(CX - 38, 880, 76, 180);

    // skirt
    g.fillStyle = '#5a1418';
    g.beginPath();
    g.ellipse(CX, 1058, 300, 30, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,.08)';
    g.beginPath();
    g.ellipse(CX, 1054, 300, 22, 0, Math.PI, Math.PI * 2);
    g.fill();

    // tiers, back to front, each filled then needled
    const greens = ['#0b2617', '#103420', '#15422a', '#1b5034', '#225e3e', '#2b6e49', '#3a8457'];
    TIERS.slice().reverse().forEach((t, ri) => {
      const ti = TIERS.length - 1 - ri;
      g.save();
      tierPath(g, t, r);
      const base = g.createLinearGradient(0, t.top, 0, t.bot);
      base.addColorStop(0, '#0f3320');
      base.addColorStop(1, '#0a2416');
      g.fillStyle = base;
      g.fill();
      g.clip();
      // shadow cast by the tier above
      if (ti < TIERS.length - 1) {
        const sh = g.createLinearGradient(0, t.bot - 70, 0, t.bot + 30);
        sh.addColorStop(0, 'rgba(0,0,0,0)');
        sh.addColorStop(1, 'rgba(0,0,0,.35)');
        g.fillStyle = sh;
        g.fillRect(0, t.bot - 70, 1320, 100);
      }
      // needles
      const n = 2200 + ti * 900;
      for (let i = 0; i < n; i++) {
        const v = Math.sqrt(r());
        const y = t.top + v * (t.bot - t.top + 20);
        const half = t.w0 + (t.w1 - t.w0) * v;
        const u = r() * 2 - 1;
        const x = CX + u * half;
        const edge = Math.abs(u);
        const side = u < 0 ? -1 : 1;
        const ang = (0.35 + r() * 0.6) * side + (r() - 0.5) * 0.5;
        const len = 7 + r() * 16 + edge * 6;
        const light = Math.min(greens.length - 1, Math.floor(edge * 3.2 + (1 - v) * 1.8 + r() * 2.4));
        g.strokeStyle = greens[light];
        g.globalAlpha = 0.65 + r() * 0.35;
        g.lineWidth = 1 + r() * 1.6;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + Math.cos(ang) * len * side, y + Math.sin(Math.abs(ang)) * len);
        g.stroke();
      }
      g.globalAlpha = 1;
      g.restore();
    });

    // gold bead garlands (tinsel swags)
    g.save();
    for (let s = 0; s < 5; s++) {
      const t = TIERS[s];
      const y0 = t.top + (t.bot - t.top) * 0.45;
      const x0 = CX - (t.w0 + (t.w1 - t.w0) * 0.45) * 0.95;
      const x1 = CX + (t.w0 + (t.w1 - t.w0) * 0.7) * 0.95;
      const y1 = t.top + (t.bot - t.top) * 0.78;
      const steps = 60 + s * 14;
      for (let i = 0; i <= steps; i++) {
        const k = i / steps;
        const x = x0 + (x1 - x0) * k;
        const y = y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * 26;
        const gr = g.createRadialGradient(x - 1, y - 1, 0, x, y, 3.2);
        gr.addColorStop(0, '#fff2c0'); gr.addColorStop(0.5, '#c9962e'); gr.addColorStop(1, 'rgba(90,60,10,0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); g.fill();
      }
    }
    g.restore();

    // a few decorative glass balls
    const ballColors = [['#ffe9a8', '#b8861c'], ['#ff9c9c', '#8f1f24'], ['#e9eef7', '#7b8496'], ['#9fd0ff', '#20457a']];
    for (let i = 0; i < 22; i++) {
      const t = TIERS[1 + Math.floor(r() * 4)];
      const v = 0.3 + r() * 0.65;
      const y = t.top + v * (t.bot - t.top);
      const half = (t.w0 + (t.w1 - t.w0) * v) * 0.85;
      const x = CX + (r() * 2 - 1) * half;
      const rad = 7 + r() * 6;
      const [hi, lo] = ballColors[i % ballColors.length];
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.beginPath(); g.arc(x + 2, y + 3, rad, 0, Math.PI * 2); g.fill();
      const gr = g.createRadialGradient(x - rad * 0.4, y - rad * 0.4, rad * 0.1, x, y, rad);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, hi); gr.addColorStop(1, lo);
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c9a23c';
      g.fillRect(x - 2.5, y - rad - 3, 5, 4);
    }

    // presents under the tree
    const gifts = [
      { x: CX - 250, w: 120, h: 78, c: '#9c1f2a', rib: '#f2d27a' },
      { x: CX - 130, w: 92, h: 110, c: '#1d4f7a', rib: '#e9eef7' },
      { x: CX + 120, w: 130, h: 70, c: '#d9b45a', rib: '#9c1f2a' },
      { x: CX + 255, w: 86, h: 96, c: '#1f6a43', rib: '#f2d27a' },
      { x: CX + 5, w: 70, h: 54, c: '#e9e2d0', rib: '#c2333a' }
    ];
    gifts.forEach((p) => {
      p.h *= 0.55; p.w *= 0.75;
      const top = 1068 - p.h;
      g.fillStyle = 'rgba(0,0,0,.45)';
      g.fillRect(p.x - p.w / 2 + 6, top + 8, p.w, p.h);
      const gr = g.createLinearGradient(p.x - p.w / 2, 0, p.x + p.w / 2, 0);
      gr.addColorStop(0, p.c); gr.addColorStop(1, shade(p.c, -0.35));
      g.fillStyle = gr;
      g.fillRect(p.x - p.w / 2, top, p.w, p.h);
      g.fillStyle = p.rib;
      g.fillRect(p.x - 6, top, 12, p.h);
      g.fillRect(p.x - p.w / 2, top + p.h * 0.42, p.w, 10);
      g.beginPath();
      g.ellipse(p.x - 12, top - 6, 13, 8, -0.5, 0, Math.PI * 2);
      g.ellipse(p.x + 12, top - 6, 13, 8, 0.5, 0, Math.PI * 2);
      g.fill();
    });
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => Math.max(0, Math.min(255, Math.round(c * (1 + amt))));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
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
    flakes = Array.from({ length: 110 }, () => {
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
      const gr = bg.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.rad);
      const a = d.a * tw * (1 - dim * 0.8);
      gr.addColorStop(0, `rgba(${d.c},${a})`);
      gr.addColorStop(0.7, `rgba(${d.c},${a * 0.6})`);
      gr.addColorStop(1, `rgba(${d.c},0)`);
      bg.fillStyle = gr;
      bg.beginPath(); bg.arc(d.x, d.y, d.rad, 0, Math.PI * 2); bg.fill();
    });
    sg.clearRect(0, 0, 1920, 1080);
    flakes.forEach((f) => {
      f.y += f.vy; f.sway += 0.01;
      const x = f.x + Math.sin(f.sway) * (f.near ? 18 : 8);
      if (f.y > 1090) { f.y = -10; f.x = Math.random() * 1920; }
      sg.fillStyle = `rgba(255,255,255,${f.a})`;
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
    paintTree,
    setDim(v) { dim = v; },
    resize
  };
})();
