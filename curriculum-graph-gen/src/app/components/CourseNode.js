'use client';

import React from 'react';
import { Handle, Position } from 'reactflow';

function CourseNode({ data, isConnectable }) {
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
    top: '-18px',
    left: '4px',
    backgroundColor: '#555',
    borderRadius: '8px',
    padding: '4px 12px',
    fontSize: '0.9em',
    fontWeight: 'bold',
  };

  const equivalenceBoxStyle = {
    position: 'absolute',
    top: '-14px',
    right: '-10px',
    backgroundColor: '#555',
    borderRadius: '8px',
    padding: '4px 12px',
    fontSize: '0.7em',
  };

  let style = { ...baseStyle };
  
  if (data.style) {
    style = { ...style, ...data.style };
  }
  
  if (data.isHighlighted) {
    style = {
      ...style,
      boxShadow: '0 0 10px #00bfff',
      border: '2px solid #00bfff',
    };
  }
  
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