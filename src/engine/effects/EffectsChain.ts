import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Effect slot configuration
 */
export interface EffectSlot {
  id: string;
  effect: BaseEffect | null;
  enabled: boolean;
  order: number;
}

/**
 * Send/Return bus configuration
 */
export interface SendBus {
  id: string;
  name: string;
  input: Tone.Gain;
  output: Tone.Gain;
  effect: BaseEffect | null;
  sendLevel: number;
  returnLevel: number;
  preFader: boolean;
}

/**
 * Routing mode for effect chain
 */
export type RoutingMode = 'serial' | 'parallel';

/**
 * Effects Chain Manager
 * Manages 8 effect slots with serial/parallel routing and 4 send/return buses
 */
export class EffectsChain {
  private input: Tone.Gain;
  private output: Tone.Gain;
  private slots: EffectSlot[];
  private sendBuses: Map<string, SendBus>;
  private routingMode: RoutingMode = 'serial';
  private masterBypass: boolean = false;
  private dryWet: Tone.CrossFade;

  private readonly MAX_SLOTS = 8;
  private readonly MAX_SENDS = 4;

  constructor() {
    this.input = new Tone.Gain(1);
    this.output = new Tone.Gain(1);
    this.dryWet = new Tone.CrossFade(1);

    // Initialize effect slots
    this.slots = [];
    for (let i = 0; i < this.MAX_SLOTS; i++) {
      this.slots.push({
        id: `slot-${i}`,
        effect: null,
        enabled: true,
        order: i
      });
    }

    // Initialize send buses
    this.sendBuses = new Map();
    for (let i = 0; i < this.MAX_SENDS; i++) {
      const bus: SendBus = {
        id: `send-${i}`,
        name: `Send ${i + 1}`,
        input: new Tone.Gain(1),
        output: new Tone.Gain(1),
        effect: null,
        sendLevel: 0,
        returnLevel: 1,
        preFader: true
      };

      // Connect bus internally
      bus.input.connect(bus.output);

      this.sendBuses.set(bus.id, bus);
    }

    // Default routing
    this.updateRouting();
  }

  /**
   * Add an effect to a slot
   */
  public addEffect(slotIndex: number, effect: BaseEffect): void {
    if (slotIndex < 0 || slotIndex >= this.MAX_SLOTS) {
      throw new Error(`Invalid slot index: ${slotIndex}`);
    }

    // Remove existing effect if present
    if (this.slots[slotIndex].effect) {
      this.removeEffect(slotIndex);
    }

    this.slots[slotIndex].effect = effect;
    this.updateRouting();
  }

  /**
   * Remove an effect from a slot
   */
  public removeEffect(slotIndex: number): void {
    if (slotIndex < 0 || slotIndex >= this.MAX_SLOTS) {
      throw new Error(`Invalid slot index: ${slotIndex}`);
    }

    const slot = this.slots[slotIndex];
    if (slot.effect) {
      slot.effect.disconnect();
      slot.effect = null;
      this.updateRouting();
    }
  }

  /**
   * Enable or disable an effect slot
   */
  public setSlotEnabled(slotIndex: number, enabled: boolean): void {
    if (slotIndex < 0 || slotIndex >= this.MAX_SLOTS) {
      throw new Error(`Invalid slot index: ${slotIndex}`);
    }

    this.slots[slotIndex].enabled = enabled;
    if (this.slots[slotIndex].effect) {
      this.slots[slotIndex].effect!.setBypass(!enabled);
    }
  }

  /**
   * Reorder effects (drag & drop)
   */
  public reorderEffects(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.MAX_SLOTS ||
        toIndex < 0 || toIndex >= this.MAX_SLOTS) {
      throw new Error('Invalid slot indices');
    }

    const [movedSlot] = this.slots.splice(fromIndex, 1);
    this.slots.splice(toIndex, 0, movedSlot);

    // Update order property
    this.slots.forEach((slot, index) => {
      slot.order = index;
    });

    this.updateRouting();
  }

  /**
   * Set routing mode (serial or parallel)
   */
  public setRoutingMode(mode: RoutingMode): void {
    this.routingMode = mode;
    this.updateRouting();
  }

  /**
   * Get current routing mode
   */
  public getRoutingMode(): RoutingMode {
    return this.routingMode;
  }

  /**
   * Update signal routing based on current configuration
   */
  private updateRouting(): void {
    // Disconnect everything first
    this.input.disconnect();
    this.slots.forEach(slot => {
      if (slot.effect) {
        slot.effect.disconnect();
      }
    });
    this.sendBuses.forEach(bus => {
      bus.input.disconnect();
      bus.output.disconnect();
    });

    const activeEffects = this.slots
      .filter(slot => slot.effect !== null && slot.enabled)
      .map(slot => slot.effect!);

    if (activeEffects.length === 0) {
      // No effects, direct connection
      this.input.connect(this.output);
      return;
    }

    if (this.routingMode === 'serial') {
      // Serial routing: input -> effect1 -> effect2 -> ... -> output
      let currentNode: Tone.ToneAudioNode = this.input;

      activeEffects.forEach((effect) => {
        currentNode.connect(effect.getInput());
        currentNode = effect.getOutput() as any;

        // Connect to send buses (pre-fader)
        this.sendBuses.forEach(bus => {
          if (bus.sendLevel > 0 && bus.preFader) {
            effect.getOutput().connect(bus.input as any);
          }
        });
      });

      // Connect last effect to output
      currentNode.connect(this.output);

      // Post-fader sends
      this.sendBuses.forEach(bus => {
        if (bus.sendLevel > 0 && !bus.preFader) {
          this.output.connect(bus.input);
        }

        // Connect bus returns to output
        if (bus.effect) {
          bus.input.connect(bus.effect.getInput());
          bus.effect.getOutput().connect(bus.output as any);
        }
        bus.output.connect(this.output as any);
      });

    } else {
      // Parallel routing: input splits to all effects, then mixed
      const mixer = new Tone.Gain(1 / activeEffects.length);

      activeEffects.forEach(effect => {
        this.input.connect(effect.getInput());
        effect.getOutput().connect(mixer as any);
      });

      mixer.connect(this.output as any);

      // Send buses in parallel mode
      this.sendBuses.forEach(bus => {
        if (bus.sendLevel > 0) {
          this.input.connect(bus.input);
        }

        if (bus.effect) {
          bus.input.connect(bus.effect.getInput());
          bus.effect.getOutput().connect(bus.output as any);
        }
        bus.output.connect(this.output as any);
      });
    }
  }

  /**
   * Add effect to a send bus
   */
  public setSendEffect(busId: string, effect: BaseEffect | null): void {
    const bus = this.sendBuses.get(busId);
    if (!bus) {
      throw new Error(`Send bus not found: ${busId}`);
    }

    // Remove existing effect
    if (bus.effect) {
      bus.effect.disconnect();
    }

    bus.effect = effect;
    this.updateRouting();
  }

  /**
   * Set send level for a bus
   */
  public setSendLevel(busId: string, level: number): void {
    const bus = this.sendBuses.get(busId);
    if (!bus) {
      throw new Error(`Send bus not found: ${busId}`);
    }

    bus.sendLevel = Math.max(0, Math.min(1, level));
    bus.input.gain.value = bus.sendLevel;
  }

  /**
   * Set return level for a bus
   */
  public setReturnLevel(busId: string, level: number): void {
    const bus = this.sendBuses.get(busId);
    if (!bus) {
      throw new Error(`Send bus not found: ${busId}`);
    }

    bus.returnLevel = Math.max(0, Math.min(1, level));
    bus.output.gain.value = bus.returnLevel;
  }

  /**
   * Set send bus to pre or post fader
   */
  public setSendPreFader(busId: string, preFader: boolean): void {
    const bus = this.sendBuses.get(busId);
    if (!bus) {
      throw new Error(`Send bus not found: ${busId}`);
    }

    bus.preFader = preFader;
    this.updateRouting();
  }

  /**
   * Get all send buses
   */
  public getSendBuses(): SendBus[] {
    return Array.from(this.sendBuses.values());
  }

  /**
   * Get a specific send bus
   */
  public getSendBus(busId: string): SendBus | undefined {
    return this.sendBuses.get(busId);
  }

  /**
   * Master bypass
   */
  public setMasterBypass(bypass: boolean): void {
    this.masterBypass = bypass;
    if (bypass) {
      this.dryWet.fade.value = 0; // 100% dry
    } else {
      this.dryWet.fade.value = 1; // 100% wet
    }
  }

  /**
   * Check if master bypass is enabled
   */
  public isMasterBypassed(): boolean {
    return this.masterBypass;
  }

  /**
   * Get all effect slots
   */
  public getSlots(): EffectSlot[] {
    return [...this.slots];
  }

  /**
   * Get a specific effect slot
   */
  public getSlot(index: number): EffectSlot | undefined {
    return this.slots[index];
  }

  /**
   * Connect the chain to a source
   */
  public connectFrom(source: Tone.ToneAudioNode): void {
    source.connect(this.input);
  }

  /**
   * Connect the chain to a destination
   */
  public connectTo(destination: Tone.InputNode): void {
    this.output.connect(destination);
  }

  /**
   * Get input node
   */
  public getInput(): Tone.InputNode {
    return this.input;
  }

  /**
   * Get output node
   */
  public getOutput(): Tone.OutputNode {
    return this.output;
  }

  /**
   * Serialize chain configuration to JSON
   */
  public toJSON(): object {
    return {
      routingMode: this.routingMode,
      masterBypass: this.masterBypass,
      slots: this.slots.map(slot => ({
        id: slot.id,
        enabled: slot.enabled,
        order: slot.order,
        effect: slot.effect ? slot.effect.toJSON() : null
      })),
      sendBuses: Array.from(this.sendBuses.values()).map(bus => ({
        id: bus.id,
        name: bus.name,
        sendLevel: bus.sendLevel,
        returnLevel: bus.returnLevel,
        preFader: bus.preFader,
        effect: bus.effect ? bus.effect.toJSON() : null
      }))
    };
  }

  /**
   * Load chain configuration from JSON
   */
  public fromJSON(data: any): void {
    if (data.routingMode) {
      this.routingMode = data.routingMode;
    }

    if (typeof data.masterBypass === 'boolean') {
      this.setMasterBypass(data.masterBypass);
    }

    if (data.slots) {
      data.slots.forEach((slotData: any, index: number) => {
        if (slotData.enabled !== undefined) {
          this.setSlotEnabled(index, slotData.enabled);
        }
        // Note: Effects would need to be instantiated separately
        // This just restores configuration
      });
    }

    if (data.sendBuses) {
      data.sendBuses.forEach((busData: any) => {
        if (this.sendBuses.has(busData.id)) {
          if (busData.sendLevel !== undefined) {
            this.setSendLevel(busData.id, busData.sendLevel);
          }
          if (busData.returnLevel !== undefined) {
            this.setReturnLevel(busData.id, busData.returnLevel);
          }
          if (busData.preFader !== undefined) {
            this.setSendPreFader(busData.id, busData.preFader);
          }
        }
      });
    }

    this.updateRouting();
  }

  /**
   * Dispose of all resources
   */
  public dispose(): void {
    this.slots.forEach(slot => {
      if (slot.effect) {
        slot.effect.dispose();
      }
    });

    this.sendBuses.forEach(bus => {
      if (bus.effect) {
        bus.effect.dispose();
      }
      bus.input.dispose();
      bus.output.dispose();
    });

    this.input.dispose();
    this.output.dispose();
    this.dryWet.dispose();
  }
}
