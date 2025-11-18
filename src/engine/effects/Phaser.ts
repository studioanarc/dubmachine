import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Phaser: 4-12 stage all-pass filters
 * Classic phasing effect with LFO modulation
 */
export class Phaser extends BaseEffect {
  private phaser: Tone.Phaser;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Phaser',
      type: 'Phaser',
      category: 'modulation',
      version: '1.0.0'
    });

    this.phaser = new Tone.Phaser({
      frequency: 0.5,
      octaves: 3,
      stages: 8,
      Q: 10,
      baseFrequency: 350
    });

    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.phaser);
    this.phaser.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    // Initialize parameters
    this.addParameter('rate', {
      value: 0.5,
      min: 0.01,
      max: 10,
      default: 0.5,
      unit: 'Hz',
      step: 0.01
    });

    this.addParameter('depth', {
      value: 3,
      min: 0,
      max: 8,
      default: 3,
      step: 0.1
    });

    this.addParameter('stages', {
      value: 8,
      min: 2,
      max: 12,
      default: 8,
      step: 1
    });

    this.addParameter('Q', {
      value: 10,
      min: 0.1,
      max: 50,
      default: 10,
      step: 0.5
    });

    this.addParameter('baseFrequency', {
      value: 350,
      min: 100,
      max: 5000,
      default: 350,
      unit: 'Hz',
      curve: 'exponential'
    });

    this.addParameter('feedback', {
      value: 0,
      min: 0,
      max: 0.95,
      default: 0,
      step: 0.01
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'rate':
        this.phaser.frequency.value = value;
        break;
      case 'depth':
        this.phaser.octaves = value;
        break;
      case 'stages':
        // Note: stages property not available in current Tone.js version
        // this.phaser.stages = Math.round(value);
        break;
      case 'Q':
        this.phaser.Q.value = value;
        break;
      case 'baseFrequency':
        this.phaser.baseFrequency = value;
        break;
    }
  }

  public dispose(): void {
    this.phaser.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
