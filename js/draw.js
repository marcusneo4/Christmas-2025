/* The live draw: announce prize → Space → drum spins, ball drops, winner revealed → Space → next prize. */
(function () {
  const $ = (id) => document.getElementById(id);
  const el = {
    screen: $('draw'), rows: $('board-rows'), togo: $('togo'),
    drumWrap: document.querySelector('.drum-wrap'), drum: $('drum'), drumBalls: $('drum-balls'),
    liveBall: $('live-ball'), liveNum: $('live-ball-num'),
    strip: $('prize-strip'), label: $('prize-label'), prize: $('prize-name'),
    banner: $('winner-banner'), name: $('winner-name'), meta: $('winner-meta'),
    ticker: $('ticker'), grand: $('grand'), results: $('results-board')
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce.matches ? Math.min(ms, 120) : ms));
  const num = (i) => String(i + 1).padStart(2, '0');
  const isBonus = (p) => /bonus/i.test(p.label);

  let state = null;   // { prizes, winners, index, revealed }
  let busy = false;

  const save = () => XMAS.store.setDraw(state);
  const isLast = () => state.index === state.prizes.length - 1;

  function announce(text) { $('announcer').textContent = text; }

  /* ---- Board ---- */
  function renderBoard() {
    el.rows.innerHTML = '';
    state.prizes.forEach((p, i) => {
      const li = document.createElement('li');
      const won = i < state.index || (i === state.index && state.revealed);
      if (i < state.index) li.className = 'done';
      if (i === state.index) li.className = 'live';
      if (i === state.prizes.length - 1) li.classList.add('grand');
      const ball = document.createElement('span');
      ball.className = 'ball' + (isBonus(p) ? ' bonus' : '');
      ball.textContent = num(i);
      const name = document.createElement('span');
      name.className = 'p';
      name.textContent = p.name;
      const who = document.createElement('span');
      who.className = 'who';
      who.textContent = won ? state.winners[i] : '';
      li.append(ball, name, who);
      el.rows.append(li);
    });
    const left = state.prizes.length - state.index - (state.revealed ? 1 : 0);
    el.togo.textContent = left === 0 ? 'all drawn' : `${left} to go`;
    XMAS.ui.setCounter(`Draw ${num(state.index)} / ${String(state.prizes.length).padStart(2, '0')}`);
  }

  /* ---- Drum: remaining balls settle in a pile at the bottom of the globe ---- */
  function pile(count) {
    const R = 280, inner = 229, step = 72, out = [];
    for (let y = 470, row = 0; out.length < count && y > 80; y -= 60, row++) {
      const half = Math.sqrt(Math.max(0, inner * inner - (y - R) * (y - R)));
      const fit = Math.max(1, Math.floor((half * 2) / step) - (row % 2));
      const start = R - ((fit - 1) * step) / 2;
      for (let k = 0; k < fit && out.length < count; k++) {
        const jitter = ((out.length * 37) % 9) - 4;
        out.push([start + k * step - 37 + jitter, y - 37]);
      }
    }
    return out;
  }

  function renderDrum() {
    const from = state.index + (state.revealed ? 1 : 0);
    const remaining = state.prizes.map((p, i) => i).filter((i) => i >= from);
    const pos = pile(remaining.length);
    el.drumBalls.innerHTML = '';
    remaining.forEach((i, k) => {
      const b = document.createElement('span');
      b.className = 'ball' + (isBonus(state.prizes[i]) ? ' bonus' : '');
      b.textContent = num(i);
      b.style.left = pos[k][0] + 'px';
      b.style.top = pos[k][1] + 'px';
      b.style.rotate = `${((i * 47) % 50) - 25}deg`;
      b.style.setProperty('--d', `${-(k % 5) * 0.06}s`);
      b.style.setProperty('--jx', `${((k * 13) % 24) - 12}px`);
      b.style.setProperty('--jy', `${-8 - ((k * 7) % 14)}px`);
      el.drumBalls.append(b);
    });
  }

  /* Shrink a long name until it fits the banner. */
  function fitName(target, max, min) {
    target.style.fontSize = max + 'px';
    const banner = target.parentElement;
    const meta = banner.querySelector('.winner-meta');
    const room = banner.clientWidth - 68 - (meta ? meta.offsetWidth + 24 : 0);
    let size = max;
    while (target.scrollWidth > room && size > min) {
      size -= 4;
      target.style.fontSize = size + 'px';
    }
  }

  function renderStage({ animate = false } = {}) {
    const p = state.prizes[state.index];
    el.screen.classList.toggle('grand', isLast());
    el.label.textContent = p.label;
    el.prize.textContent = p.name;
    if (animate) { el.strip.classList.remove('wipe'); void el.strip.offsetWidth; el.strip.classList.add('wipe'); }

    el.banner.classList.remove('slam', 'flash');
    if (state.revealed) {
      el.banner.classList.remove('waiting');
      el.name.textContent = state.winners[state.index];
      el.meta.textContent = `Ball ${num(state.index)} · Winner`;
      el.liveBall.className = 'live-ball shown';
      el.liveNum.textContent = num(state.index);
      el.banner.setAttribute('aria-label', isLast() ? 'Show all winners' : 'Next prize');
      requestAnimationFrame(() => fitName(el.name, 132, 60));
    } else {
      el.banner.classList.add('waiting');
      el.name.textContent = isLast() ? 'For the grand prize…' : 'Who will it be?';
      el.name.style.fontSize = '';
      el.meta.innerHTML = '<kbd>Space</kbd>to draw';
      el.liveBall.className = 'live-ball empty';
      el.liveNum.textContent = '?';
      el.banner.setAttribute('aria-label', 'Draw the winner');
    }
  }

  function renderTicker() {
    el.ticker.innerHTML = '';
    const upto = state.index + (state.revealed ? 1 : 0);
    for (let i = 0; i < upto; i++) addTicker(i, false);
  }

  function addTicker(i, fresh) {
    const s = document.createElement('span');
    if (fresh) s.className = 'new';
    const b = document.createElement('b');
    b.textContent = num(i);
    s.append(b, `${state.prizes[i].name} — ${state.winners[i]}`);
    el.ticker.append(s);
  }

  function renderAll() {
    renderBoard();
    renderDrum();
    renderStage();
    renderTicker();
  }

  /* ---- The reveal ---- */
  async function reveal() {
    busy = true;
    const grand = isLast();
    const roll = grand ? 3200 : 1700;
    el.banner.classList.remove('waiting');
    el.name.textContent = grand ? 'Drumroll please…' : 'Drawing…';
    el.meta.textContent = '';
    el.liveBall.className = 'live-ball empty';
    el.drum.classList.add('spinning');
    el.drumWrap.classList.add('spinning');
    XMAS.audio.drumroll(roll / 1000);
    await wait(roll);

    el.drum.classList.remove('spinning');
    el.drumWrap.classList.remove('spinning');
    [...el.drumBalls.children].find((b) => b.textContent === num(state.index))?.remove();
    el.liveNum.textContent = num(state.index);
    el.liveBall.className = 'live-ball in';
    XMAS.audio.pop();
    await wait(700);

    state.revealed = true;
    save();
    const winner = state.winners[state.index];
    const p = state.prizes[state.index];
    el.name.textContent = winner;
    el.meta.textContent = `Ball ${num(state.index)} · Winner`;
    fitName(el.name, 132, 60);
    el.banner.classList.add('slam', 'flash');
    XMAS.audio.fanfare(grand);
    const r = el.banner.getBoundingClientRect();
    XMAS.fx.burst(r.left + r.width * 0.35, r.top + 20, grand ? 320 : 170);
    if (grand) XMAS.fx.rain(300);
    announce(`${p.label}, ${p.name}, goes to ${winner}`);

    renderBoard();
    renderDrum();
    addTicker(state.index, true);
    el.banner.setAttribute('aria-label', grand ? 'Show all winners' : 'Next prize');
    await wait(600);
    busy = false;
  }

  async function advance() {
    state.index += 1;
    state.revealed = false;
    save();
    renderBoard();
    renderDrum();
    renderStage({ animate: true });
    XMAS.audio.chime();
    const p = state.prizes[state.index];
    announce(`Next: ${p.label}, ${p.name}. Press Space to draw.`);
  }

  /* ---- Results ---- */
  function renderResults() {
    const n = state.prizes.length;
    const last = n - 1;
    const gp = state.prizes[last];
    el.grand.innerHTML = '';
    const strip = document.createElement('div');
    strip.className = 'prize-strip';
    strip.innerHTML = '<small></small><span></span>';
    strip.querySelector('small').textContent = gp.label;
    strip.querySelector('span').textContent = gp.name;
    const banner = document.createElement('div');
    banner.className = 'winner-banner static';
    const b = document.createElement('b');
    b.textContent = state.winners[last];
    const meta = document.createElement('span');
    meta.className = 'winner-meta';
    meta.textContent = `Ball ${num(last)} · Winner`;
    banner.append(b, meta);
    el.grand.append(strip, banner);
    requestAnimationFrame(() => fitName(b, 120, 56));

    el.results.innerHTML = '';
    const others = state.prizes.slice(0, last);
    el.results.style.setProperty('--rows', Math.max(1, Math.ceil(others.length / 2)));
    others.forEach((p, i) => {
      const li = document.createElement('li');
      li.style.setProperty('--i', i);
      li.innerHTML = '<span></span><span class="lbl"></span><span class="p"></span><span class="who"></span>';
      const [ball, lbl, name, who] = li.children;
      ball.className = 'ball' + (isBonus(p) ? ' bonus' : '');
      ball.textContent = num(i);
      lbl.textContent = p.label;
      name.textContent = p.name;
      who.textContent = state.winners[i];
      el.results.append(li);
    });
  }

  function showResults() {
    XMAS.audio.stopMusic();
    renderResults();
    XMAS.ui.show('results', { badge: 'Final results', tone: 'final', counter: `${state.prizes.length} winners` });
    XMAS.fx.rain(220);
    XMAS.audio.fanfare(true);
  }

  function resultsText() {
    if (!state) return '';
    const lines = state.prizes.map((p, i) => `${num(i)}  ${p.label} — ${p.name}: ${state.winners[i]}`);
    return `Soon Family Christmas Lucky Draw 2025 — Winners\n\n${lines.join('\n')}\n`;
  }

  /* ---- Public ---- */
  XMAS.draw = {
    start(names, prizes) {
      state = {
        prizes: prizes.map((p) => ({ label: p.label, name: p.name })),
        winners: XMAS.random.shuffle(names).slice(0, prizes.length),
        index: 0,
        revealed: false
      };
      save();
      this.open();
      announce(`The draw is live. ${state.prizes[0].label}, ${state.prizes[0].name}. Press Space to draw.`);
    },
    resume(saved) { state = saved; this.open(); },
    open() {
      if (state.index >= state.prizes.length - 1 && state.revealed) { showResults(); return; }
      XMAS.ui.show('draw', { badge: 'Live', tone: 'live' });
      renderAll();
      renderStage({ animate: true });
      XMAS.audio.startMusic();
    },
    async next() {
      if (!state || busy) return;
      if (!state.revealed) await reveal();
      else if (!isLast()) await advance();
      else showResults();
    },
    skip() {
      if (!state || busy) return;
      if (!confirm('Skip the rest of the draw and show every winner now?')) return;
      state.index = state.prizes.length - 1;
      state.revealed = true;
      save();
      showResults();
    },
    reopenResults() { if (state) showResults(); },
    resultsText,
    clear() { state = null; XMAS.store.clearDraw(); },
    get state() { return state; },
    get busy() { return busy; }
  };
})();
