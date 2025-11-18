import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Dub Siren: Classic dub siren effect
 * Oscillator with envelope and filter for classic dub sound
 */
export class DubSiren extends BaseEffect {
  private oscillator: Tone.Oscillator;
  private filter: Tone.Filter;
  private envelope: Tone.FrequencyEnvelope;
  private ampEnvelope: Tone.AmplitudeEnvelope;
  private lfo: Tone.LFO;
  private wetGain: Tone.Gain;
  private isActive: boolean = false;

  constructor() {
    super({
      name: 'Dub Siren',
      type: 'DubSiren',
      category: 'novel',
      version: '1.0.0'
    });

    this.oscillator = new Tone.Oscillator(440, 'sine');
    this.filter = new Tone.Filter(1000, 'lowpass', -24);
    this.filter.Q.value = 10;

    // Frequency envelope for siren sweep
    this.envelope = new Tone.FrequencyEnvelope({
      attack: 0.5,
      decay: 1,
      sustain: 0.8,
      release: 2,
      baseFrequency: 200,
      octaves: 4
    });

    // Amplitude envelope
    this.ampEnvelope = new Tone.AmplitudeEnvelope({
      attack: 0.1,
      decay: 0.3,
      sustain: 0.7,
      release: 1.5
    });

    // LFO for vibrato
    this.lfo = new Tone.LFO(5, -50, 50);

    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.oscillator.connect(this.ampEnvelope);
    this.ampEnvelope.connect(this.filter);
    this.filter.connect(this.wetGain);

    // Modulation routing
    this.envelope.connect(this.oscillator.frequency);
    this.lfo.connect(this.oscillator.detune);

    // Wet/Dry (process input but add siren)
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    // Also pass input through
    this.input.connect(this.output);

    this.lfo.start();

    // Initialize parameters
    this.addParameter('baseFreq', {
      value: 200,
      min: 50,
      max: 1000,
      default: 200,
      unit: 'Hz',
      curve: 'exponential'
    });

    this.addParameter('range', {
      value: 4,
      min: 1,
      max: 6,
      default: 4,
      unit: 'oct',
      step: 0.1
    });

    this.addParameter('attack', {
      value: 0.5,
      min: 0.01,
      max: 5,
      default: 0.5,
      unit: 's',
      step: 0.01
    });

    this.addParameter('decay', {
      value: 1,
      min: 0.1,
      max: 5,
      default: 1,
      unit: 's',
      step: 0.01
    });

    this.addParameter('release', {
      value: 2,
      min: 0.1,
      max: 10,
      default: 2,
      unit: 's',
      step: 0.1
    });

    this.addParameter('filterFreq', {
      value: 1000,
      min: 100,
      max: 10000,
      default: 1000,
      unit: 'Hz',
      curve: 'exponential'
    });

    this.addParameter('resonance', {
      value: 10,
      min: 0.1,
      max: 30,
      default: 10,
      step: 0.5
    });

    this.addParameter('vibrato', {
      value: 5,
      min: 0,
      max: 20,
      default: 5,
      unit: 'Hz',
      step: 0.1
    });

    this.addParameter('vibratoDepth', {
      value: 50,
      min: 0,
      max: 200,
      default: 50,
      unit: 'cents',
      step: 1
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'baseFreq':
        this.envelope.baseFrequency = value;
        break;
      case 'range':
        this.envelope.octaves = value;
        break;
      case 'attack':
        this.envelope.attack = value;
        this.ampEnvelope.attack = value * 0.2;
        break;
      case 'decay':
        this.envelope.decay = value;
        this.ampEnvelope.decay = value * 0.3;
        break;
      case 'release':
        this.envelope.release = value;
        this.ampEnvelope.release = value * 0.75;
        break;
      case 'filterFreq':
        this.filter.frequency.value = value;
        break;
      case 'resonance':
        this.filter.Q.value = value;
        break;
      case 'vibrato':
        this.lfo.frequency.value = value;
        break;
      case 'vibratoDepth':
        this.lfo.min = -value;
        this.lfo.max = value;
        break;
    }
  }

  /**
   * Trigger the siren
   */
  public trigger(duration?: Tone.Unit.Time): void {
    if (!this.isActive) {
      this.oscillator.start();
      this.isActive = true;
    }

    this.envelope.triggerAttackRelease(duration || '2n');
    this.ampEnvelope.triggerAttackRelease(duration || '2n');
  }

  /**
   * Stop the siren
   */
  public stop(): void {
    if (this.isActive) {
      this.envelope.triggerRelease();
      this.ampEnvelope.triggerRelease();
      setTimeout(() => {
        if (this.oscillator.state === 'started') {
          this.oscillator.stop();
          this.isActive = false;
        }
      }, Tone.Time(this.envelope.release).toSeconds() * 1000 + 100);
    }
  }

  public dispose(): void {
    this.oscillator.dispose();
    this.filter.dispose();
    this.envelope.dispose();
    this.ampEnvelope.dispose();
    this.lfo.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
