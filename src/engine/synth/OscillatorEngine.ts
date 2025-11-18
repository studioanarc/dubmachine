import * as Tone from 'tone';

export type OscillatorType = 'sine' | 'triangle' | 'sawtooth' | 'square' | 'pulse';
export type NoiseType = 'white' | 'pink' | 'brown';

export interface OscillatorParams {
  osc1: {
    type: OscillatorType;
    level: number;
    octave: number;
    semitone: number;
    detune: number;
    pulseWidth?: number;
  };
  osc2: {
    type: OscillatorType;
    level: number;
    octave: number;
    semitone: number;
    detune: number;
    pulseWidth?: number;
  };
  osc3: {
    type: OscillatorType;
    level: number;
    octave: number;
    semitone: number;
    detune: number;
    pulseWidth?: number;
  };
  sub: {
    enabled: boolean;
    level: number;
    octave: -1 | -2;
  };
  noise: {
    enabled: boolean;
    type: NoiseType;
    level: number;
  };
  unison: {
    enabled: boolean;
    voices: number;
    detune: number;
    stereoSpread: number;
  };
}

export class OscillatorEngine {
  private context: AudioContext;
  private output: GainNode;

  // Main oscillators
  private osc1: Tone.Oscillator | null = null;
  private osc2: Tone.Oscillator | null = null;
  private osc3: Tone.Oscillator | null = null;

  // Pulse width modulation for pulse waves
  private pwm1: Tone.PulseOscillator | null = null;
  private pwm2: Tone.PulseOscillator | null = null;
  private pwm3: Tone.PulseOscillator | null = null;

  // Sub oscillator
  private subOsc: Tone.Oscillator | null = null;

  // Noise generator
  private noise: Tone.Noise | null = null;

  // Unison voices
  private unisonOscillators: Tone.Oscillator[] = [];

  // Level controls
  private osc1Gain: GainNode;
  private osc2Gain: GainNode;
  private osc3Gain: GainNode;
  private subGain: GainNode;
  private noiseGain: GainNode;

  private params: OscillatorParams;
  // private isPlaying: boolean = false;

  constructor(context: AudioContext, params: OscillatorParams) {
    this.context = context;
    this.params = params;

    // Create output node
    this.output = context.createGain();

    // Create gain nodes for level control
    this.osc1Gain = context.createGain();
    this.osc2Gain = context.createGain();
    this.osc3Gain = context.createGain();
    this.subGain = context.createGain();
    this.noiseGain = context.createGain();

    // Connect gain nodes to output
    this.osc1Gain.connect(this.output);
    this.osc2Gain.connect(this.output);
    this.osc3Gain.connect(this.output);
    this.subGain.connect(this.output);
    this.noiseGain.connect(this.output);

    this.initializeOscillators();
  }

  private initializeOscillators(): void {
    // Initialize main oscillators
    if (this.params.osc1.type === 'pulse' && this.params.osc1.pulseWidth !== undefined) {
      this.pwm1 = new Tone.PulseOscillator({
        frequency: 440,
        width: this.params.osc1.pulseWidth,
      }).connect(this.osc1Gain as any);
    } else {
      this.osc1 = new Tone.Oscillator({
        frequency: 440,
        type: this.params.osc1.type as any,
      }).connect(this.osc1Gain as any);
    }

    if (this.params.osc2.type === 'pulse' && this.params.osc2.pulseWidth !== undefined) {
      this.pwm2 = new Tone.PulseOscillator({
        frequency: 440,
        width: this.params.osc2.pulseWidth,
      }).connect(this.osc2Gain as any);
    } else {
      this.osc2 = new Tone.Oscillator({
        frequency: 440,
        type: this.params.osc2.type as any,
      }).connect(this.osc2Gain as any);
    }

    if (this.params.osc3.type === 'pulse' && this.params.osc3.pulseWidth !== undefined) {
      this.pwm3 = new Tone.PulseOscillator({
        frequency: 440,
        width: this.params.osc3.pulseWidth,
      }).connect(this.osc3Gain as any);
    } else {
      this.osc3 = new Tone.Oscillator({
        frequency: 440,
        type: this.params.osc3.type as any,
      }).connect(this.osc3Gain as any);
    }

    // Initialize sub oscillator
    if (this.params.sub.enabled) {
      this.subOsc = new Tone.Oscillator({
        frequency: 440,
        type: 'sine', // Sub is always sine for clean bass
      }).connect(this.subGain as any);
    }

    // Initialize noise generator
    if (this.params.noise.enabled) {
      this.noise = new Tone.Noise(this.params.noise.type).connect(this.noiseGain as any);
    }

    // Set initial levels
    this.updateLevels();
  }

  private updateLevels(): void {
    this.osc1Gain.gain.value = this.params.osc1.level;
    this.osc2Gain.gain.value = this.params.osc2.level;
    this.osc3Gain.gain.value = this.params.osc3.level;
    this.subGain.gain.value = this.params.sub.level;
    this.noiseGain.gain.value = this.params.noise.level;
  }

  start(frequency: number, time?: number): void {
    const startTime = time ?? this.context.currentTime;

    // Calculate frequencies with octave/semitone offsets
    const freq1 = this.calculateFrequency(frequency, this.params.osc1);
    const freq2 = this.calculateFrequency(frequency, this.params.osc2);
    const freq3 = this.calculateFrequency(frequency, this.params.osc3);

    // Start main oscillators
    if (this.pwm1) {
      this.pwm1.frequency.setValueAtTime(freq1, startTime);
      this.pwm1.start(startTime);
    } else if (this.osc1) {
      this.osc1.frequency.setValueAtTime(freq1, startTime);
      this.osc1.start(startTime);
    }

    if (this.pwm2) {
      this.pwm2.frequency.setValueAtTime(freq2, startTime);
      this.pwm2.start(startTime);
    } else if (this.osc2) {
      this.osc2.frequency.setValueAtTime(freq2, startTime);
      this.osc2.start(startTime);
    }

    if (this.pwm3) {
      this.pwm3.frequency.setValueAtTime(freq3, startTime);
      this.pwm3.start(startTime);
    } else if (this.osc3) {
      this.osc3.frequency.setValueAtTime(freq3, startTime);
      this.osc3.start(startTime);
    }

    // Start sub oscillator
    if (this.subOsc && this.params.sub.enabled) {
      const subFreq = frequency / Math.pow(2, Math.abs(this.params.sub.octave));
      this.subOsc.frequency.setValueAtTime(subFreq, startTime);
      this.subOsc.start(startTime);
    }

    // Start noise
    if (this.noise && this.params.noise.enabled) {
      this.noise.start(startTime);
    }

    // Start unison voices if enabled
    if (this.params.unison.enabled) {
      this.startUnisonVoices(frequency, startTime);
    }

    // this.isPlaying = true;
  }

  private startUnisonVoices(baseFrequency: number, time: number): void {
    // Clear existing unison voices
    this.stopUnisonVoices();

    const voices = this.params.unison.voices;
    const detuneAmount = this.params.unison.detune;
    const stereoSpread = this.params.unison.stereoSpread;

    for (let i = 0; i < voices; i++) {
      // Create panner for stereo spread
      const panner = this.context.createStereoPanner();
      const gain = this.context.createGain();

      // Calculate detune for this voice
      const detune = (i / (voices - 1) - 0.5) * 2 * detuneAmount;

      // Calculate pan position
      const pan = (i / (voices - 1) - 0.5) * 2 * stereoSpread;
      panner.pan.value = Math.max(-1, Math.min(1, pan));

      // Reduce level per voice to avoid clipping
      gain.gain.value = 1 / Math.sqrt(voices);

      // Create oscillator (use osc1 type)
      const osc = new Tone.Oscillator({
        frequency: baseFrequency,
        type: this.params.osc1.type as any,
        detune: detune,
      });

      // Connect: osc -> gain -> panner -> output
      osc.connect(gain as any);
      gain.connect(panner);
      panner.connect(this.output);

      osc.start(time);
      this.unisonOscillators.push(osc);
    }
  }

  private stopUnisonVoices(): void {
    this.unisonOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.dispose();
      } catch (e) {
        // Oscillator already stopped
      }
    });
    this.unisonOscillators = [];
  }

  stop(time?: number): void {
    const stopTime = time ?? this.context.currentTime;

    // Stop main oscillators
    if (this.pwm1) this.pwm1.stop(stopTime);
    if (this.pwm2) this.pwm2.stop(stopTime);
    if (this.pwm3) this.pwm3.stop(stopTime);
    if (this.osc1) this.osc1.stop(stopTime);
    if (this.osc2) this.osc2.stop(stopTime);
    if (this.osc3) this.osc3.stop(stopTime);

    // Stop sub and noise
    if (this.subOsc) this.subOsc.stop(stopTime);
    if (this.noise) this.noise.stop(stopTime);

    // Stop unison voices
    this.stopUnisonVoices();

    // this.isPlaying = false;
  }

  private calculateFrequency(
    baseFreq: number,
    oscParams: { octave: number; semitone: number; detune: number }
  ): number {
    // Apply octave shift
    let freq = baseFreq * Math.pow(2, oscParams.octave);

    // Apply semitone shift
    freq *= Math.pow(2, oscParams.semitone / 12);

    // Apply detune (cents)
    freq *= Math.pow(2, oscParams.detune / 1200);

    return freq;
  }

  setFrequency(frequency: number, time?: number): void {
    const scheduleTime = time ?? this.context.currentTime;

    const freq1 = this.calculateFrequency(frequency, this.params.osc1);
    const freq2 = this.calculateFrequency(frequency, this.params.osc2);
    const freq3 = this.calculateFrequency(frequency, this.params.osc3);

    if (this.pwm1) this.pwm1.frequency.setValueAtTime(freq1, scheduleTime);
    if (this.pwm2) this.pwm2.frequency.setValueAtTime(freq2, scheduleTime);
    if (this.pwm3) this.pwm3.frequency.setValueAtTime(freq3, scheduleTime);
    if (this.osc1) this.osc1.frequency.setValueAtTime(freq1, scheduleTime);
    if (this.osc2) this.osc2.frequency.setValueAtTime(freq2, scheduleTime);
    if (this.osc3) this.osc3.frequency.setValueAtTime(freq3, scheduleTime);

    if (this.subOsc && this.params.sub.enabled) {
      const subFreq = frequency / Math.pow(2, Math.abs(this.params.sub.octave));
      this.subOsc.frequency.setValueAtTime(subFreq, scheduleTime);
    }

    // Update unison voices
    this.unisonOscillators.forEach((osc, i) => {
      const voices = this.params.unison.voices;
      const detune = (i / (voices - 1) - 0.5) * 2 * this.params.unison.detune;
      osc.frequency.setValueAtTime(frequency, scheduleTime);
      osc.detune.setValueAtTime(detune, scheduleTime);
    });
  }

  setPulseWidth(oscIndex: 1 | 2 | 3, width: number, time?: number): void {
    const scheduleTime = time ?? this.context.currentTime;
    const pwm = oscIndex === 1 ? this.pwm1 : oscIndex === 2 ? this.pwm2 : this.pwm3;

    if (pwm) {
      pwm.width.setValueAtTime(Math.max(0, Math.min(1, width)), scheduleTime);
    }
  }

  updateParams(params: Partial<OscillatorParams>): void {
    this.params = { ...this.params, ...params };
    this.updateLevels();
  }

  connect(destination: AudioNode): this {
    this.output.connect(destination);
    return this;
  }

  disconnect(): void {
    this.output.disconnect();
  }

  getOutput(): GainNode {
    return this.output;
  }

  dispose(): void {
    this.stop();

    // Dispose Tone.js objects
    if (this.pwm1) this.pwm1.dispose();
    if (this.pwm2) this.pwm2.dispose();
    if (this.pwm3) this.pwm3.dispose();
    if (this.osc1) this.osc1.dispose();
    if (this.osc2) this.osc2.dispose();
    if (this.osc3) this.osc3.dispose();
    if (this.subOsc) this.subOsc.dispose();
    if (this.noise) this.noise.dispose();

    // Disconnect all nodes
    this.disconnect();
    this.osc1Gain.disconnect();
    this.osc2Gain.disconnect();
    this.osc3Gain.disconnect();
    this.subGain.disconnect();
    this.noiseGain.disconnect();
  }
}
