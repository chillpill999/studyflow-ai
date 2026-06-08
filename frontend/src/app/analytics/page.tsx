"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  CheckSquare, 
  Trash2, 
  Plus, 
  Sparkles, 
  Zap, 
  Award, 
  Clock, 
  BookOpen, 
  Calendar,
  Check
} from 'lucide-react';
import { useStudyStore } from '../../store/studyStore';

export default function AnalyticsWorkspace() {
  const {
    tasks,
    quizzes,
    user,
    fetchTasks,
    addTask,
    toggleTask,
    deleteTask,
    fetchQuizzes,
    isBackendOnline
  } = useStudyStore();

  const [taskTitle, setTaskTitle] = useState('');
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [hoveredChartBar, setHoveredChartBar] = useState<number | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchQuizzes();
  }, [fetchTasks, fetchQuizzes]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await addTask(taskTitle, activeDate);
    setTaskTitle('');
  };

  // Stats Calculations
  const studyHours = user?.study_hours || 4.5;
  const streak = user?.streak || 3;
  const completedTasks = tasks.filter(t => t.is_completed).length;
  const totalTasks = tasks.length;
  
  // Weekly hours study trend (custom chart coordinates)
  const studyTrend = [
    { day: 'Mon', hours: 1.5 },
    { day: 'Tue', hours: 2.5 },
    { day: 'Wed', hours: 0.8 },
    { day: 'Thu', hours: 3.2 },
    { day: 'Fri', hours: 1.0 },
    { day: 'Sat', hours: 4.5 },
    { day: 'Sun', hours: 2.0 }
  ];

  // Subject proficiency bars
  const subjectsData = [
    { name: 'Computer Science', score: 92, color: 'from-indigo-500 to-purple-600' },
    { name: 'Mathematics', score: 78, color: 'from-purple-500 to-cyan-500' },
    { name: 'Physics', score: 85, color: 'from-cyan-500 to-emerald-500' },
    { name: 'Organic Chemistry', score: 62, color: 'from-amber-500 to-rose-500' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Analytics & Tasks
          <span className="text-xs text-indigo-400 font-semibold border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 rounded-full">Productivity</span>
        </h1>
        <p className="text-white/50 text-sm mt-1">Review learning velocity, view performance charts, and organize daily study targets.</p>
      </div>

      {/* Grid: SVG Performance Trend Chart vs Checklist Task Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Column: Charts & Analytics (takes 2/3 cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Custom SVG Study Trend Chart */}
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">Daily Study Velocity</span>
                <h3 className="text-lg font-bold text-white mt-0.5">Study Duration Trend</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Average Session</span>
                <span className="text-sm font-bold text-white">2.1 Hours/day</span>
              </div>
            </div>

            {/* Custom SVG Path Line Chart */}
            <div className="relative h-64 w-full bg-white/2 border border-white/5 rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
              
              {/* Background horizontal guide lines */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 py-8 pointer-events-none opacity-10">
                <div className="border-b border-white w-full" />
                <div className="border-b border-white w-full" />
                <div className="border-b border-white w-full" />
              </div>

              {/* SVG vector */}
              <svg className="flex-1 w-full h-full overflow-visible z-10">
                <defs>
                  <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>

                {/* Area path fill */}
                <path
                  d="M 50 180 Q 120 140 190 160 T 330 110 T 470 170 T 610 80 T 750 150 L 750 200 L 50 200 Z"
                  fill="url(#chart-glow)"
                  className="transition-all duration-1000"
                />

                {/* Glowing line path */}
                <path
                  d="M 50 180 Q 120 140 190 160 T 330 110 T 470 170 T 610 80 T 750 150"
                  fill="transparent"
                  stroke="#8b5cf6"
                  strokeWidth="3.5"
                  className="transition-all duration-1000"
                  strokeLinecap="round"
                />

                {/* Interactive Data points */}
                {[
                  { x: 50, y: 180, hrs: 1.5, idx: 0 },
                  { x: 140, y: 148, hrs: 2.5, idx: 1 },
                  { x: 230, y: 160, hrs: 0.8, idx: 2 },
                  { x: 340, y: 110, hrs: 3.2, idx: 3 },
                  { x: 470, y: 170, hrs: 1.0, idx: 4 },
                  { x: 600, y: 80, hrs: 4.5, idx: 5 },
                  { x: 730, y: 150, hrs: 2.0, idx: 6 }
                ].map((pt) => (
                  <g key={pt.idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredChartBar === pt.idx ? 7 : 4}
                      fill={hoveredChartBar === pt.idx ? '#06b6d4' : '#8b5cf6'}
                      stroke="#fff"
                      strokeWidth="2"
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredChartBar(pt.idx)}
                      onMouseLeave={() => setHoveredChartBar(null)}
                    />
                    {hoveredChartBar === pt.idx && (
                      <g>
                        <rect x={pt.x - 30} y={pt.y - 35} width="60" height="24" rx="6" fill="#0B1120" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
                        <text x={pt.x} y={pt.y - 19} fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">
                          {pt.hrs} hrs
                        </text>
                      </g>
                    )}
                  </g>
                ))}
              </svg>

              {/* X Axis labels */}
              <div className="flex justify-between text-[10px] text-white/40 font-bold px-2 pt-2 z-10">
                {studyTrend.map((t, i) => (
                  <span key={i} className="w-12 text-center">{t.day}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Subject Performance proficiency lists */}
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award size={18} className="text-cyan-400" />
              Subject Performance Velocity
            </h3>

            <div className="space-y-4">
              {subjectsData.map((sub) => (
                <div key={sub.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white/90">{sub.name}</span>
                    <span className="font-mono text-cyan-400 font-bold">{sub.score}% Proficiency</span>
                  </div>

                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${sub.score}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r ${sub.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Checklist Task Manager (takes 1/3 cols) */}
        <div className="space-y-8">
          
          {/* Daily study Tasks list */}
          <div className="glass-card p-6 rounded-3xl flex flex-col justify-between min-h-[500px]">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <h3 className="text-md font-bold text-white flex items-center gap-1.5">
                  <CheckSquare size={16} className="text-indigo-400" />
                  Study Tasks checklist
                </h3>
                <span className="text-[10px] text-white/40 font-mono">
                  {completedTasks}/{totalTasks} done
                </span>
              </div>

              {/* Task Form input */}
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input 
                  type="text" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Create new study goal..."
                  className="flex-1 glass-input px-3 py-2 rounded-xl text-xs"
                />
                <button 
                  type="submit"
                  disabled={!taskTitle.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded-xl text-white cursor-pointer transition-all disabled:opacity-50"
                >
                  <Plus size={14} />
                </button>
              </form>

              {/* List log container */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 pt-1">
                {tasks.length === 0 ? (
                  <div className="text-center py-10 border border-white/5 rounded-2xl bg-white/3">
                    <CheckSquare className="mx-auto text-white/10 h-8 w-8 mb-2" />
                    <p className="text-white/40 text-xs font-semibold">No daily goals yet</p>
                    <p className="text-[10px] text-white/25 mt-1">List goals like 'Revise Physics' or 'Practice MCQ'.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {tasks.map((tsk) => (
                      <motion.div 
                        key={tsk.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={`
                          p-3 rounded-xl border flex items-center justify-between group transition-all duration-200
                          ${tsk.is_completed 
                            ? 'bg-emerald-500/5 border-emerald-500/10 text-white/40 line-through' 
                            : 'bg-white/3 border-white/5 text-white/80'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => toggleTask(tsk.id, !tsk.is_completed)}
                            className={`
                              h-4.5 w-4.5 rounded border flex items-center justify-center transition-all cursor-pointer
                              ${tsk.is_completed 
                                ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' 
                                : 'border-white/15 bg-white/3 hover:border-white/25'
                              }
                            `}
                          >
                            {tsk.is_completed && <Check size={10} />}
                          </button>
                          <span className="text-xs truncate max-w-[150px] font-semibold">{tsk.title}</span>
                        </div>

                        <button
                          onClick={() => deleteTask(tsk.id)}
                          className="p-1 rounded bg-transparent opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-all cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Target hours widget block */}
            <div className="border-t border-white/5 pt-4 mt-4 bg-white/2 p-3 rounded-xl border border-white/5 text-[10px] text-white/50 leading-relaxed flex items-center gap-2">
              <Zap size={14} className="text-amber-500 fill-amber-500/10 animate-pulse" />
              <span>Completing daily check-list items increases your learning velocity stats in real-time.</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
