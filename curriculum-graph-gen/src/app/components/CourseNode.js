// src/app/components/CourseNode.js
'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';

const handleStyle = { background: '#555' };

// Define the two styles the node can have
const defaultStyle = {
  background: '#222',
  border: '1px solid #666',
  borderRadius: '4px',
  padding: '10px 15px',
  width: 172,
  textAlign: 'center',
  color: '#ddd',
  fontSize: '14px',
  whiteSpace: 'pre-wrap',
  transition: 'all 0.2s ease', // Add a smooth transition
};

const highlightedStyle = {
  ...defaultStyle,
  border: '2px solid #00bfff',
  boxShadow: '0 0 10px #00bfff',
};

// The component now checks for data.isHighlighted
function CourseNode({ data }) {
  // Conditionally choose the style based on the new property
  const style = data.isHighlighted ? highlightedStyle : defaultStyle;

  return (
    <div style={style}>
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
}

export default CourseNode;