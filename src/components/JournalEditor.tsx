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
  Compass, 
  RefreshCw, 
  HelpCircle, 
  Languages, 
  Target, 
  Lightbulb, 
  BrainCircuit, 
  ChevronRight,
  Smile,
  Calendar,
  Wand2
} from 'lucide-react';
import { JournalEntry, MoodType, PhotoAttachment, LocationTag, ChatMessage, EmotionAnalysis } from '../types';
import { MOOD_DEFINITIONS } from '../lib/indianLanguages';
import { EMOTION_CHARACTERS, getCharacterForMood, CHARACTER_LIST } from '../lib/emotionCharacters';
import { analyzeEntryEmotions, generateDynamicPrompt, generateReflectionTags, generateJournalTitle } from '../lib/api';
import { extractTagsFromContent } from '../lib/tagExtractor';
import { deriveTitleFromContent } from '../lib/titleExtractor';
import { VoiceRecorderModal } from './VoiceRecorderModal';
import { PhotoAttachmentModal } from './PhotoAttachmentModal';
import { LocationPickerModal } from './LocationPickerModal';
import { GeminiReflectDrawer } from './GeminiReflectDrawer';

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
        // Quick local derivation first so user immediately sees a good title
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

        // Try AI title refinement in the background
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
    
    // If saving with an empty or placeholder title, generate one automatically
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

    // Automatically derive reflection tags from spoken content
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

  const handleUpdateChat = (chatMessages: ChatMessage[]) => {
    const updated = { ...currentEntry, chatMessages, updatedAt: Date.now() };
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
        currentEntry.chatMessages
      );
      const updated = {
        ...currentEntry,
        emotionAnalysis: analysis,
        updatedAt: Date.now()
      };
      setCurrentEntry(updated);
      handleManualSave(updated);
    } catch (err) {
      console.error('Emotion analysis error:', err);
    } finally {
      setIsAnalyzingEmotions(false);
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

  // Real-time suggested tags derived from writing content
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 space-y-6">
      {/* Editor & Reflection Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left / Main Column: The Journal Writer & Attachments (7 or 8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* Top Toolbar: Date, Auto-save status, Voice dictation, Photos, Location */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-800 text-xs">
              <div className="flex items-center space-x-2 text-stone-400">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="font-medium">
                  {new Date(currentEntry.createdAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span className="text-stone-600">&middot;</span>
                <span className="text-stone-500">
                  {isSaving ? 'Saving changes...' : lastSavedTime ? 'Saved' : 'Ready'}
                </span>
              </div>

              {/* Action Buttons: Multilingual Voice, Photos, Google Maps Location */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="editor-voice-btn"
                  onClick={() => setIsVoiceModalOpen(true)}
                  className="flex items-center space-x-1.5 bg-stone-800 hover:bg-stone-700/80 text-amber-300 px-3 py-1.5 rounded-xl border border-stone-700 font-semibold transition"
                  title="Speak in Hindi, Tamil, Telugu, etc."
                >
                  <Mic className="w-3.5 h-3.5 text-amber-400" />
                  <span>Indian Voice Input</span>
                </button>

                <button
                  type="button"
                  id="editor-photos-btn"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="flex items-center space-x-1.5 bg-stone-800 hover:bg-stone-700/80 text-purple-300 px-3 py-1.5 rounded-xl border border-stone-700 font-semibold transition"
                  title="Attach Google Photos / Images"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Photos {currentEntry.photos?.length > 0 && `(${currentEntry.photos.length})`}</span>
                </button>

                <button
                  type="button"
                  id="editor-location-btn"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="flex items-center space-x-1.5 bg-stone-800 hover:bg-stone-700/80 text-rose-300 px-3 py-1.5 rounded-xl border border-stone-700 font-semibold transition"
                  title="Tag Google Maps Location"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{currentEntry.location ? 'Location Set' : 'Location'}</span>
                </button>
              </div>
            </div>

            {/* Title Input with Editable Field & Quick AI Suggest */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  id="journal-entry-title-input"
                  value={currentEntry.title}
                  onChange={(e) => setCurrentEntry({ ...currentEntry, title: e.target.value })}
                  placeholder="Title of this reflection (auto-generated if left empty)..."
                  className="w-full bg-transparent font-serif font-bold text-2xl sm:text-3xl text-stone-100 placeholder:text-stone-600 focus:outline-none tracking-tight pr-8"
                />
              </div>

              <button
                type="button"
                id="suggest-title-btn"
                onClick={handleGenerateTitleManually}
                disabled={isGeneratingTitle || !currentEntry.content.trim()}
                className="shrink-0 flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-amber-300 border border-stone-700 text-xs font-semibold transition shadow-sm disabled:opacity-40"
                title="Auto-create or refresh reflection title"
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

            {/* Living Emotion Council & Guide Selector */}
            <div className="space-y-3 bg-stone-950/60 border border-stone-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                  <span>Inner Resonance Council & Emotion Guides</span>
                </label>
                <span className="text-[11px] text-stone-400">
                  Select your active emotion guide
                </span>
              </div>

              {/* Character Selector Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
                {CHARACTER_LIST.map((char) => {
                  const isSelected = currentEntry.mood === char.id;
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => setCurrentEntry({ ...currentEntry, mood: char.id as MoodType })}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium transition border text-center group relative ${
                        isSelected
                          ? 'bg-stone-900 border-amber-400/90 shadow-md transform -translate-y-0.5'
                          : 'bg-stone-950/40 text-stone-400 border-stone-800/60 hover:bg-stone-900/60 hover:text-stone-200'
                      }`}
                      style={{
                        boxShadow: isSelected ? `0 0 14px ${char.glowColor}` : 'none'
                      }}
                      title={`${char.name} (${char.characterTitle}) - ${char.whisper}`}
                    >
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-base mb-1 shadow-inner transition transform group-hover:scale-110"
                        style={{
                          backgroundColor: char.primaryColor + '26',
                          border: `1.5px solid ${char.primaryColor}`,
                          boxShadow: isSelected ? `0 0 8px ${char.glowColor}` : 'none'
                        }}
                      >
                        {char.characterEmoji}
                      </div>
                      <span className={`text-[11px] font-bold truncate w-full ${isSelected ? 'text-stone-100' : 'text-stone-400'}`}>
                        {char.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Emotion Character Companion Card */}
              {(() => {
                const activeChar = getCharacterForMood(currentEntry.mood);
                return (
                  <div 
                    className="mt-2.5 rounded-xl p-3 border transition-all duration-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    style={{
                      backgroundColor: activeChar.primaryColor + '12',
                      borderColor: activeChar.primaryColor + '40',
                      boxShadow: `0 0 20px ${activeChar.glowColor}`
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 shadow-lg"
                        style={{
                          backgroundColor: activeChar.primaryColor + '33',
                          border: `2px solid ${activeChar.primaryColor}`
                        }}
                      >
                        {activeChar.characterEmoji}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-stone-100">
                            {activeChar.name} &middot; <span className="font-normal text-stone-300">{activeChar.characterTitle}</span>
                          </h4>
                          <span 
                            className="px-2 py-0.2 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                            style={{
                              backgroundColor: activeChar.primaryColor + '33',
                              color: activeChar.accentColor
                            }}
                          >
                            {activeChar.personality}
                          </span>
                        </div>
                        <p className="text-xs text-stone-300 italic mt-0.5 font-serif">
                          {activeChar.quote}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right sm:border-l sm:border-stone-800 sm:pl-3 w-full sm:w-auto">
                      <span className="text-[10px] uppercase font-semibold text-stone-400 block">
                        Character Whisper
                      </span>
                      <span className="text-xs text-stone-200 font-medium block max-w-xs truncate sm:whitespace-normal">
                        {activeChar.whisper}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Inspiration Prompt Generator */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Daily Mindfulness Prompt
                </span>
                <button
                  type="button"
                  onClick={handleGetPrompt}
                  disabled={isLoadingPrompt}
                  className="text-[11px] text-stone-400 hover:text-stone-200 flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingPrompt ? 'animate-spin' : ''}`} />
                  <span>New Prompt</span>
                </button>
              </div>

              <p className="text-xs text-stone-300 italic font-serif">
                {dynamicPrompt || "What is one thought or feeling that has been quietly following you throughout today?"}
              </p>
            </div>

            {/* Location & Audio Memo Badges */}
            {(currentEntry.location || currentEntry.audioRecordingUrl || currentEntry.originalTranscript) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {currentEntry.location && (
                  <div className="flex items-center space-x-2 bg-rose-950/40 border border-rose-800/60 text-rose-300 px-3 py-1.5 rounded-xl text-xs">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="font-semibold">{currentEntry.location.name}</span>
                    {currentEntry.location.mapUrl && (
                      <a
                        href={currentEntry.location.mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] underline opacity-80 hover:opacity-100 ml-1"
                      >
                        Map
                      </a>
                    )}
                  </div>
                )}

                {currentEntry.audioRecordingUrl && (
                  <div className="flex items-center space-x-2 bg-amber-950/40 border border-amber-800/60 text-amber-300 px-3 py-1.5 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      className="p-1 rounded-lg bg-amber-500 text-stone-950"
                    >
                      {isPlayingAudio ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>
                    <span className="font-semibold">Voice Memo ({currentEntry.audioDuration || 0}s)</span>
                  </div>
                )}

                {currentEntry.originalTranscript && (
                  <div className="flex items-center space-x-1.5 bg-blue-950/40 border border-blue-800/60 text-blue-300 px-3 py-1.5 rounded-xl text-xs">
                    <Languages className="w-3.5 h-3.5" />
                    <span>Indian Speech Translated</span>
                  </div>
                )}
              </div>
            )}

            {/* Attached Photos Carousel */}
            {currentEntry.photos && currentEntry.photos.length > 0 && (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                  Attached Memories ({currentEntry.photos.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {currentEntry.photos.map((p) => (
                    <div key={p.id} className="relative rounded-2xl overflow-hidden border border-stone-800 group">
                      <img 
                        src={p.url} 
                        alt={p.caption || 'Memory'} 
                        referrerPolicy="no-referrer"
                        className="w-full h-32 object-cover group-hover:scale-105 transition duration-300"
                      />
                      {p.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-stone-950/80 p-2 text-[10px] text-stone-300 truncate">
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
                placeholder="Write your heart out... what happened today? What feelings are surfacing?"
                rows={12}
                className="w-full bg-stone-950/80 border border-stone-800 focus:border-amber-500 rounded-2xl p-5 text-sm sm:text-base text-stone-100 focus:outline-none leading-relaxed transition font-serif placeholder:font-sans placeholder:text-stone-600 resize-y"
              />
              <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
                <span>{wordCount} words &middot; {currentEntry.content.length} characters</span>
                <span>Cloud Synced</span>
              </div>
            </div>

            {/* Original Spoken Transcript display if translated from Indian language */}
            {currentEntry.originalTranscript && (
              <div className="bg-stone-950/50 border border-stone-800/80 rounded-2xl p-4 space-y-1 text-xs text-stone-400 font-sans">
                <span className="font-semibold text-stone-300 flex items-center">
                  <Languages className="w-3.5 h-3.5 mr-1 text-blue-400" />
                  Original Spoken Indian Language Transcript:
                </span>
                <p className="italic text-stone-400 whitespace-pre-wrap">
                  "{currentEntry.originalTranscript}"
                </p>
              </div>
            )}

            {/* Content-Aware Reflection Tags Generator & Manager */}
            <div className="space-y-3 pt-3 border-t border-stone-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-300 flex items-center">
                  <Tag className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  Reflection Tags
                </label>

                {/* Auto-Generate Tags from Writing button */}
                <button
                  type="button"
                  id="auto-generate-tags-btn"
                  onClick={handleAutoGenerateTags}
                  disabled={isGeneratingTags || (!currentEntry.content.trim() && !currentEntry.title.trim())}
                  className="flex items-center space-x-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-full font-medium transition disabled:opacity-40 shadow-sm"
                  title="Automatically extract contextual tags based on your journal content"
                >
                  <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${isGeneratingTags ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingTags ? 'Extracting Tags...' : 'Auto-Generate Tags from Writing'}</span>
                </button>
              </div>

              {/* Active Tags */}
              <div className="flex flex-wrap items-center gap-2">
                {currentEntry.tags?.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center space-x-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700/80 px-3 py-1 rounded-full text-xs font-medium shadow-sm transition"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-stone-400 hover:text-rose-300 ml-1 text-sm leading-none"
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
                  placeholder="+ Add custom tag (press Enter)"
                  className="bg-stone-950/80 border border-stone-800 focus:border-amber-500 rounded-full px-3.5 py-1.5 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none transition"
                />
              </div>

              {/* Suggested Tags from text content */}
              {suggestedTagsFromWriting.length > 0 && (
                <div className="flex items-center flex-wrap gap-1.5 bg-stone-950/40 p-2.5 rounded-2xl border border-stone-800/60 text-xs">
                  <span className="text-[11px] text-stone-400 flex items-center font-medium mr-1">
                    <Sparkles className="w-3 h-3 text-amber-400/80 mr-1" />
                    Suggested from your writing:
                  </span>
                  {suggestedTagsFromWriting.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleAddSuggestedTag(st)}
                      className="inline-flex items-center space-x-1 bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-amber-200 border border-dashed border-stone-600 hover:border-amber-400/60 px-2.5 py-0.5 rounded-full text-[11px] transition"
                      title={`Click to add #${st}`}
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

            {/* Emotion Analysis Results Card if analyzed */}
            {currentEntry.emotionAnalysis && (
              <div className="bg-stone-950 border border-amber-500/30 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h4 className="font-serif font-bold text-stone-100 text-base">
                      Emotional & Mindful Insights
                    </h4>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Primary: {currentEntry.emotionAnalysis.primaryEmotion}
                  </span>
                </div>

                {/* Growth Insight Quote */}
                <div className="bg-stone-900/80 p-4 rounded-2xl border border-stone-800 text-xs text-stone-200 leading-relaxed italic">
                  "{currentEntry.emotionAnalysis.growthInsight}"
                </div>

                {/* Reflection Prompts & Actionable Ideas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-stone-900/60 p-3.5 rounded-2xl border border-stone-800/80 space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center">
                      <HelpCircle className="w-3.5 h-3.5 mr-1" />
                      Reflection Prompts
                    </span>
                    <ul className="space-y-1.5 text-xs text-stone-300">
                      {currentEntry.emotionAnalysis.reflectionPrompts?.map((p, idx) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <span className="text-amber-400 font-bold">&bull;</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-stone-900/60 p-3.5 rounded-2xl border border-stone-800/80 space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400 flex items-center">
                      <Lightbulb className="w-3.5 h-3.5 mr-1" />
                      Brainstorming Ideas
                    </span>
                    <ul className="space-y-1.5 text-xs text-stone-300">
                      {currentEntry.emotionAnalysis.actionableIdeas?.map((idea, idx) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <span className="text-blue-400 font-bold">&bull;</span>
                          <span>{idea}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions: Save & Analyze Emotions */}
            <div className="pt-4 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                id="analyze-emotions-btn"
                onClick={handleAnalyzeEmotions}
                disabled={isAnalyzingEmotions || !currentEntry.content.trim()}
                className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-bold px-5 py-2.5 rounded-xl text-xs transition shadow disabled:opacity-40"
              >
                {isAnalyzingEmotions ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Measuring Emotional State...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{currentEntry.emotionAnalysis ? 'Re-Analyze Emotions' : 'Analyze Emotions & Get Ideas'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleManualSave()}
                disabled={isSaving}
                className="flex items-center space-x-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 px-5 py-2.5 rounded-xl text-xs font-semibold border border-stone-700 transition"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>{isSaving ? 'Saving...' : 'Save Entry'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: The Multi-turn Gemini Reflection Companion (4 or 5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 h-[650px] sticky top-24">
          <GeminiReflectDrawer
            entry={currentEntry}
            onUpdateChat={handleUpdateChat}
            onAnalyzeEmotionsRequest={handleAnalyzeEmotions}
          />
        </div>
      </div>

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
