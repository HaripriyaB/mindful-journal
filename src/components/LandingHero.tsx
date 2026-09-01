import React, { useState } from 'react';
import { 
  Lock, 
  Sparkles, 
  Mic, 
  MapPin, 
  Image as ImageIcon, 
  TrendingUp, 
  ShieldCheck, 
  BrainCircuit,
  MessageSquareHeart,
  ArrowRight,
  Languages,
  Database,
  Waves,
  Heart
} from 'lucide-react';
import { loginWithGoogle, loginAsGuest } from '../lib/authService';
import { CHARACTER_LIST, EmotionCharacter } from '../lib/emotionCharacters';

interface LandingHeroProps {
  onAuthSuccess: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activePreviewChar, setActivePreviewChar] = useState<EmotionCharacter>(CHARACTER_LIST[0]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await loginWithGoogle();
      onAuthSuccess();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user' || err.message?.includes('popup')) {
        setErrorMsg('Sign-in popup was closed. You can also sign in as a guest to test the journal immediately.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg('Google Sign-In is not enabled in the Firebase console. Please enable it under Authentication → Sign-in method → Google.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('This domain is not authorised in Firebase. Add it under Authentication → Settings → Authorised domains.');
      } else if (err.code === 'auth/invalid-api-key') {
        setErrorMsg('Invalid Firebase API key. Check your firebase-applet-config.json.');
      } else {
        setErrorMsg(`Sign-In failed: ${err.message || 'Unknown error'}. You can continue as a Guest.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await loginAsGuest();
      onAuthSuccess();
    } catch (err: any) {
      console.error('Guest login error:', err);
      setErrorMsg('Failed to sign in as guest: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between pt-10 pb-28 px-4 sm:px-6 lg:px-8 bg-transparent text-stone-100 relative">
      <div className="max-w-5xl mx-auto w-full space-y-12">
        {/* Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-4 pb-2">
          <div className="inline-flex items-center space-x-2 bg-stone-900/80 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-300 shadow-md backdrop-blur-md">
            <Waves className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>The Flow of Life &bull; Emotion Companions</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-50 leading-tight">
            Your Private Sanctuary for Mindful Reflections
          </h1>

          <p className="text-base sm:text-lg text-stone-300 font-normal leading-relaxed max-w-2xl mx-auto">
            Experience feelings as living guides in the flow of life. Speak in any Indian language, attach photos & travels, and let your emotions flow like harmonic waves.
          </p>

          {/* Authentication Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="landing-google-signin-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-stone-50 hover:bg-white text-stone-900 font-semibold px-6 py-3.5 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Authenticating...' : 'Sign in with Google'}</span>
              <ArrowRight className="w-4 h-4 text-stone-500" />
            </button>

            <button
              id="landing-guest-signin-btn"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-white px-5 py-3.5 rounded-xl border border-stone-700 font-medium transition backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Explore as Guest</span>
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 p-2.5 rounded-lg max-w-md mx-auto">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Living Emotion Guides & Resonance Council Showcase */}
        <div className="bg-stone-900/80 border border-stone-800/90 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">✨</span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-100">
                  Inner Resonance Council
                </h2>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Emotions are not obstacles—they are living guides helping you navigate life's currents.
              </p>
            </div>
          </div>

          {/* Emotion Guides Row */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {CHARACTER_LIST.map((char) => {
              const isSelected = activePreviewChar.id === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => setActivePreviewChar(char)}
                  className={`flex flex-col items-center p-2.5 rounded-2xl border transition-all text-center ${
                    isSelected
                      ? 'bg-stone-800 border-amber-400 shadow-lg transform -translate-y-1'
                      : 'bg-stone-950/40 border-stone-800/60 hover:bg-stone-800/60'
                  }`}
                  style={{
                    boxShadow: isSelected ? `0 0 16px ${char.glowColor}` : 'none'
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg mb-1.5 shadow-inner transition transform group-hover:scale-110"
                    style={{
                      backgroundColor: char.primaryColor + '30',
                      border: `2px solid ${char.primaryColor}`,
                      boxShadow: isSelected ? `0 0 10px ${char.glowColor}` : 'none'
                    }}
                  >
                    {char.characterEmoji}
                  </div>
                  <span className="text-xs font-bold text-stone-200 truncate w-full">
                    {char.name}
                  </span>
                  <span className="text-[9px] text-stone-400 uppercase tracking-tighter truncate w-full">
                    {char.personality.split('&')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Guide Spotlight Preview Card */}
          <div 
            className="rounded-2xl p-5 border transition-all duration-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            style={{
              backgroundColor: activePreviewChar.primaryColor + '15',
              borderColor: activePreviewChar.primaryColor + '40',
              boxShadow: `0 0 24px ${activePreviewChar.glowColor}`
            }}
          >
            <div className="flex items-center space-x-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-xl"
                style={{
                  backgroundColor: activePreviewChar.primaryColor + '33',
                  border: `2px solid ${activePreviewChar.primaryColor}`
                }}
              >
                {activePreviewChar.characterEmoji}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-serif text-lg font-bold text-stone-100">
                    {activePreviewChar.name} &bull; <span className="font-normal text-stone-300">{activePreviewChar.characterTitle}</span>
                  </h3>
                  <span 
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: activePreviewChar.primaryColor + '33',
                      color: activePreviewChar.accentColor
                    }}
                  >
                    {activePreviewChar.personality}
                  </span>
                </div>
                <p className="text-xs text-stone-300 italic font-serif">
                  {activePreviewChar.quote}
                </p>
              </div>
            </div>

            <div className="shrink-0 md:border-l md:border-stone-700/60 md:pl-5 max-w-sm">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Role in Your Life
              </span>
              <p className="text-xs text-stone-200 mt-0.5 leading-relaxed">
                {activePreviewChar.description}
              </p>
            </div>
          </div>
        </div>

        {/* 6 Feature Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-8">
          {/* Feature 1 */}
          <div className="bg-stone-900/70 border border-stone-800/80 rounded-2xl p-5 hover:border-amber-500/40 transition backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-100 text-base mb-1.5">
              Interactive Reflections
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Explore your thoughts with compassionate, thoughtful guidance, uncover emotional patterns, and brainstorm gentle next steps.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-stone-900/70 border border-stone-800/80 rounded-2xl p-5 hover:border-amber-500/40 transition backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <Languages className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-100 text-base mb-1.5">
              Indian Language Speech-to-Text
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Speak naturally in Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, or Hinglish.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-stone-900/70 border border-stone-800/80 rounded-2xl p-5 hover:border-amber-500/40 transition backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-100 text-base mb-1.5">
              Emotion Evolution Analytics
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Track how your emotional state (Joy, Calm, Gratitude, Inspiration) evolves across weeks with radar charts and growth reports.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-stone-900/70 border border-stone-800/80 rounded-2xl p-5 hover:border-amber-500/40 transition backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-100 text-base mb-1.5">
              Photo Memories & Albums
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Attach photographs and albums to your journal entries. Generate mindful reflections inspired by your visual memories.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-stone-900/70 border border-stone-800/80 rounded-2xl p-5 hover:border-amber-500/40 transition backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-100 text-base mb-1.5">
              Location & Travel Tagging
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Pin where memories happened. Tag serene cafes, travel spots, hometowns, or current coordinates with direct interactive map previews.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-stone-900/70 border border-stone-800/80 rounded-2xl p-5 hover:border-amber-500/40 transition backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-stone-100 text-base mb-1.5">
              Private Sanctuary
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Your reflections, voice memos, and dialogues are protected and accessible exclusively to your private account.
            </p>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-stone-500 border-t border-stone-800/80 pt-6">
        Mindful Journal &bull; The Flow of Life Sanctuary &bull; Powered by Compassionate Reflection
      </div>
    </div>
  );
};
