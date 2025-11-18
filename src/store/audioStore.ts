/**
 * audioStore.ts
 * Zustand store for audio engine state management
 */

import { create } from 'zustand';
import { DubMachine } from '../engine/DubMachine';
import { NoteName, ScaleType } from '../engine/generative/MusicTheory';
import { DrumStyle } from '../engine/generative/DrumPatternGenerator';
import { MelodyCharacter } from '../engine/generative/MelodyGenerator';
import * as Tone from 'tone';

export interface AudioState {
  // DubMachine instance
  dubMachine: DubMachine | null;

  // Playback state
  isPlaying: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Musical parameters
  bpm: number;
  rootNote: NoteName;
  scale: ScaleType;

  // Generation parameters
  mood: number; // 0-100 (maps to complexity)
  density: number; // 0-100
  evolution: number; // 0-100 (maps to mutationRate)

  // Current seed
  currentSeed: number;

  // Actions
  initialize: () => Promise<void>;
  togglePlayback: () => Promise<void>;
  stop: () => void;

  // Parameter updates
  setBpm: (bpm: number) => void;
  setRootNote: (note: NoteName) => void;
  setScale: (scale: ScaleType) => void;
  setMood: (mood: number) => void;
  setDensity: (density: number) => void;
  setEvolution: (evolution: number) => void;

  // Regeneration
  regenerate: (newSeed?: number) => void;

  // Master volume
  setMasterVolume: (volume: number) => void;

  // Cleanup
  cleanup: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  // Initial state
  dubMachine: null,
  isPlaying: false,
  isInitialized: false,
  isLoading: false,
  error: null,

  bpm: 120,
  rootNote: 'C',
  scale: 'minor',
  mood: 30,
  density: 50,
  evolution: 40,
  currentSeed: Date.now(),

  // Initialize audio engine
  initialize: async () => {
    const { dubMachine } = get();

    if (dubMachine && dubMachine.getIsInitialized()) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      let machine = dubMachine;

      if (!machine) {
        const state = get();
        machine = new DubMachine({
          bpm: state.bpm,
          root: state.rootNote,
          scale: state.scale,
          complexity: state.mood / 100,
          density: state.density / 100,
          mutationRate: state.evolution / 100,
          drumStyle: 'four_on_floor' as DrumStyle,
          melodyCharacter: 'atmospheric' as MelodyCharacter,
          evolutionEnabled: true,
          stabilityVsChaos: state.evolution / 100,
          totalBars: 128,
          beatsPerBar: 4,
        });
      }

      await machine.initialize();

      set({
        dubMachine: machine,
        isInitialized: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize audio',
      });
    }
  },

  // Toggle playback
  togglePlayback: async () => {
    // @ts-ignore
    const { dubMachine, isInitialized, initialize } = get();

    // Initialize if needed
    if (!isInitialized) {
      await initialize();
    }

    const machine = get().dubMachine;
    if (!machine) return;

    try {
      await machine.togglePlayback();
      set({ isPlaying: machine.getIsPlaying() });
    } catch (error) {
      console.error('Playback error:', error);
      set({ error: error instanceof Error ? error.message : 'Playback failed' });
    }
  },

  // Stop playback
  stop: () => {
    const { dubMachine } = get();
    if (!dubMachine) return;

    dubMachine.stop();
    set({ isPlaying: false });
  },

  // Set BPM
  setBpm: (bpm: number) => {
    set({ bpm });
    const { dubMachine } = get();
    if (dubMachine) {
      dubMachine.updateConfig({ bpm });
      Tone.Transport.bpm.value = bpm;
    }
  },

  // Set root note
  setRootNote: (note: NoteName) => {
    set({ rootNote: note });
    const { dubMachine } = get();
    if (dubMachine) {
      dubMachine.updateConfig({ root: note });
    }
  },

  // Set scale
  setScale: (scale: ScaleType) => {
    set({ scale });
    const { dubMachine } = get();
    if (dubMachine) {
      dubMachine.updateConfig({ scale });
    }
  },

  // Set mood
  setMood: (mood: number) => {
    set({ mood });
    const { dubMachine } = get();
    if (dubMachine) {
      dubMachine.updateConfig({ complexity: mood / 100 });
    }
  },

  // Set density
  setDensity: (density: number) => {
    set({ density });
    const { dubMachine } = get();
    if (dubMachine) {
      dubMachine.updateConfig({ density: density / 100 });
    }
  },

  // Set evolution
  setEvolution: (evolution: number) => {
    set({ evolution });
    const { dubMachine } = get();
    if (dubMachine) {
      dubMachine.updateConfig({
        mutationRate: evolution / 100,
        stabilityVsChaos: evolution / 100,
      });
    }
  },

  // Regenerate
  regenerate: (newSeed?: number) => {
    const { dubMachine } = get();
    if (!dubMachine) return;

    const seed = newSeed ?? Date.now();
    dubMachine.regenerate(seed);
    set({ currentSeed: seed });
  },

  // Set master volume
  setMasterVolume: (volume: number) => {
    const { dubMachine } = get();
    if (dubMachine) {
      dubMachine.setMasterVolume(volume);
    }
  },

  // Cleanup
  cleanup: () => {
    const { dubMachine } = get();
    if (dubMachine) {
      dubMachine.dispose();
    }
    set({
      dubMachine: null,
      isPlaying: false,
      isInitialized: false,
    });
  },
}));
