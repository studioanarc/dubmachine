import * as Tone from 'tone';

/**
 * Base interface for all effect parameters
 */
export interface EffectParameter {
  value: number;
  min: number;
  max: number;
  default: number;
  unit?: string;
  step?: number;
  curve?: 'linear' | 'exponential';
}

/**
 * Base interface for effect metadata
 */
export interface EffectMetadata {
  name: string;
  type: string;
  category: 'delay' | 'reverb' | 'modulation' | 'dynamics' | 'filter' | 'distortion' | 'spatial' | 'granular' | 'novel';
  version: string;
}

/**
 * Abstract base class for all effects
 * Provides common interface and functionality
 */
export abstract class BaseEffect {
  protected input: Tone.Gain;
  protected output: Tone.Gain;
  protected wetDry: Tone.CrossFade;
  protected bypass: boolean = false;

  public metadata: EffectMetadata;
  public parameters: Map<string, EffectParameter>;

  constructor(metadata: EffectMetadata) {
    this.metadata = metadata;
    this.parameters = new Map();

    // Create signal chain
    this.input = new Tone.Gain(1);
    this.output = new Tone.Gain(1);
    this.wetDry = new Tone.CrossFade(1);

    // Initialize common parameters
    this.addParameter('mix', {
      value: 1,
      min: 0,
      max: 1,
      default: 1,
      unit: '%',
      step: 0.01,
      curve: 'linear'
    });
  }

  /**
   * Add a parameter to the effect
   */
  protected addParameter(name: string, config: EffectParameter): void {
    this.parameters.set(name, config);
  }

  /**
   * Get a parameter value
   */
  public getParameter(name: string): number | undefined {
    return this.parameters.get(name)?.value;
  }

  /**
   * Set a parameter value with validation
   */
  public setParameter(name: string, value: number): void {
    const param = this.parameters.get(name);
    if (!param) {
      console.warn(`Parameter ${name} not found on ${this.metadata.name}`);
      return;
    }

    // Clamp value to valid range
    const clampedValue = Math.max(param.min, Math.min(param.max, value));
    param.value = clampedValue;

    // Handle mix parameter specially
    if (name === 'mix') {
      this.wetDry.fade.value = clampedValue;
    } else {
      this.onParameterChange(name, clampedValue);
    }
  }

  /**
   * Override in subclasses to handle parameter changes
   */
  protected abstract onParameterChange(name: string, value: number): void;

  /**
   * Get all parameters as an object
   */
  public getParameters(): Record<string, number> {
    const params: Record<string, number> = {};
    this.parameters.forEach((param, name) => {
      params[name] = param.value;
    });
    return params;
  }

  /**
   * Set multiple parameters at once
   */
  public setParameters(params: Record<string, number>): void {
    Object.entries(params).forEach(([name, value]) => {
      this.setParameter(name, value);
    });
  }

  /**
   * Toggle bypass state
   */
  public setBypass(bypass: boolean): void {
    this.bypass = bypass;
    if (bypass) {
      this.wetDry.fade.value = 0; // 100% dry
    } else {
      this.wetDry.fade.value = this.parameters.get('mix')?.value || 1;
    }
  }

  /**
   * Check if effect is bypassed
   */
  public isBypassed(): boolean {
    return this.bypass;
  }

  /**
   * Connect this effect to a destination
   */
  public connect(destination: Tone.InputNode): void {
    this.output.connect(destination);
  }

  /**
   * Disconnect this effect
   */
  public disconnect(): void {
    this.output.disconnect();
  }

  /**
   * Get the input node for connecting sources
   */
  public getInput(): Tone.InputNode {
    return this.input;
  }

  /**
   * Get the output node for connecting destinations
   */
  public getOutput(): Tone.OutputNode {
    return this.output;
  }

  /**
   * Reset all parameters to default values
   */
  public reset(): void {
    this.parameters.forEach((param, name) => {
      this.setParameter(name, param.default);
    });
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.input.dispose();
    this.output.dispose();
    this.wetDry.dispose();
  }

  /**
   * Serialize effect state to JSON
   */
  public toJSON(): object {
    return {
      metadata: this.metadata,
      parameters: this.getParameters(),
      bypass: this.bypass
    };
  }

  /**
   * Load effect state from JSON
   */
  public fromJSON(data: any): void {
    if (data.parameters) {
      this.setParameters(data.parameters);
    }
    if (typeof data.bypass === 'boolean') {
      this.setBypass(data.bypass);
    }
  }
}
