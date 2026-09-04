import React, { useState } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  Lightbulb, 
  RefreshCw, 
  Copy, 
  Check, 
  Compass, 
  Smile, 
  Feather, 
  Heart, 
  Flame, 
  Wind, 
  Activity, 
  CloudRain, 
  ZapOff,
  TrendingUp,
  BrainCircuit,
  MessageSquare
} from 'lucide-react';
import { EmotionAnalysis, JournalEntry, MoodType } from '../types';
import { getEmotionMeta, EmotionBadge } from '../lib/emotionIcons';
import { getEntryEmotionBreakdown, getEntrySentimentScore } from '../lib/emotionAnalytics';

interface ResultReflectionCardProps {
  entry: JournalEntry;
  onGenerateReflection: () => Promise<void>;
  isGenerating: boolean;
}

export const ResultReflectionCard: React.FC<ResultReflectionCardProps> = ({
  entry,
  onGenerateReflection,
  isGenerating
}) => {
  const [copied, setCopied] = useState(false);
  const analysis = entry.emotionAnalysis;
  const moodMeta = getEmotionMeta(entry.mood);
  const breakdown = getEntryEmotionBreakdown(entry);
  const sentiment = getEntrySentimentScore(entry);

  const handleCopy = () => {
    if (!analysis) return;
    const textToCopy = `Mindful Reflection: "${entry.title || 'Untitled'}"\n\n` +
      `Primary Emotion: ${analysis.primaryEmotion}\n` +
      `Growth Insight: ${analysis.growthInsight}\n\n` +
      `Reflection Prompts:\n${analysis.reflectionPrompts?.map(p => `• ${p}`).join('\n')}\n\n` +
      `Actionable Ideas:\n${analysis.actionableIdeas?.map(i => `• ${i}`).join('\n')}`;
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const emotionDimensions = [
    { key: 'joy', label: 'Joy & Warmth', val: breakdown.joy, icon: Smile, color: '#f59e0b', barColor: 'bg-amber-400' },
    { key: 'calm', label: 'Calm & Serenity', val: breakdown.calm, icon: Feather, color: '#10b981', barColor: 'bg-emerald-400' },
    { key: 'gratitude', label: 'Heartfelt Gratitude', val: breakdown.gratitude, icon: Heart, color: '#ec4899', barColor: 'bg-pink-400' },
    { key: 'inspiration', label: 'Inspiration & Vision', val: breakdown.inspiration, icon: Compass, color: '#818cf8', barColor: 'bg-indigo-400' },
    { key: 'energy', label: 'Momentum & Drive', val: breakdown.energy, icon: Flame, color: '#f97316', barColor: 'bg-orange-400' },
    { key: 'stress', label: 'Mental Tension', val: breakdown.stress, icon: Activity, color: '#a855f7', barColor: 'bg-purple-400' },
    { key: 'sadness', label: 'Tender Vulnerability', val: breakdown.sadness, icon: CloudRain, color: '#38bdf8', barColor: 'bg-sky-400' },
  ];

  return (
    <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-6 sm:p-7 shadow-lg space-y-6 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#373b47]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25 shadow-inner">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-serif font-bold text-lg text-slate-100">
                Mindful AI Reflection
              </h3>
              {analysis && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Ready
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Insight synthesized directly from your written thoughts
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {analysis && (
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center space-x-1.5 bg-[#1c1e26] hover:bg-[#2d313d] text-slate-300 px-3 py-1.5 rounded-xl border border-[#373b47] text-xs font-medium transition"
              title="Copy reflection summary"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            id="result-reflection-refresh-btn"
            onClick={onGenerateReflection}
            disabled={isGenerating || !entry.content.trim()}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition shadow disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing...' : analysis ? 'Refresh Reflection' : 'Generate Reflection'}</span>
          </button>
        </div>
      </div>

      {/* Loading state banner */}
      {isGenerating && (
        <div className="bg-[#1c1e26] border border-amber-500/30 rounded-2xl p-6 text-center space-y-3 animate-pulse">
          <BrainCircuit className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-slate-200 text-sm">
              Listening to your reflection...
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Connecting your thoughts to emotional nuance, finding gentle insights, and drafting mindful suggestions.
            </p>
          </div>
        </div>
      )}

      {/* When analysis is present */}
      {!isGenerating && analysis && (
        <div className="space-y-6">
          {/* Core Growth Insight Quote Banner */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Core Emotional Insight
              </span>
              <EmotionBadge mood={analysis.primaryEmotion || entry.mood} size="sm" />
            </div>

            <p className="font-serif text-sm sm:text-base text-slate-100 italic leading-relaxed pt-1">
              "{analysis.growthInsight}"
            </p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-amber-500/20">
              <span>Sentiment Tone: <strong className="text-amber-300">{sentiment >= 0 ? `+${sentiment}` : sentiment}</strong></span>
              <span>Primary Resonance: <strong className="text-slate-200 capitalize">{analysis.primaryEmotion || entry.mood}</strong></span>
            </div>
          </div>

          {/* 2-Column: Reflection Prompts & Actionable Ideas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prompts */}
            <div className="bg-[#1c1e26] border border-[#373b47] rounded-2xl p-4.5 space-y-2.5">
              <div className="flex items-center space-x-2 text-emerald-400">
                <HelpCircle className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Questions to Sit With
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
                {analysis.reflectionPrompts?.map((prompt, idx) => (
                  <li key={idx} className="flex items-start space-x-2 bg-[#242731] p-2.5 rounded-xl border border-[#373b47]/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                    <span>{prompt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actionable Ideas */}
            <div className="bg-[#1c1e26] border border-[#373b47] rounded-2xl p-4.5 space-y-2.5">
              <div className="flex items-center space-x-2 text-sky-400">
                <Lightbulb className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Mindful Micro-Actions
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
                {analysis.actionableIdeas?.map((idea, idx) => (
                  <li key={idx} className="flex items-start space-x-2 bg-[#242731] p-2.5 rounded-xl border border-[#373b47]/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-1.5" />
                    <span>{idea}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Emotional Spectrum Meters */}
          <div className="bg-[#1c1e26] border border-[#373b47] rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-300">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Emotional Spectrum Breakdown
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">Intensity (0–100)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {emotionDimensions.map((dim) => {
                const IconComponent = dim.icon;
                return (
                  <div key={dim.key} className="space-y-1 bg-[#242731] p-2.5 rounded-xl border border-[#373b47]/60">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 text-slate-300">
                        <IconComponent className="w-3.5 h-3.5" style={{ color: dim.color }} />
                        <span className="font-medium text-[11px]">{dim.label}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-200">{dim.val}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1c1e26] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${dim.barColor} transition-all duration-500 rounded-full`}
                        style={{ width: `${dim.val}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty State when not yet analyzed */}
      {!isGenerating && !analysis && (
        <div className="bg-[#1c1e26] border border-[#373b47] rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-slate-200 text-base">
              Submit your reflection to unveil AI insights
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              When you submit or click "Generate Reflection", Gemini will carefully analyze the emotions, thoughts, and themes in your writing and provide gentle guidance.
            </p>
          </div>

          <button
            type="button"
            onClick={onGenerateReflection}
            disabled={!entry.content.trim()}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition shadow disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Reflection Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
