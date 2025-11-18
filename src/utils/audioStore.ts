/**
 * audioStore.ts
 * Zustand store for global audio state management
 */

import { create } from 'zustand';
import { GenerativeControllerConfig } from '../engine/generative/GenerativeController';
import { VoiceParams } from '../engine/synth/SynthVoice';
import { DubMachinePreset } from '../engine/DubMachine';

export interface AudioState {
  // Playback state
  isPlaying: boolean;
  isInitialized: boolean;
  currentBar: number;
  currentBeat: number;
  bpm: number;

  // Generative parameters
  rootNote: string;
  scale: string;
  mood: string;
  density: number;
  complexity: number;
  energy: number;
  evolutionRate: number;
  stabilityVsChaos: number;

  // Synth parameters
  synthParams: Partial<VoiceParams>;
  masterVolume: number;

  // Effect parameters
  effectParams: {
    reverbMix: number;
    reverbDecay: number;
    delayTime: number;
    delayFeedback: number;
    delayMix: number;
    filterCutoff: number;
    filterResonance: number;
  };

  // Preset management
  activePreset: DubMachinePreset | null;
  customPresets: DubMachinePreset[];

  // Actions
  setIsPlaying: (isPlaying: boolean) => void;
  setIsInitialized: (isInitialized: boolean) => void;
  setCurrentBar: (bar: number) => void;
  setCurrentBeat: (beat: number) => void;
  setBPM: (bpm: number) => void;

  setRootNote: (note: string) => void;
  setScale: (scale: string) => void;
  setMood: (mood: string) => void;
  setDensity: (density: number) => void;
  setComplexity: (complexity: number) => void;
  setEnergy: (energy: number) => void;
  setEvolutionRate: (rate: number) => void;
  setStabilityVsChaos: (value: number) => void;

  setSynthParams: (params: Partial<VoiceParams>) => void;
  setMasterVolume: (volume: number) => void;

  setEffectParam: (param: string, value: number) => void;
  setEffectParams: (params: Partial<AudioState['effectParams']>) => void;

  setActivePreset: (preset: DubMachinePreset | null) => void;
  addCustomPreset: (preset: DubMachinePreset) => void;
  removeCustomPreset: (presetName: string) => void;

  // Bulk update
  updateGenerativeConfig: (config: Partial<GenerativeControllerConfig>) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  // Playback state
  isPlaying: false,
  isInitialized: false,
  currentBar: 0,
  currentBeat: 0,
  bpm: 125,

  // Generative parameters
  rootNote: 'C',
  scale: 'minor',
  mood: 'dark',
  density: 0.5,
  complexity: 0.5,
  energy: 0.6,
  evolutionRate: 0.3,
  stabilityVsChaos: 0.3,

  // Synth parameters
  synthParams: {},
  masterVolume: 0.7,

  // Effect parameters
  effectParams: {
    reverbMix: 0.5,
    reverbDecay: 2.5,
    delayTime: 0.375,
    delayFeedback: 0.4,
    delayMix: 0.4,
    filterCutoff: 0.6,
    filterResonance: 0.3,
  },

  // Preset management
  activePreset: null,
  customPresets: [],
};

export const useAudioStore = create<AudioState>((set) => ({
  ...initialState,

  // Playback actions
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsInitialized: (isInitialized) => set({ isInitialized }),
  setCurrentBar: (currentBar) => set({ currentBar }),
  setCurrentBeat: (currentBeat) => set({ currentBeat }),
  setBPM: (bpm) => set({ bpm }),

  // Generative parameter actions
  setRootNote: (rootNote) => set({ rootNote }),
  setScale: (scale) => set({ scale }),
  setMood: (mood) => set({ mood }),
  setDensity: (density) => set({ density }),
  setComplexity: (complexity) => set({ complexity }),
  setEnergy: (energy) => set({ energy }),
  setEvolutionRate: (evolutionRate) => set({ evolutionRate }),
  setStabilityVsChaos: (stabilityVsChaos) => set({ stabilityVsChaos }),

  // Synth parameter actions
  setSynthParams: (params) =>
    set((state) => ({
      synthParams: { ...state.synthParams, ...params },
    })),
  setMasterVolume: (masterVolume) => set({ masterVolume }),

  // Effect parameter actions
  setEffectParam: (param, value) =>
    set((state) => ({
      effectParams: { ...state.effectParams, [param]: value },
    })),
  setEffectParams: (params) =>
    set((state) => ({
      effectParams: { ...state.effectParams, ...params },
    })),

  // Preset actions
  setActivePreset: (activePreset) => set({ activePreset }),
  addCustomPreset: (preset) =>
    set((state) => ({
      customPresets: [...state.customPresets, preset],
    })),
  removeCustomPreset: (presetName) =>
    set((state) => ({
      customPresets: state.customPresets.filter((p) => p.name !== presetName),
    })),

  // Bulk update
  updateGenerativeConfig: (config) =>
    set((state) => ({
      rootNote: config.root || state.rootNote,
      scale: config.scale || state.scale,
      bpm: config.bpm || state.bpm,
      density: config.density ?? state.density,
      complexity: config.complexity ?? state.complexity,
      energy: config.energy ?? state.energy,
      evolutionRate: config.mutationRate ?? state.evolutionRate,
      stabilityVsChaos: config.stabilityVsChaos ?? state.stabilityVsChaos,
    })),

  // Reset
  reset: () => set(initialState),
}));

// Selectors for common state combinations
export const selectPlaybackState = (state: AudioState) => ({
  isPlaying: state.isPlaying,
  isInitialized: state.isInitialized,
  currentBar: state.currentBar,
  currentBeat: state.currentBeat,
  bpm: state.bpm,
});

export const selectGenerativeParams = (state: AudioState) => ({
  rootNote: state.rootNote,
  scale: state.scale,
  mood: state.mood,
  density: state.density,
  complexity: state.complexity,
  energy: state.energy,
  evolutionRate: state.evolutionRate,
  stabilityVsChaos: state.stabilityVsChaos,
});

export const selectEffectParams = (state: AudioState) => state.effectParams;

export const selectSynthParams = (state: AudioState) => state.synthParams;

export const selectPresets = (state: AudioState) => ({
  activePreset: state.activePreset,
  customPresets: state.customPresets,
});
