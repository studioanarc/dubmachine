import { useState } from 'react'
import { motion, Reorder } from 'framer-motion'
import { Plus, X, Settings, Activity } from 'lucide-react'
import { useAudioStore } from '../store/audioStore'
import {
  TapeEcho,
  SpringReverb,
  Chorus,
  Phaser,
  DigitalDistortion,
  AnalogFilter,
  Compressor,
  ParametricEQ,
  BaseEffect
} from '../engine/effects'

type EffectType = 'reverb' | 'delay' | 'chorus' | 'phaser' | 'distortion' | 'filter' | 'compressor' | 'eq'

interface Effect {
  id: string
  type: EffectType
  enabled: boolean
  parameters: Record<string, number>
  slotIndex: number
  effectInstance?: BaseEffect
}

const effectTemplates: Record<EffectType, { name: string; icon: string; defaultParams: Record<string, number> }> = {
  reverb: { name: 'Reverb', icon: 'RVB', defaultParams: { mix: 30, decay: 50, predelay: 10 } },
  delay: { name: 'Delay', icon: 'DLY', defaultParams: { time: 50, feedback: 40, mix: 30 } },
  chorus: { name: 'Chorus', icon: 'CHR', defaultParams: { rate: 30, depth: 40, mix: 50 } },
  phaser: { name: 'Phaser', icon: 'PHS', defaultParams: { rate: 40, depth: 50, feedback: 30 } },
  distortion: { name: 'Distortion', icon: 'DST', defaultParams: { drive: 50, tone: 50, mix: 60 } },
  filter: { name: 'Filter', icon: 'FLT', defaultParams: { cutoff: 70, resonance: 30, type: 0 } },
  compressor: { name: 'Compressor', icon: 'CMP', defaultParams: { threshold: 50, ratio: 40, attack: 20 } },
  eq: { name: 'EQ', icon: 'EQ', defaultParams: { low: 50, mid: 50, high: 50 } },
}

const EffectSlot = ({ effect, onRemove, onToggle, onParameterChange }: {
  effect: Effect
  onRemove: () => void
  onToggle: () => void
  onParameterChange: (param: string, value: number) => void
}) => {
  const [showParams, setShowParams] = useState(false)
  const template = effectTemplates[effect.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`bg-white/5 rounded-lg border-2 transition-all ${
        effect.enabled ? 'border-dub-yellow/50' : 'border-white/10'
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-dub-yellow">{template.icon}</span>
            <div>
              <h4 className="font-bold text-white">{template.name}</h4>
              <p className="text-xs text-white/40">Effect Slot</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setShowParams(!showParams)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Settings size={16} />
            </motion.button>
            <motion.button
              onClick={onToggle}
              className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                effect.enabled
                  ? 'bg-dub-yellow text-dub-dark'
                  : 'bg-white/10 text-white/60'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {effect.enabled ? 'ON' : 'OFF'}
            </motion.button>
            <motion.button
              onClick={onRemove}
              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={16} />
            </motion.button>
          </div>
        </div>

        {/* Level Meter */}
        <div className="flex gap-1 h-1 mb-2">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-full ${
                effect.enabled && i < 15
                  ? i < 10
                    ? 'bg-dub-yellow'
                    : i < 15
                    ? 'bg-yellow-600'
                    : 'bg-red-500'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Parameters */}
        {showParams && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/10 space-y-3"
          >
            {Object.entries(effect.parameters).map(([param, value]) => (
              <div key={param}>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-white/80 uppercase">{param}</label>
                  <span className="text-dub-yellow">{value}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => onParameterChange(param, Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${value}%, rgba(255,255,255,0.1) ${value}%, rgba(255,255,255,0.1) 100%)`
                  }}
                />
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

function EffectsRack() {
  const dubMachine = useAudioStore(state => state.dubMachine)
  const [effects, setEffects] = useState<Effect[]>([])
  const [showEffectMenu, setShowEffectMenu] = useState(false)

  const createEffectInstance = (type: EffectType): BaseEffect | null => {
    if (!dubMachine) return null

    let effect: BaseEffect | null = null

    switch (type) {
      case 'delay':
        effect = new TapeEcho()
        break
      case 'reverb':
        effect = new SpringReverb()
        break
      case 'chorus':
        effect = new Chorus()
        break
      case 'phaser':
        effect = new Phaser()
        break
      case 'distortion':
        effect = new DigitalDistortion()
        break
      case 'filter':
        effect = new AnalogFilter()
        break
      case 'compressor':
        effect = new Compressor()
        break
      case 'eq':
        effect = new ParametricEQ()
        break
    }

    return effect
  }

  const addEffect = (type: EffectType) => {
    const effectInstance = createEffectInstance(type)
    if (!effectInstance || !dubMachine) return

    const effectsChain = dubMachine.getEffectsChain()
    const slotIndex = effects.length

    // Add to effects chain
    effectsChain.addEffect(slotIndex, effectInstance)

    const newEffect: Effect = {
      id: `${type}-${Date.now()}`,
      type,
      enabled: true,
      parameters: { ...effectTemplates[type].defaultParams },
      slotIndex,
      effectInstance,
    }
    setEffects([...effects, newEffect])
    setShowEffectMenu(false)
  }

  const removeEffect = (id: string) => {
    const effect = effects.find(e => e.id === id)
    if (effect && dubMachine) {
      const effectsChain = dubMachine.getEffectsChain()
      effectsChain.removeEffect(effect.slotIndex)
    }
    setEffects(effects.filter(e => e.id !== id))
  }

  const toggleEffect = (id: string) => {
    const effect = effects.find(e => e.id === id)
    if (effect && dubMachine) {
      const effectsChain = dubMachine.getEffectsChain()
      effectsChain.setSlotEnabled(effect.slotIndex, !effect.enabled)
    }
    setEffects(effects.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e))
  }

  const updateParameter = (id: string, param: string, value: number) => {
    const effect = effects.find(e => e.id === id)
    if (effect?.effectInstance) {
      // Update the actual effect parameter
      const paramName = param as any
      if (effect.effectInstance.getParameter(paramName)) {
        effect.effectInstance.setParameter(paramName, value / 100)
      }
    }
    setEffects(effects.map(e =>
      e.id === id
        ? { ...e, parameters: { ...e.parameters, [param]: value } }
        : e
    ))
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bungee text-dub-yellow flex items-center gap-2">
            <Activity size={24} />
            EFFECTS
          </h2>
          <motion.button
            onClick={() => setShowEffectMenu(!showEffectMenu)}
            className="px-4 py-2 bg-dub-yellow text-dub-dark font-bold rounded-lg flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={18} />
            ADD
          </motion.button>
        </div>

        {/* Effect Selection Menu */}
        {showEffectMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-4 gap-2 mb-6 p-4 bg-white/5 rounded-lg border border-dub-yellow/20"
          >
            {(Object.keys(effectTemplates) as EffectType[]).map((type) => (
              <motion.button
                key={type}
                onClick={() => addEffect(type)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-center transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-sm font-mono font-bold text-dub-yellow mb-1">{effectTemplates[type].icon}</div>
                <div className="text-xs font-semibold text-white">{effectTemplates[type].name}</div>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Effects Chain */}
        <div className="space-y-3">
          {effects.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-lg border border-dashed border-white/20">
              <p className="text-white/40">No effects added yet</p>
              <p className="text-xs text-white/30 mt-2">Click ADD to add an effect</p>
            </div>
          ) : (
            <Reorder.Group axis="y" values={effects} onReorder={setEffects}>
              {effects.map((effect) => (
                <Reorder.Item key={effect.id} value={effect}>
                  <EffectSlot
                    effect={effect}
                    onRemove={() => removeEffect(effect.id)}
                    onToggle={() => toggleEffect(effect.id)}
                    onParameterChange={(param, value) => updateParameter(effect.id, param, value)}
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </div>

        {/* Signal Flow Indicator */}
        {effects.length > 0 && (
          <div className="mt-4 p-3 bg-dub-yellow/10 rounded-lg border border-dub-yellow/30">
            <p className="text-xs text-white/60 text-center">
              Signal Flow: Drag to reorder effects in the chain
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default EffectsRack
