import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Waves } from 'lucide-react'
import { useAudioStore } from '../store/audioStore'

interface KnobProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  unit?: string
}

const Knob = ({ label, value, onChange, min = 0, max = 100, unit = '' }: KnobProps) => {
  const rotation = ((value - min) / (max - min)) * 270 - 135

  return (
    <div className="flex flex-col items-center space-y-2">
      <div
        className="relative w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-white/5 border-2 border-dub-yellow/30 cursor-pointer"
        onMouseDown={(e) => {
          const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = e.clientY - moveEvent.clientY
            const newValue = Math.min(max, Math.max(min, value + deltaY * 0.5))
            onChange(Math.round(newValue))
          }
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
          }
          document.addEventListener('mousemove', handleMouseMove)
          document.addEventListener('mouseup', handleMouseUp)
        }}
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ rotate: rotation }}
        >
          <div className="w-1 h-6 bg-dub-yellow rounded-full shadow-lg shadow-dub-yellow/50" />
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-xs font-bold text-white">{value}{unit}</div>
        </div>
      </div>
      <label className="text-xs font-semibold text-white/80 uppercase">{label}</label>
    </div>
  )
}

const ADSRVisualizer = ({ attack, decay, sustain, release }: { attack: number; decay: number; sustain: number; release: number }) => {
  const attackWidth = (attack / 100) * 50
  const decayWidth = (decay / 100) * 40
  const sustainWidth = 60
  const releaseWidth = (release / 100) * 50

  const points = [
    `0,100`,
    `${attackWidth},0`,
    `${attackWidth + decayWidth},${100 - sustain}`,
    `${attackWidth + decayWidth + sustainWidth},${100 - sustain}`,
    `${attackWidth + decayWidth + sustainWidth + releaseWidth},100`,
  ].join(' ')

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-dub-yellow/20">
      <h4 className="text-xs font-semibold text-dub-yellow mb-2 uppercase">Envelope</h4>
      <svg viewBox="0 0 200 100" className="w-full h-24">
        <polyline
          points={points}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="2"
          className="drop-shadow-lg"
        />
        <polyline
          points={points}
          fill="url(#fillGradient)"
          opacity="0.2"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFED4E" />
          </linearGradient>
          <linearGradient id="fillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex justify-between text-xs text-white/40 mt-2">
        <span>A</span>
        <span>D</span>
        <span>S</span>
        <span>R</span>
      </div>
    </div>
  )
}

function SynthControls() {
  const dubMachine = useAudioStore(state => state.dubMachine)

  const [oscType, setOscType] = useState<'sine' | 'triangle' | 'sawtooth' | 'square'>('sawtooth')
  const [attack, setAttack] = useState(10)
  const [decay, setDecay] = useState(30)
  const [sustain, setSustain] = useState(70)
  const [release, setRelease] = useState(40)
  const [cutoff, setCutoff] = useState(60)
  const [resonance, setResonance] = useState(30)
  const [lfoRate, setLfoRate] = useState(20)
  const [lfoDepth, setLfoDepth] = useState(40)

  // Update synth engine when parameters change
  useEffect(() => {
    if (!dubMachine) return
    const synthEngine = dubMachine.getSynthEngine()

    // Update oscillator
    synthEngine.updateOscillatorParams({
      osc1: {
        type: oscType,
        level: 0.7,
        octave: 0,
        semitone: 0,
        detune: 0,
      },
    })
  }, [oscType, dubMachine])

  useEffect(() => {
    if (!dubMachine) return
    const synthEngine = dubMachine.getSynthEngine()

    // Update filter (cutoff 0-100 -> frequency 20-20000)
    const frequency = 20 + (cutoff / 100) * (20000 - 20)
    synthEngine.updateFilterParams({
      frequency,
      resonance: resonance / 100,
    })
  }, [cutoff, resonance, dubMachine])

  useEffect(() => {
    if (!dubMachine) return
    const synthEngine = dubMachine.getSynthEngine()

    // Update amp envelope (convert 0-100 to seconds)
    synthEngine.updateAmpEnvelope({
      attack: (attack / 100) * 2,
      decay: (decay / 100) * 2,
      sustain: sustain / 100,
      release: (release / 100) * 3,
    })
  }, [attack, decay, sustain, release, dubMachine])

  useEffect(() => {
    if (!dubMachine) return
    const synthEngine = dubMachine.getSynthEngine()

    // Update LFO
    synthEngine.updateLFO1({
      frequency: (lfoRate / 100) * 10,
      amplitude: lfoDepth / 100,
    })
  }, [lfoRate, lfoDepth, dubMachine])

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bungee text-dub-yellow mb-6 flex items-center gap-2">
          <Waves size={24} />
          SYNTH
        </h2>

        {/* Oscillator Section */}
        <div className="bg-white/5 rounded-lg p-4 mb-6 border border-dub-yellow/20">
          <h3 className="text-sm font-semibold text-dub-yellow mb-4 uppercase tracking-wide">Oscillator</h3>
          <div className="grid grid-cols-4 gap-2">
            {(['sine', 'triangle', 'sawtooth', 'square'] as const).map((type) => (
              <motion.button
                key={type}
                onClick={() => setOscType(type)}
                className={`py-3 px-2 rounded-lg font-semibold text-xs transition-all ${
                  oscType === type
                    ? 'bg-dub-yellow text-dub-dark shadow-lg shadow-dub-yellow/50'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {type.toUpperCase()}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white/5 rounded-lg p-4 mb-6 border border-dub-yellow/20">
          <h3 className="text-sm font-semibold text-dub-yellow mb-4 uppercase tracking-wide">Filter</h3>
          <div className="grid grid-cols-3 gap-4">
            <Knob label="Cutoff" value={cutoff} onChange={setCutoff} unit="%" />
            <Knob label="Resonance" value={resonance} onChange={setResonance} unit="%" />
            <Knob label="Env Amt" value={50} onChange={() => {}} unit="%" />
          </div>
        </div>

        {/* Envelope Section */}
        <div className="mb-6">
          <ADSRVisualizer attack={attack} decay={decay} sustain={sustain} release={release} />
          <div className="grid grid-cols-4 gap-2 mt-4">
            <Knob label="Attack" value={attack} onChange={setAttack} unit="ms" />
            <Knob label="Decay" value={decay} onChange={setDecay} unit="ms" />
            <Knob label="Sustain" value={sustain} onChange={setSustain} unit="%" />
            <Knob label="Release" value={release} onChange={setRelease} unit="ms" />
          </div>
        </div>

        {/* LFO Section */}
        <div className="bg-white/5 rounded-lg p-4 border border-dub-yellow/20">
          <h3 className="text-sm font-semibold text-dub-yellow mb-4 uppercase tracking-wide">LFO</h3>
          <div className="grid grid-cols-3 gap-4">
            <Knob label="Rate" value={lfoRate} onChange={setLfoRate} unit="Hz" />
            <Knob label="Depth" value={lfoDepth} onChange={setLfoDepth} unit="%" />
            <Knob label="Shape" value={50} onChange={() => {}} />
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-dub-yellow/10 rounded-lg border border-dub-yellow/30">
          <p className="text-xs text-white/60 text-center">
            Drag knobs vertically to adjust " Click oscillator type to switch waveform
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default SynthControls
