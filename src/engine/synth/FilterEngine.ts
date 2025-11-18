import * as Tone from 'tone';

export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'notch';
export type FilterSlope = 12 | 24;

export interface FilterParams {
  type: FilterType;
  frequency: number;
  resonance: number;
  slope: FilterSlope;
  drive: number;
  analogDrift: {
    enabled: boolean;
    amount: number;
    rate: number;
  };
}

export class FilterEngine {
  private context: AudioContext;
  private input: GainNode;
  private output: GainNode;

  // Filter nodes
  private filter1: BiquadFilterNode;
  private filter2: BiquadFilterNode | null = null; // For 24dB slope

  // Drive/saturation
  private driveGain: GainNode;
  private waveshaper: WaveShaperNode;
  private driveCompensation: GainNode;

  // Analog drift LFO
  private driftLFO: Tone.LFO | null = null;

  private params: FilterParams;

  constructor(context: AudioContext, params: FilterParams) {
    this.context = context;
    this.params = params;

    // Create input/output nodes
    this.input = context.createGain();
    this.output = context.createGain();

    // Create drive stage
    this.driveGain = context.createGain();
    this.waveshaper = context.createWaveShaper();
    this.driveCompensation = context.createGain();

    // Create filter nodes
    this.filter1 = context.createBiquadFilter();

    if (params.slope === 24) {
      // 24dB slope requires cascading two filters
      this.filter2 = context.createBiquadFilter();
    }

    this.initializeFilter();
    this.connectNodes();
  }

  private initializeFilter(): void {
    // Set filter type
    const filterType = this.mapFilterType(this.params.type);
    this.filter1.type = filterType;
    if (this.filter2) {
      this.filter2.type = filterType;
    }

    // Set frequency
    this.filter1.frequency.value = this.params.frequency;
    if (this.filter2) {
      this.filter2.frequency.value = this.params.frequency;
    }

    // Set resonance (Q factor)
    // Map 0-1 to reasonable Q values (0.1 to 20)
    const Q = 0.1 + this.params.resonance * 19.9;
    this.filter1.Q.value = Q;
    if (this.filter2) {
      this.filter2.Q.value = Q;
    }

    // Set drive
    this.setDrive(this.params.drive);

    // Initialize analog drift
    if (this.params.analogDrift.enabled) {
      this.initializeAnalogDrift();
    }
  }

  private mapFilterType(type: FilterType): BiquadFilterType {
    const typeMap: Record<FilterType, BiquadFilterType> = {
      lowpass: 'lowpass',
      highpass: 'highpass',
      bandpass: 'bandpass',
      notch: 'notch',
    };
    return typeMap[type];
  }

  private connectNodes(): void {
    // Signal chain: input -> drive -> waveshaper -> compensation -> filter(s) -> output
    this.input.connect(this.driveGain);
    this.driveGain.connect(this.waveshaper);
    this.waveshaper.connect(this.driveCompensation);
    this.driveCompensation.connect(this.filter1);

    if (this.filter2) {
      // 24dB slope: cascade two filters
      this.filter1.connect(this.filter2);
      this.filter2.connect(this.output);
    } else {
      this.filter1.connect(this.output);
    }
  }

  private setDrive(amount: number): void {
    // amount: 0-1
    // Map to drive gain (1x to 10x)
    const driveAmount = 1 + amount * 9;
    this.driveGain.gain.value = driveAmount;

    // Create saturation curve
    this.createSaturationCurve(amount);

    // Compensate for drive gain to maintain output level
    this.driveCompensation.gain.value = 1 / Math.sqrt(driveAmount);
  }

  private createSaturationCurve(amount: number): void {
    // Create waveshaping curve for analog-style saturation
    const samples = 1024;
    const curve = new Float32Array(samples);

    // Soft clipping with adjustable intensity
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * 2 - 1;

      if (amount === 0) {
        // No saturation, linear
        curve[i] = x;
      } else {
        // Soft clipping using tanh
        const k = 1 + amount * 9; // Saturation intensity
        curve[i] = Math.tanh(k * x) / Math.tanh(k);
      }
    }

    this.waveshaper.curve = curve;
  }

  private initializeAnalogDrift(): void {
    // Create LFO for filter frequency drift (analog emulation)
    const driftAmount = this.params.analogDrift.amount;
    const driftRate = this.params.analogDrift.rate;

    this.driftLFO = new Tone.LFO({
      frequency: driftRate,
      min: -driftAmount,
      max: driftAmount,
    });

    // Connect LFO to filter frequency
    this.driftLFO.connect(this.filter1.frequency as any);
    if (this.filter2) {
      this.driftLFO.connect(this.filter2.frequency as any);
    }

    this.driftLFO.start();
  }

  setFrequency(frequency: number, time?: number): void {
    const scheduleTime = time ?? this.context.currentTime;

    // Clamp frequency to reasonable range (20Hz - 20kHz)
    const clampedFreq = Math.max(20, Math.min(20000, frequency));

    this.filter1.frequency.setValueAtTime(clampedFreq, scheduleTime);
    if (this.filter2) {
      this.filter2.frequency.setValueAtTime(clampedFreq, scheduleTime);
    }

    this.params.frequency = clampedFreq;
  }

  setResonance(resonance: number, time?: number): void {
    const scheduleTime = time ?? this.context.currentTime;

    // Map 0-1 to Q values
    const Q = 0.1 + resonance * 19.9;

    this.filter1.Q.setValueAtTime(Q, scheduleTime);
    if (this.filter2) {
      this.filter2.Q.setValueAtTime(Q, scheduleTime);
    }

    this.params.resonance = resonance;
  }

  setType(type: FilterType): void {
    const filterType = this.mapFilterType(type);
    this.filter1.type = filterType;
    if (this.filter2) {
      this.filter2.type = filterType;
    }
    this.params.type = type;
  }

  setSlope(slope: FilterSlope): void {
    if (slope === this.params.slope) return;

    // Need to rebuild filter chain
    this.disconnect();

    if (slope === 24 && !this.filter2) {
      // Add second filter for 24dB slope
      this.filter2 = this.context.createBiquadFilter();
      this.filter2.type = this.filter1.type;
      this.filter2.frequency.value = this.filter1.frequency.value;
      this.filter2.Q.value = this.filter1.Q.value;
    } else if (slope === 12 && this.filter2) {
      // Remove second filter
      this.filter2.disconnect();
      this.filter2 = null;
    }

    this.params.slope = slope;
    this.connectNodes();
  }

  updateDrive(amount: number): void {
    this.setDrive(amount);
    this.params.drive = amount;
  }

  updateAnalogDrift(params: Partial<FilterParams['analogDrift']>): void {
    this.params.analogDrift = { ...this.params.analogDrift, ...params };

    if (this.params.analogDrift.enabled && !this.driftLFO) {
      this.initializeAnalogDrift();
    } else if (!this.params.analogDrift.enabled && this.driftLFO) {
      this.driftLFO.stop();
      this.driftLFO.dispose();
      this.driftLFO = null;
    } else if (this.driftLFO) {
      // Update existing LFO
      this.driftLFO.frequency.value = this.params.analogDrift.rate;
      this.driftLFO.min = -this.params.analogDrift.amount;
      this.driftLFO.max = this.params.analogDrift.amount;
    }
  }

  updateParams(params: Partial<FilterParams>): void {
    if (params.frequency !== undefined) {
      this.setFrequency(params.frequency);
    }
    if (params.resonance !== undefined) {
      this.setResonance(params.resonance);
    }
    if (params.type !== undefined) {
      this.setType(params.type);
    }
    if (params.slope !== undefined) {
      this.setSlope(params.slope);
    }
    if (params.drive !== undefined) {
      this.updateDrive(params.drive);
    }
    if (params.analogDrift !== undefined) {
      this.updateAnalogDrift(params.analogDrift);
    }
  }

  // Get filter frequency parameter for modulation
  getFrequencyParam(): AudioParam {
    return this.filter1.frequency;
  }

  connect(destination: AudioNode): this {
    this.output.connect(destination);
    return this;
  }

  disconnect(): void {
    this.output.disconnect();
  }

  getInput(): GainNode {
    return this.input;
  }

  getOutput(): GainNode {
    return this.output;
  }

  dispose(): void {
    if (this.driftLFO) {
      this.driftLFO.stop();
      this.driftLFO.dispose();
    }

    this.disconnect();
    this.input.disconnect();
    this.driveGain.disconnect();
    this.waveshaper.disconnect();
    this.driveCompensation.disconnect();
    this.filter1.disconnect();
    if (this.filter2) {
      this.filter2.disconnect();
    }
  }
}
