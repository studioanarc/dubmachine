import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Multi-tap tape delay with saturation, wow & flutter, feedback
 * Classic dub techno tape echo simulation
 */
export class TapeEcho extends BaseEffect {
  private delays: Tone.FeedbackDelay[];
  private distortion: Tone.Distortion;
  private filter: Tone.Filter;
  private lfo: Tone.LFO;
  private feedbackGain: Tone.Gain;
  private wetGain: Tone.Gain;
  private tapMixer: Tone.Gain;

  constructor() {
    super({
      name: 'Tape Echo',
      type: 'TapeEcho',
      category: 'delay',
      version: '1.0.0'
    });

    // Create multi-tap delays
    this.delays = [
      new Tone.FeedbackDelay('8n', 0.3),
      new Tone.FeedbackDelay('8n.', 0.25),
      new Tone.FeedbackDelay('4n', 0.2)
    ];

    // Tape saturation
    this.distortion = new Tone.Distortion(0.4);

    // Low-pass filter for tape darkness
    this.filter = new Tone.Filter(3000, 'lowpass');

    // Wow & flutter (pitch modulation)
    this.lfo = new Tone.LFO(0.5, -5, 5);

    // Feedback control
    this.feedbackGain = new Tone.Gain(0.5);

    // Wet signal mixer
    this.wetGain = new Tone.Gain(1);
    this.tapMixer = new Tone.Gain(1);

    // Signal chain: input -> delays -> distortion -> filter -> wetGain
    this.delays.forEach((delay, _i) => {
      this.input.connect(delay);
      delay.connect(this.tapMixer);
      delay.connect(this.feedbackGain);
    });

    this.feedbackGain.connect(this.input);
    this.tapMixer.connect(this.distortion);
    this.distortion.connect(this.filter);
    this.filter.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a); // Dry
    this.wetGain.connect(this.wetDry.b); // Wet
    this.wetDry.connect(this.output);

    // Connect LFO to delay times for flutter
    this.lfo.start();

    // Initialize parameters
    this.addParameter('time', {
      value: 0.375,
      min: 0.01,
      max: 2,
      default: 0.375,
      unit: 's',
      step: 0.001
    });

    this.addParameter('feedback', {
      value: 0.5,
      min: 0,
      max: 0.95,
      default: 0.5,
      step: 0.01
    });

    this.addParameter('saturation', {
      value: 0.4,
      min: 0,
      max: 1,
      default: 0.4,
      step: 0.01
    });

    this.addParameter('tone', {
      value: 3000,
      min: 200,
      max: 8000,
      default: 3000,
      unit: 'Hz',
      curve: 'exponential'
    });

    this.addParameter('flutter', {
      value: 0.5,
      min: 0,
      max: 10,
      default: 0.5,
      unit: 'Hz',
      step: 0.1
    });

    this.addParameter('flutterDepth', {
      value: 5,
      min: 0,
      max: 50,
      default: 5,
      unit: 'cents',
      step: 1
    });

    this.addParameter('tap1', {
      value: 1,
      min: 0,
      max: 1,
      default: 1,
      step: 0.01
    });

    this.addParameter('tap2', {
      value: 0.7,
      min: 0,
      max: 1,
      default: 0.7,
      step: 0.01
    });

    this.addParameter('tap3', {
      value: 0.5,
      min: 0,
      max: 1,
      default: 0.5,
      step: 0.01
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'time':
        this.delays[0].delayTime.value = value;
        this.delays[1].delayTime.value = value * 1.5;
        this.delays[2].delayTime.value = value * 2;
        break;
      case 'feedback':
        this.delays.forEach(delay => {
          delay.feedback.value = value;
        });
        this.feedbackGain.gain.value = value * 0.3;
        break;
      case 'saturation':
        this.distortion.distortion = value;
        break;
      case 'tone':
        this.filter.frequency.value = value;
        break;
      case 'flutter':
        this.lfo.frequency.value = value;
        break;
      case 'flutterDepth':
        this.lfo.min = -value;
        this.lfo.max = value;
        break;
    }
  }

  public dispose(): void {
    this.delays.forEach(delay => delay.dispose());
    this.distortion.dispose();
    this.filter.dispose();
    this.lfo.dispose();
    this.feedbackGain.dispose();
    this.wetGain.dispose();
    this.tapMixer.dispose();
    super.dispose();
  }
}
