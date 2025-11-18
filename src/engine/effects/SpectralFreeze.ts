import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Spectral Freeze: FFT-based spectral freezing
 * Freezes the spectrum of the input signal, creating sustained textures
 */
export class SpectralFreeze extends BaseEffect {
  private analyser: AnalyserNode;
  private bufferLength: number;
  private dataArray: Float32Array;
  private oscillators: Tone.Oscillator[] = [];
  private oscillatorGains: Tone.Gain[] = [];
  private frozen: boolean = false;
  private frozenSpectrum: Float32Array | null = null;
  private wetGain: Tone.Gain;
  private fftSize: number = 2048;

  constructor() {
    super({
      name: 'Spectral Freeze',
      type: 'SpectralFreeze',
      category: 'novel',
      version: '1.0.0'
    });

    // Create analyser for FFT
    this.analyser = Tone.context.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Float32Array(this.bufferLength);

    this.wetGain = new Tone.Gain(1);

    // Connect input to analyser
    this.input.connect(this.analyser as any);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    // Initialize parameters
    this.addParameter('freeze', {
      value: 0,
      min: 0,
      max: 1,
      default: 0,
      step: 1
    });

    this.addParameter('decay', {
      value: 0.5,
      min: 0,
      max: 1,
      default: 0.5,
      step: 0.01
    });

    this.addParameter('shimmer', {
      value: 0,
      min: 0,
      max: 1,
      default: 0,
      step: 0.01
    });

    this.addParameter('brightness', {
      value: 0.5,
      min: 0,
      max: 1,
      default: 0.5,
      step: 0.01
    });

    this.addParameter('density', {
      value: 32,
      min: 8,
      max: 128,
      default: 32,
      step: 1
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'freeze':
        if (value > 0.5 && !this.frozen) {
          this.freezeSpectrum();
        } else if (value <= 0.5 && this.frozen) {
          this.unfreezeSpectrum();
        }
        break;
      case 'decay':
        // Adjust oscillator envelope decay
        this.oscillatorGains.forEach(gain => {
          gain.gain.rampTo(gain.gain.value * (1 - value * 0.01), 0.1);
        });
        break;
      case 'shimmer':
        // Add subtle detuning for shimmer effect
    // @ts-ignore
        this.oscillators.forEach((osc, i) => {
          const detune = (Math.random() - 0.5) * value * 20;
          osc.detune.value = detune;
        });
        break;
      case 'brightness':
        // Filter frozen spectrum by brightness
        break;
      case 'density':
        // Number of oscillators to use
        break;
    }
  }

  /**
   * Freeze the current spectrum
   */
  private freezeSpectrum(): void {
    // Get current spectrum
    // @ts-expect-error - Float32Array type compatibility
    this.analyser.getFloatFrequencyData(this.dataArray);
    this.frozenSpectrum = new Float32Array(this.dataArray);

    // Create oscillators for frozen spectrum
    const density = Math.round(this.parameters.get('density')?.value || 32);
    const nyquist = Tone.context.sampleRate / 2;

    this.clearOscillators();

    for (let i = 0; i < density; i++) {
      const binIndex = Math.floor((i / density) * this.bufferLength);
      const magnitude = this.frozenSpectrum[binIndex];
      const frequency = (binIndex / this.bufferLength) * nyquist;

      if (magnitude > -100 && frequency > 20 && frequency < 20000) {
        // Convert dB to linear amplitude
        const amplitude = Math.pow(10, magnitude / 20) * 0.1;

        const osc = new Tone.Oscillator(frequency, 'sine');
        const gain = new Tone.Gain(amplitude);

        osc.connect(gain);
        gain.connect(this.wetGain);

        osc.start();

        this.oscillators.push(osc);
        this.oscillatorGains.push(gain);
      }
    }

    this.frozen = true;
  }

  /**
   * Unfreeze and stop oscillators
   */
  private unfreezeSpectrum(): void {
    this.clearOscillators();
    this.frozen = false;
  }

  /**
   * Clear all oscillators
   */
  private clearOscillators(): void {
    this.oscillators.forEach(osc => {
      osc.stop();
      osc.dispose();
    });
    this.oscillatorGains.forEach(gain => gain.dispose());
    this.oscillators = [];
    this.oscillatorGains = [];
  }

  /**
   * Manually trigger freeze
   */
  public trigger(): void {
    if (!this.frozen) {
      this.freezeSpectrum();
    } else {
      this.unfreezeSpectrum();
    }
  }

  public dispose(): void {
    this.clearOscillators();
    this.wetGain.dispose();
    super.dispose();
  }
}
