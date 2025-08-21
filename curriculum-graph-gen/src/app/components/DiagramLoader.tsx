"use client";

import dynamic from 'next/dynamic';

// The dynamic import is now inside a Client Component
const CurriculumDiagram = dynamic(() => import('./CurriculumDiagram'), {
  ssr: false,
  // Optional: Add a loading component
  loading: () => <p>Loading Diagram...</p>, 
});

export default function DiagramLoader() {
  return <CurriculumDiagram />;
}