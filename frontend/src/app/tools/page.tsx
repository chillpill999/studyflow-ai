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

  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz' | 'tutor' | 'planner'>('flashcards');

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
  const [tutorOutput, setTutorOutput] = useState<any | null>(null);
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
    if (!tutorTopic.trim()) return;
    setLoadingTutor(true);
    setTutorOutput(null);

    if (isBackendOnline) {
      try {
        const res = await fetch(`${API_BASE}/tutor/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ concept: tutorTopic, difficulty: tutorDiff })
        });
        const data = await res.json();
        setTutorOutput(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTutor(false);
      }
    } else {
      // Mock Tutor response
      setTimeout(() => {
        setTutorOutput({
          explanation: `In computer systems and mathematics, ${tutorTopic} is a key framework representing structural patterns. At a ${tutorDiff} difficulty, it involves balancing nodes, optimizing search operations, and managing resources efficiently.`,
          analogy: `Think of ${tutorTopic} like organizing a grocery store: categorizing shelves into aisles so that customers don't search aimlessly.`,
          example: `An industry example includes indexing databases, caching queries, or balancing network traffic under peak server load.`,
          summary: `Summary: ${tutorTopic} improves operational efficiency by structuring loose datasets.`
        });
        setLoadingTutor(false);
        addStudyHours(0.4);
      }, 1000);
    }
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
      <div className="flex border-b border-white/8 gap-4 overflow-x-auto pb-1">
        {[
          { id: 'flashcards', name: 'Flashcard Decks', icon: Layers },
          { id: 'quiz', name: 'Practice Quizzes', icon: HelpCircle },
          { id: 'tutor', name: 'AI Tutor Explainer', icon: Brain },
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
                        <div className="absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col justify-between glass-card border border-white/10 backface-hidden shadow-2xl">
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
                          className="absolute inset-0 w-full h-full rounded-2xl p-6 flex flex-col justify-between glass-card border border-indigo-400/40 bg-indigo-500/5 rotateY-180 backface-hidden shadow-2xl"
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

          {/* AI TUTOR TAB */}
          {activeTab === 'tutor' && (
            <motion.div
              key="tutor-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <div className="glass-card p-6 rounded-3xl space-y-4">
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Brain size={16} className="text-indigo-400" />
                  Gemini Explainer Interface
                </h3>
                <p className="text-xs text-white/50">
                  Input any complex concept. The AI Tutor explains the idea, applies analogies, and displays code or calculations.
                </p>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Concept to Explain</label>
                    <input 
                      type="text" 
                      value={tutorTopic}
                      onChange={(e) => setTutorTopic(e.target.value)}
                      placeholder="e.g. Quantum Entanglement, Dijkstra's algorithm, DNA replication"
                      className="w-full glass-input px-4 py-3 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Cognitive Depth / Difficulty</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'easy', label: 'Beginner (Analogies)' },
                        { id: 'medium', label: 'Intermediate' },
                        { id: 'hard', label: 'Elite (Rigorous)' }
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          onClick={() => setTutorDiff(lvl.id)}
                          className={`
                            p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all
                            ${tutorDiff === lvl.id 
                              ? 'bg-indigo-600/10 border-indigo-500 text-white' 
                              : 'bg-white/3 border-white/5 hover:bg-white/6 text-white/60'
                            }
                          `}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleTutorExplain}
                    disabled={loadingTutor || !tutorTopic.trim()}
                    className="w-full bg-gradient-primary hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-600/20 py-3 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loadingTutor ? 'Synthesizing Explanation...' : 'Explain with AI Tutor'}
                  </button>
                </div>
              </div>

              {/* Explainer Output Card */}
              {tutorOutput && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 rounded-3xl space-y-5 border border-white/8"
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">Tutor Synthesizer Outputs</span>
                    <span className="text-[10px] text-white/40 border border-white/10 rounded px-1.5 py-0.5 uppercase">{tutorDiff} depth</span>
                  </div>

                  <div className="space-y-4 text-sm leading-relaxed text-white/70">
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider text-white/40 mb-1.5">Core Explanation</h4>
                      <p className="bg-white/3 border border-white/5 p-4 rounded-xl text-white/80">{tutorOutput.explanation}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-xl">
                        <h5 className="font-bold text-cyan-400 text-xs uppercase tracking-wider mb-1">Analogy Metaphor</h5>
                        <p className="text-xs text-white/70 mt-1">{tutorOutput.analogy}</p>
                      </div>
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl">
                        <h5 className="font-bold text-emerald-400 text-xs uppercase tracking-wider mb-1">Applied Case Study</h5>
                        <p className="text-xs text-white/70 mt-1">{tutorOutput.example}</p>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 text-xs text-white/40 italic">
                      {tutorOutput.summary}
                    </div>
                  </div>
                </motion.div>
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

    </div>
  );
}
