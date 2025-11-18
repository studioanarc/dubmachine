/**
 * MarkovChain.ts
 * Weighted Markov chain melody generator with music theory awareness
 * Generates melodic sequences with dub techno characteristics
 */

import MusicTheory, { NoteName, ScaleType } from './MusicTheory';

export interface MarkovState {
  note: number; // MIDI note
  interval: number; // Interval to next note
  duration: number; // Note duration in beats
}

export interface MarkovTransition {
  nextState: MarkovState;
  weight: number; // Probability weight
}

export interface MarkovChainConfig {
  root: NoteName;
  scale: ScaleType;
  octaveRange: [number, number];
  // Dub tendencies
  stepwiseMotionWeight: number; // Prefer steps over leaps (0-1)
  repeatNoteWeight: number; // Tendency to repeat notes (0-1)
  descendingBias: number; // Prefer descending motion (-1 to 1, 0 = neutral)
  maxInterval: number; // Maximum interval jump in semitones
  minInterval: number; // Minimum interval (0 = allow repeats)
}

export interface MotivicTransform {
  type: 'transpose' | 'retrograde' | 'inversion' | 'augmentation' | 'diminution';
  amount?: number; // For transpose, augmentation, diminution
}

export interface GeneratedNote {
  midi: number;
  duration: number;
  velocity: number;
  time: number; // Start time in beats
}

export class MarkovChain {
  private config: MarkovChainConfig;
  private transitionMatrix: Map<number, MarkovTransition[]>;
  private scaleMidi: number[];
  private rng: () => number;

  constructor(config: MarkovChainConfig, seed?: number) {
    this.config = {
      ...config,
    };

    this.transitionMatrix = new Map();
    this.scaleMidi = MusicTheory.getScaleMidi(
      config.root,
      config.scale,
      config.octaveRange[0],
      config.octaveRange[1]
    );

    // Simple seeded random number generator
    this.rng = this.createSeededRNG(seed);

    this.buildTransitionMatrix();
  }

  /**
   * Create a seeded random number generator
   */
  private createSeededRNG(seed?: number): () => number {
    let state = seed ?? Math.random() * 2147483647;

    return () => {
      // Linear congruential generator
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      return state / 0x7fffffff;
    };
  }

  /**
   * Build the transition probability matrix based on music theory rules
   */
  private buildTransitionMatrix(): void {
    for (const currentNote of this.scaleMidi) {
      const transitions: MarkovTransition[] = [];

      for (const nextNote of this.scaleMidi) {
        const interval = nextNote - currentNote;
        const absInterval = Math.abs(interval);

        // Skip if interval is out of range
        if (absInterval < this.config.minInterval || absInterval > this.config.maxInterval) {
          continue;
        }

        let weight = 1.0;

        // Weight based on interval size (prefer stepwise motion)
        if (absInterval === 0) {
          // Repeat note
          weight *= this.config.repeatNoteWeight;
        } else if (absInterval <= 2) {
          // Stepwise motion (semitone or whole tone)
          weight *= this.config.stepwiseMotionWeight;
        } else if (absInterval <= 4) {
          // Small leaps (minor/major third)
          weight *= 0.5;
        } else if (absInterval <= 7) {
          // Larger leaps (fourth, fifth)
          weight *= 0.3;
        } else {
          // Large leaps
          weight *= 0.1;
        }

        // Apply descending/ascending bias
        if (interval < 0) {
          // Descending
          weight *= 1 + this.config.descendingBias;
        } else if (interval > 0) {
          // Ascending
          weight *= 1 - this.config.descendingBias;
        }

        // Prefer consonant intervals (scale degrees)
        const intervalClass = absInterval % 12;
        if ([0, 2, 4, 5, 7, 9].includes(intervalClass)) {
          // Root, second, third, fourth, fifth, sixth
          weight *= 1.2;
        }

        // Random duration variations
        const durations = [0.25, 0.5, 1, 2];
        for (const duration of durations) {
          transitions.push({
            nextState: {
              note: nextNote,
              interval: interval,
              duration: duration,
            },
            weight: weight * (duration === 1 ? 1.5 : 1), // Prefer quarter notes
          });
        }
      }

      this.transitionMatrix.set(currentNote, transitions);
    }
  }

  /**
   * Generate a melodic sequence
   */
  generateSequence(
    startNote: number,
    length: number,
    velocityRange: [number, number] = [60, 100]
  ): GeneratedNote[] {
    const sequence: GeneratedNote[] = [];
    let currentNote = MusicTheory.quantizeToScale(
      startNote,
      this.config.root,
      this.config.scale,
      this.config.octaveRange
    );
    let currentTime = 0;

    for (let i = 0; i < length; i++) {
      const transitions = this.transitionMatrix.get(currentNote);
      if (!transitions || transitions.length === 0) {
        // Fallback: pick random scale note
        currentNote = this.scaleMidi[Math.floor(this.rng() * this.scaleMidi.length)];
        continue;
      }

      const nextState = this.weightedRandomChoice(transitions);

      // Generate velocity with slight variation
      const velocityBase = velocityRange[0] + this.rng() * (velocityRange[1] - velocityRange[0]);
      const velocityVariation = (this.rng() - 0.5) * 10;
      const velocity = Math.max(
        velocityRange[0],
        Math.min(velocityRange[1], velocityBase + velocityVariation)
      );

      sequence.push({
        midi: currentNote,
        duration: nextState.duration,
        velocity: Math.round(velocity),
        time: currentTime,
      });

      currentTime += nextState.duration;
      currentNote = nextState.note;
    }

    return sequence;
  }

  /**
   * Weighted random choice from transitions
   */
  private weightedRandomChoice(transitions: MarkovTransition[]): MarkovState {
    const totalWeight = transitions.reduce((sum, t) => sum + t.weight, 0);
    let random = this.rng() * totalWeight;

    for (const transition of transitions) {
      random -= transition.weight;
      if (random <= 0) {
        return transition.nextState;
      }
    }

    return transitions[transitions.length - 1].nextState;
  }

  /**
   * Apply motivic transformation to a sequence
   */
  transformMotive(sequence: GeneratedNote[], transform: MotivicTransform): GeneratedNote[] {
    switch (transform.type) {
      case 'transpose':
        return this.transpose(sequence, transform.amount ?? 0);
      case 'retrograde':
        return this.retrograde(sequence);
      case 'inversion':
        return this.inversion(sequence);
      case 'augmentation':
        return this.augmentation(sequence, transform.amount ?? 2);
      case 'diminution':
        return this.diminution(sequence, transform.amount ?? 0.5);
      default:
        return sequence;
    }
  }

  /**
   * Transpose a sequence by semitones
   */
  private transpose(sequence: GeneratedNote[], semitones: number): GeneratedNote[] {
    return sequence.map(note => ({
      ...note,
      midi: MusicTheory.quantizeToScale(
        note.midi + semitones,
        this.config.root,
        this.config.scale,
        this.config.octaveRange
      ),
    }));
  }

  /**
   * Reverse the sequence (retrograde)
   */
  private retrograde(sequence: GeneratedNote[]): GeneratedNote[] {
    const reversed = [...sequence].reverse();
    let time = 0;

    return reversed.map(note => {
      const newNote = { ...note, time };
      time += note.duration;
      return newNote;
    });
  }

  /**
   * Melodic inversion (mirror intervals)
   */
  private inversion(sequence: GeneratedNote[]): GeneratedNote[] {
    if (sequence.length === 0) return sequence;

    const pivot = sequence[0].midi;
    return sequence.map(note => ({
      ...note,
      midi: MusicTheory.quantizeToScale(
        pivot - (note.midi - pivot),
        this.config.root,
        this.config.scale,
        this.config.octaveRange
      ),
    }));
  }

  /**
   * Rhythmic augmentation (slower)
   */
  private augmentation(sequence: GeneratedNote[], factor: number): GeneratedNote[] {
    let time = 0;
    return sequence.map(note => {
      const newNote = {
        ...note,
        duration: note.duration * factor,
        time,
      };
      time += newNote.duration;
      return newNote;
    });
  }

  /**
   * Rhythmic diminution (faster)
   */
  private diminution(sequence: GeneratedNote[], factor: number): GeneratedNote[] {
    return this.augmentation(sequence, factor);
  }

  /**
   * Create a call-and-response pattern
   */
  generateCallResponse(
    callLength: number,
    startNote: number,
    velocityRange: [number, number] = [60, 100]
  ): { call: GeneratedNote[]; response: GeneratedNote[] } {
    const call = this.generateSequence(startNote, callLength, velocityRange);

    // Response is a transformed version of the call
    const transforms: MotivicTransform[] = [
      { type: 'transpose', amount: -7 }, // Descend a fifth
      { type: 'retrograde' },
      { type: 'inversion' },
    ];

    const randomTransform = transforms[Math.floor(this.rng() * transforms.length)];
    let response = this.transformMotive(call, randomTransform);

    // Adjust response timing
    const callDuration = call[call.length - 1].time + call[call.length - 1].duration;
    response = response.map(note => ({
      ...note,
      time: note.time + callDuration,
    }));

    return { call, response };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MarkovChainConfig>): void {
    this.config = { ...this.config, ...config };

    // Rebuild if scale or range changed
    if (config.root || config.scale || config.octaveRange) {
      this.scaleMidi = MusicTheory.getScaleMidi(
        this.config.root,
        this.config.scale,
        this.config.octaveRange[0],
        this.config.octaveRange[1]
      );
      this.buildTransitionMatrix();
    } else {
      this.buildTransitionMatrix();
    }
  }
}

export default MarkovChain;
