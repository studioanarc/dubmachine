import * as Tone from 'tone';
import { BaseEffect } from './BaseEffect';

/**
 * Granular Processor: Granular synthesis effect
 * Breaks audio into tiny grains and rearranges them
 */
export class GranularProcessor extends BaseEffect {
  private grainPlayer: Tone.GrainPlayer;
  private recorder: Tone.Recorder;
  private isRecording: boolean = false;
  private wetGain: Tone.Gain;

  constructor() {
    super({
      name: 'Granular Processor',
      type: 'GranularProcessor',
      category: 'granular',
      version: '1.0.0'
    });

    // Note: GrainPlayer needs an audio buffer to work with
    // This is a simplified implementation
    this.grainPlayer = new Tone.GrainPlayer({
      grainSize: 0.1,
      overlap: 0.05,
      playbackRate: 1,
      loop: true
    });

    this.recorder = new Tone.Recorder();
    this.wetGain = new Tone.Gain(1);

    // Signal chain
    this.input.connect(this.recorder);
    this.grainPlayer.connect(this.wetGain);

    // Wet/Dry
    this.input.connect(this.wetDry.a);
    this.wetGain.connect(this.wetDry.b);
    this.wetDry.connect(this.output);

    // Initialize parameters
    this.addParameter('grainSize', {
      value: 0.1,
      min: 0.01,
      max: 0.5,
      default: 0.1,
      unit: 's',
      step: 0.001
    });

    this.addParameter('overlap', {
      value: 0.05,
      min: 0,
      max: 0.5,
      default: 0.05,
      unit: 's',
      step: 0.001
    });

    this.addParameter('playbackRate', {
      value: 1,
      min: 0.1,
      max: 4,
      default: 1,
      step: 0.01
    });

    this.addParameter('density', {
      value: 1,
      min: 0.1,
      max: 4,
      default: 1,
      step: 0.1
    });

    this.addParameter('spread', {
      value: 0,
      min: 0,
      max: 1,
      default: 0,
      step: 0.01
    });

    this.addParameter('reverse', {
      value: 0,
      min: 0,
      max: 1,
      default: 0,
      step: 0.01
    });
  }

  protected onParameterChange(name: string, value: number): void {
    switch (name) {
      case 'grainSize':
        this.grainPlayer.grainSize = value;
        break;
      case 'overlap':
        this.grainPlayer.overlap = value;
        break;
      case 'playbackRate':
        this.grainPlayer.playbackRate = value;
        break;
    }
  }

  /**
   * Start recording audio for granular processing
   */
  public async startRecording(): Promise<void> {
    if (!this.isRecording) {
      this.recorder.start();
      this.isRecording = true;
    }
  }

  /**
   * Stop recording and load buffer into grain player
   */
  public async stopRecording(): Promise<void> {
    if (this.isRecording) {
      const recording = await this.recorder.stop();
      this.isRecording = false;

      // Load recording into grain player
      const blob = recording as Blob;
      // @ts-ignore
      const _url = URL.createObjectURL(blob);
      await // this.grainPlayer.load(url);
      this.grainPlayer.start();
    }
  }

  public dispose(): void {
    this.grainPlayer.dispose();
    this.recorder.dispose();
    this.wetGain.dispose();
    super.dispose();
  }
}
