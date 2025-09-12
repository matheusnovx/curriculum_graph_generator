import { NextResponse } from 'next/server';
import neo4j from 'neo4j-driver';
import dagre from 'dagre';

let driver;

// --- Database Driver Connection ---
async function getDriver() {
  if (!driver) {
    try {
      const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
      const user = process.env.NEO4J_USER || 'neo4j';
      const password = process.env.NEO4J_PASSWORD || 'Matheus2001';
      
      driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
      await driver.verifyConnectivity();
      console.log('✅ Neo4j driver connected');
    } catch (error) {
      console.error('🔴 Could not create Neo4j driver.', error);
      driver = null;
    }
  }
  return driver;
}

// --- API GET Handler ---
export async function GET(request) {
  // 1. Extract query parameters from the request URL
  const { searchParams } = new URL(request.url);
  const curriculumId = searchParams.get('id') || '20071'; // Default to 20071 if not provided
  const courseCodeParam = searchParams.get('courseCode') || '208'; // Default to 208 if not provided

  // Ensure courseCode is an integer, as it's likely stored as a number in Neo4j
  const courseCode = parseInt(courseCodeParam, 10);
  if (isNaN(courseCode)) {
      return NextResponse.json({ error: 'Invalid courseCode. Must be a number.' }, { status: 400 });
  }
  
  console.log(`[API] Received request for curriculumId: ${curriculumId}, courseCode: ${courseCode}`);

  const driver = await getDriver();
  if (!driver) {
    return NextResponse.json({ error: 'Could not connect to the database.' }, { status: 500 });
  }

  const session = driver.session();
  try {
    // 2. Use the parameters in the Cypher query to make it dynamic
    const result = await session.run(`
      // Find the curriculum based on the provided parameters
      MATCH (cur:Curriculum {id: $curriculumId, courseCode: $courseCode})
      
      // Find pairs of courses that belong to this curriculum
      MATCH (c1:Course)-[:PART_OF]->(cur)
      MATCH (c2:Course)-[:PART_OF]->(cur)

      // Find the prerequisite relationship between them for this specific curriculum
      MATCH path = (c1)-[r {curriculumId: cur.id, courseCode: cur.courseCode}]->(c2)
      WHERE c1.etiqueta = true AND c2.etiqueta = true
      
      // Return the source, path, and destination nodes
      RETURN c1 AS c, path as r, c2 AS d
    `, { curriculumId, courseCode });
    
    console.log(`[API] Query returned ${result.records.length} relationships for curriculum ${curriculumId}.`);

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 120, marginx: 50, marginy: 50 });
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodesMap = new Map();
    const edgesForReactFlow = [];
    
    const NODE_WIDTH = 172;
    const NODE_HEIGHT = 50;

    const addNode = (courseNode) => {
        if (!courseNode) return;
        const nodeId = courseNode.properties.courseId;
        if (!nodesMap.has(nodeId)) {
            nodesMap.set(nodeId, {
              id: nodeId,
              data: { labelCode: nodeId, labelNome: courseNode.properties.name },
              description: courseNode.properties.description || 'No description available',
              position: { x: 0, y: 0 },
              workloadHours: parseInt(courseNode.properties.workloadHours, 10) || 0,
              type: 'course'
            });
            dagreGraph.setNode(nodeId, { 
              label: courseNode.properties.name, 
              width: NODE_WIDTH, 
              height: NODE_HEIGHT 
            });
        }
    };

    result.records.forEach(record => {
      const sourceNode = record.get('c');
      const targetNode = record.get('d');
      
      addNode(sourceNode);
      addNode(targetNode);
        
      const sourceId = sourceNode.properties.courseId;
      const targetId = targetNode.properties.courseId;
        
      dagreGraph.setEdge(sourceId, targetId);
      edgesForReactFlow.push({
        id: `e-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        type: 'smoothstep',
      });
    });

    dagre.layout(dagreGraph);
    
    const finalNodes = Array.from(nodesMap.values()).map(node => {
        const dagreNode = dagreGraph.node(node.id);
        if(dagreNode){
            node.position = { 
                x: dagreNode.x - NODE_WIDTH / 2, 
                y: dagreNode.y - NODE_HEIGHT / 2 
            };
        }
        return node;
    });
    
    console.log(`[API] Final response: ${finalNodes.length} nodes, ${edgesForReactFlow.length} edges.`);
    return NextResponse.json({ nodes: finalNodes, edges: edgesForReactFlow });

  } catch (error) {
    console.error('API Route logic error:', error);
    return NextResponse.json({ error: 'Server error during data processing.' }, { status: 500 });
  } finally {
    if (session) {
      await session.close();
    }
  }
}
