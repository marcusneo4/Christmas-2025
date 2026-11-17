/* Draw controller: prize announcements, live winner choice, saved progress, results.
   Winners are chosen at the moment the host presses Space — never in advance. */
(function () {
  const $ = (id) => document.getElementById(id);
  const num = (i) => String(i + 1).padStart(2, '0');
  const BULBS = ['#ff5a5a', '#ffb43a', '#47d68a', '#56a8ff', '#ff7fc0', '#ffe066'];

  let state = null;   // { prizes, names, winners: [], index, phase: 'announce'|'running'|'won', pending }
  let busy = false;
  let mode = 'prize'; // or 'players'
  const players = { picked: [] };

  const save = () => XMAS.store.setDraw(state);
  const isGrand = () => state && state.index === state.prizes.length - 1;
  const won = () => new Set(state ? state.winners : []);

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

  function pool() { return state.names.filter((n) => !state.winners.includes(n)); }
  function prizeRecent() { renderRecent(state.winners.map((w, i) => [state.prizes[i].name, w]), 'Already won'); }

  function enterPanel() {
    const p = $('prize-panel');
    p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter');
  }

  /* ---------- Prize mode ---------- */
  function renderAnnounce() {
    const p = state.prizes[state.index];
    $('prize-label').textContent = isGrand() ? 'The grand prize' : p.label;
    $('prize-name').textContent = p.name;
    $('progress').textContent = `Prize ${state.index + 1} of ${state.prizes.length}`;
    XMAS.tree.reset();
    XMAS.tree.setStatus(pool().length, 'names on the tree');
    setCue(`<kbd>Space</kbd>${isGrand() ? 'Light the tree for the grand prize' : 'Light the tree'}`);
    prizeRecent();
    XMAS.ui.setCounter(`Prize ${num(state.index)} / ${String(state.prizes.length).padStart(2, '0')}`);
    enterPanel();
  }

  async function runPrize() {
    busy = true;
    const p = state.prizes[state.index];
    const candidates = pool();
    if (!state.pending || !candidates.includes(state.pending)) {
      state.pending = candidates[XMAS.random.randomInt(candidates.length)];
    }
    state.phase = 'running';
    save();
    setCue('<span class="watch">Watch the tree…</span>');
    const done = await XMAS.tree.run({
      pool: candidates,
      winner: state.pending,
      grand: isGrand(),
      quick: !isGrand() && (XMAS.settings.suspense === 'quick' || (XMAS.settings.suspense === 'auto' && /bonus/i.test(p.label))),
      plateLabel: isGrand() ? 'Grand prize winner' : 'Lights the star!',
      prizeText: `${p.label} · ${p.name}`
    });
    if (!done) { busy = false; return; }
    state.winners.push(state.pending);
    state.pending = null;
    state.phase = 'won';
    save();
    XMAS.tree.markWon(state.winners[state.index]);
    prizeRecent();
    announce(`${p.label}, ${p.name}, goes to ${state.winners[state.index]}`);
    setCue(isGrand() ? '<kbd>Space</kbd>See all the winners' : '<kbd>Space</kbd>Next prize');
    busy = false;
  }

  function nextPrize() {
    if (isGrand()) { showResults(); return; }
    state.index++;
    state.phase = 'announce';
    save();
    renderAnnounce();
    XMAS.audio.announce();
    const p = state.prizes[state.index];
    announce(`Next: ${p.label}, ${p.name}. Press Space to light the tree.`);
  }

  function openPrizeMode() {
    mode = 'prize';
    $('draw').classList.remove('players');
    XMAS.ui.show('draw', { badge: 'Live', tone: 'live' });
    XMAS.tree.layout(state.names, { won: won() });
    if (state.phase === 'won') {
      renderAnnounce();
      const p = state.prizes[state.index];
      XMAS.tree.showWinner(state.winners[state.index], { plateLabel: 'Lights the star!', prizeText: `${p.label} · ${p.name}` });
      setCue(isGrand() ? '<kbd>Space</kbd>See all the winners' : '<kbd>Space</kbd>Next prize');
    } else {
      state.phase = 'announce';
      renderAnnounce();
      XMAS.audio.announce();
    }
  }

  /* ---------- Players mode (party games) ---------- */
  function renderPlayers() {
    $('prize-label').textContent = 'Game time';
    $('prize-name').textContent = "Who's playing next?";
    $('progress').textContent = `${players.picked.length} picked so far`;
    setCue('<kbd>Space</kbd>Pick a player');
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
    const done = await XMAS.tree.run({ pool: candidates, winner, quick: true, plateLabel: "You're up!", prizeText: `Player ${players.picked.length + 1}` });
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
  function renderResults() {
    const last = state.prizes.length - 1;
    const gp = state.prizes[last];
    const g = $('grand');
    g.innerHTML = '<span class="g-label"></span><b class="g-name"></b><span class="g-prize"></span>';
    g.querySelector('.g-label').textContent = gp.label;
    g.querySelector('.g-name').textContent = state.winners[last] || '—';
    g.querySelector('.g-prize').textContent = gp.name;
    const ol = $('results-board');
    ol.innerHTML = '';
    const others = state.prizes.slice(0, last);
    ol.style.setProperty('--rows', Math.max(1, Math.ceil(others.length / 2)));
    others.forEach((p, i) => {
      const li = document.createElement('li');
      li.style.setProperty('--i', i);
      li.innerHTML = '<i class="bulb"></i><span class="lbl"></span><span class="p"></span><b class="who"></b>';
      li.firstChild.style.setProperty('--c', BULBS[(i * 7) % BULBS.length]);
      li.children[1].textContent = p.label;
      li.children[2].textContent = p.name;
      li.children[3].textContent = state.winners[i] || '—';
      ol.append(li);
    });
  }

  function showResults() {
    XMAS.tree.cancel();
    renderResults();
    XMAS.ui.show('results', { badge: 'Final results', tone: 'final', counter: `${state.prizes.length} winners` });
    XMAS.fx.rain(200);
    XMAS.audio.celebrate(false);
  }

  function resultsText() {
    if (!state) return '';
    const lines = state.prizes.map((p, i) => `${num(i)}  ${p.label} — ${p.name}: ${state.winners[i] || '(not drawn)'}`);
    return `Soon Family Christmas Lucky Draw 2025 — Winners\n\n${lines.join('\n')}\n`;
  }

  /* ---------- Public ---------- */
  XMAS.draw = {
    start(names, prizes) {
      state = {
        prizes: prizes.map((p) => ({ label: p.label, name: p.name })),
        names: names.slice(),
        winners: [],
        index: 0,
        phase: 'announce',
        pending: null
      };
      save();
      openPrizeMode();
      announce(`The draw is live. ${state.prizes[0].label}, ${state.prizes[0].name}. Press Space to light the tree.`);
    },
    resume(saved) {
      state = saved;
      if (!Array.isArray(state.winners) || !Array.isArray(state.names)) { this.clear(); return false; }
      if (state.winners.length >= state.prizes.length) { showResults(); return true; }
      openPrizeMode();
      return true;
    },
    openPlayers() {
      mode = 'players';
      $('draw').classList.add('players');
      const names = XMAS.app.names();
      XMAS.ui.show('draw', { badge: 'Game time', tone: 'game', counter: `${names.length} on the tree` });
      XMAS.tree.layout(names, { picked: new Set(players.picked) });
      XMAS.tree.reset();
      XMAS.tree.setStatus(names.length, 'names on the tree');
      renderPlayers();
    },
    clearPlayers() { players.picked = []; XMAS.tree.clearPicked(); renderPlayers(); },
    async next() {
      if (busy) return;
      XMAS.audio.unlock();
      if (mode === 'players') { await runPlayers(); return; }
      if (!state) return;
      if (state.phase === 'won') nextPrize();
      else await runPrize();
    },
    skip() {
      if (mode !== 'prize' || !state) return;
      if (!confirm('Skip the suspense and draw every remaining prize instantly?')) return;
      XMAS.tree.cancel();
      busy = false;
      let candidates = pool();
      if (state.phase !== 'won') {
        const w = state.pending && candidates.includes(state.pending) ? state.pending : candidates[XMAS.random.randomInt(candidates.length)];
        state.winners.push(w);
        candidates = candidates.filter((n) => n !== w);
        state.pending = null;
      }
      const order = XMAS.random.shuffle(candidates);
      while (state.winners.length < state.prizes.length) state.winners.push(order.shift());
      state.index = state.prizes.length - 1;
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
    clear() { state = null; XMAS.store.clearDraw(); },
    get state() { return state; },
    get busy() { return busy; },
    get mode() { return mode; }
  };
})();
