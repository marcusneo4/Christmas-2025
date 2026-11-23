/* Glass fracture engine for the finalist baubles.
   Each bauble gets one impact point, radial cracks that branch and wander, and spider-web
   rings joining them, revealed in five levels:
     1 hairline · 2 star · 3 web · 4 deep (second impact) · 5 critical (cracks glow, glints)
   Cracks grow outward from the impact. When the bauble bursts, the same web is cut into
   shards so the pieces follow the real crack lines.
   Crack levels are pure theatre: they carry no information about who wins. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const SIZE = 220, C = SIZE / 2, R = SIZE / 2;
  const RINGS = [22, 46, 78, 112];
  const REACH = [0, 36, 50, 82, 999, 999];
  const WIDTH = [0, 1.15, 1.45, 1.75, 2.1, 2.4];
  const rnd = () => Math.random();

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function polyline(pts) {
    return pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }

  function march(x, y, ang, maxLen, wander, step = 8) {
    const pts = [{ x, y, d: 0 }];
    let d = 0;
    const base = ang;
    while (d < maxLen) {
      ang += (rnd() - 0.5) * wander;
      ang = ang * 0.8 + base * 0.2;
      const len = step * (0.6 + rnd() * 0.8);
      x += Math.cos(ang) * len; y += Math.sin(ang) * len; d += len;
      pts.push({ x, y, d });
      if (Math.hypot(x - C, y - C) > R + 14) break;
    }
    return pts;
  }

  /* Part of a polyline between distances a and b. */
  function slice(pts, a, b) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (i > 0) {
        const q = pts[i - 1];
        const lerp = (D) => { const k = (D - q.d) / (p.d - q.d); return { x: q.x + (p.x - q.x) * k, y: q.y + (p.y - q.y) * k, d: D }; };
        if (q.d < a && p.d > a) out.push(lerp(a));
        if (q.d < b && p.d > b) { out.push(lerp(b)); break; }
      }
      if (p.d >= a && p.d <= b) out.push(p);
    }
    return out;
  }

  function pointAt(pts, D) {
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].d >= D) {
        const q = pts[i - 1], p = pts[i];
        const k = (D - q.d) / (p.d - q.d);
        return { x: q.x + (p.x - q.x) * k, y: q.y + (p.y - q.y) * k };
      }
    }
    const last = pts[pts.length - 1];
    return { x: last.x, y: last.y };
  }

  function clampToCircle(p) {
    const dx = p.x - C, dy = p.y - C;
    const d = Math.hypot(dx, dy);
    if (d <= R) return p;
    return { x: C + (dx / d) * R, y: C + (dy / d) * R };
  }

  function area(poly) {
    let a = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      a += p.x * q.y - q.x * p.y;
    }
    return Math.abs(a / 2);
  }

  function create(glassEl) {
    const old = glassEl.querySelector('.cracks');
    if (old) old.remove();
    const svg = el('svg', { class: 'cracks', viewBox: `0 0 ${SIZE} ${SIZE}`, 'aria-hidden': 'true' });
    const shadow = el('g', { class: 'ck-sh', transform: 'translate(.9 1.3)' }, svg);
    const light = el('g', { class: 'ck-hl' }, svg);
    const glints = el('g', { class: 'ck-gl' }, svg);
    glassEl.appendChild(svg);

    // impact point, off-centre
    const ia = rnd() * Math.PI * 2, ir = 18 + rnd() * 42;
    const ix = C + Math.cos(ia) * ir, iy = C + Math.sin(ia) * ir;

    // radials
    const N = 8 + Math.floor(rnd() * 4);
    const off = rnd() * Math.PI * 2;
    const radials = Array.from({ length: N }, (_, i) => {
      const a = off + (i / N) * Math.PI * 2 + (rnd() - 0.5) * (Math.PI / N) * 0.9;
      return { pts: march(ix, iy, a, 260, 0.55), shown: 0 };
    });
    const firstThree = radials.slice().sort(() => rnd() - 0.5).slice(0, 3);

    // ring segments between neighbouring radials
    const rings = RINGS.map((rad, k) => {
      const segs = [];
      for (let i = 0; i < N; i++) {
        if (rnd() > (k < 2 ? 0.9 : 0.7)) continue;
        const j = (i + 1) % N;
        const D1 = rad * (0.85 + rnd() * 0.3), D2 = rad * (0.85 + rnd() * 0.3);
        const p = pointAt(radials[i].pts, D1), q = pointAt(radials[j].pts, D2);
        const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
        const out = Math.hypot(mx - ix, my - iy) || 1;
        const bow = (rnd() - 0.3) * 7;
        const m = { x: mx + ((mx - ix) / out) * bow, y: my + ((my - iy) / out) * bow };
        const jag = { x: (p.x + m.x) / 2 + (rnd() - 0.5) * 4, y: (p.y + m.y) / 2 + (rnd() - 0.5) * 4 };
        segs.push({ pts: [p, jag, m, q], dist: rad });
      }
      return segs;
    });

    // side branches off the radials
    const branches = [];
    radials.forEach((r) => {
      const count = 1 + Math.floor(rnd() * 3);
      for (let b = 0; b < count; b++) {
        const D = 20 + rnd() * 110;
        const p = pointAt(r.pts, D);
        const i = r.pts.findIndex((q) => q.d >= D);
        const q = r.pts[Math.max(1, i)], s = r.pts[Math.max(0, i - 1)];
        const dir = Math.atan2(q.y - s.y, q.x - s.x) + (rnd() < 0.5 ? -1 : 1) * (0.45 + rnd() * 0.5);
        branches.push({ pts: march(p.x, p.y, dir, 14 + rnd() * 30, 0.7, 6), at: D, lvl: D < 60 ? 3 : 4 });
      }
    });
    // a few hair-fine extras for the critical stage
    for (let i = 0; i < 10; i++) {
      const r = radials[Math.floor(rnd() * N)];
      const p = pointAt(r.pts, 30 + rnd() * 90);
      branches.push({ pts: march(p.x, p.y, rnd() * Math.PI * 2, 8 + rnd() * 18, 0.9, 5), at: 0, lvl: 5 });
    }

    // second, smaller impact for the deep stage
    const sa = ia + Math.PI * (0.6 + rnd() * 0.8), sr = 30 + rnd() * 40;
    const sx = C + Math.cos(sa) * sr, sy = C + Math.sin(sa) * sr;
    const star2 = Array.from({ length: 5 }, (_, i) => march(sx, sy, (i / 5) * Math.PI * 2 + rnd(), 20 + rnd() * 26, 0.6, 6));

    let level = 0;

    function draw(pts, width, delay, dur) {
      if (pts.length < 2) return;
      const d = polyline(pts);
      const a = el('path', { d, pathLength: 1, 'stroke-width': width + 1.4 }, shadow);
      const b = el('path', { d, pathLength: 1, 'stroke-width': width }, light);
      const vars = { strokeDashoffset: 0, duration: dur, delay, ease: 'power1.out' };
      if (window.gsap) { gsap.to([a, b], vars); } else { a.style.strokeDashoffset = 0; b.style.strokeDashoffset = 0; }
    }

    function glint(x, y, delay) {
      const c = el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 1.6 + rnd() * 1.8 }, glints);
      c.style.animationDelay = (delay + rnd() * 1.2).toFixed(2) + 's';
    }

    /* Grow cracks up to level `to` (1–5). speed: px of crack per second. Returns seconds taken. */
    function setLevel(to, { speed = 240 } = {}) {
      to = Math.min(5, Math.max(level, to));
      let longest = 0;
      for (let L = level + 1; L <= to; L++) {
        const w = WIDTH[L];
        const t0 = (L - level - 1) * 0.12;
        const reach = REACH[L];
        const set = L === 1 ? firstThree : radials;
        set.forEach((r) => {
          const max = r.pts[r.pts.length - 1].d;
          const target = Math.min(max, reach);
          if (target <= r.shown) return;
          const part = slice(r.pts, Math.max(0, r.shown - 0.5), target);
          const dur = (target - r.shown) / speed;
          draw(part, w, t0 + r.shown / speed * 0.15, dur);
          longest = Math.max(longest, t0 + dur);
          r.shown = target;
        });
        const ringIdx = L - 2;
        if (ringIdx >= 0 && rings[ringIdx]) {
          rings[ringIdx].forEach((s) => {
            const delay = t0 + s.dist / speed;
            draw(s.pts, w * 0.8, delay, 0.18 + rnd() * 0.15);
            longest = Math.max(longest, delay + 0.3);
          });
        }
        branches.filter((b) => b.lvl === L).forEach((b) => {
          const delay = t0 + b.at / speed;
          draw(b.pts, w * 0.7, delay, 0.12 + rnd() * 0.2);
        });
        if (L === 4) star2.forEach((pts) => draw(pts, w * 0.85, t0 + 0.15, 0.25));
        if (L >= 3) {
          for (let g = 0; g < (L === 5 ? 9 : 3); g++) {
            const r = radials[Math.floor(rnd() * N)];
            const p = pointAt(r.pts, Math.min(r.shown, 20 + rnd() * 90));
            glint(p.x, p.y, t0);
          }
        }
      }
      level = to;
      svg.setAttribute('data-level', level);
      return longest;
    }

    /* Polygons (in glass pixels, 0–220) following the crack web, for the shatter. */
    function cells() {
      const D = [0, ...RINGS, 260];
      const out = [];
      for (let i = 0; i < N; i++) {
        const A = radials[i].pts, B = radials[(i + 1) % N].pts;
        for (let k = 0; k < D.length - 1; k++) {
          const poly = [pointAt(A, D[k]), pointAt(A, D[k + 1]), pointAt(B, D[k + 1]), pointAt(B, D[k])].map(clampToCircle);
          const ar = area(poly);
          if (ar < 12) continue;
          if (ar > 450) {
            const tris = [[poly[0], poly[1], poly[2]], [poly[0], poly[2], poly[3]]];
            tris.forEach((t) => {
              if (area(t) > 600) {
                const m = { x: (t[0].x + t[1].x + t[2].x) / 3 + (rnd() - 0.5) * 6, y: (t[0].y + t[1].y + t[2].y) / 3 + (rnd() - 0.5) * 6 };
                out.push([t[0], t[1], m], [t[1], t[2], m], [t[2], t[0], m]);
              } else out.push(t);
            });
          } else out.push(poly);
        }
      }
      return out;
    }

    return {
      get level() { return level; },
      impact: { x: ix, y: iy },
      setLevel,
      add(n = 1, opts) { return setLevel(level + n, opts); },
      cells,
      heal(dur = 0.4) { if (window.gsap) gsap.to(svg, { opacity: 0, duration: dur }); else svg.style.opacity = 0; }
    };
  }

  XMAS.glass = { create, SIZE };
})();
