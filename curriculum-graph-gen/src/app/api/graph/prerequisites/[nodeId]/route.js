import { NextResponse } from 'next/server';
import neo4j from 'neo4j-driver';

let driver;

// --- Database Driver Connection ---
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
      console.log('✅ Prerequisites API: Neo4j driver connected');
    } catch (error) {
      console.error('🔴 Prerequisites API: Could not create Neo4j driver.', error);
      driver = null;
    }
  }
  return driver;
}

// --- API GET Handler ---
export async function GET(request, { params }) {
  // 1. Extract nodeId from the dynamic route segment
  const { nodeId } = await params;

  // 2. Extract query parameters from the request URL
  const { searchParams } = new URL(request.url);
  const curriculumId = searchParams.get('curriculumId');
  const courseCodeParam = searchParams.get('courseCode');

  // 3. Validate the presence and type of required parameters
  if (!curriculumId || !courseCodeParam) {
    return NextResponse.json({ error: 'Missing required query parameters: curriculumId and courseCode.' }, { status: 400 });
  }

  const courseCode = parseInt(courseCodeParam, 10);
  if (isNaN(courseCode)) {
    return NextResponse.json({ error: 'Invalid courseCode. Must be a number.' }, { status: 400 });
  }

  console.log(`[Prerequisites API] Request for nodeId: ${nodeId}, curriculumId: ${curriculumId}, courseCode: ${courseCode}`);

  const driver = await getDriver();
  if (!driver) {
    return NextResponse.json({ error: 'Database connection not available.' }, { status: 500 });
  }

  const session = driver.session();
  try {
    // 4. Use all parameters in the Cypher query to make it fully dynamic
    // Note the reversed relationship direction compared to the path API
    const result = await session.run(
      `
       // Find the starting course within the specified curriculum
       MATCH (startNode:Course {courseId: $nodeId})-[:PART_OF]->(cur:Curriculum {id: $curriculumId, courseCode: $courseCode})
       
       // Find all prerequisite paths ending at this node (reversed direction)
       MATCH path = (endNode:Course)-[:IS_PREREQUISITE_FOR*]->(startNode)

       // Ensure every course in the path belongs to the SAME curriculum
       WHERE ALL(node IN nodes(path) WHERE (node)-[:PART_OF]->(cur))
       AND startNode.etiqueta = true AND endNode.etiqueta = true

       RETURN nodes(path) AS pathNodes
      `,
      { nodeId, curriculumId, courseCode } // Pass all parameters to the query
    );
    
    const highlightedIds = new Set([nodeId]);

    result.records.forEach(record => {
      const pathNodes = record.get('pathNodes');
      pathNodes.forEach(node => {
        if (node.properties.courseId) {
          highlightedIds.add(node.properties.courseId);
        }
      });
    });
    
    console.log(`[Prerequisites API] Found ${highlightedIds.size} nodes to highlight for ${nodeId}.`);

    return NextResponse.json({ highlightedIds: Array.from(highlightedIds) });

  } catch (error) {
    console.error('🔴 Prerequisites API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch prerequisites data' }, { status: 500 });
  } finally {
    if (session) {
      await session.close();
    }
  }
}