import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Grid, Circle } from 'lucide-react'
import { useAudioStore } from '../store/audioStore'
import * as Tone from 'tone'

interface Track {
  name: string
  color: string
  steps: boolean[]
  euclidean: { hits: number; steps: number }
}

function SequencerView() {
  const dubMachine = useAudioStore(state => state.dubMachine)
  const isPlaying = useAudioStore(state => state.isPlaying)
  const [currentStep, setCurrentStep] = useState(0)
  const [tracks, setTracks] = useState<Track[]>([
    {
      name: 'KICK',
      color: '#FFD700',
      steps: Array(16).fill(false),
      euclidean: { hits: 4, steps: 16 }
    },
    {
      name: 'SNARE',
      color: '#FFED4E',
      steps: Array(16).fill(false),
      euclidean: { hits: 2, steps: 16 }
    },
    {
      name: 'HAT',
      color: '#FFF',
      steps: Array(16).fill(false),
      euclidean: { hits: 8, steps: 16 }
    },
    {
      name: 'PERC',
      color: '#FFB700',
      steps: Array(16).fill(false),
      euclidean: { hits: 5, steps: 16 }
    }
  ])

  // Load actual generated pattern from dubMachine
  useEffect(() => {
    if (!dubMachine) return

    const controller = dubMachine.getGenerativeController()
    const content = controller.generateBar(0)
    const pattern = content.drums

    // Convert drum pattern to track steps
    const newTracks = [...tracks]

    // Clear all steps first
    newTracks.forEach(track => {
      track.steps = Array(16).fill(false)
    })

    // Map drum hits to steps
    pattern.hits.forEach(hit => {
      const stepIndex = Math.floor((hit.time / pattern.duration) * 16)
      if (stepIndex >= 0 && stepIndex < 16) {
        const voiceName = hit.voice.toUpperCase()
        const track = newTracks.find(t => t.name === voiceName ||
          (voiceName.includes('HIHAT') && t.name === 'HAT') ||
          (voiceName.includes('PERC') && t.name === 'PERC'))
        if (track) {
          track.steps[stepIndex] = true
        }
      }
    })

    setTracks(newTracks)
  }, [dubMachine])

  // Update current step based on transport position
  useEffect(() => {
    if (!isPlaying) return

    const updateStep = () => {
      const position = Tone.Transport.position
      // Parse position (e.g., "0:0:0")
      const parts = position.toString().split(':')
      const sixteenths = parseInt(parts[2] || '0')
      setCurrentStep(sixteenths % 16)
    }

    const interval = setInterval(updateStep, 50)
    return () => clearInterval(interval)
  }, [isPlaying])

  const toggleStep = (trackIndex: number, stepIndex: number) => {
    setTracks(tracks.map((track, ti) =>
      ti === trackIndex
        ? { ...track, steps: track.steps.map((step, si) => si === stepIndex ? !step : step) }
        : track
    ))
  }

  // Generate Euclidean rhythm pattern
  const euclideanRhythm = (hits: number, steps: number): boolean[] => {
    const pattern: boolean[] = Array(steps).fill(false)
    const interval = steps / hits

    for (let i = 0; i < hits; i++) {
      pattern[Math.floor(i * interval)] = true
    }

    return pattern
  }

  const applyEuclidean = (trackIndex: number) => {
    setTracks(tracks.map((track, ti) =>
      ti === trackIndex
        ? { ...track, steps: euclideanRhythm(track.euclidean.hits, track.euclidean.steps) }
        : track
    ))
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bungee text-dub-yellow mb-6 flex items-center gap-2">
          <Grid size={24} />
          SEQUENCER
        </h2>

        {/* Pattern Grid */}
        <div className="bg-white/5 rounded-lg border border-dub-yellow/20 p-4 mb-6">
          {/* Step Numbers */}
          <div className="flex mb-2 pl-20">
            {Array.from({ length: 16 }, (_, i) => (
              <div
                key={i}
                className="flex-1 text-center text-xs text-white/40 font-mono"
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Tracks */}
          {tracks.map((track, trackIndex) => (
            <motion.div
              key={track.name}
              className="mb-4 last:mb-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: trackIndex * 0.1 }}
            >
              <div className="flex items-center gap-2">
                {/* Track Label */}
                <div className="w-16 text-right">
                  <span className="text-xs font-bold" style={{ color: track.color }}>
                    {track.name}
                  </span>
                </div>

                {/* Steps */}
                <div className="flex flex-1 gap-1">
                  {track.steps.map((isActive, stepIndex) => (
                    <motion.button
                      key={stepIndex}
                      onClick={() => toggleStep(trackIndex, stepIndex)}
                      className={`flex-1 aspect-square rounded-md transition-all ${
                        currentStep === stepIndex
                          ? 'ring-2 ring-white'
                          : ''
                      } ${
                        isActive
                          ? 'shadow-lg'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                      style={{
                        backgroundColor: isActive ? track.color : undefined,
                        boxShadow: isActive ? `0 0 10px ${track.color}` : undefined
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {currentStep === stepIndex && (
                        <motion.div
                          className="w-full h-full flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Euclidean Rhythm Controls */}
        <div className="bg-white/5 rounded-lg border border-dub-yellow/20 p-4">
          <h3 className="text-sm font-bungee text-dub-yellow mb-4 flex items-center gap-2">
            <Circle size={16} />
            EUCLIDEAN PATTERNS
          </h3>

          <div className="space-y-3">
            {tracks.map((track, trackIndex) => (
              <div key={track.name} className="flex items-center gap-4">
                <span className="text-xs font-bold w-16" style={{ color: track.color }}>
                  {track.name}
                </span>

                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 flex-1">
                    <label className="text-xs text-white/60">Hits:</label>
                    <input
                      type="range"
                      min="0"
                      max="16"
                      value={track.euclidean.hits}
                      onChange={(e) => {
                        const hits = Number(e.target.value)
                        setTracks(tracks.map((t, ti) =>
                          ti === trackIndex
                            ? { ...t, euclidean: { ...t.euclidean, hits } }
                            : t
                        ))
                      }}
                      className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-white/80 w-6 text-right">
                      {track.euclidean.hits}
                    </span>
                  </div>

                  <motion.button
                    onClick={() => applyEuclidean(trackIndex)}
                    className="px-3 py-1 bg-dub-yellow/20 hover:bg-dub-yellow/30 text-dub-yellow text-xs font-semibold rounded transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    APPLY
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pattern Info */}
        <div className="mt-4 p-4 bg-dub-yellow/10 rounded-lg border border-dub-yellow/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">
              Click steps to toggle " Adjust Euclidean hits and apply
            </span>
            <span className="text-dub-yellow font-mono">
              STEP: {currentStep + 1}/16
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SequencerView
