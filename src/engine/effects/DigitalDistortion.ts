import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Digital Distortion with multiple algorithms
 * Waveshaping, clipping, and folding
 */
export class DigitalDistortion extends BaseEffect {
  private distortion: Tone.Distortion;
  private chebyshev: Tone.Chebyshev;
  private waveshaper: Tone.WaveShaper;
  private preGain: Tone.Gain;
  private postGain: Tone.Gain;
  private filter: Tone.Filter;
  private wetGain: Tone.Gain;
  private currentAlgorithm: 'distortion' | 'chebyshev' | 'wavefold' = 'distortion';

  constructor() {
    super({
      name: 'Digital Distortion',
      type: 'DigitalDistortion',
      category: 'distortion',
      version: '1.0.0'
    });

    this.distortion = new Tone.Distortion(0.5);
    this.chebyshev = new Tone.Chebyshev(50);

    // Wavefolder curve
    this.waveshaper = new Tone.WaveShaper((val) => {
      const folded = Math.abs((val + 1) % 4 - 2) - 1;
      return folded;
    }, 4096);

    this.preGain = new Tone.Gain(1);
    this.postGain = new Tone.Gain(0.5);
    this.filter = new Tone.Filter(8000, 'lowpass');
    this.wetGain = new Tone.Gain(1);

    // Signal chain - start with distortion
    this.input.connect(this.preGain);
    this.preGain.connect(this.distortion);
    this.distortion.connect(this.postGain);
    this.postGain.connect(this.filter);
    this.filter.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    // Initialize parameters
    this.addParameter('drive', {
      value: 0.5,
      min: 0,
      max: 1,
      default: 0.5,
      step: 0.01
    });

    this.addParameter('preGain', {
      value: 1,
      min: 0.1,
      max: 4,
      default: 1,
      step: 0.1
    });

    this.addParameter('postGain', {
      value: 0.5,
      min: 0.1,
      max: 2,
      default: 0.5,
      step: 0.01
    });

    this.addParameter('tone', {
      value: 8000,
      min: 200,
      max: 20000,
      default: 8000,
      unit: 'Hz',
      curve: 'exponential'
    });

    this.addParameter('order', {
      value: 50,
      min: 1,
      max: 100,
      default: 50,
      step: 1
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'drive':
        if (this.currentAlgorithm === 'distortion') {
          this.distortion.distortion = value;
        } else if (this.currentAlgorithm === 'chebyshev') {
          this.chebyshev.order = Math.round(value * 100);
        }
        break;
      case 'preGain':
        this.preGain.gain.value = value;
        break;
      case 'postGain':
        this.postGain.gain.value = value;
        break;
      case 'tone':
        this.filter.frequency.value = value;
        break;
      case 'order':
        this.chebyshev.order = Math.round(value);
        break;
    }
  }

  /**
   * Switch between distortion algorithms
   */
  public setAlgorithm(algorithm: 'distortion' | 'chebyshev' | 'wavefold'): void {
    // Disconnect current
    this.preGain.disconnect();

    this.currentAlgorithm = algorithm;

    // Reconnect with new algorithm
    switch (algorithm) {
      case 'distortion':
        this.preGain.connect(this.distortion);
        this.distortion.connect(this.postGain);
        break;
      case 'chebyshev':
        this.preGain.connect(this.chebyshev);
        this.chebyshev.connect(this.postGain);
        break;
      case 'wavefold':
        this.preGain.connect(this.waveshaper);
        this.waveshaper.connect(this.postGain);
        break;
    }
  }

  public dispose(): void {
    this.distortion.dispose();
    this.chebyshev.dispose();
    this.waveshaper.dispose();
    this.preGain.dispose();
    this.postGain.dispose();
    this.filter.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
