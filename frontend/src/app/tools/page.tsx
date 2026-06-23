"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Award, 
  Sparkles, 
  Calendar, 
  HelpCircle, 
  Plus, 
  Check, 
  ArrowRight,
  TrendingUp,
  Brain,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useStudyStore, Flashcard, QuizQuestion } from '../../store/studyStore';
import { API_BASE } from '../../lib/api';

export default function StudyTools() {
  const {
    documents,
    flashcards,
    studyPlans,
    activePlan,
    loading,
    fetchDocuments,
    fetchFlashcards,
    generateFlashcards,
    reviewFlashcard,
    generateQuiz,
    saveQuizResult,
    generateStudyPlan,
    setActivePlan,
    isBackendOnline,
    addStudyHours
  } = useStudyStore();

  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz' | 'planner'>('flashcards');
  const [isTutorOpen, setIsTutorOpen] = useState(false);

  // Flashcards States
  const [selectedDocId, setSelectedDocId] = useState('');
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz States
  const [quizDocId, setQuizDocId] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  // Tutor States
  const [tutorTopic, setTutorTopic] = useState('');
  const [tutorDiff, setTutorDiff] = useState('medium');
  type Message = { role: 'user' | 'assistant', content: string };
  const [tutorMessages, setTutorMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingTutor, setLoadingTutor] = useState(false);

  // Planner States
  const [planTopic, setPlanTopic] = useState('');
  const [planDays, setPlanDays] = useState(5);

  useEffect(() => {
    fetchDocuments();
    fetchFlashcards();
  }, [fetchDocuments, fetchFlashcards]);

  // --- Flashcard Handlers ---
  const handleGenerateCards = async () => {
    if (!selectedDocId) return;
    await generateFlashcards(selectedDocId);
    setCurrentCardIdx(0);
    setIsFlipped(false);
    addStudyHours(0.5); // Add study session value
  };

  const handleCardReview = async (rating: 'easy' | 'hard') => {
    const activeCards = flashcards.filter(c => !selectedDocId || c.doc_id === selectedDocId);
    const card = activeCards[currentCardIdx];
    if (!card) return;

    await reviewFlashcard(card.id, rating);
    setIsFlipped(false);
    
    setTimeout(() => {
      if (currentCardIdx < activeCards.length - 1) {
        setCurrentCardIdx(currentCardIdx + 1);
      } else {
        // Loop back
        setCurrentCardIdx(0);
      }
    }, 200);
  };

  const activeCards = flashcards.filter(c => !selectedDocId || c.doc_id === selectedDocId);

  // --- Quiz Handlers ---
  const handleStartQuiz = async () => {
    if (!quizDocId) return;
    setLoadingQuiz(true);
    setIsQuizSubmitted(false);
    try {
      const q = await generateQuiz(quizDocId);
      setQuizQuestions(q);
      setUserAnswers(new Array(q.length).fill(''));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelectAnswer = (qIdx: number, val: string) => {
    setUserAnswers(prev => {
      const copy = [...prev];
      copy[qIdx] = val;
      return copy;
    });
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      const uAns = userAnswers[idx]?.trim().toLowerCase();
      const cAns = q.correct_answer?.trim().toLowerCase();
      if (q.type === 'blank') {
        if (cAns.includes(uAns) && uAns.length > 0) score++;
      } else {
        if (uAns === cAns) score++;
      }
    });

    setQuizScore(score);
    setIsQuizSubmitted(true);
    saveQuizResult(quizDocId, quizQuestions, score, quizQuestions.length);
    addStudyHours(0.8); // Add study time credit
  };

  // --- AI Tutor Handlers ---
  const handleTutorExplain = async () => {
    if (!tutorTopic.trim() || isStreaming) return;
    
    const userMessage = tutorTopic;
    setTutorMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setTutorTopic('');
    setLoadingTutor(true);

    let fullAnswer = "";

    if (isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/tutor/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ concept: userMessage, difficulty: tutorDiff })
        });
        const data = await res.json();
        fullAnswer = `### Core Explanation\n${data.explanation}\n\n### Analogy Metaphor\n${data.analogy}\n\n### Applied Case Study\n${data.example}\n\n*${data.summary}*`;
      } catch (err) {
        console.error(err);
        fullAnswer = "Sorry, I encountered an error synthesizing the explanation.";
      }
    } else {
      // Mock Tutor response
      await new Promise(resolve => setTimeout(resolve, 800)); // artificial delay
      fullAnswer = `Absolutely! Let's break down **${userMessage}**.\n\n### Core Concept\nIn computer systems and mathematics, ${userMessage} is a key framework representing structural patterns. At a ${tutorDiff} difficulty level, it involves balancing nodes, optimizing search operations, and managing resources efficiently so that overall system latency is reduced.\n\n### Real-World Analogy\nThink of ${userMessage} like organizing a massive grocery store. Instead of throwing all items into one giant pile, you categorize them into aisles, shelves, and sections so that customers don't search aimlessly. It transforms an O(N) search into an O(1) or O(log N) lookup.\n\n### Practical Example\nAn industry example includes indexing large SQL databases, caching frequent queries in Redis, or balancing network traffic under peak server load. Without ${userMessage}, the system would bottleneck entirely.\n\n*Summary: ${userMessage} improves operational efficiency by structuring loose datasets into highly optimized lookup paths.*`;
    }

    // Stream the answer
    setIsStreaming(true);
    setTutorMessages(prev => [...prev, { role: 'assistant', content: '' }]);
    
    // Typewriter effect
    const words = fullAnswer.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20)); // speed of typing
      setTutorMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].content += (i === 0 ? '' : ' ') + words[i];
        return newMsgs;
      });
    }
    
    setIsStreaming(false);
    setLoadingTutor(false);
    addStudyHours(0.4);
  };

  // --- Study Planner Handlers ---
  const handleGeneratePlan = async () => {
    if (!planTopic.trim()) return;
    await generateStudyPlan(planTopic, planDays);
    setPlanTopic('');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Study Workspace Suite
          <span className="text-xs text-indigo-400 font-semibold border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 rounded-full">AI Tools</span>
        </h1>
        <p className="text-white/50 text-sm mt-1">Select from flashcards, quizzes, custom tutoring, or visual study planning models.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex justify-between items-center border-b border-white/8 pb-1 mb-4">
        <div className="flex gap-4 overflow-x-auto">
          {[
            { id: 'flashcards', name: 'Flashcard Decks', icon: Layers },
            { id: 'quiz', name: 'Practice Quizzes', icon: HelpCircle },
            { id: 'planner', name: 'Study Planner', icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-3 font-semibold text-sm whitespace-nowrap border-b-2 cursor-pointer transition-all duration-300
                  ${isActive 
                    ? 'border-indigo-500 text-white' 
                    : 'border-transparent text-white/50 hover:text-white'
                  }
                `}
              >
                <Icon size={16} />
                {tab.name}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsTutorOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/20 whitespace-nowrap"
        >
          <Sparkles size={16} />
          <span className="hidden sm:inline">AI Tutor</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {/* FLASHCARDS TAB */}
          {activeTab === 'flashcards' && (
            <motion.div
              key="flashcards-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Generator Settings panel */}
              <div className="glass-card p-6 rounded-2xl h-fit space-y-4">
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Layers size={16} className="text-indigo-400" />
                  Flashcard Generator
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Generate active recall flashcards directly from document concepts. Cards are integrated with the Leitner Spaced Repetition box scheduler.
                </p>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs text-white/40 uppercase tracking-wider font-semibold">Select Document Source</label>
                  <select 
                    value={selectedDocId} 
                    onChange={(e) => { setSelectedDocId(e.target.value); setCurrentCardIdx(0); setIsFlipped(false); }}
                    className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/85 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Flashcard Decks</option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>{doc.filename}</option>
                    ))}
                  </select>

                  {selectedDocId && (
                    <button
                      onClick={handleGenerateCards}
                      disabled={loading}
                      className="w-full bg-gradient-primary hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-600/20 py-2.5 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loading ? 'Synthesizing Decks...' : 'Generate New Decks with AI'}
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive Flipping Card Panel */}
              <div className="lg:col-span-2 space-y-6">
                {activeCards.length === 0 ? (
                  <div className="text-center py-20 border border-white/5 rounded-2xl bg-white/3">
                    <Layers className="mx-auto text-white/10 h-10 w-10 mb-2" />
                    <p className="text-white/60 font-semibold text-sm">No flashcards in deck</p>
                    <p className="text-white/30 text-xs mt-1">Choose a document on the left and click 'Generate' to create cards.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6">
                    {/* Card container */}
                    <div 
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="w-full max-w-lg aspect-[8/5] cursor-pointer perspective-1000"
                    >
                      <motion.div 
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
                        className="w-full h-full relative preserve-3d transition-transform duration-500"
                      >
                        {/* Front Side */}
                        <div className="absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col justify-between bg-[#1E1E2E] border border-white/10 backface-hidden shadow-2xl">
                          <div className="flex justify-between items-center text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                            <span>Concept Recall Question</span>
                            <span className="bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">Box {activeCards[currentCardIdx]?.box}</span>
                          </div>
                          <p className="text-center text-lg font-bold text-white px-4">
                            {activeCards[currentCardIdx]?.question}
                          </p>
                          <div className="text-center text-xs text-white/30 font-medium tracking-wide">
                            Click to flip and view explanation
                          </div>
                        </div>

                        {/* Back Side */}
                        <div 
                          className="absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col justify-between bg-[#232336] border border-indigo-400/40 rotateY-180 backface-hidden shadow-2xl"
                        >
                          <div className="flex justify-between items-center text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                            <span>Recall Answer Explanation</span>
                            <span>Spaced Repetition Review</span>
                          </div>
                          <p className="text-center text-[15px] leading-relaxed text-white/90 px-4 overflow-y-auto max-h-[120px]">
                            {activeCards[currentCardIdx]?.answer}
                          </p>
                          <div className="text-center text-xs text-white/30 font-medium tracking-wide">
                            Click anywhere to flip back
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-4 text-xs text-white/40 font-bold">
                      <span>Card {currentCardIdx + 1} of {activeCards.length}</span>
                      <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full" style={{ width: `${((currentCardIdx + 1) / activeCards.length) * 100}%` }} />
                      </div>
                    </div>

                    {/* Spaced Repetition Box assessment rating */}
                    {isFlipped && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 max-w-sm w-full"
                      >
                        <button
                          onClick={() => handleCardReview('hard')}
                          className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 text-rose-300 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                        >
                          Forgot (Reset Box)
                        </button>
                        <button
                          onClick={() => handleCardReview('easy')}
                          className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                        >
                          Got It! (Box Up)
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* PRACTICE QUIZ TAB */}
          {activeTab === 'quiz' && (
            <motion.div
              key="quiz-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              {quizQuestions.length === 0 ? (
                /* Select document layout */
                <div className="glass-card p-8 rounded-3xl space-y-6 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-lg mx-auto">
                    <HelpCircle size={24} />
                  </div>
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h3 className="text-lg font-bold text-white">Synthesize Practice Quiz</h3>
                    <p className="text-xs text-white/50 leading-relaxed">
                      AI constructs customized MCQs, True/False, and fill-in-the-blanks directly based on document material.
                    </p>
                  </div>

                  <div className="max-w-md mx-auto space-y-3 pt-2">
                    <select 
                      value={quizDocId} 
                      onChange={(e) => setQuizDocId(e.target.value)}
                      className="w-full bg-[#030712] border border-white/10 rounded-xl px-3 py-3 text-sm text-white/85 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Choose Document --</option>
                      {documents.map((doc) => (
                        <option key={doc.id} value={doc.id}>{doc.filename}</option>
                      ))}
                    </select>

                    <button
                      onClick={handleStartQuiz}
                      disabled={loadingQuiz || !quizDocId}
                      className="w-full bg-gradient-primary hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-600/20 py-3 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loadingQuiz ? 'Parsing Text & Writing Questions...' : 'Generate Live Practice Quiz'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Active quiz questions list */
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/40 font-bold uppercase tracking-wider">Topic Practice Quiz</span>
                    <button 
                      onClick={() => setQuizQuestions([])}
                      className="text-white/40 hover:text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-white/8 hover:bg-white/5 cursor-pointer"
                    >
                      Reset Quiz
                    </button>
                  </div>

                  {quizQuestions.map((q, idx) => (
                    <div key={idx} className="glass-card p-5 rounded-2xl space-y-4 border border-white/8">
                      <div className="flex items-start gap-3">
                        <span className="h-5 w-5 bg-indigo-500/10 border border-indigo-500/20 rounded flex items-center justify-center font-bold text-xs text-indigo-400 font-mono">
                          {idx + 1}
                        </span>
                        <h4 className="text-[15px] font-bold text-white leading-relaxed">{q.question}</h4>
                      </div>

                      {/* Options selection based on type */}
                      {q.type === 'mcq' && (
                        <div className="grid grid-cols-1 gap-2 pl-8 pt-1">
                          {q.options.map((opt) => {
                            const isSelected = userAnswers[idx] === opt;
                            const isCorrect = q.correct_answer === opt;
                            const showSuccess = isQuizSubmitted && isCorrect;
                            const showDanger = isQuizSubmitted && isSelected && !isCorrect;

                            return (
                              <button
                                key={opt}
                                disabled={isQuizSubmitted}
                                onClick={() => handleSelectAnswer(idx, opt)}
                                className={`
                                  w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer
                                  ${isSelected && !isQuizSubmitted ? 'bg-indigo-600/10 border-indigo-500 text-white' : ''}
                                  ${!isSelected && !isQuizSubmitted ? 'bg-white/3 border-white/5 hover:bg-white/6 hover:border-white/10 text-white/70' : ''}
                                  ${showSuccess ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' : ''}
                                  ${showDanger ? 'bg-rose-500/10 border-rose-500 text-rose-300' : ''}
                                  ${isQuizSubmitted && !isSelected && !isCorrect ? 'opacity-40 bg-transparent border-white/5 text-white/40' : ''}
                                `}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'tf' && (
                        <div className="flex gap-3 pl-8 pt-1">
                          {['True', 'False'].map((opt) => {
                            const isSelected = userAnswers[idx] === opt;
                            const isCorrect = q.correct_answer === opt;
                            const showSuccess = isQuizSubmitted && isCorrect;
                            const showDanger = isQuizSubmitted && isSelected && !isCorrect;

                            return (
                              <button
                                key={opt}
                                disabled={isQuizSubmitted}
                                onClick={() => handleSelectAnswer(idx, opt)}
                                className={`
                                  flex-1 text-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer
                                  ${isSelected && !isQuizSubmitted ? 'bg-indigo-600/10 border-indigo-500 text-white' : ''}
                                  ${!isSelected && !isQuizSubmitted ? 'bg-white/3 border-white/5 hover:bg-white/6 hover:border-white/10 text-white/70' : ''}
                                  ${showSuccess ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300' : ''}
                                  ${showDanger ? 'bg-rose-500/10 border-rose-500 text-rose-300' : ''}
                                  ${isQuizSubmitted && !isSelected && !isCorrect ? 'opacity-40 bg-transparent border-white/5 text-white/40' : ''}
                                `}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'blank' && (
                        <div className="pl-8 pt-1">
                          <input
                            type="text"
                            disabled={isQuizSubmitted}
                            value={userAnswers[idx] || ''}
                            onChange={(e) => handleSelectAnswer(idx, e.target.value)}
                            placeholder="Type fill-in answer here..."
                            className={`
                              w-full glass-input px-3.5 py-2.5 rounded-xl text-xs
                              ${isQuizSubmitted && q.correct_answer.toLowerCase().includes(userAnswers[idx]?.toLowerCase() || '') && userAnswers[idx] ? 'border-emerald-500 text-emerald-300 bg-emerald-500/5' : ''}
                              ${isQuizSubmitted && !q.correct_answer.toLowerCase().includes(userAnswers[idx]?.toLowerCase() || '') ? 'border-rose-500 text-rose-300 bg-rose-500/5' : ''}
                            `}
                          />
                          {isQuizSubmitted && (
                            <div className="text-[10px] text-white/40 mt-1">
                              Correct answer: <span className="text-emerald-400 font-bold">{q.correct_answer}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanation box on submit */}
                      {isQuizSubmitted && (
                        <div className="bg-white/3 border-l-2 border-indigo-500 p-3 rounded-r-xl text-xs text-white/60 leading-relaxed pl-8">
                          <span className="font-bold text-white text-[10px] uppercase tracking-wider block mb-1">AI Explanation</span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Submission and score drawer */}
                  {!isQuizSubmitted ? (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={userAnswers.includes('')}
                      className="w-full bg-gradient-primary hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-600/20 py-3.5 rounded-2xl font-semibold text-xs text-white transition-all cursor-pointer disabled:opacity-50"
                    >
                      Submit Answers for Grading
                    </button>
                  ) : (
                    <div className="glass-card p-6 rounded-3xl border border-indigo-500/35 bg-indigo-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center sm:text-left">
                        <h4 className="text-lg font-bold text-white">Quiz Synthesized Result</h4>
                        <p className="text-xs text-white/50">Your responses have been graded and logged in Analytics.</p>
                      </div>
                      <div className="text-3xl font-extrabold text-white bg-indigo-500/20 px-6 py-3 rounded-2xl border border-indigo-500/30">
                        {quizScore} / {quizQuestions.length} Correct
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}


          {/* STUDY PLANNER TAB */}
          {activeTab === 'planner' && (
            <motion.div
              key="planner-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Creator Settings Panel */}
              <div className="glass-card p-6 rounded-2xl h-fit space-y-4">
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-400" />
                  Planner Generator
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Design a customized checklist study plan mapping daily timelines and goals for any topic.
                </p>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Study Subject/Goal</label>
                    <input 
                      type="text" 
                      value={planTopic}
                      onChange={(e) => setPlanTopic(e.target.value)}
                      placeholder="e.g. Quantum Physics basics, Calculus limits"
                      className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Plan Duration: {planDays} Days</label>
                    <input
                      type="range"
                      min="3"
                      max="14"
                      value={planDays}
                      onChange={(e) => setPlanDays(Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                    />
                  </div>

                  <button
                    onClick={handleGeneratePlan}
                    disabled={loading || !planTopic.trim()}
                    className="w-full bg-gradient-primary hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-600/20 py-2.5 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Synthesizing Roadmap...' : 'Construct Study Plan'}
                  </button>
                </div>

                {/* Available plans drawer list */}
                {studyPlans.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <label className="block text-[9px] text-white/40 uppercase tracking-wider font-semibold mb-2">Saved Roadmaps</label>
                    {studyPlans.map((pl) => (
                      <button
                        key={pl.id}
                        onClick={() => setActivePlan(pl)}
                        className={`
                          w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs font-bold transition-all cursor-pointer
                          ${activePlan?.id === pl.id 
                            ? 'bg-indigo-600/15 border-indigo-500/50 text-white' 
                            : 'bg-white/3 border-white/5 text-white/60 hover:text-white'
                          }
                        `}
                      >
                        <span className="truncate max-w-[120px]">{pl.topic}</span>
                        <span className="text-[10px] text-white/40">{pl.duration_days} days</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Plan Dashboard */}
              <div className="lg:col-span-2 space-y-6">
                {!activePlan ? (
                  <div className="text-center py-20 border border-white/5 rounded-2xl bg-white/3">
                    <Calendar className="mx-auto text-white/10 h-10 w-10 mb-2" />
                    <p className="text-white/60 font-semibold text-sm">No active planner</p>
                    <p className="text-white/30 text-xs mt-1">Configure study goals on the left to synthesize a structured day-by-day checklist.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="border-b border-white/5 pb-3">
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Roadmap Study Plan</span>
                      <h4 className="text-lg font-bold text-white mt-0.5">{activePlan.topic} Plan</h4>
                    </div>

                    <div className="space-y-4">
                      {activePlan.plan.map((item) => (
                        <div key={item.day} className="glass-card p-5 rounded-2xl border border-white/8 relative">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider font-mono">Day {item.day} of {activePlan.duration_days}</span>
                              <h5 className="font-bold text-white text-md mt-0.5">{item.title}</h5>
                            </div>
                            <span className="bg-white/5 border border-white/8 text-[10px] text-white/50 px-2 py-0.5 rounded-full font-mono">
                              {item.time_needed} mins
                            </span>
                          </div>

                          <div className="space-y-1.5 pl-2">
                            {item.tasks.map((task, tIdx) => (
                              <div key={tIdx} className="flex gap-2.5 items-center text-xs text-white/70">
                                <div className="h-4 w-4 border border-white/10 rounded flex items-center justify-center flex-shrink-0 bg-white/3">
                                  <Check size={10} className="text-transparent" />
                                </div>
                                <span>{task}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* AI TUTOR SLIDE BAR */}
      <AnimatePresence>
        {isTutorOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTutorOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full max-w-md bg-[#0A0A0F] border-l border-white/10 shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="bg-[#13111E] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <Brain className="text-indigo-400" size={20} />
                  <div>
                    <h3 className="font-bold text-white text-sm">Gemini Tutor</h3>
                    <p className="text-[10px] text-white/50">Ask me to break down any concept.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select 
                    value={tutorDiff}
                    onChange={(e) => setTutorDiff(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white/70 text-[10px] px-2 py-1.5 rounded-lg focus:outline-none cursor-pointer hidden sm:block"
                  >
                    <option value="easy">Beginner</option>
                    <option value="medium">Intermediate</option>
                    <option value="hard">Elite</option>
                  </select>
                  <button 
                    onClick={() => setIsTutorOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors border border-transparent hover:border-white/10"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
                {tutorMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                    <Brain size={48} className="text-indigo-400 mb-4" />
                    <h4 className="text-white font-bold mb-2">What do you want to learn?</h4>
                    <p className="text-xs text-white/60 max-w-sm">Type a concept below, and I'll break it down using analogies and practical examples.</p>
                  </div>
                ) : (
                  tutorMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-[#1E1E2E] text-white/90 border border-white/5 rounded-tl-sm'}`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                            <Sparkles size={12} /> AI Tutor
                          </div>
                        )}
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                          {isStreaming && idx === tutorMessages.length - 1 && (
                            <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-1 align-middle" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-[#13111E] border-t border-white/10 shrink-0 pb-6">
                <div className="flex items-center gap-3 bg-[#0A0A0F] border border-white/10 rounded-2xl px-3 py-2.5 focus-within:border-indigo-500 transition-colors shadow-inner">
                  <input
                    type="text"
                    value={tutorTopic}
                    onChange={(e) => setTutorTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTutorExplain()}
                    placeholder="Message AI Tutor..."
                    disabled={loadingTutor || isStreaming}
                    className="flex-1 bg-transparent border-none px-2 text-sm text-white focus:outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={handleTutorExplain}
                    disabled={!tutorTopic.trim() || loadingTutor || isStreaming}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/30 disabled:text-white/30 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-colors shadow-md"
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
                <div className="text-center mt-2 text-[10px] text-white/30">
                  AI Tutor can make mistakes. Verify important information.
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
