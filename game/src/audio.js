// audio.js — WebAudio-synthesized sound effects and music for Warung Cepat.
// One job: every sound the game makes, built from oscillators and noise only
// (no audio files, no network). Safe to call when audio is unavailable.

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Pentatonic melody for the warung: C major pentatonic, gentle and looping.
const MELODY = [
  72, 0, 76, 79, 76, 0, 74, 72, 0, 0,
  67, 0, 69, 72, 69, 0, 67, 0, 0, 0,
  72, 0, 76, 79, 81, 79, 76, 74, 72, 0,
  74, 76, 74, 72, 67, 0, 0, 0, 0, 0,
];
const NOTE_SECONDS = 0.24;

export function createAudio() {
  const audio = {
    ctx: null,
    master: null,
    musicGain: null,
    sizzleNode: null,
    sizzleGain: null,
    muted: false,
    musicTimer: null,
    melodyStep: 0,

    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        return true;
      }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.14;
        this.musicGain.connect(this.master);
        return true;
      } catch (e) {
        return false;
      }
    },

    toggleMute() {
      this.muted = !this.muted;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
      return this.muted;
    },

    tone(freq, seconds, type, volume, when) {
      if (!this.ctx || this.muted) return;
      try {
        const t0 = this.ctx.currentTime + (when || 0);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(volume || 0.3, t0 + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(t0);
        osc.stop(t0 + seconds + 0.05);
      } catch (e) { /* audio is best-effort */ }
    },

    noiseBurst(seconds, volume, lowpass) {
      if (!this.ctx || this.muted) return;
      try {
        const t0 = this.ctx.currentTime;
        const len = Math.max(1, Math.floor(this.ctx.sampleRate * seconds));
        const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = lowpass || 3000;
        const gain = this.ctx.createGain();
        gain.gain.value = volume || 0.3;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        src.start(t0);
      } catch (e) { /* audio is best-effort */ }
    },

    chop() {
      this.noiseBurst(0.09, 0.5, 1800);
      this.tone(180, 0.08, 'triangle', 0.35);
    },

    pickup() {
      this.tone(520, 0.07, 'sine', 0.25);
    },

    place() {
      this.tone(330, 0.08, 'triangle', 0.3);
      this.tone(220, 0.1, 'triangle', 0.2, 0.05);
    },

    ding() {
      this.tone(880, 0.35, 'sine', 0.35);
      this.tone(1318, 0.4, 'sine', 0.22, 0.06);
    },

    coin() {
      this.tone(988, 0.09, 'square', 0.16);
      this.tone(1319, 0.22, 'square', 0.16, 0.08);
    },

    error() {
      this.tone(160, 0.22, 'sawtooth', 0.25);
      this.tone(110, 0.3, 'sawtooth', 0.22, 0.1);
    },

    tick() {
      this.tone(1200, 0.04, 'square', 0.1);
    },

    startSizzle() {
      if (!this.ctx || this.muted || this.sizzleNode) return;
      try {
        const len = this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 5200;
        filter.Q.value = 0.6;
        const gain = this.ctx.createGain();
        gain.gain.value = 0.05;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        src.start();
        this.sizzleNode = src;
        this.sizzleGain = gain;
      } catch (e) { /* audio is best-effort */ }
    },

    stopSizzle() {
      if (this.sizzleNode) {
        try { this.sizzleNode.stop(); } catch (e) { /* already stopped */ }
        this.sizzleNode = null;
        this.sizzleGain = null;
      }
    },

    startMusic() {
      if (!this.ensure() || this.musicTimer) return;
      this.melodyStep = 0;
      this.musicTimer = setInterval(() => {
        if (this.muted || !this.ctx) return;
        const midi = MELODY[this.melodyStep % MELODY.length];
        this.melodyStep++;
        if (midi) this.tone(midiToFreq(midi), NOTE_SECONDS * 1.8, 'triangle', 0.16);
      }, NOTE_SECONDS * 1000);
    },

    stopMusic() {
      if (this.musicTimer) {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
    },
  };
  return audio;
}
