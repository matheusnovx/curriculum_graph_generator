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
  
  // Componente da legenda que será passado para o CurriculumDiagram
  const LegendPanel = useMemo(() => {
    return (
      <div className="p-4 bg-gray-800 text-white text-xs rounded">
        <p className="font-bold mb-2">Status das Disciplinas:</p>
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
        
        {/* Dica para usuários */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            <span className="font-semibold">Dica:</span> Clique em uma disciplina para ver detalhes. 
            Clique novamente para ver pós-requisitos.
          </p>
        </div>
      </div>
    );
  }, []);
  
  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Coluna 1: Uploader e informações do currículo */}
        <div className="lg:col-span-1">
          <PdfUploader onDataReceived={handleDataReceived} />
          
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
                    
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-400">Pendentes</span>
                      <span>{progressStats.pending}</span>
                    </div>
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
        </div>
        
        {/* Aumentado para 3/4 da largura em telas grandes */}
        <div className="lg:col-span-3">
          {studentData ? (
            <CurriculumDiagram
              curriculumId={studentData.curriculumId}
              courseCode={studentData.courseCode}
              studentProgress={studentData}
              onTotalCoursesUpdate={setTotalCourses}
              legendPanel={LegendPanel}
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