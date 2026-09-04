import React from 'react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  Target, 
  BrainCircuit, 
  Award,
  Calendar
} from 'lucide-react';
import { EvolutionReport } from '../types';

interface EmotionEvolutionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: EvolutionReport | null;
  entriesCount: number;
}

export const EmotionEvolutionSummaryModal: React.FC<EmotionEvolutionSummaryModalProps> = ({
  isOpen,
  onClose,
  report,
  entriesCount
}) => {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#242731] border border-[#373b47] text-slate-100 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#373b47] bg-[#1c1e26] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif font-bold text-xl text-slate-100">
                  Emotional Evolution Report
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {entriesCount} Entries Synthesized
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Longitudinal psychological growth, emotional resilience & wellness trajectory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-[#282c37] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Dominant Trend Banner */}
          <div className="bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center mb-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              Dominant Emotional Trajectory
            </span>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-100">
              "{report.dominantTrend}"
            </h3>
          </div>

          {/* Holistic Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Longitudinal Synthesis
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed font-sans bg-[#1c1e26] p-4 rounded-2xl border border-[#373b47]">
              {report.summary}
            </p>
          </div>

          {/* Grid: Milestones & Strengths */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Key Milestones */}
            <div className="bg-[#1c1e26] border border-[#373b47] rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Key Emotional Milestones
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {report.keyMilestones.map((m, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strengths Identified */}
            <div className="bg-[#1c1e26] border border-[#373b47] rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center">
                <Award className="w-4 h-4 mr-1.5" />
                Core Resilience Strengths
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {report.strengthsIdentified.map((s, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Coaching Advice */}
          <div className="bg-[#1c1e26] border border-[#373b47] rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center">
              <BrainCircuit className="w-4 h-4 mr-1.5" />
              Mindful Guidance & Actionable Steps
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {report.coachingAdvice.map((advice, idx) => (
                <div key={idx} className="bg-[#242731] p-3.5 rounded-xl border border-[#373b47] text-xs text-slate-300">
                  <span className="text-amber-400 font-bold mr-1">0{idx + 1}.</span>
                  {advice}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Focus Area */}
          <div className="bg-[#1c1e26] border border-purple-500/30 rounded-2xl p-4 flex items-center space-x-3 text-xs">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-400">
                Suggested Mindful Focus for Next Month
              </span>
              <p className="font-semibold text-slate-100 text-sm mt-0.5">
                {report.recommendedFocus}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#1c1e26] border-t border-[#373b47] flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            Generated {new Date(report.generatedAt).toLocaleDateString()}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 px-6 py-2 rounded-xl font-bold text-xs transition shadow"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
