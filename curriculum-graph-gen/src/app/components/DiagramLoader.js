"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the CurriculumDiagram component to prevent SSR issues with React Flow
const CurriculumDiagram = dynamic(() => import('./CurriculumDiagram'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-[80vh] bg-gray-900 rounded-lg"><p className="text-white">Loading Diagram...</p></div>,
});

export default function DiagramPage() {
  // State to hold the list of all curricula
  const [curricula, setCurricula] = useState([]);
  // State for the currently selected curriculum object
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  // State to manage loading of the curricula list
  const [isLoading, setIsLoading] = useState(true);
  // State for handling potential errors during fetch
  const [error, setError] = useState(null);

  // Effect to fetch the list of curricula when the component mounts
  useEffect(() => {
    async function fetchCurricula() {
      try {
        const response = await fetch('/api/curricula');
        if (!response.ok) {
          throw new Error(`Failed to fetch curricula list: ${response.statusText}`);
        }
        const data = await response.json();
        
        if (data.curricula && data.curricula.length > 0) {
            setCurricula(data.curricula);
            // Set the first curriculum as the default selection
            setSelectedCurriculum(data.curricula[0]);
        } else {
            // Handle case where no curricula are returned
            setError("No curricula found.");
        }

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCurricula();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handler for when the user selects a different curriculum from the dropdown
  const handleCurriculumChange = (event) => {
    const selectedId = event.target.value;
    // Find the full curriculum object from the state
    const curriculum = curricula.find(c => c.id === selectedId);
    setSelectedCurriculum(curriculum);
  };

  return (
    <main className="container mx-auto p-4 font-sans text-white min-h-screen">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-center">Curricula</h1>
        
        <div className="flex flex-col items-center justify-center">
            <label htmlFor="curriculum-select" className="mb-2 text-lg font-medium">
                Selecione um curso:
            </label>
            {isLoading ? (
                <p>Carregando os cursos disponiveis...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <select
                    id="curriculum-select"
                    onChange={handleCurriculumChange}
                    value={selectedCurriculum?.id || ''}
                    className="p-2 border rounded-md bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none w-full max-w-md"
                >
                    {curricula.map((curriculum) => (
                        <option key={curriculum.id} value={curriculum.id}>
                            {curriculum.label}
                        </option>
                    ))}
                </select>
            )}
        </div>

        {/* Conditionally render the diagram only when a curriculum is selected */}
        {selectedCurriculum ? (
          <CurriculumDiagram
            // Pass a key to force re-mounting when selection changes, ensuring a clean state
            key={selectedCurriculum.id}
            curriculumId={selectedCurriculum.originalId || selectedCurriculum.id} // Use original ID for data fetching
            uniqueId={selectedCurriculum.id} // Pass the unique ID if needed
            courseCode={selectedCurriculum.courseCode}
          />
        ) : (
            !isLoading && <div className="text-center p-8">Please select a curriculum to display its graph.</div>
        )}
      </div>
    </main>
  );
}
