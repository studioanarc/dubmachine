/**
 * MusicTheory.ts
 * Core music theory utilities for generative music
 * Provides scales, modes, chord types, and interval calculations
 */

export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export interface Note {
  name: NoteName;
  octave: number;
  midi: number;
  frequency: number;
}

export interface Chord {
  root: NoteName;
  type: ChordType;
  notes: NoteName[];
  voicing?: number[]; // MIDI notes
}

export type ScaleType =
  | 'major'
  | 'minor'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'aeolian'
  | 'locrian'
  | 'minor_pentatonic'
  | 'major_pentatonic'
  | 'blues'
  | 'harmonic_minor'
  | 'melodic_minor'
  | 'whole_tone'
  | 'chromatic';

export type ChordType =
  | 'major'
  | 'minor'
  | 'dim'
  | 'aug'
  | 'sus2'
  | 'sus4'
  | 'maj7'
  | 'min7'
  | '7'
  | 'dim7'
  | 'min7b5'
  | 'add9'
  | 'add11'
  | 'madd9'
  | '9'
  | 'min9'
  | '11'
  | '13';

export const NOTES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Scale intervals (semitones from root)
export const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  minor_pentatonic: [0, 3, 5, 7, 10],
  major_pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  melodic_minor: [0, 2, 3, 5, 7, 9, 11],
  whole_tone: [0, 2, 4, 6, 8, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

// Chord intervals (semitones from root)
export const CHORD_INTERVALS: Record<ChordType, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  '7': [0, 4, 7, 10],
  dim7: [0, 3, 6, 9],
  min7b5: [0, 3, 6, 10],
  add9: [0, 4, 7, 14],
  add11: [0, 4, 7, 17],
  madd9: [0, 3, 7, 14],
  '9': [0, 4, 7, 10, 14],
  min9: [0, 3, 7, 10, 14],
  '11': [0, 4, 7, 10, 14, 17],
  '13': [0, 4, 7, 10, 14, 17, 21],
};

export class MusicTheory {
  /**
   * Convert note name and octave to MIDI note number
   */
  static noteToMidi(note: NoteName, octave: number): number {
    const noteIndex = NOTES.indexOf(note);
    return (octave + 1) * 12 + noteIndex;
  }

  /**
   * Convert MIDI note number to note name and octave
   */
  static midiToNote(midi: number): { note: NoteName; octave: number } {
    const octave = Math.floor(midi / 12) - 1;
    const noteIndex = midi % 12;
    return { note: NOTES[noteIndex], octave };
  }

  /**
   * Convert MIDI note to frequency (Hz)
   */
  static midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Convert frequency to MIDI note (rounded)
   */
  static frequencyToMidi(frequency: number): number {
    return Math.round(69 + 12 * Math.log2(frequency / 440));
  }

  /**
   * Create a full Note object
   */
  static createNote(note: NoteName, octave: number): Note {
    const midi = this.noteToMidi(note, octave);
    return {
      name: note,
      octave,
      midi,
      frequency: this.midiToFrequency(midi),
    };
  }

  /**
   * Get scale notes for a given root and scale type
   */
  static getScale(root: NoteName, scaleType: ScaleType): NoteName[] {
    const rootIndex = NOTES.indexOf(root);
    const intervals = SCALE_INTERVALS[scaleType];

    return intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return NOTES[noteIndex];
    });
  }

  /**
   * Get scale as MIDI notes in a specific octave range
   */
  static getScaleMidi(
    root: NoteName,
    scaleType: ScaleType,
    octaveStart: number,
    octaveEnd: number
  ): number[] {
    const scale = this.getScale(root, scaleType);
    const midiNotes: number[] = [];

    for (let octave = octaveStart; octave <= octaveEnd; octave++) {
      scale.forEach(note => {
        midiNotes.push(this.noteToMidi(note, octave));
      });
    }

    return midiNotes.sort((a, b) => a - b);
  }

  /**
   * Build a chord from root and chord type
   */
  static getChord(root: NoteName, chordType: ChordType): NoteName[] {
    const rootIndex = NOTES.indexOf(root);
    const intervals = CHORD_INTERVALS[chordType];

    return intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return NOTES[noteIndex];
    });
  }

  /**
   * Get chord as MIDI notes with voicing
   */
  static getChordMidi(
    root: NoteName,
    chordType: ChordType,
    octave: number,
    inversion: number = 0
  ): number[] {
    const rootIndex = NOTES.indexOf(root);
    let intervals = [...CHORD_INTERVALS[chordType]];

    // Apply inversion
    for (let i = 0; i < inversion; i++) {
      const firstInterval = intervals.shift()!;
      intervals.push(firstInterval + 12);
    }

    return intervals.map(interval => {
      const semitones = interval;
      const noteOctave = octave + Math.floor(semitones / 12);
      const noteIndex = (rootIndex + semitones) % 12;
      return this.noteToMidi(NOTES[noteIndex], noteOctave);
    });
  }

  /**
   * Calculate interval between two notes (in semitones)
   */
  static interval(note1: NoteName, note2: NoteName): number {
    const index1 = NOTES.indexOf(note1);
    const index2 = NOTES.indexOf(note2);
    return (index2 - index1 + 12) % 12;
  }

  /**
   * Transpose a note by semitones
   */
  static transpose(note: NoteName, semitones: number): NoteName {
    const index = NOTES.indexOf(note);
    const newIndex = (index + semitones + 12) % 12;
    return NOTES[newIndex];
  }

  /**
   * Transpose MIDI note
   */
  static transposeMidi(midi: number, semitones: number): number {
    return midi + semitones;
  }

  /**
   * Check if a note is in a scale
   */
  static isInScale(note: NoteName, root: NoteName, scaleType: ScaleType): boolean {
    const scale = this.getScale(root, scaleType);
    return scale.includes(note);
  }

  /**
   * Quantize a MIDI note to the nearest scale note
   */
  static quantizeToScale(
    midi: number,
    root: NoteName,
    scaleType: ScaleType,
    octaveRange: [number, number] = [0, 8]
  ): number {
    const scaleMidi = this.getScaleMidi(root, scaleType, octaveRange[0], octaveRange[1]);

    // Find nearest scale note
    let nearest = scaleMidi[0];
    let minDistance = Math.abs(midi - nearest);

    for (const scaleMidiNote of scaleMidi) {
      const distance = Math.abs(midi - scaleMidiNote);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = scaleMidiNote;
      }
    }

    return nearest;
  }

  /**
   * Get chord progression in a key (using Roman numerals)
   */
  static getProgression(
    root: NoteName,
    scaleType: ScaleType,
    degrees: number[]
  ): Chord[] {
    const scale = this.getScale(root, scaleType);

    return degrees.map(degree => {
      const chordRoot = scale[(degree - 1) % scale.length];
      // Determine chord quality based on scale degree (simplified)
      let chordType: ChordType;

      if (scaleType === 'major') {
        if ([1, 4, 5].includes(degree)) chordType = 'major';
        else if ([2, 3, 6].includes(degree)) chordType = 'minor';
        else chordType = 'dim';
      } else {
        // Minor key
        if ([3, 6, 7].includes(degree)) chordType = 'major';
        else if ([1, 4, 5].includes(degree)) chordType = 'minor';
        else chordType = 'dim';
      }

      return {
        root: chordRoot,
        type: chordType,
        notes: this.getChord(chordRoot, chordType),
      };
    });
  }

  /**
   * Voice leading: move from one chord to another with minimal movement
   */
  static voiceLead(fromChord: number[], toChord: number[]): number[] {
    const result: number[] = [];
    const usedIndices = new Set<number>();

    // For each note in fromChord, find the nearest note in toChord
    for (const fromNote of fromChord) {
      let minDistance = Infinity;
      let closestIndex = 0;

      toChord.forEach((toNote, index) => {
        if (usedIndices.has(index)) return;

        // Consider octave equivalents
        const distances = [
          Math.abs(toNote - fromNote),
          Math.abs(toNote + 12 - fromNote),
          Math.abs(toNote - 12 - fromNote),
        ];

        const distance = Math.min(...distances);

        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      usedIndices.add(closestIndex);
      result.push(toChord[closestIndex]);
    }

    return result;
  }

  /**
   * Dub techno specific: get drone-friendly chord types
   */
  static getDubChordTypes(): ChordType[] {
    return ['sus2', 'sus4', 'add9', 'add11', 'min7', 'maj7', 'madd9'];
  }

  /**
   * Get notes for a pedal tone/drone
   */
  static getPedalTone(root: NoteName, octaves: number[]): number[] {
    return octaves.map(octave => this.noteToMidi(root, octave));
  }
}

export default MusicTheory;
