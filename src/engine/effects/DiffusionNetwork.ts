import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Diffusion Network: Dense delay network
 * Creates a complex, diffuse ambience through multiple interacting delays
 */
export class DiffusionNetwork extends BaseEffect {
  private delays: Tone.Delay[];
  private gains: Tone.Gain[];
  private filters: Tone.Filter[];
  private feedbackMatrix: Tone.Gain[][];
  private wetGain: Tone.Gain;
  private networkSize: number = 8;

  constructor() {
    super({
      name: 'Diffusion Network',
      type: 'DiffusionNetwork',
      category: 'novel',
      version: '1.0.0'
    });

    this.delays = [];
    this.gains = [];
    this.filters = [];
    this.feedbackMatrix = [];

    // Create delay network
    for (let i = 0; i < this.networkSize; i++) {
      // Create delays with prime number ratios for complex pattern
      const primes = [2, 3, 5, 7, 11, 13, 17, 19];
      const delayTime = (primes[i] / 100) * 0.1; // 20-190ms

      const delay = new Tone.Delay(delayTime);
      const gain = new Tone.Gain(0.7);
      const filter = new Tone.Filter(8000, 'lowpass');

      this.delays.push(delay);
      this.gains.push(gain);
      this.filters.push(filter);

      // Connect in series
      delay.connect(filter);
      filter.connect(gain);
    }

    // Create feedback matrix
    for (let i = 0; i < this.networkSize; i++) {
      this.feedbackMatrix[i] = [];
      for (let j = 0; j < this.networkSize; j++) {
        if (i !== j) {
          const feedbackGain = new Tone.Gain(0.2 / this.networkSize);
          this.gains[i].connect(feedbackGain);
          feedbackGain.connect(this.delays[j]);
          this.feedbackMatrix[i][j] = feedbackGain;
        }
      }
    }

    this.wetGain = new Tone.Gain(1);

    // Connect input to all delays
    this.delays.forEach(delay => {
      this.input.connect(delay);
    });

    // Sum all gains to output
    this.gains.forEach(gain => {
      gain.connect(this.wetGain);
    });

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    // Initialize parameters
    this.addParameter('size', {
      value: 0.5,
      min: 0.1,
      max: 2,
      default: 0.5,
      step: 0.01
    });

    this.addParameter('decay', {
      value: 0.7,
      min: 0.1,
      max: 0.95,
      default: 0.7,
      step: 0.01
    });

    this.addParameter('damping', {
      value: 8000,
      min: 1000,
      max: 20000,
      default: 8000,
      unit: 'Hz',
      curve: 'exponential'
    });

    this.addParameter('diffusion', {
      value: 0.7,
      min: 0,
      max: 1,
      default: 0.7,
      step: 0.01
    });

    this.addParameter('modulation', {
      value: 0,
      min: 0,
      max: 1,
      default: 0,
      step: 0.01
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'size':
        // Scale all delay times
        const primes = [2, 3, 5, 7, 11, 13, 17, 19];
        this.delays.forEach((delay, i) => {
          delay.delayTime.value = (primes[i] / 100) * 0.1 * value;
        });
        break;

      case 'decay':
        // Adjust feedback matrix gains
        this.feedbackMatrix.forEach(row => {
          row.forEach(gain => {
            if (gain) {
              gain.gain.value = value * 0.2 / this.networkSize;
            }
          });
        });
        break;

      case 'damping':
        // Adjust all filter frequencies
        this.filters.forEach(filter => {
          filter.frequency.value = value;
        });
        break;

      case 'diffusion':
        // Adjust balance between direct and cross-feedback
        this.feedbackMatrix.forEach((row, i) => {
          row.forEach((gain, j) => {
            if (gain) {
              const decay = this.parameters.get('decay')?.value || 0.7;
              const baseFeedback = decay * 0.2 / this.networkSize;

              // More diffusion = more even distribution
              const diff = Math.abs(i - j);
              const scaling = 1 - (1 - value) * (diff / this.networkSize);
              gain.gain.value = baseFeedback * scaling;
            }
          });
        });
        break;

      case 'modulation':
        // This would add LFO modulation to delay times
        // Simplified for now
        break;
    }
  }

  public dispose(): void {
    this.delays.forEach(d => d.dispose());
    this.gains.forEach(g => g.dispose());
    this.filters.forEach(f => f.dispose());
    this.feedbackMatrix.forEach(row => {
      row.forEach(gain => gain?.dispose());
    });
    this.wetGain.dispose();
    super.dispose();
  }
}
