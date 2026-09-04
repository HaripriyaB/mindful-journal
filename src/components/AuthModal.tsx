import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { loginWithGoogle, loginAsGuest } from '../lib/authService';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialError?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialError
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError || null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState<boolean>(
    initialError?.includes('unauthorized-domain') || false
  );
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseProjectId = firebaseConfig.projectId || 'silicon-park-505415-s7';
  const authorizedDomainsUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setIsUnauthorizedDomain(false);
      await loginWithGoogle();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Sign-in notice:', err?.message || err);
      const code = err.code || '';
      const msg = err.message || '';

      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setIsUnauthorizedDomain(true);
        setErrorMessage(
          `Domain "${currentHostname}" is not yet in Firebase's authorized domains list.`
        );
      } else if (code === 'auth/popup-blocked' || msg.includes('popup')) {
        setErrorMessage('Sign-in popup was blocked by your browser. Please allow popups or use Guest Mode.');
      } else if (code === 'auth/popup-closed-by-user') {
        setErrorMessage('The sign-in popup was closed before completing authentication.');
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMessage('Google Sign-in is not enabled in the Firebase Console.');
      } else {
        setErrorMessage(`Sign-in failed: ${msg || 'Unknown error'}. You can continue as a Guest.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await loginAsGuest();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Guest login error:', err);
      setErrorMessage('Could not initialize guest session: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const copyDomainToClipboard = () => {
    if (navigator.clipboard && currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#242731] border border-[#373b47] rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative text-slate-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#373b47]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-serif font-bold text-base">
              M
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-slate-100">
                Welcome to Mindful Sanctuary
              </h2>
              <p className="text-xs text-slate-400">Choose how you wish to enter your journal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-[#1c1e26] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unauthorized Domain Explainer Banner */}
        {isUnauthorizedDomain && (
          <div className="bg-[#1c1e26] border border-amber-500/40 rounded-2xl p-4 text-xs space-y-3">
            <div className="flex items-start space-x-2 text-amber-300 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>Firebase Authorized Domain Notice</span>
            </div>
            
            <p className="text-slate-300 leading-relaxed">
              Firebase Authentication requires preview domains to be authorized before Google OAuth popup sign-in can proceed.
            </p>

            <div className="space-y-1.5 pt-1">
              <span className="text-slate-400 text-[11px] font-medium block">
                Current App Domain:
              </span>
              <div className="flex items-center justify-between bg-[#242731] border border-[#373b47] rounded-xl px-2.5 py-1.5 font-mono text-[11px] text-amber-200">
                <span className="truncate mr-2">{currentHostname}</span>
                <button
                  type="button"
                  onClick={copyDomainToClipboard}
                  className="flex items-center space-x-1 text-slate-300 hover:text-white px-2 py-1 rounded-lg bg-[#1c1e26] hover:bg-[#2d313d] transition"
                >
                  {copiedDomain ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-[#373b47] flex items-center justify-between text-[11px]">
              <a
                href={authorizedDomainsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-amber-400 hover:underline"
              >
                <span>Add in Firebase Console</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
              <span className="text-slate-400">Auth &gt; Settings</span>
            </div>
          </div>
        )}

        {/* General Error Message */}
        {errorMessage && !isUnauthorizedDomain && (
          <div className="bg-[#1c1e26] border border-rose-500/40 rounded-2xl p-3 text-xs text-rose-300 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Buttons */}
        <div className="space-y-3 pt-1">
          {/* Google Sign In */}
          <button
            id="modal-google-signin-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 bg-slate-100 hover:bg-white text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          </button>

          {/* Guest Mode */}
          <button
            id="modal-guest-signin-btn"
            onClick={handleGuestLogin}
            disabled={loading}
            className={`w-full flex items-center justify-center space-x-2 text-sm px-4 py-3 rounded-2xl border font-semibold transition ${
              isUnauthorizedDomain
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 border-amber-400 font-bold shadow-lg'
                : 'bg-[#1c1e26] hover:bg-[#2d313d] text-slate-200 hover:text-white border-[#373b47]'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isUnauthorizedDomain ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>
              {isUnauthorizedDomain ? 'Continue in Guest Mode (Instant Access)' : 'Explore as Guest'}
            </span>
          </button>
        </div>

        {/* Privacy Note */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />
            <span>Guest mode automatically persists all reflections safely to your browser.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
