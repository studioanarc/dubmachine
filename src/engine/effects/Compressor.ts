import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Compressor: Dynamics processor with sidechain
 * Professional dynamics control
 */
export class Compressor extends BaseEffect {
  private compressor: Tone.Compressor;
  private makeupGain: Tone.Gain;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Compressor',
      type: 'Compressor',
      category: 'dynamics',
      version: '1.0.0'
    });

    this.compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25,
      knee: 10
    });

    this.makeupGain = new Tone.Gain(1);
    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.compressor);
    this.compressor.connect(this.makeupGain);
    this.makeupGain.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    // Initialize parameters
    this.addParameter('threshold', {
      value: -24,
      min: -60,
      max: 0,
      default: -24,
      unit: 'dB',
      step: 1
    });

    this.addParameter('ratio', {
      value: 4,
      min: 1,
      max: 20,
      default: 4,
      step: 0.1
    });

    this.addParameter('attack', {
      value: 0.003,
      min: 0.0001,
      max: 1,
      default: 0.003,
      unit: 's',
      step: 0.0001
    });

    this.addParameter('release', {
      value: 0.25,
      min: 0.01,
      max: 2,
      default: 0.25,
      unit: 's',
      step: 0.01
    });

    this.addParameter('knee', {
      value: 10,
      min: 0,
      max: 40,
      default: 10,
      unit: 'dB',
      step: 1
    });

    this.addParameter('makeupGain', {
      value: 1,
      min: 0.1,
      max: 4,
      default: 1,
      step: 0.1
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'threshold':
        this.compressor.threshold.value = value;
        break;
      case 'ratio':
        this.compressor.ratio.value = value;
        break;
      case 'attack':
        this.compressor.attack.value = value;
        break;
      case 'release':
        this.compressor.release.value = value;
        break;
      case 'knee':
        this.compressor.knee.value = value;
        break;
      case 'makeupGain':
        this.makeupGain.gain.value = value;
        break;
    }
  }

  public dispose(): void {
    this.compressor.dispose();
    this.makeupGain.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
