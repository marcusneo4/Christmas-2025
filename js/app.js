/* App shell: stage scaling, screens, setup screen, keyboard control. */
(function () {
  const $ = (id) => document.getElementById(id);
  const stage = $('stage');

  /* ---- Fit the 1920×1080 stage to any window ---- */
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.setProperty('--scale', s);
  }
  addEventListener('resize', fit);
  fit();

  /* ---- Screens ---- */
  let current = 'setup';
  XMAS.ui = {
    show(id, { badge = 'Pre-show', tone = '', counter = '' } = {}) {
      document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
      current = id;
      $('badge').className = 'badge' + (tone ? ' ' + tone : '');
      $('badge-text').textContent = badge;
      this.setCounter(counter);
      if (id !== 'draw') XMAS.audio.stopAll();
      else requestAnimationFrame(() => XMAS.scene.resize());
    },
    setCounter(t) { $('counter').textContent = t; },
    get current() { return current; }
  };

  /* ---- Setup: contestants ---- */
  const namesBox = $('names');
  let names = [];

  function readNames() {
    const { names: list, dupes } = XMAS.parseNames(namesBox.value);
    names = list;
    $('name-count').textContent = list.length;
    const d = $('dupes');
    const notes = [];
    if (dupes.length) notes.push(`Listed twice, counted once: ${[...new Set(dupes)].join(', ')} — if these are different people, add a surname or initial.`);
    if (list.length > 150) notes.push(`${list.length} names. The tree is designed for up to 150, so it will be crowded.`);
    d.hidden = !notes.length;
    d.textContent = notes.join(' ');
    validate();
  }

  namesBox.addEventListener('input', () => { XMAS.store.setNamesText(namesBox.value); readNames(); });

  $('upload-btn').addEventListener('click', () => $('upload').click());
  $('upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const { names: list } = XMAS.parseNames(String(reader.result), { csv: /\.csv$/i.test(file.name) });
      namesBox.value = list.join('\n');
      $('file-name').textContent = file.name;
      XMAS.store.setNamesText(namesBox.value);
      readNames();
    };
    reader.onerror = () => { $('file-name').textContent = "Couldn't read that file"; };
    reader.readAsText(file);
    e.target.value = '';
  });

  $('reset-names').addEventListener('click', () => {
    if (namesBox.value.trim() && !confirm('Replace the list with the built-in family list?')) return;
    namesBox.value = XMAS.DEFAULT_NAMES.join('\n');
    $('file-name').textContent = '';
    XMAS.store.setNamesText(namesBox.value);
    readNames();
  });

  /* ---- Setup: prizes, in rank order (row 1 = 1st prize) ---- */
  let prizes = (XMAS.store.getRanked() || XMAS.DEFAULT_PRIZES).slice();
  let show = Object.assign({ fullTop: 5, rest: 'quick' }, XMAS.store.getShow());
  const prizeList = $('prize-edit');
  const prizeText = $('prize-text');
  let view = 'list';
  let dragFrom = -1;

  function savePrizes() { XMAS.store.setRanked(prizes); }
  const ord = (n) => XMAS.draw.ordinal(n);

  function move(from, to) {
    if (to < 0 || to >= prizes.length || from === to) return;
    const [p] = prizes.splice(from, 1);
    prizes.splice(to, 0, p);
    savePrizes();
    renderPrizes();
  }

  function renderPrizes(focusIndex = -1) {
    prizeList.innerHTML = '';
    prizes.forEach((p, i) => {
      const li = document.createElement('li');
      li.dataset.i = i;
      const grip = document.createElement('span');
      grip.className = 'grip';
      grip.title = 'Drag to change the ranking';
      grip.innerHTML = '<svg><use href="#i-grip"/></svg>';
      grip.addEventListener('pointerdown', () => { li.draggable = true; });
      const ball = document.createElement('span');
      ball.className = 'ball';
      const name = document.createElement('input');
      name.value = p;
      name.placeholder = i === 0 ? 'The big one' : 'Prize';
      name.setAttribute('aria-label', `${ord(i + 1)} prize`);
      name.addEventListener('input', () => { prizes[i] = name.value; savePrizes(); renumber(); validate(); });
      name.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault();
          const to = i + (e.key === 'ArrowUp' ? -1 : 1);
          if (to >= 0 && to < prizes.length) { move(i, to); renderPrizes(to); }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          prizes.splice(i + 1, 0, '');
          savePrizes();
          renderPrizes(i + 1);
        }
      });
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'rm';
      rm.setAttribute('aria-label', `Remove ${ord(i + 1)} prize: ${p}`);
      rm.innerHTML = '<svg><use href="#i-x"/></svg>';
      rm.addEventListener('click', () => { prizes.splice(i, 1); savePrizes(); renderPrizes(); });
      li.addEventListener('dragstart', (e) => { dragFrom = i; li.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(i)); });
      li.addEventListener('dragend', () => { li.draggable = false; li.classList.remove('dragging'); prizeList.querySelectorAll('.over').forEach((x) => x.classList.remove('over')); });
      li.addEventListener('dragover', (e) => { if (dragFrom < 0) return; e.preventDefault(); li.classList.add('over'); });
      li.addEventListener('dragleave', () => li.classList.remove('over'));
      li.addEventListener('drop', (e) => { e.preventDefault(); const from = dragFrom; dragFrom = -1; move(from, i); });
      li.append(grip, ball, name, rm);
      prizeList.append(li);
    });
    renumber();
    prizeList.style.setProperty('--rows', Math.max(7, Math.ceil(prizes.length / 2)));
    if (focusIndex >= 0) {
      const input = prizeList.children[focusIndex] && prizeList.children[focusIndex].querySelector('input');
      if (input) input.focus();
    }
    renderShow();
    validate();
  }

  /* Rank badges count only filled rows, matching what the draw will use. */
  function renumber() {
    let r = 0;
    [...prizeList.children].forEach((li, i) => {
      const ball = li.querySelector('.ball');
      if (prizes[i] && prizes[i].trim()) { r++; ball.textContent = ord(r); ball.classList.toggle('first', r === 1); }
      else { ball.textContent = '—'; ball.classList.remove('first'); }
    });
  }

  function setView(v) {
    view = v;
    $('view-list').setAttribute('aria-selected', String(v === 'list'));
    $('view-paste').setAttribute('aria-selected', String(v === 'paste'));
    prizeList.hidden = v !== 'list';
    prizeText.hidden = v !== 'paste';
    $('add-prize').hidden = v !== 'list';
    if (v === 'paste') { prizeText.value = prizes.join('\n'); prizeText.focus(); }
    else renderPrizes();
  }
  $('view-list').addEventListener('click', () => setView('list'));
  $('view-paste').addEventListener('click', () => setView('paste'));
  prizeText.addEventListener('input', () => {
    prizes = prizeText.value.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    savePrizes();
    renderShow();
    validate();
  });

  $('add-prize').addEventListener('click', () => {
    prizes.push('');
    savePrizes();
    renderPrizes(prizes.length - 1);
  });
  $('reset-prizes').addEventListener('click', () => {
    if (!confirm('Restore the default prize list? Your edits will be lost.')) return;
    prizes = XMAS.DEFAULT_PRIZES.slice();
    savePrizes();
    if (view === 'paste') prizeText.value = prizes.join('\n');
    renderPrizes();
  });

  /* ---- Setup: which prizes get the full show ---- */
  function renderShow() {
    const max = Math.max(1, prizes.length);
    show.fullTop = Math.min(Math.max(1, show.fullTop), max);
    $('full-count').textContent = show.fullTop;
    ['quick', 'batch3', 'batch5'].forEach((m) => $('rest-' + m).setAttribute('aria-checked', String(show.rest === m)));
    const n = prizes.filter((p) => p.trim()).length;
    $('prize-meta').textContent = n ? `${n} prize${n === 1 ? '' : 's'} · drawn from the ${ord(n)} up to the 1st` : '';
    XMAS.store.setShow(show);
  }
  $('full-minus').addEventListener('click', () => { show.fullTop--; renderShow(); validate(); });
  $('full-plus').addEventListener('click', () => { show.fullTop++; renderShow(); validate(); });
  ['quick', 'batch3', 'batch5'].forEach((m) => $('rest-' + m).addEventListener('click', () => { show.rest = m; renderShow(); validate(); }));

  /* ---- Setup: actions ---- */
  function usablePrizes() { return prizes.map((p) => p.trim()).filter(Boolean); }

  function validate() {
    const live = $('go-live');
    const hint = $('go-hint');
    const usable = usablePrizes();
    let msg = '';
    let ok = '';
    if (!usable.length) msg = 'Add at least one prize to start the draw.';
    else if (names.length < usable.length) msg = `Need at least ${usable.length} names for ${usable.length} prizes. You have ${names.length}.`;
    else {
      const est = XMAS.draw.estimate(usable, show);
      ok = `${usable.length} prizes · ${names.length} names · ${est.rounds} rounds · about ${est.minutes} min`;
    }
    live.disabled = Boolean(msg);
    hint.textContent = msg || ok;
    hint.classList.toggle('ok', !msg);
    $('rehearse-mine').disabled = Boolean(msg);
    $('rehearse-test').disabled = !usable.length || usable.length > 150;
    $('go-players').disabled = names.length < 2;
  }

  function refreshResume() {
    const saved = XMAS.store.getDraw();
    const box = $('resume');
    if (saved && saved.v === 2 && saved.prizes && Array.isArray(saved.winners) && Array.isArray(saved.names)) {
      const done = saved.winners.filter(Boolean).length;
      box.hidden = false;
      $('resume-text').textContent = done >= saved.prizes.length
        ? `All ${saved.prizes.length} winners drawn.`
        : `${done} of ${saved.prizes.length} winners revealed. Pick up where you left off.`;
    } else box.hidden = true;
  }

  function goSetup() {
    XMAS.fx.clear();
    XMAS.ui.show('setup', { badge: 'Pre-show', counter: '' });
    refreshResume();
  }

  $('go-live').addEventListener('click', () => {
    XMAS.audio.unlock();
    if (XMAS.store.getDraw() && !confirm('Start a brand-new draw? The draw in progress will be replaced.')) return;
    XMAS.draw.start(names, usablePrizes(), show);
  });
  $('rehearse-mine').addEventListener('click', () => { XMAS.audio.unlock(); XMAS.draw.start(names, usablePrizes(), show, { rehearsal: true }); });
  $('rehearse-test').addEventListener('click', () => { XMAS.audio.unlock(); XMAS.draw.start(XMAS.testNames(150), usablePrizes(), show, { rehearsal: true }); });
  $('resume-btn').addEventListener('click', () => {
    XMAS.audio.unlock();
    if (!XMAS.draw.resume(XMAS.store.getDraw())) refreshResume();
  });
  $('discard-btn').addEventListener('click', () => {
    if (!confirm('Discard the draw in progress? Its winners will be lost.')) return;
    XMAS.draw.clear(true);
    refreshResume();
  });
  $('go-players').addEventListener('click', () => { XMAS.audio.unlock(); XMAS.draw.openPlayers(); });

  /* ---- Draw / results controls ---- */
  $('tree-wrap').addEventListener('click', () => XMAS.draw.next());
  $('redraw-btn').addEventListener('click', () => XMAS.draw.redraw());
  $('results-players').addEventListener('click', () => XMAS.draw.openPlayers());
  $('new-draw').addEventListener('click', () => {
    const rehearsing = XMAS.draw.state && XMAS.draw.state.rehearsal;
    if (!confirm(rehearsing ? 'Leave the rehearsal? Nothing from it was saved.' : 'Start over? This clears tonight\'s winners from this browser. Download the results first if you want to keep them.')) return;
    XMAS.draw.clear();
    XMAS.fx.clear();
    goSetup();
  });
  $('download-btn').addEventListener('click', () => {
    const blob = new Blob([XMAS.draw.resultsText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soon-family-christmas-2025-winners.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  /* ---- Sound ---- */
  const soundBtn = $('sound-btn');
  function renderSound() {
    const on = !XMAS.audio.isMuted();
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.setAttribute('aria-label', on ? 'Sound on (M)' : 'Sound off (M)');
    soundBtn.querySelector('use').setAttribute('href', on ? '#i-sound' : '#i-mute');
  }
  function toggleSound() { XMAS.audio.unlock(); XMAS.audio.setMuted(!XMAS.audio.isMuted()); renderSound(); }
  soundBtn.addEventListener('click', toggleSound);

  /* ---- Keyboard: the host drives the show ---- */
  document.addEventListener('keydown', (e) => {
    const typing = e.target instanceof Element && e.target.closest('input, textarea');
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (k === 'm' || k === 'M') { toggleSound(); return; }
    if (current === 'draw') {
      if (k === ' ' || k === 'Enter' || k === 'ArrowRight' || k === 'PageDown') {
        e.preventDefault();
        XMAS.audio.unlock();
        XMAS.draw.next();
      } else if (k === 's' || k === 'S') XMAS.draw.skip();
      else if (k === 'r' || k === 'R') XMAS.draw.redraw();
      else if (k === 'f' || k === 'F') XMAS.draw.toggleFast();
      else if (k === 'Escape') {
        const rehearsing = XMAS.draw.state && XMAS.draw.state.rehearsal;
        if (XMAS.draw.busy && !rehearsing && XMAS.draw.mode === 'prize' && !confirm('Stop this round and go back to setup? This prize will be drawn again from the start.')) return;
        XMAS.draw.leave();
        goSetup();
      }
    } else if (current === 'results') {
      if (k === 'Escape') goSetup();
    }
  });

  /* ---- Boot ---- */
  const savedText = XMAS.store.getNamesText();
  namesBox.value = savedText !== null ? savedText : XMAS.DEFAULT_NAMES.join('\n');
  readNames();
  renderPrizes();
  renderSound();
  XMAS.app = { names: () => names.slice() };
  goSetup();
})();
