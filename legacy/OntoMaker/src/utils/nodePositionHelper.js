/**
 * Utility functions for node positioning and overlap detection
 */

/**
 * Checks if two nodes overlap based on their bounding boxes
 * @param {Object} node1 - First node with position and dimensions
 * @param {Object} node2 - Second node with position and dimensions
 * @param {number} nodeWidth - Default width of a node
 * @param {number} nodeHeight - Default height of a node
 * @returns {boolean} True if nodes overlap, false otherwise
 */
export const nodesOverlap = (node1, node2, nodeWidth = 100, nodeHeight = 100) => {
  // Skip comparison with self
  if (node1.id === node2.id) return false;
  
  // For circular nodes, we can use a distance-based calculation
  const node1CenterX = node1.position.x + nodeWidth / 2;
  const node1CenterY = node1.position.y + nodeHeight / 2;
  
  const node2CenterX = node2.position.x + nodeWidth / 2;
  const node2CenterY = node2.position.y + nodeHeight / 2;
  
  // Calculate distance between centers
  const distance = Math.sqrt(
    Math.pow(node1CenterX - node2CenterX, 2) + 
    Math.pow(node1CenterY - node2CenterY, 2)
  );
  
  // For circles, overlap occurs when distance is less than sum of radii
  const radius = nodeWidth / 2; // Assuming width = height for circles
  return distance < radius * 2;
};

/**
 * Adjusts a node's position if it overlaps with any other nodes
 * @param {Array} nodes - All nodes in the diagram
 * @param {Object} movedNode - The node that was just moved or added
 * @param {number} shiftAmount - Amount to shift the node down if overlap detected
 * @param {number} maxIterations - Maximum number of repositioning attempts
 * @returns {Object} The adjusted node with updated position
 */
export const adjustNodePositionIfOverlapping = (nodes, movedNode, shiftAmount = 15, maxIterations = 10) => {
  if (!movedNode || !nodes.length) return movedNode;
  
  // Create a copy of the node to avoid direct mutation
  const adjustedNode = { ...movedNode };
  
  let iterations = 0;
  let hasOverlap = true;
  
  while (hasOverlap && iterations < maxIterations) {
    hasOverlap = false;
    
    // Check for overlap with any other node
    for (const node of nodes) {
      if (nodesOverlap(adjustedNode, node)) {
        hasOverlap = true;
        // Shift the node down
        adjustedNode.position = {
          ...adjustedNode.position,
          y: adjustedNode.position.y + shiftAmount
        };
        break; // Break after first overlap found and shifted
      }
    }
    
    iterations++;
  }
  
  return adjustedNode;
};