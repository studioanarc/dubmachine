/**
 * useAudioEngine.ts
 * Convenience React hook for accessing audio engine and state
 */

import { useDubMachine, useAudioControls, useAudioReady } from '../utils/audioContext';
import { useAudioStore } from '../utils/audioStore';
import { DubMachine } from '../engine/DubMachine';
import { GenerativeControllerConfig } from '../engine/generative/GenerativeController';

export interface AudioEngineHook {
  // Audio engine instance
  dubMachine: DubMachine;
  isReady: boolean;

  // Playback state
  isPlaying: boolean;
  isInitialized: boolean;
  currentBar: number;
  currentBeat: number;
  bpm: number;

  // Generative parameters
  rootNote: string;
  scale: string;
  density: number;
  complexity: number;
  energy: number;
  evolutionRate: number;
  stabilityVsChaos: number;

  // Audio parameters
  masterVolume: number;
  effectParams: {
    reverbMix: number;
    reverbDecay: number;
    delayTime: number;
    delayFeedback: number;
    delayMix: number;
    filterCutoff: number;
    filterResonance: number;
  };

  // Playback controls
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  togglePlayback: () => Promise<void>;

  // Parameter controls
  setBPM: (bpm: number) => void;
  setMasterVolume: (volume: number) => void;
  setDensity: (density: number) => void;
  setComplexity: (complexity: number) => void;
  setEnergy: (energy: number) => void;
  setEvolutionRate: (rate: number) => void;
  setStabilityVsChaos: (value: number) => void;
  setRootNote: (note: string) => void;
  setScale: (scale: string) => void;

  // Bulk updates
  updateGenerativeConfig: (config: Partial<GenerativeControllerConfig>) => void;

  // Generation controls
  regenerate: (seed?: number) => void;

  // Preset management
  loadPreset: (preset: any) => void;
  savePreset: (name: string, description: string, tags?: string[]) => any;
  activePreset: any | null;
  customPresets: any[];

  // Session management
  exportSession: () => string;
  importSession: (jsonData: string) => void;

  // Direct engine access
  getSynthEngine: () => any;
  getEffectsChain: () => any;
  getGenerativeController: () => any;
}

/**
 * Main audio engine hook
 * Combines DubMachine instance with Zustand store for complete audio control
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const audio = useAudioEngine();
 *
 *   return (
 *     <div>
 *       <button onClick={audio.togglePlayback}>
 *         {audio.isPlaying ? 'Pause' : 'Play'}
 *       </button>
 *       <input
 *         type="range"
 *         value={audio.bpm}
 *         onChange={(e) => audio.setBPM(Number(e.target.value))}
 *         min={80}
 *         max={160}
 *       />
 *       <p>Current Bar: {audio.currentBar}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export const useAudioEngine = (): AudioEngineHook => {
  // Get DubMachine instance and controls
  const dubMachine = useDubMachine();
  const controls = useAudioControls();
  const isReady = useAudioReady();

  // Get state from store
  const {
    isPlaying,
    isInitialized,
    currentBar,
    currentBeat,
    bpm,
    rootNote,
    scale,
    density,
    complexity,
    energy,
    evolutionRate,
    stabilityVsChaos,
    masterVolume,
    effectParams,
    activePreset,
    customPresets,
  } = useAudioStore();

  // Get store actions
  const store = useAudioStore();

  return {
    // Engine and readiness
    dubMachine,
    isReady,

    // Playback state
    isPlaying,
    isInitialized,
    currentBar,
    currentBeat,
    bpm,

    // Generative parameters
    rootNote,
    scale,
    density,
    complexity,
    energy,
    evolutionRate,
    stabilityVsChaos,

    // Audio parameters
    masterVolume,
    effectParams,

    // Playback controls
    play: controls.play,
    pause: controls.pause,
    stop: controls.stop,
    togglePlayback: controls.togglePlayback,

    // Parameter controls
    setBPM: controls.setBPM,
    setMasterVolume: controls.setMasterVolume,
    setDensity: (density: number) => {
      store.setDensity(density);
      controls.updateGenerativeConfig({ density });
    },
    setComplexity: (complexity: number) => {
      store.setComplexity(complexity);
      controls.updateGenerativeConfig({ complexity });
    },
    setEnergy: (energy: number) => {
      store.setEnergy(energy);
      controls.updateGenerativeConfig({ energy });
    },
    setEvolutionRate: (rate: number) => {
      store.setEvolutionRate(rate);
      controls.updateGenerativeConfig({ mutationRate: rate });
    },
    setStabilityVsChaos: (value: number) => {
      store.setStabilityVsChaos(value);
      controls.updateGenerativeConfig({ stabilityVsChaos: value });
    },
    setRootNote: (note: string) => {
      store.setRootNote(note);
      controls.updateGenerativeConfig({ root: note as any });
    },
    setScale: (scale: string) => {
      store.setScale(scale);
      controls.updateGenerativeConfig({ scale: scale as any });
    },

    // Bulk updates
    updateGenerativeConfig: controls.updateGenerativeConfig,

    // Generation controls
    regenerate: controls.regenerate,

    // Preset management
    loadPreset: controls.loadPreset,
    savePreset: controls.savePreset,
    activePreset,
    customPresets,

    // Session management
    exportSession: controls.exportSession,
    importSession: controls.importSession,

    // Direct engine access
    getSynthEngine: controls.getSynthEngine,
    getEffectsChain: controls.getEffectsChain,
    getGenerativeController: controls.getGenerativeController,
  };
};

/**
 * Hook for just playback controls (lighter alternative)
 */
export const usePlaybackControls = () => {
  const controls = useAudioControls();
  const { isPlaying, currentBar, bpm } = useAudioStore();

  return {
    isPlaying,
    currentBar,
    bpm,
    play: controls.play,
    pause: controls.pause,
    stop: controls.stop,
    togglePlayback: controls.togglePlayback,
    setBPM: controls.setBPM,
  };
};

/**
 * Hook for just generative parameters (lighter alternative)
 */
export const useGenerativeParams = () => {
  const controls = useAudioControls();
  const store = useAudioStore();

  return {
    rootNote: store.rootNote,
    scale: store.scale,
    density: store.density,
    complexity: store.complexity,
    energy: store.energy,
    evolutionRate: store.evolutionRate,
    stabilityVsChaos: store.stabilityVsChaos,

    setRootNote: (note: string) => {
      store.setRootNote(note);
      controls.updateGenerativeConfig({ root: note as any });
    },
    setScale: (scale: string) => {
      store.setScale(scale);
      controls.updateGenerativeConfig({ scale: scale as any });
    },
    setDensity: (density: number) => {
      store.setDensity(density);
      controls.updateGenerativeConfig({ density });
    },
    setComplexity: (complexity: number) => {
      store.setComplexity(complexity);
      controls.updateGenerativeConfig({ complexity });
    },
    setEnergy: (energy: number) => {
      store.setEnergy(energy);
      controls.updateGenerativeConfig({ energy });
    },
    setEvolutionRate: (rate: number) => {
      store.setEvolutionRate(rate);
      controls.updateGenerativeConfig({ mutationRate: rate });
    },
    setStabilityVsChaos: (value: number) => {
      store.setStabilityVsChaos(value);
      controls.updateGenerativeConfig({ stabilityVsChaos: value });
    },

    regenerate: controls.regenerate,
  };
};

/**
 * Hook for preset management
 */
export const usePresets = () => {
  const controls = useAudioControls();
  const { activePreset, customPresets, removeCustomPreset } = useAudioStore();

  return {
    activePreset,
    customPresets,
    loadPreset: controls.loadPreset,
    savePreset: controls.savePreset,
    removePreset: removeCustomPreset,
  };
};

export default useAudioEngine;
