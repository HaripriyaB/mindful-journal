import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  X, 
  Sparkles, 
  Languages, 
  Check, 
  Play, 
  Pause, 
  Volume2, 
  RefreshCw, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { INDIAN_LANGUAGES } from '../lib/indianLanguages';
import { translateIndianSpeech, TranslateSpeechResult } from '../lib/api';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTranscript: (result: {
    translatedText: string;
    originalText?: string;
    suggestedTitle?: string;
    suggestedMood?: string;
    audioUrl?: string;
    audioDuration?: number;
  }) => void;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onApplyTranscript
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('hi-IN');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationResult, setTranslationResult] = useState<TranslateSpeechResult | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Audio recording state
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setLiveTranscript('');
      setTranslationResult(null);
      setErrorNotice(null);
      setAudioBlobUrl(null);
    }
  }, [isOpen]);

  // Start speech recognition and audio recording
  const startRecording = async () => {
    setErrorNotice(null);
    setTranslationResult(null);
    audioChunksRef.current = [];

    // 1. Setup MediaRecorder for voice memo
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (err) {
      console.warn('Microphone permission or MediaRecorder error:', err);
    }

    // 2. Setup Web Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedLanguage === 'auto' ? 'hi-IN' : selectedLanguage;

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript + ' ';
          }
          setLiveTranscript(current.trim());
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setErrorNotice('Microphone access was denied. You can type your native language text below.');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      } catch (e: any) {
        console.warn('Failed to start SpeechRecognition:', e);
        setIsListening(true); // fallback mode
      }
    } else {
      setIsListening(true);
      setErrorNotice('Speech recognition is not natively supported in this browser. You can type in your spoken Indian language transcript below to translate and format into journal prose.');
    }

    // Timer for duration
    let seconds = 0;
    setAudioDuration(0);
    timerRef.current = setInterval(() => {
      seconds++;
      setAudioDuration(seconds);
    }, 1000);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsListening(false);
  };

  const handleTranslate = async () => {
    if (!liveTranscript.trim()) {
      setErrorNotice('Please speak or type some text first.');
      return;
    }

    try {
      setIsTranslating(true);
      setErrorNotice(null);
      const selectedLangObj = INDIAN_LANGUAGES.find(l => l.code === selectedLanguage);
      const result = await translateIndianSpeech(
        liveTranscript,
        selectedLangObj?.name || 'Indian Language'
      );
      setTranslationResult(result);
    } catch (err: any) {
      console.error('Translation error:', err);
      setErrorNotice('Failed to translate: ' + (err.message || 'Server error'));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleApply = () => {
    if (translationResult) {
      onApplyTranscript({
        translatedText: translationResult.translatedJournalText,
        originalText: translationResult.originalText || liveTranscript,
        suggestedTitle: translationResult.suggestedTitle,
        suggestedMood: translationResult.suggestedMood,
        audioUrl: audioBlobUrl || undefined,
        audioDuration: audioDuration > 0 ? audioDuration : undefined
      });
      onClose();
    } else if (liveTranscript) {
      onApplyTranscript({
        translatedText: liveTranscript,
        originalText: liveTranscript,
        audioUrl: audioBlobUrl || undefined,
        audioDuration: audioDuration > 0 ? audioDuration : undefined
      });
      onClose();
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioBlobUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioBlobUrl);
      audioElementRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioElementRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioElementRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-semibold text-lg text-stone-100">
                Multilingual Voice Journaling
              </h2>
              <p className="text-xs text-stone-400">
                Speak in Hindi, Tamil, Telugu, Marathi, or any Indian language &middot; Translated into elegant English
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Language Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              Select Spoken Language
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INDIAN_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`p-2.5 rounded-xl text-left border transition text-xs flex flex-col justify-between ${
                    selectedLanguage === lang.code
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
                      : 'bg-stone-800/60 border-stone-700/60 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <span className="font-semibold text-stone-100">{lang.name}</span>
                  <span className="text-[11px] opacity-75">{lang.nativeName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recording Area */}
          <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-4">
            {/* Record Button & Pulse */}
            <div className="relative">
              {isListening && (
                <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
              )}
              <button
                type="button"
                id="toggle-voice-record-btn"
                onClick={isListening ? stopRecording : startRecording}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-500 text-white scale-105'
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            <div>
              <p className="font-medium text-sm text-stone-200">
                {isListening ? 'Listening... Speak freely in your chosen language' : 'Tap the microphone to start recording'}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                {isListening ? `Recording: ${audioDuration}s` : 'Or type your thoughts below if voice isn\'t handy'}
              </p>
            </div>

            {/* Audio Memo preview if recorded */}
            {audioBlobUrl && !isListening && (
              <div className="flex items-center space-x-3 bg-stone-900 border border-stone-700 px-4 py-2 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={toggleAudioPlayback}
                  className="p-1.5 rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 transition"
                >
                  {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <span className="text-stone-300 font-medium">Recorded Voice Memo ({audioDuration}s)</span>
                <Volume2 className="w-4 h-4 text-stone-400" />
              </div>
            )}
          </div>

          {/* Transcript input / Live Display */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Raw Transcript / Spoken Text
              </label>
              {liveTranscript && (
                <button
                  type="button"
                  onClick={() => setLiveTranscript('')}
                  className="text-xs text-stone-400 hover:text-stone-200"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              value={liveTranscript}
              onChange={(e) => setLiveTranscript(e.target.value)}
              placeholder="e.g. आज का दिन बहुत शांतिपूर्ण रहा, मैंने सुबह पार्क में वॉक की... or speak into microphone above..."
              rows={3}
              className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl p-3.5 text-sm text-stone-100 focus:outline-none transition resize-none placeholder:text-stone-600 font-sans"
            />
          </div>

          {/* Translate Button */}
          {liveTranscript && !translationResult && (
            <button
              type="button"
              id="translate-speech-btn"
              onClick={handleTranslate}
              disabled={isTranslating}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-semibold py-3 px-4 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isTranslating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Translating & Formatting Journal Prose...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Translate & Refine into Journal Prose</span>
                </>
              )}
            </button>
          )}

          {errorNotice && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Translation Result Preview */}
          {translationResult && (
            <div className="bg-stone-950 border border-amber-500/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                  Detected: {translationResult.detectedLanguage}
                </span>
                <span className="text-stone-400">
                  Mood: <strong className="text-stone-200 capitalize">{translationResult.suggestedMood}</strong>
                </span>
              </div>

              <div>
                <h4 className="font-serif font-semibold text-stone-100 text-sm mb-1">
                  {translationResult.suggestedTitle}
                </h4>
                <p className="text-xs text-stone-300 leading-relaxed font-sans whitespace-pre-wrap">
                  {translationResult.translatedJournalText}
                </p>
              </div>

              {translationResult.originalText && (
                <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-500 italic">
                  Original speech: "{translationResult.originalText}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-stone-900/80 border-t border-stone-800 flex items-center justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-400 hover:text-stone-200 text-sm font-medium transition"
          >
            Cancel
          </button>
          
          <button
            type="button"
            id="apply-voice-transcript-btn"
            onClick={handleApply}
            disabled={!liveTranscript.trim() && !translationResult}
            className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 px-5 py-2 rounded-xl font-semibold text-sm transition shadow disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            <span>Apply to Journal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
