/**
 * GenerativeController.ts
 * Main controller that combines all generative systems
 * Provides high-level API for dub techno generation
 */

import { NoteName, ScaleType } from './MusicTheory';
import HarmonyGenerator, { HarmonyConfig, ChordProgression } from './HarmonyGenerator';
// import EuclideanRhythm from './EuclideanRhythm';
import DrumPatternGenerator, { DrumPattern, DrumPatternConfig, DrumStyle } from './DrumPatternGenerator';
import MelodyGenerator, { MelodyConfig, MelodyCharacter, MelodyPhrase } from './MelodyGenerator';
import EvolutionEngine, { EvolutionConfig, Section } from './EvolutionEngine';
import { GeneratedNote } from './MarkovChain';

export interface GenerativeSession {
  id: string;
  seed: number;
  config: GenerativeControllerConfig;
  createdAt: Date;
  state: SessionState;
}

export interface GenerativeControllerConfig {
  // Musical parameters
  bpm: number;
  root: NoteName;
  scale: ScaleType;
  key?: string; // Alternative to root+scale

  // Generation parameters
  complexity: number; // 0-1
  density: number; // 0-1
  energy: number; // 0-1

  // Style parameters
  drumStyle: DrumStyle;
  melodyCharacter: MelodyCharacter;

  // Evolution parameters
  evolutionEnabled: boolean;
  mutationRate: number;
  stabilityVsChaos: number;

  // Structure
  totalBars: number;
  beatsPerBar: number;
}

export interface SessionState {
  currentBar: number;
  isPlaying: boolean;
  lastGeneratedBar: number;
}

export interface GeneratedContent {
  drums: DrumPattern;
  chords: ChordProgression;
  bassline: GeneratedNote[];
  melody: MelodyPhrase;
  arpeggio: GeneratedNote[];
  metadata: GenerationMetadata;
}

export interface GenerationMetadata {
  bar: number;
  section: Section;
  seed: number;
  parameters: {
    density: number;
    complexity: number;
    energy: number;
    [key: string]: number;
  };
  timestamp: Date;
}

export interface Preset {
  name: string;
  description: string;
  config: GenerativeControllerConfig;
  tags: string[];
}

export class GenerativeController {
  private config: GenerativeControllerConfig;
  private seed: number;
  private session: GenerativeSession;

  // Generators
  private harmonyGenerator!: HarmonyGenerator;
  private drumGenerator!: DrumPatternGenerator;
  private melodyGenerator!: MelodyGenerator;
  private evolutionEngine!: EvolutionEngine;
  // private euclidean!: EuclideanRhythm;

  // State
  private generatedContent: Map<number, GeneratedContent>;

  constructor(config: Partial<GenerativeControllerConfig>, seed?: number) {
    this.seed = seed ?? this.generateSeed();

    this.config = {
      bpm: 125,
      root: 'C',
      scale: 'minor',
      complexity: 0.5,
      density: 0.5,
      energy: 0.6,
      drumStyle: 'four_on_floor',
      melodyCharacter: 'atmospheric',
      evolutionEnabled: true,
      mutationRate: 0.3,
      stabilityVsChaos: 0.3,
      totalBars: 128,
      beatsPerBar: 4,
      ...config,
    };

    // Initialize session
    this.session = {
      id: this.generateSessionId(),
      seed: this.seed,
      config: this.config,
      createdAt: new Date(),
      state: {
        currentBar: 0,
        isPlaying: false,
        lastGeneratedBar: -1,
      },
    };

    this.generatedContent = new Map();

    // Initialize generators
    this.initializeGenerators();
  }

  /**
   * Initialize all generator systems
   */
  private initializeGenerators(): void {
    // Harmony generator
    const harmonyConfig: HarmonyConfig = {
      root: this.config.root,
      scale: this.config.scale,
      octave: 3,
      staticHarmonyWeight: 0.7,
      suspendedChordWeight: 0.5,
      extendedChordWeight: 0.6,
    };
    this.harmonyGenerator = new HarmonyGenerator(harmonyConfig, this.seed);

    // Drum generator
    this.drumGenerator = new DrumPatternGenerator(this.seed);

    // Melody generator
    const melodyConfig: MelodyConfig = {
      root: this.config.root,
      scale: this.config.scale,
      octaveRange: [4, 6],
      density: this.config.density,
      character: this.config.melodyCharacter,
      rangeRestriction: 0.7,
      motivicDevelopment: true,
    };
    this.melodyGenerator = new MelodyGenerator(melodyConfig, this.seed);

    // Evolution engine
    const evolutionConfig: EvolutionConfig = {
      mutationRate: this.config.mutationRate,
      mutationAmount: 0.2,
      stabilityVsChaos: this.config.stabilityVsChaos,
      barsPerMutation: 8,
      tendencyMasks: {
        density: { current: this.config.density, target: this.config.density, min: 0.2, max: 0.9, driftSpeed: 0.1, volatility: 0.2 },
        complexity: { current: this.config.complexity, target: this.config.complexity, min: 0.1, max: 0.8, driftSpeed: 0.08, volatility: 0.15 },
        velocity: { current: 0.7, target: 0.7, min: 0.5, max: 1.0, driftSpeed: 0.15, volatility: 0.1 },
        filter: { current: 0.6, target: 0.7, min: 0.3, max: 0.95, driftSpeed: 0.12, volatility: 0.25 },
        reverb: { current: 0.5, target: 0.5, min: 0.2, max: 0.8, driftSpeed: 0.05, volatility: 0.1 },
        delay: { current: 0.4, target: 0.5, min: 0.1, max: 0.9, driftSpeed: 0.08, volatility: 0.2 },
      },
    };
    this.evolutionEngine = new EvolutionEngine(evolutionConfig, this.seed);

    // Euclidean rhythm
    // this.euclidean = new EuclideanRhythm(this.seed);
  }

  /**
   * Generate content for a specific bar
   */
  generateBar(barNumber: number): GeneratedContent {
    // Check if already generated
    if (this.generatedContent.has(barNumber)) {
      return this.generatedContent.get(barNumber)!;
    }

    // Advance evolution engine if enabled
    if (this.config.evolutionEnabled) {
      while (this.evolutionEngine.getState().currentBar < barNumber) {
        this.evolutionEngine.advanceBar();
      }
    }

    // Get current evolution parameters
    const evolutionState = this.evolutionEngine.getState();
    const currentDensity = evolutionState.parameters.density;
    const currentComplexity = evolutionState.parameters.complexity;

    // Generate drum pattern
    const drumConfig: DrumPatternConfig = {
      bpm: this.config.bpm,
      bars: 4,
      beatsPerBar: this.config.beatsPerBar,
      style: this.config.drumStyle,
      complexity: currentComplexity,
      swing: 0.15,
      humanize: 0.1,
    };
    const drums = this.drumGenerator.generatePattern(drumConfig);

    // Generate chord progression
    const chords = this.harmonyGenerator.generateProgression(4, this.config.beatsPerBar);

    // Generate bassline from chords
    const bassline = this.harmonyGenerator.generateBassline(chords, 2);

    // Generate melody
    const melodyLength = this.config.beatsPerBar * 4;
    this.melodyGenerator.updateConfig({ density: currentDensity });
    const melody = this.melodyGenerator.generatePhrase(melodyLength);

    // Generate arpeggio
    const arpeggio = this.harmonyGenerator.generateArpeggio(chords, 16);

    // Create metadata
    const metadata: GenerationMetadata = {
      bar: barNumber,
      section: evolutionState.currentSection,
      seed: this.seed,
      parameters: {
        density: currentDensity,
        complexity: currentComplexity,
        energy: evolutionState.parameters.energy,
      },
      timestamp: new Date(),
    };

    const content: GeneratedContent = {
      drums,
      chords,
      bassline,
      melody,
      arpeggio,
      metadata,
    };

    // Cache generated content
    this.generatedContent.set(barNumber, content);

    return content;
  }

  /**
   * Generate multiple bars
   */
  generateBars(startBar: number, count: number): GeneratedContent[] {
    const content: GeneratedContent[] = [];

    for (let i = 0; i < count; i++) {
      content.push(this.generateBar(startBar + i));
    }

    return content;
  }

  /**
   * Generate complete track
   */
  generateTrack(): GeneratedContent[] {
    const totalBars = Math.floor(this.config.totalBars / 4);
    return this.generateBars(0, totalBars);
  }

  /**
   * Regenerate with new seed
   */
  regenerate(newSeed?: number): void {
    this.seed = newSeed ?? this.generateSeed();
    this.generatedContent.clear();
    this.initializeGenerators();
    this.evolutionEngine.reset();
  }

  /**
   * Update configuration and regenerate
   */
  updateConfig(config: Partial<GenerativeControllerConfig>): void {
    const needsRegeneration =
      config.root !== undefined ||
      config.scale !== undefined ||
      config.bpm !== undefined;

    this.config = { ...this.config, ...config };

    if (needsRegeneration) {
      this.generatedContent.clear();
      this.initializeGenerators();
    } else {
      // Update individual generators
      if (config.density !== undefined || config.melodyCharacter !== undefined) {
        this.melodyGenerator.updateConfig({
          density: config.density,
          character: config.melodyCharacter,
        });
      }

      if (config.mutationRate !== undefined || config.stabilityVsChaos !== undefined) {
        this.evolutionEngine.updateConfig({
          mutationRate: config.mutationRate,
          stabilityVsChaos: config.stabilityVsChaos,
        });
      }
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): GenerativeControllerConfig {
    return { ...this.config };
  }

  /**
   * Get current session
   */
  getSession(): GenerativeSession {
    return {
      ...this.session,
      state: { ...this.session.state },
    };
  }

  /**
   * Get evolution state
   */
  getEvolutionState() {
    return this.evolutionEngine.getState();
  }

  /**
   * Save current configuration as preset
   */
  savePreset(name: string, description: string, tags: string[] = []): Preset {
    return {
      name,
      description,
      config: { ...this.config },
      tags,
    };
  }

  /**
   * Load preset
   */
  loadPreset(preset: Preset): void {
    this.updateConfig(preset.config);
    this.regenerate();
  }

  /**
   * Export session data
   */
  exportSession(): string {
    const data = {
      session: this.session,
      config: this.config,
      seed: this.seed,
      evolutionState: this.evolutionEngine.getState(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import session data
   */
  importSession(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);

      if (data.seed) this.seed = data.seed;
      if (data.config) this.config = data.config;

      this.initializeGenerators();

      if (data.evolutionState) {
        this.evolutionEngine.jumpToBar(data.evolutionState.currentBar);
      }
    } catch (error) {
      console.error('Failed to import session:', error);
      throw new Error('Invalid session data');
    }
  }

  /**
   * Generate a random seed
   */
  private generateSeed(): number {
    return Math.floor(Math.random() * 2147483647);
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get built-in presets
   */
  static getBuiltInPresets(): Preset[] {
    return [
      {
        name: 'Deep Dub',
        description: 'Classic deep dub techno with heavy reverb and minimal progression',
        config: {
          bpm: 122,
          root: 'C',
          scale: 'minor',
          complexity: 0.3,
          density: 0.4,
          energy: 0.5,
          drumStyle: 'four_on_floor',
          melodyCharacter: 'atmospheric',
          evolutionEnabled: true,
          mutationRate: 0.2,
          stabilityVsChaos: 0.2,
          totalBars: 128,
          beatsPerBar: 4,
        },
        tags: ['dub', 'deep', 'atmospheric'],
      },
      {
        name: 'Hypnotic Groove',
        description: 'Repetitive, trance-inducing patterns with polyrhythms',
        config: {
          bpm: 126,
          root: 'A',
          scale: 'minor',
          complexity: 0.6,
          density: 0.7,
          energy: 0.7,
          drumStyle: 'polyrhythmic',
          melodyCharacter: 'hypnotic',
          evolutionEnabled: true,
          mutationRate: 0.4,
          stabilityVsChaos: 0.4,
          totalBars: 128,
          beatsPerBar: 4,
        },
        tags: ['hypnotic', 'polyrhythmic', 'energetic'],
      },
      {
        name: 'Minimal Tech',
        description: 'Stripped down minimal techno with sparse elements',
        config: {
          bpm: 128,
          root: 'G',
          scale: 'minor',
          complexity: 0.2,
          density: 0.3,
          energy: 0.6,
          drumStyle: 'minimal',
          melodyCharacter: 'minimal',
          evolutionEnabled: true,
          mutationRate: 0.3,
          stabilityVsChaos: 0.1,
          totalBars: 128,
          beatsPerBar: 4,
        },
        tags: ['minimal', 'techno', 'sparse'],
      },
      {
        name: 'Broken Dub',
        description: 'Broken beat dub with syncopated rhythms',
        config: {
          bpm: 124,
          root: 'D',
          scale: 'minor',
          complexity: 0.7,
          density: 0.6,
          energy: 0.7,
          drumStyle: 'broken',
          melodyCharacter: 'rhythmic',
          evolutionEnabled: true,
          mutationRate: 0.5,
          stabilityVsChaos: 0.6,
          totalBars: 128,
          beatsPerBar: 4,
        },
        tags: ['broken', 'syncopated', 'complex'],
      },
      {
        name: 'Ambient Dub',
        description: 'Atmospheric ambient dub with evolving textures',
        config: {
          bpm: 118,
          root: 'F',
          scale: 'dorian',
          complexity: 0.4,
          density: 0.4,
          energy: 0.4,
          drumStyle: 'half_time',
          melodyCharacter: 'atmospheric',
          evolutionEnabled: true,
          mutationRate: 0.2,
          stabilityVsChaos: 0.3,
          totalBars: 128,
          beatsPerBar: 4,
        },
        tags: ['ambient', 'atmospheric', 'slow'],
      },
    ];
  }

  /**
   * Get current bar number
   */
  getCurrentBar(): number {
    return this.session.state.currentBar;
  }

  /**
   * Set current bar
   */
  setCurrentBar(bar: number): void {
    this.session.state.currentBar = bar;
    this.evolutionEngine.jumpToBar(bar);
  }

  /**
   * Get seed
   */
  getSeed(): number {
    return this.seed;
  }
}

export default GenerativeController;
