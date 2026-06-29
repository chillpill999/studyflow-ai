'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStore, Flashcard } from 'src/store/useStore';
import { GlassCard } from 'src/components/GlassCard';
import { apiClient } from 'src/lib/axios';
import { 
  Sparkles, 
  RefreshCcw, 
  ThumbsUp, 
  ThumbsDown, 
  Trash2, 
  Edit3, 
  Download, 
  UploadCloud, 
  Plus, 
  BookOpen 
} from 'lucide-react';

export default function FlashcardsPage() {
  const { documents, flashcards, setFlashcards, activeDocument, addNotification } = useStore();
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  
  // Carousel states
  const [reviewDeck, setReviewDeck] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  
  // Edit & creation states
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editFront, setEditFront] = useState<string>('');
  const [editBack, setEditBack] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newFront, setNewFront] = useState<string>('');
  const [newBack, setNewBack] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [reviewMode, setReviewMode] = useState<boolean>(true); // true = Leitner Review, false = Manage Deck
  
  // Import states
  const [importRaw, setImportRaw] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  const fetchFlashcards = useCallback(async () => {
    try {
      const res = await apiClient.get('/flashcards');
      setFlashcards(res.data);
    } catch (err) {
      console.error('Failed to load flashcards', err);
    }
  }, [setFlashcards]);

  const filterReviewDeck = useCallback(() => {
    let filtered = flashcards;
    if (selectedDocId) {
      filtered = flashcards.filter(c => c.document_id === selectedDocId);
    }
    // Filter cards due today or earlier
    const now = new Date();
    const due = filtered.filter(c => new Date(c.next_review_at) <= now);
    setReviewDeck(due.length > 0 ? due : filtered);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards, selectedDocId]);

  useEffect(() => {
    fetchFlashcards();
    if (activeDocument) {
      setTimeout(() => setSelectedDocId(activeDocument.id), 0);
    } else if (documents.length > 0) {
      setTimeout(() => setSelectedDocId(documents[0].id), 0);
    }
  }, [activeDocument, documents, fetchFlashcards]);

  useEffect(() => {
    setTimeout(() => {
      filterReviewDeck();
    }, 0);
  }, [flashcards, selectedDocId, filterReviewDeck]);

  const handleGenerateCards = async () => {
    if (!selectedDocId) return;
    setLoading(true);
    try {
      const res = await apiClient.post('/flashcards/generate', {
        document_id: selectedDocId,
        count: 8
      });
      setFlashcards([...res.data, ...flashcards]);
      addNotification({
        title: 'Flashcards generated',
        message: `Successfully generated ${res.data.length} flashcards from document.`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Flashcards generation error', err);
      addNotification({
        title: 'Flashcards generation failed',
        message: err.response?.data?.detail || err.message || 'Failed to generate flashcards.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (correct: boolean) => {
    if (reviewDeck.length === 0) return;
    const currentCard = reviewDeck[currentIndex];
    
    // Smooth transition
    setIsFlipped(false);
    
    try {
      const res = await apiClient.patch(`/flashcards/${currentCard.id}/review`, { correct });
      const updatedCard: Flashcard = res.data;
      
      // Update global store
      setFlashcards(flashcards.map(c => c.id === updatedCard.id ? updatedCard : c));

      // Advance carousel
      setTimeout(() => {
        if (currentIndex < reviewDeck.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // Finished review cycle
          alert('Great job! You have completed all active flashcards in this deck.');
          fetchFlashcards();
        }
      }, 300);
    } catch (err) {
      console.error('Review submission failed', err);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this card?')) return;
    try {
      await apiClient.delete(`/flashcards/${id}`);
      setFlashcards(flashcards.filter(c => c.id !== id));
    } catch (err) {
      console.error('Card deletion failed', err);
    }
  };

  const handleStartEdit = (card: Flashcard) => {
    setIsEditing(true);
    setEditFront(card.front);
    setEditBack(card.back);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await apiClient.patch(`/flashcards/${id}`, {
        front: editFront,
        back: editBack
      });
      setFlashcards(flashcards.map(c => c.id === id ? res.data : c));
      setIsEditing(false);
    } catch (err) {
      console.error('Saving card update failed', err);
    }
  };

  const handleCreateCard = async () => {
    if (!selectedDocId || !newFront || !newBack) return;
    try {
      const res = await apiClient.post('/flashcards/import', {
        document_id: selectedDocId,
        cards: [{ front: newFront, back: newBack }]
      });
      setFlashcards([...res.data, ...flashcards]);
      setNewFront('');
      setNewBack('');
      setIsCreating(false);
    } catch (err) {
      console.error('Creating card failed', err);
    }
  };

  const handleExportJSON = () => {
    const deck = flashcards.filter(c => c.document_id === selectedDocId);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(deck, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'flashcard-deck.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = async () => {
    if (!selectedDocId || !importRaw) return;
    try {
      const parsed = JSON.parse(importRaw);
      const cards = Array.isArray(parsed) ? parsed : [parsed];
      
      const formatted = cards.map(c => ({
        front: c.front || c.question || '',
        back: c.back || c.answer || ''
      }));

      const res = await apiClient.post('/flashcards/import', {
        document_id: selectedDocId,
        cards: formatted
      });
      
      setFlashcards([...res.data, ...flashcards]);
      setImportRaw('');
      setShowImportModal(false);
      alert(`Successfully imported ${res.data.length} flashcards!`);
    } catch {
      alert('Invalid JSON formatting. Please check your data structure.');
    }
  };

  const currentCard = reviewDeck[currentIndex];

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-40px)] z-10 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-purple-950">AI Flashcard Review</h1>
          <p className="text-purple-950/60 mt-1">Leitner Box spaced repetition system to optimize memory retention</p>
        </div>

        <div className="flex items-center gap-3 bg-white/40 border border-white/40 p-1 rounded-xl">
          <button
            onClick={() => setReviewMode(true)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium font-sans transition-all ${
              reviewMode ? 'bg-purple-950 text-white shadow-sm' : 'text-purple-950/70 hover:bg-white/20'
            }`}
          >
            Review Deck
          </button>
          <button
            onClick={() => setReviewMode(false)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium font-sans transition-all ${
              !reviewMode ? 'bg-purple-950 text-white shadow-sm' : 'text-purple-950/70 hover:bg-white/20'
            }`}
          >
            Manage Deck
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Document Selection & Control Card */}
        <div className="space-y-6 lg:col-span-1">
          <GlassCard className="p-5 space-y-4">
            <h2 className="text-sm font-semibold text-purple-950 uppercase tracking-wider">Configure Deck</h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-purple-950/70">Select Book/Document</label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white/60 border border-white/40 rounded-xl text-sm font-sans focus:outline-none text-purple-950"
                >
                  <option value="">All Documents</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.file_name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                disabled={loading || !selectedDocId}
                onClick={handleGenerateCards}
                className="w-full bg-purple-950 text-white font-sans font-medium text-xs py-2.5 rounded-xl hover:bg-purple-900 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles size={14} />
                    Generate with AI
                  </>
                )}
              </button>
            </div>
          </GlassCard>

          <GlassCard className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-purple-950 uppercase tracking-wider">Export & Import</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportJSON}
                disabled={!selectedDocId}
                className="bg-white/60 hover:bg-white/80 border border-white/40 text-purple-950 text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                <Download size={13} />
                Export
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                disabled={!selectedDocId}
                className="bg-white/60 hover:bg-white/80 border border-white/40 text-purple-950 text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                <UploadCloud size={13} />
                Import
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Carousel / Deck Management Area */}
        <div className="lg:col-span-3">
          {reviewMode ? (
            /* Review Deck View */
            <div className="flex flex-col items-center space-y-6">
              {reviewDeck.length > 0 && currentCard ? (
                <div className="w-full max-w-xl space-y-6">
                  {/* Progress Indicators */}
                  <div className="flex justify-between items-center text-xs text-purple-950/60 font-sans">
                    <span>Card {currentIndex + 1} of {reviewDeck.length}</span>
                    <span className="bg-[#B998D2]/25 px-2 py-0.5 rounded-full border border-white/30 text-purple-950">
                      Box {currentCard.leitner_box}
                    </span>
                  </div>

                  {/* Frosted Flip Card */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="w-full h-80 cursor-pointer relative perspective"
                  >
                    <div
                      className={`
                        w-full h-full duration-500 transform style-preserve-3d relative rounded-3xl border border-white/30 bg-white/40 backdrop-blur-[24px] shadow-lg flex items-center justify-center p-8 text-center
                        ${isFlipped ? 'rotate-y-180' : ''}
                      `}
                    >
                      {/* Front Side */}
                      <div className={`absolute inset-0 backface-hidden flex flex-col justify-center items-center p-8 ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="text-xs uppercase font-semibold text-purple-950/50 mb-4 tracking-widest">Question / Term</div>
                        <div className="text-lg font-serif font-bold text-purple-950 select-text leading-relaxed">
                          {currentCard.front}
                        </div>
                        <div className="text-[10px] text-purple-950/40 mt-8 flex items-center gap-1">
                          <RefreshCcw size={10} /> Click to flip card
                        </div>
                      </div>

                      {/* Back Side */}
                      <div className={`absolute inset-0 backface-hidden rotate-y-180 flex flex-col justify-center items-center p-8 ${isFlipped ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="text-xs uppercase font-semibold text-[#B998D2] mb-4 tracking-widest">Answer / Concept</div>
                        <div className="text-md font-sans text-purple-950 select-text leading-relaxed">
                          {currentCard.back}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => handleReview(false)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-700 border border-red-500/20 font-sans font-medium text-sm py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                    >
                      <ThumbsDown size={16} />
                      Forgot (Reset to Box 1)
                    </button>
                    <button
                      onClick={() => handleReview(true)}
                      className="bg-green-600 text-white font-sans font-medium text-sm py-2.5 px-6 rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 shadow-sm"
                    >
                      <ThumbsUp size={16} />
                      Remembered (Box +1)
                    </button>
                  </div>
                </div>
              ) : (
                <GlassCard className="p-8 text-center text-purple-950/50 w-full max-w-xl min-h-[300px] flex flex-col justify-center items-center">
                  <BookOpen size={48} className="text-purple-900/20 mb-3" />
                  <p className="font-serif text-lg font-medium">All caught up!</p>
                  <p className="text-xs text-purple-950/40 mt-1">No flashcards need review today. Check back tomorrow or generate more cards!</p>
                </GlassCard>
              )}
            </div>
          ) : (
            /* Manage Deck View */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-purple-950 uppercase tracking-wider">Manage Active Flashcards</h3>
                <button
                  onClick={() => setIsCreating(true)}
                  className="bg-purple-950 text-white text-xs font-medium px-3 py-2 rounded-xl hover:bg-purple-900 transition-all flex items-center gap-1 shadow-sm"
                >
                  <Plus size={13} />
                  Add Card
                </button>
              </div>

              {/* Create Card Form */}
              {isCreating && (
                <GlassCard className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Front Side (Question/Term)"
                      value={newFront}
                      onChange={(e) => setNewFront(e.target.value)}
                      className="bg-white/60 border border-white/40 rounded-lg p-2 text-xs font-sans focus:outline-none text-purple-950"
                    />
                    <input
                      placeholder="Back Side (Answer/Definition)"
                      value={newBack}
                      onChange={(e) => setNewBack(e.target.value)}
                      className="bg-white/60 border border-white/40 rounded-lg p-2 text-xs font-sans focus:outline-none text-purple-950"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsCreating(false)}
                      className="text-xs text-purple-950/60 hover:text-purple-950 px-3 py-1.5"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateCard}
                      className="bg-purple-950 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm"
                    >
                      Save Card
                    </button>
                  </div>
                </GlassCard>
              )}

              {/* Deck Grid List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flashcards
                  .filter(c => !selectedDocId || c.document_id === selectedDocId)
                  .map((card) => (
                    <GlassCard key={card.id} className="p-4 flex flex-col justify-between space-y-4">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            value={editFront}
                            onChange={(e) => setEditFront(e.target.value)}
                            className="w-full bg-white/60 border border-white/40 rounded-lg p-1.5 text-xs text-purple-950"
                          />
                          <input
                            value={editBack}
                            onChange={(e) => setEditBack(e.target.value)}
                            className="w-full bg-white/60 border border-white/40 rounded-lg p-1.5 text-xs text-purple-950"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-semibold text-purple-950">Q: {card.front}</div>
                          <div className="text-xs text-purple-950/70 mt-1">A: {card.back}</div>
                          <div className="text-[9px] text-[#B998D2] mt-2">Leitner: Box {card.leitner_box}</div>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 border-t border-white/10 pt-2 shrink-0">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => setIsEditing(false)}
                              className="text-[10px] text-purple-950/60 hover:text-purple-950"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(card.id)}
                              className="bg-purple-950 text-white text-[10px] font-medium px-2 py-1 rounded-lg"
                            >
                              Save
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(card)}
                              className="text-[10px] hover:bg-white/40 p-1.5 rounded-lg text-purple-950/60"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="text-[10px] hover:bg-red-50 p-1.5 rounded-lg text-red-600"
                            >
                              <Trash2 size={11} />
                            </button>
                          </>
                        )}
                      </div>
                    </GlassCard>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-purple-950/20 backdrop-blur-[4px] z-50 flex items-center justify-center p-4">
          <GlassCard className="p-6 max-w-lg w-full space-y-4">
            <h2 className="text-lg font-serif font-semibold text-purple-950">Import Flashcards Deck</h2>
            <p className="text-xs text-purple-950/60">
              Paste a JSON array containing <code>front</code> and <code>back</code> QA properties:
            </p>
            <textarea
              placeholder='[\n  { "front": "Equation", "back": "Result" }\n]'
              value={importRaw}
              onChange={(e) => setImportRaw(e.target.value)}
              className="w-full h-48 bg-white/60 border border-white/40 rounded-xl p-3 text-xs font-mono focus:outline-none text-purple-950 resize-y"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="text-xs text-purple-950/60 hover:text-purple-950 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleImportJSON}
                className="bg-purple-950 text-white text-xs font-medium px-4 py-1.5 rounded-xl shadow-sm"
              >
                Import Deck
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
