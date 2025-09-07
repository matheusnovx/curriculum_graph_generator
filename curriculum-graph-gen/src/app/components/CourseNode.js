'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';

function CourseNode({ data }) {
  // Base style
  const baseStyle = {
    borderRadius: '4px',
    padding: '10px',
    minWidth: '150px',
    maxWidth: '220px',
    textAlign: 'center',
    fontSize: '12px',
    transition: 'all 0.2s ease',
  };

  // Determine which style to use based on node properties
  let style = { ...baseStyle };
  
  // Apply custom style first (for course status)
  if (data.style) {
    style = { ...style, ...data.style };
  }
  
  // Highlighting takes precedence
  if (data.isHighlighted) {
    style = {
      ...style,
      boxShadow: '0 0 10px #00bfff',
      border: '2px solid #00bfff',
    };
  }
  
  // Selection takes precedence over highlighting
  if (data.isSelected) {
    style = {
      ...style,
      boxShadow: '0 0 10px #ff9500',
      border: '2px solid #ff9500',
    };
  }

  return (
    <div style={style}>
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      
      <div>
        {data.label}
        
        {data.status === 'completed' && data.equivalence && (
          <div className="text-xs mt-1 italic">
            (Equivalência)
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
}

export default CourseNode;