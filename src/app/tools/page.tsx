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
    <div className="space-y-8 max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8 text-black">
      
      {/* Title */}
      <div className="bg-neo-magenta border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-4xl font-black uppercase tracking-tight flex items-center gap-4">
          Workspace Suite
          <span className="text-base bg-white border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold">AI Tools</span>
        </h1>
        <p className="font-bold mt-4 text-lg">Select from flashcards, quizzes, custom tutoring, or visual study planning models.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b-4 border-black pb-0 mb-8 bg-white border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex w-full overflow-x-auto custom-scrollbar">
          {[
            { id: 'flashcards', name: 'Flashcard Decks', icon: Layers, color: 'bg-neo-cyan' },
            { id: 'quiz', name: 'Practice Quizzes', icon: HelpCircle, color: 'bg-neo-yellow' },
            { id: 'planner', name: 'Study Planner', icon: Calendar, color: 'bg-neo-green' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'flashcards' | 'quiz' | 'planner')}
                className={`
                  flex-1 flex items-center justify-center gap-3 px-6 py-4 font-black uppercase text-lg border-r-4 border-black last:border-r-0 cursor-pointer transition-colors
                  ${isActive 
                    ? `${tab.color} border-b-4 border-b-black shadow-[inset_0_-4px_0_0_rgba(0,0,0,1)]` 
                    : 'bg-white hover:bg-gray-100'
                  }
                `}
              >
                <Icon size={24} strokeWidth={3} />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[600px]">
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
              <div className="neo-box bg-white p-6 h-fit space-y-6">
                <h3 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-black pb-4">
                  <div className="bg-neo-cyan border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Layers size={24} strokeWidth={3} />
                  </div>
                  Generator
                </h3>
                <p className="font-bold">
                  Generate active recall flashcards directly from document concepts. Cards are integrated with the Leitner Spaced Repetition box scheduler.
                </p>

                <div className="space-y-4 pt-4 border-t-4 border-black mt-4">
                  <label className="block font-black uppercase">Select Document Source</label>
                  <select 
                    value={selectedDocId} 
                    onChange={(e) => { setSelectedDocId(e.target.value); setCurrentCardIdx(0); setIsFlipped(false); }}
                    className="w-full neo-input"
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
                      className="neo-button w-full bg-neo-magenta hover:bg-white flex justify-center py-4 text-lg disabled:opacity-50 mt-4"
                    >
                      {loading ? 'Synthesizing...' : 'Generate Decks'}
                    </button>
                  )}
                </div>
              </div>

              {/* Interactive Flipping Card Panel */}
              <div className="lg:col-span-2 space-y-8">
                {activeCards.length === 0 ? (
                  <div className="neo-box bg-neo-yellow p-12 text-center flex flex-col items-center">
                    <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
                      <Layers className="h-16 w-16" strokeWidth={2} />
                    </div>
                    <p className="text-3xl font-black uppercase mb-4">No flashcards in deck</p>
                    <p className="font-bold text-lg max-w-md">Choose a document on the left and click 'Generate' to create cards.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-8">
                    {/* Card container */}
                    <div 
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="w-full max-w-2xl min-h-[450px] cursor-pointer perspective-1000 group relative"
                    >
                      <motion.div 
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="w-full h-full relative preserve-3d transition-transform duration-500"
                      >
                        {/* Front Side */}
                        <div className="absolute inset-0 w-full h-full neo-box bg-white p-10 flex flex-col justify-between backface-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                          
                          <div className="flex justify-between items-center font-black uppercase border-b-4 border-black pb-4">
                            <span className="flex items-center gap-2 bg-neo-cyan border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              <Layers size={18} strokeWidth={3} /> Concept
                            </span>
                            <span className="bg-neo-magenta border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              Box {activeCards[currentCardIdx]?.box}
                            </span>
                          </div>
                          
                          <div className="flex-1 flex items-center justify-center overflow-y-auto my-8">
                            <p className="text-center text-4xl font-black uppercase leading-tight">
                              {activeCards[currentCardIdx]?.question}
                            </p>
                          </div>
                          
                          <div className="text-center font-bold uppercase flex items-center justify-center gap-3 border-t-4 border-black pt-4 bg-neo-yellow border-2 p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-white transition-colors">
                            <RefreshCw size={20} strokeWidth={3} /> Click to reveal answer
                          </div>
                        </div>

                        {/* Back Side */}
                        <div 
                          className="absolute inset-0 w-full h-full neo-box bg-neo-green p-10 flex flex-col justify-between backface-hidden rotateY-180 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                        >
                          
                          <div className="flex justify-between items-center font-black uppercase border-b-4 border-black pb-4">
                            <span className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              <Sparkles size={18} strokeWidth={3} /> Answer
                            </span>
                            <span className="bg-white border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              Spaced Repetition
                            </span>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto my-8 text-left text-2xl font-bold leading-relaxed whitespace-pre-wrap custom-scrollbar bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            {activeCards[currentCardIdx]?.answer}
                          </div>
                          
                          <div className="text-center font-black uppercase border-t-4 border-black pt-4">
                            Click anywhere to flip back
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-6 font-black uppercase w-full max-w-2xl bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <span className="whitespace-nowrap">Card {currentCardIdx + 1} / {activeCards.length}</span>
                      <div className="flex-1 h-6 bg-white border-4 border-black overflow-hidden relative shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                        <div className="bg-neo-magenta h-full transition-all duration-500 border-r-4 border-black" style={{ width: `${((currentCardIdx + 1) / activeCards.length) * 100}%` }} />
                      </div>
                    </div>

                    {/* Spaced Repetition Box assessment rating */}
                    {isFlipped && (
                      <motion.div 
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="flex gap-6 w-full max-w-2xl"
                      >
                        <button
                          onClick={() => handleCardReview('hard')}
                          className="neo-button flex-1 py-4 bg-red-500 hover:bg-white text-black flex justify-center gap-3"
                        >
                          <X size={24} strokeWidth={4} /> 
                          <span className="text-xl">Hard</span>
                        </button>
                        <button
                          onClick={() => handleCardReview('easy')}
                          className="neo-button flex-1 py-4 bg-neo-cyan hover:bg-white text-black flex justify-center gap-3"
                        >
                          <Check size={24} strokeWidth={4} /> 
                          <span className="text-xl">Easy</span>
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
              className="max-w-4xl mx-auto space-y-8"
            >
              {quizQuestions.length === 0 ? (
                /* Select document layout */
                <div className="neo-box bg-neo-yellow p-12 text-center flex flex-col items-center">
                  <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
                    <HelpCircle size={48} strokeWidth={3} />
                  </div>
                  <div className="space-y-4 max-w-lg mx-auto mb-8 border-b-4 border-black pb-8">
                    <h3 className="text-4xl font-black uppercase">Synthesize Quiz</h3>
                    <p className="font-bold text-lg">
                      AI constructs customized MCQs, True/False, and fill-in-the-blanks directly based on document material.
                    </p>
                  </div>

                  <div className="w-full max-w-md mx-auto space-y-6">
                    <select 
                      value={quizDocId} 
                      onChange={(e) => setQuizDocId(e.target.value)}
                      className="w-full neo-input py-4 text-lg"
                    >
                      <option value="">-- Choose Document --</option>
                      {documents.map((doc) => (
                        <option key={doc.id} value={doc.id}>{doc.filename}</option>
                      ))}
                    </select>

                    <button
                      onClick={handleStartQuiz}
                      disabled={loadingQuiz || !quizDocId}
                      className="neo-button w-full bg-neo-cyan hover:bg-white py-4 text-xl disabled:opacity-50"
                    >
                      {loadingQuiz ? 'Writing Questions...' : 'Generate Quiz'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Active quiz questions list */
                <div className="space-y-8">
                  <div className="flex justify-between items-center bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-2xl font-black uppercase">Practice Quiz</span>
                    <button 
                      onClick={() => setQuizQuestions([])}
                      className="neo-button bg-red-500 hover:bg-white"
                    >
                      Reset Quiz
                    </button>
                  </div>

                  {quizQuestions.map((q, idx) => (
                    <div key={idx} className="neo-box bg-white p-8 space-y-6">
                      <div className="flex items-start gap-6 border-b-4 border-black pb-6">
                        <span className="h-12 w-12 bg-neo-magenta border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center font-black text-2xl shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="text-2xl font-black uppercase leading-tight">{q.question}</h4>
                      </div>

                      {/* Options selection based on type */}
                      {q.type === 'mcq' && (
                        <div className="grid grid-cols-1 gap-4 pl-0 sm:pl-16">
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
                                  w-full text-left p-4 border-4 border-black font-bold text-lg transition-all
                                  ${isSelected && !isQuizSubmitted ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''}
                                  ${!isSelected && !isQuizSubmitted ? 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-cyan hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' : ''}
                                  ${showSuccess ? 'bg-neo-green text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''}
                                  ${showDanger ? 'bg-red-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''}
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
                        <div className="flex gap-6 pl-0 sm:pl-16">
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
                                  flex-1 text-center p-6 border-4 border-black font-black text-2xl uppercase transition-all
                                  ${isSelected && !isQuizSubmitted ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''}
                                  ${!isSelected && !isQuizSubmitted ? 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-yellow hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' : ''}
                                  ${showSuccess ? 'bg-neo-green text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''}
                                  ${showDanger ? 'bg-red-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''}
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
                        <div className="pl-0 sm:pl-16 space-y-4">
                          <input
                            type="text"
                            disabled={isQuizSubmitted}
                            value={userAnswers[idx] || ''}
                            onChange={(e) => handleSelectAnswer(idx, e.target.value)}
                            placeholder="Type your answer here..."
                            className={`
                              w-full neo-input py-4 text-xl
                              ${isQuizSubmitted && q.correct_answer.toLowerCase().includes(userAnswers[idx]?.toLowerCase() || '') && userAnswers[idx] ? 'bg-neo-green' : ''}
                              ${isQuizSubmitted && !q.correct_answer.toLowerCase().includes(userAnswers[idx]?.toLowerCase() || '') ? 'bg-red-500 text-white' : ''}
                            `}
                          />
                          {isQuizSubmitted && (
                            <div className="bg-black text-white border-4 border-black p-4 font-black text-lg uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              Correct answer: <span className="text-neo-cyan">{q.correct_answer}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanation box on submit */}
                      {isQuizSubmitted && (
                        <div className="mt-6 bg-neo-yellow border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] pl-0 sm:pl-16 ml-0 sm:ml-16">
                          <span className="font-black text-black uppercase block mb-3 text-xl border-b-4 border-black pb-2 inline-block">Explanation</span>
                          <p className="font-bold text-lg leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Submission and score drawer */}
                  {!isQuizSubmitted ? (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={userAnswers.includes('')}
                      className="neo-button w-full bg-neo-magenta hover:bg-white py-6 text-2xl disabled:opacity-50"
                    >
                      Submit Answers
                    </button>
                  ) : (
                    <div className="neo-box bg-neo-cyan p-8 flex flex-col sm:flex-row items-center justify-between gap-8">
                      <div className="space-y-2 text-center sm:text-left">
                        <h4 className="text-3xl font-black uppercase">Quiz Result</h4>
                        <p className="font-bold text-lg">Your responses have been graded and logged in Analytics.</p>
                      </div>
                      <div className="text-5xl font-black bg-white border-4 border-black px-8 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] shrink-0">
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
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Creator Settings Panel */}
              <div className="neo-box bg-white p-6 h-fit space-y-6">
                <h3 className="text-2xl font-black uppercase flex items-center gap-3 border-b-4 border-black pb-4">
                  <div className="bg-neo-green border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Calendar size={24} strokeWidth={3} />
                  </div>
                  Planner
                </h3>
                <p className="font-bold">
                  Design a customized checklist study plan mapping daily timelines and goals for any topic.
                </p>

                <div className="space-y-6 pt-4 border-t-4 border-black">
                  <div>
                    <label className="block font-black uppercase mb-2">Study Subject/Goal</label>
                    <input 
                      type="text" 
                      value={planTopic}
                      onChange={(e) => setPlanTopic(e.target.value)}
                      placeholder="e.g. Quantum Physics basics"
                      className="w-full neo-input"
                    />
                  </div>

                  <div>
                    <label className="block font-black uppercase mb-4">Duration: {planDays} Days</label>
                    <input
                      type="range"
                      min="3"
                      max="14"
                      value={planDays}
                      onChange={(e) => setPlanDays(Number(e.target.value))}
                      className="w-full h-4 bg-white border-2 border-black rounded-none appearance-none cursor-pointer accent-black"
                    />
                  </div>

                  <button
                    onClick={handleGeneratePlan}
                    disabled={loading || !planTopic.trim()}
                    className="neo-button w-full bg-neo-yellow hover:bg-white py-4 text-lg flex justify-center disabled:opacity-50"
                  >
                    {loading ? 'Synthesizing...' : 'Construct Plan'}
                  </button>
                </div>

                {/* Available plans drawer list */}
                {studyPlans.length > 0 && (
                  <div className="space-y-4 pt-6 border-t-4 border-black mt-6">
                    <label className="block font-black uppercase text-lg mb-4">Saved Roadmaps</label>
                    {studyPlans.map((pl) => (
                      <button
                        key={pl.id}
                        onClick={() => setActivePlan(pl)}
                        className={`
                          w-full flex items-center justify-between p-4 border-4 border-black text-left font-bold transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                          ${activePlan?.id === pl.id 
                            ? 'bg-black text-white translate-x-2 translate-y-2 shadow-none' 
                            : 'bg-white hover:bg-neo-cyan'
                          }
                        `}
                      >
                        <span className="truncate max-w-[150px] uppercase">{pl.topic}</span>
                        <span className={`px-2 py-1 border-2 font-black ${activePlan?.id === pl.id ? 'bg-white text-black border-black' : 'bg-black text-white border-white'}`}>
                          {pl.duration_days}D
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Plan Dashboard */}
              <div className="lg:col-span-2 space-y-8">
                {!activePlan ? (
                  <div className="neo-box bg-neo-cyan p-12 text-center flex flex-col items-center">
                    <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
                      <Calendar className="h-16 w-16" strokeWidth={2} />
                    </div>
                    <p className="text-3xl font-black uppercase mb-4">No active planner</p>
                    <p className="font-bold text-lg max-w-md">Configure study goals on the left to synthesize a structured day-by-day checklist.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <span className="font-black bg-neo-green border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-4 inline-block">Roadmap Plan</span>
                      <h4 className="text-4xl font-black uppercase">{activePlan.topic} Plan</h4>
                    </div>

                    <div className="space-y-6">
                      {activePlan.plan.map((item) => (
                        <div key={item.day} className="neo-box bg-white p-6 relative">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b-4 border-black pb-4 gap-4">
                            <div>
                              <span className="font-black text-xl bg-black text-white px-3 py-1 uppercase shadow-[4px_4px_0px_0px_rgba(0,255,255,1)]">Day {item.day} of {activePlan.duration_days}</span>
                              <h5 className="font-black text-2xl uppercase mt-4">{item.title}</h5>
                            </div>
                            <span className="bg-neo-yellow border-4 border-black font-black text-lg px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                              {item.time_needed} MINS
                            </span>
                          </div>

                          <div className="space-y-4">
                            {item.tasks.map((task, tIdx) => (
                              <div key={tIdx} className="flex gap-4 items-start font-bold text-lg p-3 bg-gray-50 border-2 border-black">
                                <div className="h-6 w-6 border-4 border-black bg-white flex items-center justify-center shrink-0 mt-0.5">
                                  <Check size={16} className="text-transparent" />
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
