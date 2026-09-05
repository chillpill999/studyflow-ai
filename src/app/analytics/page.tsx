"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, 
  Trash2, 
  Plus, 
  Zap, 
  Check
} from 'lucide-react';
import { useStudyStore } from '../../store/studyStore';

export default function AnalyticsWorkspace() {
  const {
    tasks,
    fetchTasks,
    addTask,
    toggleTask,
    deleteTask,
    fetchQuizzes
  } = useStudyStore();

  const [taskTitle, setTaskTitle] = useState('');

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

  // Stats Calculations — real data only
  const completedTasks = tasks.filter(t => t.is_completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8 text-black">
      
      {/* Title */}
      <div className="bg-neo-yellow border-2 border-black p-4 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
          Analytics & Tasks
          <span className="text-[10px] bg-white border-2 border-black px-2 py-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] font-bold">Productivity</span>
        </h1>
        <p className="font-medium mt-1 text-xs sm:text-sm text-gray-800">Review learning velocity, view performance charts, and organize daily study targets.</p>
      </div>

      {/* Grid: SVG Performance Trend Chart vs Checklist Task Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left/Middle Column: Real Stats (takes 2/3 cols) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Task Completion Summary */}
          <div className="neo-box bg-white p-4 space-y-4">
            <div className="flex justify-between items-center border-b-2 border-black pb-2.5">
              <div>
                <span className="font-black uppercase block text-[10px] text-gray-600">Task Progress</span>
                <h3 className="text-base font-black mt-0.5">Completion Summary</h3>
              </div>
              <div className="text-right bg-neo-cyan border-2 border-black p-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                <span className="font-black uppercase block text-[10px]">Completion Rate</span>
                <span className="font-bold text-sm">{completionRate}%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="border-2 border-black p-2 sm:p-3 bg-neo-yellow shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] sm:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                <span className="text-xl sm:text-2xl font-black">{totalTasks}</span>
                <p className="font-black uppercase text-[10px] sm:text-xs mt-0.5">Total</p>
              </div>
              <div className="border-2 border-black p-2 sm:p-3 bg-neo-green shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] sm:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                <span className="text-xl sm:text-2xl font-black">{completedTasks}</span>
                <p className="font-black uppercase text-[10px] sm:text-xs mt-0.5">Done</p>
              </div>
              <div className="border-2 border-black p-2 sm:p-3 bg-neo-magenta text-white shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] sm:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                <span className="text-xl sm:text-2xl font-black">{totalTasks - completedTasks}</span>
                <p className="font-black uppercase text-[10px] sm:text-xs mt-0.5">Left</p>
              </div>
            </div>

            {/* Progress bar */}
            {totalTasks > 0 && (
              <div className="space-y-1.5">
                <div className="h-4 bg-white border-2 border-black w-full">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-neo-green border-r-2 border-black"
                  />
                </div>
                <p className="text-xs font-semibold text-center text-gray-700">{completedTasks} of {totalTasks} tasks completed</p>
              </div>
            )}

            {totalTasks === 0 && (
              <div className="text-center py-6 border-2 border-black bg-gray-50 p-4">
                <CheckSquare className="mx-auto h-8 w-8 mb-2 text-gray-500" strokeWidth={1.5} />
                <p className="font-black uppercase text-xs">No tasks created yet</p>
                <p className="font-medium text-xs mt-1 text-gray-600">Add tasks in the panel on the right to track your progress.</p>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Checklist Task Manager (takes 1/3 cols) */}
        <div className="space-y-4">
          
          {/* Daily study Tasks list */}
          <div className="neo-box bg-neo-yellow p-4 flex flex-col justify-between min-h-[420px]">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b-2 border-black pb-2.5">
                <h3 className="text-sm font-black flex items-center gap-2">
                  <div className="bg-white border-2 border-black p-1 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                    <CheckSquare size={16} />
                  </div>
                  Study Tasks
                </h3>
                <span className="font-black bg-white border-2 border-black px-2 py-0.5 text-xs shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
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
                  className="flex-1 neo-input text-xs py-1.5 px-2.5"
                />
                <button 
                  type="submit"
                  disabled={!taskTitle.trim()}
                  className="neo-button px-3 py-1.5 bg-neo-cyan hover:bg-white flex items-center justify-center disabled:opacity-50 text-xs font-black"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </form>

              {/* List log container */}
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 pt-1 custom-scrollbar">
                {tasks.length === 0 ? (
                  <div className="text-center py-6 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-3">
                    <CheckSquare className="mx-auto h-8 w-8 mb-1 text-gray-500" strokeWidth={1.5} />
                    <p className="font-black uppercase text-xs">No tasks yet</p>
                    <p className="font-medium text-xs mt-1 text-gray-600">Add goals like 'Revise Physics' or 'Practice MCQ'.</p>
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
                          p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between transition-all duration-200
                          ${tsk.is_completed 
                            ? 'bg-gray-200 opacity-60 line-through' 
                            : 'bg-white hover:bg-neo-cyan'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <button
                            onClick={() => toggleTask(tsk.id, !tsk.is_completed)}
                            className={`
                              h-5 w-5 border-2 border-black flex items-center justify-center cursor-pointer shrink-0
                              ${tsk.is_completed 
                                ? 'bg-black text-white' 
                                : 'bg-white hover:bg-gray-200'
                              }
                            `}
                          >
                            {tsk.is_completed && <Check size={12} strokeWidth={3} />}
                          </button>
                          <span className="font-bold truncate text-xs flex-1">{tsk.title}</span>
                        </div>

                        <button
                          onClick={() => deleteTask(tsk.id)}
                          className="p-1 bg-red-500 border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:bg-white text-white hover:text-black transition-colors"
                        >
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Target hours widget block */}
            <div className="mt-4 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-3 font-semibold text-xs flex items-start gap-2">
              <div className="bg-neo-green border-2 border-black p-1 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] shrink-0">
                <Zap size={15} strokeWidth={2.5} />
              </div>
              <span className="text-gray-800">Completing daily items boosts your learning velocity stats.</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
