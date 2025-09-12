'use client';

import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, { Controls, Background, MiniMap, Panel } from 'reactflow';
import 'reactflow/dist/style.css';
import CourseNode from './CourseNode';
import { organizeGraphLayout } from '../utils/graphLayout';

const nodeTypes = {
  course: CourseNode,
};

// Style definitions
const defaultEdgeStyle = {
  stroke: '#667',
  strokeWidth: 2,
};
const highlightedEdgeStyle = {
  stroke: '#00bfff',
  strokeWidth: 3,
};

// Course status styles
const completedCourseStyle = {
  background: '#2d6a4f',
  border: '2px solid #40916c',
};

const inProgressCourseStyle = {
  background: '#774936',
  border: '2px solid #ca6702',
};

const pendingCourseStyle = {
  background: '#222',
  border: '1px solid #666',
};

export default function CurriculumDiagram({ 
  curriculumId, 
  courseCode, 
  studentProgress, 
  onTotalCoursesUpdate,
  legendPanel,
  tipPanel
}) {
  // Add state for panel visibility
  const [showLegendPanel, setShowLegendPanel] = useState(true);
  const [showTipPanel, setShowTipPanel] = useState(true);
  
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightedIds, setHighlightedIds] = useState(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState(null);
  const [showNodeInfo, setShowNodeInfo] = useState(false);

  // Create a map of course statuses from student progress data
  const courseStatusMap = React.useMemo(() => {
    if (!studentProgress) return {};
    
    const statusMap = {};
    
    // Map for completed courses
    studentProgress.cursadas.forEach(course => {
      statusMap[course.codigo] = { status: 'completed' };
    });
    
    // Map for in-progress courses
    studentProgress.andamento.forEach(course => {
      statusMap[course.codigo] = { status: 'in_progress' };
    });
    
    // Map for courses completed by equivalence
    studentProgress.dispensadas.forEach(course => {
      statusMap[course.codigo] = { 
        status: 'completed',
        equivalence: true 
      };
    });
    
    return statusMap;
  }, [studentProgress]);

  // Load graph data
  useEffect(() => {
    if (!curriculumId || !courseCode) return;

    async function fetchGraphData() {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = `/api/graph?id=${curriculumId}&courseCode=${courseCode}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch graph data: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Aplicar layout automático
        const layoutedNodes = organizeGraphLayout(data.nodes || [], data.edges || []);
        setNodes(layoutedNodes);
        
        setEdges(data.edges || []);
        setHighlightedIds(new Set());

      } catch (err) {
        console.error("Failed to fetch graph data:", err);
        setError(err.message);
        setNodes([]);
        setEdges([]);
      } finally {
        setLoading(false);
      }
    }

    fetchGraphData();
  }, [curriculumId, courseCode]);

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    // Se o nó já está selecionado, alterna entre mostrar o caminho e esconder
    if (selectedNodeId === node.id) {
      handlePathHighlighting(node);
    } else {
      // Se um novo nó foi selecionado, mostra suas informações
      handleNodeSelection(event, node);
    }
  }, [selectedNodeId]);

  // Show node info
  const handleNodeSelection = useCallback((event, node) => {
    // Não limpa os highlightedIds ao selecionar um nó
    // Removido: setHighlightedIds(new Set());
    
    setSelectedNodeInfo({
      id: node.id,
      label: node.data.label,
      description: node.description,
      workloadHours: node.workloadHours,
      status: node.data.status,
      equivalence: node.data.equivalence
    });
    
    setShowNodeInfo(true);
    setSelectedNodeId(node.id);
  }, []);

  // Highlight paths
  const handlePathHighlighting = useCallback(async (node) => {
    // Se já existe um highlight ativo, limpa
    if (highlightedIds.size > 0) {
      setHighlightedIds(new Set());
      return;
    }
    
    setError(null);
    try {
      const apiUrl = `/api/graph/path/${node.id}?curriculumId=${curriculumId}&courseCode=${courseCode}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response.' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
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
    // Não limpa os highlightedIds ao fechar o painel de informações
    // Removido: setHighlightedIds(new Set());
  }, []);

  // Handle pane click
  const onPaneClick = useCallback(() => {
    closeInfo();
    setHighlightedIds(new Set());
  }, [closeInfo]);

  // Apply student progress data to nodes
  const enhancedNodes = React.useMemo(() => {
    if (!nodes.length || Object.keys(courseStatusMap).length === 0) {
      return nodes;
    }
    
    return nodes.map(node => {
      const courseInfo = courseStatusMap[node.id];
      if (!courseInfo) {
        return node;
      }
      
      return {
        ...node,
        data: {
          ...node.data,
          status: courseInfo.status,
          equivalence: courseInfo.equivalence
        }
      };
    });
  }, [nodes, courseStatusMap]);

  // First, create sets to track which courses have pre and post requisites
  const coursesWithPrerequisites = new Set();
  const coursesWithPostRequisites = new Set();

  // When processing edges, update these sets
  edges.forEach(edge => {
    coursesWithPostRequisites.add(edge.source);
    coursesWithPrerequisites.add(edge.target);
  });

  // Apply highlighting and styling to nodes
  const nodesWithHighlight = React.useMemo(() => enhancedNodes.map(node => {
    let nodeStyle = pendingCourseStyle;
    if (node.data.status === 'completed') {
      nodeStyle = completedCourseStyle;
    } else if (node.data.status === 'in_progress') {
      nodeStyle = inProgressCourseStyle;
    }
    
    return {
      ...node,
      data: {
        ...node.data,
        isHighlighted: highlightedIds.has(node.id),
        isSelected: node.id === selectedNodeId,
        style: nodeStyle,
        hasPrerequisites: coursesWithPrerequisites.has(node.id),
        hasPostRequisites: coursesWithPostRequisites.has(node.id)
      }
    };
  }), [enhancedNodes, highlightedIds, selectedNodeId, coursesWithPrerequisites, coursesWithPostRequisites]);

  // Apply highlighting to edges
  const edgesWithHighlight = React.useMemo(() => edges.map(edge => {
    const isHighlighted = highlightedIds.has(edge.source) && highlightedIds.has(edge.target);
    return {
      ...edge,
      animated: isHighlighted,
      style: isHighlighted ? highlightedEdgeStyle : defaultEdgeStyle,
    };
  }), [edges, highlightedIds]);

  // Calculate progress statistics
  const progressStats = React.useMemo(() => {
    if (!studentProgress) return null;
    
    const completed = studentProgress.cursadas.length + studentProgress.dispensadas.length;
    const inProgress = studentProgress.andamento.length;
    const total = nodes.length; // Total courses in curriculum
    const pending = total - completed - inProgress;
    
    return {
      completed,
      inProgress,
      pending,
      total,
      completionPercentage: Math.round((completed / total) * 100)
    };
  }, [studentProgress, nodes.length]);

  // Notifica o componente pai sobre o total de cursos carregados
  useEffect(() => {
    if (nodes.length > 0 && onTotalCoursesUpdate) {
      onTotalCoursesUpdate(nodes.length);
    }
  }, [nodes.length, onTotalCoursesUpdate]);

  return (
    <div className="w-full h-[80vh] border border-gray-700 rounded-lg bg-gray-900">
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
        <Background color="#333" gap={16} />
        <MiniMap 
          nodeColor={(n) => {
            if (n.data.status === 'completed') return '#2d6a4f';
            if (n.data.status === 'in_progress') return '#ca6702';
            if (n.data.isHighlighted) return '#00bfff';
            if (n.data.isSelected) return '#ff9500';
            return '#666';
          }}
        />
        
        {loading && <Panel position="top-center"><div className="p-2 bg-gray-700 rounded">Carregando...</div></Panel>}
        {error && <Panel position="top-center"><div className="p-2 bg-red-800 text-white rounded">Erro: {error}</div></Panel>}
        
        {/* Exibe o painel de legenda com opção de minimizar */}
        {legendPanel && (
          <Panel position="top-left">
            <div className="bg-gray-800 rounded shadow-lg overflow-hidden">
              {/* Header with minimize button */}
              <div className="flex justify-between items-center p-2 bg-gray-700 cursor-pointer" 
                   onClick={() => setShowLegendPanel(!showLegendPanel)}>
                <span className="text-xs font-semibold text-white">Status das Disciplinas</span>
                <button className="text-gray-300 hover:text-white focus:outline-none">
                  {showLegendPanel ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Collapsible content */}
              {showLegendPanel && (
                <div className="p-3">
                  {legendPanel}
                </div>
              )}
            </div>
          </Panel>
        )}
        
        {/* Painel de dicas, se fornecido, também com opção de minimizar */}
        {tipPanel && (
          <Panel position="bottom-left">
            <div className="bg-gray-800 rounded shadow-lg overflow-hidden">
              {/* Header with minimize button */}
              <div className="flex justify-between items-center p-2 bg-gray-700 cursor-pointer"
                   onClick={() => setShowTipPanel(!showTipPanel)}>
                <span className="text-xs font-semibold text-white">Dicas</span>
                <button className="text-gray-300 hover:text-white focus:outline-none">
                  {showTipPanel ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  )}
                </button>
              </div>
              
              {/* Collapsible content */}
              {showTipPanel && (
                <div className="p-3">
                  {tipPanel}
                </div>
              )}
            </div>
          </Panel>
        )}
        
        {/* Course Info Panel */}
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
                  <span className='font-semibold'>Código:</span> {selectedNodeInfo.id}
                </p>
                {selectedNodeInfo.description && (
                  <p className="text-sm mt-1">
                    <span className='font-semibold'>Descrição:</span> {selectedNodeInfo.description}
                  </p>
                )}
                {selectedNodeInfo.workloadHours && (
                  <p className="mt-1 text-sm">
                    <span className="font-semibold">Carga Horária:</span> {selectedNodeInfo.workloadHours}h
                  </p>
                )}
                
                {selectedNodeInfo.status && (
                  <div className="mt-2 p-2 rounded" style={{ 
                    backgroundColor: selectedNodeInfo.status === 'completed' ? '#2d6a4f' : 
                                    selectedNodeInfo.status === 'in_progress' ? '#774936' : 
                                    '#333' 
                  }}>
                    <p className="text-sm font-bold">
                      Status: {selectedNodeInfo.status === 'completed' ? 'Concluída' : 
                              selectedNodeInfo.status === 'in_progress' ? 'Em Andamento' : 
                              'Pendente'}
                      {selectedNodeInfo.equivalence ? ' (Equivalência)' : ''}
                    </p>
                  </div>
                )}
                
                {/* Botão para destacar caminhos */}
                <button 
                  onClick={() => handlePathHighlighting({id: selectedNodeInfo.id})}
                  className="mt-4 w-full px-3 py-2 bg-blue-700 hover:bg-blue-800 rounded text-white text-xs"
                >
                  {highlightedIds.size > 0 ? "Ocultar Caminho" : "Mostrar Pós-requisitos"}
                </button>
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

// Exportar também o objeto de progresso
export { CurriculumDiagram };

