import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Vinyl Simulator: Vinyl crackle and wobble
 * Simulates the sound of vinyl records with noise and pitch variation
 */
export class VinylSimulator extends BaseEffect {
  private noise: Tone.Noise;
  private noiseFilter: Tone.Filter;
  private noiseGain: Tone.Gain;
  private pitchLFO: Tone.LFO;
  private pitchShift: Tone.PitchShift;
  private filter: Tone.Filter;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Vinyl Simulator',
      type: 'VinylSimulator',
      category: 'distortion',
      version: '1.0.0'
    });

    // Crackle noise
    this.noise = new Tone.Noise('pink');
    this.noiseFilter = new Tone.Filter(8000, 'highpass');
    this.noiseGain = new Tone.Gain(0.02);

    // Wobble (pitch variation)
    this.pitchLFO = new Tone.LFO(0.3, -10, 10);
    this.pitchShift = new Tone.PitchShift(0);

    // Tone filtering
    this.filter = new Tone.Filter(8000, 'lowpass');

    this.wetGain = new Tone.Gain(1);

    // Noise chain
    this.noise.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);

    // Signal chain
    this.input.connect(this.pitchShift);
    this.pitchShift.connect(this.filter);
    this.filter.connect(this.wetGain);

    // Add noise to signal
    this.noiseGain.connect(this.wetGain);

    // Wobble modulation
    // @ts-expect-error - Tone.js type compatibility
    this.pitchLFO.connect(this.pitchShift.pitch);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    this.noise.start();
    this.pitchLFO.start();

    // Initialize parameters
    this.addParameter('crackle', {
      value: 0.02,
      min: 0,
      max: 0.2,
      default: 0.02,
      step: 0.001
    });

    this.addParameter('wobbleRate', {
      value: 0.3,
      min: 0.01,
      max: 5,
      default: 0.3,
      unit: 'Hz',
      step: 0.01
    });

    this.addParameter('wobbleDepth', {
      value: 10,
      min: 0,
      max: 50,
      default: 10,
      unit: 'cents',
      step: 1
    });

    this.addParameter('age', {
      value: 0.5,
      min: 0,
      max: 1,
      default: 0.5,
      step: 0.01
    });

    this.addParameter('tone', {
      value: 8000,
      min: 2000,
      max: 20000,
      default: 8000,
      unit: 'Hz',
      curve: 'exponential'
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'crackle':
        this.noiseGain.gain.value = value;
        break;
      case 'wobbleRate':
        this.pitchLFO.frequency.value = value;
        break;
      case 'wobbleDepth':
        this.pitchLFO.min = -value;
        this.pitchLFO.max = value;
        break;
      case 'age':
        // Age affects both filter and noise
        this.filter.frequency.value = 20000 - (value * 12000);
        this.noiseGain.gain.value = this.parameters.get('crackle')!.value * (1 + value);
        break;
      case 'tone':
        this.filter.frequency.value = value;
        break;
    }
  }

  public dispose(): void {
    this.noise.dispose();
    this.noiseFilter.dispose();
    this.noiseGain.dispose();
    this.pitchLFO.dispose();
    this.pitchShift.dispose();
    this.filter.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
