import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Plus, 
  Tag, 
  Image as ImageIcon, 
  MapPin, 
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { JournalEntry, MoodType } from '../types';
import { EntryCard } from './EntryCard';
import { EMOTIONS_LIST, getEmotionMeta, EmotionBadge } from '../lib/emotionIcons';

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
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Collect all unique tags across entries
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => {
      e.tags?.forEach(t => set.add(t));
    });
    return Array.from(set);
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        // Mood filter
        if (selectedMoodFilter !== 'all' && entry.mood !== selectedMoodFilter) {
          return false;
        }

        // Tag filter
        if (selectedTagFilter !== 'all' && (!entry.tags || !entry.tags.includes(selectedTagFilter))) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = entry.title?.toLowerCase().includes(q);
          const matchesContent = entry.content?.toLowerCase().includes(q);
          const matchesLocation = entry.location?.name?.toLowerCase().includes(q);
          const matchesTags = entry.tags?.some(t => t.toLowerCase().includes(q));
          const matchesInsight = entry.emotionAnalysis?.growthInsight?.toLowerCase().includes(q);

          if (!matchesTitle && !matchesContent && !matchesLocation && !matchesTags && !matchesInsight) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return b.createdAt - a.createdAt;
        }
        return a.createdAt - b.createdAt;
      });
  }, [entries, searchQuery, selectedMoodFilter, selectedTagFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 space-y-8 animate-in fade-in duration-300">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#242731] border border-[#373b47] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>Memory Archive</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-100">
            Journal History & Reflections
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Browse, search, and revisit all your past journal reflections, voice memos, and emotional milestones.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="history-new-entry-btn"
            onClick={onNewEntry}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Reflection</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="history-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections by keywords, feelings, locations, insights..."
              className="w-full bg-[#1c1e26] border border-[#373b47] focus:border-amber-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none transition shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-[#1c1e26] border border-[#373b47] text-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Emotion Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold shrink-0 uppercase tracking-wider">
            Feeling:
          </span>
          <button
            onClick={() => setSelectedMoodFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition ${
              selectedMoodFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'bg-[#1c1e26] text-slate-400 hover:text-slate-200 border border-[#373b47]'
            }`}
          >
            All Feelings ({entries.length})
          </button>

          {EMOTIONS_LIST.map((emo) => {
            const isSelected = selectedMoodFilter === emo.id;
            const count = entries.filter(e => e.mood === emo.id).length;
            const IconComponent = emo.icon;
            if (count === 0 && !isSelected) return null;

            return (
              <button
                key={emo.id}
                onClick={() => setSelectedMoodFilter(isSelected ? 'all' : emo.id)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium shrink-0 transition border ${
                  isSelected
                    ? 'bg-[#282c37] border-amber-400 text-slate-100 shadow'
                    : 'bg-[#1c1e26] text-slate-400 hover:text-slate-200 border-[#373b47]'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" style={{ color: emo.color }} />
                <span>{emo.label}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Tag Filter Pills */}
        {allUniqueTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-[#373b47]/60">
            <span className="text-slate-400 text-[11px] font-semibold shrink-0 uppercase tracking-wider">
              Tag:
            </span>
            <button
              onClick={() => setSelectedTagFilter('all')}
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium shrink-0 transition ${
                selectedTagFilter === 'all'
                  ? 'bg-slate-300 text-slate-950 font-bold'
                  : 'bg-[#1c1e26] text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            {allUniqueTags.map(tag => {
              const isSelected = selectedTagFilter === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTagFilter(isSelected ? 'all' : tag)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium shrink-0 transition ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-[#1c1e26] text-slate-400 hover:text-slate-200 border border-[#373b47]'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Entries Grid */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        /* Empty State */
        <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-lg text-slate-200">
              No journal reflections found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedMoodFilter !== 'all' || selectedTagFilter !== 'all'
                ? 'Try resetting your search filters to see all recorded entries.'
                : 'Start your mindful journey today by creating your very first reflection.'}
            </p>
          </div>
          <button
            onClick={onNewEntry}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Write a Reflection</span>
          </button>
        </div>
      )}
    </div>
  );
};
