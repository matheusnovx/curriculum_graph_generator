// src/app/page.tsx

import DiagramLoader from './components/DiagramLoader'; // 👈 Import the new loader

export default function Home() {
  return (
    <main>
      <div>
        <DiagramLoader /> {/* 👈 Use the loader component here */}
      </div>
    </main>
  );
}