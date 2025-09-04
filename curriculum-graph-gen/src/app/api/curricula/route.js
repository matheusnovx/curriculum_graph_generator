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
      console.log('✅ Curricula API: Neo4j driver connected');
    } catch (error) {
      console.error('🔴 Curricula API: Could not create Neo4j driver.', error);
      driver = null;
    }
  }
  return driver;
}

export async function GET() {
  const driver = await getDriver();
  
  if (!driver) {
    return NextResponse.json({ error: 'Database connection not available.' }, { status: 500 });
  }

  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (cur:Curriculum)
      RETURN cur.id AS id, cur.courseCode AS courseCode, cur.courseName as courseName
      ORDER BY courseCode DESC
    `);
    
    // Process data and ensure unique IDs
    const seenIds = new Set();
    const curricula = [];
    
    result.records.forEach(record => {
      const id = record.get('id');
      const courseName = record.get('courseName');
      let courseCode = record.get('courseCode');
      
      // Ensure courseCode is a string
      if (courseCode === null || courseCode === undefined) {
        courseCode = "208"; // Default course code
      } else if (typeof courseCode !== 'string') {
        courseCode = String(courseCode);
      }
      
      // Create a unique key by combining id and courseCode if necessary
      const uniqueId = seenIds.has(id) ? `${id}-${courseCode}` : id;
      
      seenIds.add(uniqueId);
      curricula.push({
        id: uniqueId,
        courseCode: courseCode,
        courseName: courseName,
        label: `Currículo ${id} - Curso ${courseCode}`
      });
    });

    console.log('Curricula API returning:', curricula);
    
    // If no curricula found, return some default test data
    if (curricula.length === 0) {
      const defaultCurricula = [
        { 
          id: "20071", 
          courseCode: "208",
          courseName: "Ciencia da Computacao",
          label: "Currículo 20071 - Curso 208"
        }
      ];
      console.log('No curricula found, returning default:', defaultCurricula);
      return NextResponse.json({ curricula: defaultCurricula });
    }

    return NextResponse.json({ curricula });

  } catch (error) {
    console.error('🔴 Curricula API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch curricula data' }, { status: 500 });
  } finally {
    if (session) {
      await session.close();
    }
  }
}