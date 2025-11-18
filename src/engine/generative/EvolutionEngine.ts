/**
 * EvolutionEngine.ts
 * Master generative system for evolving musical parameters over time
 * Handles tendency masks, mutations, and section management
 */

export interface EvolutionConfig {
  mutationRate: number; // 0-1, how often mutations occur
  mutationAmount: number; // 0-1, how much parameters change
  stabilityVsChaos: number; // 0=stable, 1=chaotic
  barsPerMutation: number; // How often to mutate
  tendencyMasks: TendencyMaskSet;
}

export interface TendencyMaskSet {
  density: TendencyMask;
  complexity: TendencyMask;
  velocity: TendencyMask;
  filter: TendencyMask;
  reverb: TendencyMask;
  delay: TendencyMask;
}

export interface TendencyMask {
  current: number; // Current value (0-1)
  target: number; // Target value (0-1)
  min: number; // Minimum allowed value
  max: number; // Maximum allowed value
  driftSpeed: number; // How fast to drift toward target (0-1)
  volatility: number; // How much random variation (0-1)
}

export type Section = 'intro' | 'buildup' | 'main' | 'breakdown' | 'outro';

export interface SectionConfig {
  name: Section;
  duration: number; // In bars
  parameters: Partial<SectionParameters>;
}

export interface SectionParameters {
  density: number; // 0-1
  complexity: number; // 0-1
  energy: number; // 0-1
  filterCutoff: number; // 0-1
  reverbMix: number; // 0-1
  delayMix: number; // 0-1
  harmonyStatic: number; // 0-1, how static the harmony is
  melodicActivity: number; // 0-1
}

export interface EvolutionState {
  currentBar: number;
  currentSection: Section;
  parameters: SectionParameters;
  tendencyMasks: TendencyMaskSet;
  mutationHistory: Mutation[];
}

export interface Mutation {
  bar: number;
  parameter: string;
  fromValue: number;
  toValue: number;
  reason: string;
}

export interface EvolutionEvent {
  bar: number;
  type: 'mutation' | 'section_change' | 'parameter_drift';
  data: any;
}

export class EvolutionEngine {
  private config: EvolutionConfig;
  private state: EvolutionState;
  private sections: SectionConfig[];
  private rng: () => number;
  private events: EvolutionEvent[];

  constructor(config: Partial<EvolutionConfig>, seed?: number) {
    this.config = {
      mutationRate: 0.3,
      mutationAmount: 0.2,
      stabilityVsChaos: 0.3,
      barsPerMutation: 8,
      tendencyMasks: this.createDefaultTendencyMasks(),
      ...config,
    };

    this.rng = this.createSeededRNG(seed);

    this.state = {
      currentBar: 0,
      currentSection: 'intro',
      parameters: this.getDefaultParameters(),
      tendencyMasks: this.config.tendencyMasks,
      mutationHistory: [],
    };

    this.sections = this.createDefaultSections();
    this.events = [];
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
   * Create default tendency masks
   */
  private createDefaultTendencyMasks(): TendencyMaskSet {
    return {
      density: { current: 0.5, target: 0.6, min: 0.2, max: 0.9, driftSpeed: 0.1, volatility: 0.2 },
      complexity: { current: 0.4, target: 0.5, min: 0.1, max: 0.8, driftSpeed: 0.08, volatility: 0.15 },
      velocity: { current: 0.7, target: 0.7, min: 0.5, max: 1.0, driftSpeed: 0.15, volatility: 0.1 },
      filter: { current: 0.6, target: 0.7, min: 0.3, max: 0.95, driftSpeed: 0.12, volatility: 0.25 },
      reverb: { current: 0.5, target: 0.5, min: 0.2, max: 0.8, driftSpeed: 0.05, volatility: 0.1 },
      delay: { current: 0.4, target: 0.5, min: 0.1, max: 0.9, driftSpeed: 0.08, volatility: 0.2 },
    };
  }

  /**
   * Get default section parameters
   */
  private getDefaultParameters(): SectionParameters {
    return {
      density: 0.5,
      complexity: 0.4,
      energy: 0.5,
      filterCutoff: 0.6,
      reverbMix: 0.5,
      delayMix: 0.4,
      harmonyStatic: 0.7,
      melodicActivity: 0.5,
    };
  }

  /**
   * Create default section structure
   */
  private createDefaultSections(): SectionConfig[] {
    return [
      {
        name: 'intro',
        duration: 16,
        parameters: {
          density: 0.3,
          complexity: 0.2,
          energy: 0.3,
          filterCutoff: 0.4,
          reverbMix: 0.7,
          delayMix: 0.6,
          harmonyStatic: 0.9,
          melodicActivity: 0.3,
        },
      },
      {
        name: 'buildup',
        duration: 16,
        parameters: {
          density: 0.5,
          complexity: 0.5,
          energy: 0.6,
          filterCutoff: 0.7,
          reverbMix: 0.5,
          delayMix: 0.5,
          harmonyStatic: 0.6,
          melodicActivity: 0.6,
        },
      },
      {
        name: 'main',
        duration: 32,
        parameters: {
          density: 0.7,
          complexity: 0.7,
          energy: 0.8,
          filterCutoff: 0.8,
          reverbMix: 0.4,
          delayMix: 0.5,
          harmonyStatic: 0.5,
          melodicActivity: 0.7,
        },
      },
      {
        name: 'breakdown',
        duration: 16,
        parameters: {
          density: 0.4,
          complexity: 0.3,
          energy: 0.4,
          filterCutoff: 0.5,
          reverbMix: 0.8,
          delayMix: 0.7,
          harmonyStatic: 0.8,
          melodicActivity: 0.4,
        },
      },
      {
        name: 'main',
        duration: 32,
        parameters: {
          density: 0.7,
          complexity: 0.7,
          energy: 0.8,
          filterCutoff: 0.8,
          reverbMix: 0.4,
          delayMix: 0.5,
          harmonyStatic: 0.5,
          melodicActivity: 0.7,
        },
      },
      {
        name: 'outro',
        duration: 16,
        parameters: {
          density: 0.3,
          complexity: 0.2,
          energy: 0.3,
          filterCutoff: 0.4,
          reverbMix: 0.9,
          delayMix: 0.8,
          harmonyStatic: 0.95,
          melodicActivity: 0.2,
        },
      },
    ];
  }

  /**
   * Advance to next bar and apply evolution
   */
  advanceBar(): EvolutionState {
    this.state.currentBar++;

    // Check for section changes
    this.checkSectionChange();

    // Apply tendency mask drift
    this.applyTendencyDrift();

    // Check for mutations
    if (this.shouldMutate()) {
      this.applyMutation();
    }

    // Apply chaos/stability influence
    this.applyChaosInfluence();

    return this.getState();
  }

  /**
   * Check if section should change
   */
  private checkSectionChange(): void {
    let totalBars = 0;

    for (const section of this.sections) {
      totalBars += section.duration;

      if (this.state.currentBar < totalBars) {
        if (this.state.currentSection !== section.name) {
          this.transitionToSection(section);

          this.events.push({
            bar: this.state.currentBar,
            type: 'section_change',
            data: { section: section.name },
          });
        }
        break;
      }
    }
  }

  /**
   * Transition to new section
   */
  private transitionToSection(section: SectionConfig): void {
    this.state.currentSection = section.name;

    // Update parameters gradually toward section targets
    if (section.parameters) {
      for (const [key, value] of Object.entries(section.parameters)) {
        if (value !== undefined && key in this.state.parameters) {
          const param = key as keyof SectionParameters;
          // Set as target for tendency masks
          if (param in this.state.tendencyMasks) {
            const mask = param as keyof TendencyMaskSet;
            this.state.tendencyMasks[mask].target = value;
          } else {
            // Direct parameter update
            this.state.parameters[param] = value;
          }
        }
      }
    }
  }

  /**
   * Apply tendency mask drift
   */
  private applyTendencyDrift(): void {
    for (const [key, mask] of Object.entries(this.state.tendencyMasks)) {
      // Drift toward target
      const diff = mask.target - mask.current;
      const drift = diff * mask.driftSpeed;

      // Add volatility (random variation)
      const volatilityAmount = (this.rng() - 0.5) * 2 * mask.volatility;

      // Update current value
      let newValue = mask.current + drift + volatilityAmount;

      // Clamp to min/max
      newValue = Math.max(mask.min, Math.min(mask.max, newValue));

      mask.current = newValue;

      // Update corresponding parameter
      const paramKey = key as keyof TendencyMaskSet;
      if (paramKey in this.state.parameters) {
        (this.state.parameters as any)[paramKey] = newValue;
      }

      this.events.push({
        bar: this.state.currentBar,
        type: 'parameter_drift',
        data: { parameter: key, value: newValue },
      });
    }
  }

  /**
   * Check if mutation should occur
   */
  private shouldMutate(): boolean {
    if (this.state.currentBar % this.config.barsPerMutation !== 0) {
      return false;
    }

    return this.rng() < this.config.mutationRate;
  }

  /**
   * Apply mutation to parameters
   */
  private applyMutation(): void {
    // Choose random parameter to mutate
    const maskKeys = Object.keys(this.state.tendencyMasks) as (keyof TendencyMaskSet)[];
    const paramToMutate = maskKeys[Math.floor(this.rng() * maskKeys.length)];
    const mask = this.state.tendencyMasks[paramToMutate];

    const oldValue = mask.current;
    const mutationDirection = this.rng() < 0.5 ? -1 : 1;
    const mutationMagnitude = this.config.mutationAmount * (mask.max - mask.min);

    let newValue = mask.current + mutationDirection * mutationMagnitude;
    newValue = Math.max(mask.min, Math.min(mask.max, newValue));

    // Update both current and target
    mask.current = newValue;
    mask.target = newValue;

    // Record mutation
    this.state.mutationHistory.push({
      bar: this.state.currentBar,
      parameter: paramToMutate,
      fromValue: oldValue,
      toValue: newValue,
      reason: 'scheduled_mutation',
    });

    this.events.push({
      bar: this.state.currentBar,
      type: 'mutation',
      data: { parameter: paramToMutate, from: oldValue, to: newValue },
    });
  }

  /**
   * Apply chaos/stability influence
   */
  private applyChaosInfluence(): void {
    const chaosAmount = this.config.stabilityVsChaos;

    if (chaosAmount > 0.5) {
      // Add random variations to all parameters
      for (const mask of Object.values(this.state.tendencyMasks)) {
        const variation = (this.rng() - 0.5) * (chaosAmount - 0.5) * 0.1;
        mask.current = Math.max(mask.min, Math.min(mask.max, mask.current + variation));
      }
    } else {
      // Pull parameters toward their targets (more stable)
      const pullStrength = (0.5 - chaosAmount) * 0.2;

      for (const mask of Object.values(this.state.tendencyMasks)) {
        const diff = mask.target - mask.current;
        mask.current += diff * pullStrength;
      }
    }
  }

  /**
   * Get current evolution state
   */
  getState(): EvolutionState {
    return {
      ...this.state,
      parameters: { ...this.state.parameters },
      tendencyMasks: { ...this.state.tendencyMasks },
      mutationHistory: [...this.state.mutationHistory],
    };
  }

  /**
   * Get parameter value at current state
   */
  getParameter(param: keyof SectionParameters): number {
    return this.state.parameters[param];
  }

  /**
   * Set parameter directly
   */
  setParameter(param: keyof SectionParameters, value: number): void {
    this.state.parameters[param] = value;

    // Update corresponding tendency mask if exists
    if (param in this.state.tendencyMasks) {
      const mask = param as keyof TendencyMaskSet;
      this.state.tendencyMasks[mask].current = value;
      this.state.tendencyMasks[mask].target = value;
    }
  }

  /**
   * Set tendency mask target
   */
  setTendencyTarget(mask: keyof TendencyMaskSet, target: number): void {
    const tendencyMask = this.state.tendencyMasks[mask];
    tendencyMask.target = Math.max(tendencyMask.min, Math.min(tendencyMask.max, target));
  }

  /**
   * Set custom sections
   */
  setSections(sections: SectionConfig[]): void {
    this.sections = sections;
  }

  /**
   * Get all sections
   */
  getSections(): SectionConfig[] {
    return [...this.sections];
  }

  /**
   * Get current section
   */
  getCurrentSection(): SectionConfig | undefined {
    let totalBars = 0;

    for (const section of this.sections) {
      totalBars += section.duration;
      if (this.state.currentBar < totalBars) {
        return section;
      }
    }

    return undefined;
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.state = {
      currentBar: 0,
      currentSection: 'intro',
      parameters: this.getDefaultParameters(),
      tendencyMasks: this.createDefaultTendencyMasks(),
      mutationHistory: [],
    };
    this.events = [];
  }

  /**
   * Get evolution events
   */
  getEvents(): EvolutionEvent[] {
    return [...this.events];
  }

  /**
   * Clear events
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EvolutionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): EvolutionConfig {
    return { ...this.config };
  }

  /**
   * Force a mutation
   */
  forceMutation(parameter: keyof TendencyMaskSet, direction?: 'increase' | 'decrease'): void {
    const mask = this.state.tendencyMasks[parameter];
    const oldValue = mask.current;

    const mutationDirection = direction === 'increase' ? 1 : direction === 'decrease' ? -1 : this.rng() < 0.5 ? -1 : 1;
    const mutationMagnitude = this.config.mutationAmount * (mask.max - mask.min);

    let newValue = mask.current + mutationDirection * mutationMagnitude;
    newValue = Math.max(mask.min, Math.min(mask.max, newValue));

    mask.current = newValue;
    mask.target = newValue;

    this.state.mutationHistory.push({
      bar: this.state.currentBar,
      parameter: parameter,
      fromValue: oldValue,
      toValue: newValue,
      reason: 'forced_mutation',
    });

    this.events.push({
      bar: this.state.currentBar,
      type: 'mutation',
      data: { parameter, from: oldValue, to: newValue, forced: true },
    });
  }

  /**
   * Jump to specific bar
   */
  jumpToBar(bar: number): void {
    this.state.currentBar = bar;
    this.checkSectionChange();
  }

  /**
   * Get total duration in bars
   */
  getTotalDuration(): number {
    return this.sections.reduce((sum, section) => sum + section.duration, 0);
  }
}

export default EvolutionEngine;
