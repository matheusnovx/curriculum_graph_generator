// src/app/page.tsx

import DiagramLoader from './components/DiagramLoader'; // 👈 Import the new loader

export default function Home() {
  return (
    <main>
      <h1>
        My Next.js Flow Diagram 🚀
      </h1>
      <p>
        This diagram is interactive! Try dragging the nodes around.
      </p>

      <div>
        <DiagramLoader /> {/* 👈 Use the loader component here */}
      </div>
    </main>
  );
}