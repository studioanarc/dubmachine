/**
 * DubMachine.ts
 * Master audio integration controller for the dub techno generative music webapp
 * Integrates: SynthEngine, EffectsChain, GenerativeController, DrumPatternGenerator, Transport
 */

import * as Tone from 'tone';
import { SynthEngine, SynthPreset } from './synth/SynthEngine';
import { EffectsChain } from './effects/EffectsChain';
import {
  GenerativeController,
  GenerativeControllerConfig,
  GeneratedContent
} from './generative/GenerativeController';
import { DrumPattern } from './generative/DrumPatternGenerator';
import { EvolutionState } from './generative/EvolutionEngine';

export interface DubMachinePreset {
  name: string;
  description: string;
  synthPreset: SynthPreset;
  generativeConfig: Partial<GenerativeControllerConfig>;
  effectsConfig: any;
  tags: string[];
}

export interface PlaybackState {
  isPlaying: boolean;
  currentBar: number;
  currentBeat: number;
  bpm: number;
}

export interface DubMachineConfig extends Partial<GenerativeControllerConfig> {
  masterVolume?: number;
  enableVisualization?: boolean;
  maxVoices?: number;
  synthPreset?: SynthPreset;
}

export class DubMachine {
  private synthEngine: SynthEngine;
  private effectsChain: EffectsChain;
  private generativeController: GenerativeController;
  private masterGain: Tone.Gain;
  private analyser: AnalyserNode | null = null;

  // Playback state
  private playbackState: PlaybackState;
  private isInitialized: boolean = false;
  private patternPart: Tone.Part | null = null;
  private chordPart: Tone.Part | null = null;
  private basslinePart: Tone.Part | null = null;
  private melodyPart: Tone.Part | null = null;

  // Callbacks
  private barCallback: ((bar: number) => void) | null = null;

  // Current preset
  private currentPreset: DubMachinePreset | null = null;

  // Scheduled events tracking
  private scheduledEvents: Map<number, string[]> = new Map();
  private barsPerGeneration: number = 4;

  constructor(config: DubMachineConfig = {}) {
    // Initialize playback state
    this.playbackState = {
      isPlaying: false,
      currentBar: 0,
      currentBeat: 0,
      bpm: config.bpm || 125,
    };

    // Initialize audio components
    this.synthEngine = new SynthEngine(config.maxVoices || 16);
    this.effectsChain = new EffectsChain();
    this.generativeController = new GenerativeController(config);

    // Create master output
    this.masterGain = new Tone.Gain(config.masterVolume ?? 0.7).toDestination();

    // Set up audio routing
    this.setupAudioRouting();

    // Set BPM
    Tone.getTransport().bpm.value = this.playbackState.bpm;

    // Load synth preset if provided
    if (config.synthPreset) {
      this.synthEngine.loadPreset(config.synthPreset);
    } else {
      const defaultPresets = SynthEngine.getPresets();
      if (defaultPresets.length > 0) {
        this.synthEngine.loadPreset(defaultPresets[0]);
      }
    }

    // Setup transport callbacks
    this.setupTransportCallbacks();
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Tone.start();
      console.log('Audio context started');

      // Create analyser node if visualization is enabled
      const context = Tone.getContext().rawContext as AudioContext;
      this.analyser = context.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect analyser to master gain
      this.masterGain.connect(this.analyser);

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  }

  /**
   * Set up audio routing
   */
  private setupAudioRouting(): void {
    // Synth -> Effects Chain -> Master -> Destination
    this.synthEngine.connect(this.effectsChain.getInput() as any);
    this.effectsChain.connectTo(this.masterGain);
  }

  /**
   * Setup transport scheduling callbacks
   */
  private setupTransportCallbacks(): void {
    // Schedule callback on every bar
    Tone.getTransport().scheduleRepeat((_time) => {
      const bars = Tone.Time(Tone.getTransport().position).toBarsBeatsSixteenths();
      const currentBar = parseInt(bars.split(':')[0]);
      this.playbackState.currentBar = currentBar;

      // Trigger user callback if registered
      if (this.barCallback) {
        this.barCallback(currentBar);
      }

      // Apply evolution parameters
      const evolutionState = this.generativeController.getEvolutionState();
      this.applyEvolutionParameters(evolutionState);
    }, '1m');
  }

  /**
   * Apply evolution parameters to effects and synth
   */
  private applyEvolutionParameters(evolutionState: EvolutionState): void {
    const params = evolutionState.parameters;

    // Map filter cutoff to synth filter
    if (params.filterCutoff !== undefined) {
      const filterFreq = this.mapRange(params.filterCutoff, 0, 1, 200, 4000);
      this.synthEngine.updateFilterParams({ frequency: filterFreq });
    }

    // Map resonance from complexity
    if (params.complexity !== undefined) {
      const resonance = this.mapRange(params.complexity, 0, 1, 0.1, 0.7);
      this.synthEngine.updateFilterParams({ resonance });
    }
  }

  /**
   * Map a value from one range to another
   */
  private mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }

  /**
   * Start playback
   */
  async play(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.playbackState.isPlaying) return;

    // Generate initial content
    this.scheduleNextBar();

    // Start transport
    Tone.getTransport().start();
    this.playbackState.isPlaying = true;
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.playbackState.isPlaying) return;

    Tone.getTransport().pause();
    this.synthEngine.allNotesOff();
    this.playbackState.isPlaying = false;
  }

  /**
   * Stop playback and reset
   */
  stop(): void {
    if (!this.playbackState.isPlaying) return;

    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    this.synthEngine.allNotesOff();

    // Clean up scheduled parts
    this.cleanupParts();

    this.playbackState.isPlaying = false;
    this.playbackState.currentBar = 0;
    this.playbackState.currentBeat = 0;
    this.scheduledEvents.clear();
  }

  /**
   * Clean up all scheduled parts
   */
  private cleanupParts(): void {
    if (this.patternPart) {
      this.patternPart.stop();
      this.patternPart.dispose();
      this.patternPart = null;
    }
    if (this.chordPart) {
      this.chordPart.stop();
      this.chordPart.dispose();
      this.chordPart = null;
    }
    if (this.basslinePart) {
      this.basslinePart.stop();
      this.basslinePart.dispose();
      this.basslinePart = null;
    }
    if (this.melodyPart) {
      this.melodyPart.stop();
      this.melodyPart.dispose();
      this.melodyPart = null;
    }
  }

  /**
   * Toggle play/pause
   */
  async togglePlayback(): Promise<void> {
    if (this.playbackState.isPlaying) {
      this.pause();
    } else {
      await this.play();
    }
  }

  /**
   * Schedule next bar of music
   */
  private scheduleNextBar(): void {
    const content = this.generativeController.generateBar(this.playbackState.currentBar);

    // Clean up old parts
    this.cleanupParts();

    // Schedule all musical elements
    this.scheduleDrums(content.drums);
    this.scheduleChords(content);
    this.scheduleBassline(content);
    this.scheduleMelody(content);

    // Schedule next bar generation
    Tone.getTransport().scheduleOnce(() => {
      if (this.playbackState.isPlaying) {
        this.scheduleNextBar();
      }
    }, `+${this.barsPerGeneration}m`);
  }

  /**
   * Schedule drum pattern
   */
  private scheduleDrums(pattern: DrumPattern): void {
    if (this.patternPart) {
      this.patternPart.stop();
      this.patternPart.dispose();
    }

    const events = pattern.hits.map(hit => ({
      time: hit.time,
      note: hit.note,
      velocity: hit.velocity / 127,
    }));

    this.patternPart = new Tone.Part((time, event) => {
      this.synthEngine.noteOn(event.note, event.velocity, time);
      this.synthEngine.noteOff(event.note, time + 0.1);
    }, events).start(0);

    this.patternPart.loop = false;
  }

  /**
   * Schedule chord progression
   */
  private scheduleChords(content: GeneratedContent): void {
    if (!content.chords || !content.chords.chords || content.chords.chords.length === 0) {
      return;
    }

    const events = content.chords.chords.map((chord: any) => ({
      time: chord.startTime || 0,
      notes: chord.notes || [],
      duration: chord.duration || 4,
    }));

    this.chordPart = new Tone.Part((time, event) => {
      event.notes.forEach((note: number) => {
        this.synthEngine.noteOn(note, 0.6, time);
        Tone.getTransport().scheduleOnce(() => {
          this.synthEngine.noteOff(note);
        }, time + event.duration - 0.1);
      });
    }, events).start(0);

    this.chordPart.loop = false;
  }

  /**
   * Schedule bassline
   */
  private scheduleBassline(content: GeneratedContent): void {
    if (!content.bassline || content.bassline.length === 0) {
      return;
    }

    const events = content.bassline.map((note: any) => ({
      time: note.time || 0,
      note: note.note,
      velocity: note.velocity || 0.8,
      duration: note.duration || 0.5,
    }));

    this.basslinePart = new Tone.Part((time, event) => {
      this.synthEngine.noteOn(event.note, event.velocity, time);
      Tone.getTransport().scheduleOnce(() => {
        this.synthEngine.noteOff(event.note);
      }, time + event.duration - 0.05);
    }, events).start(0);

    this.basslinePart.loop = false;
  }

  /**
   * Schedule melody
   */
  private scheduleMelody(content: GeneratedContent): void {
    if (!content.melody || !content.melody.notes || content.melody.notes.length === 0) {
      return;
    }

    const events = content.melody.notes
      .filter((note: any) => !note.rest)
      .map((note: any) => ({
        time: note.time || 0,
        note: note.note,
        velocity: note.velocity || 0.7,
        duration: note.duration || 0.25,
      }));

    this.melodyPart = new Tone.Part((time, event) => {
      this.synthEngine.noteOn(event.note, event.velocity, time);
      Tone.getTransport().scheduleOnce(() => {
        this.synthEngine.noteOff(event.note);
      }, time + event.duration - 0.05);
    }, events).start(0);

    this.melodyPart.loop = false;
  }

  /**
   * Regenerate with new parameters
   */
  regenerate(newSeed?: number): void {
    this.generativeController.regenerate(newSeed);
    this.playbackState.currentBar = 0;
    this.scheduledEvents.clear();

    if (this.playbackState.isPlaying) {
      this.stop();
      this.play();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<GenerativeControllerConfig>): void {
    this.generativeController.updateConfig(config);

    if (config.bpm !== undefined) {
      this.setBPM(config.bpm);
    }
  }

  /**
   * Set BPM
   */
  setBPM(bpm: number): void {
    this.playbackState.bpm = bpm;
    Tone.getTransport().bpm.value = bpm;
    this.generativeController.updateConfig({ bpm });
  }

  /**
   * Get current BPM
   */
  getBPM(): number {
    return this.playbackState.bpm;
  }

  /**
   * Register callback for bar changes
   */
  onBar(callback: (bar: number) => void): void {
    this.barCallback = callback;
  }

  /**
   * Get playback state
   */
  getPlaybackState(): PlaybackState {
    return { ...this.playbackState };
  }

  /**
   * Get evolution state
   */
  getEvolutionState(): EvolutionState {
    return this.generativeController.getEvolutionState();
  }

  /**
   * Get synth engine
   */
  getSynthEngine(): SynthEngine {
    return this.synthEngine;
  }

  /**
   * Get effects chain
   */
  getEffectsChain(): EffectsChain {
    return this.effectsChain;
  }

  /**
   * Get generative controller
   */
  getGenerativeController(): GenerativeController {
    return this.generativeController;
  }

  /**
   * Get analyser node for visualization
   */
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  /**
   * Get playing state
   */
  getIsPlaying(): boolean {
    return this.playbackState.isPlaying;
  }

  /**
   * Get initialized state
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    this.masterGain.gain.rampTo(volume, 0.1);
  }

  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.masterGain.gain.value;
  }

  /**
   * Load a complete preset
   */
  loadPreset(preset: DubMachinePreset): void {
    this.currentPreset = preset;

    // Load synth preset
    if (preset.synthPreset) {
      this.synthEngine.loadPreset(preset.synthPreset);
    }

    // Load generative config
    if (preset.generativeConfig) {
      this.generativeController.updateConfig(preset.generativeConfig);
    }

    // Load effects config
    if (preset.effectsConfig) {
      this.effectsChain.fromJSON(preset.effectsConfig);
    }
  }

  /**
   * Save current state as preset
   */
  savePreset(name: string, description: string, tags: string[] = []): DubMachinePreset {
    return {
      name,
      description,
      synthPreset: this.synthEngine.saveCurrentState(),
      generativeConfig: this.generativeController.getConfig(),
      effectsConfig: this.effectsChain.toJSON(),
      tags,
    };
  }

  /**
   * Get built-in demo presets
   */
  static getDemoPresets(): DubMachinePreset[] {
    const synthPresets = SynthEngine.getPresets();
    const generativePresets = GenerativeController.getBuiltInPresets();

    return [
      {
        name: 'Deep Dub Classic',
        description: 'Classic deep dub techno with heavy reverb and atmospheric pads',
        synthPreset: synthPresets[0], // Dub Techno Chord
        generativeConfig: generativePresets[0].config, // Deep Dub
        effectsConfig: {},
        tags: ['dub', 'deep', 'atmospheric'],
      },
      {
        name: 'Hypnotic Journey',
        description: 'Hypnotic polyrhythmic patterns with evolving textures',
        synthPreset: synthPresets[1], // Deep Bass
        generativeConfig: generativePresets[1].config, // Hypnotic Groove
        effectsConfig: {},
        tags: ['hypnotic', 'polyrhythmic', 'evolving'],
      },
      {
        name: 'Minimal Techno',
        description: 'Stripped down minimal techno with subtle variations',
        synthPreset: synthPresets[0],
        generativeConfig: generativePresets[2].config, // Minimal Tech
        effectsConfig: {},
        tags: ['minimal', 'techno', 'sparse'],
      },
      {
        name: 'Ambient Dub Space',
        description: 'Spacious ambient dub with slow evolution',
        synthPreset: synthPresets[2], // Atmospheric Pad
        generativeConfig: generativePresets[4].config, // Ambient Dub
        effectsConfig: {},
        tags: ['ambient', 'spacious', 'slow'],
      },
      {
        name: 'Broken Rhythms',
        description: 'Syncopated broken beat dub with complex patterns',
        synthPreset: synthPresets[1],
        generativeConfig: generativePresets[3].config, // Broken Dub
        effectsConfig: {},
        tags: ['broken', 'syncopated', 'complex'],
      },
    ];
  }

  /**
   * Export current session
   */
  exportSession(): string {
    const sessionData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      bpm: this.playbackState.bpm,
      synthState: this.synthEngine.saveCurrentState(),
      generativeState: this.generativeController.exportSession(),
      effectsState: this.effectsChain.toJSON(),
      currentPreset: this.currentPreset,
    };

    return JSON.stringify(sessionData, null, 2);
  }

  /**
   * Import session
   */
  importSession(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);

      if (data.bpm) this.setBPM(data.bpm);
      if (data.synthState) this.synthEngine.loadPreset(data.synthState);
      if (data.generativeState) this.generativeController.importSession(data.generativeState);
      if (data.effectsState) this.effectsChain.fromJSON(data.effectsState);
      if (data.currentPreset) this.currentPreset = data.currentPreset;

      console.log('Session imported successfully');
    } catch (error) {
      console.error('Failed to import session:', error);
      throw new Error('Invalid session data');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): GenerativeControllerConfig {
    return this.generativeController.getConfig();
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.synthEngine.dispose();
    this.effectsChain.dispose();
    this.masterGain.dispose();

    if (this.analyser) {
      this.analyser.disconnect();
    }

    this.scheduledEvents.clear();
    this.barCallback = null;
  }
}

export default DubMachine;
