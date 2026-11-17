/* Persistence (localStorage) and fair randomness. */
(function () {
  const KEY = 'soonxmas25';
  const read = (k, fallback) => {
    try {
      const v = localStorage.getItem(`${KEY}.${k}`);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  };
  const write = (k, v) => {
    try { localStorage.setItem(`${KEY}.${k}`, JSON.stringify(v)); } catch { /* storage full or blocked: run in memory */ }
  };
  const remove = (k) => { try { localStorage.removeItem(`${KEY}.${k}`); } catch { /* ignore */ } };

  /* Uniform integer in [0, max) from the browser's cryptographic RNG (rejection sampling, no modulo bias). */
  function randomInt(max) {
    if (max <= 0) return 0;
    const limit = Math.floor(0x100000000 / max) * max;
    const buf = new Uint32Array(1);
    let x;
    do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit);
    return x % max;
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* Split text into unique, trimmed names; report duplicates so the host can tell two people apart. */
  function parseNames(text) {
    const seen = new Set();
    const names = [];
    const dupes = [];
    text.split(/\r?\n|,/).map((s) => s.trim()).filter(Boolean).forEach((n) => {
      const key = n.toLowerCase();
      if (seen.has(key)) dupes.push(n); else { seen.add(key); names.push(n); }
    });
    return { names, dupes };
  }

  XMAS.store = {
    getNamesText: () => read('namesText', null),
    setNamesText: (t) => write('namesText', t),
    getPrizes: () => read('prizes', null),
    setPrizes: (p) => write('prizes', p),
    getDraw: () => read('draw', null),
    setDraw: (d) => write('draw', d),
    clearDraw: () => remove('draw'),
    getSuspense: () => read('suspense', 'auto'),
    setSuspense: (q) => write('suspense', q),
    getMuted: () => read('muted', false),
    setMuted: (m) => write('muted', m)
  };
  XMAS.random = { randomInt, shuffle };
  XMAS.parseNames = parseNames;
})();
