import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, FolderOpen, Share2, Copy, Check, X, Download, Upload } from 'lucide-react'
import { useAudioStore } from '../store/audioStore'
import { GenerativeController } from '../engine/generative/GenerativeController'

interface Preset {
  id: string
  name: string
  seed: number
  timestamp: number
  sessionData?: string
}

function PresetManager() {
  const dubMachine = useAudioStore(state => state.dubMachine)
  const currentSeed = useAudioStore(state => state.currentSeed)
  const regenerate = useAudioStore(state => state.regenerate)

  const [isOpen, setIsOpen] = useState(false)
  const [presets, setPresets] = useState<Preset[]>([])
  const [builtInPresets, setBuiltInPresets] = useState<any[]>([])
  const [newPresetName, setNewPresetName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [copiedSeed, setCopiedSeed] = useState(false)

  // Load built-in presets on mount
  useEffect(() => {
    const builtIn = GenerativeController.getBuiltInPresets()
    setBuiltInPresets(builtIn)
  }, [])

  const generateNewSeed = () => {
    const newSeed = Date.now()
    regenerate(newSeed)
  }

  const savePreset = () => {
    if (!newPresetName.trim() || !dubMachine) return

    const sessionData = dubMachine.exportSession()

    const newPreset: Preset = {
      id: Date.now().toString(),
      name: newPresetName,
      seed: currentSeed,
      timestamp: Date.now(),
      sessionData,
    }

    // Save to localStorage
    const saved = [...presets, newPreset]
    setPresets(saved)
    localStorage.setItem('dubMachinePresets', JSON.stringify(saved))

    setNewPresetName('')
    setShowSaveDialog(false)
  }

  const loadPreset = (preset: Preset) => {
    if (!dubMachine) return

    if (preset.sessionData) {
      dubMachine.importSession(preset.sessionData)
    } else {
      regenerate(preset.seed)
    }
  }

  const loadBuiltInPreset = (preset: any) => {
    if (!dubMachine) return

    dubMachine.getGenerativeController().loadPreset(preset)
    regenerate()
  }

  const deletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id)
    setPresets(updated)
    localStorage.setItem('dubMachinePresets', JSON.stringify(updated))
  }

  const copySeedToClipboard = () => {
    navigator.clipboard.writeText(currentSeed.toString())
    setCopiedSeed(true)
    setTimeout(() => setCopiedSeed(false), 2000)
  }

  const sharePreset = () => {
    const shareUrl = `${window.location.origin}?seed=${currentSeed}`
    navigator.clipboard.writeText(shareUrl)
    alert('Share link copied to clipboard!')
  }

  const exportSession = () => {
    if (!dubMachine) return

    const sessionData = dubMachine.exportSession()
    const blob = new Blob([sessionData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dubmachine-session-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSession = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !dubMachine) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        dubMachine.importSession(content)
      }
      reader.readAsText(file)
    }
    input.click()
  }

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dubMachinePresets')
    if (saved) {
      setPresets(JSON.parse(saved))
    }
  }, [])

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = Date.now()
    const diff = now - timestamp
    const hours = Math.floor(diff / 3600000)

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-2 transition-all border border-dub-yellow/30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FolderOpen size={18} />
        PRESETS
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dub-dark border-2 border-dub-yellow/50 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl shadow-dub-yellow/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bungee text-dub-yellow">PRESET MANAGER</h2>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Current Seed */}
              <div className="bg-white/5 rounded-lg p-4 mb-6 border border-dub-yellow/20">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-dub-yellow uppercase">Current Seed</label>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={copySeedToClipboard}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {copiedSeed ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                    </motion.button>
                    <motion.button
                      onClick={sharePreset}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Share2 size={16} />
                    </motion.button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentSeed}
                    onChange={(e) => regenerate(Number(e.target.value))}
                    className="flex-1 bg-black/30 text-dub-yellow font-mono text-lg px-4 py-3 rounded-lg border border-dub-yellow/30 focus:outline-none focus:border-dub-yellow"
                  />
                  <motion.button
                    onClick={generateNewSeed}
                    className="px-6 py-3 bg-dub-yellow text-dub-dark font-bold rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    NEW
                  </motion.button>
                </div>
              </div>

              {/* Save Preset */}
              <div className="mb-6">
                {!showSaveDialog ? (
                  <motion.button
                    onClick={() => setShowSaveDialog(true)}
                    className="w-full py-3 bg-gradient-to-r from-dub-yellow to-dub-yellow-light text-dub-dark font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-dub-yellow/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Save size={20} />
                    SAVE CURRENT PRESET
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white/5 rounded-lg p-4 border border-dub-yellow/20"
                  >
                    <input
                      type="text"
                      placeholder="Enter preset name..."
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && savePreset()}
                      className="w-full bg-black/30 text-white px-4 py-3 rounded-lg border border-dub-yellow/30 focus:outline-none focus:border-dub-yellow mb-3"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <motion.button
                        onClick={savePreset}
                        className="flex-1 py-2 bg-dub-yellow text-dub-dark font-bold rounded-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        SAVE
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setShowSaveDialog(false)
                          setNewPresetName('')
                        }}
                        className="flex-1 py-2 bg-white/10 text-white font-bold rounded-lg"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        CANCEL
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Export/Import Buttons */}
              <div className="mb-6 flex gap-2">
                <motion.button
                  onClick={exportSession}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download size={16} />
                  Export Session
                </motion.button>
                <motion.button
                  onClick={importSession}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Upload size={16} />
                  Import Session
                </motion.button>
              </div>

              {/* Built-in Presets */}
              {builtInPresets.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-dub-yellow mb-3 uppercase">Built-in Presets</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {builtInPresets.map((preset, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/5 rounded-lg p-3 border border-dub-yellow/20 hover:border-dub-yellow/40 transition-all group cursor-pointer"
                        onClick={() => loadBuiltInPreset(preset)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-white">{preset.name}</h4>
                            <p className="text-xs text-white/60 mt-1">{preset.description}</p>
                            <div className="flex gap-2 mt-2">
                              {preset.tags.map((tag: string) => (
                                <span key={tag} className="text-xs bg-dub-yellow/20 text-dub-yellow px-2 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Presets */}
              <div>
                <h3 className="text-sm font-semibold text-dub-yellow mb-3 uppercase">My Presets</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {presets.length === 0 ? (
                    <div className="text-center py-8 text-white/40">
                      No saved presets yet
                    </div>
                  ) : (
                    presets.map((preset) => (
                      <motion.div
                        key={preset.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-dub-yellow/30 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-white">{preset.name}</h4>
                            <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                              <span className="font-mono text-dub-yellow/60">{preset.seed}</span>
                              <span>"</span>
                              <span>{formatTimestamp(preset.timestamp)}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                              onClick={() => loadPreset(preset)}
                              className="px-4 py-2 bg-dub-yellow text-dub-dark font-semibold rounded-lg text-sm"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              LOAD
                            </motion.button>
                            <motion.button
                              onClick={() => deletePreset(preset.id)}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <X size={16} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default PresetManager
