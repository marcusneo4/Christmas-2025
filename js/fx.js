/* Confetti on a full-window canvas. Bursts from a point; respects reduced motion. */
(function () {
  const canvas = document.getElementById('confetti');
  const g = canvas.getContext('2d');
  const colors = ['#ffd21f', '#ff2d3d', '#14c46b', '#f4f7ff', '#1d58ff'];
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

  function piece(x, y, vx, vy) {
    return {
      x, y, vx, vy,
      w: 8 + Math.random() * 10,
      h: 5 + Math.random() * 6,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: colors[(Math.random() * colors.length) | 0],
      life: 1
    };
  }

  function loop() {
    g.clearRect(0, 0, innerWidth, innerHeight);
    if (rain > 0) {
      for (let i = 0; i < 3; i++) pieces.push(piece(Math.random() * innerWidth, -20, (Math.random() - 0.5) * 2, 2 + Math.random() * 3));
      rain--;
    }
    pieces.forEach((p) => {
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
    clear() { pieces = []; rain = 0; }
  };
})();
