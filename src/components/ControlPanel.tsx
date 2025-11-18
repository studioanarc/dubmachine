import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { useAudioStore } from '../store/audioStore'
import { ScaleType } from '../engine/generative/MusicTheory'

const scales: { name: string; value: ScaleType }[] = [
  { name: 'Minor', value: 'minor' },
  { name: 'Dorian', value: 'dorian' },
  { name: 'Phrygian', value: 'phrygian' },
  { name: 'Whole Tone', value: 'whole_tone' },
  { name: 'Chromatic', value: 'chromatic' },
]

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

interface SliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  leftLabel?: string
  rightLabel?: string
}

const Slider = ({ label, value, onChange, min = 0, max = 100, leftLabel, rightLabel }: SliderProps) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-sm font-semibold text-dub-yellow uppercase tracking-wide">{label}</label>
      <span className="text-sm text-white/60">{value}</span>
    </div>
    {leftLabel && rightLabel && (
      <div className="flex justify-between text-xs text-white/40 mb-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    )}
    <div className="relative">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)`
        }}
      />
    </div>
  </div>
)

function ControlPanel() {
  // Audio store state
  const rootNote = useAudioStore(state => state.rootNote)
  const scale = useAudioStore(state => state.scale)
  const mood = useAudioStore(state => state.mood)
  const density = useAudioStore(state => state.density)
  const evolution = useAudioStore(state => state.evolution)
  const tempo = useAudioStore(state => state.bpm)

  // Audio store actions
  const setRootNote = useAudioStore(state => state.setRootNote)
  const setScale = useAudioStore(state => state.setScale)
  const setMood = useAudioStore(state => state.setMood)
  const setDensity = useAudioStore(state => state.setDensity)
  const setEvolution = useAudioStore(state => state.setEvolution)
  const setBpm = useAudioStore(state => state.setBpm)
  const regenerate = useAudioStore(state => state.regenerate)

  const [isAdvanced, setIsAdvanced] = useState(false)

  const handleRegenerate = () => {
    regenerate()
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bungee text-dub-yellow mb-6">CONTROL PANEL</h2>

        {/* Root Note Selector */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-semibold text-dub-yellow uppercase tracking-wide">Root Note</label>
          <div className="grid grid-cols-6 gap-2">
            {notes.map((note) => (
              <motion.button
                key={note}
                onClick={() => setRootNote(note)}
                className={`py-3 px-2 rounded-lg font-bold text-sm transition-all ${
                  rootNote === note
                    ? 'bg-dub-yellow text-dub-dark shadow-lg shadow-dub-yellow/50'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {note}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Scale Selector */}
        <div className="space-y-2 mb-6">
          <label className="text-sm font-semibold text-dub-yellow uppercase tracking-wide">Scale</label>
          <select
            value={scale}
            onChange={(e) => setScale(e.target.value as ScaleType)}
            className="w-full bg-white/10 text-white border border-dub-yellow/30 rounded-lg px-4 py-3 font-semibold focus:outline-none focus:border-dub-yellow transition-all"
          >
            {scales.map((s) => (
              <option key={s.value} value={s.value} className="bg-dub-dark">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mood Slider */}
        <div className="mb-6">
          <Slider
            label="Mood"
            value={mood}
            onChange={setMood}
            leftLabel="Dark"
            rightLabel="Bright"
          />
        </div>

        {/* Density Slider */}
        <div className="mb-6">
          <Slider
            label="Density"
            value={density}
            onChange={setDensity}
            leftLabel="Sparse"
            rightLabel="Busy"
          />
        </div>

        {/* Evolution Slider */}
        <div className="mb-6">
          <Slider
            label="Evolution"
            value={evolution}
            onChange={setEvolution}
            leftLabel="Static"
            rightLabel="Chaotic"
          />
        </div>

        {/* Tempo Control */}
        <div className="mb-6">
          <Slider
            label="Tempo (BPM)"
            value={tempo}
            onChange={setBpm}
            min={110}
            max={130}
          />
        </div>

        {/* Regenerate Button */}
        <motion.button
          onClick={handleRegenerate}
          className="w-full bg-gradient-to-r from-dub-yellow to-dub-yellow-light text-dub-dark font-bold py-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-dub-yellow/30"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RefreshCw size={20} />
          REGENERATE
        </motion.button>

        {/* Advanced Toggle */}
        <motion.button
          onClick={() => setIsAdvanced(!isAdvanced)}
          className="w-full mt-4 bg-white/5 text-white/80 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {isAdvanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          {isAdvanced ? 'HIDE' : 'SHOW'} ADVANCED
        </motion.button>

        {/* Advanced Controls */}
        <AnimatePresence>
          {isAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-6 pt-6 border-t border-dub-yellow/20 space-y-6">
                <Slider
                  label="Reverb Mix"
                  value={50}
                  onChange={() => {}}
                />
                <Slider
                  label="Delay Feedback"
                  value={40}
                  onChange={() => {}}
                />
                <Slider
                  label="Filter Resonance"
                  value={60}
                  onChange={() => {}}
                />
                <Slider
                  label="Pattern Length"
                  value={16}
                  onChange={() => {}}
                  min={4}
                  max={32}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default ControlPanel
