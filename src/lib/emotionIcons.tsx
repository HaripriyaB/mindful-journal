import React from 'react';
import { 
  Sun, 
  Feather, 
  Sparkles, 
  Flame, 
  Compass, 
  Wind, 
  Activity, 
  CloudRain, 
  ZapOff,
  Heart,
  Smile,
  LucideIcon
} from 'lucide-react';
import { MoodType } from '../types';

export interface EmotionMeta {
  id: MoodType;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  description: string;
}

export const EMOTION_META_MAP: Record<MoodType, EmotionMeta> = {
  happy: {
    id: 'happy',
    label: 'Joyful',
    icon: Sun,
    color: '#f59e0b',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-300',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    description: 'Radiant optimism, warmth & celebration'
  },
  peaceful: {
    id: 'peaceful',
    label: 'Peaceful',
    icon: Feather,
    color: '#10b981',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-300',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    description: 'Tranquil presence, stillness & quiet grounding'
  },
  grateful: {
    id: 'grateful',
    label: 'Grateful',
    icon: Heart,
    color: '#ec4899',
    bgColor: 'bg-pink-500/15',
    borderColor: 'border-pink-500/30',
    textColor: 'text-pink-300',
    glowColor: 'rgba(236, 72, 153, 0.35)',
    description: 'Deep appreciation, kindness & heartfelt connection'
  },
  motivated: {
    id: 'motivated',
    label: 'Motivated',
    icon: Flame,
    color: '#f97316',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-300',
    glowColor: 'rgba(249, 115, 22, 0.35)',
    description: 'Passion, creative drive & forward momentum'
  },
  contemplative: {
    id: 'contemplative',
    label: 'Thoughtful',
    icon: Compass,
    color: '#818cf8',
    bgColor: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/30',
    textColor: 'text-indigo-300',
    glowColor: 'rgba(129, 140, 248, 0.35)',
    description: 'Deep introspection, life patterns & curiosity'
  },
  neutral: {
    id: 'neutral',
    label: 'Calm / Flow',
    icon: Wind,
    color: '#94a3b8',
    bgColor: 'bg-slate-500/15',
    borderColor: 'border-slate-500/30',
    textColor: 'text-slate-300',
    glowColor: 'rgba(148, 163, 184, 0.35)',
    description: 'Equanimity, simple observation & open presence'
  },
  anxious: {
    id: 'anxious',
    label: 'Restless',
    icon: Activity,
    color: '#a855f7',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-300',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    description: 'Alertness needing gentle calming & reassurance'
  },
  sad: {
    id: 'sad',
    label: 'Melancholic',
    icon: CloudRain,
    color: '#38bdf8',
    bgColor: 'bg-sky-500/15',
    borderColor: 'border-sky-500/30',
    textColor: 'text-sky-300',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    description: 'Tender release, vulnerability & compassionate healing'
  },
  overwhelmed: {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    icon: ZapOff,
    color: '#f43f5e',
    bgColor: 'bg-rose-500/15',
    borderColor: 'border-rose-500/30',
    textColor: 'text-rose-300',
    glowColor: 'rgba(244, 63, 94, 0.35)',
    description: 'Intense sensory load needing space & slow breaths'
  }
};

export const EMOTIONS_LIST = Object.values(EMOTION_META_MAP);

export function getEmotionMeta(mood?: string): EmotionMeta {
  if (!mood) return EMOTION_META_MAP.peaceful;
  const key = mood.toLowerCase() as MoodType;
  return EMOTION_META_MAP[key] || EMOTION_META_MAP.peaceful;
}

interface EmotionBadgeProps {
  mood?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const EmotionBadge: React.FC<EmotionBadgeProps> = ({
  mood,
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  const meta = getEmotionMeta(mood);
  const IconComponent = meta.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${meta.bgColor} ${meta.borderColor} ${meta.textColor} ${sizeClasses[size]} ${className}`}
      style={{ boxShadow: `0 0 10px ${meta.glowColor}` }}
      title={`${meta.label}: ${meta.description}`}
    >
      <IconComponent className={`${iconSizes[size]} shrink-0`} style={{ color: meta.color }} />
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
};
