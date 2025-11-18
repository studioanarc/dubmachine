import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Ring Modulator: Ring modulation effect
 * Multiplies input signal with a carrier oscillator
 */
export class RingModulator extends BaseEffect {
  private modulator: Tone.Oscillator;
  private multiplier: Tone.Multiply;
  private lfo: Tone.LFO;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Ring Modulator',
      type: 'RingModulator',
      category: 'modulation',
      version: '1.0.0'
    });

    this.modulator = new Tone.Oscillator(100, 'sine');
    this.multiplier = new Tone.Multiply();
    this.lfo = new Tone.LFO(0.5, 50, 500);
    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.multiplier);
    this.modulator.connect(this.multiplier);
    this.multiplier.connect(this.wetGain);

    // LFO modulates carrier frequency
    this.lfo.connect(this.modulator.frequency);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    this.modulator.start();
    this.lfo.start();

    // Initialize parameters
    this.addParameter('frequency', {
      value: 100,
      min: 1,
      max: 5000,
      default: 100,
      unit: 'Hz',
      curve: 'exponential'
    });

    this.addParameter('lfoRate', {
      value: 0.5,
      min: 0,
      max: 20,
      default: 0.5,
      unit: 'Hz',
      step: 0.1
    });

    this.addParameter('lfoDepth', {
      value: 0,
      min: 0,
      max: 1,
      default: 0,
      step: 0.01
    });

    this.addParameter('waveform', {
      value: 0,
      min: 0,
      max: 3,
      default: 0,
      step: 1
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'frequency':
        this.modulator.frequency.value = value;
        break;
      case 'lfoRate':
        this.lfo.frequency.value = value;
        break;
      case 'lfoDepth':
        if (value === 0) {
          this.lfo.stop();
        } else {
          this.lfo.start();
          this.lfo.amplitude.value = value;
        }
        break;
      case 'waveform':
        const waveforms: Tone.ToneOscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle'];
        this.modulator.type = waveforms[Math.round(value)] || 'sine';
        break;
    }
  }

  public dispose(): void {
    this.modulator.dispose();
    this.multiplier.dispose();
    this.lfo.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
