"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Sparkles, RefreshCw, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useStudyStore } from '../../store/studyStore';
import { API_BASE } from '../../lib/api';

interface MindNode {
  id: string;
  label: string;
  children?: MindNode[];
}

export default function MindMap() {
  const {
    documents,
    notes,
    fetchDocuments,
    fetchNotes,
    isBackendOnline
  } = useStudyStore();

  const [selectedSourceType, setSelectedSourceType] = useState<'document' | 'note'>('document');
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<MindNode | null>(null);
  
  // Canvas zoom & pan state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDocuments();
    fetchNotes();
  }, [fetchDocuments, fetchNotes]);

  const handleGenerateMindMap = async () => {
    if (!selectedSourceId) return;
    setLoading(true);
    setTreeData(null);

    const generateMockMindMap = () => {
      const sourceName = selectedSourceType === 'document'
        ? documents.find(d => d.id === selectedSourceId)?.filename || 'Document Source'
        : notes.find(n => n.id === selectedSourceId)?.title || 'Notes Source';

      setTreeData({
        id: 'root',
        label: sourceName.split('.')[0],
        children: [
          {
            id: 'c1',
            label: 'Active Memory',
            children: [
              { id: 'c1_1', label: 'Retrieval Practice', children: [] },
              { id: 'c1_2', label: 'Synaptic Plasticity', children: [] }
            ]
          },
          {
            id: 'c2',
            label: 'Scheduling Methods',
            children: [
              { id: 'c2_1', label: 'Expanding Gaps', children: [] },
              { id: 'c2_2', label: 'Leitner Boxes', children: [] }
            ]
          },
          {
            id: 'c3',
            label: 'Visual Synthesis',
            children: [
              { id: 'c3_1', label: 'Hierarchy Linking', children: [] },
              { id: 'c3_2', label: 'Chunking Material', children: [] }
            ]
          }
        ]
      });
      setLoading(false);
    };

    if (isBackendOnline) {
      try {
        const endpoint = selectedSourceType === 'document' 
          ? `${API_BASE}/document/${selectedSourceId}/mindmap`
          : `${API_BASE}/notes/${selectedSourceId}/mindmap`;
          
        const res = await fetch(endpoint, { method: 'POST' });
        if (!res.ok) throw new Error("API Failed");
        const data = await res.json();
        setTreeData(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setTimeout(generateMockMindMap, 1000);
      }
    } else {
      setTimeout(generateMockMindMap, 1000);
    }
  };

  // Toggle node children display
  const toggleNodeCollapse = (nodeId: string) => {
    setCollapsedNodes(prev => {
      const copy = new Set(prev);
      if (copy.has(nodeId)) {
        copy.delete(nodeId);
      } else {
        copy.add(nodeId);
      }
      return copy;
    });
  };

  // Canvas Drag/Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (factor: number) => {
    setZoom(prev => Math.max(0.4, Math.min(2.5, prev * factor)));
  };

  const resetView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  // Tree coordinates math rendering helper
  // Returns coordinates for nodes and links in a simple radial or branched layout
  const buildRenderCoordinates = () => {
    if (!treeData) return { nodes: [], links: [] };

    const nodes: Array<{ id: string, label: string, x: number, y: number, level: number, isRoot: boolean, hasChildren: boolean }> = [];
    const links: Array<{ id: string, x1: number, y1: number, x2: number, y2: number, level: number }> = [];

    // Root coordinate
    const centerX = 300;
    const centerY = 250;
    
    nodes.push({
      id: treeData.id,
      label: treeData.label,
      x: centerX,
      y: centerY,
      level: 0,
      isRoot: true,
      hasChildren: (treeData.children?.length || 0) > 0
    });

    const isCollapsed = (id: string) => collapsedNodes.has(id);

    if (treeData.children && !isCollapsed(treeData.id)) {
      const childCount = treeData.children.length;
      
      treeData.children.forEach((child, cIdx) => {
        // Spread children in circle branches around center
        const angle = (cIdx * 2 * Math.PI) / childCount;
        const radius = 150;
        const cx = centerX + radius * Math.cos(angle);
        const cy = centerY + radius * Math.sin(angle);

        nodes.push({
          id: child.id,
          label: child.label,
          x: cx,
          y: cy,
          level: 1,
          isRoot: false,
          hasChildren: (child.children?.length || 0) > 0
        });

        // Link from root to child
        links.push({
          id: `link-root-${child.id}`,
          x1: centerX,
          y1: centerY,
          x2: cx,
          y2: cy,
          level: 1
        });

        if (child.children && !isCollapsed(child.id) && !isCollapsed(treeData.id)) {
          const subCount = child.children.length;
          child.children.forEach((sub, sIdx) => {
            // Position sub-children branching outwards from the parent branch angle
            const subAngle = angle + ((sIdx - (subCount - 1) / 2) * Math.PI) / 5;
            const subRadius = 120;
            const sx = cx + subRadius * Math.cos(subAngle);
            const sy = cy + subRadius * Math.sin(subAngle);

            nodes.push({
              id: sub.id,
              label: sub.label,
              x: sx,
              y: sy,
              level: 2,
              isRoot: false,
              hasChildren: false
            });

            // Link from child to subchild
            links.push({
              id: `link-${child.id}-${sub.id}`,
              x1: cx,
              y1: cy,
              x2: sx,
              y2: sy,
              level: 2
            });
          });
        }
      });
    }

    return { nodes, links };
  };

  const { nodes: renderNodes, links: renderLinks } = buildRenderCoordinates();

  return (
    <div className="h-auto md:h-[calc(100vh-85px)] flex flex-col gap-6 max-w-7xl mx-auto md:overflow-hidden pb-4 md:pb-0">
      
      {/* Top Workspace settings */}
      <div className="bg-[#0B1120]/75 backdrop-blur-xl border border-white/8 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <BrainCircuit size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-md font-bold text-white leading-tight">AI Mind Map Synthesizer</h2>
            <p className="text-xs text-white/40">Convert studies into interactive concept maps.</p>
          </div>
        </div>

        {/* Source selector form */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select 
            value={selectedSourceType} 
            onChange={(e) => { setSelectedSourceType(e.target.value as 'document' | 'note'); setSelectedSourceId(''); }}
            className="bg-[#030712] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white/80 focus:outline-none"
          >
            <option value="document">Documents</option>
            <option value="note">Notes Workspace</option>
          </select>

          <select 
            value={selectedSourceId} 
            onChange={(e) => setSelectedSourceId(e.target.value)}
            className="bg-[#030712] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white/80 focus:outline-none max-w-[180px] truncate"
          >
            <option value="">-- Select Source --</option>
            {selectedSourceType === 'document' ? (
              documents.map(d => <option key={d.id} value={d.id}>{d.filename}</option>)
            ) : (
              notes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)
            )}
          </select>

          <button
            onClick={handleGenerateMindMap}
            disabled={loading || !selectedSourceId}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={13} />
            Generate Map
          </button>
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div className="flex-1 bg-[#030712] border border-white/8 rounded-2xl relative overflow-hidden select-none z-10 min-h-[500px] md:min-h-0">
        
        {/* Canvas Background Grid patterns */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20" 
          style={{ 
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 0)', 
            backgroundSize: '24px 24px' 
          }} 
        />

        {/* Loading overlay spinner */}
        {loading && (
          <div className="absolute inset-0 bg-[#030712]/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30">
            <RefreshCw size={24} className="text-indigo-400 animate-spin" />
            <span className="text-xs text-white/50 font-medium">Analyzing document node correlations...</span>
          </div>
        )}

        {/* Empty Canvas state */}
        {!treeData && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 z-20">
            <BrainCircuit size={40} className="text-white/10" />
            <h4 className="text-sm font-bold text-white/60">Canvas Empty</h4>
            <p className="text-xs text-white/30 max-w-[280px]">Select a source at the top and generate the mind map to render nodes here.</p>
          </div>
        )}

        {/* Interactive map nodes area */}
        {treeData && (
          <div 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`absolute inset-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} z-10`}
          >
            <div 
              style={{
                transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                transformOrigin: '0 0',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
              className="absolute top-0 left-0 w-full h-full"
            >
              <svg className="absolute inset-0 overflow-visible w-full h-full">
                {/* Glow Filter Definition */}
                <defs>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Draw connector lines */}
                {renderLinks.map((link) => (
                  <line
                    key={link.id}
                    x1={link.x1}
                    y1={link.y1}
                    x2={link.x2}
                    y2={link.y2}
                    stroke={link.level === 1 ? '#8b5cf6' : '#06b6d4'}
                    strokeWidth={link.level === 1 ? 2.5 : 1.5}
                    strokeOpacity={0.4}
                    strokeDasharray={link.level === 2 ? '4,4' : 'none'}
                    filter="url(#glow)"
                  />
                ))}
              </svg>

              {/* Render Nodes as HTML overlay */}
              {renderNodes.map((node) => {
                const isCollapsed = collapsedNodes.has(node.id);
                return (
                  <motion.div
                    key={node.id}
                    style={{
                      left: node.x,
                      top: node.y,
                      transform: 'translate(-50%, -50%)'
                    }}
                    whileHover={{ scale: 1.05 }}
                    className="absolute z-20"
                  >
                    <div 
                      onClick={() => node.hasChildren && toggleNodeCollapse(node.id)}
                      className={`
                        px-4 py-2.5 rounded-xl border font-bold text-xs tracking-tight shadow-xl cursor-pointer transition-all duration-300 whitespace-nowrap
                        ${node.isRoot 
                          ? 'bg-gradient-primary border-indigo-400 text-white shadow-indigo-500/20 text-sm py-3' 
                          : node.level === 1 
                            ? 'bg-[#0B1120]/90 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10' 
                            : 'bg-[#0B1120]/80 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10'
                        }
                        ${isCollapsed ? 'ring-2 ring-amber-500/50' : ''}
                      `}
                    >
                      {node.label}
                      {node.hasChildren && (
                        <span className="ml-1.5 opacity-55 font-mono text-[9px]">
                          {isCollapsed ? '+' : '−'}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Floating Controls Overlay (Zoom In, Zoom Out, Reset View) */}
        {treeData && (
          <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 bg-[#0B1120]/85 border border-white/8 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl">
            <button 
              onClick={() => handleZoom(1.2)}
              title="Zoom In"
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              <ZoomIn size={14} />
            </button>
            <button 
              onClick={() => handleZoom(0.8)}
              title="Zoom Out"
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              <ZoomOut size={14} />
            </button>
            <button 
              onClick={resetView}
              title="Reset View"
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              <Maximize size={14} />
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
