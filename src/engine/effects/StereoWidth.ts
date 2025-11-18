import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Stereo Width: M/S processing for stereo image control
 * Expand or narrow the stereo field
 */
export class StereoWidth extends BaseEffect {
  private widener: Tone.StereoWidener;
  private panner: Tone.Panner;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Stereo Width',
      type: 'StereoWidth',
      category: 'spatial',
      version: '1.0.0'
    });

    this.widener = new Tone.StereoWidener(0.5);
    this.panner = new Tone.Panner(0);
    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.widener);
    this.widener.connect(this.panner);
    this.panner.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    // Initialize parameters
    this.addParameter('width', {
      value: 0.5,
      min: 0,
      max: 1,
      default: 0.5,
      step: 0.01
    });

    this.addParameter('pan', {
      value: 0,
      min: -1,
      max: 1,
      default: 0,
      step: 0.01
    });

    this.addParameter('monoLows', {
      value: 0,
      min: 0,
      max: 1,
      default: 0,
      step: 0.01
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'width':
        this.widener.width.value = value;
        break;
      case 'pan':
        this.panner.pan.value = value;
        break;
      case 'monoLows':
        // This would require additional filtering to mono low frequencies
        // Simplified implementation
        break;
    }
  }

  public dispose(): void {
    this.widener.dispose();
    this.panner.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
