/* Claw machine: picks party-game players one at a time, no repeats until everyone has played. */
(function () {
  const $ = (id) => document.getElementById(id);
  const el = {
    arm: $('claw-arm'), cable: $('cable'), held: $('held'), capsules: $('capsules'),
    label: $('pick-label'), sub: $('pick-sub'), name: $('pick-name'), list: $('picked-list'), btn: $('pick-btn')
  };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce.matches ? Math.min(ms, 80) : ms));
  const colors = ['#ff2d3d', '#14c46b', '#ffd21f', '#1d58ff', '#ff7a1a', '#c04bff'];
  const GLASS_H = 610, PILE_H = 230, CAP = 96;

  let pool = () => [];
  let picked = [];
  let busy = false;

  function capsule(color) {
    const c = document.createElement('span');
    c.className = 'capsule';
    c.style.setProperty('--c', color);
    return c;
  }

  function placeCapsule(c, k) {
    const cols = 6;
    const col = k % cols;
    const row = Math.floor(k / cols);
    const x = 200 + col * 104 + (row % 2) * 52 + (((k * 29) % 17) - 8);
    const y = PILE_H - CAP - row * 70 + (((k * 13) % 11) - 5);
    c.style.left = Math.min(x, 856 - CAP - 8) + 'px';
    c.style.top = y + 'px';
    c.style.rotate = `${((k * 53) % 70) - 35}deg`;
  }

  function fillPile() {
    el.capsules.innerHTML = '';
    for (let k = 0; k < 17; k++) {
      const c = capsule(colors[k % colors.length]);
      placeCapsule(c, k);
      el.capsules.append(c);
    }
  }

  function setArm(x, cable, { move = 900, drop = 900 } = {}) {
    el.arm.style.transition = `left ${move}ms cubic-bezier(.45,0,.2,1)`;
    el.cable.style.transition = `height ${drop}ms cubic-bezier(.45,0,.2,1)`;
    el.arm.style.left = x + 'px';
    el.arm.style.marginLeft = '0';
    el.cable.style.height = cable + 'px';
  }

  function renderList() {
    el.list.innerHTML = '';
    if (!picked.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = 'No one picked yet.';
      el.list.append(li);
      return;
    }
    const shown = picked.slice(-16);
    const offset = picked.length - shown.length;
    shown.forEach((n, i) => {
      const li = document.createElement('li');
      const b = document.createElement('span');
      b.className = 'ball';
      b.textContent = String(offset + i + 1).padStart(2, '0');
      li.append(b, n);
      el.list.append(li);
    });
  }

  function setBanner(label, sub, name, waiting) {
    el.label.textContent = label;
    el.sub.textContent = sub;
    el.name.textContent = name;
    const banner = el.name.parentElement;
    banner.classList.toggle('waiting-pick', waiting);
    el.name.style.fontSize = '';
    if (!waiting) {
      let size = 112;
      const room = banner.clientWidth - 68;
      while (el.name.scrollWidth > room && size > 48) { size -= 4; el.name.style.fontSize = size + 'px'; }
      banner.classList.remove('slam'); void banner.offsetWidth; banner.classList.add('slam');
    }
  }

  async function pick() {
    const everyone = pool();
    if (busy || !everyone.length) return;
    busy = true;
    el.btn.disabled = true;

    let available = everyone.filter((n) => !picked.includes(n));
    if (!available.length) {
      picked = [];
      renderList();
      available = everyone.slice();
      setBanner('New round', 'Everyone has played. Starting again', 'Fresh round!', true);
      await wait(1200);
    }
    const name = available[XMAS.random.randomInt(available.length)];

    const caps = [...el.capsules.children];
    const target = caps[XMAS.random.randomInt(caps.length)];
    const tx = parseFloat(target.style.left) + CAP / 2 - 75;
    const ty = GLASS_H - PILE_H + parseFloat(target.style.top);
    const reach = Math.max(60, ty + CAP / 2 - 22 - 138 + 34);

    setBanner('Claw is moving', 'Pick-a-Player', 'Who is it?', true);
    el.arm.classList.add('open');
    XMAS.audio.whirr(0.9);
    setArm(tx, 40);
    await wait(950);

    XMAS.audio.whirr(0.9);
    setArm(tx, reach);
    await wait(950);

    el.arm.classList.remove('open');
    XMAS.audio.clunk();
    await wait(350);
    const grabbed = capsule(target.style.getPropertyValue('--c'));
    target.remove();
    el.held.append(grabbed);

    XMAS.audio.whirr(0.9);
    setArm(tx, 40);
    await wait(950);
    XMAS.audio.whirr(1);
    setArm(10, 40, { move: 1000 });
    await wait(1050);

    el.arm.classList.add('open');
    grabbed.animate(
      [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(420px)', opacity: 0 }],
      { duration: reduce.matches ? 1 : 600, easing: 'cubic-bezier(.5,0,.9,.5)', fill: 'forwards' }
    );
    await wait(550);
    XMAS.audio.clunk();
    grabbed.remove();

    picked.push(name);
    renderList();
    setBanner(`Player ${String(picked.length).padStart(2, '0')}`, "You're up!", name, false);
    XMAS.audio.fanfare(false);
    const r = el.name.getBoundingClientRect();
    XMAS.fx.burst(r.left + Math.min(r.width, 400) / 2, r.top, 120);
    $('announcer').textContent = `${name} is up!`;

    const fresh = capsule(colors[picked.length % colors.length]);
    placeCapsule(fresh, caps.indexOf(target));
    el.capsules.append(fresh);

    el.arm.classList.remove('open');
    setArm(428 - 75, 40, { move: 800 });
    await wait(300);
    busy = false;
    el.btn.disabled = false;
  }

  XMAS.claw = {
    init(getNames) { pool = getNames; fillPile(); renderList(); },
    open() {
      XMAS.ui.show('claw', { badge: 'Game time', tone: 'game', counter: `${pool().length} in the machine` });
      if (!picked.length) setBanner('Ready', 'Press Space to pick a player', "Who's up?", true);
      renderList();
    },
    pick,
    clear() {
      if (busy) return;
      picked = [];
      renderList();
      setBanner('Ready', 'Press Space to pick a player', "Who's up?", true);
    },
    get busy() { return busy; }
  };
})();
