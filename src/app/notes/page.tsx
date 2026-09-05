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
        return <h1 key={idx} className="text-base font-black uppercase text-black border-b-2 border-black pb-1 mb-2 mt-3">{line.substring(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-sm font-black uppercase text-black mb-1.5 mt-2">{line.substring(3)}</h2>;
      }
      // Bullets
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 pl-3 text-xs font-semibold text-black mb-1.5">
            <span className="mt-1.5 h-1.5 w-1.5 bg-black flex-shrink-0" />
            <span>{line.substring(2)}</span>
          </div>
        );
      }
      // Empty line
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      // Default paragraphs
      return <p key={idx} className="text-xs font-medium text-black leading-relaxed mb-2">{line}</p>;
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
    <div className="h-auto md:h-[calc(100vh-85px)] flex flex-col md:flex-row gap-4 max-w-7xl mx-auto md:overflow-hidden text-black pb-4 md:pb-0">
      
      {/* LEFT SIDEBAR: Notes Directory list */}
      <div className="w-full md:w-80 neo-box bg-neo-yellow p-4 flex flex-col justify-between overflow-hidden min-h-[400px] md:min-h-0">
        
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          
          {/* New note trigger and title */}
          <div className="flex justify-between items-center bg-white border-2 border-black p-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-sm font-black uppercase flex items-center gap-2">
              <FileText size={18} strokeWidth={2.5} />
              Workspace
            </h3>
            <button 
              onClick={handleCreateNewNote}
              className="p-1.5 bg-neo-cyan border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] hover:bg-white transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={16} strokeWidth={2.5} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full neo-input pl-9 py-2 text-xs"
            />
          </div>

          {/* Folders List selection tab row */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 border-b-2 border-black custom-scrollbar">
            {folders.map(fld => (
              <button
                key={fld}
                onClick={() => setSelectedFolder(fld)}
                className={`
                  px-2.5 py-1 text-xs font-black uppercase border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer whitespace-nowrap
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
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pt-1 min-h-0 custom-scrollbar">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-8 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-3">
                <FileText className="mx-auto h-8 w-8 mb-2 text-gray-500" strokeWidth={1.5} />
                <p className="font-black uppercase text-xs">No notes found</p>
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div 
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`
                    p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-left cursor-pointer transition-all duration-200 flex items-center justify-between group
                    ${activeNote?.id === note.id 
                      ? 'bg-neo-magenta shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]' 
                      : 'bg-white hover:bg-neo-cyan'
                    }
                  `}
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="font-black uppercase text-xs truncate">{note.title}</h4>
                    <span className="text-[10px] font-bold bg-white border border-black px-1.5 py-0.5 mt-1 flex items-center gap-1 w-max shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                      <Folder size={12} strokeWidth={2.5} />
                      {note.folder}
                    </span>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                    className="p-1 bg-red-500 border-2 border-black shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] opacity-0 group-hover:opacity-100 hover:bg-white text-white hover:text-black transition-all cursor-pointer"
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* RIGHT EDITOR PANEL */}
      <div className="flex-1 neo-box bg-white p-4 flex flex-col justify-between overflow-hidden min-h-[500px] md:min-h-0">
        {activeNote ? (
          <div className="h-full flex flex-col justify-between min-h-0">
            
            {/* Note Meta inputs (Title, Folder Selector) */}
            <div className="border-b-2 border-black pb-3 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <input 
                  type="text" 
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note Title"
                  className="bg-neo-yellow border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-base font-black uppercase flex-1 focus:outline-none w-full sm:w-auto"
                />

                {/* Editor action shortcuts */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  
                  {/* Mode Toggles */}
                  <div className="flex bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-0.5">
                    <button
                      onClick={() => setEditorMode('edit')}
                      className={`p-1.5 font-black uppercase text-xs transition-all border border-transparent ${editorMode === 'edit' ? 'bg-black text-white' : 'hover:bg-neo-cyan text-black'}`}
                      title="Edit Mode"
                    >
                      <Edit3 size={15} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => setEditorMode('preview')}
                      className={`p-1.5 font-black uppercase text-xs transition-all border border-transparent ${editorMode === 'preview' ? 'bg-black text-white' : 'hover:bg-neo-magenta text-black'}`}
                      title="Preview Mode"
                    >
                      <Eye size={15} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Save buttons */}
                  <button
                    onClick={handleSaveNote}
                    disabled={saveStatus === 'saving'}
                    className="neo-button bg-neo-green hover:bg-white flex items-center gap-1.5 py-2 px-4 disabled:opacity-50 text-xs font-black"
                  >
                    {saveStatus === 'saving' ? (
                      <span className="h-3.5 w-3.5 border-2 border-black border-t-white bg-neo-cyan rounded-full animate-spin shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]" />
                    ) : saveStatus === 'saved' ? (
                      <Check size={16} strokeWidth={3} />
                    ) : (
                      <Save size={16} strokeWidth={2.5} />
                    )}
                    <span>
                      {saveStatus === 'saved' ? 'Saved' : 'Save'}
                    </span>
                  </button>

                </div>
              </div>

              {/* Folder selection row */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase">Folder:</span>
                <input 
                  type="text" 
                  value={noteFolder}
                  onChange={(e) => setNoteFolder(e.target.value)}
                  placeholder="e.g. Physics"
                  className="neo-input py-1 px-2.5 text-xs w-40"
                />
              </div>
            </div>

            {/* Note Editor area */}
            <div className="flex-1 my-3 overflow-y-auto min-h-0 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-3 custom-scrollbar">
              {editorMode === 'edit' ? (
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="# Outline Note content using markdown headers (#) and bullets (-)"
                  className="w-full h-full bg-transparent border-0 resize-none focus:outline-none text-xs font-medium leading-relaxed font-mono custom-scrollbar text-black"
                />
              ) : (
                <div className="prose prose-sm max-w-none select-text">
                  {parseMarkdown(noteContent)}
                </div>
              )}
            </div>

            {/* Editor Footer tips */}
            <div className="font-semibold text-xs border-t-2 border-black pt-2.5 flex items-center gap-2 text-gray-700">
              <div className="bg-neo-cyan border-2 border-black p-1 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                <BookOpen size={14} strokeWidth={2.5} />
              </div>
              <span>Supports basic markdown: `#` headers, `##` subheaders, and `-` bullets.</span>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
            <div className="bg-neo-yellow border-2 border-black p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <FileText className="text-black h-12 w-12 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-lg font-black uppercase mb-1">No Note Selected</p>
              <p className="text-xs font-medium max-w-xs mx-auto text-gray-800">Create a new notebook entry or select one from the explorer sidebar.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
