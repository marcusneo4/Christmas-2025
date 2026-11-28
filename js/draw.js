/* Draw controller: rounds, prize announcements, live winner choice, redraws, rehearsal,
   saved progress and results. Winners are chosen at the moment the host presses Space —
   never in advance. */
(function () {
  const $ = (id) => document.getElementById(id);
  const pad2 = (n) => String(n).padStart(2, '0');
  const BULBS = ['#ff5a5a', '#ffb43a', '#47d68a', '#56a8ff', '#ff7fc0', '#ffe066'];

  function ordinal(n) {
    const v = n % 100;
    const suf = v >= 11 && v <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
    return n + suf;
  }

  /* Ranked list (1st first) + show settings → prizes in draw order and the rounds to run. */
  function plan(ranked, show) {
    const N = ranked.length;
    const prizes = [];
    for (let r = N; r >= 1; r--) prizes.push({ rank: r, label: `${ordinal(r)} prize`, name: ranked[r - 1] });
    const full = Math.max(1, show.fullTop | 0);
    const k = show.rest === 'batch5' ? 5 : show.rest === 'batch3' ? 3 : 1;
    const rounds = [];
    let group = [];
    const flush = () => {
      while (group.length) {
        const chunk = group.splice(0, k);
        rounds.push({ start: chunk[0], count: chunk.length, show: chunk.length > 1 ? 'batch' : 'quick' });
      }
    };
    prizes.forEach((p, i) => {
      if (p.rank === 1) { flush(); rounds.push({ start: i, count: 1, show: 'grand' }); }
      else if (p.rank <= full) { flush(); rounds.push({ start: i, count: 1, show: 'full' }); }
      else group.push(i);
    });
    flush();
    return { prizes, rounds };
  }

  const SECONDS = { grand: 150, full: 100, quick: 58, batch: 70 };
  function estimate(ranked, show, speed = 1) {
    if (!ranked.length) return { rounds: 0, minutes: 0 };
    const { rounds } = plan(ranked, show);
    const secs = rounds.reduce((a, r) => a + SECONDS[r.show] + 14, 0) / speed;
    return { rounds: rounds.length, minutes: Math.max(1, Math.round(secs / 60)) };
  }

  let state = null;   // see start()
  let busy = false;
  let mode = 'prize'; // or 'players'
  const players = { picked: [] };

  const save = () => { if (state && !state.rehearsal) XMAS.store.setDraw(state); };
  const round = () => state.rounds[state.round];
  const isGrand = () => state && round().show === 'grand' && state.redrawIndex == null;
  const isLast = () => state.round === state.rounds.length - 1;
  const roundPrizes = (r = round()) => state.prizes.slice(r.start, r.start + r.count);
  const wonSet = () => new Set(state ? state.winners.filter(Boolean) : []);

  function announce(t) { $('announcer').textContent = t; }
  function setCue(html) { $('cue').innerHTML = html; }

  function renderRecent(items, head) {
    const ol = $('recent');
    ol.innerHTML = '';
    items.slice(-6).reverse().forEach(([a, b]) => {
      const li = document.createElement('li');
      const s1 = document.createElement('span');
      s1.textContent = a;
      const s2 = document.createElement('b');
      s2.textContent = b;
      li.append(s1, s2);
      ol.append(li);
    });
    $('recent-head').textContent = head;
    $('recent-head').hidden = items.length === 0;
  }

  function pool() {
    const out = new Set(state.winners.filter(Boolean).concat(state.absent));
    return state.names.filter((n) => !out.has(n));
  }
  function prizeRecent() {
    const items = [];
    state.prizes.forEach((p, i) => { if (state.winners[i]) items.push([`${ordinal(p.rank)} · ${p.name}`, state.winners[i]]); });
    renderRecent(items, 'Already won');
  }

  function enterPanel() {
    const p = $('prize-panel');
    p.classList.remove('enter', 'drum'); void p.offsetWidth; p.classList.add('enter');
  }

  /* The prize announcement: the name builds in over a drumroll. */
  function drumIn() {
    const p = $('prize-panel');
    p.classList.remove('drum'); void p.offsetWidth; p.classList.add('drum');
    XMAS.audio.announce();
    XMAS.audio.drumroll(1.6);
  }

  function setRedrawVisible(on) {
    $('redraw').hidden = !on;
    $('redraw-pick').hidden = true;
    $('redraw-key').hidden = !on;
  }

  /* ---------- Prize mode ---------- */
  function renderAnnounce() {
    const nameEl = $('prize-name');
    nameEl.classList.remove('multi');
    if (state.redrawIndex != null) {
      const p = state.prizes[state.redrawIndex];
      $('prize-label').textContent = `Redraw · ${p.label}`;
      nameEl.textContent = p.name;
      setCue('<kbd>Space</kbd>Redraw this prize');
    } else {
      const r = round();
      const ps = roundPrizes(r);
      if (r.count === 1) {
        $('prize-label').textContent = isGrand() ? 'The 1st prize' : ps[0].label;
        nameEl.textContent = ps[0].name;
      } else {
        $('prize-label').textContent = `${ordinal(ps[ps.length - 1].rank)}–${ordinal(ps[0].rank)} prizes`;
        nameEl.classList.add('multi');
        nameEl.innerHTML = '';
        ps.forEach((p) => {
          const row = document.createElement('span');
          row.innerHTML = '<i></i><em></em>';
          row.children[0].textContent = ordinal(p.rank);
          row.children[1].textContent = p.name;
          nameEl.append(row);
        });
      }
      setCue(`<kbd>Space</kbd>${isGrand() ? 'Light the tree for the 1st prize' : 'Light the tree'}`);
    }
    $('progress').textContent = `Round ${state.round + 1} of ${state.rounds.length}`;
    XMAS.tree.reset();
    XMAS.tree.setStatus(pool().length, 'names on the tree');
    prizeRecent();
    setRedrawVisible(false);
    XMAS.ui.setCounter(`Round ${pad2(state.round + 1)} / ${pad2(state.rounds.length)}`);
    enterPanel();
  }

  function wonCue() {
    setCue(isLast() && state.redrawIndex == null ? '<kbd>Space</kbd>See all the winners' : '<kbd>Space</kbd>Next prize');
  }

  function pickPending(candidates, k) {
    const valid = Array.isArray(state.pending) && state.pending.length === k &&
      new Set(state.pending).size === k && state.pending.every((n) => candidates.includes(n));
    if (!valid) state.pending = XMAS.random.shuffle(candidates).slice(0, k);
    return state.pending;
  }

  async function runPrize() {
    if (state.redrawIndex != null) return runRedraw();
    busy = true;
    const r = round();
    const ps = roundPrizes(r);
    const candidates = pool();
    const k = Math.min(r.count, candidates.length);
    if (!k) { busy = false; alert('Everyone on the list has already won or is marked as not here.'); return; }
    const winners = pickPending(candidates, k);
    state.phase = 'running';
    save();
    setCue('<span class="watch">Watch the tree…</span>');
    const mode2 = r.show === 'batch' && k > 1 ? 'batch' : r.show === 'batch' ? 'quick' : r.show;
    const done = await XMAS.tree.run({
      pool: candidates,
      winners,
      mode: mode2,
      plateLabel: r.show === 'grand' ? '1st prize winner' : k > 1 ? 'They light the star!' : 'Lights the star!',
      prizeLabel: 'The 1st prize',
      prizeText: `${ps[0].label} · ${ps[0].name}`,
      lines: ps.slice(0, k).map((p) => ({ rank: p.label, prize: p.name }))
    });
    if (!done) { busy = false; return; }
    winners.forEach((w, j) => { state.winners[r.start + j] = w; XMAS.tree.markWon(w); });
    state.pending = null;
    state.phase = 'won';
    save();
    prizeRecent();
    announce(ps.slice(0, k).map((p, j) => `${p.label}, ${p.name}, goes to ${winners[j]}`).join('. '));
    wonCue();
    setRedrawVisible(true);
    busy = false;
  }

  async function runRedraw() {
    busy = true;
    const idx = state.redrawIndex;
    const p = state.prizes[idx];
    const candidates = pool();
    if (!candidates.length) { busy = false; alert('Nobody is left to draw.'); return; }
    const [w] = pickPending(candidates, 1);
    state.phase = 'running';
    save();
    setCue('<span class="watch">Watch the tree…</span>');
    const done = await XMAS.tree.run({ pool: candidates, winners: [w], mode: 'quick', plateLabel: 'Redraw!', prizeText: `${p.label} · ${p.name}` });
    if (!done) { busy = false; return; }
    state.winners[idx] = w;
    XMAS.tree.markWon(w);
    state.redrawIndex = null;
    state.pending = null;
    state.phase = 'won';
    save();
    prizeRecent();
    announce(`Redraw: ${p.label}, ${p.name}, goes to ${w}`);
    wonCue();
    setRedrawVisible(true);
    busy = false;
  }

  function askRedraw(idx) {
    const name = state.winners[idx];
    const p = state.prizes[idx];
    if (!name) return;
    if (!confirm(`Mark ${name} as not here and redraw the ${p.label} (${p.name})?\n\n${name} won't be drawn again tonight.`)) return;
    state.absent.push(name);
    state.winners[idx] = null;
    XMAS.tree.unmarkWon(name);
    state.redrawIndex = idx;
    state.pending = null;
    state.phase = 'announce';
    save();
    renderAnnounce();
    drumIn();
    announce(`Redraw for the ${p.label}. Press Space to light the tree.`);
  }

  function openRedraw() {
    if (busy || mode !== 'prize' || !state || state.phase !== 'won') return;
    const target = state.redrawIndex == null ? round() : null;
    if (!target) return;
    const idxs = [];
    for (let i = target.start; i < target.start + target.count; i++) if (state.winners[i]) idxs.push(i);
    if (idxs.length === 1) { askRedraw(idxs[0]); return; }
    const box = $('redraw-pick');
    box.innerHTML = '';
    idxs.forEach((i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn ghost';
      b.textContent = `${state.winners[i]} · ${ordinal(state.prizes[i].rank)}`;
      b.addEventListener('click', () => askRedraw(i));
      box.append(b);
    });
    box.hidden = !box.hidden;
  }

  function nextPrize() {
    if (isLast()) { showResults(); return; }
    state.round++;
    state.phase = 'announce';
    state.pending = null;
    save();
    renderAnnounce();
    drumIn();
    const ps = roundPrizes();
    announce(`Next: ${ps.map((p) => `${p.label}, ${p.name}`).join('; ')}. Press Space to light the tree.`);
  }

  function badgeFor() {
    return state && state.rehearsal ? { badge: 'Rehearsal', tone: 'rehearsal' } : { badge: 'Live', tone: 'live' };
  }

  function openPrizeMode() {
    mode = 'prize';
    $('draw').classList.remove('players');
    $('draw').classList.toggle('rehearsal', Boolean(state.rehearsal));
    XMAS.ui.show('draw', badgeFor());
    XMAS.tree.layout(state.names, { won: wonSet() });
    if (state.phase === 'won') {
      renderAnnounce();
      const r = round();
      const ps = roundPrizes(r);
      const ws = ps.map((_, j) => state.winners[r.start + j]);
      XMAS.tree.showWinner(ws, r.count > 1
        ? { plateLabel: 'They light the star!', lines: ps.map((p) => ({ rank: p.label, prize: p.name })) }
        : { plateLabel: r.show === 'grand' ? '1st prize winner' : 'Lights the star!', prizeText: `${ps[0].label} · ${ps[0].name}` });
      wonCue();
      setRedrawVisible(true);
    } else {
      state.phase = 'announce';
      renderAnnounce();
      drumIn();
    }
  }

  /* ---------- Players mode (party games) ---------- */
  function renderPlayers() {
    $('prize-label').textContent = 'Game time';
    $('prize-name').classList.remove('multi');
    $('prize-name').textContent = "Who's playing next?";
    $('progress').textContent = `${players.picked.length} picked so far`;
    setCue('<kbd>Space</kbd>Pick a player');
    setRedrawVisible(false);
    renderRecent(players.picked.map((n, i) => [`Player ${i + 1}`, n]), 'Picked');
    enterPanel();
  }

  async function runPlayers() {
    busy = true;
    const everyone = XMAS.app.names();
    let candidates = everyone.filter((n) => !players.picked.includes(n));
    if (!candidates.length) {
      players.picked = [];
      XMAS.tree.clearPicked();
      candidates = everyone.slice();
    }
    const winner = candidates[XMAS.random.randomInt(candidates.length)];
    setCue('<span class="watch">Watch the tree…</span>');
    const done = await XMAS.tree.run({ pool: candidates, winners: [winner], mode: 'quick', plateLabel: "You're up!", prizeText: `Player ${players.picked.length + 1}` });
    if (done) {
      players.picked.push(winner);
      XMAS.tree.markPicked(winner);
      renderRecent(players.picked.map((n, i) => [`Player ${i + 1}`, n]), 'Picked');
      $('progress').textContent = `${players.picked.length} picked so far`;
      setCue('<kbd>Space</kbd>Pick another player');
      announce(`${winner} is up!`);
    }
    busy = false;
  }

  /* ---------- Results ---------- */
  function byRank() {
    return state.prizes.map((p, i) => ({ ...p, who: state.winners[i] })).sort((a, b) => a.rank - b.rank);
  }

  function renderResults() {
    const list = byRank();
    const gp = list[0];
    const g = $('grand');
    g.innerHTML = '<span class="g-label"></span><b class="g-name"></b><span class="g-prize"></span>';
    g.querySelector('.g-label').textContent = gp.label;
    g.querySelector('.g-name').textContent = gp.who || '—';
    g.querySelector('.g-prize').textContent = gp.name;
    const ol = $('results-board');
    ol.innerHTML = '';
    const others = list.slice(1);
    const cols = others.length > 36 ? 4 : others.length > 16 ? 3 : 2;
    ol.style.setProperty('--cols', cols);
    ol.style.setProperty('--rows', Math.max(1, Math.ceil(others.length / cols)));
    ol.classList.toggle('dense', cols > 2);
    ol.hidden = !others.length;
    others.forEach((p, i) => {
      const li = document.createElement('li');
      li.style.setProperty('--i', Math.min(i, 30));
      li.innerHTML = '<i class="bulb"></i><span class="lbl"></span><span class="p"></span><b class="who"></b>';
      li.firstChild.style.setProperty('--c', BULBS[(i * 7) % BULBS.length]);
      li.children[1].textContent = ordinal(p.rank);
      li.children[2].textContent = p.name;
      li.children[3].textContent = p.who || '—';
      ol.append(li);
    });
  }

  function showResults() {
    XMAS.tree.cancel();
    renderResults();
    const b = state.rehearsal ? { badge: 'Rehearsal results', tone: 'rehearsal' } : { badge: 'Final results', tone: 'final' };
    XMAS.ui.show('results', { ...b, counter: `${state.prizes.length} winners` });
    XMAS.fx.rain(200);
    XMAS.audio.celebrate(false);
  }

  function resultsText() {
    if (!state) return '';
    const lines = byRank().map((p) => `${ordinal(p.rank).padStart(5)} prize — ${p.name}: ${p.who || '(not drawn)'}`);
    const absent = state.absent.length ? `\nRedrawn because they weren't here: ${state.absent.join(', ')}\n` : '';
    return `Soon Family Christmas Lucky Draw 2025 — Winners${state.rehearsal ? ' (REHEARSAL)' : ''}\n\n${lines.join('\n')}\n${absent}`;
  }

  /* ---------- Public ---------- */
  XMAS.draw = {
    ordinal,
    plan,
    estimate,
    start(names, ranked, show, { rehearsal = false } = {}) {
      const { prizes, rounds } = plan(ranked, show);
      state = {
        v: 2,
        prizes,
        rounds,
        names: names.slice(),
        winners: prizes.map(() => null),
        absent: [],
        round: 0,
        phase: 'announce',
        pending: null,
        redrawIndex: null,
        rehearsal
      };
      XMAS.tree.setTimeScale(XMAS.settings.speed);
      save();
      openPrizeMode();
      const ps = roundPrizes();
      announce(`The draw is live. ${ps.map((p) => `${p.label}, ${p.name}`).join('; ')}. Press Space to light the tree.`);
    },
    resume(saved) {
      if (!saved || saved.v !== 2 || !Array.isArray(saved.winners) || !Array.isArray(saved.names) || !Array.isArray(saved.rounds)) { this.clear(true); return false; }
      state = saved;
      state.absent = state.absent || [];
      XMAS.tree.setTimeScale(XMAS.settings.speed);
      if (state.winners.every(Boolean) && state.phase === 'won' && isLast()) { showResults(); return true; }
      openPrizeMode();
      return true;
    },
    openPlayers() {
      mode = 'players';
      $('draw').classList.add('players');
      $('draw').classList.remove('rehearsal');
      XMAS.tree.setTimeScale(XMAS.settings.speed);
      const names = XMAS.app.names();
      XMAS.ui.show('draw', { badge: 'Game time', tone: 'game', counter: `${names.length} on the tree` });
      XMAS.tree.layout(names, { picked: new Set(players.picked) });
      XMAS.tree.reset();
      XMAS.tree.setStatus(names.length, 'names on the tree');
      renderPlayers();
    },
    async next() {
      if (busy) return;
      XMAS.audio.unlock();
      if (mode === 'players') { await runPlayers(); return; }
      if (!state) return;
      if (state.phase === 'won') nextPrize();
      else await runPrize();
    },
    redraw: openRedraw,
    skip() {
      if (mode !== 'prize' || !state) return;
      if (!confirm('Skip the suspense and draw every remaining prize instantly?')) return;
      XMAS.tree.cancel();
      busy = false;
      let candidates = pool();
      if (state.phase !== 'won' && Array.isArray(state.pending)) {
        // keep winners already chosen for the round in progress
        const r = round();
        state.pending.forEach((w, j) => {
          const idx = state.redrawIndex != null ? state.redrawIndex : r.start + j;
          if (!state.winners[idx] && candidates.includes(w)) { state.winners[idx] = w; candidates = candidates.filter((n) => n !== w); }
        });
      }
      const order = XMAS.random.shuffle(candidates);
      state.winners = state.winners.map((w) => w || order.shift() || null);
      state.round = state.rounds.length - 1;
      state.redrawIndex = null;
      state.pending = null;
      state.phase = 'won';
      save();
      showResults();
    },
    leave() {
      XMAS.tree.cancel();
      busy = false;
      if (state && state.phase === 'running') { state.phase = 'announce'; save(); }
    },
    reopenResults() { if (state) showResults(); },
    resultsText,
    /* Forget the current draw. A rehearsal never touches the saved real draw. */
    clear(force = false) {
      if (force || !state || !state.rehearsal) XMAS.store.clearDraw();
      state = null;
    },
    get state() { return state; },
    get busy() { return busy; },
    get mode() { return mode; }
  };
})();
