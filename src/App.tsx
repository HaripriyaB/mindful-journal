import React, { useState, useEffect } from 'react';
import { UserProfile, JournalEntry } from './types';
import { subscribeToAuth, logout, loginWithGoogle, loginAsGuest } from './lib/authService';
import { 
  saveEntry, 
  deleteEntry, 
  subscribeToUserEntries, 
  fetchEntries 
} from './lib/journalService';
import { Header } from './components/Header';
import { LandingHero } from './components/LandingHero';
import { JournalEditor } from './components/JournalEditor';
import { EntryHistoryView } from './components/EntryHistoryView';
import { EmotionEvolutionView } from './components/EmotionEvolutionView';
import { EmotionWaveBackground } from './components/EmotionWaveBackground';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'write' | 'history' | 'evolution'>('write');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Initialize sample initial entry helper
  const createNewEntryObject = (userId: string): JournalEntry => ({
    id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: userId,
    title: '',
    content: '',
    mood: 'peaceful',
    tags: ['reflection'],
    photos: [],
    chatMessages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  // 1. Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth((authUser, loading) => {
      setUser(authUser);
      setLoadingAuth(loading);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to user isolated Firestore entries when user is logged in
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setSelectedEntry(null);
      return;
    }

    const unsubscribe = subscribeToUserEntries(user.uid, (userEntries) => {
      setEntries(userEntries);
      
      // If user has entries and none is selected, or current selection not found, default to latest
      if (userEntries.length > 0) {
        setSelectedEntry(prev => {
          if (!prev) return userEntries[0];
          const exists = userEntries.find(e => e.id === prev.id);
          return exists || userEntries[0];
        });
      } else {
        // Provide blank new entry
        const fresh = createNewEntryObject(user.uid);
        setSelectedEntry(fresh);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const handleNewEntry = () => {
    if (!user) return;
    const fresh = createNewEntryObject(user.uid);
    setSelectedEntry(fresh);
    setActiveTab('write');
  };

  const handleSaveEntry = async (entryToSave: JournalEntry) => {
    if (!user) return;
    await saveEntry(user.uid, entryToSave);
    setSelectedEntry(entryToSave);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    await deleteEntry(user.uid, entryId);
    if (selectedEntry?.id === entryId) {
      const remaining = entries.filter(e => e.id !== entryId);
      if (remaining.length > 0) {
        setSelectedEntry(remaining[0]);
      } else {
        const fresh = createNewEntryObject(user.uid);
        setSelectedEntry(fresh);
      }
    }
  };

  const handleSelectEntryFromHistory = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setActiveTab('write');
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-300 space-y-3">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="font-serif text-sm">Connecting to your secure journal sanctuary...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950 relative">
      {/* Animated Flow of Life Gradient Wave Background */}
      <EmotionWaveBackground currentMood={selectedEntry?.mood || 'peaceful'} />

      {/* Navigation Header */}
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewEntry={handleNewEntry}
        onLoginClick={loginWithGoogle}
        onLogoutClick={logout}
      />

      {/* Main Content Body */}
      <main className="flex-1 relative z-10">
        {!user ? (
          <LandingHero onAuthSuccess={() => setActiveTab('write')} />
        ) : (
          <>
            {activeTab === 'write' && (
              selectedEntry ? (
                <JournalEditor
                  key={selectedEntry.id}
                  entry={selectedEntry}
                  onSaveEntry={handleSaveEntry}
                  onDeleteEntry={handleDeleteEntry}
                />
              ) : (
                <div className="text-center py-20">
                  <button
                    onClick={handleNewEntry}
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950 px-6 py-3 rounded-2xl font-bold transition shadow"
                  >
                    Start Your First Reflection
                  </button>
                </div>
              )
            )}

            {activeTab === 'history' && (
              <EntryHistoryView
                entries={entries}
                onSelectEntry={handleSelectEntryFromHistory}
                onDeleteEntry={handleDeleteEntry}
                onNewEntry={handleNewEntry}
              />
            )}

            {activeTab === 'evolution' && (
              <EmotionEvolutionView
                entries={entries}
                onNewEntry={handleNewEntry}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
