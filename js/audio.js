/* Studio sound, synthesized with Web Audio (no audio files). */
(function () {
  let ctx = null;
  let master = null;
  let muted = XMAS.store.getMuted();
  let musicTimer = null;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, { type = 'sine', gain = 0.2, attack = 0.005, to = null } = {}) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (to) o.frequency.exponentialRampToValueAtTime(to, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g).connect(master);
    o.start(start);
    o.stop(start + dur + 0.05);
  }

  function noise(start, dur, { gain = 0.25, freq = 1800, q = 0.8 } = {}) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(f).connect(g).connect(master);
    src.start(start);
  }

  const api = {
    unlock() { ensure(); },

    /* Snare roll that accelerates and swells for `seconds`. */
    drumroll(seconds = 1.6) {
      if (!ensure()) return;
      const t0 = ctx.currentTime;
      let t = 0;
      while (t < seconds) {
        const p = t / seconds;
        noise(t0 + t, 0.06, { gain: 0.06 + p * 0.2, freq: 2200, q: 0.6 });
        t += 0.075 - p * 0.04;
      }
      tone(110, t0, seconds, { type: 'triangle', gain: 0.05, attack: seconds * 0.8 });
    },

    /* Ball leaving the drum. */
    pop() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      tone(420, t, 0.18, { type: 'square', gain: 0.12, to: 1200 });
      noise(t, 0.08, { gain: 0.2, freq: 4000 });
    },

    /* Winner fanfare; the grand prize gets a longer, fuller one. */
    fanfare(grand = false) {
      if (!ensure()) return;
      const t = ctx.currentTime;
      const notes = grand
        ? [[523.25, 0], [659.25, 0.12], [783.99, 0.24], [1046.5, 0.36], [783.99, 0.6], [1046.5, 0.72]]
        : [[523.25, 0], [659.25, 0.1], [783.99, 0.2], [1046.5, 0.32]];
      notes.forEach(([f, d]) => {
        tone(f, t + d, 0.5, { type: 'sawtooth', gain: 0.07 });
        tone(f / 2, t + d, 0.5, { type: 'triangle', gain: 0.08 });
      });
      const end = notes[notes.length - 1][1];
      [1046.5, 1318.5, 1568].forEach((f) => tone(f, t + end + 0.12, grand ? 1.6 : 0.9, { type: 'triangle', gain: 0.06 }));
      noise(t + end + 0.12, 0.6, { gain: 0.08, freq: 7000, q: 0.3 });
    },

    /* Bright "ding" for announcing the next prize. */
    chime() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      tone(1318.5, t, 0.6, { type: 'sine', gain: 0.12 });
      tone(1975.5, t + 0.08, 0.7, { type: 'sine', gain: 0.07 });
    },

    /* Motor whirr for the claw. */
    whirr(seconds = 0.8) {
      if (!ensure()) return;
      const t = ctx.currentTime;
      tone(90, t, seconds, { type: 'sawtooth', gain: 0.04, attack: 0.05, to: 140 });
    },

    clunk() {
      if (!ensure()) return;
      const t = ctx.currentTime;
      tone(160, t, 0.15, { type: 'square', gain: 0.1, to: 60 });
    },

    /* Quiet "Jingle Bells" loop under the show. */
    startMusic() {
      if (!ensure() || musicTimer) return;
      const E = 659.25, G = 783.99, C = 523.25, D = 587.33, F = 698.46;
      const phrase = [[E, 1], [E, 1], [E, 2], [E, 1], [E, 1], [E, 2], [E, 1], [G, 1], [C, 1.5], [D, 0.5], [E, 4],
        [F, 1], [F, 1], [F, 1.5], [F, 0.5], [F, 1], [E, 1], [E, 1], [E, 0.5], [E, 0.5], [E, 1], [D, 1], [D, 1], [E, 1], [D, 2], [G, 2]];
      const beat = 0.24;
      const total = phrase.reduce((s, [, b]) => s + b, 0) * beat;
      const play = () => {
        let t = ctx.currentTime + 0.05;
        phrase.forEach(([f, b]) => {
          tone(f, t, b * beat * 0.9, { type: 'triangle', gain: 0.025 });
          tone(f / 2, t, b * beat * 0.9, { type: 'sine', gain: 0.02 });
          t += b * beat;
        });
      };
      play();
      musicTimer = setInterval(play, total * 1000 + 1200);
    },

    stopMusic() {
      clearInterval(musicTimer);
      musicTimer = null;
    },

    isMuted: () => muted,
    setMuted(m) {
      muted = m;
      XMAS.store.setMuted(m);
      if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05);
    }
  };

  XMAS.audio = api;
})();
