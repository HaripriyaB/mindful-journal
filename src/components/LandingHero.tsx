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
  Waves,
  Heart,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { loginWithGoogle, loginAsGuest } from '../lib/authService';
import { EMOTIONS_LIST, getEmotionMeta } from '../lib/emotionIcons';
import firebaseConfig from '../../firebase-applet-config.json';

interface LandingHeroProps {
  onAuthSuccess: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseProjectId = firebaseConfig.projectId || 'silicon-park-505415-s7';
  const authorizedDomainsUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`;

  const copyDomain = () => {
    if (navigator.clipboard && currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setIsUnauthorizedDomain(false);
      await loginWithGoogle();
      onAuthSuccess();
    } catch (err: any) {
      console.warn('Login notice:', err?.message || err);
      const code = err.code || '';
      const msg = err.message || '';

      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setIsUnauthorizedDomain(true);
        setErrorMsg('Domain authorization is required in Firebase for Google OAuth popup.');
      } else if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || msg.includes('popup')) {
        setErrorMsg('Sign-in popup was closed or blocked. You can explore as a guest immediately.');
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMsg('Google Sign-In is not enabled in the Firebase console.');
      } else if (code === 'auth/invalid-api-key') {
        setErrorMsg('Invalid Firebase API key. Check your firebase-applet-config.json.');
      } else {
        setErrorMsg(`Sign-In failed: ${msg || 'Unknown error'}. You can continue as a Guest.`);
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between pt-10 pb-28 px-4 sm:px-6 lg:px-8 bg-transparent text-slate-100 relative">
      <div className="max-w-5xl mx-auto w-full space-y-12">
        {/* Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto pt-4 pb-2">
          <div className="inline-flex items-center space-x-2 bg-[#242731] border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-300 shadow-md backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Mindful Journal &bull; Clarity & Insight</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-50 leading-tight">
            Your Private Sanctuary for Mindful Reflections
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
            Write your thoughts, speak in your native Indian language, attach photos, and receive rich psychological insights and gentle reflections powered by Gemini AI.
          </p>

          {/* Authentication Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="landing-google-signin-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-slate-100 hover:bg-white text-slate-950 font-bold px-6 py-3.5 rounded-2xl shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 text-sm"
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
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              id="landing-guest-signin-btn"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#242731] hover:bg-[#2d313d] text-slate-200 hover:text-white px-5 py-3.5 rounded-2xl border border-[#373b47] font-semibold text-sm transition"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Explore as Guest</span>
            </button>
          </div>

          {isUnauthorizedDomain ? (
            <div className="bg-[#242731] border border-amber-500/40 rounded-2xl p-4 text-xs max-w-xl mx-auto text-left space-y-3 shadow-xl">
              <div className="flex items-center space-x-2 text-amber-300 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Firebase Authorized Domain Notice</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                To sign in using Google OAuth popup in this environment, add this preview domain to your Firebase Console under <strong className="text-amber-200">Authentication &gt; Settings &gt; Authorized domains</strong>.
              </p>
              <div className="flex items-center justify-between bg-[#1c1e26] border border-[#373b47] rounded-xl px-3 py-2 font-mono text-[11px] text-amber-200">
                <span className="truncate mr-2">{currentHostname}</span>
                <button
                  type="button"
                  onClick={copyDomain}
                  className="flex items-center space-x-1 text-slate-300 hover:text-white px-2 py-1 rounded bg-[#242731] hover:bg-[#2d313d] transition"
                >
                  {copiedDomain ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Copy Domain</span>
                    </>
                  )}
                </button>
              </div>
              <div className="pt-2 border-t border-[#373b47] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <a
                  href={authorizedDomainsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-amber-400 hover:underline"
                >
                  <span>Open Firebase Settings</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  className="text-amber-300 hover:text-amber-100 font-semibold underline"
                >
                  Or continue in Guest Mode &rarr;
                </button>
              </div>
            </div>
          ) : errorMsg ? (
            <p className="text-xs text-amber-400 bg-[#242731] border border-amber-500/40 p-2.5 rounded-xl max-w-md mx-auto">
              {errorMsg}
            </p>
          ) : null}
        </div>

        {/* Emotion Spectrum Row */}
        <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#373b47]">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Emotional Intelligence</span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-100 mt-1">
                Reflect on What Truly Matters
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every feeling is a doorway to self-understanding and peace of mind.
              </p>
            </div>
          </div>

          {/* Emotion Badges */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {EMOTIONS_LIST.map((emo) => {
              const IconComponent = emo.icon;
              return (
                <div
                  key={emo.id}
                  className="flex flex-col items-center p-3 rounded-2xl border border-[#373b47] bg-[#1c1e26] text-center"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg mb-1.5 shadow-inner"
                    style={{
                      backgroundColor: emo.color + '25',
                      border: `1.5px solid ${emo.color}`
                    }}
                  >
                    <IconComponent className="w-4 h-4" style={{ color: emo.color }} />
                  </div>
                  <span className="text-xs font-bold text-slate-200 truncate w-full">
                    {emo.label}
                  </span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-tighter truncate w-full">
                    {emo.id}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6 Feature Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-8">
          {/* Feature 1 */}
          <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-6 hover:border-amber-400/50 transition">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-100 text-base mb-1.5">
              Mindful AI Reflections
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesize deep emotional growth insights, reflection questions, and practical micro-steps on demand.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-6 hover:border-amber-400/50 transition">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/25 flex items-center justify-center mb-3">
              <Languages className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-100 text-base mb-1.5">
              Indian Language Speech-to-Text
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Speak naturally in Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, or Hinglish.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-6 hover:border-amber-400/50 transition">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-100 text-base mb-1.5">
              Emotion Evolution Analytics
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track how your emotional state (Joy, Calm, Gratitude, Inspiration) evolves across weeks with radar charts and growth reports.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-6 hover:border-amber-400/50 transition">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/15 text-pink-400 border border-pink-500/25 flex items-center justify-center mb-3">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-100 text-base mb-1.5">
              Photo Memories & Albums
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Attach photographs to your journal entries. Enrich your thoughts with memorable visual moments.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-6 hover:border-amber-400/50 transition">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/25 flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-100 text-base mb-1.5">
              Location & Travel Tagging
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pin where memories happened. Tag cafes, travel destinations, hometowns, or current coordinates.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-6 hover:border-amber-400/50 transition">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-100 text-base mb-1.5">
              Private Cloud Storage
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your reflections and recordings are stored securely in Firestore and accessible only by you.
            </p>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-slate-400 border-t border-[#373b47] pt-6">
        Mindful Journal &bull; Powered by Gemini AI &amp; Firebase
      </div>
    </div>
  );
};
