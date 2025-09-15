'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PdfUploader from '../components/PdfUploader';

const CurriculumDiagram = dynamic(() => import('../components/CurriculumDiagram'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-[80vh] bg-gray-900 rounded-lg">
    <p className="text-white">Carregando diagrama...</p>
  </div>,
});

export default function StudentProgressPage() {
  const [studentData, setStudentData] = useState(null);
  const [totalCourses, setTotalCourses] = useState(0);
  const [showLegendPanel, setShowLegendPanel] = useState(true); // <-- Add this state

  // Try to load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('parsedPdfData');
    if (savedData) {
      try {
        setStudentData(JSON.parse(savedData));
      } catch (error) {
        console.error('Failed to parse saved data:', error);
      }
    }
  }, []);
  
  // Handler for when new data is received from the uploader
  const handleDataReceived = (data) => {
    setStudentData(data);
  };

  // Handler para receber o total de cursos do diagrama
  const handleDiagramLoad = (total) => {
    setTotalCourses(total);
  };
  
  // Calcular estatísticas de progresso
  const progressStats = useMemo(() => {
    if (!studentData) return null;
    
    const completed = studentData.cursadas.length + studentData.dispensadas.length;
    const inProgress = studentData.andamento.length;
    const pending = totalCourses > 0 ? totalCourses - completed - inProgress : 0;
    
    return {
      completed,
      inProgress,
      pending,
      total: totalCourses,
      completionPercentage: totalCourses > 0 ? Math.round((completed / totalCourses) * 100) : 0
    };
  }, [studentData, totalCourses]);
  
  // Componente da legenda que será passado para o painel lateral
  const LegendPanel = useMemo(() => {
    return (
      <div className="p-4 bg-gray-800 text-white text-xs rounded">
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#2d6a4f', border: '1px solid #40916c' }}></div>
          <p>Cursada</p>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#774936', border: '1px solid #ca6702' }}></div>
          <p>Em Andamento</p>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#222', border: '1px solid #666' }}></div>
          <p>Pendente</p>
        </div>
      </div>
    );
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Coluna 1: Uploader, informações do currículo e legenda */}
        <div className="lg:col-span-1">
          <PdfUploader onDataReceived={setStudentData} />

          {studentData && (
            <div className="mt-6 bg-gray-800 p-4 rounded-lg text-white">
              <h2 className="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">Informações:</h2>
              
              <div className="space-y-2 text-sm">
                {studentData.courseName && (
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-400">Curso</span>
                    <span className="truncate" title={studentData.courseName}>{studentData.courseName}</span>
                  </div>
                )}
                
                <div className="flex flex-col">
                  <span className="font-medium text-gray-400">Currículo</span>
                  <span>{studentData.curriculumId}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="font-medium text-gray-400">Código</span>
                  <span>{studentData.courseCode}</span>
                </div>
              </div>
              
              {progressStats && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-400">Concluídas</span>
                      <span>{progressStats.completed}</span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-400">Em Andamento</span>
                      <span>{progressStats.inProgress}</span>
                    </div>
                    
                    {/* TODO: Colocar no parser a diferenca de optativas e obrigatorias
                    
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-400">Pendentes</span>
                      <span>{progressStats.pending}</span>
                    </div> */}
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between text-xs">
                      <span>Progresso:</span>
                      <span>{progressStats.completionPercentage}%</span>
                    </div>
                    <div className="mt-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-600" 
                        style={{ width: `${progressStats.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => {
                  localStorage.removeItem('parsedPdfData');
                  setStudentData(null);
                }}
                className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-800 rounded text-white text-xs w-full"
              >
                Limpar Dados
              </button>
            </div>
          )}

          {/* Legend panel below student info */}
          <div className="mt-6">
            <div className="bg-gray-800 rounded shadow-lg overflow-hidden">
              {/* Header with minimize button */}
              <div
                className="flex justify-between items-center p-2 bg-gray-700 cursor-pointer"
                onClick={() => setShowLegendPanel(!showLegendPanel)}
              >
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
                  {LegendPanel}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Diagrama ocupa 3/4 da largura em telas grandes */}
        <div className="lg:col-span-3">
          {studentData ? (
            <CurriculumDiagram
              curriculumId={studentData.curriculumId}
              courseCode={studentData.courseCode}
              studentProgress={studentData}
              onTotalCoursesUpdate={setTotalCourses}
            />
          ) : (
            <div className="flex items-center justify-center h-[80vh] bg-gray-800 rounded-lg">
              <div className="text-center p-8 max-w-md text-white">
                <h2 className="text-2xl font-bold mb-4">Nenhum dado encontrado</h2>
                <p className="mb-4">Faça upload do PDF de controle curricular para visualizar seu progresso no diagrama.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}