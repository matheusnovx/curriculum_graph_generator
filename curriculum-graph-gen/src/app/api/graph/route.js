// src/app/api/graph/route.js
import { NextResponse } from 'next/server';
import neo4j from 'neo4j-driver';
import dagre from 'dagre';
import { type } from 'os';

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
      console.log('✅ Neo4j driver connected');
    } catch (error) {
      // If connection fails, log the real error and set driver to null
      console.error('🔴 Could not create Neo4j driver. Is the database running?', error);
      driver = null;
    }
  }
  return driver; // Return the driver instance (or null if it failed)
}


export async function GET() {
  const driver = await getDriver();
  
  // If the driver failed to connect, return an error response
  if (!driver) {
    return NextResponse.json(
      { error: 'Could not connect to the database.' },
      { status: 500 }
    );
  }

  const session = driver.session();

  try {
    const result = await session.run(`
      MATCH (c:Course)
      OPTIONAL MATCH (c)-[r:IS_PREREQUISITE_FOR]->(d:Course)
      RETURN c, r, d
    `);

    // (The rest of the Dagre layout logic is the same)
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 120 });
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const nodesForReactFlow = [];
    const edgesForReactFlow = [];
    const nodeIds = new Set();
    
    const NODE_WIDTH = 172;
    const NODE_HEIGHT = 50;

    result.records.forEach(record => {
      const courseNode = record.get('c');
      if (courseNode && !nodeIds.has(courseNode.properties.code)) {
        nodeIds.add(courseNode.properties.code);
        dagreGraph.setNode(courseNode.properties.code, { 
          label: courseNode.properties.name, 
          width: NODE_WIDTH, 
          height: NODE_HEIGHT 
        });
        nodesForReactFlow.push({
          id: courseNode.properties.code,
          data: { label: `${courseNode.properties.code}\n${courseNode.properties.name}` },
          position: { x: 0, y: 0 },
          type: 'course'
        });
      }
      const relationship = record.get('r');
      const targetNode = record.get('d');
      if (relationship && courseNode && targetNode) {
        const sourceId = courseNode.properties.code;
        const targetId = targetNode.properties.code;
        dagreGraph.setEdge(sourceId, targetId);
        edgesForReactFlow.push({
          id: `e-${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          type: 'default',
        });
      }
    });

    dagre.layout(dagreGraph);
    
    // 1. Find all node IDs that belong to Fase 1
    const fase1NodeIds = new Set(
      nodesForReactFlow.filter(n => n.data.fase === 1).map(n => n.id)
    );

    // 2. Find the minimum x-position calculated by Dagre for any Fase 1 node
    let targetX = Infinity;
    fase1NodeIds.forEach(id => {
      const dagreNode = dagreGraph.node(id);
      if (dagreNode && dagreNode.x < targetX) {
        targetX = dagreNode.x;
      }
    });

    // 3. Apply the final positions
    nodesForReactFlow.forEach(node => {
      const dagreNode = dagreGraph.node(node.id);
      if (dagreNode) {
        // If the node is in Fase 1, use the targetX. Otherwise, use Dagre's calculated x.
        const finalX = fase1NodeIds.has(node.id) ? targetX : dagreNode.x;
        
        node.position = { 
          x: finalX - NODE_WIDTH / 2, 
          y: dagreNode.y - NODE_HEIGHT / 2 
        };
      }
    });

    return NextResponse.json({ nodes: nodesForReactFlow, edges: edgesForReactFlow });

  } catch (error) {
    console.error('API Route logic error:', error);
    return NextResponse.json({ error: 'Server error during data processing.' }, { status: 500 });
  } finally {
    if (session) {
      await session.close();
    }
  }
}