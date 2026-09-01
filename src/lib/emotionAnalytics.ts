import { EmotionBreakdown, JournalEntry, MoodType } from '../types';

// Mood baseline profiles across the 7 emotional dimensions (0-100)
const MOOD_BASELINES: Record<MoodType, EmotionBreakdown> = {
  happy: {
    joy: 90,
    calm: 72,
    gratitude: 80,
    inspiration: 75,
    energy: 85,
    stress: 15,
    sadness: 5
  },
  peaceful: {
    joy: 75,
    calm: 95,
    gratitude: 85,
    inspiration: 70,
    energy: 55,
    stress: 10,
    sadness: 5
  },
  grateful: {
    joy: 85,
    calm: 85,
    gratitude: 98,
    inspiration: 80,
    energy: 70,
    stress: 10,
    sadness: 5
  },
  motivated: {
    joy: 80,
    calm: 60,
    gratitude: 70,
    inspiration: 95,
    energy: 92,
    stress: 25,
    sadness: 5
  },
  contemplative: {
    joy: 55,
    calm: 80,
    gratitude: 75,
    inspiration: 82,
    energy: 50,
    stress: 20,
    sadness: 18
  },
  neutral: {
    joy: 50,
    calm: 60,
    gratitude: 50,
    inspiration: 50,
    energy: 50,
    stress: 25,
    sadness: 20
  },
  anxious: {
    joy: 20,
    calm: 15,
    gratitude: 30,
    inspiration: 25,
    energy: 65,
    stress: 90,
    sadness: 45
  },
  overwhelmed: {
    joy: 15,
    calm: 10,
    gratitude: 20,
    inspiration: 20,
    energy: 75,
    stress: 95,
    sadness: 55
  },
  sad: {
    joy: 10,
    calm: 25,
    gratitude: 25,
    inspiration: 20,
    energy: 20,
    stress: 65,
    sadness: 92
  }
};

const DEFAULT_BASELINE: EmotionBreakdown = {
  joy: 60,
  calm: 70,
  gratitude: 65,
  inspiration: 60,
  energy: 55,
  stress: 20,
  sadness: 15
};

/**
 * Derives a realistic and nuanced EmotionBreakdown for any journal entry.
 * If AI emotion analysis exists with valid numeric values, it uses them.
 * Otherwise, it calculates from the entry's mood, title, and body content keywords.
 */
export function getEntryEmotionBreakdown(entry: Partial<JournalEntry>): EmotionBreakdown {
  const eb = entry.emotionAnalysis?.emotionBreakdown;
  if (
    eb &&
    typeof eb.joy === 'number' &&
    typeof eb.calm === 'number' &&
    typeof eb.gratitude === 'number' &&
    typeof eb.stress === 'number' &&
    typeof eb.sadness === 'number' &&
    typeof eb.inspiration === 'number' &&
    typeof eb.energy === 'number'
  ) {
    return {
      joy: Math.max(0, Math.min(100, Math.round(eb.joy))),
      calm: Math.max(0, Math.min(100, Math.round(eb.calm))),
      gratitude: Math.max(0, Math.min(100, Math.round(eb.gratitude))),
      inspiration: Math.max(0, Math.min(100, Math.round(eb.inspiration))),
      energy: Math.max(0, Math.min(100, Math.round(eb.energy))),
      stress: Math.max(0, Math.min(100, Math.round(eb.stress))),
      sadness: Math.max(0, Math.min(100, Math.round(eb.sadness)))
    };
  }

  // Start with mood baseline
  const mood = entry.mood || 'peaceful';
  const base = MOOD_BASELINES[mood] || DEFAULT_BASELINE;

  const result: EmotionBreakdown = { ...base };
  const text = `${entry.title || ''} ${entry.content || ''}`.toLowerCase();

  if (text.trim().length > 0) {
    // Joy modifiers
    if (/happy|joy|smile|laugh|delight|celebrate|thrilled|wonderful|excited|cheer/i.test(text)) {
      result.joy = Math.min(100, result.joy + 12);
      result.energy = Math.min(100, result.energy + 8);
    }
    // Calm modifiers
    if (/peace|calm|serene|still|relax|breathe|tranquil|nature|quiet|unwind/i.test(text)) {
      result.calm = Math.min(100, result.calm + 12);
      result.stress = Math.max(0, result.stress - 15);
    }
    // Gratitude modifiers
    if (/grateful|gratitude|thank|thankful|blessed|appreciate|gift|cherish/i.test(text)) {
      result.gratitude = Math.min(100, result.gratitude + 15);
      result.joy = Math.min(100, result.joy + 6);
    }
    // Inspiration modifiers
    if (/inspire|inspired|create|creative|dream|idea|purpose|growth|vision|future/i.test(text)) {
      result.inspiration = Math.min(100, result.inspiration + 14);
      result.energy = Math.min(100, result.energy + 8);
    }
    // Stress modifiers
    if (/anxious|anxiety|stress|stressed|overwhelm|panic|pressure|deadline|worry|scared|hectic|rush/i.test(text)) {
      result.stress = Math.min(100, result.stress + 20);
      result.calm = Math.max(0, result.calm - 20);
      result.joy = Math.max(0, result.joy - 15);
    }
    // Sadness modifiers
    if (/sad|cry|crying|grief|tears|lost|lonely|heartbroken|hurt|pain|miss|depressed/i.test(text)) {
      result.sadness = Math.min(100, result.sadness + 25);
      result.joy = Math.max(0, result.joy - 25);
      result.energy = Math.max(0, result.energy - 15);
    }
    // Fatigue / Low Energy modifiers
    if (/tired|exhausted|burnout|drained|fatigue|sleepy/i.test(text)) {
      result.energy = Math.max(0, result.energy - 25);
      result.stress = Math.min(100, result.stress + 10);
    }
  }

  return result;
}

/**
 * Calculates sentiment score from -1.0 to +1.0
 */
export function getEntrySentimentScore(entry: Partial<JournalEntry>): number {
  if (entry.emotionAnalysis?.sentimentScore !== undefined && typeof entry.emotionAnalysis.sentimentScore === 'number') {
    return Number(entry.emotionAnalysis.sentimentScore.toFixed(2));
  }

  const breakdown = getEntryEmotionBreakdown(entry);
  const positive = breakdown.joy + breakdown.calm + breakdown.gratitude + breakdown.inspiration + breakdown.energy;
  const negative = (breakdown.stress * 1.3) + (breakdown.sadness * 1.4);

  const rawScore = (positive - negative) / 500;
  return Number(Math.max(-1.0, Math.min(1.0, rawScore)).toFixed(2));
}
