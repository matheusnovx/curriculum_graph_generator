// src/app/api/graph/path/[nodeId]/route.js
import { NextResponse } from 'next/server';
import neo4j from 'neo4j-driver';

// This module-level variable will hold the driver instance.
let driver;

/**
 * A robust function to create and verify the Neo4j driver connection.
 */
async function getDriver() {
  // If the driver isn't initialized, create it.
  if (!driver) {
    try {
      driver = neo4j.driver(
        process.env.NEO4J_URI || 'bolt://localhost:7687',
        neo4j.auth.basic(
          process.env.NEO4J_USER || 'neo4j',
          process.env.NEO4J_PASSWORD || 'Matheus2001'
        )
      );
      // Verify the connection is good before returning the driver
      await driver.verifyConnectivity();
      console.log('✅ Path API: Neo4j driver connected');
    } catch (error) {
      // If connection fails, log the real error and set driver to null
      console.error('🔴 Path API: Could not create Neo4j driver.', error);
      driver = null;
    }
  }
  return driver;
}

export async function GET(request, { params }) {
  const { nodeId } = params;

  const driver = await getDriver();
  
  if (!driver) {
    return NextResponse.json({ error: 'Database connection not available.' }, { status: 500 });
  }

  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH p = (:Course {code: $startNodeId})-[:IS_PREREQUISITE_FOR*]->(endNode:Course)
       RETURN nodes(p) AS pathNodes`,
      { startNodeId: nodeId }
    );
    
    const highlightedIds = new Set([nodeId]);

    result.records.forEach(record => {
      const pathNodes = record.get('pathNodes');
      pathNodes.forEach(node => {
        highlightedIds.add(node.properties.code);
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