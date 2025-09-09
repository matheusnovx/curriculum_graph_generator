/**
 * Organizes nodes in a layered layout based on prerequisite relationships
 * Places nodes with no prerequisites on the left, and dependent courses to the right
 * Attempts to minimize edge crossings and node overlaps
 */
export function organizeGraphLayout(nodes, edges) {
  if (!nodes || !nodes.length) return nodes;
  
  // Step 1: Calculate dependency levels for each node
  const dependencyLevels = calculateDependencyLevels(nodes, edges);
  
  // Step 2: Organize nodes by levels (columns)
  const nodesByLevel = {};
  Object.keys(dependencyLevels).forEach(nodeId => {
    const level = dependencyLevels[nodeId];
    if (!nodesByLevel[level]) {
      nodesByLevel[level] = [];
    }
    nodesByLevel[level].push(nodeId);
  });
  
  // Step 3: Sort levels to get the natural order
  const sortedLevels = Object.keys(nodesByLevel).sort((a, b) => parseInt(a) - parseInt(b));
  
  // Step 4: Calculate optimal node positioning
  const horizontalSpacing = 250; // Horizontal space between columns
  const verticalSpacing = 120;   // Vertical space between nodes in same column
  
  // Copy nodes to avoid mutating the original
  const positionedNodes = [...nodes];
  
  // Position nodes level by level
  sortedLevels.forEach((level, levelIndex) => {
    const nodesInLevel = nodesByLevel[level];
    
    // Position each node in this level
    nodesInLevel.forEach((nodeId, nodeIndex) => {
      // Find the node in our array
      const nodeIdx = positionedNodes.findIndex(n => n.id === nodeId);
      if (nodeIdx !== -1) {
        // Calculate x position based on level
        const xPos = levelIndex * horizontalSpacing + 100;
        
        // Calculate y position (centered in column)
        const columnHeight = nodesInLevel.length * verticalSpacing;
        const startY = (1000 - columnHeight) / 2; // Center column in a 1000px height
        const yPos = startY + nodeIndex * verticalSpacing;
        
        // Update node position
        positionedNodes[nodeIdx] = {
          ...positionedNodes[nodeIdx],
          position: { x: xPos, y: yPos }
        };
      }
    });
  });
  
  return positionedNodes;
}

/**
 * Calculates the dependency level for each node based on prerequisites
 * Nodes with no prerequisites start at level 0
 * A node's level is 1 + the maximum level of its prerequisites
 */
function calculateDependencyLevels(nodes, edges) {
  // Create a map of node IDs to their dependency levels
  const levels = {};
  
  // Create an adjacency list for prerequisite relationships
  const prerequisites = {};
  const dependents = {};
  
  // Initialize prerequisites map for all nodes
  nodes.forEach(node => {
    prerequisites[node.id] = [];
    dependents[node.id] = [];
    levels[node.id] = 0; // Default level is 0
  });
  
  // Populate the prerequisites map
  edges.forEach(edge => {
    // edge.source is prerequisite for edge.target
    prerequisites[edge.target].push(edge.source);
    dependents[edge.source].push(edge.target);
  });
  
  // Find all nodes with no prerequisites (level 0)
  const startNodes = nodes.filter(node => prerequisites[node.id].length === 0).map(node => node.id);
  
  // Process nodes in topological order using BFS
  const queue = [...startNodes];
  const visited = new Set(startNodes);
  
  while (queue.length > 0) {
    const currentNodeId = queue.shift();
    
    // Process all dependents of this node
    for (const dependentId of dependents[currentNodeId]) {
      // Update level if needed
      levels[dependentId] = Math.max(
        levels[dependentId],
        levels[currentNodeId] + 1
      );
      
      // If we've processed all prerequisites of this dependent, add it to the queue
      const allPrerequisitesProcessed = prerequisites[dependentId].every(
        prereqId => visited.has(prereqId)
      );
      
      if (allPrerequisitesProcessed && !visited.has(dependentId)) {
        queue.push(dependentId);
        visited.add(dependentId);
      }
    }
  }
  
  // Handle cycles (if any) by using a separate pass
  let changed = true;
  let iterations = 0;
  const maxIterations = nodes.length * 2; // Safeguard against infinite loops
  
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    for (const edge of edges) {
      if (levels[edge.target] <= levels[edge.source]) {
        levels[edge.target] = levels[edge.source] + 1;
        changed = true;
      }
    }
  }
  
  return levels;
}