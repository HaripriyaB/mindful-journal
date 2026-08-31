import { IndianLanguageOption } from '../types';

export const INDIAN_LANGUAGES: IndianLanguageOption[] = [
  { code: 'auto', name: 'Auto-detect Indian Language / Mixed', nativeName: 'ऑटो पहचान / பலமொழிகள்', speechCode: 'hi-IN' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', speechCode: 'hi-IN' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', speechCode: 'ta-IN' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', speechCode: 'te-IN' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', speechCode: 'bn-IN' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', speechCode: 'mr-IN' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', speechCode: 'gu-IN' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം', speechCode: 'ml-IN' },
  { code: 'pa-IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN' },
  { code: 'ur-IN', name: 'Urdu', nativeName: 'اردو', speechCode: 'ur-IN' },
  { code: 'en-IN', name: 'English (India)', nativeName: 'Indian English', speechCode: 'en-IN' },
];

export const MOOD_DEFINITIONS = [
  { id: 'peaceful', label: 'Peaceful', emoji: '🌿', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  { id: 'grateful', label: 'Grateful', emoji: '✨', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  { id: 'happy', label: 'Joyful', emoji: '☀️', color: 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100' },
  { id: 'motivated', label: 'Motivated', emoji: '🔥', color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' },
  { id: 'contemplative', label: 'Thoughtful', emoji: '🌌', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' },
  { id: 'neutral', label: 'Calm / Steady', emoji: '🍃', color: 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100' },
  { id: 'anxious', label: 'Anxious / Restless', emoji: '🌊', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { id: 'sad', label: 'Melancholic', emoji: '🌧️', color: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌪️', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' },
];
