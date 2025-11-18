import { OscillatorEngine, OscillatorParams } from './OscillatorEngine';
import { FilterEngine, FilterParams } from './FilterEngine';
import { EnvelopeEngine, ADSRParams } from './EnvelopeEngine';
import { LFOParams, LFOSet } from './LFOEngine';
import { ModulationMatrix } from './ModulationMatrix';

export interface VoiceParams {
  oscillator: OscillatorParams;
  filter: FilterParams;
  ampEnvelope: ADSRParams;
  filterEnvelope: ADSRParams;
  lfo1: LFOParams;
  lfo2: LFOParams;
  lfo3: LFOParams;
  portamento: {
    enabled: boolean;
    time: number; // Glide time in seconds
  };
}

export interface NoteData {
  note: number; // MIDI note number
  frequency: number;
  velocity: number; // 0-1
  timestamp: number;
}

export class SynthVoice {
  private context: AudioContext;
  private output: GainNode;

  // Core engines
  private oscillator: OscillatorEngine;
  private filter: FilterEngine;
  private lfos: LFOSet;
  private modMatrix: ModulationMatrix;

  // Envelopes
  private ampGain: GainNode;
  private ampEnvelope: EnvelopeEngine;
  private filterEnvelope: EnvelopeEngine;

  // Voice state
  private currentNote: NoteData | null = null;
  private isActive: boolean = false;
  private isReleasing: boolean = false;

  // Portamento
  private portamentoTime: number = 0;
  private portamentoEnabled: boolean = false;

  // Parameters
  private params: VoiceParams;

  constructor(context: AudioContext, params: VoiceParams) {
    this.context = context;
    this.params = params;

    // Create output gain
    this.output = context.createGain();
    this.output.gain.value = 1;

    // Create amp gain for envelope
    this.ampGain = context.createGain();
    this.ampGain.gain.value = 0;

    // Initialize engines
    this.oscillator = new OscillatorEngine(context, params.oscillator);
    this.filter = new FilterEngine(context, params.filter);
    this.lfos = new LFOSet(context, params.lfo1, params.lfo2, params.lfo3);

    // Create envelopes
    this.ampEnvelope = new EnvelopeEngine(context, this.ampGain.gain, params.ampEnvelope, 0, 1);
    this.filterEnvelope = new EnvelopeEngine(
      context,
      this.filter.getFrequencyParam(),
      params.filterEnvelope,
      params.filter.frequency,
      params.filter.frequency + 5000 // Default envelope range
    );

    // Create modulation matrix
    this.modMatrix = new ModulationMatrix(context);

    // Set portamento
    this.portamentoEnabled = params.portamento.enabled;
    this.portamentoTime = params.portamento.time;

    // Connect signal chain
    this.connectSignalChain();

    // Start LFOs
    this.lfos.startAll();
  }

  private connectSignalChain(): void {
    // Signal chain: oscillator -> filter -> ampGain -> output
    this.oscillator.connect(this.filter.getInput());
    this.filter.connect(this.ampGain);
    this.ampGain.connect(this.output);

    // Register modulation sources and destinations
    this.setupModulationRouting();
  }

  private setupModulationRouting(): void {
    // Register LFO sources
    this.modMatrix.registerSource('lfo1', this.lfos.lfo1);
    this.modMatrix.registerSource('lfo2', this.lfos.lfo2);
    this.modMatrix.registerSource('lfo3', this.lfos.lfo3);

    // Register destinations
    this.modMatrix.registerDestination('filterFreq', this.filter.getFrequencyParam());
    // Note: Oscillator pitch modulation would require additional AudioParams
    // This can be extended as needed
  }

  trigger(note: number, velocity: number = 1, time?: number): void {
    const startTime = time ?? this.context.currentTime;

    // Create note data
    const frequency = this.midiToFrequency(note);
    this.currentNote = {
      note,
      frequency,
      velocity,
      timestamp: startTime,
    };

    this.isActive = true;
    this.isReleasing = false;

    // Apply portamento if enabled and there was a previous note
    if (this.portamentoEnabled && this.portamentoTime > 0) {
      // Glide to new frequency
      this.oscillator.setFrequency(frequency, startTime + this.portamentoTime);
    } else {
      // Immediate frequency change
      this.oscillator.start(frequency, startTime);
    }

    // Trigger envelopes
    this.ampEnvelope.trigger(startTime);
    this.filterEnvelope.trigger(startTime);
  }

  release(time?: number): void {
    if (!this.isActive || this.isReleasing) return;

    const releaseTime = time ?? this.context.currentTime;

    this.isReleasing = true;

    // Release envelopes
    this.ampEnvelope.release(releaseTime);
    this.filterEnvelope.release(releaseTime);

    // Schedule voice deactivation after release time
    const releaseEndTime = releaseTime + this.params.ampEnvelope.release;
    setTimeout(() => {
      this.stop();
    }, (releaseEndTime - this.context.currentTime) * 1000);
  }

  stop(): void {
    if (!this.isActive) return;

    this.oscillator.stop();
    this.isActive = false;
    this.isReleasing = false;
    this.currentNote = null;
  }

  // Helper to convert MIDI note to frequency
  private midiToFrequency(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  // Voice state queries
  getIsActive(): boolean {
    return this.isActive;
  }

  getIsReleasing(): boolean {
    return this.isReleasing;
  }

  getCurrentNote(): NoteData | null {
    return this.currentNote;
  }

  getTimestamp(): number {
    return this.currentNote?.timestamp ?? 0;
  }

  // Parameter updates
  setPortamento(enabled: boolean, time: number): void {
    this.portamentoEnabled = enabled;
    this.portamentoTime = time;
    this.params.portamento.enabled = enabled;
    this.params.portamento.time = time;
  }

  updateOscillatorParams(params: Partial<OscillatorParams>): void {
    this.oscillator.updateParams(params);
  }

  updateFilterParams(params: Partial<FilterParams>): void {
    this.filter.updateParams(params);
  }

  updateAmpEnvelope(params: Partial<ADSRParams>): void {
    this.ampEnvelope.updateParams(params);
    this.params.ampEnvelope = { ...this.params.ampEnvelope, ...params };
  }

  updateFilterEnvelope(params: Partial<ADSRParams>): void {
    this.filterEnvelope.updateParams(params);
    this.params.filterEnvelope = { ...this.params.filterEnvelope, ...params };
  }

  updateLFO1(params: Partial<LFOParams>): void {
    this.lfos.lfo1.updateParams(params);
  }

  updateLFO2(params: Partial<LFOParams>): void {
    this.lfos.lfo2.updateParams(params);
  }

  updateLFO3(params: Partial<LFOParams>): void {
    this.lfos.lfo3.updateParams(params);
  }

  // Access to modulation matrix for routing
  getModulationMatrix(): ModulationMatrix {
    return this.modMatrix;
  }

  // Audio routing
  connect(destination: AudioNode): this {
    this.output.connect(destination);
    return this;
  }

  disconnect(): void {
    this.output.disconnect();
  }

  getOutput(): GainNode {
    return this.output;
  }

  dispose(): void {
    this.stop();

    // Dispose all engines
    this.oscillator.dispose();
    this.filter.dispose();
    this.lfos.dispose();
    this.modMatrix.dispose();

    // Disconnect nodes
    this.disconnect();
    this.ampGain.disconnect();
  }
}

// Voice pool manager for handling multiple voices
export class VoicePool {
  private voices: SynthVoice[] = [];
  // @ts-ignore
  private maxVoices: number;
  // @ts-ignore
  private context: AudioContext;
  private params: VoiceParams;

  constructor(context: AudioContext, params: VoiceParams, maxVoices: number = 16) {
    this.context = context;
    this.params = params;
    this.maxVoices = maxVoices;

    // Pre-allocate voices
    for (let i = 0; i < maxVoices; i++) {
      const voice = new SynthVoice(context, { ...params });
      this.voices.push(voice);
    }
  }

  // Get an available voice (voice stealing with oldest note priority)
  allocateVoice(): SynthVoice | null {
    // First, try to find an inactive voice
    let voice = this.voices.find((v) => !v.getIsActive());

    if (!voice) {
      // No inactive voices, steal the oldest active voice
      // @ts-expect-error - Return type compatibility
      voice = this.getOldestVoice();
      if (voice) {
        voice.stop();
      }
    }
    // @ts-expect-error - Return type compatibility

    return voice;
  }

  private getOldestVoice(): SynthVoice | null {
    let oldest: SynthVoice | null = null;
    let oldestTime = Infinity;

    for (const voice of this.voices) {
      if (voice.getIsActive()) {
        const timestamp = voice.getTimestamp();
        if (timestamp < oldestTime) {
          oldestTime = timestamp;
          oldest = voice;
        }
      }
    }

    return oldest;
  }

  // Find voice playing a specific note
  findVoiceByNote(note: number): SynthVoice | null {
    return this.voices.find((v) => v.getCurrentNote()?.note === note && v.getIsActive()) ?? null;
  }

  // Get all voices
  getVoices(): SynthVoice[] {
    return this.voices;
  }

  // Update all voices with new parameters
  updateAllVoices(params: Partial<VoiceParams>): void {
    this.params = { ...this.params, ...params };

    this.voices.forEach((voice) => {
      if (params.oscillator) voice.updateOscillatorParams(params.oscillator);
      if (params.filter) voice.updateFilterParams(params.filter);
      if (params.ampEnvelope) voice.updateAmpEnvelope(params.ampEnvelope);
      if (params.filterEnvelope) voice.updateFilterEnvelope(params.filterEnvelope);
      if (params.lfo1) voice.updateLFO1(params.lfo1);
      if (params.lfo2) voice.updateLFO2(params.lfo2);
      if (params.lfo3) voice.updateLFO3(params.lfo3);
      if (params.portamento) {
        voice.setPortamento(params.portamento.enabled, params.portamento.time);
      }
    });
  }

  dispose(): void {
    this.voices.forEach((voice) => voice.dispose());
    this.voices = [];
  }
}
