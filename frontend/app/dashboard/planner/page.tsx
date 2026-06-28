'use client';

import React, { useState, useEffect } from 'react';
import { useStore, StudyTask } from 'src/store/useStore';
import { GlassCard } from 'src/components/GlassCard';
import { apiClient } from 'src/lib/axios';
import { 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ArrowRight,
  RefreshCcw
} from 'lucide-react';

export default function PlannerPage() {
  const { documents, tasks, setTasks, activeDocument } = useStore();
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  
  // Planner configurations
  const [examDate, setExamDate] = useState<string>('');
  const [studyHours, setStudyHours] = useState<number>(2.0);
  const [loading, setLoading] = useState<boolean>(false);

  // Manual task creations
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDesc, setTaskDesc] = useState<string>('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [taskDueDate, setTaskDueDate] = useState<string>('');

  const fetchTasks = useCallback(async () => {
    try {
      const res = await apiClient.get('/planner/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load tasks', err);
    }
  }, [setTasks]);

  useEffect(() => {
    setTimeout(() => {
      fetchTasks();
    }, 0);
    if (activeDocument) {
      setTimeout(() => setSelectedDocId(activeDocument.id), 0);
    } else if (documents.length > 0) {
      setTimeout(() => setSelectedDocId(documents[0].id), 0);
    }
  }, [activeDocument, documents, fetchTasks]);

  const handleGeneratePlan = async () => {
    if (!selectedDocId || !examDate) {
      alert('Please select a document and specify your exam date.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/planner/generate', {
        document_id: selectedDocId,
        exam_date: examDate,
        available_hours: studyHours
      });
      setTasks(res.data);
      alert(`Success! Generated ${res.data.length} task milestones for your study plan.`);
    } catch (err) {
      console.error('Plan generation error', err);
      alert('Failed to generate AI study plan. Check backend service configs.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle) return;
    try {
      const res = await apiClient.post('/planner/tasks', {
        title: taskTitle,
        description: taskDesc,
        status: 'todo',
        priority: taskPriority,
        due_date: taskDueDate || null,
        ai_source_doc: selectedDocId || null
      });
      setTasks([res.data, ...tasks]);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create manual task', err);
    }
  };

  const handleStatusTransition = async (id: string, currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      'todo': 'in-progress',
      'in-progress': 'done',
      'done': 'todo'
    };
    const nextStatus = nextStatusMap[currentStatus] || 'todo';
    try {
      const res = await apiClient.patch(`/planner/tasks/${id}`, { status: nextStatus });
      setTasks(tasks.map(t => t.id === id ? res.data : t));
    } catch (err) {
      console.error('Failed to shift task status', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this study task?')) return;
    try {
      await apiClient.delete(`/planner/tasks/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  // Group tasks
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-40px)] z-10 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-purple-950">AI Study Planner</h1>
          <p className="text-purple-950/60 mt-1">Structure study modules, track milestones, and manage tasks leading to exam dates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Scheduler controls sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <GlassCard className="p-5 space-y-4">
            <h2 className="text-sm font-semibold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={16} className="text-[#B998D2]" />
              Schedule Study Plan
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-purple-950/70">Source Document</label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white/60 border border-white/40 rounded-xl text-sm font-sans focus:outline-none text-purple-950"
                >
                  <option value="">-- Choose Syllabus PDF --</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.file_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-purple-950/70">Target Exam Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white/60 border border-white/40 rounded-xl text-sm font-sans focus:outline-none text-purple-950"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-purple-950/70">Daily Study Budget (Hours)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={studyHours}
                  onChange={(e) => setStudyHours(parseFloat(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-white/60 border border-white/40 rounded-xl text-sm font-sans focus:outline-none text-purple-950"
                />
              </div>

              <button
                disabled={loading || !selectedDocId || !examDate}
                onClick={handleGeneratePlan}
                className="w-full mt-2 bg-purple-950 text-white font-sans font-medium text-xs py-2.5 rounded-xl hover:bg-purple-900 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Calendar size={14} />
                    Generate Syllabus Timeline
                  </>
                )}
              </button>
            </div>
          </GlassCard>

          <GlassCard className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-purple-950 uppercase tracking-wider">Quick Actions</h3>
            <button
              onClick={() => setIsCreating(true)}
              className="w-full bg-white/60 hover:bg-white/80 border border-white/40 text-purple-950 font-sans font-medium text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus size={14} />
              Add Custom Task
            </button>
          </GlassCard>
        </div>

        {/* Task lists / Kanban layout */}
        <div className="lg:col-span-3 space-y-6">
          {/* Custom creation form overlay */}
          {isCreating && (
            <GlassCard className="p-5 space-y-4 border-purple-950/10">
              <h3 className="text-md font-serif font-semibold text-purple-950">Add Custom Study Task</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <input
                    placeholder="Task Title (e.g. Read Physics Chapter 3)"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-white/60 border border-white/40 rounded-xl px-3 py-2 text-sm font-sans focus:outline-none text-purple-950"
                  />
                </div>
                <div className="col-span-2">
                  <textarea
                    placeholder="Requirements/Description details..."
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="w-full bg-white/60 border border-white/40 rounded-xl px-3 py-2 text-sm font-sans focus:outline-none text-purple-950 h-20 resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-purple-950/60 block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTaskPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                    className="w-full bg-white/60 border border-white/40 rounded-xl px-3 py-2 text-xs font-sans text-purple-950 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-purple-950/60 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-white/60 border border-white/40 rounded-xl px-3 py-2 text-xs font-sans text-purple-950 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-purple-950/60 hover:text-purple-950 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  className="bg-purple-950 text-white text-xs font-medium px-4 py-2 rounded-xl shadow-sm"
                >
                  Save Task
                </button>
              </div>
            </GlassCard>
          )}

          {/* Kanban columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* TO DO */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-purple-950/10 pb-2">
                <h3 className="text-sm font-serif font-bold text-purple-950 flex items-center gap-1.5">
                  <AlertCircle size={15} className="text-red-500" />
                  To Do
                </h3>
                <span className="bg-white/60 border border-white/40 text-[10px] font-sans font-semibold text-purple-950 px-2 py-0.5 rounded-full">
                  {todoTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {todoTasks.map(task => (
                  <TaskCard key={task.id} task={task} onTransition={handleStatusTransition} onDelete={handleDeleteTask} />
                ))}
              </div>
            </div>

            {/* IN PROGRESS */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-purple-950/10 pb-2">
                <h3 className="text-sm font-serif font-bold text-purple-950 flex items-center gap-1.5">
                  <Clock size={15} className="text-orange-500" />
                  In Progress
                </h3>
                <span className="bg-white/60 border border-white/40 text-[10px] font-sans font-semibold text-purple-950 px-2 py-0.5 rounded-full">
                  {inProgressTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {inProgressTasks.map(task => (
                  <TaskCard key={task.id} task={task} onTransition={handleStatusTransition} onDelete={handleDeleteTask} />
                ))}
              </div>
            </div>

            {/* DONE */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-purple-950/10 pb-2">
                <h3 className="text-sm font-serif font-bold text-purple-950 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-green-600" />
                  Completed
                </h3>
                <span className="bg-white/60 border border-white/40 text-[10px] font-sans font-semibold text-purple-950 px-2 py-0.5 rounded-full">
                  {doneTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                {doneTasks.map(task => (
                  <TaskCard key={task.id} task={task} onTransition={handleStatusTransition} onDelete={handleDeleteTask} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: StudyTask;
  onTransition: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onTransition, onDelete }) => {
  const priorityColor = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
    none: 'bg-gray-100 text-gray-700'
  };

  return (
    <GlassCard className="p-4 space-y-3 hoverable border-white/40">
      <div className="flex justify-between items-start gap-2">
        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${priorityColor[task.priority]}`}>
          {task.priority}
        </span>
        <button
          onClick={() => onDelete(task.id)}
          className="text-purple-950/40 hover:text-red-600 transition-colors p-1"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div>
        <h4 className="text-xs font-sans font-bold text-purple-950 leading-snug">{task.title}</h4>
        {task.description && (
          <p className="text-[10px] text-purple-950/60 mt-1 select-text line-clamp-2">{task.description}</p>
        )}
      </div>

      <div className="flex justify-between items-center border-t border-white/10 pt-2 text-[10px] text-purple-950/50">
        <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No limit'}</span>
        <button
          onClick={() => onTransition(task.id, task.status)}
          className="bg-white/60 hover:bg-white/90 text-purple-950 border border-white/40 px-2.5 py-1 rounded-lg flex items-center gap-1 text-[9px] font-semibold transition-all shadow-sm"
        >
          {task.status === 'done' ? (
            <>
              Reset
              <RefreshCcw size={8} />
            </>
          ) : (
            <>
              Next
              <ArrowRight size={8} />
            </>
          )}
        </button>
      </div>
    </GlassCard>
  );
};
