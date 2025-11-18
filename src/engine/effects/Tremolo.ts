import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Tremolo: Amplitude modulation effect
 * Rhythmic volume modulation
 */
export class Tremolo extends BaseEffect {
  private tremolo: Tone.Tremolo;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Tremolo',
      type: 'Tremolo',
      category: 'modulation',
      version: '1.0.0'
    });

    this.tremolo = new Tone.Tremolo(4, 0.5);
    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.tremolo);
    this.tremolo.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    this.tremolo.start();

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
      value: 0.5,
      min: 0,
      max: 1,
      default: 0.5,
      step: 0.01
    });

    this.addParameter('spread', {
      value: 0,
      min: 0,
      max: 180,
      default: 0,
      unit: '°',
      step: 1
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
        this.tremolo.frequency.value = value;
        break;
      case 'depth':
        this.tremolo.depth.value = value;
        break;
      case 'spread':
        this.tremolo.spread = value;
        break;
      case 'waveform':
        const waveforms: Tone.ToneOscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle'];
        this.tremolo.type = waveforms[Math.round(value)] || 'sine';
        break;
    }
  }

  /**
   * Sync tremolo to transport tempo
   */
  public syncToTempo(subdivision: Tone.Unit.Time = '8n'): void {
    this.tremolo.frequency.value = subdivision as any;
  }

  public dispose(): void {
    this.tremolo.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
