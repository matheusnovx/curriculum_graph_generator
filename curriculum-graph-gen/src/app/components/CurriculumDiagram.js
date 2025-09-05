'use client';

import React, { useEffect, useState, useCallback } from 'react';
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

  // Callback for when a node is clicked to highlight paths
  const onNodeClick = useCallback(async (event, node) => {
    // If the clicked node is already highlighted, clear all highlights
    if (highlightedIds.has(node.id)) {
      setHighlightedIds(new Set());
      return;
    }
    
    setError(null); // Clear previous errors before making a new call
    try {
      // Construct the URL with query parameters to make the API call dynamic
      const apiUrl = `/api/graph/path/${node.id}?curriculumId=${curriculumId}&courseCode=${courseCode}`;
      console.log(`[onNodeClick] Fetching path from: ${apiUrl}`); // Debugging log

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response.' }));
        console.error(`[onNodeClick] API Error: ${response.status} ${response.statusText}`, errorData); // More detailed error log
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[onNodeClick] Received path data:', data); // Debugging log for the response
      setHighlightedIds(new Set(data.highlightedIds));
    } catch (err) {
      console.error("Failed to fetch path:", err);
      setError(`Failed to fetch path: ${err.message}`); // Set UI error message
    }
  }, [highlightedIds, curriculumId, courseCode]); // Add props to dependency array

  // Memoize nodes and edges with highlighting logic
  const nodesWithHighlight = React.useMemo(() => nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      isHighlighted: highlightedIds.has(node.id),
    }
  })), [nodes, highlightedIds]);

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
    <div style={{ width: '100%', height: '80vh', border: '1px solid #333', borderRadius: '12px', background: '#1a1a1a' }}>
      <ReactFlow
        nodes={nodesWithHighlight}
        edges={edgesWithHighlight}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <Background color="#444" gap={20} />
        <MiniMap zoomable pannable nodeColor={(n) => n.data.isHighlighted ? '#00bfff' : '#666'} />
        {loading && <Panel position="top-center"><div className="p-2 bg-gray-700 rounded">Loading...</div></Panel>}
        {error && <Panel position="top-center"><div className="p-2 bg-red-800 text-white rounded">Error: {error}</div></Panel>}
      </ReactFlow>
    </div>
  );
}

