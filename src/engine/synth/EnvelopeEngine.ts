export type EnvelopeCurve = 'linear' | 'exponential' | 'logarithmic';

export interface ADSRParams {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  attackCurve?: EnvelopeCurve;
  decayCurve?: EnvelopeCurve;
  releaseCurve?: EnvelopeCurve;
}

export class EnvelopeEngine {
  private context: AudioContext;
  private param: AudioParam;
  private params: ADSRParams;

  private maxValue: number;
  private minValue: number;
  // private releaseStartTime: number = 0;
  private releaseStartValue: number = 0;
  private isTriggered: boolean = false;

  constructor(
    context: AudioContext,
    param: AudioParam,
    params: ADSRParams,
    minValue: number = 0,
    maxValue: number = 1
  ) {
    this.context = context;
    this.param = param;
    this.params = {
      attackCurve: 'exponential',
      decayCurve: 'exponential',
      releaseCurve: 'exponential',
      ...params,
    };
    this.minValue = minValue;
    this.maxValue = maxValue;
  }

  trigger(time?: number): void {
    const startTime = time ?? this.context.currentTime;

    // Cancel any scheduled changes
    this.param.cancelScheduledValues(startTime);

    // Start from minimum value
    this.param.setValueAtTime(this.minValue, startTime);

    // Attack phase
    const attackTime = startTime + this.params.attack;
    this.applyRamp(
      this.param,
      this.minValue,
      this.maxValue,
      startTime,
      attackTime,
      this.params.attackCurve ?? 'exponential'
    );

    // Decay phase
    const decayTime = attackTime + this.params.decay;
    const sustainValue = this.minValue + (this.maxValue - this.minValue) * this.params.sustain;
    this.applyRamp(
      this.param,
      this.maxValue,
      sustainValue,
      attackTime,
      decayTime,
      this.params.decayCurve ?? 'exponential'
    );

    // Hold at sustain
    this.param.setValueAtTime(sustainValue, decayTime);

    this.isTriggered = true;
  }

  release(time?: number): void {
    if (!this.isTriggered) return;

    const releaseTime = time ?? this.context.currentTime;

    // Cancel future scheduled values
    this.param.cancelScheduledValues(releaseTime);

    // Get current value
    this.releaseStartValue = this.param.value;
    // this.releaseStartTime = releaseTime;

    // Set current value explicitly
    this.param.setValueAtTime(this.releaseStartValue, releaseTime);

    // Release to minimum
    const releaseEndTime = releaseTime + this.params.release;
    this.applyRamp(
      this.param,
      this.releaseStartValue,
      this.minValue,
      releaseTime,
      releaseEndTime,
      this.params.releaseCurve ?? 'exponential'
    );

    this.isTriggered = false;
  }

  private applyRamp(
    param: AudioParam,
    startValue: number,
    endValue: number,
    startTime: number,
    endTime: number,
    curve: EnvelopeCurve
  ): void {
    const duration = endTime - startTime;

    if (duration <= 0) {
      param.setValueAtTime(endValue, endTime);
      return;
    }

    switch (curve) {
      case 'linear':
        param.linearRampToValueAtTime(endValue, endTime);
        break;

      case 'exponential':
        // Exponential ramps can't go to/from 0, so use a tiny value
        const safeEndValue = endValue === 0 ? 0.00001 : endValue;
        const safeStartValue = startValue === 0 ? 0.00001 : startValue;

        // Set start value if needed
        if (Math.abs(param.value - safeStartValue) > 0.0001) {
          param.setValueAtTime(safeStartValue, startTime);
        }

        param.exponentialRampToValueAtTime(safeEndValue, endTime);
        break;

      case 'logarithmic':
        // Simulate logarithmic curve with multiple linear segments
        this.applyLogarithmicRamp(param, startValue, endValue, startTime, endTime);
        break;
    }
  }

  private applyLogarithmicRamp(
    param: AudioParam,
    startValue: number,
    endValue: number,
    startTime: number,
    endTime: number
  ): void {
    const segments = 10;
    const duration = endTime - startTime;

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      // Logarithmic curve: fast at start, slow at end
      const logT = Math.log(1 + t * 9) / Math.log(10);
      const value = startValue + (endValue - startValue) * logT;
      const time = startTime + duration * t;

      param.linearRampToValueAtTime(value, time);
    }
  }

  updateParams(params: Partial<ADSRParams>): void {
    this.params = { ...this.params, ...params };
  }

  getParams(): ADSRParams {
    return { ...this.params };
  }

  isActive(): boolean {
    return this.isTriggered;
  }
}

export class AmpEnvelope extends EnvelopeEngine {
  constructor(context: AudioContext, gainNode: GainNode, params: ADSRParams) {
    super(context, gainNode.gain, params, 0, 1);
  }
}

export class FilterEnvelope extends EnvelopeEngine {
  private baseFrequency: number;
  private envelopeAmount: number;

  constructor(
    context: AudioContext,
    filterFreqParam: AudioParam,
    params: ADSRParams,
    baseFrequency: number = 1000,
    envelopeAmount: number = 5000
  ) {
    super(context, filterFreqParam, params, baseFrequency, baseFrequency + envelopeAmount);
    this.baseFrequency = baseFrequency;
    this.envelopeAmount = envelopeAmount;
  }

  setBaseFrequency(freq: number): void {
    this.baseFrequency = freq;
  }

  setEnvelopeAmount(amount: number): void {
    this.envelopeAmount = amount;
  }

  trigger(time?: number): void {
    // Update max value based on current settings
    const maxValue = this.baseFrequency + this.envelopeAmount;
    const minValue = this.baseFrequency;

    // Temporarily update min/max (not ideal, but works)
    this['minValue'] = minValue;
    this['maxValue'] = maxValue;

    super.trigger(time);

    // Restore (in case they were set differently)
    // Actually, leave them as is since we want the new values
  }
}

// Utility class to manage multiple envelopes
export class EnvelopeSet {
  public amp: EnvelopeEngine;
  public filter: EnvelopeEngine | null = null;

  constructor(
    context: AudioContext,
    gainNode: GainNode,
    ampParams: ADSRParams,
    filterParams?: { param: AudioParam; envelope: ADSRParams; min?: number; max?: number }
  ) {
    this.amp = new EnvelopeEngine(context, gainNode.gain, ampParams, 0, 1);

    if (filterParams) {
      this.filter = new EnvelopeEngine(
        context,
        filterParams.param,
        filterParams.envelope,
        filterParams.min ?? 0,
        filterParams.max ?? 1
      );
    }
  }

  trigger(time?: number): void {
    this.amp.trigger(time);
    if (this.filter) {
      this.filter.trigger(time);
    }
  }

  release(time?: number): void {
    this.amp.release(time);
    if (this.filter) {
      this.filter.release(time);
    }
  }

  updateAmpParams(params: Partial<ADSRParams>): void {
    this.amp.updateParams(params);
  }

  updateFilterParams(params: Partial<ADSRParams>): void {
    if (this.filter) {
      this.filter.updateParams(params);
    }
  }

  isActive(): boolean {
    return this.amp.isActive() || (this.filter?.isActive() ?? false);
  }
}
