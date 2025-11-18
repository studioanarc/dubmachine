import * as Tone from 'tone';

export type LFOWaveform = 'sine' | 'triangle' | 'sawtooth' | 'square' | 'random';
export type LFOMode = 'free' | 'synced';
export type SyncRate =
  | '1n'
  | '2n'
  | '4n'
  | '8n'
  | '16n'
  | '32n'
  | '1n.'
  | '2n.'
  | '4n.'
  | '8n.'
  | '16n.'
  | '1t'
  | '2t'
  | '4t'
  | '8t';

export interface LFOParams { 
  waveform: LFOWaveform;
  mode: LFOMode;
  frequency?: number; // Used in free mode (Hz)
  syncRate?: SyncRate; // Used in synced mode
  min: number;
  max: number;
  phase: number; // 0-360 degrees
  amplitude: number; // 0-1, scales the min/max range
}

export class LFOEngine { 
  // @ts-ignore
  private context: AudioContext;
  private lfo: Tone.LFO | Tone.Oscillator | null = null;
  private sampleAndHold: Tone.Signal | null = null;
  private params: LFOParams;
  private output: Tone.Signal;
  private isRunning: boolean = false;

  // For random waveform (sample & hold)
  private randomInterval: number | null = null;

  constructor(context: AudioContext, params: LFOParams) { 
    this.context = context;
    this.params = params;
    this.output = new Tone.Signal(0);

    this.initializeLFO();
  }

  private initializeLFO(): void { 
    if (this.params.waveform === 'random') { 
      this.initializeRandomLFO();
    } else { 
      this.initializeStandardLFO();
    }
  }

  private initializeStandardLFO(): void { 
    const scaledMin = this.params.min + (this.params.max - this.params.min) * (1 - this.params.amplitude) * 0.5;
    const scaledMax = this.params.max - (this.params.max - this.params.min) * (1 - this.params.amplitude) * 0.5;

    if (this.params.mode === 'synced' && this.params.syncRate) {
      // Create synced LFO using Tone.js Transport
      this.lfo = new Tone.LFO({
        frequency: this.params.syncRate,
        type: this.params.waveform as any,
        min: scaledMin,
        max: scaledMax,
        phase: this.params.phase,
      });
      (this.lfo as Tone.LFO).sync();
    } else {
      // Free-running LFO
      const frequency = this.params.frequency ?? 1;
      this.lfo = new Tone.LFO({
        frequency: frequency,
        type: this.params.waveform as any,
        min: scaledMin,
        max: scaledMax,
        phase: this.params.phase,
      });
    }

    // Connect LFO to output signal
    (this.lfo as Tone.LFO).connect(this.output);
  }

  private initializeRandomLFO(): void { 
    // Random LFO (sample & hold)
    this.sampleAndHold = new Tone.Signal(this.params.min);
    this.sampleAndHold.connect(this.output);

    // Generate random values at regular intervals
    const rate = this.params.frequency ?? 1;
    const intervalMs = 1000 / rate;

    if (this.isRunning) { 
      this.startRandomUpdates(intervalMs);
    }
  }

  private startRandomUpdates(intervalMs: number): void { 
    if (this.randomInterval !== null) { 
      clearInterval(this.randomInterval);
    }

    this.randomInterval = setInterval(() => { 
      if (this.sampleAndHold) { 
        const scaledMin = this.params.min + (this.params.max - this.params.min) * (1 - this.params.amplitude) * 0.5;
        const scaledMax = this.params.max - (this.params.max - this.params.min) * (1 - this.params.amplitude) * 0.5;
        const randomValue = scaledMin + Math.random() * (scaledMax - scaledMin);
        this.sampleAndHold.value = randomValue;
      }
    }, intervalMs) as unknown as number;
  }

  start(time?: number): void { 
    if (this.isRunning) return;

    if (this.params.waveform === 'random') { 
      const rate = this.params.frequency ?? 1;
      this.startRandomUpdates(1000 / rate);
    } else if (this.lfo) { 
      (this.lfo as Tone.LFO).start(time);
    }

    this.isRunning = true;
  }

  stop(time?: number): void { 
    if (!this.isRunning) return;

    if (this.randomInterval !== null) { 
      clearInterval(this.randomInterval);
      this.randomInterval = null;
    }

    if (this.lfo) { 
      (this.lfo as Tone.LFO).stop(time);
    }

    this.isRunning = false;
  }

  setFrequency(frequency: number): void { 
    this.params.frequency = frequency;

    if (this.params.waveform === 'random') { 
      if (this.isRunning) { 
        this.startRandomUpdates(1000 / frequency);
      }
    } else if (this.lfo && this.params.mode === 'free') { 
      (this.lfo as Tone.LFO).frequency.value = frequency;
    }
  }

  setSyncRate(rate: SyncRate): void { 
    this.params.syncRate = rate;

    if (this.params.mode === 'synced' && this.lfo) { 
      (this.lfo as Tone.LFO).frequency.value = rate;
    }
  }

  setWaveform(waveform: LFOWaveform): void { 
    if (waveform === this.params.waveform) return;

    const wasRunning = this.isRunning;
    if (wasRunning) { 
      this.stop();
    }

    // Dispose old LFO
    this.disposeLFO();

    this.params.waveform = waveform;
    this.initializeLFO();

    if (wasRunning) { 
      this.start();
    }
  }

  setMode(mode: LFOMode): void { 
    if (mode === this.params.mode) return;

    const wasRunning = this.isRunning;
    if (wasRunning) { 
      this.stop();
    }

    this.params.mode = mode;

    // Reinitialize LFO with new mode
    this.disposeLFO();
    this.initializeLFO();

    if (wasRunning) { 
      this.start();
    }
  }

  setRange(min: number, max: number): void { 
    this.params.min = min;
    this.params.max = max;

    // Update LFO range
    if (this.lfo && this.params.waveform !== 'random') { 
      const scaledMin = min + (max - min) * (1 - this.params.amplitude) * 0.5;
      const scaledMax = max - (max - min) * (1 - this.params.amplitude) * 0.5;
      (this.lfo as Tone.LFO).min = scaledMin;
      (this.lfo as Tone.LFO).max = scaledMax;
    }
  }

  setAmplitude(amplitude: number): void { 
    this.params.amplitude = Math.max(0, Math.min(1, amplitude));

    // Update LFO range based on new amplitude
    if (this.lfo && this.params.waveform !== 'random') { 
      const scaledMin =
        this.params.min + (this.params.max - this.params.min) * (1 - this.params.amplitude) * 0.5;
      const scaledMax =
        this.params.max - (this.params.max - this.params.min) * (1 - this.params.amplitude) * 0.5;
      (this.lfo as Tone.LFO).min = scaledMin;
      (this.lfo as Tone.LFO).max = scaledMax;
    }
  }

  setPhase(phase: number): void { 
    this.params.phase = phase;

    if (this.lfo && this.params.waveform !== 'random') { 
      (this.lfo as Tone.LFO).phase = phase;
    }
  }

  connect(destination: AudioNode | AudioParam | Tone.Signal): this { 
    this.output.connect(destination as any);
    return this;
  }

  disconnect(): void { 
    this.output.disconnect();
  }

  getOutput(): Tone.Signal { 
    return this.output;
  }

  getParams(): LFOParams { 
    return { ...this.params };
  }

  updateParams(params: Partial<LFOParams>): void { 
    if (params.waveform !== undefined) { 
      this.setWaveform(params.waveform);
    }
    if (params.mode !== undefined) { 
      this.setMode(params.mode);
    }
    if (params.frequency !== undefined) { 
      this.setFrequency(params.frequency);
    }
    if (params.syncRate !== undefined) { 
      this.setSyncRate(params.syncRate);
    }
    if (params.min !== undefined || params.max !== undefined) { 
      const min = params.min ?? this.params.min;
      const max = params.max ?? this.params.max;
      this.setRange(min, max);
    }
    if (params.amplitude !== undefined) { 
      this.setAmplitude(params.amplitude);
    }
    if (params.phase !== undefined) { 
      this.setPhase(params.phase);
    }
  }

  private disposeLFO(): void { 
    if (this.randomInterval !== null) { 
      clearInterval(this.randomInterval);
      this.randomInterval = null;
    }

    if (this.lfo) { 
      (this.lfo as Tone.LFO).dispose();
      this.lfo = null;
    }

    if (this.sampleAndHold) { 
      this.sampleAndHold.dispose();
      this.sampleAndHold = null;
    }
  }

  dispose(): void { 
    this.stop();
    this.disposeLFO();
    this.output.dispose();
  }
}

// Manager for multiple LFOs
export class LFOSet { 
  // @ts-ignore
  private context: AudioContext;
  public lfo1: LFOEngine;
  public lfo2: LFOEngine;
  public lfo3: LFOEngine;

  constructor(
    context: AudioContext,
    lfo1Params: LFOParams,
    lfo2Params: LFOParams,
    lfo3Params: LFOParams
  ) { 
    this.context = context;

    this.lfo1 = new LFOEngine(context, lfo1Params);
    this.lfo2 = new LFOEngine(context, lfo2Params);
    this.lfo3 = new LFOEngine(context, lfo3Params);
  }

  startAll(time?: number): void { 
    this.lfo1.start(time);
    this.lfo2.start(time);
    this.lfo3.start(time);
  }

  stopAll(time?: number): void { 
    this.lfo1.stop(time);
    this.lfo2.stop(time);
    this.lfo3.stop(time);
  }

  dispose(): void { 
    this.lfo1.dispose();
    this.lfo2.dispose();
    this.lfo3.dispose();
  }
}
