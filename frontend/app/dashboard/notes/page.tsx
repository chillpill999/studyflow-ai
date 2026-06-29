'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStore, StudyNote } from 'src/store/useStore';
import { GlassCard } from 'src/components/GlassCard';
import { apiClient } from 'src/lib/axios';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Download, 
  Trash2, 
  Save, 
  Edit3, 
  Check, 
  ChevronRight,
  BookOpen
} from 'lucide-react';

export default function NotesPage() {
  const { documents, notes, setNotes, activeDocument, addNotification } = useStore();
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);
  
  const [mode, setMode] = useState<'detailed' | 'concise' | 'summary'>('detailed');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form states for manual editing
  const [editedTitle, setEditedTitle] = useState<string>('');
  const [editedContent, setEditedContent] = useState<string>('');

  const handleSelectNote = useCallback((note: StudyNote) => {
    setSelectedNote(note);
    setEditedTitle(note.title);
    setEditedContent(note.content);
    setIsEditing(false);
  }, []);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await apiClient.get('/notes');
      setNotes(res.data);
      if (res.data.length > 0) {
        handleSelectNote(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load notes', err);
    }
  }, [setNotes, handleSelectNote]);

  useEffect(() => {
    setTimeout(() => {
      fetchNotes();
    }, 0);
    if (activeDocument) {
      setTimeout(() => setSelectedDocId(activeDocument.id), 0);
    } else if (documents.length > 0) {
      setTimeout(() => setSelectedDocId(documents[0].id), 0);
    }
  }, [activeDocument, documents, fetchNotes]);

  const handleGenerateNotes = async () => {
    if (!selectedDocId) return;
    setLoading(true);
    try {
      const res = await apiClient.post('/notes/generate', {
        document_id: selectedDocId,
        mode: mode,
      });
      const generatedNote: StudyNote = res.data;
      setNotes([generatedNote, ...notes]);
      handleSelectNote(generatedNote);
      addNotification({
        title: 'Notes ready',
        message: `AI study notes generated successfully: "${generatedNote.title}"`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Notes generation error', err);
      addNotification({
        title: 'Notes generation failed',
        message: err.response?.data?.detail || err.message || 'Failed to generate AI notes.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    setSaving(true);
    try {
      const res = await apiClient.patch(`/notes/${selectedNote.id}`, {
        title: editedTitle,
        content: editedContent,
      });
      const updated: StudyNote = res.data;
      setNotes(notes.map(n => n.id === updated.id ? updated : n));
      setSelectedNote(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Saving note failed', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this study note?')) return;
    try {
      await apiClient.delete(`/notes/${id}`);
      const updatedNotes = notes.filter(n => n.id !== id);
      setNotes(updatedNotes);
      if (selectedNote?.id === id) {
        setSelectedNote(updatedNotes[0] || null);
        if (updatedNotes[0]) {
          handleSelectNote(updatedNotes[0]);
        }
      }
    } catch (err) {
      console.error('Deleting note failed', err);
    }
  };

  const handleCopyText = () => {
    if (!editedContent) return;
    navigator.clipboard.writeText(editedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    if (!editedContent) return;
    const blob = new Blob([editedContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${editedTitle || 'notes'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!editedContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${editedTitle}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e1b4b; line-height: 1.6; }
            h1 { font-family: Georgia, serif; color: #4c1d95; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
            h2, h3 { color: #581c87; margin-top: 30px; }
            pre { background: #f3f4f6; padding: 15px; border-radius: 8px; font-family: monospace; overflow-x: auto; }
            code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
            ul, ol { padding-left: 20px; }
          </style>
        </head>
        <body>
          <h1>${editedTitle}</h1>
          <div style="white-space: pre-wrap;">${editedContent}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-40px)] z-10 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-purple-950">AI Notes Generator</h1>
          <p className="text-purple-950/60 mt-1">Generate beautifully structured revision sheets and detailed chapter summaries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Sidebar settings */}
        <div className="space-y-6 lg:col-span-1">
          <GlassCard className="p-5 space-y-4">
            <h2 className="text-lg font-serif font-semibold text-purple-950 flex items-center gap-2">
              <Sparkles size={18} className="text-[#B998D2]" />
              Generate Study Notes
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-purple-950/70 uppercase">Select Syllabus Document</label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-white/60 border border-white/40 rounded-xl text-sm font-sans focus:outline-none focus:ring-1 focus:ring-purple-400 text-purple-950"
                >
                  <option value="">-- Select PDF Document --</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.file_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-purple-950/70 uppercase">Notes Mode</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['detailed', 'concise', 'summary'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`
                        py-1.5 rounded-lg text-xs font-sans capitalize transition-all border
                        ${mode === m
                          ? 'bg-[#B998D2] text-white border-[#B998D2] shadow-sm'
                          : 'bg-white/40 text-purple-950/80 border-white/20 hover:bg-white/60'
                        }
                      `}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={loading || !selectedDocId}
                onClick={handleGenerateNotes}
                className="w-full mt-3 bg-purple-950 text-white font-sans font-medium text-sm py-2.5 rounded-xl hover:bg-purple-900 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate with AI
                  </>
                )}
              </button>
            </div>
          </GlassCard>

          {/* List of saved notes */}
          <GlassCard className="p-5 space-y-4">
            <h3 className="text-xs font-semibold text-purple-950/70 uppercase tracking-wider">Your Saved Notes</h3>
            {notes.length === 0 ? (
              <div className="py-8 text-center text-sm text-purple-950/50">
                <FileText size={24} className="mx-auto mb-2 opacity-30" />
                No study notes saved yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`
                      p-3 rounded-xl cursor-pointer transition-all border flex justify-between items-center group
                      ${selectedNote?.id === note.id
                        ? 'bg-purple-950/5 border-purple-900/20 shadow-sm'
                        : 'bg-white/20 border-white/10 hover:bg-white/40'
                      }
                    `}
                  >
                    <div className="truncate pr-2">
                      <div className="font-sans font-medium text-sm text-purple-950 truncate">{note.title}</div>
                      <div className="text-[10px] text-purple-950/50 mt-0.5">
                        {new Date(note.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="text-red-600 hover:bg-red-50 p-1 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={16} className="text-purple-950/30" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Note viewer/editor */}
        <div className="lg:col-span-2">
          {selectedNote ? (
            <GlassCard className="p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-white/20 pb-4">
                <div className="flex-1 mr-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full text-2xl font-serif font-bold bg-white/60 border border-white/40 rounded-lg px-3 py-1 text-purple-950 focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                  ) : (
                    <h2 className="text-2xl font-serif font-bold text-purple-950">{selectedNote.title}</h2>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isEditing ? (
                    <button
                      onClick={handleSaveNote}
                      disabled={saving}
                      className="bg-green-600 text-white text-xs font-medium px-3 py-2 rounded-xl hover:bg-green-700 transition-all flex items-center gap-1 shadow-sm"
                    >
                      {saving ? (
                        <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save size={13} />
                          Save
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-white/60 hover:bg-white/80 text-purple-950 text-xs font-medium px-3 py-2 border border-white/40 rounded-xl transition-all flex items-center gap-1 shadow-sm"
                    >
                      <Edit3 size={13} />
                      Edit
                    </button>
                  )}

                  <button
                    onClick={handleCopyText}
                    className="bg-white/60 hover:bg-white/80 text-purple-950 text-xs font-medium px-3 py-2 border border-white/40 rounded-xl transition-all flex items-center gap-1 shadow-sm"
                    title="Copy Markdown"
                  >
                    {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>

                  <div className="relative group">
                    <button className="bg-white/60 hover:bg-white/80 text-purple-950 text-xs font-medium px-3 py-2 border border-white/40 rounded-xl transition-all flex items-center gap-1 shadow-sm">
                      <Download size={13} />
                      Export
                    </button>
                    <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-purple-950/10 py-1 hidden group-hover:block z-20">
                      <button
                        onClick={handleExportMarkdown}
                        className="w-full text-left px-4 py-2 text-xs text-purple-950 hover:bg-purple-50 transition-all"
                      >
                        Markdown (.md)
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="w-full text-left px-4 py-2 text-xs text-purple-950 hover:bg-purple-50 transition-all"
                      >
                        PDF (.pdf)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full min-h-[400px] bg-white/60 border border-white/40 rounded-xl p-4 text-sm font-sans focus:outline-none focus:ring-1 focus:ring-purple-400 text-purple-950 resize-y"
                />
              ) : (
                <div className="prose prose-purple max-w-none text-purple-950/80 font-sans min-h-[400px] overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                  {selectedNote.content}
                </div>
              )}
            </GlassCard>
          ) : (
            <GlassCard className="p-8 text-center text-purple-950/50 min-h-[400px] flex flex-col justify-center items-center">
              <BookOpen size={48} className="text-purple-900/20 mb-3 animate-pulse" />
              <p className="font-serif text-lg font-medium">No note selected or generated.</p>
              <p className="text-xs text-purple-950/40 mt-1">Select a document and generate your study revision sheet above!</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
