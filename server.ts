import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const app = express();
// Cloud Run (and most hosts) inject the port to bind to via process.env.PORT;
// hardcoding a port here breaks deployment since the platform won't route to it.
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn('Warning: GEMINI_API_KEY is not set. Responses will be simulated if no key is present.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Resilient model cascade: prioritizes high-throughput gemini-3.1-flash-lite -> gemini-3.7-flash -> gemini-flash-latest
const FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.7-flash', 'gemini-flash-latest'];

async function generateWithFallback(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
  maxRetriesPerModel?: number;
}): Promise<{ text: string | null; modelUsed: string }> {
  const ai = getAI();
  const models = params.preferredModel 
    ? [params.preferredModel, ...FALLBACK_MODELS.filter(m => m !== params.preferredModel)]
    : FALLBACK_MODELS;

  for (const model of models) {
    const maxRetries = params.maxRetriesPerModel ?? 1;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: params.contents,
          config: params.config
        });
        return { text: response.text || null, modelUsed: model };
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isTransient = errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('429') || errMsg.includes('UNAVAILABLE') || errMsg.includes('RESOURCE_EXHAUSTED');
        
        if (isTransient && attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 300 * (attempt + 1)));
          continue;
        }
        // Move to next available model quietly
        break;
      }
    }
  }

  return { text: null, modelUsed: 'fallback-heuristic' };
}

// Helper to derive a clean mindful title locally if model calls fail or key is absent
function deriveTitleLocally(content: string, mood?: string, locationName?: string, timestamp: number = Date.now()): string {
  const cleanContent = (content || '').trim();

  if (cleanContent.length > 0) {
    const lower = cleanContent.toLowerCase();

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

    const firstSentence = cleanContent.split(/[\n.?!]/)[0].trim();
    if (firstSentence.length > 5 && firstSentence.length <= 45 && !firstSentence.toLowerCase().startsWith('today i') && !firstSentence.toLowerCase().startsWith('i feel')) {
      return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
    }
  }

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: Date.now()
  });
});

// Helper for constructing chat prompt contents
function buildChatContext(body: any) {
  const { messages, entryContext, userMood, locationContext, photosCount } = body;
  
  const systemInstruction = `You are a perceptive, deeply grounded, and poetic philosophical journal companion.
Your mission is to provide high-impact, emotionally intelligent, and compact reflection that truly matters to the writer.

STRICT EDITORIAL RULES:
1. ZERO FILLER: Never start with generic therapy clichés like "Thank you for sharing", "I hear you", "As an AI", or "It's great that you're journaling". Dive straight into the core emotional truth.
2. STRICT BREVITY & IMPACT: Keep your total response between 45 and 75 words maximum. Every single word must carry psychological weight.
3. SIGNATURE FORMATTING STRUCTURE:
   - Paragraph 1 (1-2 sentences): A sharp, poetic observation that names the underlying feeling, tension, or quiet victory in their words.
   - Core Takeaway: A bolded, perspective-shifting realization (e.g., **"Peace is not the absence of noise, but clarity amidst it."**).
   - Paragraph 2 (1 sentence): A single piercing question on its own line formatted strictly as:
     > **Anchor Question:** <Your question here>
4. TONE: Warm, contemplative, stoic yet compassionate, observant, and deeply human.
${userMood ? `User's current state: ${userMood}.` : ''}
${locationContext ? `Location: ${locationContext}.` : ''}
${photosCount ? `Attached photos: ${photosCount}.` : ''}
${entryContext ? `Current Journal Entry:\n"""\n${entryContext}\n"""` : ''}`;

  const contents: any[] = [];
  
  if (messages && Array.isArray(messages)) {
    messages.forEach((msg: any) => {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      });
    });
  }

  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: `Here is my reflection: "${entryContext || 'I am pausing to reflect today.'}". Give me a sharp, concise reflection, one bold insight, and a single anchor question.` }]
    });
  }

  return { systemInstruction, contents };
}

// 1a. Real-Time Streaming Multi-turn Journal Reflection with Gemini
app.post('/api/gemini/chat-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const { userMood, entryContext } = req.body;

  const fallbackReply = `Your words carry a quiet honesty that cuts through the noise of the day.\n\n**Clarity begins the moment you stop rushing past your own feelings.**\n\n> **Anchor Question:** What is one expectation you can gently set down before tomorrow?`;

  const streamFallbackLocally = async () => {
    const words = fallbackReply.split(' ');
    for (const word of words) {
      sendEvent({ chunk: word + ' ' });
      await new Promise(r => setTimeout(r, 18));
    }
    sendEvent({ done: true });
    res.end();
  };

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return await streamFallbackLocally();
    }

    const ai = getAI();
    const { systemInstruction, contents } = buildChatContext(req.body);

    let streamSucceeded = false;

    // Try streaming across fallback models if primary model is experiencing high demand
    for (const model of FALLBACK_MODELS) {
      let chunkSentThisAttempt = false;
      try {
        const streamResponse = await ai.models.generateContentStream({
          model: model,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            temperature: 0.65,
            maxOutputTokens: 250
          }
        });

        for await (const chunk of streamResponse) {
          const text = chunk.text;
          if (text) {
            chunkSentThisAttempt = true;
            sendEvent({ chunk: text });
          }
        }

        sendEvent({ done: true });
        res.end();
        streamSucceeded = true;
        break;
      } catch {
        // If we already streamed partial content to the client, switching to
        // another model would append unrelated text and produce garbled output.
        // Just end the response here instead of retrying with a different model.
        if (chunkSentThisAttempt) {
          sendEvent({ done: true });
          res.end();
          streamSucceeded = true;
          break;
        }
        // No content sent yet, safe to continue to next model cascade quietly
      }
    }

    if (!streamSucceeded) {
      await streamFallbackLocally();
    }
  } catch {
    await streamFallbackLocally();
  }
});

// 1b. Fast Conversational Journal Reflection (Non-streaming fallback)
app.post('/api/gemini/chat', async (req, res) => {
  const { userMood } = req.body;
  const fallbackReply = `Your words carry a quiet honesty that cuts through the noise of the day.\n\n**Clarity begins the moment you stop rushing past your own feelings.**\n\n> **Anchor Question:** What is one expectation you can gently set down before tomorrow?`;

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.json({ reply: fallbackReply });
    }

    const { systemInstruction, contents } = buildChatContext(req.body);

    const { text } = await generateWithFallback({
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0.65,
        maxOutputTokens: 250
      }
    });

    const replyText = text || fallbackReply;
    res.json({ reply: replyText });
  } catch (error: any) {
    res.json({ reply: fallbackReply });
  }
});

// 1c. Fast Interactive Title Generator
app.post('/api/gemini/generate-title', async (req, res) => {
  const { content, mood, location } = req.body;
  
  // Immediately derive title locally if content is absent or short
  if (!content || !content.trim()) {
    return res.json({ title: deriveTitleLocally('', mood, location?.name) });
  }

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.json({ title: deriveTitleLocally(content, mood, location?.name) });
    }

    const prompt = `Based on this personal journal reflection, generate exactly ONE evocative, poetic, and concise title (3 to 6 words maximum). Do NOT include quotation marks, markdown, or punctuation.
Mood: ${mood || 'reflective'}
Location: ${location?.name || ''}
Content:
"""
${content.slice(0, 1500)}
"""`;

    const { text } = await generateWithFallback({
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0.5,
        maxOutputTokens: 30
      }
    });

    let generatedTitle = (text || '').trim().replace(/^["']|["']$/g, '').replace(/\.$/, '');
    if (!generatedTitle || generatedTitle.length > 50) {
      generatedTitle = deriveTitleLocally(content, mood, location?.name);
    }

    res.json({ title: generatedTitle });
  } catch (error: any) {
    console.warn('Error in /api/gemini/generate-title, falling back to local extractor:', error?.message || error);
    res.json({ title: deriveTitleLocally(content, mood, location?.name) });
  }
});

// 2. Emotion Evolution & Structured Sentiment Analysis
app.post('/api/gemini/analyze-emotions', async (req, res) => {
  const { title, content, mood, chatMessages } = req.body;

  const fallbackResult = {
    sentimentScore: 0.65,
    primaryEmotion: mood ? mood.charAt(0).toUpperCase() + mood.slice(1) : "Reflective & Mindful",
    emotionBreakdown: {
      joy: 65,
      calm: 80,
      gratitude: 70,
      stress: 20,
      sadness: 10,
      inspiration: 75,
      energy: 60
    },
    growthInsight: "Writing down your reflections creates mental clarity and grounds your awareness.",
    reflectionPrompts: [
      "What is one unexpected highlight from today that made you smile?",
      "How can you bring a sense of today's calm into your upcoming week?"
    ],
    actionableIdeas: [
      "Take a 10-minute mindful walk without screens",
      "Express gratitude to someone who crossed your mind today"
    ],
    analyzedAt: Date.now()
  };

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.json(fallbackResult);
    }

    const chatTranscript = Array.isArray(chatMessages) 
      ? chatMessages.map((m: any) => `${m.role.toUpperCase()}: ${m.text}`).join('\n')
      : '';

    const prompt = `You are a perceptive psychologist, philosopher, and mindfulness analyst.
Analyze this journal entry and reflection dialogue to measure emotional nuance and extract crisp, transformative mindfulness insights.

Title: ${title || 'Untitled Entry'}
User Declared Mood: ${mood || 'Not specified'}
Journal Content:
"""
${content || 'Empty entry'}
"""

Reflective Dialogue:
"""
${chatTranscript}
"""

Return a strictly valid JSON object (NO markdown wrappers, NO extra explanation) with this EXACT structure:
{
  "sentimentScore": <number between -1.0 (very negative) to 1.0 (very positive)>,
  "primaryEmotion": "<concise 1-3 word primary emotional state e.g., Grounded Clarity, Restless Longing, Quiet Gratitude, Creative Tension, Tender Vulnerability>",
  "emotionBreakdown": {
    "joy": <integer 0 to 100>,
    "calm": <integer 0 to 100>,
    "gratitude": <integer 0 to 100>,
    "stress": <integer 0 to 100>,
    "sadness": <integer 0 to 100>,
    "inspiration": <integer 0 to 100>,
    "energy": <integer 0 to 100>
  },
  "growthInsight": "<1-2 sentence razor-sharp psychological realization that cuts through superficial noise and highlights the user's hidden strength>",
  "reflectionPrompts": [
    "<piercing, non-cliché introspection question 1 tailored specifically to their situation>",
    "<piercing, non-cliché introspection question 2 tailored specifically to their situation>"
  ],
  "actionableIdeas": [
    "<tactile, immediate 2-minute mindful micro-action 1>",
    "<tactile, immediate 2-minute mindful micro-action 2>"
  ]
}`;

    const { text } = await generateWithFallback({
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    });

    let resultJson;
    if (!text) {
      resultJson = fallbackResult;
    } else {
      try {
        const cleanedText = text.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');
        resultJson = JSON.parse(cleanedText);
      } catch (e) {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          resultJson = JSON.parse(text.substring(start, end + 1));
        } else {
          resultJson = fallbackResult;
        }
      }
      // Guard against a "successfully parsed" but empty/incomplete JSON object
      // (e.g. the model returned "{}"), which would otherwise slip past the
      // catch block above and return a broken payload to the client.
      if (typeof resultJson.sentimentScore !== 'number' || !resultJson.emotionBreakdown) {
        resultJson = fallbackResult;
      }
    }

    resultJson.analyzedAt = Date.now();
    res.json(resultJson);
  } catch (error: any) {
    console.warn('Error in /api/gemini/analyze-emotions, using graceful fallback:', error?.message || error);
    res.json(fallbackResult);
  }
});

// 3. Indian Language Speech-to-Text Translation & Journal Transcription
app.post('/api/gemini/translate-speech', async (req, res) => {
  const { transcript, sourceLanguage } = req.body;

  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: 'No transcript provided' });
  }

  const fallbackSpeech = {
    detectedLanguage: sourceLanguage || "Indian Language",
    originalText: transcript,
    translatedJournalText: transcript,
    suggestedTitle: deriveTitleLocally(transcript, 'peaceful'),
    suggestedMood: "peaceful"
  };

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.json(fallbackSpeech);
    }

    const prompt = `You are an expert multilingual Indian language translator and journal prose editor.
A user has spoken their personal journal entry using Speech-to-Text. It might be in an Indian language (such as Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Urdu, Hinglish, Tanglish, Kanglish, etc.) or mixed English.

User's spoken raw transcript:
"""
${transcript}
"""
Target spoken language hint: ${sourceLanguage || 'Auto-detect Indian language or mixed speech'}

Your task:
1. Detect the exact language used.
2. Accurately translate it into rich, natural, reflective, and fluent English prose suitable for a personal journal entry.
3. Clean up speech disfluencies (um, ah, repetitive words) while strictly keeping the user's authentic sentiment, details, memories, and tone.
4. Suggest a fitting journal title and mood (one of: 'happy', 'peaceful', 'grateful', 'motivated', 'neutral', 'anxious', 'sad', 'overwhelmed', 'contemplative').

Return ONLY a valid JSON object matching this schema:
{
  "detectedLanguage": "<e.g., Hindi (हिन्दी), Tamil (தமிழ்), Telugu (తెలుగు), Bengali (বাংলা), Hinglish, etc.>",
  "originalText": "<the cleaned original transcript in its native script or transliteration>",
  "translatedJournalText": "<beautiful, eloquent English journal text formatted with clear paragraphs>",
  "suggestedTitle": "<compelling 3-6 word journal title>",
  "suggestedMood": "<happy|peaceful|grateful|motivated|neutral|anxious|sad|overwhelmed|contemplative>"
}`;

    const { text } = await generateWithFallback({
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    });

    let resultJson;
    if (!text) {
      resultJson = fallbackSpeech;
    } else {
      try {
        const cleaned = text.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');
        resultJson = JSON.parse(cleaned);
      } catch (e) {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          resultJson = JSON.parse(text.substring(start, end + 1));
        } else {
          resultJson = fallbackSpeech;
        }
      }
      // Guard against a "successfully parsed" but empty/incomplete JSON object
      // slipping past the catch block above and reaching the client.
      if (!resultJson.translatedJournalText) {
        resultJson = fallbackSpeech;
      }
    }

    res.json(resultJson);
  } catch (error: any) {
    console.warn('Error in /api/gemini/translate-speech, using fallback:', error?.message || error);
    res.json(fallbackSpeech);
  }
});

// 4. Longitudinal Emotion Evolution Report over time
app.post('/api/gemini/evolution-report', async (req, res) => {
  const { entries } = req.body;

  const fallbackReport = {
    summary: "Across your recent journal entries, your emotional trajectory shows steady resilience, deep contemplative awareness, and growing moments of gratitude and calm.",
    dominantTrend: "Upward trend in clarity and peace",
    keyMilestones: [
      "Cultivated consistent daily reflection habits",
      "Effectively navigated moments of stress by expressing thoughts",
      "Celebrated meaningful daily wins and connections"
    ],
    strengthsIdentified: [
      "Self-reflection and introspective honesty",
      "Appreciation for relationships and everyday surroundings",
      "Emotional agility in processing challenges"
    ],
    coachingAdvice: [
      "Continue allocating 10 undisturbed minutes for evening reflections",
      "Lean into grounding voice reflections when busy",
      "Celebrate the small positive shifts in your weekly routine"
    ],
    recommendedFocus: "Nurturing creative energy & mindful presence",
    generatedAt: Date.now()
  };

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return res.json(fallbackReport);
  }

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.json(fallbackReport);
    }

    const entriesSummary = entries.map((e: any, index: number) => {
      const dateStr = new Date(e.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const emotions = e.emotionAnalysis?.primaryEmotion || e.mood || 'Unspecified';
      const score = e.emotionAnalysis?.sentimentScore !== undefined ? e.emotionAnalysis.sentimentScore : 'N/A';
      return `Entry ${index + 1} (${dateStr}): Title: "${e.title || 'Untitled'}" | Mood: ${emotions} | Sentiment: ${score} | Excerpt: "${(e.content || '').slice(0, 200)}..."`;
    }).join('\n\n');

    const prompt = `You are a psychological wellness and emotional evolution analytics expert.
Analyze this user's journal history over time to synthesize how their emotions, mindset, resilience, and personal growth have evolved.

User's Journal History (${entries.length} entries):
"""
${entriesSummary}
"""

Return a strictly valid JSON object with this EXACT structure:
{
  "summary": "<3-4 sentence comprehensive, warm synthesis of how the user's emotions and inner life have evolved across these entries>",
  "dominantTrend": "<1 sentence headline on the dominant emotional trajectory e.g., 'Gradual transformation from fatigue to energized clarity'>",
  "keyMilestones": [
    "<milestone/turning point 1 observed across the timeline>",
    "<milestone/turning point 2 observed across the timeline>",
    "<milestone/turning point 3 observed across the timeline>"
  ],
  "strengthsIdentified": [
    "<psychological strength/coping mechanism 1>",
    "<psychological strength/coping mechanism 2>",
    "<psychological strength/coping mechanism 3>"
  ],
  "coachingAdvice": [
    "<supportive, actionable recommendation 1 for mental well-being>",
    "<supportive, actionable recommendation 2 for mental well-being>",
    "<supportive, actionable recommendation 3 for mental well-being>"
  ],
  "recommendedFocus": "<theme or intention for the user's next journaling phase>"
}`;

    const { text } = await generateWithFallback({
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        temperature: 0.4
      }
    });

    let resultJson;
    if (!text) {
      resultJson = fallbackReport;
    } else {
      try {
        const cleaned = text.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');
        resultJson = JSON.parse(cleaned);
      } catch (e) {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          resultJson = JSON.parse(text.substring(start, end + 1));
        } else {
          resultJson = fallbackReport;
        }
      }
      // Guard against a "successfully parsed" but empty/incomplete JSON object
      // slipping past the catch block above and reaching the client.
      if (!resultJson.summary || !Array.isArray(resultJson.keyMilestones)) {
        resultJson = fallbackReport;
      }
    }

    resultJson.generatedAt = Date.now();
    res.json(resultJson);
  } catch (error: any) {
    console.warn('Error in /api/gemini/evolution-report, using fallback:', error?.message || error);
    res.json(fallbackReport);
  }
});

// 5. Dynamic Journaling Prompt Generator
app.post('/api/gemini/generate-prompt', async (req, res) => {
  const { category, currentMood } = req.body;
  const defaults = [
    "What is a small moment from today that made you feel peaceful or grateful?",
    "If you could give your present self one compassionate reminder, what would it be?",
    "What thought or emotion has been taking up the most space in your mind today?",
    "What is one thing your future self will thank you for feeling or doing today?"
  ];
  const fallbackPrompt = defaults[Math.floor(Math.random() * defaults.length)];

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.json({ prompt: fallbackPrompt });
    }

    const { text } = await generateWithFallback({
      contents: `Generate 1 unique, deeply evocative, and gentle journaling prompt for a user in category '${category || 'reflection'}' who is feeling '${currentMood || 'contemplative'}'. Make it 1-2 sentences. Do not use quotes.`,
      config: { 
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0.7,
        maxOutputTokens: 60
      }
    });

    res.json({ prompt: text?.trim() || fallbackPrompt });
  } catch (error: any) {
    res.json({ prompt: fallbackPrompt });
  }
});

// 5b. Content-Based Reflection Tags Generator
app.post('/api/gemini/generate-tags', async (req, res) => {
  const { title, content, mood, location } = req.body;

  const extractLocalTags = () => {
    const words = `${title || ''} ${content || ''}`.toLowerCase();
    const extracted: string[] = [];
    
    if (words.includes('gratitud') || words.includes('thank')) extracted.push('gratitude');
    if (words.includes('work') || words.includes('project') || words.includes('job')) extracted.push('work-life');
    if (words.includes('walk') || words.includes('nature') || words.includes('tree') || words.includes('rain')) extracted.push('nature');
    if (words.includes('family') || words.includes('friend') || words.includes('partner') || words.includes('love')) extracted.push('relationships');
    if (words.includes('breath') || words.includes('calm') || words.includes('peace') || words.includes('meditat')) extracted.push('inner-peace');
    if (words.includes('anxious') || words.includes('stress') || words.includes('overwhelm') || words.includes('worry')) extracted.push('healing');
    if (words.includes('goal') || words.includes('dream') || words.includes('plan') || words.includes('learn')) extracted.push('growth');
    if (words.includes('morning') || words.includes('dawn') || words.includes('coffee') || words.includes('tea')) extracted.push('morning-routine');
    if (words.includes('travel') || words.includes('trip') || words.includes('flight') || words.includes('hotel')) extracted.push('travel');
    
    if (mood && !extracted.includes(mood)) extracted.push(mood);
    if (location && location.name) extracted.push(location.name.toLowerCase().replace(/[^a-z0-9]/g, '-'));
    if (extracted.length === 0) extracted.push('self-reflection', 'daily-log', 'clarity');

    return Array.from(new Set(extracted)).slice(0, 6);
  };

  if (!content && !title) {
    return res.json({ tags: ['mindfulness', 'reflection', 'daily-thoughts'] });
  }

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.json({ tags: extractLocalTags() });
    }

    const prompt = `Analyze this personal journal entry and generate 3 to 6 concise, highly relevant, lowercase reflection tags (kebab-case, e.g., 'morning-walk', 'gratitude', 'work-focus', 'deep-breathing', 'family-time').

Title: "${title || ''}"
Mood: "${mood || ''}"
Location: "${location?.name || ''}"
Content:
"""
${(content || '').slice(0, 2000)}
"""

Return strictly a JSON array of string tags, for example: ["mindfulness", "nature-walk", "evening-clarity"]`;

    const { text } = await generateWithFallback({
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    });

    let tags = [];
    try {
      const cleaned = (text || '[]').trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        tags = parsed.map(t => String(t).toLowerCase().replace(/[^a-z0-9-]/g, '').trim()).filter(Boolean);
      } else if (parsed.tags && Array.isArray(parsed.tags)) {
        tags = parsed.tags.map((t: any) => String(t).toLowerCase().replace(/[^a-z0-9-]/g, '').trim()).filter(Boolean);
      }
    } catch (err) {
      tags = extractLocalTags();
    }

    if (tags.length === 0) {
      tags = extractLocalTags();
    }

    res.json({ tags: Array.from(new Set(tags)).slice(0, 6) });
  } catch (error: any) {
    console.warn('Error in /api/gemini/generate-tags, using local tags:', error?.message || error);
    res.json({ tags: extractLocalTags() });
  }
});

// 6. Photo & Location Context Insight
app.post('/api/gemini/photo-insight', async (req, res) => {
  const { caption, locationName } = req.body;
  const fallbackInsight = `This place and visual memory at ${locationName || 'this spot'} captures a serene slice of time. What was the air like when you were there?`;

  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.json({ reflection: fallbackInsight });
    }

    const { text } = await generateWithFallback({
      contents: `Write a 2-sentence poetic, mindfulness-oriented reflection for a journal entry that includes a photo with caption: "${caption || 'Scenic memory'}" taken at location: "${locationName || 'Special place'}". Ask 1 sensory question to awaken the memory.`,
      config: { 
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        temperature: 0.7,
        maxOutputTokens: 100
      }
    });

    res.json({ reflection: text?.trim() || fallbackInsight });
  } catch (error: any) {
    res.json({ reflection: fallbackInsight });
  }
});

// Integrate Vite middleware in development or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Personal Gemini Journal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
