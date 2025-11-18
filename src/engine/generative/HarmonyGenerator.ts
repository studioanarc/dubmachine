/**
 * HarmonyGenerator.ts
 * Chord progression generator with dub techno focus
 * Emphasizes drone-based, static harmony with occasional movement
 */

import MusicTheory, { NoteName, ScaleType, ChordType } from './MusicTheory';

export interface HarmonyConfig {
  root: NoteName;
  scale: ScaleType;
  octave: number;
  // Dub characteristics
  staticHarmonyWeight: number; // Tendency to stay on tonic (0-1)
  suspendedChordWeight: number; // Preference for sus chords (0-1)
  extendedChordWeight: number; // Preference for add9/add11 (0-1)
  allowedChordTypes?: ChordType[];
}

export interface ChordProgression {
  chords: GeneratedChord[];
  totalDuration: number;
}

export interface GeneratedChord {
  root: NoteName;
  type: ChordType;
  notes: NoteName[];
  midi: number[];
  duration: number; // In beats
  time: number; // Start time in beats
  inversion: number;
}

export interface VoiceLeadingConfig {
  maxVoiceMovement: number; // Maximum semitones any voice should move
  preferSmoothVoiceLeading: boolean;
}

/**
 * Weighted probability matrix for chord progressions
 * Rows = from chord, Columns = to chord
 * Heavily weighted toward tonic (I) for dub techno
 */
const DUB_PROGRESSION_WEIGHTS: Record<number, Record<number, number>> = {
  1: { 1: 0.6, 2: 0.05, 3: 0.05, 4: 0.15, 5: 0.1, 6: 0.05 }, // I -> mostly stays on I
  2: { 1: 0.3, 2: 0.2, 3: 0.1, 4: 0.1, 5: 0.2, 6: 0.1 }, // ii
  3: { 1: 0.2, 2: 0.1, 3: 0.2, 4: 0.15, 5: 0.15, 6: 0.2 }, // iii
  4: { 1: 0.4, 2: 0.1, 3: 0.05, 4: 0.2, 5: 0.2, 6: 0.05 }, // IV -> often to I or V
  5: { 1: 0.5, 2: 0.1, 3: 0.05, 4: 0.15, 5: 0.15, 6: 0.05 }, // V -> strong resolution to I
  6: { 1: 0.3, 2: 0.15, 3: 0.1, 4: 0.2, 5: 0.15, 6: 0.1 }, // vi
};

export class HarmonyGenerator {
  private config: HarmonyConfig;
  private rng: () => number;
  private currentDegree: number;
  private previousChordMidi: number[] | null;

  constructor(config: HarmonyConfig, seed?: number) {
    this.config = {
      allowedChordTypes: MusicTheory.getDubChordTypes(),
      ...config,
    };

    this.rng = this.createSeededRNG(seed);
    this.currentDegree = 1; // Start on tonic
    this.previousChordMidi = null;
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
   * Generate a chord progression
   */
  generateProgression(numChords: number, chordDuration: number = 4): ChordProgression {
    const chords: GeneratedChord[] = [];
    let currentTime = 0;

    for (let i = 0; i < numChords; i++) {
      const chord = this.generateNextChord(chordDuration, currentTime);
      chords.push(chord);
      currentTime += chord.duration;
    }

    return {
      chords,
      totalDuration: currentTime,
    };
  }

  /**
   * Generate the next chord in the progression
   */
  private generateNextChord(duration: number, time: number): GeneratedChord {
    // Choose next scale degree based on probability matrix
    const nextDegree = this.chooseNextDegree();
    this.currentDegree = nextDegree;

    // Get the root note for this degree
    const scale = MusicTheory.getScale(this.config.root, this.config.scale);
    const chordRoot = scale[(nextDegree - 1) % scale.length];

    // Choose chord type based on dub preferences
    const chordType = this.chooseChordType(nextDegree);

    // Get chord notes
    const notes = MusicTheory.getChord(chordRoot, chordType);

    // Choose inversion
    const inversion = this.rng() < 0.7 ? 0 : Math.floor(this.rng() * 3);

    // Get MIDI notes with voice leading if previous chord exists
    let midi: number[];
    if (this.previousChordMidi) {
      const baseMidi = MusicTheory.getChordMidi(chordRoot, chordType, this.config.octave, inversion);
      midi = MusicTheory.voiceLead(this.previousChordMidi, baseMidi);
    } else {
      midi = MusicTheory.getChordMidi(chordRoot, chordType, this.config.octave, inversion);
    }

    this.previousChordMidi = midi;

    return {
      root: chordRoot,
      type: chordType,
      notes,
      midi,
      duration,
      time,
      inversion,
    };
  }

  /**
   * Choose next scale degree based on probability weights
   */
  private chooseNextDegree(): number {
    const weights = DUB_PROGRESSION_WEIGHTS[this.currentDegree] || DUB_PROGRESSION_WEIGHTS[1];

    // Apply static harmony weight (increase chance of staying on I)
    const adjustedWeights = { ...weights };
    if (this.currentDegree === 1) {
      adjustedWeights[1] = adjustedWeights[1] * (1 + this.config.staticHarmonyWeight);
    }

    // Weighted random selection
    const totalWeight = Object.values(adjustedWeights).reduce((sum, w) => sum + w, 0);
    let random = this.rng() * totalWeight;

    for (const [degree, weight] of Object.entries(adjustedWeights)) {
      random -= weight;
      if (random <= 0) {
        return parseInt(degree);
      }
    }

    return 1; // Default to tonic
  }

  /**
   * Choose chord type based on dub preferences
   */
  private chooseChordType(degree: number): ChordType {
    const allowedTypes = this.config.allowedChordTypes || MusicTheory.getDubChordTypes();

    // Build weighted list of chord types
    const weights: Record<ChordType, number> = {} as any;

    for (const type of allowedTypes) {
      let weight = 1.0;

      // Prefer suspended and extended chords for dub
      if (['sus2', 'sus4'].includes(type)) {
        weight *= 1 + this.config.suspendedChordWeight;
      }
      if (['add9', 'add11', 'madd9'].includes(type)) {
        weight *= 1 + this.config.extendedChordWeight;
      }

      // Adjust based on scale degree
      if (degree === 1) {
        // Tonic - prefer sus and add chords
        if (['sus2', 'sus4', 'add9'].includes(type)) weight *= 1.5;
      } else if (degree === 5) {
        // Dominant - prefer 7th chords
        if (type === '7') weight *= 1.3;
      }

      weights[type] = weight;
    }

    // Weighted random selection
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    let random = this.rng() * totalWeight;

    for (const [type, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        return type as ChordType;
      }
    }

    return allowedTypes[0]; // Default
  }

  /**
   * Generate a drone/pedal tone progression (single chord held)
   */
  generateDrone(duration: number): ChordProgression {
    const chordType = this.chooseChordType(1);
    const notes = MusicTheory.getChord(this.config.root, chordType);
    const midi = MusicTheory.getChordMidi(this.config.root, chordType, this.config.octave, 0);

    // Add pedal tone in bass (root note an octave lower)
    const pedalTone = MusicTheory.noteToMidi(this.config.root, this.config.octave - 1);
    midi.unshift(pedalTone);

    const chord: GeneratedChord = {
      root: this.config.root,
      type: chordType,
      notes,
      midi,
      duration,
      time: 0,
      inversion: 0,
    };

    return {
      chords: [chord],
      totalDuration: duration,
    };
  }

  /**
   * Generate a two-chord oscillation (common in dub techno)
   */
  generateOscillation(
    chordDuration: number,
    repetitions: number
  ): ChordProgression {
    const chords: GeneratedChord[] = [];
    let currentTime = 0;

    // Choose two chords (usually I and IV or I and V)
    const degrees = this.rng() < 0.5 ? [1, 4] : [1, 5];

    for (let i = 0; i < repetitions * 2; i++) {
      const degree = degrees[i % 2];
      const scale = MusicTheory.getScale(this.config.root, this.config.scale);
      const chordRoot = scale[(degree - 1) % scale.length];
      const chordType = this.chooseChordType(degree);
      const notes = MusicTheory.getChord(chordRoot, chordType);

      let midi: number[];
      if (this.previousChordMidi) {
        const baseMidi = MusicTheory.getChordMidi(chordRoot, chordType, this.config.octave, 0);
        midi = MusicTheory.voiceLead(this.previousChordMidi, baseMidi);
      } else {
        midi = MusicTheory.getChordMidi(chordRoot, chordType, this.config.octave, 0);
      }

      this.previousChordMidi = midi;

      chords.push({
        root: chordRoot,
        type: chordType,
        notes,
        midi,
        duration: chordDuration,
        time: currentTime,
        inversion: 0,
      });

      currentTime += chordDuration;
    }

    return {
      chords,
      totalDuration: currentTime,
    };
  }

  /**
   * Generate bass notes from chord progression (root notes)
   */
  generateBassline(progression: ChordProgression, octave: number = 2): GeneratedNote[] {
    return progression.chords.map(chord => ({
      midi: MusicTheory.noteToMidi(chord.root, octave),
      duration: chord.duration,
      velocity: 100,
      time: chord.time,
    }));
  }

  /**
   * Generate arpeggiated pattern from chord progression
   */
  generateArpeggio(
    progression: ChordProgression,
    subdivisions: number = 8
  ): GeneratedNote[] {
    const notes: GeneratedNote[] = [];

    for (const chord of progression.chords) {
      const stepDuration = chord.duration / subdivisions;

      for (let i = 0; i < subdivisions; i++) {
        const noteIndex = i % chord.midi.length;
        notes.push({
          midi: chord.midi[noteIndex],
          duration: stepDuration * 0.9, // Slight gap between notes
          velocity: 80 + Math.floor(this.rng() * 20),
          time: chord.time + i * stepDuration,
        });
      }
    }

    return notes;
  }

  /**
   * Create pad voicing (spread out chord tones)
   */
  generatePadVoicing(progression: ChordProgression): ChordProgression {
    const voicedChords = progression.chords.map(chord => {
      // Spread chord tones across multiple octaves
      const midi: number[] = [];
      chord.midi.forEach((note, index) => {
        const octaveOffset = Math.floor(index / 3) * 12;
        midi.push(note + octaveOffset);
      });

      return {
        ...chord,
        midi,
      };
    });

    return {
      chords: voicedChords,
      totalDuration: progression.totalDuration,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<HarmonyConfig>): void {
    this.config = { ...this.config, ...config };

    // Reset progression state if key changed
    if (config.root || config.scale) {
      this.currentDegree = 1;
      this.previousChordMidi = null;
    }
  }

  /**
   * Reset to starting state
   */
  reset(): void {
    this.currentDegree = 1;
    this.previousChordMidi = null;
  }
}

interface GeneratedNote {
  midi: number;
  duration: number;
  velocity: number;
  time: number;
}

export default HarmonyGenerator;
