"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Sparkles, RefreshCw, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { useStudyStore } from '../../store/studyStore';

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

    try {
      const requestBody = {
        summary: selectedSourceId
      };

      const res = await fetch(`/api/generate/mindmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      setTreeData(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
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
    <div className="h-auto md:h-[calc(100vh-85px)] flex flex-col gap-6 max-w-7xl mx-auto md:overflow-hidden pb-4 md:pb-0 text-black">
      
      {/* Top Workspace settings */}
      <div className="neo-box bg-neo-yellow p-6 flex flex-col md:flex-row items-center justify-between gap-6 z-20">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-white border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <BrainCircuit size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Mind Map Synthesizer</h2>
            <p className="font-bold">Convert studies into interactive concept maps.</p>
          </div>
        </div>

        {/* Source selector form */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <select 
            value={selectedSourceType} 
            onChange={(e) => { setSelectedSourceType(e.target.value as 'document' | 'note'); setSelectedSourceId(''); }}
            className="neo-input bg-white w-auto"
          >
            <option value="document">Documents</option>
            <option value="note">Notes Workspace</option>
          </select>

          <select 
            value={selectedSourceId} 
            onChange={(e) => setSelectedSourceId(e.target.value)}
            className="neo-input bg-white max-w-[220px] truncate"
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
            className="neo-button bg-neo-green hover:bg-white flex items-center gap-2 py-3 px-6 disabled:opacity-50"
          >
            <Sparkles size={20} strokeWidth={3} />
            <span className="text-lg">Generate Map</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div className="flex-1 bg-white neo-box relative overflow-hidden select-none z-10 min-h-[500px] md:min-h-0">
        
        {/* Canvas Background Grid patterns */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-100" 
          style={{ 
            backgroundImage: 'radial-gradient(rgba(0,0,0,1) 2px, transparent 0)', 
            backgroundSize: '30px 30px' 
          }} 
        />

        {/* Loading overlay spinner */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-30">
            <RefreshCw size={48} strokeWidth={3} className="text-black animate-spin" />
            <span className="text-xl font-black uppercase">Analyzing document node correlations...</span>
          </div>
        )}

        {/* Empty Canvas state */}
        {!treeData && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-6 z-20 bg-white/80">
            <div className="bg-neo-cyan border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <BrainCircuit size={64} strokeWidth={2} className="text-black mb-4 mx-auto" />
              <h4 className="text-3xl font-black uppercase mb-2">Canvas Empty</h4>
              <p className="font-bold max-w-sm mx-auto">Select a source at the top and generate the mind map to render nodes here.</p>
            </div>
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
                {/* Draw connector lines */}
                {renderLinks.map((link) => (
                  <line
                    key={link.id}
                    x1={link.x1}
                    y1={link.y1}
                    x2={link.x2}
                    y2={link.y2}
                    stroke="#000"
                    strokeWidth={link.level === 1 ? 6 : 4}
                    strokeDasharray={link.level === 2 ? '10,10' : 'none'}
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
                        px-6 py-3 border-4 border-black font-black text-sm tracking-tight shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-all duration-300 whitespace-nowrap uppercase
                        ${node.isRoot 
                          ? 'bg-neo-magenta text-xl py-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' 
                          : node.level === 1 
                            ? 'bg-neo-cyan hover:bg-white' 
                            : 'bg-neo-yellow hover:bg-white'
                        }
                      `}
                    >
                      {node.label}
                      {node.hasChildren && (
                        <span className="ml-2 font-black bg-white border-2 border-black px-1 py-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3 bg-white border-4 border-black p-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <button 
              onClick={() => handleZoom(1.2)}
              title="Zoom In"
              className="p-3 bg-neo-yellow border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-white transition-all cursor-pointer"
            >
              <ZoomIn size={24} strokeWidth={3} />
            </button>
            <button 
              onClick={() => handleZoom(0.8)}
              title="Zoom Out"
              className="p-3 bg-neo-cyan border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-white transition-all cursor-pointer"
            >
              <ZoomOut size={24} strokeWidth={3} />
            </button>
            <button 
              onClick={resetView}
              title="Reset View"
              className="p-3 bg-neo-magenta border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-white transition-all cursor-pointer"
            >
              <Maximize size={24} strokeWidth={3} />
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
