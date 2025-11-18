import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, Activity } from 'lucide-react'
import { useAudioStore } from '../store/audioStore'

interface VisualizerProps {
  isPlaying: boolean
}

type VisualizationMode = 'spectrum' | 'waveform' | 'circular'

function Visualizer({ isPlaying }: VisualizerProps) {
  const dubMachine = useAudioStore(state => state.dubMachine)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [mode, setMode] = useState<VisualizationMode>('spectrum')
  const analyserRef = useRef<AnalyserNode | null>(null)

  // Get analyser from dubMachine
  useEffect(() => {
    if (dubMachine) {
      analyserRef.current = dubMachine.getAnalyser()
    }
  }, [dubMachine])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Get real audio data from analyser
    const getAudioData = (length: number): Uint8Array => {
      const analyser = analyserRef.current
      if (!analyser || !isPlaying) {
        return new Uint8Array(length)
      }

      const dataArray = new Uint8Array(length)
      if (mode === 'waveform') {
        analyser.getByteTimeDomainData(dataArray)
      } else {
        analyser.getByteFrequencyData(dataArray)
      }
      return dataArray
    }

    const drawSpectrum = (data: number[]) => {
      const width = canvas.width
      const height = canvas.height
      const barWidth = width / data.length
      const gradient = ctx.createLinearGradient(0, height, 0, 0)
      gradient.addColorStop(0, '#FFD700')
      gradient.addColorStop(0.5, '#FFED4E')
      gradient.addColorStop(1, '#FFF')

      ctx.clearRect(0, 0, width, height)

      data.forEach((value, index) => {
        const barHeight = (value / 255) * height * 0.8
        const x = barWidth * index

        // Draw bar with glow
        ctx.shadowBlur = 20
        ctx.shadowColor = '#FFD700'
        ctx.fillStyle = gradient
        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight)
      })
    }

    const drawWaveform = (data: number[]) => {
      const width = canvas.width
      const height = canvas.height
      const sliceWidth = width / data.length
      const centerY = height / 2

      ctx.clearRect(0, 0, width, height)

      // Draw waveform
      ctx.beginPath()
      ctx.lineWidth = 3
      ctx.strokeStyle = '#FFD700'
      ctx.shadowBlur = 15
      ctx.shadowColor = '#FFD700'

      data.forEach((value, index) => {
        const y = centerY + ((value - 128) / 128) * (height / 2)
        const x = sliceWidth * index

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Draw center line
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      ctx.shadowBlur = 0
      ctx.moveTo(0, centerY)
      ctx.lineTo(width, centerY)
      ctx.stroke()
    }

    const drawCircular = (data: number[]) => {
      const width = canvas.width
      const height = canvas.height
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 3

      ctx.clearRect(0, 0, width, height)

      // Draw circular spectrum
      const angleStep = (Math.PI * 2) / data.length

      data.forEach((value, index) => {
        const angle = angleStep * index
        const barHeight = (value / 255) * radius
        const innerRadius = radius - barHeight

        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(angle)

        const gradient = ctx.createLinearGradient(0, -radius, 0, -innerRadius)
        gradient.addColorStop(0, '#FFD700')
        gradient.addColorStop(1, '#FFED4E')

        ctx.fillStyle = gradient
        ctx.shadowBlur = 10
        ctx.shadowColor = '#FFD700'
        ctx.fillRect(-2, -radius, 4, barHeight)

        ctx.restore()
      })

      // Draw center circle
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(37, 37, 37, 0.8)'
      ctx.fill()
      ctx.strokeStyle = '#FFD700'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    const animate = () => {
      const dataLength = mode === 'waveform' ? 128 : 64
      const data = getAudioData(dataLength)
      const dataArray = Array.from(data)

      switch (mode) {
        case 'spectrum':
          drawSpectrum(dataArray)
          break
        case 'waveform':
          drawWaveform(dataArray)
          break
        case 'circular':
          drawCircular(dataArray)
          break
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [isPlaying, mode])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gradient-to-br from-dub-dark to-black rounded-lg border border-dub-yellow/30 overflow-hidden shadow-2xl"
    >
      <div className="p-4 border-b border-dub-yellow/20 flex items-center justify-between">
        <h3 className="text-lg font-bungee text-dub-yellow">VISUALIZER</h3>
        <div className="flex gap-2">
          <motion.button
            onClick={() => setMode('spectrum')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'spectrum'
                ? 'bg-dub-yellow text-dub-dark'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BarChart2 size={16} />
          </motion.button>
          <motion.button
            onClick={() => setMode('waveform')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'waveform'
                ? 'bg-dub-yellow text-dub-dark'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Activity size={16} />
          </motion.button>
          <motion.button
            onClick={() => setMode('circular')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              mode === 'circular'
                ? 'bg-dub-yellow text-dub-dark'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            U
          </motion.button>
        </div>
      </div>
      <div className="relative" style={{ height: '400px' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-white/60 text-lg font-semibold">Press PLAY to start</p>
              <p className="text-white/40 text-sm mt-2">Visualization will appear here</p>
            </div>
          </div>
        )}
      </div>
      <div className="p-3 bg-black/30 flex items-center justify-between text-xs">
        <span className="text-white/40">
          {isPlaying ? 'LIVE AUDIO' : 'PAUSED'}
        </span>
        <span className="text-dub-yellow font-mono">
          {mode.toUpperCase()}
        </span>
      </div>
    </motion.div>
  )
}

export default Visualizer
