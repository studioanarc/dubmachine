import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Spring Reverb: Physical spring modeling
 * Simulates vintage spring reverb units
 */
export class SpringReverb extends BaseEffect {
  private reverb: Tone.Reverb;
  private delays: Tone.Delay[];
  private filter: Tone.Filter;
  private resonance: Tone.Filter;
  private chorus: Tone.Chorus;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Spring Reverb',
      type: 'SpringReverb',
      category: 'reverb',
      version: '1.0.0'
    });

    // Short reverb for metallic character
    this.reverb = new Tone.Reverb(0.8);

    // Multi-tap delays to simulate spring reflections
    this.delays = [
      new Tone.Delay(0.013),
      new Tone.Delay(0.037),
      new Tone.Delay(0.059)
    ];

    // High-pass for spring character
    this.filter = new Tone.Filter(400, 'highpass');

    // Resonant peak for metallic sound
    this.resonance = new Tone.Filter(1200, 'bandpass', -12);
    this.resonance.Q.value = 8;

    // Subtle chorus for movement
    this.chorus = new Tone.Chorus(1.5, 2.5, 0.3);

    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.filter);
    this.delays.forEach(delay => {
      this.filter.connect(delay);
      delay.connect(this.reverb);
    });
    this.reverb.connect(this.resonance);
    this.resonance.connect(this.chorus);
    this.chorus.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    this.chorus.start();

    // Initialize parameters
    this.addParameter('decay', {
      value: 0.8,
      min: 0.1,
      max: 3,
      default: 0.8,
      unit: 's',
      step: 0.1
    });

    this.addParameter('tension', {
      value: 1200,
      min: 400,
      max: 3000,
      default: 1200,
      unit: 'Hz',
      curve: 'exponential'
    });

    this.addParameter('damping', {
      value: 400,
      min: 200,
      max: 2000,
      default: 400,
      unit: 'Hz',
      curve: 'exponential'
    });

    this.addParameter('resonance', {
      value: 8,
      min: 1,
      max: 20,
      default: 8,
      step: 0.5
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'decay':
        this.reverb.decay = value;
        break;
      case 'tension':
        this.resonance.frequency.value = value;
        break;
      case 'damping':
        this.filter.frequency.value = value;
        break;
      case 'resonance':
        this.resonance.Q.value = value;
        break;
    }
  }

  public dispose(): void {
    this.reverb.dispose();
    this.delays.forEach(d => d.dispose());
    this.filter.dispose();
    this.resonance.dispose();
    this.chorus.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
