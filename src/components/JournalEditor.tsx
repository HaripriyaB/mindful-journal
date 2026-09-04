import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Mic, 
  Image as ImageIcon, 
  MapPin, 
  Sparkles, 
  Tag, 
  Plus, 
  Trash2, 
  Check, 
  Play, 
  Pause, 
  Volume2, 
  RefreshCw, 
  HelpCircle, 
  Languages, 
  Calendar,
  Send,
  ArrowRight
} from 'lucide-react';
import { JournalEntry, MoodType, PhotoAttachment, LocationTag } from '../types';
import { EMOTIONS_LIST, getEmotionMeta, EmotionBadge } from '../lib/emotionIcons';
import { analyzeEntryEmotions, generateDynamicPrompt, generateReflectionTags, generateJournalTitle } from '../lib/api';
import { extractTagsFromContent } from '../lib/tagExtractor';
import { deriveTitleFromContent } from '../lib/titleExtractor';
import { VoiceRecorderModal } from './VoiceRecorderModal';
import { PhotoAttachmentModal } from './PhotoAttachmentModal';
import { LocationPickerModal } from './LocationPickerModal';
import { ResultReflectionCard } from './ResultReflectionCard';

interface JournalEditorProps {
  entry: JournalEntry;
  onSaveEntry: (entry: JournalEntry) => Promise<void>;
  onDeleteEntry?: (entryId: string) => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  entry,
  onSaveEntry,
  onDeleteEntry
}) => {
  const [currentEntry, setCurrentEntry] = useState<JournalEntry>(entry);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  
  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAnalyzingEmotions, setIsAnalyzingEmotions] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [dynamicPrompt, setDynamicPrompt] = useState<string | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);

  // Audio player state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Sync state when incoming entry prop changes
  useEffect(() => {
    setCurrentEntry(entry);
  }, [entry.id]);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentEntry.content !== entry.content || currentEntry.title !== entry.title) {
        handleManualSave(currentEntry);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentEntry.content, currentEntry.title, currentEntry.mood]);

  // Auto-generate title when title is empty and content has been written
  useEffect(() => {
    const isTitleEmptyOrPlaceholder = 
      !currentEntry.title || 
      !currentEntry.title.trim() || 
      currentEntry.title === 'New Reflection' || 
      currentEntry.title === 'Untitled Entry';

    if (isTitleEmptyOrPlaceholder && currentEntry.content && currentEntry.content.trim().length >= 15) {
      const timer = setTimeout(async () => {
        const quickFallback = deriveTitleFromContent(
          currentEntry.content, 
          currentEntry.mood, 
          currentEntry.location?.name, 
          currentEntry.createdAt
        );

        if (quickFallback && (!currentEntry.title || !currentEntry.title.trim() || currentEntry.title === 'New Reflection' || currentEntry.title === 'Untitled Entry')) {
          const autoUpdated = { ...currentEntry, title: quickFallback, updatedAt: Date.now() };
          setCurrentEntry(autoUpdated);
          handleManualSave(autoUpdated);
        }

        try {
          const aiTitle = await generateJournalTitle(
            currentEntry.content,
            currentEntry.mood,
            currentEntry.location,
            currentEntry.createdAt
          );
          if (aiTitle && aiTitle !== quickFallback) {
            setCurrentEntry(prev => {
              if (!prev.title || prev.title === quickFallback || prev.title === 'New Reflection' || prev.title === 'Untitled Entry') {
                const refined = { ...prev, title: aiTitle, updatedAt: Date.now() };
                handleManualSave(refined);
                return refined;
              }
              return prev;
            });
          }
        } catch (e) {
          // Keep quickFallback
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentEntry.content, currentEntry.mood, currentEntry.location?.name]);

  const handleManualSave = async (entryToSave?: JournalEntry) => {
    let toSave = entryToSave || currentEntry;
    
    if ((!toSave.title || !toSave.title.trim() || toSave.title === 'New Reflection') && toSave.content.trim()) {
      const autoTitle = deriveTitleFromContent(toSave.content, toSave.mood, toSave.location?.name, toSave.createdAt);
      toSave = { ...toSave, title: autoTitle };
      setCurrentEntry(toSave);
    }

    try {
      setIsSaving(true);
      await onSaveEntry(toSave);
      setLastSavedTime(Date.now());
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateTitleManually = async () => {
    if (!currentEntry.content.trim()) return;
    try {
      setIsGeneratingTitle(true);
      const generated = await generateJournalTitle(
        currentEntry.content,
        currentEntry.mood,
        currentEntry.location,
        currentEntry.createdAt
      );
      if (generated) {
        const updated = { ...currentEntry, title: generated, updatedAt: Date.now() };
        setCurrentEntry(updated);
        handleManualSave(updated);
      }
    } catch (err) {
      console.error('Failed to generate title:', err);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const handleApplyVoiceResult = async (result: {
    translatedText: string;
    originalText?: string;
    suggestedTitle?: string;
    suggestedMood?: string;
    audioUrl?: string;
    audioDuration?: number;
  }) => {
    const newContent = currentEntry.content 
      ? `${currentEntry.content}\n\n${result.translatedText}` 
      : result.translatedText;

    const newTitle = (!currentEntry.title || currentEntry.title === 'New Reflection') && result.suggestedTitle 
      ? result.suggestedTitle 
      : currentEntry.title;

    const newMood = (result.suggestedMood as MoodType) || currentEntry.mood;
    const autoExtracted = extractTagsFromContent(newContent, newTitle, newMood, currentEntry.location?.name);
    const mergedTags = Array.from(new Set([...currentEntry.tags, ...autoExtracted])).slice(0, 6);

    const updated: JournalEntry = {
      ...currentEntry,
      content: newContent,
      originalTranscript: result.originalText || currentEntry.originalTranscript,
      title: newTitle,
      mood: newMood,
      tags: mergedTags,
      audioRecordingUrl: result.audioUrl || currentEntry.audioRecordingUrl,
      audioDuration: result.audioDuration || currentEntry.audioDuration,
      updatedAt: Date.now()
    };
    setCurrentEntry(updated);
    handleManualSave(updated);
  };

  const handleAutoGenerateTags = async () => {
    if (!currentEntry.content.trim() && !currentEntry.title.trim()) return;
    try {
      setIsGeneratingTags(true);
      const generated = await generateReflectionTags({
        title: currentEntry.title,
        content: currentEntry.content,
        mood: currentEntry.mood,
        location: currentEntry.location
      });

      const updatedTags = Array.from(new Set([...currentEntry.tags, ...generated])).slice(0, 8);
      const updated = { ...currentEntry, tags: updatedTags, updatedAt: Date.now() };
      setCurrentEntry(updated);
      handleManualSave(updated);
    } catch (err) {
      console.error('Failed to auto-generate tags:', err);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleUpdatePhotos = (photos: PhotoAttachment[]) => {
    const updated = { ...currentEntry, photos, updatedAt: Date.now() };
    setCurrentEntry(updated);
    handleManualSave(updated);
  };

  const handleSaveLocation = (location: LocationTag | undefined) => {
    const updated = { ...currentEntry, location, updatedAt: Date.now() };
    setCurrentEntry(updated);
    handleManualSave(updated);
  };

  const handleAnalyzeEmotions = async () => {
    if (!currentEntry.content.trim()) return;
    try {
      setIsAnalyzingEmotions(true);
      const analysis = await analyzeEntryEmotions(
        currentEntry.title,
        currentEntry.content,
        currentEntry.mood,
        []
      );
      const updated = {
        ...currentEntry,
        emotionAnalysis: analysis,
        updatedAt: Date.now()
      };
      setCurrentEntry(updated);
      await onSaveEntry(updated);
      setLastSavedTime(Date.now());
    } catch (err) {
      console.error('Emotion analysis error:', err);
    } finally {
      setIsAnalyzingEmotions(false);
    }
  };

  const handleSubmitAndReflect = async () => {
    if (!currentEntry.content.trim()) return;
    try {
      setIsAnalyzingEmotions(true);
      setIsSaving(true);
      
      let titleToUse = currentEntry.title;
      if (!titleToUse || !titleToUse.trim() || titleToUse === 'New Reflection') {
        titleToUse = deriveTitleFromContent(currentEntry.content, currentEntry.mood, currentEntry.location?.name, currentEntry.createdAt);
      }

      const analysis = await analyzeEntryEmotions(
        titleToUse,
        currentEntry.content,
        currentEntry.mood,
        []
      );

      const updated: JournalEntry = {
        ...currentEntry,
        title: titleToUse,
        emotionAnalysis: analysis,
        updatedAt: Date.now()
      };

      setCurrentEntry(updated);
      await onSaveEntry(updated);
      setLastSavedTime(Date.now());
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsAnalyzingEmotions(false);
      setIsSaving(false);
    }
  };

  const handleGetPrompt = async () => {
    try {
      setIsLoadingPrompt(true);
      const prompt = await generateDynamicPrompt('reflection', currentEntry.mood);
      setDynamicPrompt(prompt);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/^#/, '');
      if (!currentEntry.tags.includes(cleanTag)) {
        const updatedTags = [...currentEntry.tags, cleanTag];
        const updated = { ...currentEntry, tags: updatedTags };
        setCurrentEntry(updated);
        handleManualSave(updated);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = currentEntry.tags.filter(t => t !== tagToRemove);
    const updated = { ...currentEntry, tags: updatedTags };
    setCurrentEntry(updated);
    handleManualSave(updated);
  };

  const togglePlayAudio = () => {
    if (!currentEntry.audioRecordingUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(currentEntry.audioRecordingUrl);
      audioRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const wordCount = currentEntry.content.trim() ? currentEntry.content.trim().split(/\s+/).length : 0;

  const suggestedTagsFromWriting = React.useMemo(() => {
    if (!currentEntry.content.trim() && !currentEntry.title.trim()) return [];
    const extracted = extractTagsFromContent(
      currentEntry.content, 
      currentEntry.title, 
      currentEntry.mood, 
      currentEntry.location?.name
    );
    return extracted.filter(t => !currentEntry.tags.includes(t));
  }, [currentEntry.content, currentEntry.title, currentEntry.mood, currentEntry.location?.name, currentEntry.tags]);

  const handleAddSuggestedTag = (tagToAdd: string) => {
    if (!currentEntry.tags.includes(tagToAdd)) {
      const updated = { ...currentEntry, tags: [...currentEntry.tags, tagToAdd], updatedAt: Date.now() };
      setCurrentEntry(updated);
      handleManualSave(updated);
    }
  };

  const handleAddAllSuggestedTags = () => {
    const updatedTags = Array.from(new Set([...currentEntry.tags, ...suggestedTagsFromWriting])).slice(0, 8);
    const updated = { ...currentEntry, tags: updatedTags, updatedAt: Date.now() };
    setCurrentEntry(updated);
    handleManualSave(updated);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 space-y-8 animate-in fade-in duration-300">
      
      {/* Journal Entry Editor Card */}
      <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
        
        {/* Top Toolbar: Date, Auto-save status, Voice dictation, Photos, Location */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#373b47] text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-slate-300">
              {new Date(currentEntry.createdAt).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            <span className="text-slate-600">&middot;</span>
            <span className="text-slate-400">
              {isSaving ? 'Saving changes...' : lastSavedTime ? 'Saved' : 'Ready'}
            </span>
          </div>

          {/* Action Buttons: Multilingual Voice, Photos, Google Maps Location */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="editor-voice-btn"
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center space-x-1.5 bg-[#1c1e26] hover:bg-[#2d313d] text-amber-300 px-3 py-1.5 rounded-xl border border-[#373b47] font-semibold transition"
              title="Speak in Hindi, Tamil, Telugu, Marathi, etc."
            >
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span>Voice Input</span>
            </button>

            <button
              type="button"
              id="editor-photos-btn"
              onClick={() => setIsPhotoModalOpen(true)}
              className="flex items-center space-x-1.5 bg-[#1c1e26] hover:bg-[#2d313d] text-pink-300 px-3 py-1.5 rounded-xl border border-[#373b47] font-semibold transition"
              title="Attach Images / Photos"
            >
              <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
              <span>Photos {currentEntry.photos?.length > 0 && `(${currentEntry.photos.length})`}</span>
            </button>

            <button
              type="button"
              id="editor-location-btn"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center space-x-1.5 bg-[#1c1e26] hover:bg-[#2d313d] text-rose-300 px-3 py-1.5 rounded-xl border border-[#373b47] font-semibold transition"
              title="Tag Location"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>{currentEntry.location ? currentEntry.location.name : 'Location'}</span>
            </button>
          </div>
        </div>

        {/* Title Input with Quick AI Suggest */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              id="journal-entry-title-input"
              value={currentEntry.title}
              onChange={(e) => setCurrentEntry({ ...currentEntry, title: e.target.value })}
              placeholder="Title of this reflection..."
              className="w-full bg-transparent font-serif font-bold text-2xl sm:text-3xl text-slate-100 placeholder:text-slate-500 focus:outline-none tracking-tight pr-8"
            />
          </div>

          <button
            type="button"
            id="suggest-title-btn"
            onClick={handleGenerateTitleManually}
            disabled={isGeneratingTitle || !currentEntry.content.trim()}
            className="shrink-0 flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#1c1e26] hover:bg-[#2d313d] text-amber-300 border border-[#373b47] text-xs font-semibold transition shadow-sm disabled:opacity-40"
            title="Auto-create reflection title"
          >
            {isGeneratingTitle ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span className="hidden sm:inline">Generating Title...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto Title</span>
              </>
            )}
          </button>
        </div>

        {/* Clean Emotion Selector with Lucide Icons */}
        <div className="space-y-2.5 bg-[#1c1e26] border border-[#373b47] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <span>Current Feeling & Mood</span>
            </label>
            <span className="text-[11px] text-slate-400">
              Select what resonates with you right now
            </span>
          </div>

          {/* Emotion Pills Row */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
            {EMOTIONS_LIST.map((emo) => {
              const isSelected = currentEntry.mood === emo.id;
              const IconComponent = emo.icon;
              return (
                <button
                  key={emo.id}
                  type="button"
                  onClick={() => {
                    const updated = { ...currentEntry, mood: emo.id as MoodType, updatedAt: Date.now() };
                    setCurrentEntry(updated);
                    handleManualSave(updated);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium transition border text-center group ${
                    isSelected
                      ? 'bg-[#282c37] border-amber-400 shadow-md text-slate-100 transform -translate-y-0.5'
                      : 'bg-[#181a20]/60 text-slate-400 border-[#373b47]/60 hover:bg-[#242731] hover:text-slate-200'
                  }`}
                  style={{
                    boxShadow: isSelected ? `0 0 14px ${emo.glowColor}` : 'none'
                  }}
                  title={`${emo.label} - ${emo.description}`}
                >
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center mb-1 transition transform group-hover:scale-110"
                    style={{
                      backgroundColor: emo.color + '22',
                      border: `1.5px solid ${emo.color}`
                    }}
                  >
                    <IconComponent className="w-3.5 h-3.5" style={{ color: emo.color }} />
                  </div>
                  <span className={`text-[11px] font-semibold truncate w-full ${isSelected ? 'text-slate-100' : 'text-slate-400'}`}>
                    {emo.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Mindfulness Prompt */}
        <div className="bg-[#1c1e26] border border-[#373b47] rounded-2xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Daily Mindfulness Prompt
            </span>
            <button
              type="button"
              onClick={handleGetPrompt}
              disabled={isLoadingPrompt}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingPrompt ? 'animate-spin' : ''}`} />
              <span>New Prompt</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 italic font-serif">
            {dynamicPrompt || "What is one thought or feeling that has been quietly following you throughout today?"}
          </p>
        </div>

        {/* Location & Audio Memo Badges */}
        {(currentEntry.location || currentEntry.audioRecordingUrl || currentEntry.originalTranscript) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {currentEntry.location && (
              <div className="flex items-center space-x-2 bg-rose-950/30 border border-rose-700/50 text-rose-300 px-3 py-1.5 rounded-xl text-xs">
                <MapPin className="w-3.5 h-3.5" />
                <span className="font-semibold">{currentEntry.location.name}</span>
                {currentEntry.location.mapUrl && (
                  <a
                    href={currentEntry.location.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] underline opacity-80 hover:opacity-100 ml-1"
                  >
                    View Map
                  </a>
                )}
              </div>
            )}

            {currentEntry.audioRecordingUrl && (
              <div className="flex items-center space-x-2 bg-amber-950/30 border border-amber-700/50 text-amber-300 px-3 py-1.5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="p-1 rounded-lg bg-amber-500 text-slate-950"
                >
                  {isPlayingAudio ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <span className="font-semibold">Voice Memo ({currentEntry.audioDuration || 0}s)</span>
              </div>
            )}

            {currentEntry.originalTranscript && (
              <div className="flex items-center space-x-1.5 bg-blue-950/30 border border-blue-700/50 text-blue-300 px-3 py-1.5 rounded-xl text-xs">
                <Languages className="w-3.5 h-3.5" />
                <span>Multilingual Transcript</span>
              </div>
            )}
          </div>
        )}

        {/* Attached Photos Carousel */}
        {currentEntry.photos && currentEntry.photos.length > 0 && (
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Attached Memories ({currentEntry.photos.length})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentEntry.photos.map((p) => (
                <div key={p.id} className="relative rounded-2xl overflow-hidden border border-[#373b47] group">
                  <img 
                    src={p.url} 
                    alt={p.caption || 'Memory'} 
                    referrerPolicy="no-referrer"
                    className="w-full h-28 object-cover group-hover:scale-105 transition duration-300"
                  />
                  {p.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 p-2 text-[10px] text-slate-300 truncate">
                      {p.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Journal Content Textarea */}
        <div className="space-y-2">
          <textarea
            value={currentEntry.content}
            onChange={(e) => setCurrentEntry({ ...currentEntry, content: e.target.value })}
            placeholder="Write freely here... What happened? How does your body feel? What thoughts are visiting you today?"
            rows={12}
            className="w-full bg-[#1c1e26] border border-[#373b47] focus:border-amber-500 rounded-2xl p-5 text-sm sm:text-base text-slate-100 focus:outline-none leading-relaxed transition font-serif placeholder:font-sans placeholder:text-slate-500 resize-y shadow-inner"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>{wordCount} words &middot; {currentEntry.content.length} characters</span>
            <span>Cloud Synced</span>
          </div>
        </div>

        {/* Original Spoken Transcript display if translated from Indian language */}
        {currentEntry.originalTranscript && (
          <div className="bg-[#1c1e26]/70 border border-[#373b47] rounded-2xl p-4 space-y-1 text-xs text-slate-400 font-sans">
            <span className="font-semibold text-slate-300 flex items-center">
              <Languages className="w-3.5 h-3.5 mr-1 text-blue-400" />
              Original Spoken Indian Language Transcript:
            </span>
            <p className="italic text-slate-300 whitespace-pre-wrap">
              "{currentEntry.originalTranscript}"
            </p>
          </div>
        )}

        {/* Tags Section */}
        <div className="space-y-3 pt-3 border-t border-[#373b47]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center">
              <Tag className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Reflection Tags
            </label>

            <button
              type="button"
              id="auto-generate-tags-btn"
              onClick={handleAutoGenerateTags}
              disabled={isGeneratingTags || (!currentEntry.content.trim() && !currentEntry.title.trim())}
              className="flex items-center space-x-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-full font-medium transition disabled:opacity-40 shadow-sm"
              title="Automatically extract tags from journal content"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isGeneratingTags ? 'animate-spin' : ''}`} />
              <span>{isGeneratingTags ? 'Extracting Tags...' : 'Auto-Generate Tags'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentEntry.tags?.map((t) => (
              <span
                key={t}
                className="inline-flex items-center space-x-1.5 bg-[#1c1e26] text-slate-200 border border-[#373b47] px-3 py-1 rounded-full text-xs font-medium shadow-sm transition"
              >
                <span>#{t}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="text-slate-400 hover:text-rose-400 ml-1 text-sm leading-none"
                  title="Remove tag"
                >
                  &times;
                </button>
              </span>
            ))}

            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="+ Add tag (press Enter)"
              className="bg-[#1c1e26] border border-[#373b47] focus:border-amber-500 rounded-full px-3.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none transition"
            />
          </div>

          {suggestedTagsFromWriting.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 bg-[#1c1e26]/60 p-2.5 rounded-2xl border border-[#373b47]/60 text-xs">
              <span className="text-[11px] text-slate-400 flex items-center font-medium mr-1">
                <Sparkles className="w-3 h-3 text-amber-400/80 mr-1" />
                Suggested:
              </span>
              {suggestedTagsFromWriting.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleAddSuggestedTag(st)}
                  className="inline-flex items-center space-x-1 bg-[#242731] hover:bg-[#2d313d] text-slate-300 hover:text-amber-200 border border-dashed border-[#373b47] px-2.5 py-0.5 rounded-full text-[11px] transition"
                >
                  <Plus className="w-2.5 h-2.5 text-amber-400" />
                  <span>#{st}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={handleAddAllSuggestedTags}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline ml-1"
              >
                + Add All
              </button>
            </div>
          )}
        </div>

        {/* Bottom Submission Action Bar */}
        <div className="pt-4 border-t border-[#373b47] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            id="submit-journal-reflection-btn"
            onClick={handleSubmitAndReflect}
            disabled={isAnalyzingEmotions || !currentEntry.content.trim()}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold px-6 py-3 rounded-2xl text-sm transition shadow-md disabled:opacity-40 active:scale-95"
          >
            {isAnalyzingEmotions ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Synthesizing Reflection...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Submit & Get AI Reflection</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </>
            )}
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleManualSave()}
              disabled={isSaving}
              className="flex items-center space-x-1.5 bg-[#1c1e26] hover:bg-[#2d313d] text-slate-200 px-4 py-2.5 rounded-2xl text-xs font-semibold border border-[#373b47] transition"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>

            {onDeleteEntry && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this entry?')) {
                    onDeleteEntry(currentEntry.id);
                  }
                }}
                className="p-2.5 rounded-2xl text-slate-400 hover:text-rose-400 hover:bg-[#1c1e26] border border-transparent hover:border-rose-900/40 transition"
                title="Delete reflection"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dedicated Result Reflection Section (Shown after submitting or analyzing) */}
      <ResultReflectionCard
        entry={currentEntry}
        onGenerateReflection={handleAnalyzeEmotions}
        isGenerating={isAnalyzingEmotions}
      />

      {/* Modals */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyTranscript={handleApplyVoiceResult}
      />

      <PhotoAttachmentModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        photos={currentEntry.photos || []}
        onUpdatePhotos={handleUpdatePhotos}
        locationName={currentEntry.location?.name}
      />

      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={currentEntry.location}
        onSaveLocation={handleSaveLocation}
      />
    </div>
  );
};
