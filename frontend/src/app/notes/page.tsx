"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Save, 
  Folder, 
  Search, 
  Eye, 
  Edit3, 
  Check, 
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { useStudyStore, NoteInfo } from '../../store/studyStore';

export default function NotesSystem() {
  const {
    notes,
    fetchNotes,
    saveNote,
    deleteNote,
    isBackendOnline,
    addStudyHours
  } = useStudyStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [activeNote, setActiveNote] = useState<NoteInfo | null>(null);
  
  // Editor values
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteFolder, setNoteFolder] = useState('General');
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Load first note into editor on load
  useEffect(() => {
    if (notes.length > 0 && !activeNote) {
      handleSelectNote(notes[0]);
    }
  }, [notes, activeNote]);

  const handleSelectNote = (note: NoteInfo) => {
    setActiveNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteFolder(note.folder);
    setEditorMode('edit');
    setSaveStatus('idle');
  };

  const handleCreateNewNote = () => {
    const tempNote: NoteInfo = {
      id: `temp-${Date.now()}`,
      title: 'Untitled Note',
      content: '# Untitled Note\n\nType note material here using markdown formatting.',
      folder: selectedFolder !== 'All' ? selectedFolder : 'General'
    };
    handleSelectNote(tempNote);
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) return;
    setSaveStatus('saving');

    const id = activeNote?.id.startsWith('temp-') ? undefined : activeNote?.id;
    await saveNote(noteTitle, noteContent, id, noteFolder);
    
    // Increment study activity stats
    addStudyHours(0.2);

    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus('idle');
    }, 1500);

    // Refresh list
    await fetchNotes();
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    if (activeNote?.id === id) {
      setActiveNote(null);
      setNoteTitle('');
      setNoteContent('');
    }
  };

  // Simple Markdown parser mock for preview mode
  const parseMarkdown = (markdown: string) => {
    const lines = markdown.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-xl font-extrabold text-white border-b border-white/5 pb-2 mb-3 mt-4">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-md font-bold text-white mb-2 mt-3">{line.substring(3)}</h2>;
      }
      // Bullets
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 pl-2 text-xs leading-relaxed text-white/70 mb-1.5">
            <span className="mt-1.5 h-1 w-1 rounded-full bg-indigo-400 flex-shrink-0" />
            <span>{line.substring(2)}</span>
          </div>
        );
      }
      // Empty line
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      // Default paragraphs
      return <p key={idx} className="text-xs text-white/60 leading-relaxed mb-1.5">{line}</p>;
    });
  };

  // Directories list calculations
  const folders = ['All', ...Array.from(new Set(notes.map(n => n.folder)))];

  // Filtering notes
  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === 'All' || n.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="h-[calc(100vh-85px)] flex flex-col md:flex-row gap-6 max-w-7xl mx-auto overflow-hidden">
      
      {/* LEFT SIDEBAR: Notes Directory list */}
      <div className="w-full md:w-80 bg-[#0B1120]/75 backdrop-blur-xl border border-white/8 rounded-2xl p-4 flex flex-col justify-between overflow-hidden">
        
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          
          {/* New note trigger and title */}
          <div className="flex justify-between items-center">
            <h3 className="text-md font-bold text-white flex items-center gap-1.5">
              <FileText size={16} className="text-indigo-400" />
              Notes Workspace
            </h3>
            <button 
              onClick={handleCreateNewNote}
              className="p-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-400 cursor-pointer transition-all"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search note contents..."
              className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs"
            />
          </div>

          {/* Folders List selection tab row */}
          <div className="flex gap-1 overflow-x-auto pb-1.5 border-b border-white/5">
            {folders.map(fld => (
              <button
                key={fld}
                onClick={() => setSelectedFolder(fld)}
                className={`
                  px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap
                  ${selectedFolder === fld 
                    ? 'bg-indigo-600/10 border-indigo-500/50 text-white' 
                    : 'bg-white/3 border-white/5 text-white/50 hover:text-white'
                  }
                `}
              >
                {fld}
              </button>
            ))}
          </div>

          {/* Notes items log list */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 pt-1 min-h-0">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-10 border border-white/5 rounded-xl bg-white/3">
                <FileText className="mx-auto text-white/20 h-8 w-8 mb-2" />
                <p className="text-white/40 text-xs font-semibold">No notes found</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div 
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`
                    p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 flex items-center justify-between group
                    ${activeNote?.id === note.id 
                      ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-lg shadow-indigo-600/5' 
                      : 'bg-white/3 border-white/5 hover:bg-white/5 hover:border-white/8 text-white/70'
                    }
                  `}
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="font-bold text-xs truncate">{note.title}</h4>
                    <span className="text-[10px] text-white/30 flex items-center gap-1 mt-1">
                      <Folder size={10} className="text-indigo-400" />
                      {note.folder}
                    </span>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                    className="p-1 rounded bg-transparent opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* RIGHT EDITOR PANEL */}
      <div className="flex-1 bg-[#0B1120]/75 backdrop-blur-xl border border-white/8 rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
        {activeNote ? (
          <div className="h-full flex flex-col justify-between min-h-0">
            
            {/* Note Meta inputs (Title, Folder Selector) */}
            <div className="border-b border-white/5 pb-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <input 
                  type="text" 
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note Title"
                  className="bg-transparent text-lg font-extrabold text-white focus:outline-none flex-1 border-b border-transparent focus:border-white/10 pb-0.5"
                />

                {/* Editor action shortcuts */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  
                  {/* Mode Toggles */}
                  <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/8">
                    <button
                      onClick={() => setEditorMode('edit')}
                      className={`p-1.5 rounded-md text-xs cursor-pointer transition-all ${editorMode === 'edit' ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white'}`}
                      title="Edit Mode"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => setEditorMode('preview')}
                      className={`p-1.5 rounded-md text-xs cursor-pointer transition-all ${editorMode === 'preview' ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white'}`}
                      title="Preview Mode"
                    >
                      <Eye size={13} />
                    </button>
                  </div>

                  {/* Save buttons */}
                  <button
                    onClick={handleSaveNote}
                    disabled={saveStatus === 'saving'}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {saveStatus === 'saving' ? (
                      <span className="h-3 w-3 border border-white/20 border-t-white rounded-full animate-spin" />
                    ) : saveStatus === 'saved' ? (
                      <Check size={13} className="text-emerald-400" />
                    ) : (
                      <Save size={13} />
                    )}
                    {saveStatus === 'saved' ? 'Saved' : 'Save'}
                  </button>

                </div>
              </div>

              {/* Folder selection row */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Folder:</span>
                <input 
                  type="text" 
                  value={noteFolder}
                  onChange={(e) => setNoteFolder(e.target.value)}
                  placeholder="e.g. Physics"
                  className="bg-white/5 border border-white/8 rounded px-2.5 py-1 text-[11px] text-indigo-300 font-semibold focus:outline-none focus:border-indigo-500 max-w-[120px]"
                />
              </div>
            </div>

            {/* Note Editor area */}
            <div className="flex-1 my-4 overflow-y-auto min-h-0">
              {editorMode === 'edit' ? (
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="# Outline Note content using markdown headers (#) and bullets (-)"
                  className="w-full h-full bg-transparent border-0 resize-none focus:outline-none text-xs leading-relaxed text-white/80 font-mono"
                />
              ) : (
                <div className="prose prose-invert max-w-none px-2 py-1 select-text">
                  {parseMarkdown(noteContent)}
                </div>
              )}
            </div>

            {/* Editor Footer tips */}
            <div className="text-[10px] text-white/30 border-t border-white/5 pt-2 flex items-center gap-1">
              <BookOpen size={10} className="text-indigo-400" />
              <span>Supports basic markdown: `#` headers, `##` subheaders, and `-` bullets.</span>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <FileText className="text-white/10 h-12 w-12" />
            <p className="text-sm font-bold text-white/60">No Active Note Selected</p>
            <p className="text-xs text-white/30 max-w-[200px]">Create a new notebook entry or select one from the explorer sidebar.</p>
          </div>
        )}
      </div>

    </div>
  );
}
