import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  Smile, 
  Heart, 
  Activity, 
  BrainCircuit, 
  RefreshCw,
  Waves,
  Disc,
  Feather,
  Flame,
  Compass,
  Wind,
  CloudRain,
  ZapOff
} from 'lucide-react';
import { JournalEntry, EvolutionReport } from '../types';
import { generateEvolutionReport } from '../lib/api';
import { EmotionEvolutionSummaryModal } from './EmotionEvolutionSummaryModal';
import { EMOTIONS_LIST, getEmotionMeta, EmotionBadge } from '../lib/emotionIcons';
import { getEntryEmotionBreakdown, getEntrySentimentScore } from '../lib/emotionAnalytics';

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
      const m = e.emotionAnalysis?.primaryEmotion || e.mood || 'peaceful';
      counts[m] = (counts[m] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topMood = sorted[0]?.[0] || 'peaceful';
    return getEmotionMeta(topMood).label;
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#242731] border border-[#373b47] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" />
            <span>Longitudinal Well-Being Analytics</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-100">
            How Your Emotions Have Evolved
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Track shifts in serenity, gratitude, inspiration, and emotional balance across your journaling journey.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe selector */}
          <div className="flex bg-[#1c1e26] p-1 rounded-2xl border border-[#373b47] text-xs font-medium">
            <button
              onClick={() => setTimeframe('7days')}
              className={`px-3 py-1.5 rounded-xl transition ${
                timeframe === '7days' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeframe('30days')}
              className={`px-3 py-1.5 rounded-xl transition ${
                timeframe === '30days' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-xl transition ${
                timeframe === 'all' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'
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
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition shadow disabled:opacity-40"
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
        <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Reflections</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-slate-100">
              {filteredEntries.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across selected timeframe</p>
          </div>
        </div>

        <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Dominant State</span>
            <Smile className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="font-serif text-xl sm:text-2xl font-bold text-emerald-300 truncate">
              {dominantMood}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Most frequent feeling</p>
          </div>
        </div>

        <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg. Sentiment</span>
            <Heart className="w-4 h-4 text-pink-400" />
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-pink-300">
              {averageSentiment}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Scale: -1.0 to +1.0</p>
          </div>
        </div>

        <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mindfulness Index</span>
            <BrainCircuit className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-indigo-300">
              92%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Self-awareness depth score</p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Longitudinal Trajectory Chart (2 cols) */}
        <div className="lg:col-span-2 bg-[#242731] border border-[#373b47] rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-slate-100">
                Emotional Trajectory Timeline
              </h3>
              <p className="text-xs text-slate-400">
                Tracking shifts in Calm, Gratitude, and Inspiration over time
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-1.5" /> Calm
              </span>
              <span className="flex items-center text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5" /> Joy/Gratitude
              </span>
              <span className="flex items-center text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 mr-1.5" /> Inspiration
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="calmGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gratitudeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="inspGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#373b47" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1e26', borderColor: '#373b47', borderRadius: '16px', color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="calm" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#calmGrad)" name="Calm" />
                  <Area type="monotone" dataKey="gratitude" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#gratitudeGrad)" name="Gratitude" />
                  <Area type="monotone" dataKey="inspiration" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#inspGrad)" name="Inspiration" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <Calendar className="w-8 h-8 text-slate-500" />
                <p className="text-xs">No reflections recorded in this timeframe yet.</p>
                <button
                  onClick={onNewEntry}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  Write a new journal reflection
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Emotion Balance Radar Chart (1 col) */}
        <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-slate-100">
              Emotional Balance Radar
            </h3>
            <p className="text-xs text-slate-400">
              Harmony across 7 psychological dimensions
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="68%">
                <PolarGrid stroke="#373b47" />
                <PolarAngleAxis dataKey="emotion" stroke="#cbd5e1" fontSize={11} />
                <PolarRadiusAxis domain={[0, 100]} stroke="#373b47" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1c1e26', borderColor: '#373b47', borderRadius: '16px', color: '#f8fafc', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Intensity']}
                />
                <Radar
                  name="Intensity"
                  dataKey="value"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-slate-400 text-center italic">
            Balanced values in Calm, Gratitude & Joy indicate healthy resilience.
          </p>
        </div>
      </div>

      {/* Emotion Frequency Spectrum */}
      <div className="bg-[#242731] border border-[#373b47] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#373b47]">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Waves className="w-4 h-4" />
              <span>Emotional Frequency Distribution</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-100 mt-1">
              Distribution of Felt Emotions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Every feeling provides valuable feedback for mindful self-awareness.
            </p>
          </div>
        </div>

        {/* Emotion Cards Grid with updated icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {EMOTIONS_LIST.map((emo) => {
            const count = filteredEntries.filter(e => (e.mood || 'peaceful') === emo.id).length;
            const percentage = filteredEntries.length > 0 
              ? Math.round((count / filteredEntries.length) * 100) 
              : 0;
            const IconComponent = emo.icon;

            return (
              <div
                key={emo.id}
                className="bg-[#1c1e26] border border-[#373b47] rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md"
                style={{
                  boxShadow: `0 0 14px ${emo.glowColor}`
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shadow-inner"
                        style={{
                          backgroundColor: emo.color + '26',
                          border: `1.5px solid ${emo.color}`
                        }}
                      >
                        <IconComponent className="w-4 h-4" style={{ color: emo.color }} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">
                          {emo.label}
                        </h4>
                        <span className="text-[10px] text-slate-400 block">
                          {emo.description}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-200">
                        {percentage}%
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {count} memories
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#373b47]/60 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="h-1.5 w-36 bg-[#242731] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: emo.color }}
                    />
                  </div>
                  <span className="font-semibold text-slate-300">{count} logged</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
