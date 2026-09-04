export type MoodType = 
  | 'happy' 
  | 'peaceful' 
  | 'grateful' 
  | 'motivated' 
  | 'neutral' 
  | 'anxious' 
  | 'sad' 
  | 'overwhelmed' 
  | 'contemplative';

export interface PhotoAttachment {
  id: string;
  url: string;
  caption?: string;
  albumTitle?: string;
  source: 'upload' | 'google_photos' | 'url';
}

export interface LocationTag {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  mapUrl?: string;
  placeCategory?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface EmotionBreakdown {
  joy: number;       // 0 - 100
  calm: number;      // 0 - 100
  gratitude: number; // 0 - 100
  stress: number;    // 0 - 100
  sadness: number;   // 0 - 100
  inspiration: number; // 0 - 100
  energy: number;    // 0 - 100
}

export interface EmotionAnalysis {
  sentimentScore: number; // -1.0 to 1.0
  primaryEmotion: string;
  emotionBreakdown: EmotionBreakdown;
  growthInsight: string;
  reflectionPrompts: string[];
  actionableIdeas: string[];
  analyzedAt: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  originalTranscript?: string;
  languageDetected?: string;
  mood?: MoodType;
  tags: string[];
  photos: PhotoAttachment[];
  location?: LocationTag;
  audioRecordingUrl?: string;
  audioDuration?: number;
  chatMessages: ChatMessage[];
  emotionAnalysis?: EmotionAnalysis;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
  domainUnauthorized?: boolean;
}

export interface EvolutionReport {
  summary: string;
  dominantTrend: string;
  keyMilestones: string[];
  strengthsIdentified: string[];
  coachingAdvice: string[];
  recommendedFocus: string;
  generatedAt: number;
}

export interface IndianLanguageOption {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
}
