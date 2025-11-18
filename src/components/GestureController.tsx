import { ReactNode, useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface GestureControllerProps {
  children: ReactNode
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down') => void
  onPinch?: (scale: number) => void
  onRotate?: (angle: number) => void
  onXYPad?: (x: number, y: number) => void
}

function GestureController({ children, onSwipe, onPinch, onRotate, onXYPad }: GestureControllerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [initialDistance, setInitialDistance] = useState<number | null>(null)
  const [initialAngle, setInitialAngle] = useState<number | null>(null)
  const [showXYPad, setShowXYPad] = useState(false)
  const [xyPosition, setXyPosition] = useState({ x: 50, y: 50 })

  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getAngle = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.atan2(dy, dx) * (180 / Math.PI)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        setTouchStart({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        })
      } else if (e.touches.length === 2) {
        // Pinch/Rotate start
        setInitialDistance(getDistance(e.touches[0], e.touches[1]))
        setInitialAngle(getAngle(e.touches[0], e.touches[1]))
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance !== null && initialAngle !== null) {
        // Pinch zoom
        const currentDistance = getDistance(e.touches[0], e.touches[1])
        const scale = currentDistance / initialDistance
        onPinch && onPinch(scale)

        // Rotate
        const currentAngle = getAngle(e.touches[0], e.touches[1])
        const angleDiff = currentAngle - initialAngle
        onRotate && onRotate(angleDiff)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStart && e.changedTouches.length === 1) {
        const touchEnd = {
          x: e.changedTouches[0].clientX,
          y: e.changedTouches[0].clientY
        }

        const dx = touchEnd.x - touchStart.x
        const dy = touchEnd.y - touchStart.y
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)

        // Minimum swipe distance
        if (absDx > 50 || absDy > 50) {
          if (absDx > absDy) {
            onSwipe && onSwipe(dx > 0 ? 'right' : 'left')
          } else {
            onSwipe && onSwipe(dy > 0 ? 'down' : 'up')
          }
        }
      }

      setTouchStart(null)
      setInitialDistance(null)
      setInitialAngle(null)
    }

    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchmove', handleTouchMove)
    container.addEventListener('touchend', handleTouchEnd)

    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'x' || e.key === 'X') {
        setShowXYPad(!showXYPad)
      }
    }

    window.addEventListener('keypress', handleKeyPress)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('keypress', handleKeyPress)
    }
  }, [touchStart, initialDistance, initialAngle, onSwipe, onPinch, onRotate, showXYPad])

  const handleXYPad = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setXyPosition({ x, y })
    onXYPad && onXYPad(x, y)
  }

  return (
    <div ref={containerRef} className="relative">
      {children}

      {/* XY Pad Overlay */}
      {showXYPad && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowXYPad(false)}
        >
          <motion.div
            className="w-96 h-96 bg-gradient-to-br from-dub-dark to-black rounded-2xl border-2 border-dub-yellow/50 shadow-2xl shadow-dub-yellow/20 overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
            onMouseMove={handleXYPad}
          >
            {/* Grid Lines */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(10)].map((_, i) => (
                <div
                  key={`h-${i}`}
                  className="absolute w-full border-t border-white/10"
                  style={{ top: `${(i + 1) * 10}%` }}
                />
              ))}
              {[...Array(10)].map((_, i) => (
                <div
                  key={`v-${i}`}
                  className="absolute h-full border-l border-white/10"
                  style={{ left: `${(i + 1) * 10}%` }}
                />
              ))}
            </div>

            {/* Center Lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute w-full border-t border-dub-yellow/30" style={{ top: '50%' }} />
              <div className="absolute h-full border-l border-dub-yellow/30" style={{ left: '50%' }} />
            </div>

            {/* XY Position Indicator */}
            <motion.div
              className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-dub-yellow shadow-lg shadow-dub-yellow/50 border-2 border-white"
              style={{
                left: `${xyPosition.x}%`,
                top: `${xyPosition.y}%`
              }}
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
              }}
            />

            {/* Labels */}
            <div className="absolute top-4 left-0 right-0 text-center">
              <span className="text-dub-yellow font-bungee text-sm">XY PAD</span>
            </div>
            <div className="absolute bottom-4 left-4">
              <span className="text-white/60 text-xs">X: {Math.round(xyPosition.x)}</span>
            </div>
            <div className="absolute bottom-4 right-4">
              <span className="text-white/60 text-xs">Y: {Math.round(xyPosition.y)}</span>
            </div>

            {/* Close Button */}
            <motion.button
              onClick={() => setShowXYPad(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-white text-xl leading-none">×</span>
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* Gesture Hints */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 z-40 bg-dub-dark/90 backdrop-blur-sm border border-dub-yellow/30 rounded-lg p-3 text-xs text-white/60 max-w-xs"
      >
        <h4 className="text-dub-yellow font-semibold mb-2">GESTURE CONTROLS</h4>
        <ul className="space-y-1">
          <li>" Swipe left/right to navigate views</li>
          <li>" Pinch to zoom visualizations</li>
          <li>" Two-finger rotate for parameters</li>
          <li>" Press 'X' for XY pad control</li>
        </ul>
      </motion.div>

      {/* XY Pad Toggle Button */}
      <motion.button
        onClick={() => setShowXYPad(!showXYPad)}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 bg-dub-yellow text-dub-dark rounded-full flex items-center justify-center font-bold shadow-lg shadow-dub-yellow/50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        XY
      </motion.button>
    </div>
  )
}

export default GestureController
