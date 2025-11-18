/**
 * AudioContextProvider.tsx
 * Provides audio context and handles initialization
 */

import { useEffect, ReactNode } from 'react';
import { useAudioStore } from '../store/audioStore';

interface AudioContextProviderProps {
  children: ReactNode;
}

export function AudioContextProvider({ children }: AudioContextProviderProps) {
  const cleanup = useAudioStore(state => state.cleanup);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return <>{children}</>;
}

export default AudioContextProvider;
