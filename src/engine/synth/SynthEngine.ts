import * as Tone from 'tone';
import { VoicePool, VoiceParams } from './SynthVoice';
import { OscillatorParams } from './OscillatorEngine';
import { FilterParams } from './FilterEngine';
import { ADSRParams } from './EnvelopeEngine';
import { LFOParams } from './LFOEngine';

export interface SynthPreset {
  name: string;
  description?: string;
  params: VoiceParams;
}

export interface MIDINoteEvent {
  note: number;
  velocity: number;
  time?: number;
}

export class SynthEngine {
  private context: AudioContext;
  private voicePool: VoicePool;
  private output: GainNode;
  private masterVolume: GainNode;

  // @ts-ignore
  private maxVoices: number;
  private currentPreset: SynthPreset | null = null;

  // MIDI note tracking
  private activeNotes: Map<number, number> = new Map(); // note -> voice timestamp

  constructor(maxVoices: number = 16) {
    // Initialize audio context
    this.context = Tone.getContext().rawContext as AudioContext;
    this.maxVoices = maxVoices;

    // Create output nodes
    this.output = this.context.createGain();
    this.masterVolume = this.context.createGain();
    this.masterVolume.gain.value = 0.7; // Default master volume

    // Connect master volume to output
    this.masterVolume.connect(this.output);

    // Initialize with default parameters
    const defaultParams = this.getDefaultVoiceParams();
    this.voicePool = new VoicePool(this.context, defaultParams, maxVoices);

    // Connect all voices to master volume
    this.connectVoices();
  }

  private connectVoices(): void {
    const voices = this.voicePool.getVoices();
    voices.forEach((voice) => {
      voice.connect(this.masterVolume);
    });
  }

  private getDefaultVoiceParams(): VoiceParams {
    return {
      oscillator: {
        osc1: {
          type: 'sawtooth',
          level: 0.7,
          octave: 0,
          semitone: 0,
          detune: 0,
        },
        osc2: {
          type: 'sawtooth',
          level: 0.5,
          octave: 0,
          semitone: 7, // Fifth
          detune: -5,
        },
        osc3: {
          type: 'square',
          level: 0.3,
          octave: 1,
          semitone: 0,
          detune: 5,
        },
        sub: {
          enabled: true,
          level: 0.4,
          octave: -1,
        },
        noise: {
          enabled: false,
          type: 'white',
          level: 0.05,
        },
        unison: {
          enabled: false,
          voices: 3,
          detune: 10,
          stereoSpread: 0.5,
        },
      },
      filter: {
        type: 'lowpass',
        frequency: 2000,
        resonance: 0.3,
        slope: 24,
        drive: 0.2,
        analogDrift: {
          enabled: true,
          amount: 5,
          rate: 0.1,
        },
      },
      ampEnvelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.7,
        release: 0.5,
        attackCurve: 'exponential',
        decayCurve: 'exponential',
        releaseCurve: 'exponential',
      },
      filterEnvelope: {
        attack: 0.1,
        decay: 0.8,
        sustain: 0.2,
        release: 0.5,
        attackCurve: 'exponential',
        decayCurve: 'exponential',
        releaseCurve: 'exponential',
      },
      lfo1: {
        waveform: 'sine',
        mode: 'free',
        frequency: 0.5,
        min: -100,
        max: 100,
        phase: 0,
        amplitude: 1,
      },
      lfo2: {
        waveform: 'triangle',
        mode: 'free',
        frequency: 0.3,
        min: -50,
        max: 50,
        phase: 0,
        amplitude: 1,
      },
      lfo3: {
        waveform: 'sine',
        mode: 'free',
        frequency: 0.2,
        min: 0,
        max: 1,
        phase: 0,
        amplitude: 1,
      },
      portamento: {
        enabled: false,
        time: 0.1,
      },
    };
  }

  // Note triggering
  noteOn(note: number, velocity: number = 1, time?: number): void {
    // Allocate a voice
    const voice = this.voicePool.allocateVoice();
    if (!voice) {
      console.warn('No available voices');
      return;
    }

    const triggerTime = time ?? this.context.currentTime;

    // Trigger the voice
    voice.trigger(note, velocity, triggerTime);

    // Track active note
    this.activeNotes.set(note, triggerTime);
  }

  noteOff(note: number, time?: number): void {
    // Find voice playing this note
    const voice = this.voicePool.findVoiceByNote(note);
    if (voice) {
      voice.release(time);
    }

    // Remove from active notes
    this.activeNotes.delete(note);
  }

  // Stop all notes
  allNotesOff(): void {
    const voices = this.voicePool.getVoices();
    voices.forEach((voice) => {
      if (voice.getIsActive()) {
        voice.release();
      }
    });

    this.activeNotes.clear();
  }

  // Panic - immediately stop all sound
  panic(): void {
    const voices = this.voicePool.getVoices();
    voices.forEach((voice) => {
      voice.stop();
    });

    this.activeNotes.clear();
  }

  // MIDI CC and parameter control
  setMasterVolume(volume: number): void {
    // volume: 0-1
    this.masterVolume.gain.value = Math.max(0, Math.min(1, volume));
  }

  getMasterVolume(): number {
    return this.masterVolume.gain.value;
  }

  // Update synth parameters
  updateOscillatorParams(params: Partial<OscillatorParams>): void {
    this.voicePool.updateAllVoices({ oscillator: params as OscillatorParams });
  }

  updateFilterParams(params: Partial<FilterParams>): void {
    this.voicePool.updateAllVoices({ filter: params as FilterParams });
  }

  updateAmpEnvelope(params: Partial<ADSRParams>): void {
    this.voicePool.updateAllVoices({ ampEnvelope: params as ADSRParams });
  }

  updateFilterEnvelope(params: Partial<ADSRParams>): void {
    this.voicePool.updateAllVoices({ filterEnvelope: params as ADSRParams });
  }

  updateLFO1(params: Partial<LFOParams>): void {
    this.voicePool.updateAllVoices({ lfo1: params as LFOParams });
  }

  updateLFO2(params: Partial<LFOParams>): void {
    this.voicePool.updateAllVoices({ lfo2: params as LFOParams });
  }

  updateLFO3(params: Partial<LFOParams>): void {
    this.voicePool.updateAllVoices({ lfo3: params as LFOParams });
  }

  setPortamento(enabled: boolean, time: number): void {
    this.voicePool.updateAllVoices({
      portamento: { enabled, time },
    });
  }

  // Preset management
  loadPreset(preset: SynthPreset): void {
    this.currentPreset = preset;
    this.voicePool.updateAllVoices(preset.params);
  }

  getCurrentPreset(): SynthPreset | null {
    return this.currentPreset;
  }

  saveCurrentState(): SynthPreset {
    // This would need to gather current params from a voice
    // For now, return the current preset or default
    return (
      this.currentPreset ?? {
        name: 'Current State',
        params: this.getDefaultVoiceParams(),
      }
    );
  }

  // Preset library
  static getPresets(): SynthPreset[] {
    return [
      {
        name: 'Dub Techno Chord',
        description: 'Classic deep dub techno pad sound',
        params: {
          oscillator: {
            osc1: { type: 'sawtooth', level: 0.6, octave: 0, semitone: 0, detune: 0 },
            osc2: { type: 'sawtooth', level: 0.5, octave: 0, semitone: 7, detune: -8 },
            osc3: { type: 'pulse', level: 0.4, octave: 0, semitone: 0, detune: 8, pulseWidth: 0.3 },
            sub: { enabled: true, level: 0.5, octave: -1 },
            noise: { enabled: false, type: 'pink', level: 0.02 },
            unison: { enabled: true, voices: 4, detune: 15, stereoSpread: 0.7 },
          },
          filter: {
            type: 'lowpass',
            frequency: 800,
            resonance: 0.4,
            slope: 24,
            drive: 0.3,
            analogDrift: { enabled: true, amount: 10, rate: 0.15 },
          },
          ampEnvelope: {
            attack: 0.5,
            decay: 1.0,
            sustain: 0.8,
            release: 2.0,
            attackCurve: 'exponential',
            decayCurve: 'exponential',
            releaseCurve: 'exponential',
          },
          filterEnvelope: {
            attack: 0.3,
            decay: 1.5,
            sustain: 0.3,
            release: 1.5,
            attackCurve: 'exponential',
            decayCurve: 'exponential',
            releaseCurve: 'exponential',
          },
          lfo1: { waveform: 'sine', mode: 'synced', syncRate: '4n', min: -200, max: 200, phase: 0, amplitude: 0.6 },
          lfo2: { waveform: 'triangle', mode: 'free', frequency: 0.2, min: -20, max: 20, phase: 90, amplitude: 0.4 },
          lfo3: { waveform: 'sine', mode: 'free', frequency: 0.1, min: 0, max: 0.5, phase: 0, amplitude: 0.8 },
          portamento: { enabled: true, time: 0.2 },
        },
      },
      {
        name: 'Deep Bass',
        description: 'Subby bass with movement',
        params: {
          oscillator: {
            osc1: { type: 'triangle', level: 0.8, octave: -1, semitone: 0, detune: 0 },
            osc2: { type: 'sawtooth', level: 0.3, octave: -1, semitone: 0, detune: -3 },
            osc3: { type: 'sine', level: 0.0, octave: 0, semitone: 0, detune: 0 },
            sub: { enabled: true, level: 0.7, octave: -2 },
            noise: { enabled: false, type: 'brown', level: 0.01 },
            unison: { enabled: false, voices: 2, detune: 5, stereoSpread: 0.3 },
          },
          filter: {
            type: 'lowpass',
            frequency: 350,
            resonance: 0.5,
            slope: 24,
            drive: 0.4,
            analogDrift: { enabled: true, amount: 8, rate: 0.08 },
          },
          ampEnvelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.8,
            release: 0.3,
            attackCurve: 'exponential',
            decayCurve: 'exponential',
            releaseCurve: 'exponential',
          },
          filterEnvelope: {
            attack: 0.05,
            decay: 0.4,
            sustain: 0.1,
            release: 0.2,
            attackCurve: 'exponential',
            decayCurve: 'exponential',
            releaseCurve: 'exponential',
          },
          lfo1: { waveform: 'sine', mode: 'free', frequency: 4, min: -50, max: 50, phase: 0, amplitude: 0.5 },
          lfo2: { waveform: 'triangle', mode: 'free', frequency: 0.5, min: -10, max: 10, phase: 0, amplitude: 0.3 },
          lfo3: { waveform: 'sine', mode: 'free', frequency: 0.1, min: 0, max: 0.2, phase: 0, amplitude: 0.6 },
          portamento: { enabled: true, time: 0.15 },
        },
      },
      {
        name: 'Atmospheric Pad',
        description: 'Lush, evolving pad texture',
        params: {
          oscillator: {
            osc1: { type: 'sine', level: 0.5, octave: 0, semitone: 0, detune: 0 },
            osc2: { type: 'triangle', level: 0.4, octave: 0, semitone: 7, detune: 10 },
            osc3: { type: 'sawtooth', level: 0.3, octave: 1, semitone: 0, detune: -10 },
            sub: { enabled: false, level: 0.2, octave: -1 },
            noise: { enabled: true, type: 'pink', level: 0.08 },
            unison: { enabled: true, voices: 5, detune: 20, stereoSpread: 0.9 },
          },
          filter: {
            type: 'lowpass',
            frequency: 3000,
            resonance: 0.2,
            slope: 12,
            drive: 0.1,
            analogDrift: { enabled: true, amount: 30, rate: 0.2 },
          },
          ampEnvelope: {
            attack: 1.5,
            decay: 2.0,
            sustain: 0.6,
            release: 3.0,
            attackCurve: 'exponential',
            decayCurve: 'exponential',
            releaseCurve: 'exponential',
          },
          filterEnvelope: {
            attack: 2.0,
            decay: 3.0,
            sustain: 0.4,
            release: 2.5,
            attackCurve: 'exponential',
            decayCurve: 'exponential',
            releaseCurve: 'exponential',
          },
          lfo1: { waveform: 'sine', mode: 'free', frequency: 0.1, min: -500, max: 500, phase: 0, amplitude: 0.7 },
          lfo2: { waveform: 'random', mode: 'free', frequency: 0.05, min: -100, max: 100, phase: 0, amplitude: 0.5 },
          lfo3: { waveform: 'triangle', mode: 'free', frequency: 0.3, min: 0, max: 0.3, phase: 0, amplitude: 0.6 },
          portamento: { enabled: true, time: 0.5 },
        },
      },
    ];
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

  // Cleanup
  dispose(): void {
    this.panic();
    this.voicePool.dispose();
    this.disconnect();
    this.masterVolume.disconnect();
  }
}
