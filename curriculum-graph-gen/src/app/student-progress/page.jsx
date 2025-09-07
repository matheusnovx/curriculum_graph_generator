'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PdfUploader from '../components/PdfUploader';

const CurriculumDiagram = dynamic(() => import('../components/CurriculumDiagram'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-[80vh] bg-gray-900 rounded-lg">
    <p className="text-white">Loading diagram...</p>
  </div>,
});

export default function StudentProgressPage() {
  const [studentData, setStudentData] = useState(null);
  
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
  
  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-3xl font-bold text-center text-white mb-8">
        Student Curriculum Progress
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PdfUploader onDataReceived={handleDataReceived} />
          
          {studentData && (
            <div className="mt-6 bg-gray-800 p-4 rounded-lg text-white">
              <h2 className="text-xl font-semibold mb-4">Curriculum Statistics</h2>
              
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Curriculum ID:</span> {studentData.curriculumId}
                </p>
                <p>
                  <span className="font-medium">Course Code:</span> {studentData.courseCode}
                </p>
                {studentData.courseName && (
                  <p>
                    <span className="font-medium">Course Name:</span> {studentData.courseName}
                  </p>
                )}
                <p>
                  <span className="font-medium">Completed Courses:</span> {studentData.cursadas.length + studentData.dispensadas.length}
                </p>
                <p>
                  <span className="font-medium">In Progress:</span> {studentData.andamento.length}
                </p>
              </div>
              
              <button 
                onClick={() => {
                  localStorage.removeItem('parsedPdfData');
                  setStudentData(null);
                }}
                className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-800 rounded text-white text-sm"
              >
                Clear Data
              </button>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-2">
          {studentData ? (
            <CurriculumDiagram
              curriculumId={studentData.curriculumId}
              courseCode={studentData.courseCode}
              studentProgress={studentData}
            />
          ) : (
            <div className="flex items-center justify-center h-[80vh] bg-gray-800 rounded-lg">
              <div className="text-center p-8 max-w-md text-white">
                <h2 className="text-2xl font-bold mb-4">No Student Data</h2>
                <p className="mb-4">Upload a curriculum control PDF to visualize your progress on the curriculum graph.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}