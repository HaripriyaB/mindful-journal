import { ChatMessage, EmotionAnalysis, EvolutionReport, JournalEntry, MoodType } from '../types';
import { deriveTitleFromContent } from './titleExtractor';

/**
 * Real-time streaming chat with Gemini reflection companion
 * Streams chunks progressively for instantaneous, interactive feedback
 */
export async function streamGeminiChat(
  messages: ChatMessage[],
  entryContext: string,
  userMood?: string,
  locationContext?: string,
  photosCount?: number,
  onChunk?: (textChunk: string) => void
): Promise<string> {
  try {
    const res = await fetch('/api/gemini/chat-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        entryContext,
        userMood,
        locationContext,
        photosCount
      })
    });

    if (!res.ok || !res.body) {
      return await sendGeminiChat(messages, entryContext, userMood, locationContext, photosCount);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) {
              fullText += data.chunk;
              if (onChunk) onChunk(data.chunk);
            }
          } catch (e) {
            // ignore malformed chunks
          }
        }
      }
    }

    return fullText || "Thank you for sharing your reflection. What part of today feels most meaningful to hold onto?";
  } catch (err) {
    console.warn('Streaming chat fallback to standard request:', err);
    return await sendGeminiChat(messages, entryContext, userMood, locationContext, photosCount);
  }
}

export async function sendGeminiChat(
  messages: ChatMessage[],
  entryContext: string,
  userMood?: string,
  locationContext?: string,
  photosCount?: number
): Promise<string> {
  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        entryContext,
        userMood,
        locationContext,
        photosCount
      })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.fallbackReply) return data.fallbackReply;
      if (data.reply) return data.reply;
      return "I'm listening and holding space for your thoughts. Even when words are hard to process, taking time to reflect is meaningful. What is one small thing bringing you peace today?";
    }

    const data = await res.json();
    return data.reply || "Thank you for sharing your reflection with me. What part of today feels most meaningful to hold onto?";
  } catch (err) {
    console.warn('Network chat fallback used:', err);
    return "I'm listening and holding space for your thoughts. Taking time to pause and write is a meaningful step toward self-awareness. What part of today feels most important to hold onto?";
  }
}

/**
 * Generates an evocative, poetic reflection title.
 * If API is delayed or unavailable, immediately falls back to rich heuristic extractor.
 */
export async function generateJournalTitle(
  content: string,
  mood?: MoodType,
  location?: { name: string },
  timestamp?: number
): Promise<string> {
  // If content is very short or empty, derive immediately with zero network delay
  if (!content || content.trim().length < 15) {
    return deriveTitleFromContent(content, mood, location?.name, timestamp);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout for ultra-fast title response

    const res = await fetch('/api/gemini/generate-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, mood, location }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.title && typeof data.title === 'string' && data.title.trim()) {
        return data.title.trim();
      }
    }
  } catch (err) {
    console.warn('Title generator API fallback:', err);
  }

  // Fast reliable fallback
  return deriveTitleFromContent(content, mood, location?.name, timestamp);
}

export async function analyzeEntryEmotions(
  title: string,
  content: string,
  mood?: string,
  chatMessages?: ChatMessage[]
): Promise<EmotionAnalysis> {
  try {
    const res = await fetch('/api/gemini/analyze-emotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        mood,
        chatMessages
      })
    });

    if (!res.ok) {
      const fallback = await res.json().catch(() => null);
      if (fallback && fallback.primaryEmotion) return fallback;
      throw new Error('Failed to analyze entry emotions');
    }

    return await res.json();
  } catch (err) {
    console.warn('Using local fallback for emotion analysis:', err);
    return {
      sentimentScore: 0.6,
      primaryEmotion: mood ? mood.charAt(0).toUpperCase() + mood.slice(1) : "Peaceful Reflection",
      emotionBreakdown: {
        joy: 60,
        calm: 75,
        gratitude: 70,
        stress: 20,
        sadness: 10,
        inspiration: 65,
        energy: 55
      },
      growthInsight: "Writing down your reflections brings mindful clarity and emotional grounding.",
      reflectionPrompts: [
        "What is one positive intention you wish to set for tomorrow?",
        "What is something you learned about yourself through today's reflection?"
      ],
      actionableIdeas: [
        "Take three slow, deep mindful breaths",
        "Write down three small things you appreciate right now"
      ],
      analyzedAt: Date.now()
    };
  }
}

export interface TranslateSpeechResult {
  detectedLanguage: string;
  originalText: string;
  translatedJournalText: string;
  suggestedTitle: string;
  suggestedMood: string;
}

export async function translateIndianSpeech(
  transcript: string,
  sourceLanguage?: string
): Promise<TranslateSpeechResult> {
  const res = await fetch('/api/gemini/translate-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript,
      sourceLanguage
    })
  });

  if (!res.ok) {
    throw new Error('Failed to translate spoken journal entry');
  }

  return await res.json();
}

export async function generateEvolutionReport(entries: JournalEntry[]): Promise<EvolutionReport> {
  const res = await fetch('/api/gemini/evolution-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries })
  });

  if (!res.ok) {
    throw new Error('Failed to generate emotion evolution report');
  }

  return await res.json();
}

export async function generateDynamicPrompt(category?: string, currentMood?: string): Promise<string> {
  try {
    const res = await fetch('/api/gemini/generate-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, currentMood })
    });
    if (!res.ok) throw new Error('Failed to fetch prompt');
    const data = await res.json();
    return data.prompt;
  } catch {
    return "What is a small, quiet moment from today that you'd like to remember?";
  }
}

export async function generatePhotoInsight(
  caption: string, 
  locationName?: string, 
  placeCategory?: string
): Promise<string> {
  try {
    const res = await fetch('/api/gemini/photo-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption, locationName, placeCategory })
    });
    const data = await res.json();
    return data.reflection;
  } catch {
    return "This visual memory captures a moment in time. What feeling does it bring back?";
  }
}

export async function generateReflectionTags(params: {
  title?: string;
  content: string;
  mood?: string;
  location?: { name: string };
}): Promise<string[]> {
  try {
    const res = await fetch('/api/gemini/generate-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to generate tags from API');
    const data = await res.json();
    if (data.tags && Array.isArray(data.tags)) {
      return data.tags;
    }
  } catch (err) {
    console.warn('API tag generation fallback to heuristic extractor:', err);
  }
  
  // Fallback to local heuristic extractor
  const { extractTagsFromContent } = await import('./tagExtractor');
  return extractTagsFromContent(params.content, params.title, params.mood, params.location?.name);
}

