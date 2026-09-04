"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, 
  Trash2, 
  Plus, 
  Zap, 
  Award, 
  Check
} from 'lucide-react';
import { useStudyStore } from '../../store/studyStore';

export default function AnalyticsWorkspace() {
  const {
    tasks,
    user,
    fetchTasks,
    addTask,
    toggleTask,
    deleteTask,
    fetchQuizzes
  } = useStudyStore();

  const [taskTitle, setTaskTitle] = useState('');
  const [hoveredChartBar, setHoveredChartBar] = useState<number | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchQuizzes();
  }, [fetchTasks, fetchQuizzes]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const today = new Date().toISOString().split('T')[0];
    await addTask(taskTitle, today);
    setTaskTitle('');
  };

  // Stats Calculations

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
    { name: 'Computer Science', score: 92, color: 'bg-neo-cyan' },
    { name: 'Mathematics', score: 78, color: 'bg-neo-magenta' },
    { name: 'Physics', score: 85, color: 'bg-neo-yellow' },
    { name: 'Organic Chemistry', score: 62, color: 'bg-neo-green' }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-black">
      
      {/* Title */}
      <div className="bg-neo-yellow border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
          Analytics & Tasks
          <span className="text-xs bg-white border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold">Productivity</span>
        </h1>
        <p className="font-bold mt-2">Review learning velocity, view performance charts, and organize daily study targets.</p>
      </div>

      {/* Grid: SVG Performance Trend Chart vs Checklist Task Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Column: Charts & Analytics (takes 2/3 cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Custom SVG Study Trend Chart */}
          <div className="neo-box bg-white p-6 space-y-6">
            <div className="flex justify-between items-center border-b-4 border-black pb-4">
              <div>
                <span className="font-black uppercase block">Daily Study Velocity</span>
                <h3 className="text-2xl font-black mt-1">Study Duration Trend</h3>
              </div>
              <div className="text-right bg-neo-cyan border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-black uppercase block text-xs">Average Session</span>
                <span className="font-bold text-lg">2.1 Hours/day</span>
              </div>
            </div>

            {/* Custom SVG Path Line Chart */}
            <div className="relative h-64 w-full bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col justify-between overflow-hidden">
              
              {/* Background horizontal guide lines */}
              <div className="absolute inset-0 flex flex-col justify-between p-4 py-8 pointer-events-none opacity-20">
                <div className="border-b-2 border-black w-full dashed" />
                <div className="border-b-2 border-black w-full dashed" />
                <div className="border-b-2 border-black w-full dashed" />
              </div>

              {/* SVG vector */}
              <svg className="flex-1 w-full h-full overflow-visible z-10">
                {/* Area path fill */}
                <path
                  d="M 50 180 Q 120 140 190 160 T 330 110 T 470 170 T 610 80 T 750 150 L 750 200 L 50 200 Z"
                  fill="#FF00FF"
                  className="transition-all duration-1000 opacity-20"
                />

                {/* Solid line path */}
                <path
                  d="M 50 180 Q 120 140 190 160 T 330 110 T 470 170 T 610 80 T 750 150"
                  fill="transparent"
                  stroke="#000"
                  strokeWidth="6"
                  className="transition-all duration-1000"
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
                      r={hoveredChartBar === pt.idx ? 10 : 6}
                      fill={hoveredChartBar === pt.idx ? '#00FFFF' : '#FFE600'}
                      stroke="#000"
                      strokeWidth="3"
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredChartBar(pt.idx)}
                      onMouseLeave={() => setHoveredChartBar(null)}
                    />
                    {hoveredChartBar === pt.idx && (
                      <g>
                        <rect x={pt.x - 35} y={pt.y - 45} width="70" height="30" fill="#fff" stroke="#000" strokeWidth="2" />
                        <text x={pt.x} y={pt.y - 25} fill="#000" fontSize="12" fontWeight="900" textAnchor="middle">
                          {pt.hrs} hrs
                        </text>
                      </g>
                    )}
                  </g>
                ))}
              </svg>

              {/* X Axis labels */}
              <div className="flex justify-between text-xs font-black uppercase px-2 pt-2 z-10 border-t-4 border-black mt-2">
                {studyTrend.map((t, i) => (
                  <span key={i} className="w-12 text-center pt-2">{t.day}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Subject Performance proficiency lists */}
          <div className="neo-box bg-neo-magenta p-6 space-y-6">
            <h3 className="text-2xl font-black flex items-center gap-2 border-b-4 border-black pb-4">
              <div className="bg-white border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Award size={24} />
              </div>
              Subject Performance
            </h3>

            <div className="space-y-6">
              {subjectsData.map((sub) => (
                <div key={sub.name} className="space-y-2 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex justify-between items-center">
                    <span className="font-black uppercase">{sub.name}</span>
                    <span className="font-black bg-black text-white px-2 py-1">{sub.score}%</span>
                  </div>

                  <div className="h-4 bg-white border-2 border-black w-full">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${sub.score}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full border-r-2 border-black ${sub.color}`}
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
          <div className="neo-box bg-neo-yellow p-6 flex flex-col justify-between min-h-[500px]">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b-4 border-black pb-4">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <div className="bg-white border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <CheckSquare size={20} />
                  </div>
                  Study Tasks
                </h3>
                <span className="font-black bg-white border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {completedTasks}/{totalTasks}
                </span>
              </div>

              {/* Task Form input */}
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input 
                  type="text" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="New task..."
                  className="flex-1 neo-input text-sm"
                />
                <button 
                  type="submit"
                  disabled={!taskTitle.trim()}
                  className="neo-button px-4 py-2 bg-neo-cyan hover:bg-white flex items-center justify-center disabled:opacity-50"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              </form>

              {/* List log container */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 pt-1 custom-scrollbar">
                {tasks.length === 0 ? (
                  <div className="text-center py-10 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                    <CheckSquare className="mx-auto h-12 w-12 mb-2" strokeWidth={1.5} />
                    <p className="font-black uppercase">No tasks yet</p>
                    <p className="font-bold text-sm mt-2">Add goals like 'Revise Physics' or 'Practice MCQ'.</p>
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
                          p-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between transition-all duration-200
                          ${tsk.is_completed 
                            ? 'bg-gray-300 opacity-60 line-through' 
                            : 'bg-white hover:bg-neo-cyan'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => toggleTask(tsk.id, !tsk.is_completed)}
                            className={`
                              h-6 w-6 border-2 border-black flex items-center justify-center cursor-pointer
                              ${tsk.is_completed 
                                ? 'bg-black text-white' 
                                : 'bg-white hover:bg-gray-200'
                              }
                            `}
                          >
                            {tsk.is_completed && <Check size={16} strokeWidth={4} />}
                          </button>
                          <span className="font-bold truncate max-w-[140px] text-sm">{tsk.title}</span>
                        </div>

                        <button
                          onClick={() => deleteTask(tsk.id)}
                          className="p-1 bg-red-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-white text-black transition-colors"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Target hours widget block */}
            <div className="mt-6 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 font-bold text-sm flex items-start gap-3">
              <div className="bg-neo-green border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
                <Zap size={20} strokeWidth={3} />
              </div>
              <span>Completing daily check-list items increases your learning velocity stats in real-time.</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
