import { NextResponse } from 'next/server';
import neo4j from 'neo4j-driver';

let driver;

async function getDriver() {
  if (!driver) {
    try {
      driver = neo4j.driver(
        process.env.NEO4J_URI || 'bolt://localhost:7687',
        neo4j.auth.basic(
          process.env.NEO4J_USER || 'neo4j',
          process.env.NEO4J_PASSWORD || 'Matheus2001'
        )
      );
      await driver.verifyConnectivity();
      console.log('✅ Path API: Neo4j driver connected');
    } catch (error) {
      console.error('🔴 Path API: Could not create Neo4j driver.', error);
      driver = null;
    }
  }
  return driver;
}

export async function GET(request, { params }) {
  const { nodeId } = await params;
  const driver = await getDriver();
  
  if (!driver) {
    return NextResponse.json({ error: 'Database connection not available.' }, { status: 500 });
  }

  const session = driver.session();
  try {
    const result = await session.run(
      // TODO: Essa query pode estar pegando nodos a mais e travando
      `
       // 1. Find the starting course and its curriculum
       MATCH (startNode:Course {courseId: $startNodeId})-[:PART_OF]->(cur:Curriculum {id: "20071"})
       // 2. Find all prerequisite paths starting from this node
       MATCH path = (startNode)-[:IS_PREREQUISITE_FOR*]->(endNode:Course)
       // 3. IMPORTANT: Ensure every single course in the path belongs to the same curriculum
       WHERE ALL(node IN nodes(path) WHERE (node)-[:PART_OF]->(cur))
       AND startNode.etiqueta = true AND endNode.etiqueta = true

       RETURN nodes(path) AS pathNodes
      `,
      { startNodeId: nodeId }
    );
    
    const highlightedIds = new Set([nodeId]);

    result.records.forEach(record => {
      const pathNodes = record.get('pathNodes');
      pathNodes.forEach(node => {
        if(node.properties.courseId) {
            highlightedIds.add(node.properties.courseId);
        }
      });
    });

    return NextResponse.json({ highlightedIds: Array.from(highlightedIds) });

  } catch (error) {
    console.error('🔴 Path API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch path data' }, { status: 500 });
  } finally {
    if (session) {
      await session.close();
    }
  }
}