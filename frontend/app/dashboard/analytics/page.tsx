'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard } from 'src/components/GlassCard';
import { apiClient } from 'src/lib/axios';
import { 
  Flame, 
  Clock, 
  Layers, 
  Sparkles, 
  TrendingUp, 
  Plus
} from 'lucide-react';

interface AnalyticsData {
  streak: number;
  total_study_time_minutes: number;
  activity_distribution: {
    read: number;
    chat: number;
    quiz: number;
    flashcard_review: number;
  };
  flashcard_stats: {
    total: number;
    box_distribution: Record<number, number>;
  };
  quiz_stats: {
    total_taken: number;
    average_score: number;
  };
  coach_recommendations: string;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Manual study session logging
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [activityType, setActivityType] = useState<string>('read');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [logging, setLogging] = useState<boolean>(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/analytics');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchAnalytics();
    }, 0);
  }, []);


  const handleLogActivity = async () => {
    setLogging(true);
    try {
      await apiClient.post('/analytics/log', {
        activity_type: activityType,
        duration_seconds: durationMinutes * 60,
      });
      setShowLogModal(false);
      alert('Activity session logged successfully!');
      fetchAnalytics();
    } catch (err) {
      console.error('Logging activity failed', err);
    } finally {
      setLogging(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex justify-center items-center">
        <div className="h-8 w-8 border-4 border-purple-950 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const actDetails: Record<string, { label: string; color: string }> = {
    read: { label: 'Reading syllabus', color: 'bg-purple-600' },
    chat: { label: 'AI Study Chat', color: 'bg-blue-500' },
    quiz: { label: 'Quizzes Solver', color: 'bg-green-600' },
    flashcard_review: { label: 'Flashcard Reviews', color: 'bg-orange-500' },
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-40px)] z-10 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-purple-950">Learning Analytics</h1>
          <p className="text-purple-950/60 mt-1">Streaks, task milestones, spaced repetition rates, and coaching advice</p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="bg-purple-950 text-white text-xs font-sans font-semibold py-2.5 px-4 rounded-xl hover:bg-purple-900 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={14} />
          Log Study Session
        </button>
      </div>

      {data && (
        <div className="space-y-6">
          {/* Key metrics grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <GlassCard className="p-5 flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-600 border border-orange-500/10">
                <Flame size={24} />
              </div>
              <div>
                <div className="text-2xl font-serif font-bold text-purple-950">{data.streak} Days</div>
                <div className="text-xs text-purple-950/50 mt-0.5">Study Streak</div>
              </div>
            </GlassCard>

            <GlassCard className="p-5 flex items-center gap-4">
              <div className="p-3 bg-purple-950/10 rounded-2xl text-purple-950 border border-purple-950/10">
                <Clock size={24} />
              </div>
              <div>
                <div className="text-2xl font-serif font-bold text-purple-950">
                  {data.total_study_time_minutes} Min
                </div>
                <div className="text-xs text-purple-950/50 mt-0.5">Total Study Duration</div>
              </div>
            </GlassCard>

            <GlassCard className="p-5 flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-2xl text-green-600 border border-green-500/10">
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="text-2xl font-serif font-bold text-purple-950">{data.quiz_stats.average_score}%</div>
                <div className="text-xs text-purple-950/50 mt-0.5">Average Quiz Accuracy</div>
              </div>
            </GlassCard>

            <GlassCard className="p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 border border-blue-500/10">
                <Layers size={24} />
              </div>
              <div>
                <div className="text-2xl font-serif font-bold text-purple-950">{data.flashcard_stats.total}</div>
                <div className="text-xs text-purple-950/50 mt-0.5">Spaced Repetition Cards</div>
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left side distributions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Study distribution */}
              <GlassCard className="p-6 space-y-4">
                <h3 className="text-sm font-serif font-bold text-purple-950">Activity Distribution</h3>
                <div className="space-y-4">
                  {Object.entries(data.activity_distribution).map(([key, val]) => {
                    const total = Object.values(data.activity_distribution).reduce((a, b) => a + b, 0) || 1;
                    const percent = Math.min(100, Math.round((val / total) * 100));
                    const details = actDetails[key] || { label: key, color: 'bg-purple-950' };
                    
                    return (
                      <div key={key} className="space-y-1.5 font-sans">
                        <div className="flex justify-between text-xs font-medium text-purple-950">
                          <span>{details.label}</span>
                          <span className="text-purple-950/60">{val} mins ({percent}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-purple-950/5 rounded-full overflow-hidden border border-white/20">
                          <div className={`h-full ${details.color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Flashcard boxes */}
              <GlassCard className="p-6 space-y-4">
                <h3 className="text-sm font-serif font-bold text-purple-950">Leitner Box Distribution</h3>
                <div className="grid grid-cols-5 gap-3">
                  {[1, 2, 3, 4, 5].map((box) => {
                    const count = data.flashcard_stats.box_distribution[box] || 0;
                    const total = data.flashcard_stats.total || 1;
                    const percent = Math.round((count / total) * 100);

                    return (
                      <div key={box} className="flex flex-col items-center p-3 rounded-2xl bg-white/20 border border-white/25 text-center font-sans space-y-2">
                        <div className="text-[10px] font-bold text-purple-950/60 uppercase">Box {box}</div>
                        <div className="text-lg font-serif font-bold text-purple-950">{count}</div>
                        <div className="text-[9px] text-[#B998D2] font-semibold">{percent}%</div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </div>

            {/* AI Coach column */}
            <div className="lg:col-span-1">
              <GlassCard className="p-6 space-y-4 border-purple-950/10 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-purple-300/10 blur-xl pointer-events-none" />
                <h3 className="text-lg font-serif font-bold text-purple-950 flex items-center gap-2">
                  <Sparkles size={20} className="text-[#B998D2] animate-pulse" />
                  AI Study Coach
                </h3>
                <div className="text-sm font-sans text-purple-950/80 leading-relaxed whitespace-pre-line border-t border-purple-950/5 pt-4">
                  {data.coach_recommendations}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {/* Manual Study Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-purple-950/20 backdrop-blur-[4px] z-50 flex items-center justify-center p-4">
          <GlassCard className="p-6 max-w-sm w-full space-y-4">
            <h2 className="text-lg font-serif font-bold text-purple-950">Log Study Session</h2>
            
            <div className="space-y-3 font-sans">
              <div>
                <label className="text-xs font-semibold text-purple-950/70 block mb-1">Study Activity</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="w-full px-3 py-2 bg-white/60 border border-white/40 rounded-xl text-xs text-purple-950 focus:outline-none"
                >
                  <option value="read">Reading Book / Notes</option>
                  <option value="chat">Study Chat querying AI</option>
                  <option value="quiz">Solving quizzes</option>
                  <option value="flashcard_review">Flashcard revision sessions</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-purple-950/70 block mb-1">Session Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-white/60 border border-white/40 rounded-xl text-xs text-purple-950 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowLogModal(false)}
                className="text-xs text-purple-950/60 hover:text-purple-950 px-4 py-2 font-sans"
              >
                Cancel
              </button>
              <button
                onClick={handleLogActivity}
                disabled={logging}
                className="bg-purple-950 text-white text-xs font-sans font-semibold px-4 py-2 rounded-xl shadow-sm disabled:opacity-50"
              >
                {logging ? 'Saving...' : 'Log Session'}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
