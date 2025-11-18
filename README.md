# 🎛️ Dub Machine - Futuristic Dub Techno Generative Music Webapp

<div align="center">

![Dub Machine](https://img.shields.io/badge/Dub-Machine-FFD700?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Web Audio API](https://img.shields.io/badge/Web_Audio-API-orange?style=for-the-badge)

**An advanced generative music system for creating infinite dub techno soundscapes in your browser**

[Features](#-features) • [Getting Started](#-getting-started) • [Usage](#-usage-guide) • [Architecture](#-architecture) • [API Docs](#-api-documentation)

</div>

---

## 📖 Overview

**Dub Machine** is a sophisticated browser-based generative music application that creates infinite, evolving dub techno compositions in real-time. Built with cutting-edge web technologies and powered by the Web Audio API, it combines advanced synthesis, 25+ effects processors, and intelligent generative algorithms to produce deep, atmospheric electronic music.

### What Makes It Special?

- 🎹 **Professional-grade synthesis engine** with 3 oscillators, sub-oscillator, dual filters, and modulation matrix
- 🔊 **25+ studio-quality effects** including tape echo, spring reverb, and novel experimental processors
- 🧠 **Intelligent generative algorithms** using Markov chains, Euclidean rhythms, and evolutionary systems
- 🎨 **Futuristic UI** with gesture controls, real-time visualization, and responsive design
- 💾 **Preset management** with seed-based generation for reproducible compositions
- 🌐 **100% browser-based** - no plugins, no installation required

---

## ✨ Features

### 🎛️ Multi-Engine Synthesizer

- **3 Oscillator System**: Independent oscillators with sine, square, triangle, and sawtooth waveforms
- **Sub-Oscillator**: Deep bass foundation with octave-down tracking
- **Dual Filter Architecture**: Serial/parallel routing with lowpass, highpass, bandpass, and notch modes
- **ADSR Envelopes**: Dedicated amplitude and filter envelopes for precise sound shaping
- **LFO Modulation**: Multiple LFOs with routing to pitch, filter, and amplitude
- **Modulation Matrix**: Flexible routing system for complex sound design
- **Voice Management**: Polyphonic voice allocation with intelligent voice stealing

### 🎚️ Effects Processing (25+ Effects)

#### Essential Effects
- **Tape Echo**: Authentic tape delay emulation with wow, flutter, and saturation
- **Convolution Reverb**: Realistic acoustic spaces using impulse responses
- **Spring Reverb**: Classic dub sound with spring-like resonance
- **Bit Crusher**: Digital lo-fi with sample rate and bit depth reduction
- **Digital Distortion**: Multiple distortion algorithms (soft clip, hard clip, waveshaper)
- **Analog Filter**: Resonant filters with overdrive and envelope following
- **Phaser, Flanger, Chorus**: Classic modulation effects
- **Compressor & Multiband Compressor**: Professional dynamics control
- **Parametric EQ**: Precise frequency sculpting with multiple bands
- **Stereo Width**: Spatial enhancement and stereo imaging
- **Frequency Shifter**: Harmonic shifting and bell-like tones
- **Ring Modulator**: Metallic and inharmonic textures
- **Tremolo & Auto Pan**: Rhythmic amplitude and stereo modulation
- **Gate**: Rhythmic gating and stutter effects
- **Vinyl Simulator**: Authentic vinyl artifacts and warmth

#### Novel Experimental Effects
- **Probability Delay**: Stochastic delay with random feedback and filtering
- **Spectral Freeze**: Time-stretching and spectral manipulation
- **Dub Siren**: Characteristic dub techno siren sweeps
- **Morphing Filter**: Continuous filter type morphing with automation
- **Diffusion Network**: Complex multi-tap delay network for dense textures

### 🎼 Generative Algorithms

- **Markov Chain Sequencer**: Context-aware melody and rhythm generation
- **Euclidean Rhythm Engine**: Mathematical rhythm patterns for drums and percussion
- **Harmony Generator**: Intelligent chord progressions with music theory rules
- **Melody Generator**: Phrase-based melodic content with multiple character modes
- **Drum Pattern Generator**: Style-aware drum pattern creation (minimal, hypnotic, rolling, broken)
- **Evolution Engine**: Continuous evolution and mutation of musical parameters
- **Music Theory System**: Scale-aware note generation with tension/resolution

### 🎨 User Interface

- **Futuristic Design**: Cyberpunk-inspired UI with neon accents and glassmorphism
- **Gesture Controls**: Swipe navigation between different views
- **Real-time Visualizer**: Frequency spectrum and waveform display
- **Responsive Layout**: Optimized for desktop, tablet, and mobile
- **Control Panel**: Master controls for tempo, energy, and generative parameters
- **Synth Controls**: Deep synthesis parameter editing
- **Effects Rack**: Visual effects chain with drag-and-drop routing
- **Sequencer View**: Pattern and sequence visualization
- **Preset Manager**: Save, load, and share complete system states

### 💾 Preset System

- **Seed-based Generation**: Reproducible compositions from numerical seeds
- **Complete State Saving**: Capture all synth, effects, and generative parameters
- **Browser Storage**: Automatic persistence using IndexedDB
- **Import/Export**: JSON-based preset sharing
- **Randomization**: Intelligent preset generation with musical constraints

---

## 🛠️ Technology Stack

### Core Technologies
- **TypeScript** - Type-safe development
- **React 18** - Component-based UI architecture
- **Vite** - Lightning-fast build tooling and HMR
- **Tone.js 15** - Web Audio API wrapper and scheduling engine

### UI & Animation
- **TailwindCSS** - Utility-first styling framework
- **Framer Motion** - Advanced animation library
- **React Spring** - Physics-based animations
- **Lucide React** - Modern icon library

### State Management
- **Zustand** - Lightweight reactive state management
- **React DnD** - Drag-and-drop functionality for effects routing

### Development Tools
- **ESLint** - Code quality and consistency
- **TypeScript Compiler** - Type checking and transpilation
- **PostCSS** - CSS processing and optimization

### Web APIs
- **Web Audio API** - Professional audio synthesis and processing
- **Canvas API** - Real-time audio visualization
- **LocalStorage/IndexedDB** - Client-side data persistence

---

## 🏗️ Architecture

### Modular Design

Dub Machine follows a clean, modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                   React UI Layer                     │
│  (Components, State Management, User Interaction)    │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│              Engine Controller Layer                 │
│     (Coordination, Scheduling, Event Routing)        │
└───┬───────────────┬───────────────┬─────────────────┘
    │               │               │
┌───▼──────┐  ┌────▼──────┐  ┌─────▼────────┐
│  Synth   │  │  Effects  │  │  Generative  │
│  Engine  │  │   Chain   │  │  Controller  │
└───┬──────┘  └────┬──────┘  └─────┬────────┘
    │               │               │
┌───▼───────────────▼───────────────▼─────────────────┐
│              Web Audio API (Tone.js)                 │
│         (Audio Graph, Scheduling, Processing)        │
└─────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Separation of Concerns**: Audio engine logic is completely decoupled from UI components
2. **Reactive Updates**: UI automatically reflects audio engine state changes via Zustand
3. **Modular Effects**: Each effect is self-contained with standardized interfaces
4. **Composable Synthesis**: Synth components can be combined in flexible ways
5. **Extensible Generative System**: New algorithms can be added without affecting existing code
6. **Type Safety**: Full TypeScript coverage ensures reliability and maintainability

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn
- Modern web browser with Web Audio API support (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dubmachine.git
   cd dubmachine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   Navigate to http://localhost:5173
   ```

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

The production build will be generated in the `dist/` directory and can be deployed to any static hosting service.

### Deployment

Deploy to popular platforms:

```bash
# Netlify
netlify deploy --prod

# Vercel
vercel --prod

# GitHub Pages
npm run build
# Copy dist/ to gh-pages branch
```

---

## 📘 Usage Guide

### Getting Started with Sound Generation

1. **Start the Engine**
   - Click the **PLAY** button in the header
   - The generative system will begin creating music immediately

2. **Navigate the Interface**
   - Use the navigation tabs: **CONTROL**, **SYNTH**, **EFFECTS**, **SEQUENCER**
   - Swipe left/right on touch devices to switch views

3. **Control Panel (Main View)**
   - Adjust **Tempo (BPM)** for speed
   - Set **Energy** level (0-100) for intensity
   - Configure **Complexity** for pattern variation
   - Choose **Density** for note frequency
   - Enable **Evolution** for continuous mutation

### Synthesis Deep Dive

Navigate to the **SYNTH** tab to access detailed synthesis controls:

#### Oscillators
- Configure up to 3 independent oscillators
- Choose waveforms: sine, square, triangle, sawtooth
- Set detune for thickness and character
- Adjust individual oscillator levels

#### Filters
- **Filter 1 & 2**: Dual filter architecture
- Types: lowpass, highpass, bandpass, notch
- Control cutoff frequency and resonance
- Route filters in serial or parallel

#### Envelopes
- **Amplitude Envelope**: Controls volume over time
- **Filter Envelope**: Modulates filter cutoff
- ADSR parameters: Attack, Decay, Sustain, Release

#### LFOs
- Multiple LFO routing options
- Modulate pitch, filter, amplitude
- Adjustable rate and depth

### Effects Processing

Switch to the **EFFECTS** tab for effect control:

#### Adding Effects
1. Click "Add Effect" button
2. Choose from 25+ available effects
3. Effect appears in the chain

#### Configuring Effects
- Click on any effect to expand parameters
- Adjust sliders for real-time control
- Toggle bypass to A/B compare

#### Routing Effects
- Drag and drop effects to reorder
- Switch between serial and parallel routing
- Create send/return buses for complex routing

#### Effect Recommendations
- **Dub Techno Classic**: Tape Echo → Spring Reverb → Chorus
- **Deep & Dark**: Probability Delay → Diffusion Network → Convolution Reverb
- **Experimental**: Spectral Freeze → Frequency Shifter → Ring Modulator

### Generative Controls

#### Harmony & Melody
- **Root Note**: Set the tonal center (C, D, E, etc.)
- **Scale**: Choose scale type (minor, major, dorian, phrygian, etc.)
- **Melody Character**: Sparse, flowing, rhythmic, or chaotic

#### Rhythm & Drums
- **Drum Style**: Minimal, hypnotic, rolling, or broken
- **Euclidean Rhythms**: Mathematical pattern generation
- Kick, snare, and hi-hat pattern complexity

#### Evolution Engine
- **Enable Evolution**: Turn on continuous parameter mutation
- **Mutation Rate**: Control speed of changes (0-100%)
- **Stability vs Chaos**: Balance predictability and randomness
- **Fitness Criteria**: Define what makes a "good" variation

### Preset Management

#### Saving Presets
1. Configure your perfect sound
2. Click "Save Preset" in the header
3. Enter a name and optional description
4. Preset is saved to browser storage

#### Loading Presets
1. Click "Load Preset"
2. Browse available presets
3. Click to load instantly

#### Using Seeds
- Every session has a unique seed number
- Note the seed to recreate a composition
- Enter a seed to generate the same music

#### Sharing Presets
- Export presets as JSON files
- Share files with other users
- Import JSON files to load shared presets

---

## 📁 Project Structure

```
dubmachine/
├── public/                    # Static assets
│   └── vite.svg              # Favicon
├── src/
│   ├── assets/               # Images, fonts, media
│   ├── components/           # React UI components
│   │   ├── App.tsx           # Main application shell
│   │   ├── ControlPanel.tsx  # Master controls
│   │   ├── SynthControls.tsx # Synthesis interface
│   │   ├── EffectsRack.tsx   # Effects chain UI
│   │   ├── SequencerView.tsx # Pattern display
│   │   ├── Visualizer.tsx    # Audio visualization
│   │   ├── PresetManager.tsx # Preset system UI
│   │   └── GestureController.tsx # Touch/swipe handling
│   ├── engine/               # Audio engine core
│   │   ├── effects/          # Audio effects processors
│   │   │   ├── BaseEffect.ts        # Effect base class
│   │   │   ├── EffectsChain.ts      # Effect routing system
│   │   │   ├── TapeEcho.ts          # Tape delay
│   │   │   ├── ConvolutionReverb.ts # IR-based reverb
│   │   │   ├── SpringReverb.ts      # Spring simulation
│   │   │   ├── BitCrusher.ts        # Lo-fi effect
│   │   │   ├── DigitalDistortion.ts # Distortion/saturation
│   │   │   ├── AnalogFilter.ts      # Resonant filter
│   │   │   ├── Phaser.ts            # Phase shifting
│   │   │   ├── Flanger.ts           # Flanging
│   │   │   ├── Chorus.ts            # Chorus effect
│   │   │   ├── Compressor.ts        # Dynamics processor
│   │   │   ├── MultibandCompressor.ts # Multi-band dynamics
│   │   │   ├── ParametricEQ.ts      # Equalizer
│   │   │   ├── StereoWidth.ts       # Stereo imaging
│   │   │   ├── GranularProcessor.ts # Granular synthesis
│   │   │   ├── FrequencyShifter.ts  # Frequency shift
│   │   │   ├── RingModulator.ts     # Ring modulation
│   │   │   ├── Tremolo.ts           # Amplitude modulation
│   │   │   ├── AutoPan.ts           # Stereo panning
│   │   │   ├── Gate.ts              # Noise gate
│   │   │   ├── VinylSimulator.ts    # Vinyl artifacts
│   │   │   ├── ProbabilityDelay.ts  # Stochastic delay
│   │   │   ├── SpectralFreeze.ts    # Spectral processing
│   │   │   ├── DubSiren.ts          # Siren generator
│   │   │   ├── MorphingFilter.ts    # Filter morphing
│   │   │   ├── DiffusionNetwork.ts  # Dense delays
│   │   │   └── index.ts             # Effects exports
│   │   ├── synth/            # Synthesis engine
│   │   │   ├── SynthEngine.ts       # Main synth coordinator
│   │   │   ├── SynthVoice.ts        # Voice management
│   │   │   ├── OscillatorEngine.ts  # Oscillator system
│   │   │   ├── FilterEngine.ts      # Filter system
│   │   │   ├── EnvelopeEngine.ts    # ADSR envelopes
│   │   │   ├── LFOEngine.ts         # LFO system
│   │   │   └── ModulationMatrix.ts  # Modulation routing
│   │   └── generative/       # Generative algorithms
│   │       ├── GenerativeController.ts # Main coordinator
│   │       ├── MarkovChain.ts          # Markov sequencing
│   │       ├── EuclideanRhythm.ts      # Euclidean patterns
│   │       ├── HarmonyGenerator.ts     # Chord progressions
│   │       ├── MelodyGenerator.ts      # Melody creation
│   │       ├── DrumPatternGenerator.ts # Drum patterns
│   │       ├── EvolutionEngine.ts      # Parameter evolution
│   │       └── MusicTheory.ts          # Theory utilities
│   ├── styles/               # Global CSS styles
│   │   └── index.css         # Tailwind imports
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   ├── App.css               # App-specific styles
│   ├── App.tsx               # Root component
│   └── main.tsx              # Application entry point
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── eslint.config.js          # ESLint rules
└── README.md                 # This file
```

---

## 🔧 API Documentation

### Core Engine Classes

#### SynthEngine

Main synthesis engine with polyphonic voice management.

```typescript
import { SynthEngine } from './engine/synth/SynthEngine';

const synth = new SynthEngine();

// Start audio context
await synth.start();

// Trigger notes
synth.noteOn(60, 0.8, 0); // MIDI note 60, velocity 0.8, time 0

// Set parameters
synth.setOscillatorParams({
  osc1: { type: 'sawtooth', detune: 0, level: 0.7 },
  osc2: { type: 'square', detune: -7, level: 0.5 },
  subOsc: { enabled: true, level: 0.3 }
});

// Load presets
const preset = synth.exportPreset();
synth.loadPreset(preset);
```

#### EffectsChain

Effects routing and processing system.

```typescript
import { EffectsChain } from './engine/effects/EffectsChain';
import { TapeEcho, SpringReverb } from './engine/effects';

const effectsChain = new EffectsChain();

// Add effects
effectsChain.addEffect(new TapeEcho(), 0);
effectsChain.addEffect(new SpringReverb(), 1);

// Configure routing
effectsChain.setRoutingMode('serial');

// Set parameters
effectsChain.setEffectParameter(0, 'delayTime', 0.375);
effectsChain.setEffectParameter(0, 'feedback', 0.6);

// Bypass effects
effectsChain.bypassEffect(0, true);
```

#### GenerativeController

High-level generative music coordination.

```typescript
import { GenerativeController } from './engine/generative/GenerativeController';

const generator = new GenerativeController({
  bpm: 126,
  root: 'D',
  scale: 'minor',
  complexity: 0.6,
  density: 0.5,
  energy: 0.7,
  drumStyle: 'hypnotic',
  melodyCharacter: 'flowing',
  evolutionEnabled: true,
  mutationRate: 0.1,
  stabilityVsChaos: 0.5,
  totalBars: 32,
  beatsPerBar: 4
});

// Start generation
generator.start();

// Generate patterns
const chords = generator.generateChordProgression(8);
const melody = generator.generateMelody(16);
const drums = generator.generateDrumPattern();

// Evolution
generator.evolve();
```

### Effect Base Class

All effects extend the `BaseEffect` class:

```typescript
import { BaseEffect } from './engine/effects/BaseEffect';

class CustomEffect extends BaseEffect {
  constructor() {
    super('CustomEffect', 'custom');
    this.registerParameter('amount', 0, 1, 0.5);
  }

  protected createAudioNodes(): void {
    // Create Web Audio nodes
    this.wetGain = new Tone.Gain(0.5);
    this.dryGain = new Tone.Gain(0.5);
  }

  protected routeAudio(): void {
    // Route audio through nodes
  }

  public dispose(): void {
    // Clean up resources
  }
}
```

### Generative Algorithms

#### Markov Chain

Context-aware sequence generation:

```typescript
import MarkovChain from './engine/generative/MarkovChain';

const markov = new MarkovChain(2); // Order 2 (bigram)

// Train on sequence
markov.train(['C4', 'D4', 'E4', 'D4', 'C4']);

// Generate new sequence
const notes = markov.generate('C4', 8);
```

#### Euclidean Rhythm

Mathematical rhythm distribution:

```typescript
import EuclideanRhythm from './engine/generative/EuclideanRhythm';

// Generate 5 hits over 8 steps
const pattern = EuclideanRhythm.generate(5, 8);
// Result: [1, 0, 1, 0, 1, 0, 1, 0]

// Rotate pattern
const rotated = EuclideanRhythm.rotate(pattern, 2);
```

---

## 🎵 Audio Engine Deep Dive

### Synthesis Architecture

The synthesis engine uses a modular, signal-flow based architecture:

1. **Oscillators**: Generate raw waveforms
2. **Filters**: Shape harmonic content
3. **Envelopes**: Control parameters over time
4. **LFOs**: Add cyclic modulation
5. **Modulation Matrix**: Route modulators to destinations
6. **Voice Pool**: Manage polyphonic voices

### Effects Chain Signal Flow

```
Input Signal
    │
    ├──> Effect 1 ──> Effect 2 ──> Effect 3 ──> Output (Serial)
    │
    └──> Effect 1 ──┐
         Effect 2 ──┼──> Mix ──> Output (Parallel)
         Effect 3 ──┘
```

### Generative Systems

#### Markov Chain Sequencer
- Learns from input sequences
- Generates new sequences with similar characteristics
- Order parameter controls context window
- Supports constraints and filtering

#### Euclidean Rhythm Engine
- Distributes N hits across M steps evenly
- Based on Bjorklund's algorithm
- Creates polyrhythmic patterns
- Rotation and variation support

#### Harmony Generator
- Music theory-aware chord progressions
- Functional harmony (I-IV-V, etc.)
- Voice leading optimization
- Scale and mode support

#### Evolution Engine
- Genetic algorithm for parameter optimization
- Fitness function evaluates "musical quality"
- Crossover and mutation operators
- Elitism preserves best solutions

---

## 🧑‍💻 Development

### Extending the Synth

Add new oscillator types:

```typescript
// In OscillatorEngine.ts
export type OscillatorType = 'sine' | 'square' | 'triangle' | 'sawtooth' | 'custom';

// Implement custom waveform
const customWave = Tone.context.createPeriodicWave(real, imag);
osc.setPeriodicWave(customWave);
```

### Creating New Effects

1. Extend `BaseEffect` class
2. Implement required methods
3. Register parameters
4. Add to effects index

```typescript
// src/engine/effects/MyEffect.ts
import { BaseEffect } from './BaseEffect';
import * as Tone from 'tone';

export class MyEffect extends BaseEffect {
  private myNode: Tone.Filter;

  constructor() {
    super('My Effect', 'filter');
    this.registerParameter('cutoff', 20, 20000, 1000, 'frequency');
  }

  protected createAudioNodes(): void {
    this.myNode = new Tone.Filter(1000, 'lowpass');
  }

  protected routeAudio(): void {
    this.input.connect(this.myNode);
    this.myNode.connect(this.wetGain);
    this.input.connect(this.dryGain);
  }

  protected onParameterChange(name: string, value: number): void {
    if (name === 'cutoff') {
      this.myNode.frequency.value = value;
    }
  }

  public dispose(): void {
    this.myNode.dispose();
    super.dispose();
  }
}
```

### Adding Generative Algorithms

Implement a new generator:

```typescript
// src/engine/generative/MyGenerator.ts
export class MyGenerator {
  private config: MyConfig;

  constructor(config: MyConfig) {
    this.config = config;
  }

  public generate(): GeneratedPattern {
    // Your algorithm here
    return pattern;
  }
}
```

### Custom UI Components

Create new control interfaces:

```typescript
// src/components/MyControl.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function MyControl() {
  const [value, setValue] = useState(0);

  return (
    <motion.div
      className="bg-white/5 rounded-lg p-4"
      whileHover={{ scale: 1.02 }}
    >
      <label>My Parameter</label>
      <input
        type="range"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
    </motion.div>
  );
}
```

### State Management

Use Zustand for global state:

```typescript
// src/store/audioStore.ts
import create from 'zustand';

interface AudioState {
  isPlaying: boolean;
  bpm: number;
  setPlaying: (playing: boolean) => void;
  setBPM: (bpm: number) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  isPlaying: false,
  bpm: 126,
  setPlaying: (playing) => set({ isPlaying: playing }),
  setBPM: (bpm) => set({ bpm })
}));
```

### Testing

Run linting and type checking:

```bash
# Lint code
npm run lint

# Type check
npx tsc --noEmit

# Format code (if prettier is configured)
npm run format
```

### Code Style Guidelines

- Use TypeScript for all new code
- Follow ESLint configuration
- Use functional components with hooks
- Prefer const over let
- Use meaningful variable names
- Comment complex algorithms
- Keep functions small and focused
- Extract reusable logic into utilities

---

## 🎨 Customization

### Themes

Modify colors in `tailwind.config.js`:

```javascript
colors: {
  'dub-dark': '#1a1a1a',      // Background
  'dub-yellow': '#00FF00',     // Primary accent
  'dub-yellow-light': '#88FF88' // Secondary accent
}
```

### Fonts

Change fonts in `index.html` and `tailwind.config.js`:

```html
<link href="https://fonts.googleapis.com/css2?family=Your+Font" rel="stylesheet">
```

```javascript
fontFamily: {
  'play': ['Your Font', 'sans-serif'],
}
```

### Audio Parameters

Adjust default synthesis values in `SynthEngine.ts`:

```typescript
const DEFAULT_PRESET = {
  oscillators: {
    osc1: { type: 'sawtooth', detune: 0, level: 0.8 },
    // ...
  }
};
```

---

## 🐛 Troubleshooting

### Audio Not Playing

- Check browser console for errors
- Ensure Web Audio API is supported
- User interaction required before audio (click Play button)
- Check system volume and browser audio settings

### Performance Issues

- Reduce number of active effects
- Lower complexity/density parameters
- Disable evolution engine
- Use Chrome for best performance

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Additional synthesis modes (FM, AM, granular)
- More effects processors
- Enhanced visualizations
- MIDI controller support
- Audio recording/export
- Preset sharing platform
- Mobile app version
- DAW plugin (VST/AU)

---

## 📄 License

This project is open source and available for educational and creative purposes.

**MIT License** - Feel free to use, modify, and distribute with attribution.

---

## 🙏 Credits

### Technologies

- [Tone.js](https://tonejs.github.io/) - Web Audio framework
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [TailwindCSS](https://tailwindcss.com/) - CSS framework

### Inspiration

- Dub techno pioneers: Basic Channel, Deepchord, Maurizio
- Generative music concepts: Brian Eno, Autechre
- Modular synthesis philosophy: Buchla, Moog, Eurorack
- Web Audio innovation: Google Chrome Music Lab

### Special Thanks

To the open source community for providing the building blocks that made this project possible.

---

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/dubmachine/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/dubmachine/discussions)

---

<div align="center">

**Made with 🎵 for lovers of deep, atmospheric electronic music**

[⬆ Back to Top](#️-dub-machine---futuristic-dub-techno-generative-music-webapp)

</div>
