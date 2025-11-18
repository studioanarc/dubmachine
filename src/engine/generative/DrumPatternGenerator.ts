/**
 * DrumPatternGenerator.ts
 * Generates drum patterns for dub techno
 * Combines Euclidean rhythms with pattern evolution
 */

import EuclideanRhythm, { RhythmConfig } from './EuclideanRhythm';

export type DrumVoice = 'kick' | 'snare' | 'clap' | 'hihat_closed' | 'hihat_open' | 'perc1' | 'perc2' | 'perc3';

export interface DrumHit {
  voice: DrumVoice;
  time: number; // Time in beats
  velocity: number;
  note: number; // MIDI note (for drum mapping)
}

export interface DrumPattern {
  hits: DrumHit[];
  duration: number; // Total duration in beats
  bpm: number;
}

export interface DrumPatternConfig {
  bpm: number;
  bars: number; // Number of bars
  beatsPerBar: number; // Time signature numerator
  style: DrumStyle;
  complexity: number; // 0-1, affects density
  swing: number; // 0-1
  humanize: number; // 0-1
}

export type DrumStyle = 'four_on_floor' | 'half_time' | 'broken' | 'minimal' | 'polyrhythmic';

export interface VoiceConfig {
  enabled: boolean;
  rhythmConfig: RhythmConfig;
  velocityRange: [number, number];
  midiNote: number;
}

export interface EvolutionConfig {
  mutationRate: number; // 0-1, probability of mutation per bar
  mutationAmount: number; // 0-1, amount of change
  dropoutProbability: number; // Probability of dropping a hit
  fillProbability: number; // Probability of adding fills
}

// Standard General MIDI drum mapping
const DRUM_MIDI_NOTES: Record<DrumVoice, number> = {
  kick: 36, // C1
  snare: 38, // D1
  clap: 39, // D#1
  hihat_closed: 42, // F#1
  hihat_open: 46, // A#1
  perc1: 60, // C3 - Low conga
  perc2: 62, // D3 - High conga
  perc3: 64, // E3 - Low timbale
};

export class DrumPatternGenerator {
  private euclidean: EuclideanRhythm;
  private rng: () => number;

  constructor(seed?: number) {
    this.euclidean = new EuclideanRhythm(seed);
    this.rng = this.createSeededRNG(seed);
  }

  /**
   * Create a seeded random number generator
   */
  private createSeededRNG(seed?: number): () => number {
    let state = seed ?? Math.random() * 2147483647;

    return () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }

  /**
   * Generate complete drum pattern based on style
   */
  generatePattern(config: DrumPatternConfig): DrumPattern {
    const totalBeats = config.bars * config.beatsPerBar;
    const stepResolution = 16; // 16th notes

    const voiceConfigs = this.getVoiceConfigsForStyle(
      config.style,
      config.complexity,
      config.swing,
      config.humanize
    );

    const allHits: DrumHit[] = [];

    // Generate pattern for each voice
    for (const [voice, voiceConfig] of Object.entries(voiceConfigs)) {
      if (!voiceConfig.enabled) continue;

      const events = this.euclidean.generateEvents(
        voiceConfig.rhythmConfig,
        totalBeats / stepResolution,
        voiceConfig.velocityRange
      );

      for (const event of events) {
        if (event.active) {
          allHits.push({
            voice: voice as DrumVoice,
            time: event.time,
            velocity: event.velocity,
            note: voiceConfig.midiNote,
          });
        }
      }
    }

    // Sort by time
    allHits.sort((a, b) => a.time - b.time);

    return {
      hits: allHits,
      duration: totalBeats,
      bpm: config.bpm,
    };
  }

  /**
   * Get voice configurations based on style
   */
  private getVoiceConfigsForStyle(
    style: DrumStyle,
    complexity: number,
    swing: number,
    humanize: number
  ): Record<DrumVoice, VoiceConfig> {
    const configs: Record<DrumVoice, VoiceConfig> = {
      kick: { enabled: false, rhythmConfig: { pulses: 4, steps: 16 }, velocityRange: [100, 120], midiNote: DRUM_MIDI_NOTES.kick },
      snare: { enabled: false, rhythmConfig: { pulses: 2, steps: 16 }, velocityRange: [90, 110], midiNote: DRUM_MIDI_NOTES.snare },
      clap: { enabled: false, rhythmConfig: { pulses: 2, steps: 16 }, velocityRange: [80, 100], midiNote: DRUM_MIDI_NOTES.clap },
      hihat_closed: { enabled: false, rhythmConfig: { pulses: 8, steps: 16 }, velocityRange: [60, 90], midiNote: DRUM_MIDI_NOTES.hihat_closed },
      hihat_open: { enabled: false, rhythmConfig: { pulses: 2, steps: 16 }, velocityRange: [50, 80], midiNote: DRUM_MIDI_NOTES.hihat_open },
      perc1: { enabled: false, rhythmConfig: { pulses: 3, steps: 16 }, velocityRange: [50, 80], midiNote: DRUM_MIDI_NOTES.perc1 },
      perc2: { enabled: false, rhythmConfig: { pulses: 5, steps: 16 }, velocityRange: [45, 75], midiNote: DRUM_MIDI_NOTES.perc2 },
      perc3: { enabled: false, rhythmConfig: { pulses: 7, steps: 16 }, velocityRange: [40, 70], midiNote: DRUM_MIDI_NOTES.perc3 },
    };

    switch (style) {
      case 'four_on_floor':
        configs.kick = {
          enabled: true,
          rhythmConfig: { pulses: 4, steps: 16, probability: 0.98, swing: 0, humanize },
          velocityRange: [110, 127],
          midiNote: DRUM_MIDI_NOTES.kick,
        };
        configs.snare = {
          enabled: true,
          rhythmConfig: { pulses: 2, steps: 16, rotation: 4, probability: 0.95, swing: 0, humanize },
          velocityRange: [90, 110],
          midiNote: DRUM_MIDI_NOTES.snare,
        };
        configs.hihat_closed = {
          enabled: true,
          rhythmConfig: { pulses: Math.round(8 + complexity * 8), steps: 16, probability: 0.85, swing, humanize },
          velocityRange: [60, 90],
          midiNote: DRUM_MIDI_NOTES.hihat_closed,
        };
        if (complexity > 0.5) {
          configs.perc1 = {
            enabled: true,
            rhythmConfig: { pulses: Math.round(3 + complexity * 4), steps: 16, rotation: 2, probability: 0.7, swing, humanize },
            velocityRange: [50, 75],
            midiNote: DRUM_MIDI_NOTES.perc1,
          };
        }
        break;

      case 'half_time':
        configs.kick = {
          enabled: true,
          rhythmConfig: { pulses: 2, steps: 16, rotation: 0, probability: 0.98, swing: 0, humanize },
          velocityRange: [115, 127],
          midiNote: DRUM_MIDI_NOTES.kick,
        };
        configs.snare = {
          enabled: true,
          rhythmConfig: { pulses: 1, steps: 16, rotation: 8, probability: 0.95, swing: 0, humanize },
          velocityRange: [100, 120],
          midiNote: DRUM_MIDI_NOTES.snare,
        };
        configs.hihat_closed = {
          enabled: true,
          rhythmConfig: { pulses: Math.round(6 + complexity * 6), steps: 16, probability: 0.8, swing, humanize },
          velocityRange: [55, 85],
          midiNote: DRUM_MIDI_NOTES.hihat_closed,
        };
        if (complexity > 0.4) {
          configs.perc2 = {
            enabled: true,
            rhythmConfig: { pulses: 5, steps: 16, rotation: 3, probability: 0.6, swing, humanize },
            velocityRange: [45, 70],
            midiNote: DRUM_MIDI_NOTES.perc2,
          };
        }
        break;

      case 'broken':
        configs.kick = {
          enabled: true,
          rhythmConfig: { pulses: Math.round(3 + complexity * 2), steps: 16, rotation: 0, probability: 0.9, swing, humanize },
          velocityRange: [105, 125],
          midiNote: DRUM_MIDI_NOTES.kick,
        };
        configs.snare = {
          enabled: true,
          rhythmConfig: { pulses: Math.round(2 + complexity), steps: 16, rotation: 5, probability: 0.85, swing, humanize },
          velocityRange: [85, 105],
          midiNote: DRUM_MIDI_NOTES.snare,
        };
        configs.hihat_closed = {
          enabled: true,
          rhythmConfig: { pulses: Math.round(7 + complexity * 5), steps: 16, rotation: 1, probability: 0.75, swing: swing * 1.2, humanize },
          velocityRange: [60, 85],
          midiNote: DRUM_MIDI_NOTES.hihat_closed,
        };
        break;

      case 'minimal':
        configs.kick = {
          enabled: true,
          rhythmConfig: { pulses: 4, steps: 16, probability: 0.95, swing: 0, humanize },
          velocityRange: [110, 125],
          midiNote: DRUM_MIDI_NOTES.kick,
        };
        configs.hihat_closed = {
          enabled: true,
          rhythmConfig: { pulses: Math.round(4 + complexity * 4), steps: 16, probability: 0.7, swing, humanize },
          velocityRange: [50, 75],
          midiNote: DRUM_MIDI_NOTES.hihat_closed,
        };
        if (complexity > 0.6) {
          configs.perc1 = {
            enabled: true,
            rhythmConfig: { pulses: 3, steps: 16, rotation: 7, probability: 0.5, swing, humanize },
            velocityRange: [40, 65],
            midiNote: DRUM_MIDI_NOTES.perc1,
          };
        }
        break;

      case 'polyrhythmic':
        configs.kick = {
          enabled: true,
          rhythmConfig: { pulses: 5, steps: 16, rotation: 0, probability: 0.95, swing: 0, humanize },
          velocityRange: [105, 120],
          midiNote: DRUM_MIDI_NOTES.kick,
        };
        configs.snare = {
          enabled: true,
          rhythmConfig: { pulses: 3, steps: 16, rotation: 2, probability: 0.9, swing: 0, humanize },
          velocityRange: [85, 105],
          midiNote: DRUM_MIDI_NOTES.snare,
        };
        configs.hihat_closed = {
          enabled: true,
          rhythmConfig: { pulses: 11, steps: 16, rotation: 1, probability: 0.8, swing, humanize },
          velocityRange: [55, 80],
          midiNote: DRUM_MIDI_NOTES.hihat_closed,
        };
        configs.perc1 = {
          enabled: true,
          rhythmConfig: { pulses: 7, steps: 16, rotation: 4, probability: 0.7, swing, humanize },
          velocityRange: [50, 75],
          midiNote: DRUM_MIDI_NOTES.perc1,
        };
        configs.perc2 = {
          enabled: true,
          rhythmConfig: { pulses: 9, steps: 16, rotation: 6, probability: 0.65, swing, humanize },
          velocityRange: [45, 70],
          midiNote: DRUM_MIDI_NOTES.perc2,
        };
        break;
    }

    return configs;
  }

  /**
   * Evolve a pattern over time
   */
  evolvePattern(
    currentPattern: DrumPattern,
    config: DrumPatternConfig,
    evolution: EvolutionConfig
  ): DrumPattern {
    const hits = [...currentPattern.hits];

    // Apply mutations
    for (let i = hits.length - 1; i >= 0; i--) {
      // Random dropout
      if (this.rng() < evolution.dropoutProbability) {
        hits.splice(i, 1);
        continue;
      }

      // Velocity variation
      if (this.rng() < evolution.mutationRate) {
        const variation = (this.rng() - 0.5) * 20 * evolution.mutationAmount;
        hits[i].velocity = Math.max(0, Math.min(127, hits[i].velocity + variation));
      }

      // Timing variation
      if (this.rng() < evolution.mutationRate) {
        const timeVariation = (this.rng() - 0.5) * 0.1 * evolution.mutationAmount;
        hits[i].time = Math.max(0, hits[i].time + timeVariation);
      }
    }

    // Add fills
    if (this.rng() < evolution.fillProbability) {
      const fillHits = this.generateFill(config, currentPattern.duration);
      hits.push(...fillHits);
    }

    // Sort by time
    hits.sort((a, b) => a.time - b.time);

    return {
      ...currentPattern,
      hits,
    };
  }

  /**
   * Generate a fill pattern
   */
  private generateFill(config: DrumPatternConfig, startTime: number): DrumHit[] {
    const fills: DrumHit[] = [];
    const fillDuration = config.beatsPerBar; // One bar fill
    const fillSteps = 8; // 8th note fills

    // Generate rapid hits on snare/perc
    for (let i = 0; i < fillSteps; i++) {
      if (this.rng() > 0.3) {
        // 70% chance per step
        const voice: DrumVoice = this.rng() > 0.5 ? 'snare' : 'perc1';
        fills.push({
          voice,
          time: startTime + (i / fillSteps) * fillDuration,
          velocity: Math.round(70 + this.rng() * 30),
          note: DRUM_MIDI_NOTES[voice],
        });
      }
    }

    return fills;
  }

  /**
   * Generate ghost notes (soft hits between main hits)
   */
  addGhostNotes(pattern: DrumPattern, probability: number = 0.3): DrumPattern {
    const ghostHits: DrumHit[] = [];

    for (let i = 0; i < pattern.hits.length - 1; i++) {
      const currentHit = pattern.hits[i];
      const nextHit = pattern.hits[i + 1];

      const timeDiff = nextHit.time - currentHit.time;

      // Add ghost note between hits if there's space
      if (timeDiff > 0.25 && this.rng() < probability) {
        ghostHits.push({
          voice: currentHit.voice,
          time: currentHit.time + timeDiff / 2,
          velocity: Math.round(currentHit.velocity * 0.5),
          note: currentHit.note,
        });
      }
    }

    const allHits = [...pattern.hits, ...ghostHits];
    allHits.sort((a, b) => a.time - b.time);

    return {
      ...pattern,
      hits: allHits,
    };
  }

  /**
   * Create a breakdown section (reduced density)
   */
  generateBreakdown(config: DrumPatternConfig): DrumPattern {
    const breakdownConfig: DrumPatternConfig = {
      ...config,
      style: 'minimal',
      complexity: Math.max(0, config.complexity - 0.4),
    };

    return this.generatePattern(breakdownConfig);
  }

  /**
   * Create a buildup section (increasing density)
   */
  generateBuildup(config: DrumPatternConfig, stages: number = 4): DrumPattern[] {
    const patterns: DrumPattern[] = [];

    for (let i = 0; i < stages; i++) {
      const complexityIncrease = (i / stages) * 0.5;
      const stageConfig: DrumPatternConfig = {
        ...config,
        complexity: Math.min(1, config.complexity + complexityIncrease),
        bars: 4,
      };

      patterns.push(this.generatePattern(stageConfig));
    }

    return patterns;
  }

  /**
   * Get pattern with specific voice isolated
   */
  isolateVoice(pattern: DrumPattern, voice: DrumVoice): DrumPattern {
    return {
      ...pattern,
      hits: pattern.hits.filter(hit => hit.voice === voice),
    };
  }

  /**
   * Combine multiple patterns
   */
  combinePatterns(patterns: DrumPattern[]): DrumPattern {
    const allHits: DrumHit[] = [];
    let maxDuration = 0;
    let bpm = patterns[0]?.bpm || 120;

    for (const pattern of patterns) {
      allHits.push(...pattern.hits);
      maxDuration = Math.max(maxDuration, pattern.duration);
    }

    allHits.sort((a, b) => a.time - b.time);

    return {
      hits: allHits,
      duration: maxDuration,
      bpm,
    };
  }
}

export default DrumPatternGenerator;
