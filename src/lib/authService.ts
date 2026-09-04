import { 
  signInWithPopup, 
  signInAnonymously,
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { auth, googleAuthProvider } from './firebase';
import { UserProfile } from '../types';

const LOCAL_GUEST_KEY = 'mindful_journal_local_guest_session';
type AuthCallback = (user: UserProfile | null, loading: boolean) => void;
const authListeners = new Set<AuthCallback>();

function getStoredLocalGuest(): UserProfile | null {
  try {
    const data = localStorage.getItem(LOCAL_GUEST_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (_) {}
  return null;
}

function setStoredLocalGuest(user: UserProfile | null) {
  try {
    if (user) {
      localStorage.setItem(LOCAL_GUEST_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_GUEST_KEY);
    }
  } catch (_) {}
}

function notifySubscribers(user: UserProfile | null, loading: boolean = false) {
  authListeners.forEach(cb => {
    try {
      cb(user, loading);
    } catch (e) {
      console.error('Auth subscriber callback error:', e);
    }
  });
}

export async function loginWithGoogle(): Promise<UserProfile> {
  // Clear any existing local guest session first
  setStoredLocalGuest(null);

  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;
    
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Journaler',
      photoURL: user.photoURL,
      isAnonymous: false,
      domainUnauthorized: false
    };
    notifySubscribers(profile, false);
    return profile;
  } catch (error: any) {
    console.warn('Google Sign-In warning/notice:', error?.message || error);
    // Propagate error to let UI display accurate feedback / domain settings
    throw error;
  }
}

export async function loginAsGuest(guestName: string = 'Mindful Guest'): Promise<UserProfile> {
  // Try Firebase anonymous authentication first
  try {
    const result = await signInAnonymously(auth);
    const user = result.user;
    await updateProfile(user, {
      displayName: guestName,
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    }).catch(() => {});
    
    setStoredLocalGuest(null);
    const profile: UserProfile = {
      uid: user.uid,
      email: null,
      displayName: guestName,
      photoURL: user.photoURL,
      isAnonymous: true
    };
    notifySubscribers(profile, false);
    return profile;
  } catch (error: any) {
    console.warn('Firebase Anonymous Auth unavailable, activating local guest sanctuary:', error?.message || error);
    
    // Create or retrieve persistent local guest
    let guest = getStoredLocalGuest();
    if (!guest || !guest.uid) {
      guest = {
        uid: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        email: null,
        displayName: guestName,
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isAnonymous: true
      };
    }
    setStoredLocalGuest(guest);
    notifySubscribers(guest, false);
    return guest;
  }
}

export async function logout(): Promise<void> {
  setStoredLocalGuest(null);
  try {
    await signOut(auth);
  } catch (_) {}
  notifySubscribers(null, false);
}

export function subscribeToAuth(callback: AuthCallback) {
  authListeners.add(callback);

  const unsubscribeFirebase = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const profile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Journaler',
        photoURL: firebaseUser.photoURL,
        isAnonymous: firebaseUser.isAnonymous
      };
      callback(profile, false);
    } else {
      const localGuest = getStoredLocalGuest();
      if (localGuest) {
        callback(localGuest, false);
      } else {
        callback(null, false);
      }
    }
  }, () => {
    const localGuest = getStoredLocalGuest();
    callback(localGuest, false);
  });

  return () => {
    authListeners.delete(callback);
    unsubscribeFirebase();
  };
}

