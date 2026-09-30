/**
 * Utility functions for edge path generation and marker configuration
 * These functions handle the complex logic for curved edges with proper arrow markers
 */

/**
 * Calculates the marker orientation and reference points based on connection direction
 * @param {Object} params - Parameters for marker calculation
 * @param {string} params.sourceHandle - Source handle ID ('top', 'bottom', 'left', 'right')
 * @param {string} params.targetHandle - Target handle ID ('top', 'bottom', 'left', 'right')
 * @param {boolean} params.isInverted - Whether the connection direction is inverted
 * @param {string} params.direction - Direction of the arrow ('start' or 'end')
 * @returns {Object} Marker configuration object with orientation and reference points
 */
export const calculateMarkerConfig = ({ sourceHandle, targetHandle, isInverted, direction }) => {
  let markerOrient = 0;
  let refX = 6;
  let refY = 6;
  const isVertical = sourceHandle === 'bottom' || sourceHandle === 'top';
  const isHorizontal = sourceHandle === 'left' || targetHandle === 'right';

  if (isVertical) {
    if (isInverted) {
      // Bottom to UP
      markerOrient = direction === 'end' ? 90 : 270;
      refX = 0;
    } else {
      markerOrient = direction === 'start' ? 270 : 90;
      refX = 12;
    }
  } else if (isHorizontal) {
    refX = 0;
  }

  return {
    markerOrient,
    refX,
    refY,
    isVertical,
    isHorizontal
  };
};

/**
 * Calculates the adjusted source and target points for the edge path
 * @param {Object} params - Parameters for edge point calculation
 * @param {number} params.sourceX - X coordinate of source point
 * @param {number} params.sourceY - Y coordinate of source point
 * @param {number} params.targetX - X coordinate of target point
 * @param {number} params.targetY - Y coordinate of target point
 * @param {boolean} params.isInverted - Whether the connection direction is inverted
 * @param {boolean} params.isVertical - Whether the connection is vertical
 * @returns {Object} Adjusted edge points
 */
export const calculateEdgePoints = ({ sourceX, sourceY, targetX, targetY, isInverted, isVertical }) => {
  let edgeSourceY = sourceY;
  let edgeTargetY = targetY;
  let straightSourceY = sourceY;
  let straightTargetY = targetY;
  const verticalOffset = 15;

  if (isVertical) {
    if (isInverted) {
      // Bottom to UP
      edgeSourceY = sourceY + 12;
      straightSourceY = sourceY + verticalOffset;
    } else {
      edgeTargetY = targetY - 12;
      straightTargetY = targetY - verticalOffset;
    }
  }

  return {
    edgeSourceY,
    edgeTargetY,
    straightSourceY,
    straightTargetY
  };
};

/**
 * Generates the SVG path string for a curved edge with initial vertical segment
 * @param {Object} params - Parameters for path generation
 * @param {number} params.sourceX - X coordinate of source point
 * @param {number} params.sourceY - Y coordinate of source point
 * @param {number} params.targetX - X coordinate of target point
 * @param {number} params.targetY - Y coordinate of target point
 * @param {number} params.edgeSourceY - Adjusted Y coordinate of source point
 * @param {number} params.straightSourceY - Y coordinate of straight segment from source
 * @param {number} params.straightTargetY - Y coordinate of straight segment to target
 * @returns {string} SVG path string
 */
export const generateEdgePath = ({ 
  sourceX, 
  sourceY, 
  targetX, 
  targetY, 
  edgeSourceY, 
  straightSourceY, 
  straightTargetY 
}) => {
  const curvature = 0.3;
  const dx = targetX - sourceX;
  
  const controlPointX1 = sourceX + dx * curvature;
  const controlPointX2 = targetX - dx * curvature;

  return `M ${sourceX},${edgeSourceY} L ${sourceX},${straightSourceY} C ${controlPointX1},${targetY} ${controlPointX2},${straightSourceY} ${targetX},${straightTargetY} L ${targetX},${targetY}`;
};

/**
 * Generates the SVG path string for the arrowhead marker
 * @returns {string} SVG path string for arrowhead
 */
export const getArrowheadPath = () => {
  return "M0,0 L12,6 L0,12 Z";
};