import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Chorus: Multi-voice chorus with stereo widening
 * Lush, wide stereo chorus effect
 */
export class Chorus extends BaseEffect {
  private chorus: Tone.Chorus;
  private stereoWidener: Tone.StereoWidener;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Chorus',
      type: 'Chorus',
      category: 'modulation',
      version: '1.0.0'
    });

    this.chorus = new Tone.Chorus(1.5, 2.5, 0.5);
    this.stereoWidener = new Tone.StereoWidener(0.5);
    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.chorus);
    this.chorus.connect(this.stereoWidener);
    this.stereoWidener.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    this.chorus.start();

    // Initialize parameters
    this.addParameter('rate', {
      value: 1.5,
      min: 0.1,
      max: 10,
      default: 1.5,
      unit: 'Hz',
      step: 0.1
    });

    this.addParameter('depth', {
      value: 0.5,
      min: 0,
      max: 1,
      default: 0.5,
      step: 0.01
    });

    this.addParameter('delay', {
      value: 2.5,
      min: 1,
      max: 50,
      default: 2.5,
      unit: 'ms',
      step: 0.1
    });

    this.addParameter('spread', {
      value: 180,
      min: 0,
      max: 180,
      default: 180,
      unit: '°',
      step: 1
    });

    this.addParameter('width', {
      value: 0.5,
      min: 0,
      max: 1,
      default: 0.5,
      step: 0.01
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'rate':
        this.chorus.frequency.value = value;
        break;
      case 'depth':
        this.chorus.depth = value;
        break;
      case 'delay':
        this.chorus.delayTime = value;
        break;
      case 'spread':
        this.chorus.spread = value;
        break;
      case 'width':
        this.stereoWidener.width.value = value;
        break;
    }
  }

  public dispose(): void {
    this.chorus.dispose();
    this.stereoWidener.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
