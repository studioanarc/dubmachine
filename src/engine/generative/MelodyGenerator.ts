/**
 * MelodyGenerator.ts
 * High-level melody generation for dub techno
 * Uses MarkovChain internally with additional control layers
 */

import MarkovChain, { MarkovChainConfig, GeneratedNote, MotivicTransform } from './MarkovChain';
import MusicTheory, { NoteName, ScaleType } from './MusicTheory';
import { GeneratedChord } from './HarmonyGenerator';

export interface MelodyConfig {
  root: NoteName;
  scale: ScaleType;
  octaveRange: [number, number];
  density: number; // 0-1, how many notes vs rests
  character: MelodyCharacter;
  rangeRestriction: number; // 0-1, how much to restrict range
  motivicDevelopment: boolean; // Use motific transformations
}

export type MelodyCharacter =
  | 'atmospheric' // Long, sparse, ambient
  | 'rhythmic' // Short, staccato, percussive
  | 'flowing' // Smooth, legato, continuous
  | 'minimal' // Very sparse, simple
  | 'hypnotic'; // Repetitive, trance-like

export interface MelodyPhrase {
  notes: GeneratedNote[];
  duration: number;
  character: MelodyCharacter;
}

export interface CallResponseConfig {
  phraseLength: number; // Length of call phrase in beats
  numPairs: number; // Number of call-response pairs
  responseType: 'echo' | 'answer' | 'variation';
}

export interface CounterpointConfig {
  mainMelody: GeneratedNote[];
  interval: number; // Harmonic interval (semitones)
  rhythmicOffset: number; // Time offset in beats
  invertMotion: boolean; // Counter-melody moves opposite direction
}

export class MelodyGenerator {
  private markovChain: MarkovChain;
  private config: MelodyConfig;
  private rng: () => number;

  constructor(config: MelodyConfig, seed?: number) {
    this.config = {
      ...config,
    };

    this.rng = this.createSeededRNG(seed);

    // Configure Markov chain based on character
    const markovConfig = this.buildMarkovConfig(this.config);
    this.markovChain = new MarkovChain(markovConfig, seed);
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
   * Build Markov chain configuration based on melody character
   */
  private buildMarkovConfig(config: MelodyConfig): MarkovChainConfig {
    const baseConfig: MarkovChainConfig = {
      root: config.root,
      scale: config.scale,
      octaveRange: config.octaveRange,
      stepwiseMotionWeight: 0.7,
      repeatNoteWeight: 0.3,
      descendingBias: -0.1,
      maxInterval: 7,
      minInterval: 0,
    };

    switch (config.character) {
      case 'atmospheric':
        return {
          ...baseConfig,
          stepwiseMotionWeight: 0.6,
          repeatNoteWeight: 0.5,
          descendingBias: -0.2,
          maxInterval: 12,
        };

      case 'rhythmic':
        return {
          ...baseConfig,
          stepwiseMotionWeight: 0.5,
          repeatNoteWeight: 0.4,
          descendingBias: 0,
          maxInterval: 5,
        };

      case 'flowing':
        return {
          ...baseConfig,
          stepwiseMotionWeight: 0.8,
          repeatNoteWeight: 0.2,
          descendingBias: -0.05,
          maxInterval: 7,
        };

      case 'minimal':
        return {
          ...baseConfig,
          stepwiseMotionWeight: 0.9,
          repeatNoteWeight: 0.6,
          descendingBias: 0,
          maxInterval: 4,
        };

      case 'hypnotic':
        return {
          ...baseConfig,
          stepwiseMotionWeight: 0.7,
          repeatNoteWeight: 0.7,
          descendingBias: 0,
          maxInterval: 3,
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Generate a melodic phrase
   */
  generatePhrase(lengthInBeats: number, startNote?: number): MelodyPhrase {
    // Calculate number of notes based on density and character
    const notesPerBeat = this.getNotesPerBeat();
    const maxNotes = Math.floor(lengthInBeats * notesPerBeat);

    // Get starting note
    const start = startNote ?? this.getStartingNote();

    // Generate using Markov chain
    let notes = this.markovChain.generateSequence(start, maxNotes);

    // Apply density (add rests)
    notes = this.applyDensity(notes, this.config.density);

    // Apply range restriction
    if (this.config.rangeRestriction > 0) {
      notes = this.restrictRange(notes, this.config.rangeRestriction);
    }

    // Apply character-specific articulation
    notes = this.applyArticulation(notes, this.config.character);

    // Adjust to fit exact length
    notes = this.fitToLength(notes, lengthInBeats);

    return {
      notes,
      duration: lengthInBeats,
      character: this.config.character,
    };
  }

  /**
   * Get notes per beat based on character
   */
  private getNotesPerBeat(): number {
    switch (this.config.character) {
      case 'atmospheric':
        return 0.5; // 1 note per 2 beats
      case 'rhythmic':
        return 2; // 2 notes per beat
      case 'flowing':
        return 1.5;
      case 'minimal':
        return 0.25; // Very sparse
      case 'hypnotic':
        return 1;
      default:
        return 1;
    }
  }

  /**
   * Get starting note for phrase
   */
  private getStartingNote(): number {
    const scaleMidi = MusicTheory.getScaleMidi(
      this.config.root,
      this.config.scale,
      this.config.octaveRange[0],
      this.config.octaveRange[1]
    );

    // Prefer middle of range
    const middleIndex = Math.floor(scaleMidi.length / 2);
    const variation = Math.floor((this.rng() - 0.5) * 4);
    const index = Math.max(0, Math.min(scaleMidi.length - 1, middleIndex + variation));

    return scaleMidi[index];
  }

  /**
   * Apply density by removing notes (creating rests)
   */
  private applyDensity(notes: GeneratedNote[], density: number): GeneratedNote[] {
    return notes.filter(() => this.rng() < density);
  }

  /**
   * Restrict melodic range
   */
  private restrictRange(notes: GeneratedNote[], restriction: number): GeneratedNote[] {
    if (notes.length === 0) return notes;

    const midiValues = notes.map(n => n.midi);
    const min = Math.min(...midiValues);
    const max = Math.max(...midiValues);
    const range = max - min;

    const targetRange = range * (1 - restriction * 0.5);
    const center = min + range / 2;

    return notes.map(note => {
      const distanceFromCenter = note.midi - center;
      const scaledDistance = distanceFromCenter * (targetRange / range);
      const newMidi = Math.round(center + scaledDistance);

      return {
        ...note,
        midi: MusicTheory.quantizeToScale(
          newMidi,
          this.config.root,
          this.config.scale,
          this.config.octaveRange
        ),
      };
    });
  }

  /**
   * Apply articulation based on character
   */
  private applyArticulation(notes: GeneratedNote[], character: MelodyCharacter): GeneratedNote[] {
    return notes.map(note => {
      let duration = note.duration;
      let velocity = note.velocity;

      switch (character) {
        case 'atmospheric':
          duration *= 1.5; // Longer notes
          velocity = Math.round(velocity * 0.7); // Softer
          break;

        case 'rhythmic':
          duration *= 0.6; // Shorter, staccato
          velocity = Math.round(velocity * 1.1); // Punchier
          break;

        case 'flowing':
          duration *= 1.2; // Slightly longer, legato
          break;

        case 'minimal':
          duration *= 2; // Very long notes
          velocity = Math.round(velocity * 0.6);
          break;

        case 'hypnotic':
          // Keep mostly as-is, very consistent
          velocity = Math.round(80 + (velocity - 80) * 0.3); // Less velocity variation
          break;
      }

      return {
        ...note,
        duration: Math.max(0.125, duration),
        velocity: Math.max(1, Math.min(127, velocity)),
      };
    });
  }

  /**
   * Fit notes to exact length
   */
  private fitToLength(notes: GeneratedNote[], targetLength: number): GeneratedNote[] {
    if (notes.length === 0) return notes;

    const currentLength = notes[notes.length - 1].time + notes[notes.length - 1].duration;
    const ratio = targetLength / currentLength;

    return notes.map(note => ({
      ...note,
      time: note.time * ratio,
      duration: note.duration * ratio,
    }));
  }

  /**
   * Generate call-and-response pattern
   */
  generateCallResponse(config: CallResponseConfig): MelodyPhrase[] {
    const phrases: MelodyPhrase[] = [];

    for (let i = 0; i < config.numPairs; i++) {
      // Generate call
      const call = this.generatePhrase(config.phraseLength);
      phrases.push(call);

      // Generate response based on type
      let response: MelodyPhrase;

      switch (config.responseType) {
        case 'echo':
          // Transpose and repeat
          response = this.createEcho(call);
          break;

        case 'answer':
          // Generate complementary phrase
          response = this.createAnswer(call);
          break;

        case 'variation':
          // Transform the call
          response = this.createVariation(call);
          break;
      }

      // Offset response timing
      response.notes = response.notes.map(note => ({
        ...note,
        time: note.time + config.phraseLength,
      }));

      phrases.push(response);
    }

    return phrases;
  }

  /**
   * Create echo response
   */
  private createEcho(call: MelodyPhrase): MelodyPhrase {
    const transposition = this.rng() < 0.5 ? -7 : -5; // Fifth or fourth down
    const notes = this.markovChain.transformMotive(call.notes, {
      type: 'transpose',
      amount: transposition,
    });

    return {
      notes,
      duration: call.duration,
      character: call.character,
    };
  }

  /**
   * Create answer response
   */
  private createAnswer(call: MelodyPhrase): MelodyPhrase {
    // Generate new phrase that ends on a resolution
    const lastNote = call.notes[call.notes.length - 1];
    const rootMidi = MusicTheory.noteToMidi(this.config.root, lastNote ? Math.floor(lastNote.midi / 12) - 1 : 4);

    return this.generatePhrase(call.duration, rootMidi);
  }

  /**
   * Create variation response
   */
  private createVariation(call: MelodyPhrase): MelodyPhrase {
    const transforms: MotivicTransform[] = [
      { type: 'retrograde' },
      { type: 'inversion' },
      { type: 'augmentation', amount: 1.5 },
      { type: 'diminution', amount: 0.75 },
    ];

    const transform = transforms[Math.floor(this.rng() * transforms.length)];
    const notes = this.markovChain.transformMotive(call.notes, transform);

    return {
      notes,
      duration: call.duration,
      character: call.character,
    };
  }

  /**
   * Generate melody that follows chord progression
   */
  generateHarmonicMelody(chords: GeneratedChord[], notesPerChord: number = 4): GeneratedNote[] {
    const melody: GeneratedNote[] = [];
    let currentTime = 0;

    for (const chord of chords) {
      const chordDuration = chord.duration;
      const noteDuration = chordDuration / notesPerChord;

      // Generate notes from chord tones
      for (let i = 0; i < notesPerChord; i++) {
        if (this.rng() < this.config.density) {
          const chordNote = chord.midi[Math.floor(this.rng() * chord.midi.length)];

          melody.push({
            midi: chordNote,
            duration: noteDuration * 0.9,
            velocity: Math.round(60 + this.rng() * 30),
            time: currentTime,
          });
        }

        currentTime += noteDuration;
      }
    }

    return melody;
  }

  /**
   * Generate counterpoint melody
   */
  generateCounterpoint(config: CounterpointConfig): GeneratedNote[] {
    const counterMelody: GeneratedNote[] = [];

    for (const note of config.mainMelody) {
      let counterMidi = note.midi;

      // Apply interval
      counterMidi += config.interval;

      // Invert motion if configured
      if (config.invertMotion) {
        // This is simplified - true counterpoint would track melodic direction
        counterMidi = note.midi - (counterMidi - note.midi);
      }

      // Quantize to scale
      counterMidi = MusicTheory.quantizeToScale(
        counterMidi,
        this.config.root,
        this.config.scale,
        this.config.octaveRange
      );

      counterMelody.push({
        midi: counterMidi,
        duration: note.duration,
        velocity: Math.round(note.velocity * 0.8), // Softer counterpoint
        time: note.time + config.rhythmicOffset,
      });
    }

    return counterMelody;
  }

  /**
   * Generate ostinato (repeated pattern)
   */
  generateOstinato(patternLength: number, repetitions: number): MelodyPhrase {
    const pattern = this.generatePhrase(patternLength);
    const notes: GeneratedNote[] = [];

    for (let i = 0; i < repetitions; i++) {
      const offset = i * patternLength;
      const repeatedNotes = pattern.notes.map(note => ({
        ...note,
        time: note.time + offset,
        // Slight variation in velocity
        velocity: Math.round(note.velocity + (this.rng() - 0.5) * 10),
      }));

      notes.push(...repeatedNotes);
    }

    return {
      notes,
      duration: patternLength * repetitions,
      character: 'hypnotic',
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MelodyConfig>): void {
    this.config = { ...this.config, ...config };

    // Rebuild Markov chain if necessary
    if (config.root || config.scale || config.octaveRange || config.character) {
      const markovConfig = this.buildMarkovConfig(this.config);
      this.markovChain.updateConfig(markovConfig);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): MelodyConfig {
    return { ...this.config };
  }
}

export default MelodyGenerator;
