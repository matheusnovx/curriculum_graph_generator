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
  
  // Calcular estatísticas de progresso (contagem e progresso consideram apenas obrigatórias para a barra)
  const progressStats = useMemo(() => {
    if (!studentData) return null;

    const countByType = (arr) => {
      const acc = { Ob: 0, Op: 0, total: 0 };
      if (!Array.isArray(arr)) return acc;
      for (const c of arr) {
        if (!c || !c.tipo) continue;
        if (c.tipo === 'Ob') acc.Ob += 1;
        else if (c.tipo === 'Op') acc.Op += 1;
        acc.total += 1;
      }
      return acc;
    };

    const cursadas = countByType(studentData.cursadas);
    const dispensadas = countByType(studentData.dispensadas);
    const andamento = countByType(studentData.andamento);

    // Contagens gerais (úteis para exibição)
    const completedTotal = cursadas.total + dispensadas.total;
    const inProgressTotal = andamento.total;

    // Contagens APENAS das obrigatórias (usadas para cálculo da barra de progresso)
    const completedOb = cursadas.Ob;
    const inProgressOb = andamento.Ob;

    // total de obrigatórias (fallback para totalCourses se não fornecido)
    const totalMandatory = typeof studentData.totalMandatory === 'number'
      ? studentData.totalMandatory
      : totalCourses;

    const pendingOb = totalMandatory > 0 ? Math.max(0, totalMandatory - completedOb - inProgressOb) : 0;
    const completionPercentage = totalMandatory > 0
      ? Math.round((completedOb / totalMandatory) * 100)
      : 0;

    return {
      // exibição
      completed: completedTotal,
      completedOb,
      completedOp: cursadas.Op + dispensadas.Op,
      inProgress: inProgressTotal,
      inProgressOb,
      inProgressOp: andamento.Op,
      // progresso (somente obrigatórias)
      pending: pendingOb,
      total: totalCourses,
      totalMandatory,
      completionPercentage
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
                
                <div className="space-y-2 text-sm">
                {studentData.courseName && (
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-400">Curso</span>
                    <span className="truncate" title={studentData.courseName}>{studentData.courseName}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-400 text-sm">Currículo:</span>
                    <span className="text-sm truncate max-w-[8rem]" title={studentData.curriculumId}>{studentData.curriculumId}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-400 text-sm">Código</span>
                    <span className="text-sm">{studentData.courseCode}</span>
                  </div>
                </div>
              </div>
              </div>
              
              {progressStats && (
                <div className="mt-4 pt-4 border-t border-gray-700 text-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-300">Concluídas</span>
                      <div className="mt-1 text-white text-lg font-semibold">{progressStats.completed}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        ({progressStats.completedOb} Ob / {progressStats.completedOp} Op)
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-300">Em Andamento</span>
                      <div className="mt-1 text-white text-lg font-semibold">{progressStats.inProgress}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        ({progressStats.inProgressOb} Ob / {progressStats.inProgressOp} Op)
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-gray-300">Pendentes</span>
                      <div className="mt-1 text-white text-lg font-semibold">{progressStats.pending}</div>
                      <div className="text-xs text-gray-400 mt-1">de {progressStats.totalMandatory || '—'}</div>
                    </div>
                    <div className="ml-4">
                      <div className="px-2 py-1 bg-gray-700 text-xs rounded-md">Obrigatórias</div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progresso (apenas obrig.)</span>
                      <span>{progressStats.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${progressStats.completionPercentage}%` }}
                      />
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
              <div className="flex items-center p-2 bg-gray-700">
                <span className="text-xs font-semibold text-white">Status das Disciplinas</span>
              </div>

              <div className="p-3">
                {LegendPanel}
              </div>
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