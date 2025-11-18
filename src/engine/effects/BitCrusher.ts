import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * BitCrusher: Sample rate and bit depth reduction
 * Creates lo-fi digital artifacts
 */
export class BitCrusher extends BaseEffect {
  private bitCrusher: Tone.BitCrusher;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Bit Crusher',
      type: 'BitCrusher',
      category: 'distortion',
      version: '1.0.0'
    });

    this.bitCrusher = new Tone.BitCrusher(4);
    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.bitCrusher);
    this.bitCrusher.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a); // Dry
    this.wetGain.connect(this.wetDry.b); // Wet
    this.wetDry.connect(this.output);

    // Initialize parameters
    this.addParameter('bits', {
      value: 4,
      min: 1,
      max: 16,
      default: 4,
      step: 1
    });

    this.addParameter('sampleRate', {
      value: 8000,
      min: 1000,
      max: 48000,
      default: 8000,
      unit: 'Hz',
      step: 100
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'bits':
        this.bitCrusher.bits.value = Math.round(value);
        break;
    }
  }

  public dispose(): void {
    this.bitCrusher.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
