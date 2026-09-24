// WebAudio Procedural Synthesizer for Retro Arcade Sound FX & Engine Audio

class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  public ensureContext() {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch {
      // AudioContext unavailable or blocked in this environment
    }
  }

  public unlock() {
    this.ensureContext();
  }

  public play(type: string) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (type === 'levelup') {
      [523, 659, 784, 1046, 1318].forEach((f, i) => {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g);
        g.connect(this.ctx.destination);
        o.type = 'square';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.12, now + i * 0.07);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.15);
        o.start(now + i * 0.07);
        o.stop(now + i * 0.07 + 0.16);
      });
      return;
    }

    const configs: Record<string, [OscillatorType, number, number, number, number]> = {
      coin: ['sine', 750, 1350, 0.22, 0.12],
      crash: ['sawtooth', 120, 15, 0.38, 0.35],
      powerup: ['square', 380, 850, 0.18, 0.3],
      magnet: ['triangle', 280, 620, 0.18, 0.28],
      multiplier: ['square', 450, 950, 0.2, 0.28],
      nearmiss: ['sine', 950, 1400, 0.15, 0.09],
      gameover: ['sawtooth', 280, 45, 0.3, 0.65],
      click: ['sine', 650, 650, 0.1, 0.04],
      boss: ['sawtooth', 85, 30, 0.3, 0.8],
      nitro: ['sawtooth', 200, 900, 0.2, 0.28],
      warning: ['square', 200, 75, 0.15, 0.2],
      emp: ['square', 140, 1300, 0.32, 0.38],
      achievement: ['triangle', 600, 1200, 0.22, 0.3],
      win: ['sine', 523, 1046, 0.25, 0.5],
      success: ['sine', 523, 1046, 0.25, 0.5],
    };

    const cfg = configs[type];
    if (!cfg) return;

    try {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.connect(g);
      g.connect(this.ctx.destination);
      o.type = cfg[0];
      o.frequency.setValueAtTime(cfg[1], now);
      o.frequency.linearRampToValueAtTime(cfg[2], now + cfg[4]);
      g.gain.setValueAtTime(cfg[3], now);
      g.gain.exponentialRampToValueAtTime(0.001, now + cfg[4] + 0.05);
      o.start(now);
      o.stop(now + cfg[4] + 0.06);
    } catch (e) {
      // Audio play suppressed
    }
  }
}

export const sound = new SoundEngine();
