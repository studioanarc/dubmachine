import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Probability Delay: Delay taps with probability triggering
 * Each delay tap has a probability of occurring, creating evolving patterns
 */
export class ProbabilityDelay extends BaseEffect {
  private delays: Tone.Delay[];
  private feedback: Tone.Gain;
  private tapGains: Tone.Gain[];
  private probabilities: number[] = [1, 0.7, 0.5, 0.3];
  private wetGain: Tone.Gain;
  private scheduler?: number;

  constructor() {
    super({
      name: 'Probability Delay',
      type: 'ProbabilityDelay',
      category: 'novel',
      version: '1.0.0'
    });

    // Create 4 delay taps
    this.delays = [
      new Tone.Delay(0.25),
      new Tone.Delay(0.5),
      new Tone.Delay(0.75),
      new Tone.Delay(1.0)
    ];

    this.tapGains = this.delays.map(() => new Tone.Gain(1));
    this.feedback = new Tone.Gain(0.5);
    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.delays.forEach((delay, i) => {
      this.input.connect(delay);
      delay.connect(this.tapGains[i]);
      this.tapGains[i].connect(this.wetGain);

      if (i === this.delays.length - 1) {
        delay.connect(this.feedback);
        this.feedback.connect(this.input);
      }
    });

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    // Start probability scheduler
    this.startScheduler();

    // Initialize parameters
    this.addParameter('time', {
      value: 0.25,
      min: 0.01,
      max: 2,
      default: 0.25,
      unit: 's',
      step: 0.01
    });

    this.addParameter('feedback', {
      value: 0.5,
      min: 0,
      max: 0.95,
      default: 0.5,
      step: 0.01
    });

    this.addParameter('tap1Prob', {
      value: 1,
      min: 0,
      max: 1,
      default: 1,
      step: 0.01
    });

    this.addParameter('tap2Prob', {
      value: 0.7,
      min: 0,
      max: 1,
      default: 0.7,
      step: 0.01
    });

    this.addParameter('tap3Prob', {
      value: 0.5,
      min: 0,
      max: 1,
      default: 0.5,
      step: 0.01
    });

    this.addParameter('tap4Prob', {
      value: 0.3,
      min: 0,
      max: 1,
      default: 0.3,
      step: 0.01
    });

    this.addParameter('chaos', {
      value: 0,
      min: 0,
      max: 1,
      default: 0,
      step: 0.01
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'time':
        this.delays.forEach((delay, i) => {
          delay.delayTime.value = value * (i + 1);
        });
        break;
      case 'feedback':
        this.feedback.gain.value = value;
        break;
      case 'tap1Prob':
        this.probabilities[0] = value;
        break;
      case 'tap2Prob':
        this.probabilities[1] = value;
        break;
      case 'tap3Prob':
        this.probabilities[2] = value;
        break;
      case 'tap4Prob':
        this.probabilities[3] = value;
        break;
    }
  }

  /**
   * Start scheduler that randomly enables/disables taps based on probability
   */
  private startScheduler(): void {
    const updateInterval = 100; // Update every 100ms

    this.scheduler = window.setInterval(() => {
      const chaos = this.parameters.get('chaos')?.value || 0;

      this.tapGains.forEach((gain, i) => {
        const prob = this.probabilities[i];
        const random = Math.random();

        // Add chaos factor
        const adjustedProb = chaos > 0
          ? prob + (Math.random() - 0.5) * chaos
          : prob;

        // Enable or disable tap based on probability
        if (random < adjustedProb) {
          gain.gain.rampTo(1, 0.05);
        } else {
          gain.gain.rampTo(0, 0.05);
        }
      });
    }, updateInterval);
  }

  public dispose(): void {
    if (this.scheduler) {
      clearInterval(this.scheduler);
    }
    this.delays.forEach(d => d.dispose());
    this.tapGains.forEach(g => g.dispose());
    this.feedback.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
