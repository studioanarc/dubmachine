import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Analog Filter: Moog-style ladder filter
 * Classic analog filter with resonance and drive
 */
export class AnalogFilter extends BaseEffect {
  private filter: Tone.Filter;
  private envelope: Tone.FrequencyEnvelope;
  private lfo: Tone.LFO;
  private distortion: Tone.Distortion;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Analog Filter',
      type: 'AnalogFilter',
      category: 'filter',
      version: '1.0.0'
    });

    this.filter = new Tone.Filter(1000, 'lowpass', -24);
    this.filter.Q.value = 5;

    // Envelope for filter modulation
    this.envelope = new Tone.FrequencyEnvelope({
      attack: 0.01,
      decay: 0.2,
      sustain: 0.5,
      release: 0.5,
      baseFrequency: 200,
      octaves: 4
    });

    // LFO for filter modulation
    this.lfo = new Tone.LFO(0.5, 0.5, 1.5);

    // Subtle distortion for analog character
    this.distortion = new Tone.Distortion(0.1);

    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.distortion);
    this.distortion.connect(this.filter);
    this.filter.connect(this.wetGain);

    // Modulation routing
    this.envelope.connect(this.filter.frequency);
    this.lfo.connect(this.filter.frequency);

    this.lfo.start();

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    // Initialize parameters
    this.addParameter('cutoff', {
      value: 1000,
      min: 20,
      max: 20000,
      default: 1000,
      unit: 'Hz',
      curve: 'exponential'
    });

    this.addParameter('resonance', {
      value: 5,
      min: 0.1,
      max: 30,
      default: 5,
      step: 0.1
    });

    this.addParameter('drive', {
      value: 0.1,
      min: 0,
      max: 1,
      default: 0.1,
      step: 0.01
    });

    this.addParameter('envAmount', {
      value: 2,
      min: 0,
      max: 8,
      default: 2,
      step: 0.1
    });

    this.addParameter('lfoRate', {
      value: 0.5,
      min: 0.01,
      max: 20,
      default: 0.5,
      unit: 'Hz',
      step: 0.01
    });

    this.addParameter('lfoDepth', {
      value: 0.5,
      min: 0,
      max: 1,
      default: 0.5,
      step: 0.01
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'cutoff':
        this.filter.frequency.value = value;
        break;
      case 'resonance':
        this.filter.Q.value = value;
        break;
      case 'drive':
        this.distortion.distortion = value;
        break;
      case 'envAmount':
        this.envelope.octaves = value;
        break;
      case 'lfoRate':
        this.lfo.frequency.value = value;
        break;
      case 'lfoDepth':
        this.lfo.amplitude.value = value;
        break;
    }
  }

  /**
   * Trigger envelope
   */
  public trigger(): void {
    this.envelope.triggerAttackRelease('8n');
  }

  /**
   * Set filter type
   */
  public setFilterType(type: 'lowpass' | 'highpass' | 'bandpass'): void {
    this.filter.type = type;
  }

  public dispose(): void {
    this.filter.dispose();
    this.envelope.dispose();
    this.lfo.dispose();
    this.distortion.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
