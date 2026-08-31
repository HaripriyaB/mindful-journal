import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { JournalEntry, EmotionAnalysis, ChatMessage } from '../types';

const LOCAL_STORAGE_KEY_PREFIX = 'gemini_journal_entries_';

// Save entry to Firestore and backup locally
export async function saveEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId || !entry.id) {
    throw new Error('User ID and Entry ID are required to save entry');
  }

  const entryData = {
    ...entry,
    userId,
    updatedAt: Date.now()
  };

  try {
    const entryRef = doc(db, 'users', userId, 'entries', entry.id);
    await setDoc(entryRef, entryData, { merge: true });
  } catch (firestoreError) {
    console.warn('Firestore write warning, backing up locally:', firestoreError);
  }

  // Backup in local storage for fast instant load & resilience
  try {
    const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
    const existingStr = localStorage.getItem(localKey);
    let list: JournalEntry[] = existingStr ? JSON.parse(existingStr) : [];
    const index = list.findIndex(e => e.id === entry.id);
    if (index >= 0) {
      list[index] = entryData;
    } else {
      list.unshift(entryData);
    }
    localStorage.setItem(localKey, JSON.stringify(list));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// Fetch all entries for a user
export async function fetchEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];

  // Try Firestore first
  try {
    const entriesRef = collection(db, 'users', userId, 'entries');
    const q = query(entriesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const entries: JournalEntry[] = [];
      snapshot.forEach(docSnap => {
        entries.push(docSnap.data() as JournalEntry);
      });
      
      // Update local cache
      try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(entries));
      } catch (_) {}

      return entries;
    }
  } catch (firestoreError) {
    console.warn('Firestore fetch warning, attempting local cache fallback:', firestoreError);
  }

  // Fallback to local storage if Firestore had no entries or error
  try {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error('Local cache read error:', e);
  }

  return [];
}

// Realtime subscription to entries
export function subscribeToUserEntries(
  userId: string, 
  onUpdate: (entries: JournalEntry[]) => void
): Unsubscribe {
  if (!userId) {
    return () => {};
  }

  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const entries: JournalEntry[] = [];
    snapshot.forEach(docSnap => {
      entries.push(docSnap.data() as JournalEntry);
    });
    onUpdate(entries);
  }, (error) => {
    console.warn('Firestore subscription notice:', error);
    // fallback to local fetch
    fetchEntries(userId).then(onUpdate);
  });
}

// Delete entry
export async function deleteEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;

  try {
    const entryRef = doc(db, 'users', userId, 'entries', entryId);
    await deleteDoc(entryRef);
  } catch (e) {
    console.warn('Firestore delete notice:', e);
  }

  // Update local storage
  try {
    const localKey = `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
    const cached = localStorage.getItem(localKey);
    if (cached) {
      const list: JournalEntry[] = JSON.parse(cached);
      const filtered = list.filter(e => e.id !== entryId);
      localStorage.setItem(localKey, JSON.stringify(filtered));
    }
  } catch (_) {}
}

// Update chat in an entry
export async function appendChatMessage(
  userId: string, 
  entryId: string, 
  message: ChatMessage, 
  currentEntry: JournalEntry
): Promise<JournalEntry> {
  const updatedMessages = [...(currentEntry.chatMessages || []), message];
  const updatedEntry: JournalEntry = {
    ...currentEntry,
    chatMessages: updatedMessages,
    updatedAt: Date.now()
  };

  await saveEntry(userId, updatedEntry);
  return updatedEntry;
}

// Save emotion analysis
export async function saveEntryAnalysis(
  userId: string,
  entryId: string,
  analysis: EmotionAnalysis,
  currentEntry: JournalEntry
): Promise<JournalEntry> {
  const updatedEntry: JournalEntry = {
    ...currentEntry,
    emotionAnalysis: analysis,
    updatedAt: Date.now()
  };

  await saveEntry(userId, updatedEntry);
  return updatedEntry;
}
