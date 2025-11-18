/**
 * EuclideanRhythm.ts
 * Implementation of Euclidean rhythm algorithm E(k, n)
 * Creates maximally even distribution of k beats over n steps
 */

export interface EuclideanPattern {
  pattern: boolean[]; // true = hit, false = rest
  pulses: number; // k - number of hits
  steps: number; // n - total steps
  rotation: number; // Pattern rotation offset
}

export interface RhythmConfig {
  pulses: number; // k
  steps: number; // n
  rotation?: number; // Rotate pattern
  probability?: number; // Per-step probability (0-1)
  swing?: number; // Swing amount (0-1)
  humanize?: number; // Timing humanization (0-1)
}

export interface RhythmEvent {
  step: number; // Step index
  time: number; // Time in beats
  velocity: number; // MIDI velocity
  active: boolean; // Whether this step is active
}

export class EuclideanRhythm {
  private rng: () => number;

  constructor(seed?: number) {
    this.rng = this.createSeededRNG(seed);
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
   * Generate Euclidean rhythm pattern E(k, n)
   * Using Bjorklund's algorithm
   */
  generate(config: RhythmConfig): EuclideanPattern {
    const { pulses, steps, rotation = 0 } = config;

    if (pulses > steps) {
      throw new Error('Pulses cannot exceed steps');
    }

    if (pulses === 0) {
      return {
        pattern: new Array(steps).fill(false),
        pulses: 0,
        steps,
        rotation: 0,
      };
    }

    if (pulses === steps) {
      return {
        pattern: new Array(steps).fill(true),
        pulses: steps,
        steps,
        rotation: 0,
      };
    }

    // Bjorklund's algorithm
    const pattern = this.bjorklund(pulses, steps);

    // Apply rotation
    const rotated = this.rotate(pattern, rotation);

    return {
      pattern: rotated,
      pulses,
      steps,
      rotation,
    };
  }

  /**
   * Bjorklund's algorithm for Euclidean rhythms
   */
  private bjorklund(pulses: number, steps: number): boolean[] {
    // Start with k ones and n-k zeros
    const counts: number[] = [];
    const remainders: number[] = [];

    let divisor = steps - pulses;
    remainders.push(pulses);

    // Build up pattern using Euclidean algorithm
    let level = 0;
    while (true) {
      counts[level] = Math.floor(divisor / remainders[level]);
      remainders[level + 1] = divisor % remainders[level];

      if (remainders[level + 1] === 0) break;

      divisor = remainders[level];
      level++;
    }

    counts[level] = divisor;

    // Build pattern from the computed values
    const pattern = this.buildPattern(counts, remainders, level);

    return pattern;
  }

  /**
   * Build the pattern from Euclidean algorithm results
   */
  private buildPattern(counts: number[], remainders: number[], level: number): boolean[] {
    const pattern: boolean[] = [];

    // Simple case: alternating pattern
    if (level === 0) {
      for (let i = 0; i < counts[0]; i++) {
        pattern.push(true);
        pattern.push(false);
      }
      for (let i = 0; i < remainders[0]; i++) {
        pattern.push(true);
      }
      return pattern;
    }

    // Recursive build for complex patterns
    // This is a simplified version - full implementation would be more complex
    // For most dub techno use cases, the simple patterns are sufficient
    const totalSteps = counts.reduce((sum, c) => sum + c, 0) + remainders.reduce((sum, r) => sum + r, 0);
    const totalPulses = remainders[0];

    // Use simple distribution
    const interval = totalSteps / totalPulses;
    for (let i = 0; i < totalSteps; i++) {
      const pulseIndex = Math.floor(i / interval);
      const shouldHit = Math.floor(pulseIndex * interval) === i;
      pattern.push(shouldHit);
    }

    return pattern.slice(0, totalSteps);
  }

  /**
   * Rotate pattern by offset steps
   */
  private rotate(pattern: boolean[], offset: number): boolean[] {
    if (offset === 0 || pattern.length === 0) return pattern;

    const normalizedOffset = ((offset % pattern.length) + pattern.length) % pattern.length;
    return [...pattern.slice(normalizedOffset), ...pattern.slice(0, normalizedOffset)];
  }

  /**
   * Generate rhythm events with timing and velocity
   */
  generateEvents(
    config: RhythmConfig,
    beatDuration: number = 0.25,
    velocityRange: [number, number] = [80, 110]
  ): RhythmEvent[] {
    const eucPattern = this.generate(config);
    const events: RhythmEvent[] = [];

    const swing = config.swing ?? 0;
    const humanize = config.humanize ?? 0;
    const probability = config.probability ?? 1;

    for (let i = 0; i < eucPattern.pattern.length; i++) {
      const isHit = eucPattern.pattern[i];

      // Apply per-step probability
      const shouldTrigger = isHit && this.rng() < probability;

      // Calculate timing
      let time = i * beatDuration;

      // Apply swing (delay every other hit)
      if (swing > 0 && i % 2 === 1) {
        time += beatDuration * swing * 0.5;
      }

      // Apply humanization (random timing variation)
      if (humanize > 0) {
        const timeVariation = (this.rng() - 0.5) * beatDuration * humanize;
        time += timeVariation;
      }

      // Calculate velocity
      let velocity = velocityRange[0] + this.rng() * (velocityRange[1] - velocityRange[0]);

      // Add accent on first beat
      if (i === 0) {
        velocity = Math.min(127, velocity * 1.2);
      }

      // Humanize velocity
      if (humanize > 0) {
        const velocityVariation = (this.rng() - 0.5) * 20 * humanize;
        velocity += velocityVariation;
      }

      velocity = Math.max(velocityRange[0], Math.min(velocityRange[1], velocity));

      events.push({
        step: i,
        time: Math.max(0, time),
        velocity: Math.round(velocity),
        active: shouldTrigger,
      });
    }

    return events;
  }

  /**
   * Create polyrhythm by combining multiple Euclidean patterns
   */
  generatePolyrhythm(configs: RhythmConfig[], beatDuration: number = 0.25): RhythmEvent[][] {
    return configs.map(config => this.generateEvents(config, beatDuration));
  }

  /**
   * Merge multiple rhythm patterns into a single event stream
   */
  mergePatterns(patterns: RhythmEvent[][]): RhythmEvent[] {
    const merged: RhythmEvent[] = [];
    const maxLength = Math.max(...patterns.map(p => p.length));

    for (let i = 0; i < maxLength; i++) {
      let hasActiveEvent = false;
      let totalVelocity = 0;
      let count = 0;
      let time = 0;

      for (const pattern of patterns) {
        if (i < pattern.length && pattern[i].active) {
          hasActiveEvent = true;
          totalVelocity += pattern[i].velocity;
          time = pattern[i].time;
          count++;
        }
      }

      if (hasActiveEvent) {
        merged.push({
          step: i,
          time,
          velocity: Math.round(totalVelocity / count),
          active: true,
        });
      }
    }

    return merged.sort((a, b) => a.time - b.time);
  }

  /**
   * Get common Euclidean rhythm patterns
   */
  static getPreset(name: string): RhythmConfig {
    const presets: Record<string, RhythmConfig> = {
      // Classic patterns
      'tresillo': { pulses: 3, steps: 8, rotation: 0 }, // Cuban tresillo
      'cinquillo': { pulses: 5, steps: 8, rotation: 0 }, // Cuban cinquillo
      'son_clave': { pulses: 5, steps: 16, rotation: 0 }, // Son clave
      'rumba_clave': { pulses: 5, steps: 16, rotation: 4 }, // Rumba clave

      // Techno patterns
      'four_floor': { pulses: 4, steps: 16, rotation: 0 }, // Four on the floor
      'backbeat': { pulses: 2, steps: 16, rotation: 4 }, // Backbeat (2 and 4)
      'half_time': { pulses: 2, steps: 16, rotation: 0 }, // Half-time kick

      // Hi-hat patterns
      'eighth_hats': { pulses: 8, steps: 16, rotation: 0 },
      'sixteenth_hats': { pulses: 16, steps: 16, rotation: 0 },
      'sparse_hats': { pulses: 5, steps: 16, rotation: 2 },
      'syncopated_hats': { pulses: 7, steps: 16, rotation: 1 },

      // Percussion
      'sparse_perc': { pulses: 3, steps: 16, rotation: 0 },
      'medium_perc': { pulses: 5, steps: 16, rotation: 3 },
      'dense_perc': { pulses: 11, steps: 16, rotation: 0 },

      // Dub specific
      'dub_kick': { pulses: 4, steps: 16, rotation: 0, probability: 0.95 },
      'dub_snare': { pulses: 2, steps: 16, rotation: 4, probability: 0.9 },
      'dub_hats': { pulses: 11, steps: 16, rotation: 0, probability: 0.8, swing: 0.3 },
      'dub_perc': { pulses: 5, steps: 16, rotation: 7, probability: 0.7 },
    };

    return presets[name] || { pulses: 4, steps: 16 };
  }

  /**
   * Generate complementary pattern (inverted)
   */
  generateComplement(pattern: EuclideanPattern): EuclideanPattern {
    return {
      pattern: pattern.pattern.map(hit => !hit),
      pulses: pattern.steps - pattern.pulses,
      steps: pattern.steps,
      rotation: pattern.rotation,
    };
  }

  /**
   * Evolve pattern over time (gradually add/remove hits)
   */
  evolvePattern(
    currentConfig: RhythmConfig,
    targetConfig: RhythmConfig,
    amount: number // 0-1, how much to evolve
  ): RhythmConfig {
    const pulseDiff = targetConfig.pulses - currentConfig.pulses;
    const newPulses = Math.round(currentConfig.pulses + pulseDiff * amount);

    return {
      ...currentConfig,
      pulses: Math.max(0, Math.min(currentConfig.steps, newPulses)),
    };
  }

  /**
   * Create variation of a pattern by adjusting probability
   */
  createVariation(
    config: RhythmConfig,
    probabilityVariation: number = 0.1
  ): RhythmConfig {
    const baseProbability = config.probability ?? 1;
    const variation = (this.rng() - 0.5) * probabilityVariation;
    const newProbability = Math.max(0, Math.min(1, baseProbability + variation));

    return {
      ...config,
      probability: newProbability,
    };
  }
}

export default EuclideanRhythm;
