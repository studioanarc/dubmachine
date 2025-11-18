import * as Tone from 'tone';
import { LFOEngine } from './LFOEngine';
import { EnvelopeEngine } from './EnvelopeEngine';

export type ModSource = 'lfo1' | 'lfo2' | 'lfo3' | 'env1' | 'env2' | 'custom';
export type ModDestination =
  | 'osc1Pitch'
  | 'osc2Pitch'
  | 'osc3Pitch'
  | 'osc1Level'
  | 'osc2Level'
  | 'osc3Level'
  | 'filterFreq'
  | 'filterRes'
  | 'pwm1'
  | 'pwm2'
  | 'pwm3'
  | 'pan'
  | 'custom';

export interface ModulationRoute {
  id: string;
  source: ModSource;
  destination: ModDestination;
  amount: number; // -1 to 1
  enabled: boolean;
}

export interface ModulationConnection {
  route: ModulationRoute;
  source: Tone.Signal | AudioParam;
  destination: AudioParam;
  gain: GainNode;
  scaler?: GainNode; // For scaling the modulation amount
}

export class ModulationMatrix {
  private context: AudioContext;
  private connections: Map<string, ModulationConnection> = new Map();

  // Modulation sources
  private sources: Map<string, Tone.Signal | LFOEngine | EnvelopeEngine> = new Map();

  // Modulation destinations (audio params to modulate)
  private destinations: Map<string, AudioParam> = new Map();

  constructor(context: AudioContext) {
    this.context = context;
  }

  // Register a modulation source (LFO or Envelope)
  registerSource(name: string, source: Tone.Signal | LFOEngine | EnvelopeEngine): void {
    this.sources.set(name, source);
  }

  // Register a modulation destination (AudioParam)
  registerDestination(name: string, param: AudioParam): void {
    this.destinations.set(name, param);
  }

  // Create a modulation route
  createRoute(route: ModulationRoute): boolean {
    // Check if route already exists
    if (this.connections.has(route.id)) {
      console.warn(`Modulation route ${route.id} already exists`);
      return false;
    }

    // Get source
    const sourceObj = this.sources.get(route.source);
    if (!sourceObj) {
      console.error(`Modulation source ${route.source} not found`);
      return false;
    }

    // Get destination
    const destParam = this.destinations.get(route.destination);
    if (!destParam) {
      console.error(`Modulation destination ${route.destination} not found`);
      return false;
    }

    // Create connection
    const connection = this.connectSourceToDestination(sourceObj, destParam, route);

    if (connection) {
      this.connections.set(route.id, connection);
      return true;
    }

    return false;
  }

  private connectSourceToDestination(
    source: Tone.Signal | LFOEngine | EnvelopeEngine,
    destination: AudioParam,
    route: ModulationRoute
  ): ModulationConnection | null {
    // Create gain node for amount control
    const gain = this.context.createGain();
    gain.gain.value = route.enabled ? route.amount : 0;

    let sourceSignal: Tone.Signal | AudioParam;

    // Extract signal from source
    if (source instanceof LFOEngine) {
      sourceSignal = source.getOutput();
    } else if (source instanceof Tone.Signal) {
      sourceSignal = source;
    } else {
      // EnvelopeEngine - these modulate AudioParams directly
      // For envelopes, we need to handle differently since they trigger/release
      console.warn('Envelope modulation routing is handled internally');
      return null;
    }

    // Connect: source -> gain -> destination
    (sourceSignal as any).connect(gain);
    gain.connect(destination);

    return {
      route,
      source: sourceSignal as any,
      destination,
      gain,
    };
  }

  // Update modulation amount
  setAmount(routeId: string, amount: number): void {
    const connection = this.connections.get(routeId);
    if (connection) {
      connection.route.amount = amount;
      if (connection.route.enabled) {
        connection.gain.gain.value = amount;
      }
    }
  }

  // Enable/disable a route
  setEnabled(routeId: string, enabled: boolean): void {
    const connection = this.connections.get(routeId);
    if (connection) {
      connection.route.enabled = enabled;
      connection.gain.gain.value = enabled ? connection.route.amount : 0;
    }
  }

  // Remove a modulation route
  removeRoute(routeId: string): boolean {
    const connection = this.connections.get(routeId);
    if (!connection) {
      return false;
    }

    // Disconnect nodes
    try {
      connection.gain.disconnect();
      if (connection.scaler) {
        connection.scaler.disconnect();
      }
    } catch (e) {
      console.warn('Error disconnecting modulation route:', e);
    }

    this.connections.delete(routeId);
    return true;
  }

  // Get all active routes
  getRoutes(): ModulationRoute[] {
    return Array.from(this.connections.values()).map((conn) => conn.route);
  }

  // Get route by ID
  getRoute(routeId: string): ModulationRoute | null {
    const connection = this.connections.get(routeId);
    return connection ? connection.route : null;
  }

  // Clear all routes
  clearAll(): void {
    const routeIds = Array.from(this.connections.keys());
    routeIds.forEach((id) => this.removeRoute(id));
  }

  // Create a direct custom modulation route (for advanced usage)
  createCustomRoute(
    routeId: string,
    source: Tone.Signal,
    destination: AudioParam,
    amount: number,
    enabled: boolean = true
  ): boolean {
    const route: ModulationRoute = {
      id: routeId,
      source: 'custom',
      destination: 'custom',
      amount,
      enabled,
    };

    const gain = this.context.createGain();
    gain.gain.value = enabled ? amount : 0;

    source.connect(gain as any);
    gain.connect(destination);

    this.connections.set(routeId, {
      route,
      source,
      destination,
      gain,
    });

    return true;
  }

  dispose(): void {
    this.clearAll();
    this.sources.clear();
    this.destinations.clear();
  }
}

// Helper class for common modulation routing presets
export class ModulationPresets {
  static vibrato(matrix: ModulationMatrix, lfoName: string, amount: number = 0.05): void {
    matrix.createRoute({
      id: 'vibrato',
      source: lfoName as ModSource,
      destination: 'osc1Pitch',
      amount,
      enabled: true,
    });
  }

  static tremolo(matrix: ModulationMatrix, lfoName: string, amount: number = 0.3): void {
    matrix.createRoute({
      id: 'tremolo',
      source: lfoName as ModSource,
      destination: 'osc1Level',
      amount,
      enabled: true,
    });
  }

  static filterSweep(matrix: ModulationMatrix, lfoName: string, amount: number = 1000): void {
    matrix.createRoute({
      id: 'filterSweep',
      source: lfoName as ModSource,
      destination: 'filterFreq',
      amount,
      enabled: true,
    });
  }

  static pwmModulation(
    matrix: ModulationMatrix,
    lfoName: string,
    pwmIndex: 1 | 2 | 3,
    amount: number = 0.3
  ): void {
    matrix.createRoute({
      id: `pwm${pwmIndex}`,
      source: lfoName as ModSource,
      destination: `pwm${pwmIndex}` as ModDestination,
      amount,
      enabled: true,
    });
  }

  static dubChordMod(matrix: ModulationMatrix): void {
    // Classic dub techno chord modulation
    // Slow filter sweep
    matrix.createRoute({
      id: 'dubFilter',
      source: 'lfo1',
      destination: 'filterFreq',
      amount: 2000,
      enabled: true,
    });

    // Subtle pitch drift
    matrix.createRoute({
      id: 'dubPitch',
      source: 'lfo2',
      destination: 'osc1Pitch',
      amount: 0.02,
      enabled: true,
    });

    // PWM on pad sound
    matrix.createRoute({
      id: 'dubPWM',
      source: 'lfo3',
      destination: 'pwm1',
      amount: 0.4,
      enabled: true,
    });
  }
}
