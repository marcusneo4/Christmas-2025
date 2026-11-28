/* Soundscape, synthesized with Web Audio: heartbeat, soft power-downs, roulette ticks,
   celesta-style bells and sleigh bells, all through a gentle reverb and compressor.
   No looping music. */
(function () {
  let ctx = null;
  let master = null;   // dry + wet sum → compressor → out
  let verb = null;     // reverb send
  let muted = XMAS.store.getMuted();
  let heart = null;    // { timer, bpm }
  let pad = null;      // { oscs, filter, gain }
  let silenced = false;

  function impulse(seconds = 2.4, decay = 3) {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 3;
      comp.attack.value = 0.01;
      comp.release.value = 0.25;
      const out = ctx.createGain();
      out.gain.value = muted ? 0 : 0.8;
      comp.connect(out).connect(ctx.destination);
      master = ctx.createGain();
      master.connect(comp);
      const conv = ctx.createConvolver();
      conv.buffer = impulse();
      verb = ctx.createGain();
      verb.gain.value = 0.35;
      verb.connect(conv).connect(comp);
      api._out = out;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* Route a node to the dry bus and (optionally) the reverb. */
  function route(node, wet = 0.3) {
    node.connect(master);
    if (wet > 0) {
      const s = ctx.createGain();
      s.gain.value = wet;
      node.connect(s).connect(verb);
    }
  }

  function env(g, t, peak, attack, release) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  }

  /* Celesta / music-box bell: FM sine with a fast-decaying modulation index. */
  function bell(freq, t, { gain = 0.12, decay = 1.6, wet = 0.5 } = {}) {
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    const g = ctx.createGain();
    car.frequency.value = freq;
    mod.frequency.value = Math.min(freq * 3.5, 18000);
    modGain.gain.setValueAtTime(freq * 2.2, t);
    modGain.gain.exponentialRampToValueAtTime(freq * 0.05, t + 0.4);
    mod.connect(modGain).connect(car.frequency);
    env(g, t, gain, 0.004, decay);
    car.connect(g);
    route(g, wet);
    car.start(t); mod.start(t);
    car.stop(t + decay + 0.1); mod.stop(t + decay + 0.1);
  }

  function noise(t, dur, { gain = 0.2, type = 'bandpass', freq = 2000, q = 1, wet = 0.2, attack = 0.002 } = {}) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    env(g, t, gain, attack, Math.max(0.01, dur - attack));
    src.connect(f).connect(g);
    route(g, wet);
    src.start(t);
    return f;
  }

  function thump(t, { freq = 62, gain = 0.55, dur = 0.16 } = {}) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 180;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);
    env(g, t, gain, 0.008, dur);
    o.connect(lp).connect(g);
    route(g, 0.05);
    o.start(t); o.stop(t + dur + 0.05);
  }

  const C_MAJ = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093];
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.7, 1318.5, 1568, 1760];

  const api = {
    unlock() { ensure(); },

    /* Prize announced: low boom + a single bell. */
    announce() {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.02;
      thump(t, { freq: 48, gain: 0.5, dur: 0.6 });
      noise(t, 1.2, { type: 'lowpass', freq: 300, gain: 0.08, wet: 0.6 });
      bell(1046.5, t + 0.05, { gain: 0.1, decay: 2.2 });
      bell(1568, t + 0.12, { gain: 0.05, decay: 2 });
    },

    /* The tree lights up: a quick rising shimmer of bells. */
    lightsOn(seconds = 1.6) {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.02;
      PENTA.forEach((f, i) => bell(f, t + (i / PENTA.length) * seconds, { gain: 0.05, decay: 1.2, wet: 0.6 }));
      noise(t, seconds + 0.4, { type: 'highpass', freq: 6000, gain: 0.03, wet: 0.5, attack: seconds });
    },

    /* A wave of lights switching off: soft clicks falling in pitch, ending in a power-down. */
    lightsOut(seconds = 1.8, count = 10) {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.02;
      for (let i = 0; i < count; i++) {
        const at = t + (i / count) * seconds * (0.6 + Math.random() * 0.4);
        noise(at, 0.035, { freq: 2600 - i * 120, q: 4, gain: 0.08, wet: 0.15 });
      }
      const end = t + seconds;
      thump(end, { freq: 70, gain: 0.45, dur: 0.5 });
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(180, end);
      o.frequency.exponentialRampToValueAtTime(40, end + 0.9);
      env(g, end, 0.08, 0.01, 0.9);
      o.connect(g); route(g, 0.3);
      o.start(end); o.stop(end + 1);
    },

    /* One big stage light snapping off (finals elimination). */
    clunk() {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.01;
      noise(t, 0.05, { freq: 1500, q: 2, gain: 0.25, wet: 0.2 });
      thump(t, { freq: 55, gain: 0.7, dur: 0.45 });
      noise(t, 1.4, { type: 'lowpass', freq: 220, gain: 0.12, wet: 0.7 });
    },

    /* Roulette tick as the spotlight hops. */
    tick(pitch = 1) {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.005;
      noise(t, 0.03, { freq: 1400 * pitch, q: 6, gain: 0.16, wet: 0.1 });
      thump(t, { freq: 140 * pitch, gain: 0.08, dur: 0.05 });
    },

    /* Whoosh for cards flying. */
    whoosh(seconds = 0.9) {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.01;
      const f = noise(t, seconds, { freq: 400, q: 0.9, gain: 0.08, wet: 0.4, attack: seconds * 0.6 });
      f.frequency.exponentialRampToValueAtTime(3200, t + seconds);
    },

    /* Heartbeat that can speed up; stops on demand. */
    heartbeat(bpm = 66) {
      if (!ensure()) return;
      if (heart) { heart.bpm = bpm; return; }
      heart = { bpm, timer: null };
      const beat = () => {
        if (!heart) return;
        const t = ctx.currentTime + 0.02;
        thump(t, { freq: 58, gain: 0.5, dur: 0.14 });
        thump(t + 0.17, { freq: 50, gain: 0.35, dur: 0.16 });
        heart.timer = setTimeout(beat, 60000 / heart.bpm);
      };
      beat();
    },
    stopHeartbeat() {
      if (heart) { clearTimeout(heart.timer); heart = null; }
    },

    /* Low tension drone whose filter opens as `level` (0–1) rises. */
    tension(level) {
      if (!ensure()) return;
      const t = ctx.currentTime;
      if (!pad) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 250; filter.Q.value = 2;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.05, t + 2);
        const oscs = [110, 110.6, 164.8].map((f) => {
          const o = ctx.createOscillator();
          o.type = 'sawtooth'; o.frequency.value = f;
          o.connect(filter); o.start();
          return o;
        });
        filter.connect(gain);
        route(gain, 0.4);
        pad = { oscs, filter, gain };
      }
      pad.filter.frequency.setTargetAtTime(250 + level * 1600, t, 0.8);
      pad.gain.gain.setTargetAtTime(0.03 + level * 0.04, t, 0.8);
    },
    stopTension(fade = 0.4) {
      if (!pad) return;
      const p = pad; pad = null;
      const t = ctx.currentTime;
      p.gain.gain.cancelScheduledValues(t);
      p.gain.gain.setTargetAtTime(0.0001, t, fade / 3);
      setTimeout(() => p.oscs.forEach((o) => o.stop()), fade * 1000 + 300);
    },

    /* The star lights: sleigh bells, a celesta run and a warm chord. */
    celebrate(grand = false) {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.03;
      C_MAJ.forEach((f, i) => bell(f, t + i * 0.085, { gain: 0.11, decay: 2.4, wet: 0.6 }));
      if (grand) [2093, 2637, 3136].forEach((f, i) => bell(f, t + 0.7 + i * 0.12, { gain: 0.07, decay: 2.6 }));
      // sleigh bells: a shuffle of tiny bright bursts
      const bars = grand ? 3.2 : 2.2;
      for (let s = 0; s < bars; s += 0.125) {
        const accent = (s * 8) % 2 === 0;
        noise(t + s + (accent ? 0 : 0.02), 0.09, { freq: 7500, q: 3, gain: accent ? 0.07 : 0.035, wet: 0.3 });
        noise(t + s, 0.07, { freq: 11000, q: 4, gain: accent ? 0.04 : 0.02, wet: 0.3 });
      }
      // warm chord (C add9) swelling under it
      [130.81, 196, 261.63, 329.63, 392, 587.33].forEach((f) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.035, t + 0.35);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (grand ? 4.5 : 3.2));
        o.connect(g); route(g, 0.5);
        o.start(t); o.stop(t + 5);
      });
    },

    /* Electrical flutter before a wave: every bulb dips at once. */
    buzz(seconds = 0.6) {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.01;
      const o = ctx.createOscillator();
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 100;
      f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 3;
      g.gain.setValueAtTime(0.0001, t);
      for (let k = 0; k < seconds; k += 0.06) g.gain.setValueAtTime(Math.random() < 0.5 ? 0.05 : 0.005, t + k);
      g.gain.setValueAtTime(0.0001, t + seconds);
      o.connect(f).connect(g); route(g, 0.2);
      o.start(t); o.stop(t + seconds + 0.05);
    },

    /* The tree powering up. */
    powerUp() {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.01;
      noise(t, 0.06, { freq: 1200, q: 2, gain: 0.2, wet: 0.2 });
      thump(t, { freq: 60, gain: 0.5, dur: 0.4 });
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(60, t);
      o.frequency.exponentialRampToValueAtTime(240, t + 1.2);
      env(g, t, 0.05, 0.3, 1.2);
      o.connect(g); route(g, 0.4);
      o.start(t); o.stop(t + 1.6);
    },

    /* Deep cinematic hit for a close-up. */
    boom() {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.01;
      thump(t, { freq: 46, gain: 0.75, dur: 0.9 });
      noise(t, 1.6, { type: 'lowpass', freq: 160, gain: 0.16, wet: 0.8 });
      bell(392, t + 0.02, { gain: 0.04, decay: 2.4, wet: 0.8 });
    },

    /* Glass starting to crack. */
    crack(intensity = 1) {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.01;
      const n = 3 + Math.round(intensity * 4);
      for (let i = 0; i < n; i++) {
        noise(t + i * (0.018 + Math.random() * 0.03), 0.02, { freq: 3500 + Math.random() * 4000, q: 5, gain: 0.08 + intensity * 0.06, wet: 0.25 });
      }
      bell(2400 + Math.random() * 1200, t, { gain: 0.025, decay: 0.5, wet: 0.4 });
    },

    /* A glass ornament smashing. */
    shatter() {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.01;
      noise(t, 0.35, { type: 'highpass', freq: 2500, gain: 0.35, wet: 0.4 });
      noise(t, 0.12, { freq: 1800, q: 1, gain: 0.3, wet: 0.2 });
      thump(t, { freq: 80, gain: 0.45, dur: 0.25 });
      for (let i = 0; i < 16; i++) {
        bell(2500 + Math.random() * 2500, t + 0.05 + Math.random() * 0.9, { gain: 0.02 + Math.random() * 0.03, decay: 0.35 + Math.random() * 0.5, wet: 0.5 });
      }
    },

    /* Soft confirmation for UI actions. */
    blip() {
      if (!ensure()) return;
      bell(1318.5, ctx.currentTime + 0.01, { gain: 0.05, decay: 0.6, wet: 0.2 });
    },

    /* A snare roll that accelerates and swells, landing on a low hit: the prize announcement. */
    drumroll(seconds = 1.6) {
      if (!ensure()) return;
      const t0 = ctx.currentTime + 0.05;
      const hits = Math.round(seconds * 24);
      for (let i = 0; i < hits; i++) {
        const k = i / hits;
        const t = t0 + seconds * (1 - Math.pow(1 - k, 1.6));
        noise(t, 0.07, { type: 'bandpass', freq: 1700 + k * 1400, q: 0.9, gain: 0.025 + 0.11 * k, wet: 0.15 });
      }
      const end = t0 + seconds;
      thump(end, { freq: 66, gain: 0.5, dur: 0.35 });
      noise(end, 0.3, { freq: 900, q: 0.7, gain: 0.26, wet: 0.4 });
      bell(523.25, end, { gain: 0.05, decay: 1.4, wet: 0.5 });
    },

    /* Glass under stress: a low, wavering groan. */
    creak(intensity = 0.6) {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.01;
      const dur = 0.5 + intensity * 0.7;
      const f = noise(t, dur, { freq: 700 + Math.random() * 500, q: 9, gain: 0.05 + intensity * 0.07, wet: 0.35, attack: dur * 0.4 });
      f.frequency.exponentialRampToValueAtTime(380 + Math.random() * 200, t + dur);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(240 + Math.random() * 80, t);
      o.frequency.linearRampToValueAtTime(190 + Math.random() * 60, t + dur);
      env(g, t, 0.012 + intensity * 0.02, dur * 0.5, dur * 0.5);
      o.connect(g); route(g, 0.3);
      o.start(t); o.stop(t + dur + 0.05);
    },

    /* A chip of glass skittering away. */
    tinkle() {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.01;
      for (let i = 0; i < 3; i++) bell(3200 + Math.random() * 2400, t + i * (0.05 + Math.random() * 0.08), { gain: 0.018, decay: 0.3, wet: 0.5 });
    },

    /* Thin rising whine as glass reaches breaking point. */
    stress(seconds = 1.5, level = 1) {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.01;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(700, t);
      o.frequency.exponentialRampToValueAtTime(2600 + level * 900, t + seconds);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.02 + level * 0.025, t + seconds * 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t + seconds + 0.05);
      o.connect(g); route(g, 0.4);
      o.start(t); o.stop(t + seconds + 0.1);
      noise(t, seconds, { freq: 1800, q: 12, gain: 0.03 * level, wet: 0.3, attack: seconds * 0.8 });
    },

    /* Both finalists exploding together. */
    bigBurst() {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.01;
      thump(t, { freq: 42, gain: 0.9, dur: 0.9 });
      noise(t, 0.6, { type: 'highpass', freq: 2000, gain: 0.45, wet: 0.5 });
      noise(t, 0.25, { freq: 1200, q: 0.8, gain: 0.4, wet: 0.3 });
      for (let i = 0; i < 26; i++) {
        bell(2200 + Math.random() * 3200, t + 0.03 + Math.random() * 0.5, { gain: 0.02 + Math.random() * 0.03, decay: 0.3 + Math.random() * 0.4, wet: 0.6 });
      }
    },

    /* Cut every sound to dead silence (reverb tails included); restore() brings it back. */
    silence(fade = 0.08) {
      if (!ensure() || !api._out) return;
      silenced = true;
      this.stopHeartbeat();
      this.stopTension(0.05);
      api._out.gain.cancelScheduledValues(ctx.currentTime);
      api._out.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
    },
    restore() {
      if (!ctx || !api._out) return;
      silenced = false;
      api._out.gain.cancelScheduledValues(ctx.currentTime);
      api._out.gain.setTargetAtTime(muted ? 0 : 0.8, ctx.currentTime, 0.02);
    },

    /* The ember catching: one soft bell over a warm swell. */
    ignite() {
      if (!ensure()) return;
      const t = ctx.currentTime + 0.02;
      bell(784, t, { gain: 0.09, decay: 3, wet: 0.7 });
      bell(1568, t + 0.02, { gain: 0.035, decay: 2.6, wet: 0.7 });
      [196, 293.66, 392].forEach((f) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.03, t + 1.2);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
        o.connect(g); route(g, 0.6);
        o.start(t); o.stop(t + 3.4);
      });
    },

    stopAll() { this.stopHeartbeat(); this.stopTension(0.3); if (silenced) this.restore(); },

    isMuted: () => muted,
    setMuted(m) {
      muted = m;
      XMAS.store.setMuted(m);
      if (api._out && !silenced) api._out.gain.setTargetAtTime(m ? 0 : 0.8, ctx.currentTime, 0.05);
    }
  };

  XMAS.audio = api;
})();
