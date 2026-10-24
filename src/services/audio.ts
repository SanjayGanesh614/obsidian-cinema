/**
 * Procedural Web Audio API sound generator for Obsidian Cinema
 * Synthesizes mechanical 35mm film reel clicks, analog shutter pulses,
 * and holographic stamping resonances without any external audio files.
 */

class CinemaAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private projectorOsc: OscillatorNode | null = null;
  private projectorGain: GainNode | null = null;
  private isProjectorRunning: boolean = false;
  private lastTickTime: number = 0;

  constructor() {
    // Check initial mute state from localStorage if available
    try {
      const saved = localStorage.getItem('obsidian_audio_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    } catch {
      // Ignore storage errors
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('obsidian_audio_muted', String(this.isMuted));
    } catch {}

    if (this.isMuted && this.isProjectorRunning) {
      this.stopProjector();
    }
    return this.isMuted;
  }

  /**
   * Mechanical 35mm film reel sprocket click
   * Pitch and intensity scale subtly with scroll velocity
   */
  public playReelTick(velocity: number = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = performance.now();
    // Throttle clicks to avoid saturation
    if (now - this.lastTickTime < 45) return;
    this.lastTickTime = now;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Film reel click characteristic: sharp transient impulse
      const freq = Math.min(2400, Math.max(900, 1200 + velocity * 250));
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.022);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, t);
      filter.Q.setValueAtTime(3.5, t);

      const amp = Math.min(0.09, Math.max(0.015, 0.03 * Math.min(2.5, Math.abs(velocity))));
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.028);
    } catch {
      // Audio fallback silent
    }
  }

  /**
   * Tactile mechanical switch click on button interactions
   */
  public playClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.035);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.038);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.04);
    } catch {}
  }

  /**
   * Holographic ticket stamping resonance: deep metallic thud + crystalline chime
   */
  public playStamp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;

      // 1. Heavy physical stamp thud
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(130, t);
      thudOsc.frequency.exponentialRampToValueAtTime(35, t + 0.18);

      thudGain.gain.setValueAtTime(0.2, t);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

      thudOsc.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thudOsc.start(t);
      thudOsc.stop(t + 0.25);

      // 2. Holographic shimmer metallic bell harmonic
      const bellFrequencies = [587.33, 880, 1174.66, 1760]; // D5, A5, D6, A6
      bellFrequencies.forEach((freq, idx) => {
        if (!this.ctx) return;
        const bellOsc = this.ctx.createOscillator();
        const bellGain = this.ctx.createGain();

        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(freq, t + 0.04);

        const bellAmp = 0.05 / (idx + 1);
        bellGain.gain.setValueAtTime(0, t);
        bellGain.gain.linearRampToValueAtTime(bellAmp, t + 0.05);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8 + idx * 0.15);

        bellOsc.connect(bellGain);
        bellGain.connect(this.ctx.destination);
        bellOsc.start(t + 0.04);
        bellOsc.stop(t + 1.2);
      });
    } catch {}
  }

  /**
   * Smooth cinematic low-pass whoosh for view switches
   */
  public playWhoosh() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // White noise buffer
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(250, t);
      filter.frequency.exponentialRampToValueAtTime(1400, t + 0.12);
      filter.frequency.exponentialRampToValueAtTime(300, t + 0.24);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(t);
      noise.stop(t + 0.26);
    } catch {}
  }

  /**
   * Toggle vintage 35mm cinema projector hum
   */
  public toggleProjector(): boolean {
    if (this.isProjectorRunning) {
      this.stopProjector();
      return false;
    } else {
      this.startProjector();
      return true;
    }
  }

  private startProjector() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      this.stopProjector();
      const t = this.ctx.currentTime;

      // Low frequency hum
      this.projectorOsc = this.ctx.createOscillator();
      this.projectorOsc.type = 'sawtooth';
      this.projectorOsc.frequency.setValueAtTime(48, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, t);

      this.projectorGain = this.ctx.createGain();
      this.projectorGain.gain.setValueAtTime(0.0001, t);
      this.projectorGain.gain.linearRampToValueAtTime(0.018, t + 1.2);

      this.projectorOsc.connect(filter);
      filter.connect(this.projectorGain);
      this.projectorGain.connect(this.ctx.destination);

      this.projectorOsc.start(t);
      this.isProjectorRunning = true;
    } catch {}
  }

  private stopProjector() {
    if (this.projectorOsc && this.projectorGain && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        this.projectorGain.gain.linearRampToValueAtTime(0.0001, t + 0.5);
        setTimeout(() => {
          this.projectorOsc?.stop();
          this.projectorOsc?.disconnect();
          this.projectorOsc = null;
          this.projectorGain = null;
        }, 550);
      } catch {}
    }
    this.isProjectorRunning = false;
  }
}

export const cinemaAudio = new CinemaAudioEngine();
