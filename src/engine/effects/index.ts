/**
 * Effects Module Index
 * Complete effects chain for dub techno generative music
 */

// Base infrastructure
export { BaseEffect } from './BaseEffect';
export type { EffectParameter, EffectMetadata } from './BaseEffect';
export { EffectsChain } from './EffectsChain';
export type { EffectSlot, SendBus, RoutingMode } from './EffectsChain';

// Essential Effects (20)
export { TapeEcho } from './TapeEcho';
export { ConvolutionReverb } from './ConvolutionReverb';
export { BitCrusher } from './BitCrusher';
export { DigitalDistortion } from './DigitalDistortion';
export { SpringReverb } from './SpringReverb';
export { AnalogFilter } from './AnalogFilter';
export { Phaser } from './Phaser';
export { Flanger } from './Flanger';
export { Chorus } from './Chorus';
export { Compressor } from './Compressor';
export { MultibandCompressor } from './MultibandCompressor';
export { ParametricEQ } from './ParametricEQ';
export { StereoWidth } from './StereoWidth';
export { GranularProcessor } from './GranularProcessor';
export { FrequencyShifter } from './FrequencyShifter';
export { RingModulator } from './RingModulator';
export { Tremolo } from './Tremolo';
export { AutoPan } from './AutoPan';
export { Gate } from './Gate';
export { VinylSimulator } from './VinylSimulator';

// Novel Effects (5)
export { ProbabilityDelay } from './ProbabilityDelay';
export { SpectralFreeze } from './SpectralFreeze';
export { DubSiren } from './DubSiren';
export { MorphingFilter } from './MorphingFilter';
export { DiffusionNetwork } from './DiffusionNetwork';
