/**
 * Client-side heuristic tag extractor for reflection journals
 * Analyzes journal content and extracts meaningful, contextual tags
 */

const THEME_PATTERNS: { tag: string; keywords: string[] }[] = [
  {
    tag: 'gratitude',
    keywords: ['grateful', 'gratitude', 'thankful', 'blessed', 'appreciate', 'gift', 'grace', 'privilege']
  },
  {
    tag: 'inner-peace',
    keywords: ['peace', 'calm', 'quiet', 'stillness', 'serene', 'tranquil', 'breathe', 'breath', 'relax', 'zen']
  },
  {
    tag: 'nature-walk',
    keywords: ['nature', 'walk', 'tree', 'forest', 'rain', 'garden', 'mountain', 'lake', 'river', 'sky', 'sunshine', 'outdoors']
  },
  {
    tag: 'mindfulness',
    keywords: ['mindful', 'meditat', 'present', 'awareness', 'observ', 'introspect', 'pause', 'grounded']
  },
  {
    tag: 'relationships',
    keywords: ['family', 'friend', 'partner', 'mother', 'father', 'sister', 'brother', 'child', 'colleague', 'community', 'loved']
  },
  {
    tag: 'career-growth',
    keywords: ['work', 'project', 'meeting', 'office', 'career', 'code', 'build', 'launch', 'achievement', 'task', 'goal']
  },
  {
    tag: 'self-healing',
    keywords: ['heal', 'anxious', 'stress', 'overwhelm', 'tired', 'rest', 'recover', 'empathy', 'compassion', 'gentle']
  },
  {
    tag: 'creativity',
    keywords: ['art', 'write', 'creative', 'music', 'poem', 'draw', 'design', 'idea', 'innovat', 'inspire', 'inspiration']
  },
  {
    tag: 'morning-clarity',
    keywords: ['morning', 'dawn', 'sunrise', 'coffee', 'tea', 'start', 'wake', 'fresh']
  },
  {
    tag: 'evening-reflection',
    keywords: ['evening', 'night', 'sunset', 'dusk', 'moon', 'sleep', 'unwind', 'bedtime', 'stars']
  },
  {
    tag: 'wellness',
    keywords: ['health', 'exercise', 'run', 'yoga', 'stretch', 'nutrition', 'meal', 'energy', 'vitality']
  },
  {
    tag: 'travel-journey',
    keywords: ['travel', 'trip', 'journey', 'flight', 'hotel', 'explore', 'city', 'wander', 'adventure']
  }
];

export function extractTagsFromContent(
  text: string,
  title?: string,
  mood?: string,
  locationName?: string
): string[] {
  const combined = `${title || ''} ${text} ${locationName || ''}`.toLowerCase();
  const matchedTags: string[] = [];

  for (const { tag, keywords } of THEME_PATTERNS) {
    if (keywords.some(kw => combined.includes(kw))) {
      matchedTags.push(tag);
    }
  }

  if (mood && mood !== 'neutral' && !matchedTags.includes(mood)) {
    matchedTags.push(mood);
  }

  if (locationName) {
    const locTag = locationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 15);
    if (locTag && !matchedTags.includes(locTag)) {
      matchedTags.push(locTag);
    }
  }

  if (matchedTags.length === 0) {
    if (text.length > 50) {
      matchedTags.push('daily-reflection', 'mindful-moment');
    } else {
      matchedTags.push('reflection', 'thoughts');
    }
  }

  return Array.from(new Set(matchedTags)).slice(0, 6);
}
