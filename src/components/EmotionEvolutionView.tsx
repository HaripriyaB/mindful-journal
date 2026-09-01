import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  Smile, 
  Heart, 
  Activity, 
  Sun, 
  BrainCircuit, 
  Zap, 
  RefreshCw,
  Plus
} from 'lucide-react';
import { JournalEntry, EvolutionReport } from '../types';
import { generateEvolutionReport } from '../lib/api';
import { EmotionEvolutionSummaryModal } from './EmotionEvolutionSummaryModal';
import { EMOTION_CHARACTERS, CHARACTER_LIST, getCharacterForMood, EmotionCharacter } from '../lib/emotionCharacters';
import { getEntryEmotionBreakdown, getEntrySentimentScore } from '../lib/emotionAnalytics';
import { Waves, Disc, BookOpen, Quote, Shield } from 'lucide-react';

interface EmotionEvolutionViewProps {
  entries: JournalEntry[];
  onNewEntry: () => void;
}

export const EmotionEvolutionView: React.FC<EmotionEvolutionViewProps> = ({
  entries,
  onNewEntry
}) => {
  const [timeframe, setTimeframe] = useState<'7days' | '30days' | 'all'>('30days');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [evolutionReport, setEvolutionReport] = useState<EvolutionReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Filter entries based on timeframe
  const filteredEntries = useMemo(() => {
    const now = Date.now();
    let sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);
    
    if (timeframe === '7days') {
      const cut = now - 7 * 24 * 60 * 60 * 1000;
      sorted = sorted.filter(e => e.createdAt >= cut);
    } else if (timeframe === '30days') {
      const cut = now - 30 * 24 * 60 * 60 * 1000;
      sorted = sorted.filter(e => e.createdAt >= cut);
    }
    return sorted;
  }, [entries, timeframe]);

  // Timeline chart data
  const timelineData = useMemo(() => {
    return filteredEntries.map(e => {
      const dateStr = new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const breakdown = getEntryEmotionBreakdown(e);
      const sentiment = getEntrySentimentScore(e);
      return {
        date: dateStr,
        timestamp: e.createdAt,
        title: e.title,
        joy: breakdown.joy,
        calm: breakdown.calm,
        gratitude: breakdown.gratitude,
        stress: breakdown.stress,
        inspiration: breakdown.inspiration,
        energy: breakdown.energy,
        sadness: breakdown.sadness,
        sentiment: sentiment
      };
    });
  }, [filteredEntries]);

  // Radar chart data: Aggregate emotional balance across 7 dimensions
  const radarData = useMemo(() => {
    if (filteredEntries.length === 0) {
      return [
        { emotion: 'Joy', value: 0, fullMark: 100 },
        { emotion: 'Calm', value: 0, fullMark: 100 },
        { emotion: 'Gratitude', value: 0, fullMark: 100 },
        { emotion: 'Inspiration', value: 0, fullMark: 100 },
        { emotion: 'Energy', value: 0, fullMark: 100 },
        { emotion: 'Stress', value: 0, fullMark: 100 },
        { emotion: 'Sadness', value: 0, fullMark: 100 }
      ];
    }

    let totalJoy = 0, totalCalm = 0, totalGratitude = 0, totalInspiration = 0, totalEnergy = 0, totalStress = 0, totalSadness = 0;
    filteredEntries.forEach(e => {
      const b = getEntryEmotionBreakdown(e);
      totalJoy += b.joy;
      totalCalm += b.calm;
      totalGratitude += b.gratitude;
      totalInspiration += b.inspiration;
      totalEnergy += b.energy;
      totalStress += b.stress;
      totalSadness += b.sadness;
    });

    const count = filteredEntries.length;
    return [
      { emotion: 'Joy', value: Math.round(totalJoy / count), fullMark: 100 },
      { emotion: 'Calm', value: Math.round(totalCalm / count), fullMark: 100 },
      { emotion: 'Gratitude', value: Math.round(totalGratitude / count), fullMark: 100 },
      { emotion: 'Inspiration', value: Math.round(totalInspiration / count), fullMark: 100 },
      { emotion: 'Energy', value: Math.round(totalEnergy / count), fullMark: 100 },
      { emotion: 'Stress', value: Math.round(totalStress / count), fullMark: 100 },
      { emotion: 'Sadness', value: Math.round(totalSadness / count), fullMark: 100 }
    ];
  }, [filteredEntries]);

  // Overall Stats
  const averageSentiment = useMemo(() => {
    if (filteredEntries.length === 0) return '+0.00';
    const sum = filteredEntries.reduce((acc, e) => acc + getEntrySentimentScore(e), 0);
    const avg = sum / filteredEntries.length;
    return avg >= 0 ? `+${avg.toFixed(2)}` : avg.toFixed(2);
  }, [filteredEntries]);

  const dominantMood = useMemo(() => {
    if (filteredEntries.length === 0) return 'Peaceful';
    const counts: Record<string, number> = {};
    filteredEntries.forEach(e => {
      const m = e.emotionAnalysis?.primaryEmotion || e.mood || 'Reflective';
      counts[m] = (counts[m] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'Peaceful';
  }, [filteredEntries]);

  const handleGenerateReport = async () => {
    if (entries.length === 0) return;
    try {
      setIsGeneratingReport(true);
      const report = await generateEvolutionReport(entries);
      setEvolutionReport(report);
      setIsReportModalOpen(true);
    } catch (err) {
      console.error('Report error:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Longitudinal Well-Being Analytics</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100">
            How Your Emotions Have Evolved
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 max-w-xl">
            Track shifts in serenity, gratitude, inspiration, and mental balance across your journaling journey.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe selector */}
          <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs font-medium">
            <button
              onClick={() => setTimeframe('7days')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeframe === '7days' ? 'bg-amber-500 text-stone-950 font-semibold shadow' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeframe('30days')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeframe === '30days' ? 'bg-amber-500 text-stone-950 font-semibold shadow' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeframe === 'all' ? 'bg-amber-500 text-stone-950 font-semibold shadow' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              All Time
            </button>
          </div>

          {/* AI Evolution Report Button */}
          <button
            id="generate-evolution-report-btn"
            onClick={handleGenerateReport}
            disabled={isGeneratingReport || entries.length === 0}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-semibold px-4 py-2 rounded-xl text-xs transition shadow disabled:opacity-40"
          >
            {isGeneratingReport ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing Trajectory...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Evolution Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Reflections</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-stone-100">
              {filteredEntries.length}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Across selected timeframe</p>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Dominant State</span>
            <Smile className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="font-serif text-xl sm:text-2xl font-bold text-emerald-300 truncate">
              {dominantMood}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Most frequent feeling</p>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg. Sentiment</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-rose-300">
              {averageSentiment}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Scale: -1.0 to +1.0</p>
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mindfulness Quotient</span>
            <BrainCircuit className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-purple-300">
              88%
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Consistency & depth index</p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Longitudinal Trajectory Chart (2 cols) */}
        <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-100">
                Emotional Trajectory Timeline
              </h3>
              <p className="text-xs text-stone-400">
                Tracking shifts in Calm, Gratitude, and Inspiration over time
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5" /> Calm
              </span>
              <span className="flex items-center text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5" /> Gratitude
              </span>
              <span className="flex items-center text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 mr-1.5" /> Inspiration
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="calmGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gratitudeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="inspGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />
                  <XAxis dataKey="date" stroke="#78716c" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#78716c" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '12px', color: '#f5f5f4', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="calm" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#calmGrad)" name="Calm" />
                  <Area type="monotone" dataKey="gratitude" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#gratitudeGrad)" name="Gratitude" />
                  <Area type="monotone" dataKey="inspiration" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#inspGrad)" name="Inspiration" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 space-y-2">
                <Calendar className="w-8 h-8 text-stone-600" />
                <p className="text-xs">No entries recorded in this timeframe yet.</p>
                <button
                  onClick={onNewEntry}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  Write a new journal entry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Emotion Balance Radar Chart (1 col) */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-100">
              Emotional Balance Radar
            </h3>
            <p className="text-xs text-stone-400">
              Harmony across 7 psychological dimensions
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="68%">
                <PolarGrid stroke="#44403c" />
                <PolarAngleAxis dataKey="emotion" stroke="#d6d3d1" fontSize={11} />
                <PolarRadiusAxis domain={[0, 100]} stroke="#44403c" tick={{ fill: '#78716c', fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '12px', color: '#f5f5f4', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Intensity']}
                />
                <Radar
                  name="Intensity"
                  dataKey="value"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-stone-400 text-center italic">
            High values in Calm, Gratitude & Joy indicate grounded wellness.
          </p>
        </div>
      </div>

      {/* Living Emotion Guides & Resonance Council */}
      <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-800">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Waves className="w-4 h-4" />
              <span>Inner Resonance Council</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-100 mt-1">
              Your Emotion Guides & Their Gifts
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Every emotion serves a vital role in your life's harmony. Joy builds resilience, Serenity restores, Sadness heals, and Spark creates courage.
            </p>
          </div>
        </div>

        {/* Emotion Character Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CHARACTER_LIST.map((char) => {
            const count = filteredEntries.filter(e => (e.mood || 'peaceful') === char.id).length;
            const percentage = filteredEntries.length > 0 
              ? Math.round((count / filteredEntries.length) * 100) 
              : 0;

            return (
              <div
                key={char.id}
                className="rounded-2xl p-4.5 border transition-all duration-300 flex flex-col justify-between space-y-3"
                style={{
                  backgroundColor: char.primaryColor + '10',
                  borderColor: char.primaryColor + '33',
                  boxShadow: `0 0 16px ${char.glowColor}`
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-inner"
                        style={{
                          backgroundColor: char.primaryColor + '30',
                          border: `1.5px solid ${char.primaryColor}`
                        }}
                      >
                        {char.characterEmoji}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-100">
                          {char.name}
                        </h4>
                        <span className="text-[10px] text-stone-400 block">
                          {char.characterTitle}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-stone-200">
                        {percentage}%
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        {count} memories
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-300 italic font-serif leading-relaxed">
                    {char.quote}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-[11px] text-stone-400">
                  <span className="truncate max-w-[170px] text-stone-300">
                    &bull; {char.whisper}
                  </span>
                  <span 
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: char.primaryColor }}
                    title={char.personality}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Core Memory Spheres Shelf (Long-Term Memory Vault) */}
      {filteredEntries.length > 0 && (
        <div className="bg-stone-900/80 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-4 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold uppercase tracking-wider">
                <Disc className="w-4 h-4" />
                <span>Long-Term Memory Vault</span>
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-100 mt-1">
                Glowing Core Memory Spheres
              </h3>
              <p className="text-xs text-stone-400">
                Each reflection is a preserved memory orb radiating its emotional current.
              </p>
            </div>
            <span className="text-xs text-stone-400">
              {filteredEntries.length} Core Orbs
            </span>
          </div>

          {/* Spheres Row */}
          <div className="flex flex-wrap gap-3 pt-2">
            {filteredEntries.map((e) => {
              const char = getCharacterForMood(e.mood);
              const dateStr = new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <div
                  key={e.id}
                  className="group relative flex items-center space-x-2.5 bg-stone-950/80 hover:bg-stone-900 border border-stone-800 rounded-2xl p-2.5 pr-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                  style={{
                    borderColor: char.primaryColor + '40',
                    boxShadow: `0 0 12px ${char.glowColor}`
                  }}
                  title={`${e.title || 'Reflection'} (${char.name})`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md transition transform group-hover:scale-110"
                    style={{
                      backgroundColor: char.primaryColor + '33',
                      border: `2px solid ${char.primaryColor}`,
                      boxShadow: `0 0 10px ${char.glowColor}`
                    }}
                  >
                    {char.characterEmoji}
                  </div>
                  <div className="max-w-[140px]">
                    <h5 className="text-xs font-bold text-stone-200 truncate group-hover:text-amber-300 transition">
                      {e.title || 'Quiet Reflection'}
                    </h5>
                    <p className="text-[10px] text-stone-400 truncate">
                      {dateStr} &middot; {char.name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evolution Summary Modal */}
      <EmotionEvolutionSummaryModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={evolutionReport}
        entriesCount={entries.length}
      />
    </div>
  );
};
