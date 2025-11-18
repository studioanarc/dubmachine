import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Parametric EQ: 4-band parametric equalizer
 * Professional EQ with frequency, gain, and Q control per band
 */
export class ParametricEQ extends BaseEffect {
  private eq3: Tone.EQ3;
  private bands: Tone.Filter[];
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Parametric EQ',
      type: 'ParametricEQ',
      category: 'filter',
      version: '1.0.0'
    });

    // Basic 3-band EQ
    this.eq3 = new Tone.EQ3({
      low: 0,
      mid: 0,
      high: 0,
      lowFrequency: 250,
      highFrequency: 2500
    });

    // Additional parametric bands
    this.bands = [
      new Tone.Filter(250, 'peaking'),
      new Tone.Filter(1000, 'peaking'),
      new Tone.Filter(4000, 'peaking'),
      new Tone.Filter(8000, 'peaking')
    ];

    this.bands.forEach(band => {
      band.Q.value = 1;
      band.gain.value = 0;
    });

    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.chain(this.eq3, ...this.bands, this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    // Initialize parameters for each band
    for (let i = 1; i <= 4; i++) {
      this.addParameter(`band${i}Freq`, {
        value: [250, 1000, 4000, 8000][i - 1],
        min: 20,
        max: 20000,
        default: [250, 1000, 4000, 8000][i - 1],
        unit: 'Hz',
        curve: 'exponential'
      });

      this.addParameter(`band${i}Gain`, {
        value: 0,
        min: -24,
        max: 24,
        default: 0,
        unit: 'dB',
        step: 0.1
      });

      this.addParameter(`band${i}Q`, {
        value: 1,
        min: 0.1,
        max: 20,
        default: 1,
        step: 0.1
      });
    }

    // Global controls
    this.addParameter('lowShelf', {
      value: 0,
      min: -24,
      max: 24,
      default: 0,
      unit: 'dB',
      step: 0.1
    });

    this.addParameter('highShelf', {
      value: 0,
      min: -24,
      max: 24,
      default: 0,
      unit: 'dB',
      step: 0.1
    });
  }

  protected onParameterChange(name: string, value: number): void {
    // Handle band-specific parameters
    const bandMatch = name.match(/band(\d+)(Freq|Gain|Q)/);
    if (bandMatch) {
      const bandIndex = parseInt(bandMatch[1]) - 1;
      const param = bandMatch[2];

      if (param === 'Freq') {
        this.bands[bandIndex].frequency.value = value;
      } else if (param === 'Gain') {
        this.bands[bandIndex].gain.value = value;
      } else if (param === 'Q') {
        this.bands[bandIndex].Q.value = value;
      }
      return;
    }

    // Handle global controls
    switch (name) {
      case 'lowShelf':
        this.eq3.low.value = value;
        break;
      case 'highShelf':
        this.eq3.high.value = value;
        break;
    }
  }

  public dispose(): void {
    this.eq3.dispose();
    this.bands.forEach(band => band.dispose());
    this.wetGain.dispose();
    super.dispose();
  }
}
