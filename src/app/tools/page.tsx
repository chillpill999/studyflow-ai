"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  HelpCircle, 
  Check, 
  Layers,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { useStudyStore, QuizQuestion } from '../../store/studyStore';

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
    addStudyHours
  } = useStudyStore();
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz' | 'planner'>('flashcards');

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

  // --- Study Planner Handlers ---
  const handleGeneratePlan = async () => {
    if (!planTopic.trim()) return;
    await generateStudyPlan(planTopic, planDays);
    setPlanTopic('');
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl mx-auto pb-8 text-black">
      
      {/* Title */}
      <div className="bg-neo-magenta border-2 border-black p-3.5 sm:p-4 shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2 sm:gap-3">
          Workspace Suite
          <span className="text-[11px] sm:text-xs bg-white border-2 border-black px-2 py-0.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] font-bold">AI Tools</span>
        </h1>
        <p className="font-medium mt-1 text-xs sm:text-sm">Select from flashcards, quizzes, custom tutoring, or visual study planning models.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b-2 border-black pb-0 mb-4 sm:mb-5 bg-white border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex w-full overflow-x-auto custom-scrollbar">
          {[
            { id: 'flashcards', name: 'Flashcards', full: 'Flashcard Decks', icon: Layers, color: 'bg-neo-cyan' },
            { id: 'quiz', name: 'Quizzes', full: 'Practice Quizzes', icon: HelpCircle, color: 'bg-neo-yellow' },
            { id: 'planner', name: 'Planner', full: 'Study Planner', icon: Calendar, color: 'bg-neo-green' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'flashcards' | 'quiz' | 'planner')}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 font-black uppercase text-xs sm:text-sm border-r-2 border-black last:border-r-0 cursor-pointer transition-colors whitespace-nowrap
                  ${isActive 
                    ? `${tab.color} border-b-2 border-b-black shadow-[inset_0_-2px_0_0_rgba(0,0,0,1)]` 
                    : 'bg-white hover:bg-gray-100'
                  }
                `}
              >
                <Icon size={15} strokeWidth={2.5} />
                <span className="sm:hidden">{tab.name}</span>
                <span className="hidden sm:inline">{tab.full}</span>
              </button>
            );
          })}
        </div>
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
              className="grid grid-cols-1 lg:grid-cols-3 gap-5"
            >
              {/* Generator Settings panel */}
              <div className="neo-box bg-white p-4 h-fit space-y-4">
                <h3 className="text-base font-black uppercase flex items-center gap-2 border-b-2 border-black pb-2.5">
                  <div className="bg-neo-cyan border-2 border-black p-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                    <Layers size={16} strokeWidth={2.5} />
                  </div>
                  Generator
                </h3>
                <p className="font-medium text-xs leading-relaxed text-gray-700">
                  Generate active recall flashcards directly from document concepts. Cards are integrated with the Leitner Spaced Repetition box scheduler.
                </p>

                <div className="space-y-3 pt-3 border-t-2 border-black mt-3">
                  <label className="block font-black uppercase text-xs">Select Document Source</label>
                  <select 
                    value={selectedDocId} 
                    onChange={(e) => { setSelectedDocId(e.target.value); setCurrentCardIdx(0); setIsFlipped(false); }}
                    className="w-full neo-input text-xs py-1.5 px-2.5"
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
                      className="neo-button w-full bg-neo-magenta hover:bg-white flex justify-center py-2 text-xs font-black disabled:opacity-50 mt-3"
                    >
                      {loading ? 'Synthesizing...' : 'Generate Decks'}
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive Flipping Card Panel */}
              <div className="lg:col-span-2 space-y-4">
                {activeCards.length === 0 ? (
                  <div className="neo-box bg-neo-yellow p-8 text-center flex flex-col items-center">
                    <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-4">
                      <Layers className="h-10 w-10" strokeWidth={2} />
                    </div>
                    <p className="text-lg font-black uppercase mb-1">No flashcards in deck</p>
                    <p className="font-medium text-xs max-w-sm text-gray-700">Choose a document on the left and click 'Generate' to create cards.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    {/* Card container */}
                    <div 
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="w-full max-w-xl min-h-[260px] sm:min-h-[320px] cursor-pointer perspective-1000 group relative"
                    >
                      <motion.div 
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="w-full h-full relative preserve-3d transition-transform duration-500"
                      >
                        {/* Front Side */}
                        <div className="absolute inset-0 w-full h-full neo-box bg-white p-4 sm:p-6 flex flex-col justify-between backface-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                          
                          <div className="flex justify-between items-center font-black uppercase border-b-2 border-black pb-2.5">
                            <span className="flex items-center gap-1.5 bg-neo-cyan border-2 border-black px-2 py-0.5 text-xs shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                              <Layers size={14} strokeWidth={2.5} /> Concept
                            </span>
                            <span className="bg-neo-magenta border-2 border-black px-2 py-0.5 text-[11px] sm:text-xs text-white shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                              Box {activeCards[currentCardIdx]?.box}
                            </span>
                          </div>
                          
                          <div className="flex-1 flex items-center justify-center overflow-y-auto my-3 sm:my-4 custom-scrollbar">
                            <p className="text-center text-base sm:text-xl font-black uppercase leading-tight">
                              {activeCards[currentCardIdx]?.question}
                            </p>
                          </div>
                          
                          <div className="text-center font-bold uppercase flex items-center justify-center gap-2 border-t-2 border-black pt-2 sm:pt-2.5 bg-neo-yellow border-2 p-1.5 text-xs shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:bg-white transition-colors">
                            <RefreshCw size={14} strokeWidth={2.5} /> Click to reveal answer
                          </div>
                        </div>

                        {/* Back Side */}
                        <div 
                          className="absolute inset-0 w-full h-full neo-box bg-neo-green p-4 sm:p-6 flex flex-col justify-between backface-hidden rotateY-180 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        >
                          
                          <div className="flex justify-between items-center font-black uppercase border-b-2 border-black pb-2.5">
                            <span className="flex items-center gap-1.5 bg-white border-2 border-black px-2 py-0.5 text-xs shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                              <Sparkles size={14} strokeWidth={2.5} /> Answer
                            </span>
                            <span className="bg-white border-2 border-black px-2 py-0.5 text-[11px] sm:text-xs shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                              Spaced Repetition
                            </span>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto my-3 sm:my-4 text-left text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap custom-scrollbar bg-white border-2 border-black p-3 sm:p-3.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {activeCards[currentCardIdx]?.answer}
                          </div>
                          
                          <div className="text-center font-black uppercase border-t-2 border-black pt-2 text-xs">
                            Click anywhere to flip back
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-4 font-black uppercase w-full max-w-xl bg-white border-2 border-black p-2.5 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="whitespace-nowrap">Card {currentCardIdx + 1} / {activeCards.length}</span>
                      <div className="flex-1 h-3.5 bg-white border-2 border-black overflow-hidden relative shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.15)]">
                        <div className="bg-neo-magenta h-full transition-all duration-500 border-r-2 border-black" style={{ width: `${((currentCardIdx + 1) / activeCards.length) * 100}%` }} />
                      </div>
                    </div>

                    {/* Spaced Repetition Box assessment rating */}
                    {isFlipped && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="flex gap-4 w-full max-w-xl"
                      >
                        <button
                          onClick={() => handleCardReview('hard')}
                          className="neo-button flex-1 py-2 bg-red-500 hover:bg-white text-white hover:text-black flex justify-center items-center gap-2 text-xs font-black"
                        >
                          <X size={16} strokeWidth={3} /> 
                          <span>Hard</span>
                        </button>
                        <button
                          onClick={() => handleCardReview('easy')}
                          className="neo-button flex-1 py-2 bg-neo-cyan hover:bg-white text-black flex justify-center items-center gap-2 text-xs font-black"
                        >
                          <Check size={16} strokeWidth={3} /> 
                          <span>Easy</span>
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
              className="max-w-3xl mx-auto space-y-5"
            >
              {quizQuestions.length === 0 ? (
                /* Select document layout */
                <div className="neo-box bg-neo-yellow p-8 text-center flex flex-col items-center">
                  <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-4">
                    <HelpCircle size={28} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-2 max-w-sm mx-auto mb-5 border-b-2 border-black pb-4">
                    <h3 className="text-xl font-black uppercase">Synthesize Quiz</h3>
                    <p className="font-medium text-xs text-gray-700">
                      AI constructs customized MCQs, True/False, and fill-in-the-blanks directly based on document material.
                    </p>
                  </div>

                  <div className="w-full max-w-sm mx-auto space-y-3">
                    <select 
                      value={quizDocId} 
                      onChange={(e) => setQuizDocId(e.target.value)}
                      className="w-full neo-input py-2 text-xs"
                    >
                      <option value="">-- Choose Document --</option>
                      {documents.map((doc) => (
                        <option key={doc.id} value={doc.id}>{doc.filename}</option>
                      ))}
                    </select>

                    <button
                      onClick={handleStartQuiz}
                      disabled={loadingQuiz || !quizDocId}
                      className="neo-button w-full bg-neo-cyan hover:bg-white py-2 text-xs font-black disabled:opacity-50"
                    >
                      {loadingQuiz ? 'Writing Questions...' : 'Generate Quiz'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Active quiz questions list */
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-sm font-black uppercase">Practice Quiz</span>
                    <button 
                      onClick={() => setQuizQuestions([])}
                      className="neo-button bg-red-500 hover:bg-white text-white hover:text-black py-1 px-3 text-xs font-black"
                    >
                      Reset Quiz
                    </button>
                  </div>

                  {quizQuestions.map((q, idx) => (
                    <div key={idx} className="neo-box bg-white p-4 space-y-4">
                      <div className="flex items-start gap-3 border-b-2 border-black pb-3">
                        <span className="h-7 w-7 bg-neo-magenta border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-black text-xs text-white shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm sm:text-base font-black uppercase leading-tight pt-0.5">{q.question}</h4>
                      </div>

                      {/* Options selection based on type */}
                      {q.type === 'mcq' && (
                        <div className="grid grid-cols-1 gap-2 pl-0 sm:pl-10">
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
                                  w-full text-left p-2.5 border-2 border-black font-semibold text-xs sm:text-sm transition-all
                                  ${isSelected && !isQuizSubmitted ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
                                  ${!isSelected && !isQuizSubmitted ? 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-cyan hover:-translate-y-0.5' : ''}
                                  ${showSuccess ? 'bg-neo-green text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
                                  ${showDanger ? 'bg-red-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
                                  ${isQuizSubmitted && !isSelected && !isCorrect ? 'opacity-50 bg-gray-200' : ''}
                                `}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'tf' && (
                        <div className="flex gap-3 pl-0 sm:pl-10">
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
                                  flex-1 text-center p-3 border-2 border-black font-black text-sm uppercase transition-all
                                  ${isSelected && !isQuizSubmitted ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
                                  ${!isSelected && !isQuizSubmitted ? 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-yellow hover:-translate-y-0.5' : ''}
                                  ${showSuccess ? 'bg-neo-green text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
                                  ${showDanger ? 'bg-red-500 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
                                  ${isQuizSubmitted && !isSelected && !isCorrect ? 'opacity-50 bg-gray-200' : ''}
                                `}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'blank' && (
                        <div className="pl-0 sm:pl-10 space-y-2">
                          <input
                            type="text"
                            disabled={isQuizSubmitted}
                            value={userAnswers[idx] || ''}
                            onChange={(e) => handleSelectAnswer(idx, e.target.value)}
                            placeholder="Type your answer here..."
                            className={`
                              w-full neo-input py-2 text-xs sm:text-sm
                              ${isQuizSubmitted && q.correct_answer.toLowerCase().includes(userAnswers[idx]?.toLowerCase() || '') && userAnswers[idx] ? 'bg-neo-green' : ''}
                              ${isQuizSubmitted && !q.correct_answer.toLowerCase().includes(userAnswers[idx]?.toLowerCase() || '') ? 'bg-red-500 text-white' : ''}
                            `}
                          />
                          {isQuizSubmitted && (
                            <div className="bg-black text-white border-2 border-black p-2 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              Correct answer: <span className="text-neo-cyan">{q.correct_answer}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanation box on submit */}
                      {isQuizSubmitted && (
                        <div className="mt-3 bg-neo-yellow border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] pl-3 sm:pl-10 ml-0 sm:ml-10">
                          <span className="font-black text-black uppercase block mb-1 text-xs border-b-2 border-black pb-1 inline-block">Explanation</span>
                          <p className="font-medium text-xs leading-relaxed text-black">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Submission and score drawer */}
                  {!isQuizSubmitted ? (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={userAnswers.includes('')}
                      className="neo-button w-full bg-neo-magenta hover:bg-white py-2.5 text-xs sm:text-sm font-black disabled:opacity-50 text-white hover:text-black"
                    >
                      Submit Answers
                    </button>
                  ) : (
                    <div className="neo-box bg-neo-cyan p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center sm:text-left">
                        <h4 className="text-lg font-black uppercase">Quiz Result</h4>
                        <p className="font-medium text-xs">Your responses have been graded and logged in Analytics.</p>
                      </div>
                      <div className="text-2xl font-black bg-white border-2 border-black px-5 py-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
                        {quizScore} / {quizQuestions.length}
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
              className="grid grid-cols-1 lg:grid-cols-3 gap-5"
            >
              {/* Creator Settings Panel */}
              <div className="neo-box bg-white p-4 h-fit space-y-4">
                <h3 className="text-base font-black uppercase flex items-center gap-2 border-b-2 border-black pb-2.5">
                  <div className="bg-neo-green border-2 border-black p-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                    <Calendar size={16} strokeWidth={2.5} />
                  </div>
                  Planner
                </h3>
                <p className="font-medium text-xs leading-relaxed text-gray-700">
                  Design a customized checklist study plan mapping daily timelines and goals for any topic.
                </p>

                <div className="space-y-3 pt-3 border-t-2 border-black">
                  <div>
                    <label className="block font-black uppercase text-xs mb-1">Study Subject/Goal</label>
                    <input 
                      type="text" 
                      value={planTopic}
                      onChange={(e) => setPlanTopic(e.target.value)}
                      placeholder="e.g. Quantum Physics basics"
                      className="w-full neo-input text-xs py-1.5 px-2.5"
                    />
                  </div>

                  <div>
                    <label className="block font-black uppercase text-xs mb-2">Duration: {planDays} Days</label>
                    <input
                      type="range"
                      min="3"
                      max="14"
                      value={planDays}
                      onChange={(e) => setPlanDays(Number(e.target.value))}
                      className="w-full h-3 bg-white border-2 border-black rounded-none appearance-none cursor-pointer accent-black"
                    />
                  </div>

                  <button
                    onClick={handleGeneratePlan}
                    disabled={loading || !planTopic.trim()}
                    className="neo-button w-full bg-neo-yellow hover:bg-white py-2 text-xs font-black flex justify-center disabled:opacity-50"
                  >
                    {loading ? 'Synthesizing...' : 'Construct Plan'}
                  </button>
                </div>

                {/* Available plans drawer list */}
                {studyPlans.length > 0 && (
                  <div className="space-y-2 pt-3 border-t-2 border-black mt-3">
                    <label className="block font-black uppercase text-xs mb-2">Saved Roadmaps</label>
                    {studyPlans.map((pl) => (
                      <button
                        key={pl.id}
                        onClick={() => setActivePlan(pl)}
                        className={`
                          w-full flex items-center justify-between p-2.5 border-2 border-black text-left font-bold text-xs transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                          ${activePlan?.id === pl.id 
                            ? 'bg-black text-white translate-x-1 translate-y-1 shadow-none' 
                            : 'bg-white hover:bg-neo-cyan'
                          }
                        `}
                      >
                        <span className="truncate max-w-[150px] uppercase">{pl.topic}</span>
                        <span className={`px-1.5 py-0.5 border-2 font-black text-[10px] ${activePlan?.id === pl.id ? 'bg-white text-black border-black' : 'bg-black text-white border-white'}`}>
                          {pl.duration_days}D
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Plan Dashboard */}
              <div className="lg:col-span-2 space-y-4">
                {!activePlan ? (
                  <div className="neo-box bg-neo-cyan p-8 text-center flex flex-col items-center">
                    <div className="bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-4">
                      <Calendar className="h-10 w-10" strokeWidth={2} />
                    </div>
                    <p className="text-lg font-black uppercase mb-1">No active planner</p>
                    <p className="font-medium text-xs max-w-sm text-gray-700">Configure study goals on the left to synthesize a structured day-by-day checklist.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white border-2 border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span className="font-black bg-neo-green border-2 border-black px-2 py-0.5 text-[10px] shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] mb-2 inline-block">Roadmap Plan</span>
                      <h4 className="text-lg sm:text-xl font-black uppercase">{activePlan.topic} Plan</h4>
                    </div>

                    <div className="space-y-3">
                      {activePlan.plan.map((item) => (
                        <div key={item.day} className="neo-box bg-white p-4 relative">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 border-b-2 border-black pb-2.5 gap-2">
                            <div>
                              <span className="font-black text-xs bg-black text-white px-2 py-0.5 uppercase shadow-[2px_2px_0px_0px_rgba(0,255,255,1)]">Day {item.day} of {activePlan.duration_days}</span>
                              <h5 className="font-black text-sm sm:text-base uppercase mt-2">{item.title}</h5>
                            </div>
                            <span className="bg-neo-yellow border-2 border-black font-black text-xs px-2.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                              {item.time_needed} MINS
                            </span>
                          </div>

                          <div className="space-y-2">
                            {item.tasks.map((task, tIdx) => (
                              <div key={tIdx} className="flex gap-2.5 items-start font-medium text-xs sm:text-sm p-2 bg-gray-50 border-2 border-black">
                                <div className="h-4 w-4 border-2 border-black bg-white flex items-center justify-center shrink-0 mt-0.5">
                                  <Check size={12} className="text-transparent" />
                                </div>
                                <span className="leading-tight">{task}</span>
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
