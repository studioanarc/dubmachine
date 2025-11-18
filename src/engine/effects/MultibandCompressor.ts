import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Multiband Compressor: 3-band compression
 * Independent compression for low, mid, and high frequencies
 */
export class MultibandCompressor extends BaseEffect {
  private multibandCompressor: Tone.MultibandCompressor;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Multiband Compressor',
      type: 'MultibandCompressor',
      category: 'dynamics',
      version: '1.0.0'
    });

    this.multibandCompressor = new Tone.MultibandCompressor({
      lowFrequency: 250,
      highFrequency: 2000,
      low: {
        threshold: -24,
        ratio: 4,
        attack: 0.01,
        release: 0.1
      },
      mid: {
        threshold: -18,
        ratio: 3,
        attack: 0.005,
        release: 0.05
      },
      high: {
        threshold: -12,
        ratio: 2,
        attack: 0.003,
        release: 0.03
      }
    });

    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.multibandCompressor);
    this.multibandCompressor.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    // Initialize parameters
    this.addParameter('lowFreq', {
      value: 250,
      min: 20,
      max: 500,
      default: 250,
      unit: 'Hz',
      curve: 'exponential'
    });

    this.addParameter('highFreq', {
      value: 2000,
      min: 1000,
      max: 10000,
      default: 2000,
      unit: 'Hz',
      curve: 'exponential'
    });

    // Low band
    this.addParameter('lowThreshold', {
      value: -24,
      min: -60,
      max: 0,
      default: -24,
      unit: 'dB',
      step: 1
    });

    this.addParameter('lowRatio', {
      value: 4,
      min: 1,
      max: 20,
      default: 4,
      step: 0.1
    });

    // Mid band
    this.addParameter('midThreshold', {
      value: -18,
      min: -60,
      max: 0,
      default: -18,
      unit: 'dB',
      step: 1
    });

    this.addParameter('midRatio', {
      value: 3,
      min: 1,
      max: 20,
      default: 3,
      step: 0.1
    });

    // High band
    this.addParameter('highThreshold', {
      value: -12,
      min: -60,
      max: 0,
      default: -12,
      unit: 'dB',
      step: 1
    });

    this.addParameter('highRatio', {
      value: 2,
      min: 1,
      max: 20,
      default: 2,
      step: 0.1
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'lowFreq':
        this.multibandCompressor.lowFrequency.value = value;
        break;
      case 'highFreq':
        this.multibandCompressor.highFrequency.value = value;
        break;
      case 'lowThreshold':
        this.multibandCompressor.low.threshold.value = value;
        break;
      case 'lowRatio':
        this.multibandCompressor.low.ratio.value = value;
        break;
      case 'midThreshold':
        this.multibandCompressor.mid.threshold.value = value;
        break;
      case 'midRatio':
        this.multibandCompressor.mid.ratio.value = value;
        break;
      case 'highThreshold':
        this.multibandCompressor.high.threshold.value = value;
        break;
      case 'highRatio':
        this.multibandCompressor.high.ratio.value = value;
        break;
    }
  }

  public dispose(): void {
    this.multibandCompressor.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
