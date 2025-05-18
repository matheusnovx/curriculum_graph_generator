import Image from "next/image";
import fs from "fs";
import path from "path";

export default function GraphPage() {
  const svgPath = path.join(process.cwd(), "public", "graph.svg");
  const svgContent = fs.readFileSync(svgPath, "utf8");

  return (
    <div className="w-full h-screen overflow-auto bg-gray-100 p-4">
      <div
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}