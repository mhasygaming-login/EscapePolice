// High-Fidelity Procedural Automotive Engine Synthesizer & Retro SFX Engine
// Real-time physical acoustics modeling for 8 legendary sports & supercars:
// - Civic Type R FL5: High-rev 2.0L VTEC Turbo scream & BOV hiss
// - GR Supra MK5: Velvety 3.0L B58 inline-6 deep baritone purr
// - Nissan GT-R R35: Aggressive 3.8L VR38DETT twin-turbo metallic growl & wastegate flutter
// - BMW M4 G82: Raspy 3.0L S58 straight-six roar & dual-clutch shift crackles
// - Lamborghini Aventador SVJ: Screaming 6.5L naturally aspirated V12 F1 howl
// - Porsche GT3 RS: Pure 4.0L 9000 RPM flat-six cup car mechanical wail
// - Mazda RX-7 FD: Brap-brap idle & high-frequency 13B-REW twin-rotor beehive shriek
// - Mustang GT500: Deep guttural 5.2L cross-plane V8 muscle rumble + supercharger blower whine

export type CarModelId =
  | 'civic_fl5'
  | 'supra_mk5'
  | 'gtr_r35'
  | 'bmw_m4'
  | 'aventador'
  | 'gt3_rs'
  | 'rx7_fd'
  | 'mustang_gt500';

interface EngineAcousticProfile {
  name: string;
  engineType: 'inline4' | 'inline6' | 'v6' | 'v8' | 'v12' | 'boxer6' | 'rotary';
  idleRpm: number;
  redlineRpm: number;
  pulseMultiplier: number;
  baseFreqScale: number;
  bassCutoff: number;
  trebleCutoff: number;
  raspiness: number; // 0 to 1
  hasTurbo: boolean;
  hasSupercharger: boolean;
  hasVtec: boolean;
  shiftPopIntensity: number;
  bovStyle: 'whoosh' | 'flutter' | 'sneeze' | 'none';
}

const CAR_ACOUSTIC_PROFILES: Record<string, EngineAcousticProfile> = {
  civic_fl5: {
    name: '2.0L VTEC Turbo K20C1',
    engineType: 'inline4',
    idleRpm: 850,
    redlineRpm: 7600,
    pulseMultiplier: 2.0, // 4-cyl 4-stroke
    baseFreqScale: 1.0,
    bassCutoff: 140,
    trebleCutoff: 2600,
    raspiness: 0.35,
    hasTurbo: true,
    hasSupercharger: false,
    hasVtec: true,
    shiftPopIntensity: 0.45,
    bovStyle: 'whoosh',
  },
  supra_mk5: {
    name: '3.0L Twin-Scroll Turbo B58',
    engineType: 'inline6',
    idleRpm: 720,
    redlineRpm: 7000,
    pulseMultiplier: 3.0, // 6-cyl inline
    baseFreqScale: 0.95,
    bassCutoff: 105,
    trebleCutoff: 2200,
    raspiness: 0.25,
    hasTurbo: true,
    hasSupercharger: false,
    hasVtec: false,
    shiftPopIntensity: 0.55,
    bovStyle: 'whoosh',
  },
  gtr_r35: {
    name: '3.8L Twin-Turbo VR38DETT',
    engineType: 'v6',
    idleRpm: 800,
    redlineRpm: 7300,
    pulseMultiplier: 3.0, // V6
    baseFreqScale: 1.05,
    bassCutoff: 95,
    trebleCutoff: 3100,
    raspiness: 0.55,
    hasTurbo: true,
    hasSupercharger: false,
    hasVtec: false,
    shiftPopIntensity: 0.75,
    bovStyle: 'flutter',
  },
  bmw_m4: {
    name: '3.0L M TwinPower Turbo S58',
    engineType: 'inline6',
    idleRpm: 780,
    redlineRpm: 7500,
    pulseMultiplier: 3.0,
    baseFreqScale: 1.1,
    bassCutoff: 120,
    trebleCutoff: 3400,
    raspiness: 0.65,
    hasTurbo: true,
    hasSupercharger: false,
    hasVtec: false,
    shiftPopIntensity: 0.85,
    bovStyle: 'whoosh',
  },
  aventador: {
    name: '6.5L NA V12 L539',
    engineType: 'v12',
    idleRpm: 920,
    redlineRpm: 8700,
    pulseMultiplier: 6.0, // 12-cylinder exotic F1 frequency
    baseFreqScale: 1.35,
    bassCutoff: 160,
    trebleCutoff: 5200,
    raspiness: 0.8,
    hasTurbo: false,
    hasSupercharger: false,
    hasVtec: false,
    shiftPopIntensity: 0.9,
    bovStyle: 'none',
  },
  gt3_rs: {
    name: '4.0L NA Boxer-6 MA275',
    engineType: 'boxer6',
    idleRpm: 900,
    redlineRpm: 9000,
    pulseMultiplier: 3.0, // Flat-6
    baseFreqScale: 1.25,
    bassCutoff: 150,
    trebleCutoff: 4600,
    raspiness: 0.7,
    hasTurbo: false,
    hasSupercharger: false,
    hasVtec: false,
    shiftPopIntensity: 0.8,
    bovStyle: 'none',
  },
  rx7_fd: {
    name: '1.3L Twin-Turbo 13B-REW Rotary',
    engineType: 'rotary',
    idleRpm: 880,
    redlineRpm: 8200,
    pulseMultiplier: 3.0, // High-frequency rotor combustion
    baseFreqScale: 1.3,
    bassCutoff: 130,
    trebleCutoff: 4200,
    raspiness: 0.75,
    hasTurbo: true,
    hasSupercharger: false,
    hasVtec: false,
    shiftPopIntensity: 0.7,
    bovStyle: 'sneeze',
  },
  mustang_gt500: {
    name: '5.2L Supercharged Predator V8',
    engineType: 'v8',
    idleRpm: 680,
    redlineRpm: 7500,
    pulseMultiplier: 4.0, // Cross-plane V8 heavy throb
    baseFreqScale: 0.85,
    bassCutoff: 75,
    trebleCutoff: 1900,
    raspiness: 0.4,
    hasTurbo: false,
    hasSupercharger: true,
    hasVtec: false,
    shiftPopIntensity: 0.7,
    bovStyle: 'none',
  },
};

export class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  // Real-time Engine Nodes
  private engineActive: boolean = false;
  private currentCarId: string = 'civic_fl5';
  private masterEngineGain: GainNode | null = null;
  private fundamentalOsc: OscillatorNode | null = null;
  private harmonicOsc: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private superchargerOsc: OscillatorNode | null = null;
  private superchargerGain: GainNode | null = null;
  private exhaustFilter: BiquadFilterNode | null = null;
  private raspFilter: BiquadFilterNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;

  // Simulated Gearbox State
  private simulatedRpm: number = 850;
  private currentGear: number = 1;
  private lastShiftTime: number = 0;
  private targetSpeed: number = 0;

  public ensureContext(): AudioContext | null {
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
      return this.ctx;
    } catch {
      return null;
    }
  }

  public unlock() {
    this.ensureContext();
  }

  // ----------------------------------------------------
  // Procedural Engine Synthesizer Core
  // ----------------------------------------------------

  public startEngine(carModel: string = 'civic_fl5') {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    if (this.engineActive) {
      if (this.currentCarId !== carModel) {
        this.currentCarId = carModel;
        this.reconfigureEngineAcoustics();
      }
      return;
    }

    try {
      this.currentCarId = carModel;
      const profile = CAR_ACOUSTIC_PROFILES[carModel] || CAR_ACOUSTIC_PROFILES.civic_fl5;

      // 1. Master Engine Gain
      this.masterEngineGain = ctx.createGain();
      this.masterEngineGain.gain.setValueAtTime(0.24, ctx.currentTime);
      this.masterEngineGain.connect(ctx.destination);

      // 2. Exhaust Lowpass Resonance Filter
      this.exhaustFilter = ctx.createBiquadFilter();
      this.exhaustFilter.type = 'lowpass';
      this.exhaustFilter.frequency.setValueAtTime(profile.trebleCutoff, ctx.currentTime);
      this.exhaustFilter.Q.setValueAtTime(2.2 + profile.raspiness * 2, ctx.currentTime);
      this.exhaustFilter.connect(this.masterEngineGain);

      // 3. Rasp / Manifold Peak Filter
      this.raspFilter = ctx.createBiquadFilter();
      this.raspFilter.type = 'peaking';
      this.raspFilter.frequency.setValueAtTime(profile.bassCutoff * 2.5, ctx.currentTime);
      this.raspFilter.gain.setValueAtTime(4 + profile.raspiness * 6, ctx.currentTime);
      this.raspFilter.connect(this.exhaustFilter);

      // 4. Fundamental Combustion Oscillator (Cylinder Firing Pulse)
      this.fundamentalOsc = ctx.createOscillator();
      this.fundamentalOsc.type = profile.engineType === 'v8' ? 'sawtooth' : profile.engineType === 'rotary' ? 'sawtooth' : 'triangle';
      this.fundamentalOsc.frequency.setValueAtTime(45, ctx.currentTime);
      this.fundamentalOsc.connect(this.raspFilter);
      this.fundamentalOsc.start();

      // 5. Harmonic Overtone Oscillator (Exhaust Tone Color)
      this.harmonicOsc = ctx.createOscillator();
      this.harmonicOsc.type = 'sawtooth';
      this.harmonicOsc.frequency.setValueAtTime(90, ctx.currentTime);
      const harmonicGain = ctx.createGain();
      harmonicGain.gain.setValueAtTime(0.35 + profile.raspiness * 0.25, ctx.currentTime);
      this.harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(this.raspFilter);
      this.harmonicOsc.start();

      // 6. Sub-bass Throaty Rumble Oscillator
      this.subOsc = ctx.createOscillator();
      this.subOsc.type = 'sine';
      this.subOsc.frequency.setValueAtTime(30, ctx.currentTime);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(profile.engineType === 'v8' ? 0.55 : 0.35, ctx.currentTime);
      this.subOsc.connect(subGain);
      subGain.connect(this.masterEngineGain);
      this.subOsc.start();

      // 7. Forced Induction: Supercharger Blower Whine (for Mustang GT500)
      if (profile.hasSupercharger) {
        this.superchargerOsc = ctx.createOscillator();
        this.superchargerOsc.type = 'triangle';
        this.superchargerOsc.frequency.setValueAtTime(450, ctx.currentTime);
        this.superchargerGain = ctx.createGain();
        this.superchargerGain.gain.setValueAtTime(0.01, ctx.currentTime);
        this.superchargerOsc.connect(this.superchargerGain);
        this.superchargerGain.connect(this.masterEngineGain);
        this.superchargerOsc.start();
      }

      // 8. Combustion Turbulence Noise Buffer
      this.noiseGain = ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(800, ctx.currentTime);
      noiseFilter.Q.setValueAtTime(1.5, ctx.currentTime);
      this.noiseGain.connect(noiseFilter);
      noiseFilter.connect(this.masterEngineGain);

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02; // Pink noise
        lastOut = output[i];
      }
      this.noiseSource = ctx.createBufferSource();
      this.noiseSource.buffer = noiseBuffer;
      this.noiseSource.loop = true;
      this.noiseSource.connect(this.noiseGain);
      this.noiseSource.start();

      this.engineActive = true;
      this.simulatedRpm = profile.idleRpm;
      this.currentGear = 1;
    } catch {
      this.engineActive = false;
    }
  }

  private reconfigureEngineAcoustics() {
    if (!this.engineActive || !this.ctx) return;
    const profile = CAR_ACOUSTIC_PROFILES[this.currentCarId] || CAR_ACOUSTIC_PROFILES.civic_fl5;
    const now = this.ctx.currentTime;
    if (this.exhaustFilter) {
      this.exhaustFilter.frequency.setTargetAtTime(profile.trebleCutoff, now, 0.1);
      this.exhaustFilter.Q.setTargetAtTime(2.2 + profile.raspiness * 2, now, 0.1);
    }
    if (this.raspFilter) {
      this.raspFilter.frequency.setTargetAtTime(profile.bassCutoff * 2.5, now, 0.1);
      this.raspFilter.gain.setTargetAtTime(4 + profile.raspiness * 6, now, 0.1);
    }
  }

  /**
   * Main per-frame update method called from GameCanvas render loop
   */
  public updateEngine(
    speed: number,
    isThrottle: boolean,
    isBraking: boolean,
    isNitro: boolean,
    isDrifting: boolean
  ) {
    if (!this.engineActive || !this.ctx || this.muted) return;

    const profile = CAR_ACOUSTIC_PROFILES[this.currentCarId] || CAR_ACOUSTIC_PROFILES.civic_fl5;
    const now = this.ctx.currentTime;

    // 1. Realistic Gearbox & RPM Simulation
    // Speed spans roughly from 0 (idle) to 25+ (nitro max)
    const normalizedSpeed = Math.max(0, speed);
    this.targetSpeed = normalizedSpeed;

    // 6-Speed Transmission Gear Calculation
    let gear = 1;
    if (normalizedSpeed > 18) gear = 6;
    else if (normalizedSpeed > 14) gear = 5;
    else if (normalizedSpeed > 10.5) gear = 4;
    else if (normalizedSpeed > 7.5) gear = 3;
    else if (normalizedSpeed > 4.5) gear = 2;
    else gear = 1;

    // Gear shift trigger with exhaust pop & rev drop
    if (gear !== this.currentGear && now - this.lastShiftTime > 0.45) {
      const isUpshift = gear > this.currentGear;
      this.currentGear = gear;
      this.lastShiftTime = now;
      if (isUpshift) {
        this.triggerExhaustPop(profile);
        if (profile.hasTurbo) {
          this.triggerBlowOffValve(profile.bovStyle);
        }
      }
    }

    // RPM based on speed within current gear
    const gearBaseSpeeds = [0, 0, 4.5, 7.5, 10.5, 14, 18];
    const gearTopSpeeds = [0, 5, 8.5, 12, 16, 20, 26];
    const minG = gearBaseSpeeds[gear] || 0;
    const maxG = gearTopSpeeds[gear] || 25;
    const gearRatioProgress = Math.max(0, Math.min(1, (normalizedSpeed - minG) / (maxG - minG)));

    // RPM Calculation: Garang saat Maju & Garang saat Mundur
    let targetRpm = profile.idleRpm;
    if (isThrottle) {
      // Maju Garang: RPM melesat agresif mengikuti tarikan gas dan rasio gear hingga redline
      targetRpm =
        profile.idleRpm +
        gearRatioProgress * (profile.redlineRpm - profile.idleRpm) +
        (isNitro ? 1200 : 0);
    } else if (isBraking) {
      // Mundur Garang: Putaran mesin tertahan tinggi dengan dentuman gear mundur / engine brake bergemuruh
      targetRpm = profile.idleRpm + 1650 + Math.random() * 150;
    } else {
      // Idle / cruising santai
      targetRpm =
        profile.idleRpm +
        gearRatioProgress * (profile.redlineRpm - profile.idleRpm) * 0.45;
    }

    // Smooth RPM inertia (respons cepat bertenaga saat gas dan mundur)
    const rpmSmoothing = isThrottle ? 0.25 : isBraking ? 0.22 : 0.12;
    this.simulatedRpm += (targetRpm - this.simulatedRpm) * rpmSmoothing;

    // 2. Physical Firing Frequency Calculation
    // Frequency (Hz) = (RPM / 60) * (Cylinders / 2) * profile.baseFreqScale
    const fundamentalFreq = Math.max(
      22,
      (this.simulatedRpm / 60) * (profile.pulseMultiplier / 2) * profile.baseFreqScale
    );

    // VTEC crossover frequency boost at high RPM (> 5400)
    let vtecBoost = 1.0;
    if (profile.hasVtec && this.simulatedRpm > 5400) {
      vtecBoost = 1.15 + ((this.simulatedRpm - 5400) / 2200) * 0.15;
    }

    // Apply frequency sweeps smoothly
    if (this.fundamentalOsc) {
      this.fundamentalOsc.frequency.setTargetAtTime(fundamentalFreq * vtecBoost, now, 0.05);
    }
    if (this.harmonicOsc) {
      this.harmonicOsc.frequency.setTargetAtTime(fundamentalFreq * 2.0 * vtecBoost, now, 0.05);
    }
    if (this.subOsc) {
      // Sub-bass rumble lebih dalam dan garang saat mundur maupun maju
      const subBoost = isBraking ? 0.6 : 0.5;
      this.subOsc.frequency.setTargetAtTime(Math.max(20, fundamentalFreq * subBoost), now, 0.05);
    }

    // 3. Dynamic Filter Tracking (Higher RPM opens exhaust valves)
    if (this.exhaustFilter) {
      const dynamicTreble =
        profile.trebleCutoff + (this.simulatedRpm / profile.redlineRpm) * 2400;
      this.exhaustFilter.frequency.setTargetAtTime(dynamicTreble, now, 0.06);
    }

    // 4. Supercharger Roots Blower Whine (for Mustang GT500)
    if (this.superchargerOsc && this.superchargerGain) {
      const superchargerPitch = 250 + (this.simulatedRpm / 1000) * 180;
      this.superchargerOsc.frequency.setTargetAtTime(superchargerPitch, now, 0.04);
      const superchargerVol = isThrottle
        ? 0.09 + (this.simulatedRpm / profile.redlineRpm) * 0.15
        : 0.01;
      this.superchargerGain.gain.setTargetAtTime(superchargerVol, now, 0.05);
    }

    // 5. Master Engine Volume: Suara Maju & Mundur Yang Garang (Tanpa Suara Belok)
    if (this.masterEngineGain) {
      let targetVolume = 0.22; // Idle / jelajah mengancam
      if (isThrottle) {
        targetVolume = 0.38; // Maju Garang: Raungan penuh tenaga
      } else if (isBraking) {
        targetVolume = 0.34; // Mundur Garang: Dengungan berat mesin mundur bergemuruh
      }
      if (isNitro) targetVolume = 0.46; // Nitro monster power
      this.masterEngineGain.gain.setTargetAtTime(targetVolume, now, 0.07);
    }
  }

  // Authentic Exhaust Pops & Crackles (Burble & overrun)
  public triggerExhaustPop(profile: EngineAcousticProfile) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const popCount = Math.floor(1 + Math.random() * 3);

    for (let i = 0; i < popCount; i++) {
      const delay = i * (0.04 + Math.random() * 0.03);
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      popOsc.type = 'sawtooth';
      popOsc.frequency.setValueAtTime(60 + Math.random() * 40, now + delay);
      popOsc.frequency.exponentialRampToValueAtTime(15, now + delay + 0.06);

      const popVol = 0.22 * profile.shiftPopIntensity;
      popGain.gain.setValueAtTime(popVol, now + delay);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

      popOsc.connect(popGain);
      popGain.connect(this.ctx.destination);
      popOsc.start(now + delay);
      popOsc.stop(now + delay + 0.07);
    }
  }

  // Authentic Turbo Blow-Off Valve (BOV) Sound
  public triggerBlowOffValve(style: 'whoosh' | 'flutter' | 'sneeze' | 'none') {
    if (!this.ctx || this.muted || style === 'none') return;
    const now = this.ctx.currentTime;

    if (style === 'flutter') {
      // Iconic Wastegate Flutter "Stututu"
      for (let i = 0; i < 4; i++) {
        const t = now + i * 0.045;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(750 - i * 80, t);
        g.gain.setValueAtTime(0.12 - i * 0.025, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(t);
        o.stop(t + 0.045);
      }
    } else if (style === 'sneeze') {
      // Sharp Rotary Turbo Sneeze
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(1800, now);
      o.frequency.exponentialRampToValueAtTime(300, now + 0.12);
      g.gain.setValueAtTime(0.18, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(now);
      o.stop(now + 0.15);
    } else {
      // High-performance Air Release Whoosh
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(1200, now);
      o.frequency.exponentialRampToValueAtTime(400, now + 0.18);
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start(now);
      o.stop(now + 0.21);
    }
  }

  // Quick Engine Rev Preview for Garage Selection
  public playEngineRev(carModel: string) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const profile = CAR_ACOUSTIC_PROFILES[carModel] || CAR_ACOUSTIC_PROFILES.civic_fl5;
    const now = ctx.currentTime;

    const baseF = (profile.idleRpm / 60) * (profile.pulseMultiplier / 2) * profile.baseFreqScale;
    const revPeakF = (profile.redlineRpm * 0.75 / 60) * (profile.pulseMultiplier / 2) * profile.baseFreqScale;

    // Rev up and down
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    o.type = profile.engineType === 'v8' ? 'sawtooth' : profile.engineType === 'v12' ? 'sawtooth' : 'triangle';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(profile.trebleCutoff, now);

    o.frequency.setValueAtTime(baseF, now);
    o.frequency.exponentialRampToValueAtTime(revPeakF, now + 0.35);
    o.frequency.exponentialRampToValueAtTime(baseF, now + 0.75);

    g.gain.setValueAtTime(0.05, now);
    g.gain.linearRampToValueAtTime(0.26, now + 0.35);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    o.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);

    o.start(now);
    o.stop(now + 0.85);

    // If supercharged, add whine
    if (profile.hasSupercharger) {
      const s = ctx.createOscillator();
      const sg = ctx.createGain();
      s.type = 'triangle';
      s.frequency.setValueAtTime(350, now);
      s.frequency.exponentialRampToValueAtTime(950, now + 0.35);
      s.frequency.exponentialRampToValueAtTime(350, now + 0.75);
      sg.gain.setValueAtTime(0.01, now);
      sg.gain.linearRampToValueAtTime(0.12, now + 0.35);
      sg.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      s.connect(sg);
      sg.connect(ctx.destination);
      s.start(now);
      s.stop(now + 0.85);
    }

    // Pop on deceleration
    setTimeout(() => {
      this.triggerExhaustPop(profile);
      if (profile.hasTurbo) {
        this.triggerBlowOffValve(profile.bovStyle);
      }
    }, 400);
  }

  public stopEngine() {
    if (!this.engineActive || !this.ctx) return;
    try {
      if (this.masterEngineGain) {
        this.masterEngineGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.05);
      }
      setTimeout(() => {
        try {
          this.fundamentalOsc?.stop();
          this.harmonicOsc?.stop();
          this.subOsc?.stop();
          this.superchargerOsc?.stop();
          this.noiseSource?.stop();
        } catch {}
        this.fundamentalOsc = null;
        this.harmonicOsc = null;
        this.subOsc = null;
        this.superchargerOsc = null;
        this.noiseSource = null;
        this.engineActive = false;
      }, 70);
    } catch {
      this.engineActive = false;
    }
  }

  // ----------------------------------------------------
  // Modern Studio-Quality Sound Effects (No 8-bit bip bip)
  // ----------------------------------------------------

  public play(type: string) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    try {
      if (type === 'coin') {
        // High-end metallic coin chime (stereo overtone)
        const freqs = [1046, 1318, 1568];
        freqs.forEach((f, idx) => {
          if (!this.ctx) return;
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + idx * 0.02);
          g.gain.setValueAtTime(0.12 - idx * 0.03, now + idx * 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.02 + 0.16);
          o.connect(g);
          g.connect(this.ctx.destination);
          o.start(now + idx * 0.02);
          o.stop(now + idx * 0.02 + 0.17);
        });
        return;
      }

      if (type === 'nitro') {
        // High-octane turbo flame jet & bass punch
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(140, now);
        bassOsc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
        bassGain.gain.setValueAtTime(0.38, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + 0.4);

        const flameOsc = ctx.createOscillator();
        const flameGain = ctx.createGain();
        flameOsc.type = 'sawtooth';
        flameOsc.frequency.setValueAtTime(450, now);
        flameOsc.frequency.linearRampToValueAtTime(1100, now + 0.4);
        flameGain.gain.setValueAtTime(0.16, now);
        flameGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        flameOsc.connect(flameGain);
        flameGain.connect(ctx.destination);
        flameOsc.start(now);
        flameOsc.stop(now + 0.45);
        return;
      }

      if (type === 'crash') {
        // Heavy multi-layered metal crunch impact
        const sub = ctx.createOscillator();
        const subG = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(110, now);
        sub.frequency.exponentialRampToValueAtTime(20, now + 0.45);
        subG.gain.setValueAtTime(0.45, now);
        subG.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
        sub.connect(subG);
        subG.connect(ctx.destination);
        sub.start(now);
        sub.stop(now + 0.5);

        const metal = ctx.createOscillator();
        const metalG = ctx.createGain();
        metal.type = 'sawtooth';
        metal.frequency.setValueAtTime(320, now);
        metal.frequency.exponentialRampToValueAtTime(45, now + 0.35);
        metalG.gain.setValueAtTime(0.35, now);
        metalG.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        metal.connect(metalG);
        metalG.connect(ctx.destination);
        metal.start(now);
        metal.stop(now + 0.4);
        return;
      }

      if (type === 'levelup') {
        // Melodic synth arpeggio
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
          if (!this.ctx) return;
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(f, now + i * 0.06);
          g.gain.setValueAtTime(0.15, now + i * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.18);
          o.connect(g);
          g.connect(this.ctx.destination);
          o.start(now + i * 0.06);
          o.stop(now + i * 0.06 + 0.19);
        });
        return;
      }

      if (type === 'click') {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(800, now);
        o.frequency.exponentialRampToValueAtTime(400, now + 0.035);
        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now);
        o.stop(now + 0.045);
        return;
      }

      // Default high quality synthetic SFX configurations
      const configs: Record<string, [OscillatorType, number, number, number, number]> = {
        powerup: ['triangle', 320, 920, 0.2, 0.28],
        magnet: ['sine', 240, 680, 0.2, 0.25],
        multiplier: ['triangle', 420, 1100, 0.22, 0.26],
        nearmiss: ['sine', 850, 1450, 0.18, 0.12],
        gameover: ['sawtooth', 240, 35, 0.35, 0.75],
        boss: ['sawtooth', 95, 25, 0.32, 0.85],
        warning: ['triangle', 260, 120, 0.18, 0.22],
        emp: ['sawtooth', 180, 1400, 0.35, 0.42],
        achievement: ['triangle', 587, 1174, 0.22, 0.32],
        win: ['triangle', 523, 1046, 0.26, 0.55],
        success: ['sine', 523, 1046, 0.26, 0.55],
      };

      const cfg = configs[type];
      if (!cfg) return;

      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = cfg[0];
      o.frequency.setValueAtTime(cfg[1], now);
      o.frequency.linearRampToValueAtTime(cfg[2], now + cfg[4]);
      g.gain.setValueAtTime(cfg[3], now);
      g.gain.exponentialRampToValueAtTime(0.001, now + cfg[4] + 0.05);
      o.start(now);
      o.stop(now + cfg[4] + 0.06);
    } catch {
      // Audio play suppressed safely
    }
  }
}

export const sound = new SoundEngine();
