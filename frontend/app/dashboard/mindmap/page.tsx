'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from 'src/store/useStore';
import { GlassCard } from 'src/components/GlassCard';
import { apiClient } from 'src/lib/axios';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Edge,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Network, 
  Sparkles, 
  Download, 
  BookOpen
} from 'lucide-react';

export default function MindMapPage() {
  const { documents, activeDocument, addNotification } = useStore();
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (activeDocument) {
      setTimeout(() => setSelectedDocId(activeDocument.id), 0);
    } else if (documents.length > 0) {
      setTimeout(() => setSelectedDocId(documents[0].id), 0);
    }
  }, [activeDocument, documents]);

  const handleGenerateMindMap = async () => {
    if (!selectedDocId) return;
    setLoading(true);
    try {
      const res = await apiClient.post('/mindmap/generate', {
        document_id: selectedDocId,
      });
      const data = res.data; // { nodes: [{id, label}], edges: [{source, target, label}] }

      // Lay out nodes in a beautiful circular pattern around a central root
      const rawNodes = data.nodes || [];
      const rawEdges = data.edges || [];
      
      const layoutNodes: Node[] = [];
      const rootX = 350;
      const rootY = 250;
      const radius = 220;

      rawNodes.forEach((node: { id: string; label: string }, idx: number) => {
        let x = rootX;
        let y = rootY;
        
        if (idx > 0) {
          const theta = (2 * Math.PI * (idx - 1)) / (rawNodes.length - 1 || 1);
          x = rootX + radius * Math.cos(theta);
          y = rootY + radius * Math.sin(theta);
        }

        layoutNodes.push({
          id: node.id,
          type: idx === 0 ? 'input' : 'default',
          data: { label: node.label },
          position: { x, y },
          style: {
            background: idx === 0 ? 'rgba(76, 29, 149, 0.85)' : 'rgba(255, 255, 255, 0.75)',
            color: idx === 0 ? '#ffffff' : '#1e1b4b',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(185,152,210,0.15)',
            backdropFilter: 'blur(8px)',
            fontSize: '12px',
            fontWeight: '600',
            width: 150,
            padding: '10px',
          }
        });
      });

      const layoutEdges: Edge[] = rawEdges.map((edge: { source: string; target: string; label?: string }, index: number) => ({
        id: `edge-${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#B998D2', strokeWidth: 2 },
        labelStyle: { fill: '#4c1d95', fontSize: 10, fontWeight: 500 }
      }));

      setNodes(layoutNodes);
      setEdges(layoutEdges);
      addNotification({
        title: 'Mind Map ready',
        message: `Successfully generated a concept map with ${layoutNodes.length} nodes.`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Mind map generation error', err);
      addNotification({
        title: 'Mind Map generation failed',
        message: err.response?.data?.detail || err.message || 'Failed to generate Mind Map.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ nodes, edges }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'mindmap-graph.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportSVG = () => {
    // Generate a simple SVG layout representing the current nodes
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800" width="1000" height="800" style="background:#fdfcfb;">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#B998D2" />
          </marker>
        </defs>
        ${edges.map(e => {
          const sourceNode = nodes.find(n => n.id === e.source);
          const targetNode = nodes.find(n => n.id === e.target);
          if (!sourceNode || !targetNode) return '';
          return `
            <path d="M ${sourceNode.position.x + 75} ${sourceNode.position.y + 20} L ${targetNode.position.x + 75} ${targetNode.position.y + 20}" 
                  stroke="#B998D2" stroke-width="2" marker-end="url(#arrow)" />
            <text x="${(sourceNode.position.x + targetNode.position.x) / 2 + 75}" 
                  y="${(sourceNode.position.y + targetNode.position.y) / 2 + 15}" 
                  fill="#4c1d95" font-size="10" text-anchor="middle">${e.label || ''}</text>
          `;
        }).join('')}
        ${nodes.map(n => `
          <g transform="translate(${n.position.x}, ${n.position.y})">
            <rect width="150" height="40" rx="10" fill="${n.type === 'input' ? '#4c1d95' : '#ffffff'}" stroke="#B998D2" stroke-width="1" />
            <text x="75" y="25" fill="${n.type === 'input' ? '#ffffff' : '#1e1b4b'}" font-size="11" font-weight="bold" text-anchor="middle">${n.data.label}</text>
          </g>
        `).join('')}
      </svg>
    `;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mindmap.svg');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden max-h-[calc(100vh-40px)] z-10 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-purple-950">Interactive Concept Map</h1>
          <p className="text-purple-950/60 mt-1">Extract core subject hierarchies and linkages using generative AI</p>
        </div>
      </div>

      <div className="flex gap-4 shrink-0">
        <GlassCard className="p-3 flex items-center gap-4 border-white/40 shadow-sm flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-950/70 uppercase">
            <BookOpen size={16} /> Select Source
          </div>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="px-3 py-1.5 bg-white/60 border border-white/40 rounded-xl text-sm font-sans focus:outline-none text-purple-950"
          >
            <option value="">-- Select Syllabus PDF --</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.file_name}
              </option>
            ))}
          </select>

          <button
            disabled={loading || !selectedDocId}
            onClick={handleGenerateMindMap}
            className="bg-purple-950 text-white text-xs font-sans font-semibold py-2 px-4 rounded-xl hover:bg-purple-900 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={14} />
                Generate Concept Map
              </>
            )}
          </button>
        </GlassCard>

        {nodes.length > 0 && (
          <GlassCard className="p-3 flex items-center gap-2 border-white/40 shadow-sm">
            <button
              onClick={handleExportJSON}
              className="bg-white/60 hover:bg-white/80 border border-white/40 text-purple-950 text-xs font-semibold py-2 px-3 rounded-xl flex items-center gap-1 shadow-sm transition-all"
            >
              <Download size={13} /> JSON
            </button>
            <button
              onClick={handleExportSVG}
              className="bg-white/60 hover:bg-white/80 border border-white/40 text-purple-950 text-xs font-semibold py-2 px-3 rounded-xl flex items-center gap-1 shadow-sm transition-all"
            >
              <Download size={13} /> SVG
            </button>
          </GlassCard>
        )}
      </div>

      {/* React Flow Workspace */}
      <div className="flex-1 min-h-[400px] relative rounded-3xl overflow-hidden border border-white/30 bg-white/20 backdrop-blur-[12px] shadow-inner">
        {nodes.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            <Background color="#B998D2" gap={16} size={1} />
            <Controls className="!bg-white/80 !backdrop-blur-[10px] !border-white/40 !rounded-xl !shadow-lg text-purple-950" />
            <MiniMap 
              nodeColor={(n) => n.type === 'input' ? 'rgba(76, 29, 149, 0.7)' : 'rgba(255, 255, 255, 0.7)'}
              className="!bg-white/80 !backdrop-blur-[10px] !border-white/40 !rounded-xl !shadow-lg"
            />
          </ReactFlow>
        ) : (
          <div className="absolute inset-0 flex flex-col justify-center items-center text-purple-950/50 p-6">
            <Network size={54} className="text-purple-900/20 mb-3 animate-pulse" />
            <p className="font-serif text-lg font-medium">Concept Map Viewer</p>
            <p className="text-xs text-purple-950/40 mt-1">Select a document and click generate to draw the concept tree!</p>
          </div>
        )}
      </div>
    </div>
  );
}
