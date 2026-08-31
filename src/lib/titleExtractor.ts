import { MoodType } from '../types';

/**
 * Derives a poetic, mindful, concise title from journal content, mood, and context.
 * Used when the reflection title is empty or when the user requests a smart title.
 */
export function deriveTitleFromContent(
  content: string,
  mood?: MoodType,
  locationName?: string,
  timestamp: number = Date.now()
): string {
  const cleanContent = content.trim();

  // If there is written content, attempt to extract a thematic title
  if (cleanContent.length > 0) {
    const lower = cleanContent.toLowerCase();

    // 1. Check for specific strong themes
    if (lower.includes('grateful') || lower.includes('gratitude') || lower.includes('thankful')) {
      if (lower.includes('friend') || lower.includes('family') || lower.includes('partner') || lower.includes('mom') || lower.includes('dad')) {
        return 'Gratitude for Loved Ones & Warmth';
      }
      return 'Moments of Quiet Gratitude';
    }

    if (lower.includes('walk') || lower.includes('nature') || lower.includes('rain') || lower.includes('forest') || lower.includes('tree') || lower.includes('garden')) {
      return locationName ? `A Walk Through ${locationName}` : 'Finding Stillness in Nature';
    }

    if (lower.includes('work') || lower.includes('project') || lower.includes('meeting') || lower.includes('career') || lower.includes('launch')) {
      return 'Reflections on Work & Focus';
    }

    if (lower.includes('anxious') || lower.includes('stress') || lower.includes('overwhelm') || lower.includes('worry') || lower.includes('heavy')) {
      return 'Navigating Heavy Thoughts with Grace';
    }

    if (lower.includes('breathe') || lower.includes('meditat') || lower.includes('calm') || lower.includes('peace') || lower.includes('serene')) {
      return 'Breath, Center, and Calm';
    }

    if (lower.includes('dream') || lower.includes('goal') || lower.includes('future') || lower.includes('plan') || lower.includes('aspire')) {
      return 'Seeds of Intention & Growth';
    }

    if (lower.includes('travel') || lower.includes('journey') || lower.includes('trip') || lower.includes('flight')) {
      return locationName ? `Journey Notes: ${locationName}` : 'Wandering Thoughts & Journey Notes';
    }

    // 2. Extract first sentence or phrase if clean and concise
    const firstSentence = cleanContent.split(/[\n.?!]/)[0].trim();
    if (firstSentence.length > 5 && firstSentence.length <= 45 && !firstSentence.toLowerCase().startsWith('today i') && !firstSentence.toLowerCase().startsWith('i feel')) {
      // Capitalize first letter of each word
      return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
    }
  }

  // 3. Fallback to Time of Day + Mood / Location Context
  const hour = new Date(timestamp).getHours();
  let timeStr = 'Morning';
  if (hour >= 12 && hour < 17) timeStr = 'Afternoon';
  else if (hour >= 17 && hour < 21) timeStr = 'Evening';
  else if (hour >= 21 || hour < 5) timeStr = 'Night';

  const moodLabel = mood && mood !== 'neutral' 
    ? (mood.charAt(0).toUpperCase() + mood.slice(1))
    : 'Mindful';

  if (locationName) {
    return `${moodLabel} ${timeStr} at ${locationName}`;
  }

  return `${moodLabel} ${timeStr} Reflection`;
}
