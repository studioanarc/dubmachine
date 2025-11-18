/**
 * audioContext.tsx
 * React context provider for DubMachine audio engine
 */

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { DubMachine, DubMachineConfig } from '../engine/DubMachine';
import { useAudioStore } from './audioStore';
import { GenerativeControllerConfig } from '../engine/generative/GenerativeController';

interface AudioContextValue {
  dubMachine: DubMachine | null;
  isReady: boolean;
  error: string | null;
}

const AudioContext = createContext<AudioContextValue>({
  dubMachine: null,
  isReady: false,
  error: null,
});

export interface AudioProviderProps {
  children: ReactNode;
  config?: DubMachineConfig;
}

/**
 * Audio Context Provider
 * Manages the DubMachine instance and provides it to child components
 */
export const AudioProvider: React.FC<AudioProviderProps> = ({ children, config }) => {
  const dubMachineRef = useRef<DubMachine | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get store actions
  const {
    setIsPlaying,
    setIsInitialized,
    setCurrentBar,
    setBPM,
    updateGenerativeConfig,
  } = useAudioStore();

  useEffect(() => {
    // Initialize DubMachine
    try {
      console.log('Initializing DubMachine...');

      const defaultConfig: DubMachineConfig = {
        bpm: 125,
        root: 'C',
        scale: 'minor',
        complexity: 0.5,
        density: 0.5,
        energy: 0.6,
        evolutionEnabled: true,
        mutationRate: 0.3,
        stabilityVsChaos: 0.3,
        maxVoices: 16,
        masterVolume: 0.7,
        ...config,
      };

      dubMachineRef.current = new DubMachine(defaultConfig);

      // Set up callbacks to sync with store
      dubMachineRef.current.onBar((bar: number) => {
        setCurrentBar(bar);
      });

      // Sync initial config to store
      const engineConfig = dubMachineRef.current.getConfig();
      updateGenerativeConfig(engineConfig);
      setBPM(dubMachineRef.current.getBPM());

      setIsReady(true);
      console.log('DubMachine initialized successfully');
    } catch (err) {
      console.error('Failed to initialize DubMachine:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsReady(false);
    }

    // Cleanup on unmount
    return () => {
      if (dubMachineRef.current) {
        console.log('Disposing DubMachine...');
        dubMachineRef.current.dispose();
        dubMachineRef.current = null;
      }
    };
  }, []); // Empty deps - initialize once

  // Sync playback state
  useEffect(() => {
    if (!dubMachineRef.current) return;

    const interval = setInterval(() => {
      if (dubMachineRef.current) {
        const state = dubMachineRef.current.getPlaybackState();
        setIsPlaying(state.isPlaying);
        setIsInitialized(dubMachineRef.current.getIsInitialized());
      }
    }, 100);

    return () => clearInterval(interval);
  }, [setIsPlaying, setIsInitialized]);

  const value: AudioContextValue = {
    dubMachine: dubMachineRef.current,
    isReady,
    error,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

/**
 * Hook to access the audio context
 */
export const useAudioContext = (): AudioContextValue => {
  const context = useContext(AudioContext);

  if (context === undefined) {
    throw new Error('useAudioContext must be used within an AudioProvider');
  }

  return context;
};

/**
 * Hook to safely access DubMachine instance
 * Throws error if not ready
 */
export const useDubMachine = (): DubMachine => {
  const { dubMachine, isReady, error } = useAudioContext();

  if (error) {
    throw new Error(`DubMachine initialization error: ${error}`);
  }

  if (!isReady || !dubMachine) {
    throw new Error('DubMachine is not ready yet');
  }

  return dubMachine;
};

/**
 * Hook to check if audio engine is ready
 */
export const useAudioReady = (): boolean => {
  const { isReady } = useAudioContext();
  return isReady;
};

/**
 * Hook for audio engine controls with store integration
 */
export const useAudioControls = () => {
  const dubMachine = useDubMachine();
  const store = useAudioStore();

  return {
    // Playback controls
    play: async () => {
      await dubMachine.play();
      store.setIsPlaying(true);
    },

    pause: () => {
      dubMachine.pause();
      store.setIsPlaying(false);
    },

    stop: () => {
      dubMachine.stop();
      store.setIsPlaying(false);
      store.setCurrentBar(0);
    },

    togglePlayback: async () => {
      await dubMachine.togglePlayback();
      store.setIsPlaying(dubMachine.getIsPlaying());
    },

    // Parameter controls
    setBPM: (bpm: number) => {
      dubMachine.setBPM(bpm);
      store.setBPM(bpm);
    },

    setMasterVolume: (volume: number) => {
      dubMachine.setMasterVolume(volume);
      store.setMasterVolume(volume);
    },

    updateGenerativeConfig: (config: Partial<GenerativeControllerConfig>) => {
      dubMachine.updateConfig(config);
      store.updateGenerativeConfig(config);
    },

    regenerate: (seed?: number) => {
      dubMachine.regenerate(seed);
      store.setCurrentBar(0);
    },

    // Preset controls
    loadPreset: (preset: any) => {
      dubMachine.loadPreset(preset);
      store.setActivePreset(preset);
      const config = dubMachine.getConfig();
      store.updateGenerativeConfig(config);
      store.setBPM(dubMachine.getBPM());
    },

    savePreset: (name: string, description: string, tags: string[] = []) => {
      const preset = dubMachine.savePreset(name, description, tags);
      store.addCustomPreset(preset);
      return preset;
    },

    // Session management
    exportSession: () => dubMachine.exportSession(),

    importSession: (jsonData: string) => {
      dubMachine.importSession(jsonData);
      const config = dubMachine.getConfig();
      store.updateGenerativeConfig(config);
      store.setBPM(dubMachine.getBPM());
    },

    // Direct engine access
    getSynthEngine: () => dubMachine.getSynthEngine(),
    getEffectsChain: () => dubMachine.getEffectsChain(),
    getGenerativeController: () => dubMachine.getGenerativeController(),
  };
};

export default AudioProvider;
