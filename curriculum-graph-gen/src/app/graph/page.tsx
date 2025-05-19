'use client';

import React from 'react';

const CurriculumPage = () => {
  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4">
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