import { useState } from 'react'
import { motion } from 'framer-motion'
import ControlPanel from './ControlPanel'
import SynthControls from './SynthControls'
import EffectsRack from './EffectsRack'
import Visualizer from './Visualizer'
import SequencerView from './SequencerView'
import PresetManager from './PresetManager'
import GestureController from './GestureController'
import AudioContextProvider from './AudioContextProvider'
import { useAudioStore } from '../store/audioStore'

type View = 'main' | 'synth' | 'effects' | 'sequencer'

function App() {
  const [currentView, setCurrentView] = useState<View>('main')

  // Audio state from store
  const isPlaying = useAudioStore(state => state.isPlaying)
  const isLoading = useAudioStore(state => state.isLoading)
  const isInitialized = useAudioStore(state => state.isInitialized)
  const error = useAudioStore(state => state.error)
  const togglePlayback = useAudioStore(state => state.togglePlayback)

  const renderView = () => {
    switch (currentView) {
      case 'synth':
        return <SynthControls />
      case 'effects':
        return <EffectsRack />
      case 'sequencer':
        return <SequencerView />
      default:
        return <ControlPanel />
    }
  }

  const handlePlayPause = async () => {
    await togglePlayback()
  }

  return (
    <AudioContextProvider>
      <div className="min-h-screen bg-dub-dark font-play text-white">
        <GestureController onSwipe={(direction) => {
          const views: View[] = ['main', 'synth', 'effects', 'sequencer']
          const currentIndex = views.indexOf(currentView)
          if (direction === 'left' && currentIndex < views.length - 1) {
            setCurrentView(views[currentIndex + 1])
          } else if (direction === 'right' && currentIndex > 0) {
            setCurrentView(views[currentIndex - 1])
          }
        }}>
        {/* Header */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="border-b border-yellow-500/20 backdrop-blur-sm sticky top-0 z-50 bg-dub-dark/80"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <motion.h1
                className="text-4xl md:text-5xl font-bungee text-transparent bg-clip-text bg-gradient-to-r from-dub-yellow to-dub-yellow-light"
                whileHover={{ scale: 1.05 }}
              >
                DUB MACHINE
              </motion.h1>

              {/* Play/Pause Button */}
              <motion.button
                onClick={handlePlayPause}
                disabled={isLoading}
                className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${
                  isPlaying
                    ? 'bg-dub-yellow text-dub-dark shadow-lg shadow-dub-yellow/50'
                    : 'bg-white/10 text-white border border-dub-yellow hover:bg-dub-yellow/20'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                whileHover={{ scale: isLoading ? 1 : 1.05 }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
              >
                {isLoading ? 'LOADING...' : isPlaying ? 'PAUSE' : 'PLAY'}
              </motion.button>

              {/* Preset Manager */}
              <PresetManager />
            </div>

            {/* Navigation */}
            <nav className="flex gap-2 mt-4">
              {[
                { id: 'main', label: 'CONTROL' },
                { id: 'synth', label: 'SYNTH' },
                { id: 'effects', label: 'EFFECTS' },
                { id: 'sequencer', label: 'SEQUENCER' },
              ].map((view) => (
                <motion.button
                  key={view.id}
                  onClick={() => setCurrentView(view.id as View)}
                  className={`px-6 py-2 rounded-t-lg font-semibold transition-all ${
                    currentView === view.id
                      ? 'bg-dub-yellow text-dub-dark'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  {view.label}
                </motion.button>
              ))}
            </nav>
          </div>
        </motion.header>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="container mx-auto px-4 pt-4"
          >
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-center">
              <p className="text-red-200">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visualizer - Takes 2 columns on large screens */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Visualizer isPlaying={isPlaying} />
            </motion.div>

            {/* Current View Panel */}
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 backdrop-blur-sm rounded-lg border border-dub-yellow/20 p-6 shadow-xl"
            >
              {renderView()}
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-yellow-500/20 mt-12 py-6">
          <div className="container mx-auto px-4 text-center text-white/40">
            <p className="text-sm">
              Generative Dub Techno - Powered by Web Audio API
            </p>
            {isInitialized && (
              <p className="text-xs mt-1 text-dub-yellow/60">
                Audio Engine Active
              </p>
            )}
          </div>
        </footer>
      </GestureController>
    </div>
    </AudioContextProvider>
  )
}

export default App
