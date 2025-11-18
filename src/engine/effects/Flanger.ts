import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Flanger: Short delay with through-zero flanging
 * Classic jet-plane swoosh effect
 */
export class Flanger extends BaseEffect {
  private delay: Tone.Delay;
  private lfo: Tone.LFO;
  private feedback: Tone.Gain;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Flanger',
      type: 'Flanger',
      category: 'modulation',
      version: '1.0.0'
    });

    // Very short delay for flanging
    this.delay = new Tone.Delay(0.005);
    this.lfo = new Tone.LFO(0.5, 0.001, 0.010);
    this.feedback = new Tone.Gain(0.5);
    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.delay);
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delay.connect(this.wetGain);

    // LFO modulates delay time
    this.lfo.connect(this.delay.delayTime);
    this.lfo.start();

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
      value: 0.005,
      min: 0.001,
      max: 0.020,
      default: 0.005,
      unit: 's',
      step: 0.0001
    });

    this.addParameter('feedback', {
      value: 0.5,
      min: 0,
      max: 0.95,
      default: 0.5,
      step: 0.01
    });

    this.addParameter('delay', {
      value: 0.005,
      min: 0.001,
      max: 0.020,
      default: 0.005,
      unit: 's',
      step: 0.0001
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'rate':
        this.lfo.frequency.value = value;
        break;
      case 'depth':
        this.lfo.max = value;
        this.lfo.min = value * 0.2;
        break;
      case 'feedback':
        this.feedback.gain.value = value;
        break;
      case 'delay':
        this.delay.delayTime.value = value;
        break;
    }
  }

  public dispose(): void {
    this.delay.dispose();
    this.lfo.dispose();
    this.feedback.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
