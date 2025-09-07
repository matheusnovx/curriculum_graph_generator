'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import ReactFlow, { Controls, Background, MiniMap, Panel } from 'reactflow';
import 'reactflow/dist/style.css';
import CourseNode from './CourseNode';

const nodeTypes = {
  course: CourseNode,
};

// --- Style Definitions ---
const defaultEdgeStyle = {
  stroke: '#667',
  strokeWidth: 2,
};
const highlightedEdgeStyle = {
  stroke: '#00bfff', // A vibrant cyan for highlighting
  strokeWidth: 3,
};

export default function CurriculumDiagram({ curriculumId, courseCode }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightedIds, setHighlightedIds] = useState(new Set());
  
  // New states for popup management
  const [showNodeInfo, setShowNodeInfo] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);

  useEffect(() => {
    // Ensure we have valid props before trying to fetch
    if (!curriculumId || !courseCode) return;

    async function fetchGraphData() {
      setLoading(true);
      setError(null);
      try {
        // Construct the URL with query parameters
        const apiUrl = `/api/graph?id=${curriculumId}&courseCode=${courseCode}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch graph data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setHighlightedIds(new Set());

      } catch (err) {
        console.error("Failed to fetch graph data:", err);
        setError(err.message);
        setNodes([]); // Clear nodes on error
        setEdges([]); // Clear edges on error
      } finally {
        setLoading(false);
      }
    }

    fetchGraphData();
  }, [curriculumId, courseCode]); // Dependency array ensures this runs on prop changes

  // Handle node click - now with selection state logic
  const onNodeClick = useCallback((event, node) => {
    // If this node is already selected, trigger the path highlighting
    if (selectedNodeId === node.id) {
      handlePathHighlighting(node);
    } else {
      // First click - show info and select the node
      handleNodeSelection(event, node);
    }
  }, [selectedNodeId, highlightedIds, curriculumId, courseCode]);

  // First click handler - show info in top right panel and select node
  const handleNodeSelection = useCallback((event, node) => {
    // Clear any existing highlights when selecting a new node
    setHighlightedIds(new Set());
    
    console.log('Node data:', node);
    
    // Set node info to display in the top right panel
    setSelectedNodeInfo({
      id: node.id,
      label: node.data.label,
      description: node.description,
      workloadHours: node.workloadHours,
    });
    
    setShowNodeInfo(true);
    setSelectedNodeId(node.id);
  }, []);

  // Second click handler - highlight paths for already selected node
  const handlePathHighlighting = useCallback(async (node) => {
    // If there are already highlights, clear them and deselect
    if (highlightedIds.size > 0) {
      setHighlightedIds(new Set());
      setSelectedNodeId(null);
      setShowNodeInfo(false);
      return;
    }
    
    setError(null); // Clear previous errors before making a new call
    try {
      // Construct the URL with query parameters to make the API call dynamic
      const apiUrl = `/api/graph/path/${node.id}?curriculumId=${curriculumId}&courseCode=${courseCode}`;
      console.log(`[handlePathHighlighting] Fetching path from: ${apiUrl}`);

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response.' }));
        console.error(`[handlePathHighlighting] API Error: ${response.status} ${response.statusText}`, errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[handlePathHighlighting] Received path data:', data);
      setHighlightedIds(new Set(data.highlightedIds));
    } catch (err) {
      console.error("Failed to fetch path:", err);
      setError(`Failed to fetch path: ${err.message}`);
    }
  }, [highlightedIds, curriculumId, courseCode]);

  // Close info panel
  const closeInfo = useCallback(() => {
    setShowNodeInfo(false);
    setSelectedNodeId(null);
  }, []);

  // Close info and clear selection when clicking outside
  const onPaneClick = useCallback(() => {
    closeInfo();
    setHighlightedIds(new Set()); // Clear highlights when clicking away
  }, [closeInfo]);

  // Memoize nodes and edges with highlighting logic
  const nodesWithHighlight = React.useMemo(() => nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      isHighlighted: highlightedIds.has(node.id),
      isSelected: node.id === selectedNodeId,
    }
  })), [nodes, highlightedIds, selectedNodeId]);

  const edgesWithHighlight = React.useMemo(() => edges.map(edge => {
    // An edge is highlighted if both its source and target nodes are in the highlighted set
    const isHighlighted = highlightedIds.has(edge.source) && highlightedIds.has(edge.target);
    return {
      ...edge,
      animated: isHighlighted,
      style: isHighlighted ? highlightedEdgeStyle : defaultEdgeStyle,
    };
  }), [edges, highlightedIds]);

  return (
    <div style={{ width: '100%', height: '80vh', border: '1px solid #333', borderRadius: '12px', background: '#1a1a1a', position: 'relative' }}>
      <ReactFlow
        nodes={nodesWithHighlight}
        edges={edgesWithHighlight}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        onPaneClick={onPaneClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <Background color="#444" gap={20} />
        <MiniMap zoomable pannable nodeColor={(n) => n.data.isHighlighted ? '#00bfff' : (n.data.isSelected ? '#ff9500' : '#666')} />
        {loading && <Panel position="top-center"><div className="p-2 bg-gray-700 rounded">Loading...</div></Panel>}
        {error && <Panel position="top-center"><div className="p-2 bg-red-800 text-white rounded">Error: {error}</div></Panel>}
        <Panel position="top-left">
          <div className="p-2 bg-gray-800 text-white text-xs rounded">
            <p>Primeiro click: Ver detalhes do curso</p>
            <p>Segundo click no curso selecionado: Mostra os pós-requisitos</p>
            <p>Clique novamente ou em outro lugar: Limpar seleção</p>
          </div>
        </Panel>
        
        {/* Course Info Panel in Top Right */}
        {showNodeInfo && selectedNodeInfo && (
          <Panel position="top-right">
            <div className="p-4 bg-gray-800 text-white rounded-lg shadow-lg max-w-md">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">{selectedNodeInfo.label}</h3>
                <button 
                  onClick={closeInfo}
                  className="bg-transparent border-none text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2">
                <p className="text-sm">
                  <span className='font-semibold'>Descrição:</span> {selectedNodeInfo.description}
                </p>
                {selectedNodeInfo.workloadHours && (
                  <p className="mt-2 text-sm">
                    <span className="font-semibold">Horas aula: {selectedNodeInfo.workloadHours}h</span> 
                  </p>
                )}
                {/* Add more course details here as needed */}
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

