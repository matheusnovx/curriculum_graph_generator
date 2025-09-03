'use client';

import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, { Controls, Background, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import CourseNode from './CourseNode';

const nodeTypes = {
  course: CourseNode,
};

const defaultEdgeStyle = {
  stroke: '#666',
  strokeWidth: 2,
};
const highlightedEdgeStyle = {
  stroke: '#00bfff',
  strokeWidth: 3,
};

export default function CurriculumDiagram() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightedIds, setHighlightedIds] = useState(new Set());

  useEffect(() => {
    async function fetchInitialGraph() {
      try {
        const response = await fetch('/api/graph');
        const data = await response.json();
        setNodes(data.nodes);
        setEdges(data.edges);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchInitialGraph();
  }, []);

  const onNodeClick = useCallback(async (event, node) => {
    if (highlightedIds.has(node.id)) {
      setHighlightedIds(new Set());
      return;
    }
    try {
      const response = await fetch(`/api/graph/path/${node.id}`);
      const data = await response.json();
      setHighlightedIds(new Set(data.highlightedIds));
    } catch (error) {
      console.error("Failed to fetch path:", error);
    }
  }, [highlightedIds]);

  if (loading) {
    return <div>Loading Curriculum...</div>;
  }

  const nodesWithHighlight = nodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      isHighlighted: highlightedIds.has(node.id),
    }
  }));

  const edgesWithHighlight = edges.map(edge => {
    const isHighlighted = highlightedIds.has(edge.source) && highlightedIds.has(edge.target);
    return {
      ...edge,
      animated: isHighlighted, // Make the highlighted edges animated
      style: isHighlighted ? highlightedEdgeStyle : defaultEdgeStyle,
    };
  });

  return (
    <div style={{ width: '100%', height: '80vh', border: '1px solid #333', borderRadius: '12px' }}>
      <ReactFlow
        nodes={nodesWithHighlight}
        edges={edgesWithHighlight}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <Background color="#aaa" gap={16} />
        <MiniMap zoomable pannable />
      </ReactFlow>
    </div>
  );
}