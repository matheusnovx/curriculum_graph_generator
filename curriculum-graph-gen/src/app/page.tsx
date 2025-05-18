// app/page.tsx
'use client';

import React from 'react';

const CurriculumPage = () => {
  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-4">
      <div className="relative w-full h-[80vh] max-w-[1800px] bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="absolute inset-0 overflow-auto scrollbar-hide">
          <div className="min-w-full min-h-full flex items-center justify-center p-8">
            <img
              src="/curriculum.gv.svg"
              alt="Curriculum Graph"
              className="max-w-full max-h-full object-contain"
              style={{ minWidth: '1200px' }}
            />
          </div>
        </div>

        {/* Simple Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white"
            onClick={() => document.querySelector('.overflow-auto')?.scrollBy({ top: 50, left: 0 })}
          >
            +
          </button>
          <button
            className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white"
            onClick={() => document.querySelector('.overflow-auto')?.scrollBy({ top: -50, left: 0 })}
          >
            -
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurriculumPage;