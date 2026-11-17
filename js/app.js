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
    if (dupes.length) {
      const uniq = [...new Set(dupes)];
      d.hidden = false;
      d.textContent = `Listed twice, counted once: ${uniq.join(', ')}. If these are different people, add a surname or initial.`;
    } else d.hidden = true;
    validate();
  }

  namesBox.addEventListener('input', () => { XMAS.store.setNamesText(namesBox.value); readNames(); });

  $('upload-btn').addEventListener('click', () => $('upload').click());
  $('upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const { names: list } = XMAS.parseNames(String(reader.result));
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

  /* ---- Setup: prizes ---- */
  let prizes = (XMAS.store.getPrizes() || XMAS.DEFAULT_PRIZES).map((p) => ({ ...p }));
  const prizeList = $('prize-edit');

  function savePrizes() { XMAS.store.setPrizes(prizes); }

  function renderPrizes() {
    prizeList.innerHTML = '';
    prizes.forEach((p, i) => {
      const li = document.createElement('li');
      const ball = document.createElement('span');
      ball.className = 'ball' + (/bonus/i.test(p.label) ? ' bonus' : '');
      ball.textContent = String(i + 1).padStart(2, '0');
      const lbl = document.createElement('input');
      lbl.className = 'lbl';
      lbl.value = p.label;
      lbl.setAttribute('aria-label', `Draw ${i + 1} label`);
      lbl.addEventListener('input', () => {
        p.label = lbl.value;
        ball.className = 'ball' + (/bonus/i.test(p.label) ? ' bonus' : '');
        savePrizes();
      });
      const name = document.createElement('input');
      name.value = p.name;
      name.setAttribute('aria-label', `Draw ${i + 1} prize`);
      name.addEventListener('input', () => { p.name = name.value; savePrizes(); validate(); });
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'rm';
      rm.setAttribute('aria-label', `Remove draw ${i + 1}: ${p.name}`);
      rm.innerHTML = '<svg><use href="#i-x"/></svg>';
      rm.addEventListener('click', () => { prizes.splice(i, 1); savePrizes(); renderPrizes(); });
      li.append(ball, lbl, name, rm);
      prizeList.append(li);
    });
    prizeList.style.setProperty('--rows', Math.max(9, Math.ceil(prizes.length / 2)));
    $('prize-meta').textContent = `${prizes.length} draws · top row is drawn first`;
    validate();
  }

  $('add-prize').addEventListener('click', () => {
    prizes.push({ label: 'Bonus prize', name: '' });
    savePrizes();
    renderPrizes();
    prizeList.lastElementChild.querySelectorAll('input')[1].focus();
  });
  $('reset-prizes').addEventListener('click', () => {
    if (!confirm('Restore the default prize list? Your edits will be lost.')) return;
    prizes = XMAS.DEFAULT_PRIZES.map((p) => ({ ...p }));
    savePrizes();
    renderPrizes();
  });

  /* ---- Setup: actions ---- */
  function validate() {
    const live = $('go-live');
    const hint = $('go-hint');
    const usable = prizes.filter((p) => p.name.trim());
    let msg = '';
    if (!usable.length) msg = 'Add at least one prize to start the draw.';
    else if (usable.length !== prizes.length) msg = 'Some prizes have no name yet. Fill them in or remove them.';
    else if (names.length < prizes.length) msg = `Need at least ${prizes.length} contestants for ${prizes.length} prizes. You have ${names.length}.`;
    live.disabled = Boolean(msg);
    hint.textContent = msg;
    $('go-players').disabled = names.length < 2;
  }

  function refreshResume() {
    const saved = XMAS.store.getDraw();
    const box = $('resume');
    if (saved && saved.prizes && Array.isArray(saved.winners) && Array.isArray(saved.names)) {
      const done = saved.winners.length;
      box.hidden = false;
      $('resume-text').textContent = done >= saved.prizes.length
        ? `All ${saved.prizes.length} winners drawn.`
        : `${done} of ${saved.prizes.length} winners revealed. Pick up where you left off.`;
    } else box.hidden = true;
  }

  function goSetup() {
    XMAS.ui.show('setup', { badge: 'Pre-show', counter: '' });
    refreshResume();
  }

  $('go-live').addEventListener('click', () => {
    XMAS.audio.unlock();
    if (XMAS.store.getDraw() && !confirm('Start a brand-new draw? The draw in progress will be replaced.')) return;
    XMAS.draw.start(names, prizes.filter((p) => p.name.trim()));
  });
  $('resume-btn').addEventListener('click', () => {
    XMAS.audio.unlock();
    if (!XMAS.draw.resume(XMAS.store.getDraw())) refreshResume();
  });
  $('discard-btn').addEventListener('click', () => {
    if (!confirm('Discard the draw in progress? Its winners will be lost.')) return;
    XMAS.draw.clear();
    refreshResume();
  });
  $('go-players').addEventListener('click', () => { XMAS.audio.unlock(); XMAS.draw.openPlayers(); });

  /* ---- Suspense speed ---- */
  const savedSpeed = XMAS.store.getSuspense();
  XMAS.settings = { suspense: ['auto', 'full', 'quick'].includes(savedSpeed) ? savedSpeed : 'auto' };
  function renderSpeed() {
    ['auto', 'full', 'quick'].forEach((m) => $('speed-' + m).setAttribute('aria-checked', String(XMAS.settings.suspense === m)));
  }
  ['auto', 'full', 'quick'].forEach((m) => $('speed-' + m).addEventListener('click', () => {
    XMAS.settings.suspense = m;
    XMAS.store.setSuspense(m);
    renderSpeed();
  }));

  /* ---- Draw / results controls ---- */
  $('tree-wrap').addEventListener('click', () => XMAS.draw.next());
  $('results-players').addEventListener('click', () => XMAS.draw.openPlayers());
  $('new-draw').addEventListener('click', () => {
    if (!confirm('Start over? This clears tonight\'s winners from this browser. Download the results first if you want to keep them.')) return;
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
      else if (k === 'Escape') {
        if (XMAS.draw.busy && !confirm('Stop this round and go back to setup? This prize will be drawn again from the start.')) return;
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
  renderSpeed();
  XMAS.app = { names: () => names.slice() };
  goSetup();
})();
