import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Image as ImageIcon, 
  Mic, 
  Sparkles, 
  Trash2, 
  ArrowRight,
  Languages
} from 'lucide-react';
import { JournalEntry } from '../types';
import { getEmotionMeta, EmotionBadge } from '../lib/emotionIcons';

interface EntryCardProps {
  entry: JournalEntry;
  onSelect: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  onSelect,
  onDelete
}) => {
  const dateFormatted = new Date(entry.createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const timeFormatted = new Date(entry.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const emoMeta = getEmotionMeta(entry.mood);
  const IconComponent = emoMeta.icon;

  return (
    <div 
      className="bg-[#242731] border border-[#373b47] hover:border-amber-400/50 rounded-3xl p-5 transition-all duration-300 flex flex-col justify-between group shadow-sm hover:shadow-md backdrop-blur-sm relative overflow-hidden"
      style={{
        boxShadow: `0 0 1px ${emoMeta.glowColor}`
      }}
    >
      {/* Subtle emotion accent top border */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 opacity-90"
        style={{ backgroundColor: emoMeta.color }}
      />

      <div className="space-y-3">
        {/* Top bar: Date, Emotion pill, Delete */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{dateFormatted} &middot; {timeFormatted}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span 
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center space-x-1.5 shadow-sm"
              style={{
                backgroundColor: emoMeta.color + '20',
                borderColor: emoMeta.color + '50',
                color: '#f8fafc'
              }}
              title={`${emoMeta.label}: ${emoMeta.description}`}
            >
              <IconComponent className="w-3 h-3" style={{ color: emoMeta.color }} />
              <span>{emoMeta.label}</span>
            </span>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this journal entry?')) {
                  onDelete(entry.id);
                }
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#1c1e26] transition opacity-0 group-hover:opacity-100"
              title="Delete Entry"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 
          onClick={() => onSelect(entry)}
          className="font-serif font-bold text-lg text-slate-100 group-hover:text-amber-300 transition cursor-pointer line-clamp-1"
        >
          {entry.title || 'Untitled Reflection'}
        </h3>

        {/* Content excerpt */}
        <p 
          onClick={() => onSelect(entry)}
          className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-sans cursor-pointer"
        >
          {entry.content || 'No text recorded.'}
        </p>

        {/* Photos Thumbnail Preview */}
        {entry.photos && entry.photos.length > 0 && (
          <div className="flex space-x-2 overflow-x-auto py-1">
            {entry.photos.slice(0, 3).map((photo) => (
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.caption || 'Memory'}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover border border-[#373b47] shrink-0"
              />
            ))}
            {entry.photos.length > 3 && (
              <div className="w-12 h-12 rounded-xl bg-[#1c1e26] flex items-center justify-center text-[10px] text-slate-400 font-semibold shrink-0 border border-[#373b47]">
                +{entry.photos.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Emotion Analysis Growth Insight if available */}
        {entry.emotionAnalysis?.growthInsight && (
          <div className="bg-[#1c1e26] border border-amber-500/25 rounded-2xl p-2.5 text-[11px] text-slate-300 flex items-start space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="line-clamp-2 leading-tight">
              {entry.emotionAnalysis.growthInsight}
            </p>
          </div>
        )}
      </div>

      {/* Metadata Badges & Footer */}
      <div className="pt-4 mt-3 border-t border-[#373b47]/70 flex items-center justify-between text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-1.5">
          {entry.location && (
            <span className="flex items-center text-[11px] text-rose-300 bg-rose-950/30 px-2 py-0.5 rounded-md border border-rose-700/40">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="max-w-[100px] truncate">{entry.location.name}</span>
            </span>
          )}

          {entry.audioRecordingUrl && (
            <span className="flex items-center text-[11px] text-amber-300 bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-700/40">
              <Mic className="w-3 h-3 mr-1" />
              Voice
            </span>
          )}

          {entry.originalTranscript && (
            <span className="flex items-center text-[11px] text-blue-300 bg-blue-950/30 px-2 py-0.5 rounded-md border border-blue-700/40">
              <Languages className="w-3 h-3 mr-1" />
              Translated
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelect(entry)}
          className="text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1 transition text-xs shrink-0 ml-2"
        >
          <span>Open</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
