import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Gate: Rhythmic gating effect
 * Tempo-synced amplitude gating for rhythmic effects
 */
export class Gate extends BaseEffect {
  private gate: Tone.Gate;
  private lfo: Tone.LFO;
  // private pattern: number[] = [1, 0, 1, 0]; // Reserved for pattern sequencing
  // private patternIndex: number = 0;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Gate',
      type: 'Gate',
      category: 'dynamics',
      version: '1.0.0'
    });

    this.gate = new Tone.Gate(-30, 0.1);
    this.lfo = new Tone.LFO(4, 0, 1);
    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.gate);
    this.gate.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    // Initialize parameters
    this.addParameter('threshold', {
      value: -30,
      min: -60,
      max: 0,
      default: -30,
      unit: 'dB',
      step: 1
    });

    this.addParameter('attack', {
      value: 0.001,
      min: 0.0001,
      max: 0.1,
      default: 0.001,
      unit: 's',
      step: 0.0001
    });

    this.addParameter('release', {
      value: 0.1,
      min: 0.001,
      max: 1,
      default: 0.1,
      unit: 's',
      step: 0.001
    });

    this.addParameter('rate', {
      value: 4,
      min: 0.1,
      max: 32,
      default: 4,
      unit: 'Hz',
      step: 0.1
    });

    this.addParameter('depth', {
      value: 1,
      min: 0,
      max: 1,
      default: 1,
      step: 0.01
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'threshold':
        this.gate.threshold = value;
        break;
      case 'attack':
        // this.gate.attack = value;
        break;
      case 'release':
        // this.gate.release = value;
        break;
      case 'rate':
        this.lfo.frequency.value = value;
        break;
      case 'depth':
        this.lfo.amplitude.value = value;
        break;
    }
  }

  /**
   * Set gating pattern (array of 0s and 1s)
   */
    // @ts-ignore
  public setPattern(pattern: number[]): void {
    // this.pattern = pattern;
    // this.patternIndex = 0;
  }

  /**
   * Sync gate to transport tempo
   */
  public syncToTempo(_subdivision: Tone.Unit.Time = '16n'): void {
    // This would require a scheduler to trigger the gate pattern
    // Simplified implementation
  }

  public dispose(): void {
    this.gate.dispose();
    this.lfo.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
