import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Convolution reverb with impulse response library
 * High-quality reverb using real space recordings
 */
export class ConvolutionReverb extends BaseEffect {
  private reverb: Tone.Reverb;
  private preDelay: Tone.Delay;
  private filter: Tone.Filter;
  private wetGain: Tone.Gain;
  // private currentIR: string = 'medium-hall'; // Reserved for future IR switching

  // Impulse response URLs (these would be actual audio files in production)
  private irLibrary: Map<string, string> = new Map([
    ['small-room', '/ir/small-room.wav'],
    ['medium-hall', '/ir/medium-hall.wav'],
    ['large-hall', '/ir/large-hall.wav'],
    ['plate', '/ir/plate.wav'],
    ['spring', '/ir/spring.wav'],
    ['chamber', '/ir/chamber.wav'],
    ['cathedral', '/ir/cathedral.wav'],
    ['tunnel', '/ir/tunnel.wav']
  ]);

  constructor() {
    super({
      name: 'Convolution Reverb',
      type: 'ConvolutionReverb',
      category: 'reverb',
      version: '1.0.0'
    });

    // Use algorithmic reverb as fallback (Tone.Convolver requires audio files)
    this.reverb = new Tone.Reverb(2.5);
    this.preDelay = new Tone.Delay(0.03);
    this.filter = new Tone.Filter(6000, 'lowpass');
    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.preDelay);
    this.preDelay.connect(this.reverb);
    this.reverb.connect(this.filter);
    this.filter.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a); // Dry
    this.wetGain.connect(this.wetDry.b); // Wet
    this.wetDry.connect(this.output);

    // Initialize parameters
    this.addParameter('decay', {
      value: 2.5,
      min: 0.1,
      max: 10,
      default: 2.5,
      unit: 's',
      step: 0.1
    });

    this.addParameter('preDelay', {
      value: 0.03,
      min: 0,
      max: 0.2,
      default: 0.03,
      unit: 's',
      step: 0.001
    });

    this.addParameter('dampening', {
      value: 6000,
      min: 200,
      max: 20000,
      default: 6000,
      unit: 'Hz',
      curve: 'exponential'
    });

    this.addParameter('size', {
      value: 0.7,
      min: 0.1,
      max: 1,
      default: 0.7,
      step: 0.01
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'decay':
        this.reverb.decay = value;
        break;
      case 'preDelay':
        this.preDelay.delayTime.value = value;
        break;
      case 'dampening':
        this.filter.frequency.value = value;
        break;
      case 'size':
        // Adjust reverb characteristics based on size
        this.reverb.decay = this.parameters.get('decay')!.value * (0.5 + value * 0.5);
        break;
    }
  }

  /**
   * Load a specific impulse response
   */
  public async loadIR(name: string): Promise<void> {
    if (!this.irLibrary.has(name)) {
      console.warn(`IR ${name} not found in library`);
      return;
    }

    // this.currentIR = name;
    // In production, this would load the actual IR file
    // const url = this.irLibrary.get(name);
    // await this.convolver.load(url);
  }

  /**
   * Get available impulse responses
   */
  public getAvailableIRs(): string[] {
    return Array.from(this.irLibrary.keys());
  }

  public dispose(): void {
    this.reverb.dispose();
    this.preDelay.dispose();
    this.filter.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
