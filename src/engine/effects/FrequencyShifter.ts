import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Frequency Shifter: Frequency shifting (not pitch shifting)
 * Shifts all frequencies by a fixed amount, creating inharmonic results
 */
export class FrequencyShifter extends BaseEffect {
  private frequencyShifter: Tone.FrequencyShifter;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Frequency Shifter',
      type: 'FrequencyShifter',
      category: 'modulation',
      version: '1.0.0'
    });

    this.frequencyShifter = new Tone.FrequencyShifter(0);
    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.frequencyShifter);
    this.frequencyShifter.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    // Initialize parameters
    this.addParameter('frequency', {
      value: 0,
      min: -1000,
      max: 1000,
      default: 0,
      unit: 'Hz',
      step: 1
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'frequency':
        this.frequencyShifter.frequency.value = value;
        break;
    }
  }

  public dispose(): void {
    this.frequencyShifter.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
