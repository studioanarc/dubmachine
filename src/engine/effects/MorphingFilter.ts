import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Morphing Filter: Interpolates between filter types
 * Smoothly morphs between lowpass, bandpass, and highpass
 */
export class MorphingFilter extends BaseEffect {
  private lowpass: Tone.Filter;
  private bandpass: Tone.Filter;
  private highpass: Tone.Filter;
  private lpGain: Tone.Gain;
  private bpGain: Tone.Gain;
  private hpGain: Tone.Gain;
  private lfo: Tone.LFO;
  private wetGain: Tone.Gain;
  // private morphPosition: number = 0; // Reserved for morph position tracking

  constructor() {
    super({
      name: 'Morphing Filter',
      type: 'MorphingFilter',
      category: 'novel',
      version: '1.0.0'
    });

    // Create three parallel filters
    this.lowpass = new Tone.Filter(1000, 'lowpass', -24);
    this.bandpass = new Tone.Filter(1000, 'bandpass', -12);
    this.highpass = new Tone.Filter(1000, 'highpass', -24);

    this.lpGain = new Tone.Gain(1);
    this.bpGain = new Tone.Gain(0);
    this.hpGain = new Tone.Gain(0);

    this.lfo = new Tone.LFO(0.5, 0, 1);

    this.wetGain = new Tone.Gain(1);

    // Parallel filter chains
    this.input.connect(this.lowpass);
    this.input.connect(this.bandpass);
    this.input.connect(this.highpass);

    this.lowpass.connect(this.lpGain);
    this.bandpass.connect(this.bpGain);
    this.highpass.connect(this.hpGain);

    this.lpGain.connect(this.wetGain);
    this.bpGain.connect(this.wetGain);
    this.hpGain.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    this.lfo.start();

    // Initialize parameters
    this.addParameter('frequency', {
      value: 1000,
      min: 20,
      max: 20000,
      default: 1000,
      unit: 'Hz',
      curve: 'exponential'
    });

    this.addParameter('resonance', {
      value: 1,
      min: 0.1,
      max: 30,
      default: 1,
      step: 0.1
    });

    this.addParameter('morph', {
      value: 0,
      min: 0,
      max: 1,
      default: 0,
      step: 0.01
    });

    this.addParameter('lfoRate', {
      value: 0.5,
      min: 0,
      max: 20,
      default: 0.5,
      unit: 'Hz',
      step: 0.1
    });

    this.addParameter('lfoDepth', {
      value: 0,
      min: 0,
      max: 1,
      default: 0,
      step: 0.01
    });

    // Connect LFO to morph parameter
    // Note: LFO.on() is not available in current Tone.js version
    // this.lfo.on('change', (value: number) => {
    //   const depth = this.parameters.get('lfoDepth')?.value || 0;
    //   if (depth > 0) {
    //     const basePosition = this.parameters.get('morph')?.value || 0;
    //     const modulatedPosition = basePosition + (value - 0.5) * depth;
    //     this.updateMorphPosition(Math.max(0, Math.min(1, modulatedPosition)));
    //   }
    // });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'frequency':
        this.lowpass.frequency.value = value;
        this.bandpass.frequency.value = value;
        this.highpass.frequency.value = value;
        break;
      case 'resonance':
        this.lowpass.Q.value = value;
        this.bandpass.Q.value = value * 2; // Bandpass needs more Q
        this.highpass.Q.value = value;
        break;
      case 'morph':
        this.updateMorphPosition(value);
        break;
      case 'lfoRate':
        this.lfo.frequency.value = value;
        break;
    }
  }

  /**
   * Update filter gains based on morph position
   */
  private updateMorphPosition(position: number): void {
    // this.morphPosition = position;

    if (position <= 0.5) {
      // Morph from lowpass to bandpass
      const t = position * 2; // 0 to 1
      this.lpGain.gain.rampTo(1 - t, 0.05);
      this.bpGain.gain.rampTo(t, 0.05);
      this.hpGain.gain.rampTo(0, 0.05);
    } else {
      // Morph from bandpass to highpass
      const t = (position - 0.5) * 2; // 0 to 1
      this.lpGain.gain.rampTo(0, 0.05);
      this.bpGain.gain.rampTo(1 - t, 0.05);
      this.hpGain.gain.rampTo(t, 0.05);
    }
  }

  public dispose(): void {
    this.lowpass.dispose();
    this.bandpass.dispose();
    this.highpass.dispose();
    this.lpGain.dispose();
    this.bpGain.dispose();
    this.hpGain.dispose();
    this.lfo.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
