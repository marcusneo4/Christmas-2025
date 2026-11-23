/* Particles on a full-window canvas: confetti, glass shards that follow the crack web,
   falling chips and glitter. Respects reduced motion. */
(function () {
  const canvas = document.getElementById('confetti');
  const g = canvas.getContext('2d');
  const colors = ['#ffd56b', '#fff3c4', '#ff5a5a', '#47d68a', '#56a8ff', '#ffb43a'];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pieces = [];
  let raf = null;
  let rain = 0;

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', size);
  size();

  function hexToRgb(c) {
    if (!c || c[0] !== '#') return [255, 255, 255];
    const n = parseInt(c.slice(1), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  const mix = ([r, gg, b], k) => k >= 0
    ? `rgb(${Math.round(r + (255 - r) * k)},${Math.round(gg + (255 - gg) * k)},${Math.round(b + (255 - b) * k)})`
    : `rgb(${Math.round(r * (1 + k))},${Math.round(gg * (1 + k))},${Math.round(b * (1 + k))})`;

  function piece(x, y, vx, vy) {
    return {
      kind: 'confetti', x, y, vx, vy,
      w: 8 + Math.random() * 10,
      h: 5 + Math.random() * 6,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: colors[(Math.random() * colors.length) | 0],
      life: 1
    };
  }

  function drawShard(p) {
    g.save();
    g.translate(p.x, p.y);
    g.rotate(p.r);
    g.scale(p.z, p.z * Math.cos(p.flip));
    g.globalAlpha = Math.max(0, Math.min(1, p.life));
    g.beginPath();
    p.poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    const lightness = 0.15 + 0.5 * Math.max(0, Math.sin(p.flip + p.r));
    g.fillStyle = mix(p.rgb, lightness * 0.6 - 0.1);
    g.globalAlpha *= 0.62;
    g.fill();
    g.globalAlpha /= 0.62;
    g.strokeStyle = `rgba(255,255,255,${0.35 + lightness * 0.6})`;
    g.lineWidth = 1.2;
    g.stroke();
    // a sliver of specular highlight along one edge
    if (p.poly.length > 2) {
      g.beginPath();
      g.moveTo(p.poly[0][0], p.poly[0][1]);
      g.lineTo(p.poly[1][0], p.poly[1][1]);
      g.strokeStyle = `rgba(255,255,255,${0.25 + lightness})`;
      g.lineWidth = 2;
      g.stroke();
    }
    g.restore();
  }

  function loop() {
    g.clearRect(0, 0, innerWidth, innerHeight);
    if (rain > 0) {
      for (let i = 0; i < 3; i++) pieces.push(piece(Math.random() * innerWidth, -20, (Math.random() - 0.5) * 2, 2 + Math.random() * 3));
      rain--;
    }
    const floor = innerHeight * 0.97;
    g.globalCompositeOperation = 'source-over';
    pieces.forEach((p) => {
      if (p.kind === 'shard') {
        p.vy += p.grav; p.vx *= 0.992; p.vy *= 0.995;
        p.x += p.vx; p.y += p.vy; p.r += p.vr; p.flip += p.vf;
        p.z += p.vz; p.vz *= 0.96;
        if (p.y > floor && p.vy > 0) { p.y = floor; p.vy *= -0.28; p.vx *= 0.6; p.vr *= 0.5; p.bounced++; }
        p.life -= p.bounced ? 0.04 : 0.012;
        if (p.y > innerHeight + 80 || p.x < -100 || p.x > innerWidth + 100) p.life = 0;
        drawShard(p);
        return;
      }
      if (p.kind === 'glitter') {
        p.vy += 0.12; p.vx *= 0.98; p.x += p.vx; p.y += p.vy; p.life -= p.decay;
        const a = Math.max(0, p.life) * (0.5 + 0.5 * Math.sin(p.ph += 0.6));
        g.fillStyle = `rgba(255,250,235,${a})`;
        g.fillRect(p.x, p.y, p.s, p.s);
        return;
      }
      p.vy += 0.18;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      if (p.y > innerHeight + 40) p.life = 0;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.r);
      g.scale(1, Math.cos(p.r * 2));
      g.fillStyle = p.c;
      g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      g.restore();
    });
    pieces = pieces.filter((p) => p.life > 0);
    if (pieces.length || rain > 0) raf = requestAnimationFrame(loop);
    else { raf = null; g.clearRect(0, 0, innerWidth, innerHeight); }
  }

  function start() { if (!raf) raf = requestAnimationFrame(loop); }

  function glitter(x, y, n, spread = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * spread;
      pieces.push({ kind: 'glitter', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, s: 1.5 + Math.random() * 2.5, life: 1, decay: 0.008 + Math.random() * 0.02, ph: Math.random() * 6 });
    }
  }

  XMAS.fx = {
    /* Burst from screen point (x, y) in CSS pixels. */
    burst(x, y, count = 160) {
      const n = reduce.matches ? Math.round(count / 5) : count;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
        const s = 8 + Math.random() * 14;
        pieces.push(piece(x, y, Math.cos(a) * s, Math.sin(a) * s));
      }
      start();
    },
    /* Confetti falling from the top for `frames` frames. */
    rain(frames = 240) {
      rain = reduce.matches ? 40 : frames;
      start();
    },
    /* Shatter a bauble along its crack web.
       cells: polygons in glass pixels (0–size); rect: the glass element's screen rect;
       impact: {x, y} in glass pixels; power: 1 normal, 1.6 for the grand double burst. */
    shatterCells(cells, rect, color, impact, power = 1, size = 220) {
      const k = rect.width / size;
      const rgb = hexToRgb(color);
      const ix = rect.left + impact.x * k, iy = rect.top + impact.y * k;
      const list = reduce.matches ? cells.filter((_, i) => i % 3 === 0) : cells;
      list.forEach((poly) => {
        const pts = poly.map((p) => [rect.left + p.x * k, rect.top + p.y * k]);
        const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
        const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
        const dx = cx - ix, dy = cy - iy;
        const dist = Math.hypot(dx, dy) || 1;
        const sp = (3 + Math.random() * 7) * power * (1.2 - Math.min(1, dist / (rect.width * 0.6)) * 0.5);
        pieces.push({
          kind: 'shard',
          x: cx, y: cy,
          poly: pts.map(([x, y]) => [x - cx, y - cy]),
          vx: (dx / dist) * sp + (Math.random() - 0.5) * 2,
          vy: (dy / dist) * sp - (2 + Math.random() * 4) * power,
          grav: 0.32 + Math.random() * 0.12,
          r: 0, vr: (Math.random() - 0.5) * 0.25 * power,
          flip: 0, vf: (Math.random() - 0.5) * 0.3,
          z: 1, vz: (Math.random() - 0.3) * 0.04 * power,
          rgb, life: 1.5 + Math.random() * 0.4, bounced: 0
        });
      });
      glitter(ix, iy, reduce.matches ? 20 : Math.round(90 * power), 10 * power);
      start();
    },
    /* A couple of tiny chips flaking off a stressed bauble. */
    chips(x, y, color, n = 3) {
      const rgb = hexToRgb(color);
      for (let i = 0; i < n; i++) {
        const s = 3 + Math.random() * 5;
        pieces.push({
          kind: 'shard', x: x + (Math.random() - 0.5) * 40, y,
          poly: [[-s, -s * 0.6], [s, -s * 0.2], [0, s]],
          vx: (Math.random() - 0.5) * 1.5, vy: Math.random() * 1,
          grav: 0.3, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
          flip: 0, vf: 0.2, z: 1, vz: 0, rgb, life: 1.2, bounced: 0
        });
      }
      glitter(x, y, 6, 2);
      start();
    },
    glitter(x, y, n = 30) { glitter(x, y, n); start(); },
    clear() { pieces = []; rain = 0; }
  };
})();
