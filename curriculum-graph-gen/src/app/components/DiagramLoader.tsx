"use client";

import dynamic from 'next/dynamic';

const CurriculumDiagram = dynamic(() => import('./CurriculumDiagram'), {
  ssr: false,
  // TODO: Add a loading component
  loading: () => <p>Loading Diagram...</p>, 
});

export default function DiagramLoader() {
  return <CurriculumDiagram />;
}