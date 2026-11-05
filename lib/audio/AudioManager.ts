import type { AudioCue, EngineProfile, Settings } from '@/lib/types';

type MusicStyle =
  | 'menu'
  | 'sunrise'
  | 'night'
  | 'desert'
  | 'coast'
  | 'frost'
  | 'forest'
  | 'neon';

type AmbienceStyle =
  | 'mountain'
  | 'city'
  | 'desert'
  | 'coastal'
  | 'snow'
  | 'forest'
  | 'neon';

interface MusicPattern {
  bpm: number;
  bass: number[];
  lead: number[];
  chord: number[];
}

const MUSIC_PATTERNS: Record<MusicStyle, MusicPattern> = {
  menu: {
    bpm: 92,
    bass: [55, 55, 73.42, 65.41, 49, 49, 65.41, 58.27],
    lead: [440, 554.37, 659.25, 554.37, 392, 493.88, 587.33, 493.88],
    chord: [220, 277.18, 329.63],
  },
  sunrise: {
    bpm: 108,
    bass: [65.41, 65.41, 82.41, 73.42, 55, 55, 73.42, 82.41],
    lead: [523.25, 659.25, 783.99, 659.25, 440, 523.25, 659.25, 783.99],
    chord: [261.63, 329.63, 392],
  },
  night: {
    bpm: 84,
    bass: [49, 49, 58.27, 55, 43.65, 43.65, 55, 58.27],
    lead: [392, 466.16, 587.33, 466.16, 349.23, 440, 523.25, 440],
    chord: [196, 233.08, 293.66],
  },
  desert: {
    bpm: 96,
    bass: [58.27, 58.27, 69.3, 65.41, 51.91, 51.91, 65.41, 77.78],
    lead: [466.16, 587.33, 698.46, 587.33, 415.3, 523.25, 622.25, 523.25],
    chord: [233.08, 293.66, 349.23],
  },
  coast: {
    bpm: 100,
    bass: [61.74, 61.74, 77.78, 69.3, 55, 55, 69.3, 82.41],
    lead: [493.88, 622.25, 739.99, 622.25, 440, 554.37, 659.25, 554.37],
    chord: [246.94, 311.13, 369.99],
  },
  frost: {
    bpm: 76,
    bass: [46.25, 46.25, 61.74, 55, 41.2, 41.2, 55, 61.74],
    lead: [369.99, 466.16, 554.37, 466.16, 329.63, 415.3, 493.88, 415.3],
    chord: [184.99, 233.08, 277.18],
  },
  forest: {
    bpm: 88,
    bass: [55, 58.27, 65.41, 55, 49, 55, 58.27, 65.41],
    lead: [440, 466.16, 523.25, 440, 392, 440, 466.16, 523.25],
    chord: [220, 233.08, 261.63],
  },
  neon: {
    bpm: 124,
    bass: [73.42, 73.42, 92.5, 82.41, 65.41, 65.41, 82.41, 92.5],
    lead: [587.33, 739.99, 880, 739.99, 523.25, 659.25, 783.99, 659.25],
    chord: [293.66, 369.99, 440],
  },
};

const AMBIENCE_FILTERS: Record<AmbienceStyle, { frequency: number; q: number; gain: number }> = {
  mountain: { frequency: 700, q: 0.6, gain: 0.16 },
  city: { frequency: 320, q: 0.8, gain: 0.12 },
  desert: { frequency: 1100, q: 0.7, gain: 0.14 },
  coastal: { frequency: 500, q: 0.5, gain: 0.18 },
  snow: { frequency: 900, q: 0.4, gain: 0.13 },
  forest: { frequency: 1500, q: 0.9, gain: 0.1 },
  neon: { frequency: 260, q: 1.4, gain: 0.14 },
};

const ENGINE_PROFILE_CONFIG: Record<
  EngineProfile,
  { base: number; sweep: number; harmonic: number; filter: number; q: number; wave: OscillatorType }
> = {
  'flat-six': { base: 52, sweep: 92, harmonic: 2.52, filter: 420, q: 5.2, wave: 'sawtooth' },
  'v8-crossplane': { base: 34, sweep: 78, harmonic: 1.5, filter: 300, q: 3.2, wave: 'sawtooth' },
  'v8-flatplane': { base: 46, sweep: 106, harmonic: 2, filter: 520, q: 5.8, wave: 'square' },
  v10: { base: 44, sweep: 126, harmonic: 2.5, filter: 680, q: 6.4, wave: 'sawtooth' },
  v12: { base: 30, sweep: 112, harmonic: 3, filter: 620, q: 4.6, wave: 'triangle' },
  'inline-six': { base: 40, sweep: 88, harmonic: 2.02, filter: 460, q: 4.4, wave: 'sawtooth' },
  electric: { base: 108, sweep: 180, harmonic: 2.01, filter: 1100, q: 1.4, wave: 'sine' },
  'offroad-v8': { base: 28, sweep: 66, harmonic: 1.49, filter: 220, q: 2.4, wave: 'sawtooth' },
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function midiToFreq(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private ambienceBus: GainNode | null = null;

  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSub: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private engineProfile: EngineProfile = 'v8-crossplane';

  private tireSource: AudioBufferSourceNode | null = null;
  private tireGain: GainNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  private ambienceSource: AudioBufferSourceNode | null = null;
  private ambienceGain: GainNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private ambienceInterval: ReturnType<typeof setInterval> | null = null;

  private musicTimer: ReturnType<typeof setTimeout> | null = null;
  private musicStyle: MusicStyle | null = null;
  private musicActive = false;
  private musicLoopToken = 0;
  private musicGainNode: GainNode | null = null;

  private lastAudioUpdate = 0;
  private lastRpm = -1;
  private lastThrottle = -1;
  private lastSpeed = -1;
  private lastBoosting = false;
  private lastDrifting = false;
  private turboOsc: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;
  private nitroRumble: AudioBufferSourceNode | null = null;
  private nitroRumbleGain: GainNode | null = null;
  private nitroRumbleFilter: BiquadFilterNode | null = null;

  private testEngineTimer: ReturnType<typeof setInterval> | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private volumes: Settings['audio'] = {
    master: 0.8,
    engine: 0.75,
    sfx: 0.8,
    music: 0.35,
    ambience: 0.4,
    muted: false,
  };
  private raceActive = false;
  private engineStarted = false;
  private lastCue = new Map<AudioCue, number>();
  private disposed = false;
  private unlocked = false;

  get isUnlocked(): boolean {
    return this.unlocked && this.ctx?.state === 'running';
  }

  async unlock(): Promise<boolean> {
    if (this.disposed) return false;
    if (!this.ctx) {
      try {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return false;
        this.ctx = new Ctor();
        this.buildGraph();
      } catch {
        return false;
      }
    }
    try {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      this.unlocked = this.ctx.state === 'running';
      return this.unlocked;
    } catch {
      return false;
    }
  }

  private buildGraph(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    this.masterGain = ctx.createGain();
    this.engineBus = ctx.createGain();
    this.sfxBus = ctx.createGain();
    this.musicBus = ctx.createGain();
    this.ambienceBus = ctx.createGain();
    this.masterGain.connect(ctx.destination);
    this.engineBus.connect(this.masterGain);
    this.sfxBus.connect(this.masterGain);
    this.musicBus.connect(this.masterGain);
    this.ambienceBus.connect(this.masterGain);
    this.applyVolumes();
    this.noiseBuffer = this.createNoiseBuffer(2);
  }

  private createNoiseBuffer(seconds: number): AudioBuffer {
    const ctx = this.ctx;
    const length = Math.floor((ctx?.sampleRate ?? 44100) * seconds);
    const buffer = ctx?.createBuffer(1, length, ctx.sampleRate) as AudioBuffer;
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    return buffer;
  }

  setVolumes(volumes: Settings['audio']): void {
    this.volumes = { ...volumes };
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const master = this.volumes.muted ? 0 : clamp01(this.volumes.master);
    const ramp = (param: AudioParam | null | undefined, value: number) => {
      if (!param) return;
      param.cancelScheduledValues(now);
      param.setTargetAtTime(value, now, 0.05);
    };
    ramp(this.masterGain?.gain, master);
    ramp(this.engineBus?.gain, clamp01(this.volumes.engine));
    ramp(this.sfxBus?.gain, clamp01(this.volumes.sfx));
    ramp(this.musicBus?.gain, clamp01(this.volumes.music));
    ramp(this.ambienceBus?.gain, clamp01(this.volumes.ambience));
  }

  startEngine(profile: EngineProfile = 'v8-crossplane'): void {
    if (!this.ctx || this.engineStarted || !this.engineBus || !this.sfxBus) return;
    const ctx = this.ctx;
    const sfx = this.sfxBus;
    const config = ENGINE_PROFILE_CONFIG[profile] ?? ENGINE_PROFILE_CONFIG['v8-crossplane'];
    this.engineProfile = profile;
    this.engineStarted = true;
    this.engineOsc1 = ctx.createOscillator();
    this.engineOsc2 = ctx.createOscillator();
    this.engineSub = ctx.createOscillator();
    this.engineFilter = ctx.createBiquadFilter();
    this.engineGain = ctx.createGain();

    this.engineOsc1.type = config.wave;
    this.engineOsc2.type = profile === 'electric' ? 'sine' : 'square';
    this.engineSub.type = 'sine';
    this.engineOsc1.frequency.value = config.base;
    this.engineOsc2.frequency.value = config.base * config.harmonic;
    this.engineSub.frequency.value = config.base * 0.5;
    this.engineOsc2.detune.value = profile === 'v8-crossplane' ? 7 : 3;

    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = config.filter;
    this.engineFilter.Q.value = config.q;
    this.engineGain.gain.value = 0;

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineSub.connect(this.engineGain);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.engineBus);
    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineSub.start();

    // Turbo spool oscillator
    this.turboOsc = ctx.createOscillator();
    this.turboOsc.type = 'sine';
    this.turboOsc.frequency.value = 1400;
    this.turboGain = ctx.createGain();
    this.turboGain.gain.value = 0;
    this.turboOsc.connect(this.turboGain);
    this.turboGain.connect(sfx);
    this.turboOsc.start();

    // Nitro flame roar
    if (this.noiseBuffer) {
      this.nitroRumble = ctx.createBufferSource();
      this.nitroRumble.buffer = this.noiseBuffer;
      this.nitroRumble.loop = true;
      this.nitroRumbleFilter = ctx.createBiquadFilter();
      this.nitroRumbleFilter.type = 'bandpass';
      this.nitroRumbleFilter.frequency.value = 450;
      this.nitroRumbleFilter.Q.value = 3.5;
      this.nitroRumbleGain = ctx.createGain();
      this.nitroRumbleGain.gain.value = 0;
      this.nitroRumble.connect(this.nitroRumbleFilter);
      this.nitroRumbleFilter.connect(this.nitroRumbleGain);
      this.nitroRumbleGain.connect(sfx);
      this.nitroRumble.start();
    }

    this.tireSource = ctx.createBufferSource();
    if (this.noiseBuffer) this.tireSource.buffer = this.noiseBuffer;
    this.tireSource.loop = true;
    this.tireFilter = ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.value = 2600;
    this.tireFilter.Q.value = 1.2;
    this.tireGain = ctx.createGain();
    this.tireGain.gain.value = 0;
    this.tireSource.connect(this.tireFilter);
    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(sfx);
    this.tireSource.start();

    this.windSource = ctx.createBufferSource();
    if (this.noiseBuffer) this.windSource.buffer = this.noiseBuffer;
    this.windSource.loop = true;
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.value = 900;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(sfx);
    this.windSource.start();
  }

  updateEngine(params: {
    rpm: number;
    throttle: number;
    speedKph: number;
    drifting: boolean;
    boosting: boolean;
    paused: boolean;
  }): void {
    if (!this.ctx || !this.engineStarted) return;
    const now = this.ctx.currentTime;
    const nowPerf = performance.now();

    // Throttle audio parameter scheduling to 30Hz to prevent audio thread buffer underrun/stutter
    if (
      !params.paused &&
      nowPerf - this.lastAudioUpdate < 32 &&
      Math.abs(params.rpm - this.lastRpm) < 0.03 &&
      Math.abs(params.throttle - this.lastThrottle) < 0.04 &&
      params.boosting === this.lastBoosting &&
      params.drifting === this.lastDrifting
    ) {
      return;
    }
    this.lastAudioUpdate = nowPerf;
    this.lastRpm = params.rpm;
    this.lastThrottle = params.throttle;
    this.lastSpeed = params.speedKph;
    this.lastBoosting = params.boosting;
    this.lastDrifting = params.drifting;

    const rpm = clamp01(params.rpm);
    const profile = ENGINE_PROFILE_CONFIG[this.engineProfile] ?? ENGINE_PROFILE_CONFIG['v8-crossplane'];
    const targetGain = params.paused ? 0 : 0.075 + params.throttle * 0.075 + (params.boosting ? 0.04 : 0);
    const baseFreq = profile.base + rpm * profile.sweep + (params.boosting ? 18 : 0);
    const filterFreq = profile.filter + rpm * (520 + profile.q * 120) + params.throttle * 520;

    if (this.engineOsc1 && this.engineOsc2 && this.engineSub) {
      this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.04);
      this.engineOsc2.frequency.setTargetAtTime(baseFreq * profile.harmonic, now, 0.04);
      this.engineSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);
    }
    if (this.engineFilter) {
      this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.06);
    }
    if (this.engineGain) {
      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.07);
    }

    // Turbo spool simulation
    if (this.turboOsc && this.turboGain) {
      const turboFreq = 1200 + rpm * 2600 + (params.boosting ? 800 : 0);
      const turboVolume = params.paused ? 0 : params.throttle * (0.015 + rpm * 0.025) + (params.boosting ? 0.03 : 0);
      this.turboOsc.frequency.setTargetAtTime(turboFreq, now, 0.08);
      this.turboGain.gain.setTargetAtTime(turboVolume, now, 0.06);
    }

    // Nitro flame roar
    if (this.nitroRumbleGain && this.nitroRumbleFilter) {
      const nitroVolume = params.boosting && !params.paused ? 0.16 : 0;
      this.nitroRumbleGain.gain.setTargetAtTime(nitroVolume, now, 0.05);
      if (params.boosting) {
        this.nitroRumbleFilter.frequency.setTargetAtTime(380 + Math.random() * 200, now, 0.04);
      }
    }

    if (this.tireGain) {
      const tire = params.drifting ? 0.09 + clamp01(params.speedKph / 300) * 0.1 : 0;
      this.tireGain.gain.setTargetAtTime(params.paused ? 0 : tire, now, 0.04);
    }
    if (this.windGain) {
      const wind = params.paused ? 0 : clamp01(params.speedKph / 320) * 0.09;
      this.windGain.gain.setTargetAtTime(wind, now, 0.15);
    }
    if (this.windFilter) {
      this.windFilter.frequency.setTargetAtTime(500 + params.speedKph * 5, now, 0.2);
    }
  }

  setRaceActive(active: boolean): void {
    this.raceActive = active;
    if (!active) this.setPaused(false);
  }

  setPaused(paused: boolean): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.engineGain) {
      this.engineGain.gain.setTargetAtTime(paused ? 0 : 0.09, now, 0.1);
    }
    if (this.tireGain) this.tireGain.gain.setTargetAtTime(0, now, 0.05);
    if (this.windGain) this.windGain.gain.setTargetAtTime(0, now, 0.1);
  }

  stopEngine(): void {
    if (this.testEngineTimer) {
      clearInterval(this.testEngineTimer);
      this.testEngineTimer = null;
    }
    const nodes: Array<OscillatorNode | AudioBufferSourceNode | null> = [
      this.engineOsc1,
      this.engineOsc2,
      this.engineSub,
      this.turboOsc,
      this.nitroRumble,
      this.tireSource,
      this.windSource,
    ];
    for (const node of nodes) {
      try {
        node?.stop();
      } catch {
        // Already stopped.
      }
      node?.disconnect();
    }
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineSub = null;
    this.turboOsc = null;
    this.nitroRumble = null;
    this.tireSource = null;
    this.windSource = null;
    this.engineGain?.disconnect();
    this.turboGain?.disconnect();
    this.nitroRumbleGain?.disconnect();
    this.nitroRumbleFilter?.disconnect();
    this.tireGain?.disconnect();
    this.windGain?.disconnect();
    this.engineFilter?.disconnect();
    this.tireFilter?.disconnect();
    this.windFilter?.disconnect();
    this.engineGain = null;
    this.turboGain = null;
    this.nitroRumbleGain = null;
    this.nitroRumbleFilter = null;
    this.tireGain = null;
    this.windGain = null;
    this.engineFilter = null;
    this.tireFilter = null;
    this.windFilter = null;
    this.engineStarted = false;
    this.raceActive = false;
  }

  playCue(cue: AudioCue): void {
    if (!this.ctx || !this.unlocked || this.disposed) return;
    const nowMs = performance.now();
    const cooldown = cue === 'coin' || cue === 'nearMiss' ? 45 : cue === 'shift' ? 60 : 20;
    if (nowMs - (this.lastCue.get(cue) ?? 0) < cooldown) return;
    this.lastCue.set(cue, nowMs);
    const t = this.ctx.currentTime;
    switch (cue) {
      case 'ui':
        this.tone(t, 620, 0.035, 'triangle', 0.035, 760);
        break;
      case 'confirm':
        this.tone(t, 440, 0.08, 'triangle', 0.05);
        this.tone(t + 0.06, 660, 0.09, 'triangle', 0.045);
        break;
      case 'back':
        this.tone(t, 380, 0.06, 'triangle', 0.035, 280);
        break;
      case 'coin':
        this.tone(t, 1046, 0.05, 'sine', 0.06, 1568);
        this.tone(t + 0.04, 1568, 0.08, 'sine', 0.05);
        break;
      case 'nearMiss':
        this.noiseSweep(t, 0.22, 380, 2200, 0.05);
        this.tone(t, 880, 0.08, 'sine', 0.025, 1320);
        break;
      case 'checkpoint':
        this.arpeggio(t, [523.25, 659.25, 783.99, 1046.5], 0.075, 0.055, 'triangle');
        break;
      case 'crash':
        this.noiseSweep(t, 0.45, 1800, 120, 0.18);
        this.tone(t, 96, 0.4, 'sawtooth', 0.12, 42);
        break;
      case 'shift':
        this.tone(t, 150, 0.035, 'square', 0.03, 90);
        this.noiseSweep(t, 0.05, 900, 300, 0.025);
        break;
      case 'nitro':
        this.noiseSweep(t, 0.65, 280, 2600, 0.11);
        this.tone(t, 160, 0.5, 'sawtooth', 0.055, 420);
        break;
      case 'purchase':
        this.arpeggio(t, [392, 493.88, 587.33, 783.99], 0.09, 0.06, 'sine');
        break;
      case 'trophy':
        this.arpeggio(t, [523.25, 659.25, 783.99, 1046.5, 1318.5], 0.1, 0.065, 'triangle');
        break;
      case 'countdown':
        this.tone(t, 440, 0.12, 'square', 0.045);
        break;
      case 'go':
        this.tone(t, 880, 0.3, 'square', 0.06);
        break;
      case 'finish':
        this.arpeggio(t, [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5], 0.12, 0.07, 'triangle');
        break;
      case 'error':
        this.tone(t, 220, 0.16, 'square', 0.05, 110);
        break;
      default:
        break;
    }
  }

  private tone(
    time: number,
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    endFrequency?: number,
  ): void {
    if (!this.ctx || !this.sfxBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, time);
    if (endFrequency) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), time + duration);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(time);
    osc.stop(time + duration + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private noiseSweep(
    time: number,
    duration: number,
    startFreq: number,
    endFreq: number,
    volume: number,
  ): void {
    if (!this.ctx || !this.sfxBus || !this.noiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(startFreq, time);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), time + duration);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxBus);
    source.start(time);
    source.stop(time + duration + 0.05);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  private arpeggio(
    time: number,
    notes: number[],
    step: number,
    volume: number,
    type: OscillatorType,
  ): void {
    notes.forEach((note, index) => {
      this.tone(time + index * step, note, step * 1.6, type, volume);
    });
  }

  playMusic(style: MusicStyle): void {
    if (!this.ctx || !this.unlocked || this.disposed) return;
    if (this.musicActive && this.musicStyle === style) return;
    this.stopMusic();
    this.musicActive = true;
    this.musicStyle = style;
    this.musicGainNode = this.ctx.createGain();
    this.musicGainNode.gain.value = 0.12;
    this.musicGainNode.connect(this.musicBus as GainNode);
    this.scheduleMusicLoop(style);
  }

  private scheduleMusicLoop(style: MusicStyle): void {
    if (!this.ctx || !this.musicActive || !this.musicGainNode || this.musicStyle !== style) return;
    const pattern = MUSIC_PATTERNS[style];
    const token = ++this.musicLoopToken;
    const beat = 60 / pattern.bpm;
    const start = this.ctx.currentTime + 0.08;
    const notes = pattern.lead.length;

    for (let i = 0; i < notes; i += 1) {
      const t = start + i * beat;
      const lead = pattern.lead[i];
      this.musicNote(t, lead, beat * 0.75, 'triangle', 0.045);
      this.musicNote(t, pattern.bass[i % pattern.bass.length], beat * 0.9, 'sawtooth', 0.036);
      if (i % 2 === 0) {
        for (const chordNote of pattern.chord) {
          this.musicNote(t, chordNote, beat * 1.6, 'sine', 0.018);
        }
      }
      if (i % 4 === 2) {
        this.musicNoise(t, beat * 0.4, 0.012);
      }
    }

    const loopMs = notes * beat * 1000;
    this.musicTimer = setTimeout(() => {
      if (token === this.musicLoopToken) this.scheduleMusicLoop(style);
    }, loopMs - 60);
  }

  private musicNote(
    time: number,
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ): void {
    if (!this.ctx || !this.musicGainNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(this.musicGainNode);
    osc.start(time);
    osc.stop(time + duration + 0.05);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  private musicNoise(time: number, duration: number, volume: number): void {
    if (!this.ctx || !this.musicGainNode || !this.noiseBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGainNode);
    source.start(time);
    source.stop(time + duration + 0.02);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  stopMusic(): void {
    this.musicActive = false;
    this.musicStyle = null;
    this.musicLoopToken += 1;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicGainNode) {
      const node = this.musicGainNode;
      try {
        node.gain.cancelScheduledValues(this.ctx?.currentTime ?? 0);
        node.gain.setTargetAtTime(0, this.ctx?.currentTime ?? 0, 0.1);
      } catch {
        // Context closed.
      }
      setTimeout(() => node.disconnect(), 400);
      this.musicGainNode = null;
    }
  }

  playAmbience(style: AmbienceStyle): void {
    if (!this.ctx || !this.unlocked || this.disposed) return;
    this.stopAmbience();
    const ctx = this.ctx;
    const config = AMBIENCE_FILTERS[style];
    this.ambienceSource = ctx.createBufferSource();
    if (this.noiseBuffer) {
      this.ambienceSource.buffer = this.noiseBuffer;
      this.ambienceSource.loop = true;
    }
    this.ambienceFilter = ctx.createBiquadFilter();
    this.ambienceFilter.type = style === 'neon' || style === 'city' ? 'lowpass' : 'bandpass';
    this.ambienceFilter.frequency.value = config.frequency;
    this.ambienceFilter.Q.value = config.q;
    this.ambienceGain = ctx.createGain();
    this.ambienceGain.gain.value = 0;
    this.ambienceSource.connect(this.ambienceFilter);
    this.ambienceFilter.connect(this.ambienceGain);
    this.ambienceGain.connect(this.ambienceBus as GainNode);
    this.ambienceSource.start();
    this.ambienceGain.gain.setTargetAtTime(config.gain, ctx.currentTime, 0.8);

    if (style === 'neon' || style === 'city') {
      this.ambienceInterval = setInterval(() => {
        if (!this.ctx || !this.ambienceGain) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = style === 'neon' ? 55 : 110;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.018, t + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
        osc.connect(gain);
        gain.connect(this.ambienceGain);
        osc.start(t);
        osc.stop(t + 4.6);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      }, 5200);
    }
  }

  stopAmbience(): void {
    if (this.ambienceInterval) {
      clearInterval(this.ambienceInterval);
      this.ambienceInterval = null;
    }
    const source = this.ambienceSource;
    const gain = this.ambienceGain;
    const filter = this.ambienceFilter;
    this.ambienceSource = null;
    this.ambienceGain = null;
    this.ambienceFilter = null;
    if (source) {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
      source.disconnect();
    }
    filter?.disconnect();
    gain?.disconnect();
  }

  testAudio(kind: 'engine' | 'effects' | 'music' | 'ambience'): void {
    if (!this.ctx) return;
    if (kind === 'effects') {
      this.playCue('checkpoint');
      this.playCue('coin');
      return;
    }
    if (kind === 'music') {
      const pattern = MUSIC_PATTERNS.neon;
      const t = this.ctx.currentTime;
      const localGain = this.ctx.createGain();
      localGain.gain.value = 0.16;
      if (!this.musicBus) return;
      localGain.connect(this.musicBus);
      const old = this.musicGainNode;
      this.musicGainNode = localGain;
      this.arpeggio(t, pattern.lead.slice(0, 4), 0.1, 0.04, 'triangle');
      setTimeout(() => {
        localGain.disconnect();
        if (this.musicGainNode === localGain) this.musicGainNode = old;
      }, 1200);
      return;
    }
    if (kind === 'ambience') {
      const t = this.ctx.currentTime;
      const source = this.ctx.createBufferSource();
      if (this.noiseBuffer) source.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 700;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.09, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      source.connect(filter);
      filter.connect(gain);
      if (!this.ambienceBus) return;
      gain.connect(this.ambienceBus);
      source.start(t);
      source.stop(t + 2.3);
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
      return;
    }
    if (kind === 'engine') {
      if (this.testEngineTimer) {
        clearInterval(this.testEngineTimer);
        this.testEngineTimer = null;
      }
      const wasStarted = this.engineStarted;
      if (!wasStarted) this.startEngine();
      const steps = 5;
      let step = 0;
      const preview = (index: number) =>
        this.updateEngine({
          rpm: 0.25 + index * 0.15,
          throttle: index === 0 ? 0.4 : 0.7,
          speedKph: 140,
          drifting: false,
          boosting: false,
          paused: false,
        });
      preview(step);
      this.testEngineTimer = setInterval(() => {
        step += 1;
        if (!this.ctx) {
          if (this.testEngineTimer) clearInterval(this.testEngineTimer);
          this.testEngineTimer = null;
          return;
        }
        if (step >= steps) {
          if (this.testEngineTimer) clearInterval(this.testEngineTimer);
          this.testEngineTimer = null;
          if (!wasStarted) {
            this.updateEngine({
              rpm: 0,
              throttle: 0,
              speedKph: 0,
              drifting: false,
              boosting: false,
              paused: true,
            });
            this.stopEngine();
          }
          return;
        }
        preview(step);
      }, 420);
    }
  }

  attachUnlock(): () => void {
    const handler = () => {
      void this.unlock();
    };
    window.addEventListener('pointerdown', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
  }

  dispose(): void {
    this.disposed = true;
    this.stopEngine();
    this.stopMusic();
    this.stopAmbience();
    try {
      void this.ctx?.close();
    } catch {
      // Nothing else to do.
    }
    this.ctx = null;
    this.masterGain?.disconnect();
    this.engineBus?.disconnect();
    this.sfxBus?.disconnect();
    this.musicBus?.disconnect();
    this.ambienceBus?.disconnect();
    this.masterGain = null;
    this.engineBus = null;
    this.sfxBus = null;
    this.musicBus = null;
    this.ambienceBus = null;
  }
}

let audioManager: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!audioManager) audioManager = new AudioManager();
  return audioManager;
}

export type { AmbienceStyle, MusicStyle };
