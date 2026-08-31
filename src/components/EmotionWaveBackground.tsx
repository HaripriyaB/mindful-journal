import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EmotionCharacter, EMOTION_CHARACTERS, getCharacterForMood } from '../lib/emotionCharacters';
import { Sparkles, Waves, Eye, EyeOff, Radio } from 'lucide-react';

interface EmotionWaveBackgroundProps {
  currentMood?: string;
  intensity?: 'subtle' | 'vibrant' | 'calm';
  showControls?: boolean;
}

export const EmotionWaveBackground: React.FC<EmotionWaveBackgroundProps> = ({
  currentMood = 'peaceful',
  intensity = 'subtle',
  showControls = true
}) => {
  const [selectedCharacterKey, setSelectedCharacterKey] = useState<string | null>(null);
  const [isWaveVisible, setIsWaveVisible] = useState(true);
  const [showOrbDrawer, setShowOrbDrawer] = useState(false);
  const [activeHarmonicMode, setActiveHarmonicMode] = useState<'synced' | 'spectrum'>('synced');

  // If user selected manual override, use it; otherwise sync with active entry mood
  const character: EmotionCharacter = useMemo(() => {
    if (activeHarmonicMode === 'synced') {
      return getCharacterForMood(currentMood);
    }
    if (selectedCharacterKey && EMOTION_CHARACTERS[selectedCharacterKey]) {
      return EMOTION_CHARACTERS[selectedCharacterKey];
    }
    return getCharacterForMood(currentMood);
  }, [currentMood, selectedCharacterKey, activeHarmonicMode]);

  // Floating core memory orbs data
  const orbs = useMemo(() => [
    { id: 1, color: '#FCD34D', glow: 'rgba(252, 211, 77, 0.5)', size: 90, x: '12%', y: '18%', duration: 18, delay: 0, emotion: 'Joy' },
    { id: 2, color: '#6EE7B7', glow: 'rgba(110, 231, 183, 0.45)', size: 120, x: '82%', y: '15%', duration: 22, delay: 2, emotion: 'Serenity' },
    { id: 3, color: '#93C5FD', glow: 'rgba(147, 197, 253, 0.4)', size: 105, x: '75%', y: '68%', duration: 20, delay: 1, emotion: 'Raindrop' },
    { id: 4, color: '#FB923C', glow: 'rgba(251, 146, 60, 0.4)', size: 85, x: '25%', y: '78%', duration: 19, delay: 3, emotion: 'Spark' },
    { id: 5, color: '#C4B5FD', glow: 'rgba(196, 181, 253, 0.4)', size: 95, x: '50%', y: '42%', duration: 25, delay: 1.5, emotion: 'Cosmo' },
  ], []);

  const [c1, c2, c3] = character.waveColors;

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {/* 1. Deep Atmospheric Dark Base with Radial Emotion Tint */}
      <div 
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${character.glowColor} 0%, rgba(12, 10, 9, 0.95) 60%, #09090b 100%)`
        }}
      />

      {/* 2. Animated Flowing Gradient Mesh Waves (SVG Wave Ribbons) */}
      {isWaveVisible && (
        <div className="absolute inset-0 opacity-40 mix-blend-screen transition-opacity duration-700">
          {/* Top-Mid Ambient Wave Ribbon */}
          <svg
            className="absolute top-0 left-0 w-[200%] h-full transform -translate-x-1/4"
            viewBox="0 0 1440 800"
            fill="none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={c1} stopOpacity="0.45" />
                <stop offset="50%" stopColor={c2} stopOpacity="0.25" />
                <stop offset="100%" stopColor={c3} stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="waveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={c3} stopOpacity="0.4" />
                <stop offset="50%" stopColor={c1} stopOpacity="0.2" />
                <stop offset="100%" stopColor={c2} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Layer 1: Slow Harmonic Flow */}
            <motion.path
              d="M0,192 C288,256 576,128 864,192 C1152,256 1296,160 1440,192 L1440,800 L0,800 Z"
              fill="url(#waveGrad1)"
              animate={{
                d: [
                  "M0,192 C288,256 576,128 864,192 C1152,256 1296,160 1440,192 L1440,800 L0,800 Z",
                  "M0,140 C320,80 640,240 960,160 C1200,100 1340,210 1440,140 L1440,800 L0,800 Z",
                  "M0,220 C240,280 500,160 760,220 C1080,290 1300,130 1440,220 L1440,800 L0,800 Z",
                  "M0,192 C288,256 576,128 864,192 C1152,256 1296,160 1440,192 L1440,800 L0,800 Z"
                ]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Layer 2: Counter Wave (Harmonic memory stream) */}
            <motion.path
              d="M0,280 C360,200 720,340 1080,260 C1260,220 1380,300 1440,280 L1440,800 L0,800 Z"
              fill="url(#waveGrad2)"
              animate={{
                d: [
                  "M0,280 C360,200 720,340 1080,260 C1260,220 1380,300 1440,280 L1440,800 L0,800 Z",
                  "M0,320 C300,380 600,240 900,310 C1200,380 1350,260 1440,320 L1440,800 L0,800 Z",
                  "M0,240 C420,180 800,320 1140,230 C1300,190 1400,270 1440,240 L1440,800 L0,800 Z",
                  "M0,280 C360,200 720,340 1080,260 C1260,220 1380,300 1440,280 L1440,800 L0,800 Z"
                ]
              }}
              transition={{
                duration: 26,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </svg>
        </div>
      )}

      {/* 3. Floating Glowing "Core Memory Orbs" drifting in the background */}
      {isWaveVisible && (
        <div className="absolute inset-0">
          {orbs.map((orb) => (
            <motion.div
              key={orb.id}
              className="absolute rounded-full filter blur-[40px] opacity-25"
              style={{
                width: orb.size * 2,
                height: orb.size * 2,
                backgroundColor: orb.color,
                boxShadow: `0 0 80px ${orb.glow}`,
                left: orb.x,
                top: orb.y,
              }}
              animate={{
                x: [0, 40, -30, 20, 0],
                y: [0, -50, 30, -20, 0],
                scale: [1, 1.25, 0.9, 1.15, 1],
                opacity: [0.2, 0.35, 0.18, 0.3, 0.2]
              }}
              transition={{
                duration: orb.duration,
                repeat: Infinity,
                delay: orb.delay,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}

      {/* 4. Subtle Ambient Vignette & Grain */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/40 pointer-events-none"
      />
    </div>

    {/* 5. Interactive Character Aura & Memory Stream Floating Controls - Elevated High Z-Index Layer */}
    {showControls && (
      <div className="fixed bottom-5 right-5 pointer-events-auto z-40 flex items-center space-x-2">
        {/* Active Emotion Indicator Button */}
        <div className="relative">
          <button
            onClick={() => setShowOrbDrawer(!showOrbDrawer)}
            title="Inner Resonance Wave Controller"
            className="flex items-center space-x-2 bg-stone-900/95 hover:bg-stone-800/95 text-stone-200 px-3.5 py-2 rounded-full border border-stone-700/80 shadow-2xl backdrop-blur-xl text-xs font-medium transition transform hover:scale-105 active:scale-95"
            style={{
              borderColor: character.primaryColor + '90',
              boxShadow: `0 0 20px ${character.glowColor}`
            }}
          >
            <span className="text-base">{character.characterEmoji}</span>
            <span className="font-semibold text-stone-100 hidden sm:inline">
              {character.name} Wave
            </span>
            <span 
              className="w-2 h-2 rounded-full animate-ping ml-0.5"
              style={{ backgroundColor: character.primaryColor }}
            />
          </button>

          {/* Living Emotion Council Quick Wave Selector Dropdown */}
          <AnimatePresence>
            {showOrbDrawer && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-12 right-0 w-72 bg-stone-900/98 border border-stone-700/90 rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl z-50 text-stone-100 space-y-3"
                style={{
                  boxShadow: `0 10px 40px -10px rgba(0,0,0,0.8), 0 0 25px ${character.glowColor}`
                }}
              >
                <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                  <div className="flex items-center space-x-2">
                    <Waves className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Inner Resonance Waves
                    </span>
                  </div>
                  <button
                    onClick={() => setIsWaveVisible(!isWaveVisible)}
                    className="text-stone-400 hover:text-stone-200 text-xs p-1"
                    title={isWaveVisible ? 'Hide background waves' : 'Show background waves'}
                  >
                    {isWaveVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Emotions flow like harmonic currents. Select an active guide to shift the ambient visual rhythm:
                </p>

                {/* Character Orbs Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(EMOTION_CHARACTERS).map((char) => {
                    const isSelected = character.id === char.id;
                    return (
                      <button
                        key={char.id}
                        onClick={() => {
                          setActiveHarmonicMode('spectrum');
                          setSelectedCharacterKey(char.id);
                        }}
                        className={`flex flex-col items-center p-2 rounded-xl border transition-all text-center ${
                          isSelected
                            ? 'bg-stone-800 border-amber-400 shadow-md transform scale-105'
                            : 'bg-stone-800/40 border-stone-700/50 hover:bg-stone-800/80'
                        }`}
                      >
                        <div 
                          className="w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-inner mb-1"
                          style={{
                            backgroundColor: char.primaryColor + '33',
                            border: `1.5px solid ${char.primaryColor}`,
                            boxShadow: isSelected ? `0 0 10px ${char.glowColor}` : 'none'
                          }}
                        >
                          {char.characterEmoji}
                        </div>
                        <span className="text-[10px] font-semibold text-stone-200 truncate w-full">
                          {char.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Sync Mode Toggle */}
                <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setActiveHarmonicMode('synced');
                      setSelectedCharacterKey(null);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                      activeHarmonicMode === 'synced'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                        : 'text-stone-400 border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    Sync to Entry Mood
                  </button>

                  <span className="text-[10px] text-stone-400 italic">
                    "{character.personality}"
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )}
    </>
  );
};
