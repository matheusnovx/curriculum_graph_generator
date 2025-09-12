'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';

function CourseNode({ data, isConnectable }) {
  // Base style
  const baseStyle = {
    borderRadius: '4px',
    padding: '10px',
    minWidth: '180px',
    maxWidth: '180px',
    textAlign: 'center',
    fontSize: '12px',
    transition: 'all 0.2s ease',
  };

  const codeBoxStyle = {
    position: 'absolute',
    top: '-18px',      // Moves the box up, outside the parent's boundary
    left: '4px',      // Positions it from the left
    backgroundColor: '#555',
    borderRadius: '8px',
    padding: '4px 12px',
    fontSize: '0.9em',
    fontWeight: 'bold',
  };

  const equivalenceBoxStyle = {
    position: 'absolute',
    top: '-14px',      // Moves the box up, outside the parent's boundary
    right: '-10px',      // Positions it from the right
    backgroundColor: '#555',
    borderRadius: '8px',
    padding: '4px 12px',
    fontSize: '0.7em',
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
      {/* Only render the target handle if the course has prerequisites */}
      {data.hasPrerequisites && (
        <Handle 
          type="target" 
          position={Position.Left} 
          style={{ background: '#555' }} 
          isConnectable={isConnectable}
        />
      )}
      
      <div>
        <div style={codeBoxStyle}>
          {data.labelCode}
        </div>

        {data.labelNome}

        {data.status === 'completed' && data.equivalence && (
          <div style={equivalenceBoxStyle}>
            Equivalência
          </div>
        )}
      </div>
      
      {/* Only render the source handle if the course has post-requisites */}
      {data.hasPostRequisites && (
        <Handle 
          type="source" 
          position={Position.Right} 
          style={{ background: '#555' }} 
          isConnectable={isConnectable}
        />
      )}
    </div>
  );
}

export default CourseNode;