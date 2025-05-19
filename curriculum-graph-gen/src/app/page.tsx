'use client';

import React from 'react';

const CurriculumPage = () => {
  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col items-center p-4">
      {/* Container da barra de navegação */}
      <div className="w-full max-w-full flex justify-center mb-4">
        <div className="bg-white rounded-xl shadow-xl w-fit">
          <div className="flex gap-4 p-4 border-b border-gray-200">
            <button className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
              Curriculo
            </button>
            <button className="px-6 py-2 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Sessão
            </button>
            <button className="px-6 py-2 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Informações
            </button>
          </div>
        </div>
      </div>

      {/* Container do gráfico */}
      <div className="relative w-full h-[80vh] max-w-[1800px] bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="absolute inset-0 overflow-auto scrollbar-hide">
          <div className="min-w-full min-h-full flex items-center justify-center p-8">
            <img
              src="/graph.svg"
              alt="Curriculum Graph"
              className="max-w-full max-h-full object-contain"
              style={{ minWidth: '1200px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurriculumPage;