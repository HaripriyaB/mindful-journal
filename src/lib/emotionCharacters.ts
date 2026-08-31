import React from 'react';
import { MoodType } from '../types';

export interface EmotionCharacter {
  id: MoodType | 'anger' | 'envy' | 'ennui';
  name: string;
  characterTitle: string;
  role: string;
  description: string;
  quote: string;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  bgGradient: string;
  waveColors: [string, string, string];
  orbColor: string;
  characterEmoji: string;
  personality: string;
  whisper: string;
}

export const EMOTION_CHARACTERS: Record<string, EmotionCharacter> = {
  happy: {
    id: 'happy',
    name: 'Joy',
    characterTitle: 'The Radiant Light',
    role: 'Celebrates breakthroughs, optimism & golden moments',
    description: 'Bright, effervescent, and eager to remind you of the joy woven into ordinary days.',
    quote: '"Look at the sunshine in this moment! Even small wins deserve a golden memory orb."',
    primaryColor: '#F59E0B', // Amber / Gold
    accentColor: '#FDE047', // Yellow
    glowColor: 'rgba(245, 158, 11, 0.45)',
    bgGradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    waveColors: ['#F59E0B', '#FBBF24', '#FDE68A'],
    orbColor: '#FCD34D',
    characterEmoji: '☀️',
    personality: 'Warm & Uplifting',
    whisper: 'Cherish what made you smile today — it is fuel for your journey.'
  },
  peaceful: {
    id: 'peaceful',
    name: 'Serenity',
    characterTitle: 'The Gentle Meadow',
    role: 'Brings quiet grounding, stillness & presence',
    description: 'A soothing, tranquil presence who loves deep breaths, calm morning breezes, and balance.',
    quote: '"There is nothing to rush. In this quiet pause, you are already whole and centered."',
    primaryColor: '#10B981', // Emerald
    accentColor: '#6EE7B7', // Mint
    glowColor: 'rgba(16, 185, 129, 0.45)',
    bgGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    waveColors: ['#059669', '#10B981', '#34D399'],
    orbColor: '#6EE7B7',
    characterEmoji: '🌿',
    personality: 'Anchored & Mindful',
    whisper: 'Let the noise of the world soften into this peaceful stillness.'
  },
  grateful: {
    id: 'grateful',
    name: 'Grace',
    characterTitle: 'The Golden Heart',
    role: 'Illuminates kindness, appreciation & connections',
    description: 'Softly glowing with appreciation for little gestures, friendships, and simple gifts of life.',
    quote: '"Gratitude turns what we have into more than enough. Let us hold this moment with tender hands."',
    primaryColor: '#F59E0B', // Golden Warmth
    accentColor: '#F472B6', // Rose Gold
    glowColor: 'rgba(251, 191, 36, 0.45)',
    bgGradient: 'from-amber-400/20 via-rose-400/10 to-transparent',
    waveColors: ['#D97706', '#F59E0B', '#F472B6'],
    orbColor: '#FDE68A',
    characterEmoji: '✨',
    personality: 'Loving & Appreciative',
    whisper: 'Who or what made you feel supported and seen today?'
  },
  motivated: {
    id: 'motivated',
    name: 'Spark',
    characterTitle: 'The Passionate Flame',
    role: 'Ignites courage, creative momentum & determination',
    description: 'Full of fire and purpose, Spark pushes you through hesitations to build your dreams.',
    quote: '"Feel that spark in your chest? That is your power waking up. Take that bold next step!"',
    primaryColor: '#EA580C', // Orange / Coral
    accentColor: '#FB923C', // Bright Orange
    glowColor: 'rgba(234, 88, 12, 0.45)',
    bgGradient: 'from-orange-500/20 via-red-500/10 to-transparent',
    waveColors: ['#DC2626', '#EA580C', '#FB923C'],
    orbColor: '#FB923C',
    characterEmoji: '🔥',
    personality: 'Dynamic & Driven',
    whisper: 'Your willpower is a muscle — honor the progress you made.'
  },
  contemplative: {
    id: 'contemplative',
    name: 'Cosmo',
    characterTitle: 'The Deep Stargazer',
    role: 'Explores life questions, philosophy & inner patterns',
    description: 'Looking upward into the cosmos, Cosmo helps connect the dots of your life story.',
    quote: '"Every question is an invitation to explore deeper waters. What did this experience reveal to you?"',
    primaryColor: '#6366F1', // Indigo
    accentColor: '#A5B4FC', // Lavender Indigo
    glowColor: 'rgba(99, 102, 241, 0.45)',
    bgGradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
    waveColors: ['#4F46E5', '#6366F1', '#818CF8'],
    orbColor: '#A5B4FC',
    characterEmoji: '🌌',
    personality: 'Reflective & Philosophical',
    whisper: 'Wisdom is born when we listen to what lies beneath our thoughts.'
  },
  neutral: {
    id: 'neutral',
    name: 'Breeze',
    characterTitle: 'The Steady Current',
    role: 'Maintains equanimity, flow & simple observation',
    description: 'Like a gentle breeze through bamboo, Breeze stays neutral, balanced, and open-minded.',
    quote: '"Just being here is enough. We do not need a storm or a celebration — simple presence is profound."',
    primaryColor: '#78716C', // Stone / Slate
    accentColor: '#A8A29E',
    glowColor: 'rgba(120, 113, 108, 0.4)',
    bgGradient: 'from-stone-500/20 via-zinc-500/10 to-transparent',
    waveColors: ['#57534E', '#78716C', '#A8A29E'],
    orbColor: '#D6D3D1',
    characterEmoji: '🍃',
    personality: 'Equanimous & Grounded',
    whisper: 'Observe without judgment. Flow like clean water.'
  },
  anxious: {
    id: 'anxious',
    name: 'Flutter',
    characterTitle: 'The Vigilant Sensor',
    role: 'Signals care, alerts to change & helps you prepare safely',
    description: 'Fast-beating and alert, Flutter cares deeply about safety, boundaries, and preparedness.',
    quote: '"I feel the tension too, but you are safe right now. Let us slow down together and take one breath."',
    primaryColor: '#8B5CF6', // Purple / Violet
    accentColor: '#C4B5FD',
    glowColor: 'rgba(139, 92, 246, 0.45)',
    bgGradient: 'from-purple-500/20 via-violet-500/10 to-transparent',
    waveColors: ['#7C3AED', '#8B5CF6', '#A78BFA'],
    orbColor: '#C4B5FD',
    characterEmoji: '🌊',
    personality: 'Sensitive & Protective',
    whisper: 'Anxiety is just care needing a safe harbor. Place a hand on your heart.'
  },
  sad: {
    id: 'sad',
    name: 'Raindrop',
    characterTitle: 'The Tender Ocean',
    role: 'Honors grief, vulnerability, empathy & deep release',
    description: 'Soft-spoken with deep blue oceanic depths, Raindrop teaches that crying cleanses the soul.',
    quote: '"Crying is okay. Feeling tender is not weakness; it is how we make room for new growth and healing."',
    primaryColor: '#3B82F6', // Ocean Blue
    accentColor: '#93C5FD',
    glowColor: 'rgba(59, 130, 246, 0.45)',
    bgGradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    waveColors: ['#2563EB', '#3B82F6', '#60A5FA'],
    orbColor: '#93C5FD',
    characterEmoji: '🌧️',
    personality: 'Empathetic & Tender',
    whisper: 'Your tears water the roots of your deeper compassion.'
  },
  overwhelmed: {
    id: 'overwhelmed',
    name: 'Vortex',
    characterTitle: 'The Swirling Cloud',
    role: 'Highlights when too many waves collide, prompting release',
    description: 'A swirling cloud of all emotions at once, asking you to put down the heavy backpack.',
    quote: '"Too many things at once! Let us drop what does not belong to this exact second."',
    primaryColor: '#E11D48', // Rose / Ruby
    accentColor: '#FDA4AF',
    glowColor: 'rgba(225, 29, 72, 0.45)',
    bgGradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    waveColors: ['#BE123C', '#E11D48', '#FB7185'],
    orbColor: '#FDA4AF',
    characterEmoji: '🌪️',
    personality: 'Intense & Needing Space',
    whisper: 'Pause the world. You only need to do one single thing next.'
  }
};

export const CHARACTER_LIST = Object.values(EMOTION_CHARACTERS);

export function getCharacterForMood(mood?: string): EmotionCharacter {
  if (!mood) return EMOTION_CHARACTERS.peaceful;
  const key = mood.toLowerCase();
  return EMOTION_CHARACTERS[key] || EMOTION_CHARACTERS.peaceful;
}
