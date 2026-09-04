"use client";

import React, { useState, useEffect } from 'react';

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
  BookOpen
} from 'lucide-react';
import { useStudyStore, NoteInfo } from '../../store/studyStore';

export default function NotesSystem() {
  const {
    notes,
    fetchNotes,
    saveNote,
    deleteNote,
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

  const handleSelectNote = (note: NoteInfo) => {
    setActiveNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteFolder(note.folder);
    setEditorMode('edit');
    setSaveStatus('idle');
  };

  // Load first note into editor on load
  useEffect(() => {
    if (notes.length > 0 && !activeNote) {
      const timeoutId = setTimeout(() => handleSelectNote(notes[0]), 0);
      return () => clearTimeout(timeoutId);
    }
  }, [notes, activeNote]);

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
        return <h1 key={idx} className="text-3xl font-black uppercase text-black border-b-4 border-black pb-2 mb-4 mt-6">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-xl font-black uppercase text-black mb-3 mt-4">{line.substring(3)}</h2>;
      }
      // Bullets
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-3 pl-4 text-base font-bold text-black mb-2">
            <span className="mt-2 h-2 w-2 bg-black flex-shrink-0" />
            <span>{line.substring(2)}</span>
          </div>
        );
      }
      // Empty line
      if (line.trim() === '') {
        return <div key={idx} className="h-4" />;
      }
      // Default paragraphs
      return <p key={idx} className="text-base font-bold text-black leading-relaxed mb-3">{line}</p>;
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
    <div className="h-auto md:h-[calc(100vh-85px)] flex flex-col md:flex-row gap-8 max-w-7xl mx-auto md:overflow-hidden text-black pb-6 md:pb-0">
      
      {/* LEFT SIDEBAR: Notes Directory list */}
      <div className="w-full md:w-96 neo-box bg-neo-yellow p-6 flex flex-col justify-between overflow-hidden min-h-[400px] md:min-h-0">
        
        <div className="space-y-6 flex-1 flex flex-col min-h-0">
          
          {/* New note trigger and title */}
          <div className="flex justify-between items-center bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black uppercase flex items-center gap-2">
              <FileText size={24} strokeWidth={3} />
              Workspace
            </h3>
            <button 
              onClick={handleCreateNewNote}
              className="p-2 bg-neo-cyan border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-white transition-all"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={20} strokeWidth={3} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full neo-input pl-12 py-3"
            />
          </div>

          {/* Folders List selection tab row */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b-4 border-black custom-scrollbar">
            {folders.map(fld => (
              <button
                key={fld}
                onClick={() => setSelectedFolder(fld)}
                className={`
                  px-4 py-2 text-sm font-black uppercase border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer whitespace-nowrap
                  ${selectedFolder === fld 
                    ? 'bg-black text-white' 
                    : 'bg-white text-black hover:bg-neo-cyan'
                  }
                `}
              >
                {fld}
              </button>
            ))}
          </div>

          {/* Notes items log list */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 pt-2 min-h-0 custom-scrollbar">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-10 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <FileText className="mx-auto h-12 w-12 mb-4" strokeWidth={2} />
                <p className="font-black uppercase text-lg">No notes found</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div 
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`
                    p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left cursor-pointer transition-all duration-200 flex items-center justify-between group
                    ${activeNote?.id === note.id 
                      ? 'bg-neo-magenta shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] scale-[1.02]' 
                      : 'bg-white hover:bg-neo-cyan'
                    }
                  `}
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="font-black uppercase text-base truncate">{note.title}</h4>
                    <span className="text-xs font-bold bg-white border-2 border-black px-2 py-0.5 mt-2 flex items-center gap-2 w-max shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Folder size={14} strokeWidth={3} />
                      {note.folder}
                    </span>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                    className="p-2 bg-red-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 hover:bg-white text-black transition-all cursor-pointer"
                  >
                    <Trash2 size={16} strokeWidth={3} />
                  </button>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* RIGHT EDITOR PANEL */}
      <div className="flex-1 neo-box bg-white p-6 flex flex-col justify-between overflow-hidden min-h-[600px] md:min-h-0">
        {activeNote ? (
          <div className="h-full flex flex-col justify-between min-h-0">
            
            {/* Note Meta inputs (Title, Folder Selector) */}
            <div className="border-b-4 border-black pb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <input 
                  type="text" 
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note Title"
                  className="bg-neo-yellow border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-2xl font-black uppercase flex-1 focus:outline-none w-full sm:w-auto"
                />

                {/* Editor action shortcuts */}
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  
                  {/* Mode Toggles */}
                  <div className="flex bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-1">
                    <button
                      onClick={() => setEditorMode('edit')}
                      className={`p-2 font-black uppercase text-sm transition-all border-2 border-transparent ${editorMode === 'edit' ? 'bg-black text-white' : 'hover:bg-neo-cyan text-black'}`}
                      title="Edit Mode"
                    >
                      <Edit3 size={20} strokeWidth={3} />
                    </button>
                    <button
                      onClick={() => setEditorMode('preview')}
                      className={`p-2 font-black uppercase text-sm transition-all border-2 border-transparent ${editorMode === 'preview' ? 'bg-black text-white' : 'hover:bg-neo-magenta text-black'}`}
                      title="Preview Mode"
                    >
                      <Eye size={20} strokeWidth={3} />
                    </button>
                  </div>

                  {/* Save buttons */}
                  <button
                    onClick={handleSaveNote}
                    disabled={saveStatus === 'saving'}
                    className="neo-button bg-neo-green hover:bg-white flex items-center gap-2 py-3 px-6 disabled:opacity-50"
                  >
                    {saveStatus === 'saving' ? (
                      <span className="h-5 w-5 border-4 border-black border-t-white bg-neo-cyan rounded-full animate-spin shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                    ) : saveStatus === 'saved' ? (
                      <Check size={20} strokeWidth={4} />
                    ) : (
                      <Save size={20} strokeWidth={3} />
                    )}
                    <span className="text-lg">
                      {saveStatus === 'saved' ? 'Saved' : 'Save'}
                    </span>
                  </button>

                </div>
              </div>

              {/* Folder selection row */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-black uppercase">Folder:</span>
                <input 
                  type="text" 
                  value={noteFolder}
                  onChange={(e) => setNoteFolder(e.target.value)}
                  placeholder="e.g. Physics"
                  className="neo-input py-2 text-sm w-48"
                />
              </div>
            </div>

            {/* Note Editor area */}
            <div className="flex-1 my-6 overflow-y-auto min-h-0 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 custom-scrollbar">
              {editorMode === 'edit' ? (
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="# Outline Note content using markdown headers (#) and bullets (-)"
                  className="w-full h-full bg-transparent border-0 resize-none focus:outline-none text-base font-bold leading-relaxed font-mono custom-scrollbar"
                />
              ) : (
                <div className="prose prose-lg max-w-none select-text">
                  {parseMarkdown(noteContent)}
                </div>
              )}
            </div>

            {/* Editor Footer tips */}
            <div className="font-bold text-sm border-t-4 border-black pt-4 flex items-center gap-3">
              <div className="bg-neo-cyan border-2 border-black p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <BookOpen size={20} strokeWidth={3} />
              </div>
              <span>Supports basic markdown: `#` headers, `##` subheaders, and `-` bullets.</span>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="bg-neo-yellow border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <FileText className="text-black h-20 w-20 mx-auto mb-6" strokeWidth={2} />
              <p className="text-3xl font-black uppercase mb-4">No Note Selected</p>
              <p className="text-lg font-bold max-w-sm mx-auto">Create a new notebook entry or select one from the explorer sidebar.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
