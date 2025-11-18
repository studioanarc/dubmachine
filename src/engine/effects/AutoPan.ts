import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Auto Pan: Tempo-synced automatic panning
 * Rhythmic stereo movement
 */
export class AutoPan extends BaseEffect {
  private autoPan: Tone.AutoPanner;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Auto Pan',
      type: 'AutoPan',
      category: 'spatial',
      version: '1.0.0'
    });

    this.autoPan = new Tone.AutoPanner(4);
    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.autoPan);
    this.autoPan.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    this.autoPan.start();

    // Initialize parameters
    this.addParameter('rate', {
      value: 4,
      min: 0.1,
      max: 20,
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

    this.addParameter('waveform', {
      value: 0,
      min: 0,
      max: 3,
      default: 0,
      step: 1
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'rate':
        this.autoPan.frequency.value = value;
        break;
      case 'depth':
        this.autoPan.depth.value = value;
        break;
      case 'waveform':
        const waveforms: Tone.ToneOscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle'];
        this.autoPan.type = waveforms[Math.round(value)] || 'sine';
        break;
    }
  }

  /**
   * Sync pan rate to transport tempo
   */
  public syncToTempo(subdivision: Tone.Unit.Time = '8n'): void {
    this.autoPan.frequency.value = subdivision as any;
  }

  public dispose(): void {
    this.autoPan.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
