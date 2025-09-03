import { NextResponse } from 'next/server';
import neo4j from 'neo4j-driver';
import dagre from 'dagre';

let driver;

async function getDriver() {
  if (!driver) {
    try {
      driver = neo4j.driver(
        'bolt://localhost:7687',
        neo4j.auth.basic('neo4j', 'Matheus2001') // Sua senha
      );
      await driver.verifyConnectivity();
      console.log('✅ Neo4j driver connected');
    } catch (error) {
      console.error('🔴 Could not create Neo4j driver.', error);
      driver = null;
    }
  }
  return driver;
}

export async function GET() {
  const driver = await getDriver();
  if (!driver) {
    return NextResponse.json({ error: 'Could not connect to the database.' }, { status: 500 });
  }

  const session = driver.session();
  try {
    const result = await session.run(`
      // 1. Encontra o currículo âncora
      MATCH (cur:Curriculum {id: "20071", courseCode: 208})
      // 2. Encontra pares de disciplinas que pertencem a esse currículo
      MATCH (c1:Course)-[:PART_OF]->(cur)
      MATCH (c2:Course)-[:PART_OF]->(cur)

      // 3. Encontra a relação de pré-requisito entre elas
      MATCH path = (c1)-[r {curriculumId: cur.id, courseCode: cur.courseCode}]->(c2)
      // 4. Retorna os elementos separados, como o JavaScript espera
      RETURN c1 AS c, path as r, c2 AS d
    `);
    
    console.log(`[API] Query retornou ${result.records.length} relacionamentos para o currículo 20071.`);

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
                data: { label: `${nodeId}\n${courseNode.properties.name}` },
                position: { x: 0, y: 0 },
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
        type: 'default',
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