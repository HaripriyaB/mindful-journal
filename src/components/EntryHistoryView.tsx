import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Plus, 
  Download, 
  SlidersHorizontal, 
  BookOpen, 
  Sparkles,
  MapPin,
  Image as ImageIcon,
  Mic
} from 'lucide-react';
import { JournalEntry } from '../types';
import { EntryCard } from './EntryCard';
import { MOOD_DEFINITIONS } from '../lib/indianLanguages';

interface EntryHistoryViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onNewEntry: () => void;
}

export const EntryHistoryView: React.FC<EntryHistoryViewProps> = ({
  entries,
  onSelectEntry,
  onDeleteEntry,
  onNewEntry
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [filterPhotosOnly, setFilterPhotosOnly] = useState(false);
  const [filterVoiceOnly, setFilterVoiceOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Filter & search logic
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (entry.title || '').toLowerCase().includes(q);
        const contentMatch = (entry.content || '').toLowerCase().includes(q);
        const tagMatch = entry.tags?.some(t => t.toLowerCase().includes(q));
        const locMatch = (entry.location?.name || '').toLowerCase().includes(q);
        if (!titleMatch && !contentMatch && !tagMatch && !locMatch) {
          return false;
        }
      }

      // Mood match
      if (selectedMood !== 'all' && entry.mood !== selectedMood) {
        return false;
      }

      // Photos filter
      if (filterPhotosOnly && (!entry.photos || entry.photos.length === 0)) {
        return false;
      }

      // Voice filter
      if (filterVoiceOnly && !entry.audioRecordingUrl && !entry.originalTranscript) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'newest') return b.createdAt - a.createdAt;
      return a.createdAt - b.createdAt;
    });
  }, [entries, searchQuery, selectedMood, filterPhotosOnly, filterVoiceOnly, sortOrder]);

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `journal_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100">
            Past Journal Reflections
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Browse, search, and revisit your memories, voice notes, and mindful reflections ({entries.length} total entries)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportJson}
            disabled={entries.length === 0}
            className="flex items-center space-x-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-stone-700 transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            id="history-new-entry-btn"
            onClick={onNewEntry}
            className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, tags, places..."
              className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2 text-xs text-stone-100 focus:outline-none placeholder:text-stone-600 transition"
            />
          </div>

          {/* Quick toggle filters */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterPhotosOnly(!filterPhotosOnly)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-medium border transition ${
                filterPhotosOnly
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>With Photos</span>
            </button>

            <button
              onClick={() => setFilterVoiceOnly(!filterVoiceOnly)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-medium border transition ${
                filterVoiceOnly
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>With Voice</span>
            </button>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-stone-950 border border-stone-800 text-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Mood Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
          <button
            onClick={() => setSelectedMood('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
              selectedMood === 'all'
                ? 'bg-amber-500 text-stone-950 font-semibold shadow'
                : 'bg-stone-950 text-stone-400 border border-stone-800 hover:text-stone-200'
            }`}
          >
            All Moods
          </button>
          {MOOD_DEFINITIONS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMood(m.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition shrink-0 flex items-center space-x-1 border ${
                selectedMood === m.id
                  ? `${m.color} font-semibold shadow-sm`
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              <span>{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Entries Grid */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onSelect={onSelectEntry}
              onDelete={onDeleteEntry}
            />
          ))}
        </div>
      ) : (
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-100">
              No matching journal reflections
            </h3>
            <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
              {entries.length === 0 
                ? "You haven't written any journal reflections yet. Begin your mindful journey today!"
                : "No entries match your search filters. Try clearing some filters."}
            </p>
          </div>
          <button
            onClick={onNewEntry}
            className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold px-5 py-2.5 rounded-xl text-xs transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Journal Entry</span>
          </button>
        </div>
      )}
    </div>
  );
};
