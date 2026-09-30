import React from 'react';
import {
  calculateMarkerConfig,
  calculateEdgePoints,
  generateEdgePath,
  getArrowheadPath
} from '../utils/edgePathHelper';

// We don't need to add onClick as a prop since ReactFlow will handle the edge click
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  data,
  selected
}) => {
  // Default style with some customization
  const edgeStyle = {
    strokeWidth: 2,
    stroke: '#4B5563', // Default stroke, can be overridden by style prop
    ...style,
  };

  // Generate a unique marker ID for this edge
  const markerId = `custom-arrow-${id}`;

  const isInverted = data?.isInverted;

  // Calculate marker configuration
  const {
    markerOrient,
    refX,
    refY,
    isVertical
  } = calculateMarkerConfig({
    sourceHandle: data?.sourceHandle,
    targetHandle: data?.targetHandle,
    isInverted,
    direction: data?.direction
  });

  // Calculate edge points
  const {
    edgeSourceY,
    edgeTargetY,
    straightSourceY,
    straightTargetY
  } = calculateEdgePoints({
    sourceX,
    sourceY,
    targetX,
    targetY,
    isInverted,
    isVertical
  });

  // Generate the path
  const path = generateEdgePath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    edgeSourceY,
    straightSourceY,
    straightTargetY
  });

  const markerUnits = "userSpaceOnUse";
  const arrowheadPath = getArrowheadPath();

  return (
    <>
      {/* Define the arrowhead marker */}
      <defs>
        <marker
          id={markerId}
          markerWidth="12" // Viewbox width
          markerHeight="12" // Viewbox height
          refX={refX} // Set refX to the tip of the arrow (x=10)
          refY={refY} // Vertically center the connection point
          orient={markerOrient} // "auto"
          markerUnits={markerUnits} // "strokeWidth" // Variável renomeada
        >
          {/* Arrowhead shape pointing RIGHT (0,0 -> 10,5 -> 0,10) */}
          <path d={arrowheadPath} fill={edgeStyle.stroke || '#4B5563'} />
        </marker>
      </defs>

      {/* Render the edge path with the custom marker */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={path}
        // Conditionally apply markerStart or markerEnd based on data.direction
        {...(data?.direction === 'start'
          ? { markerStart: `url(#${markerId})` }
          : { markerEnd: `url(#${markerId})` })}
        style={edgeStyle}
      />

      {/* Optional: Add a label if provided in data */}
      {data?.label && (
        <text
          x={(sourceX + targetX) / 2}
          y={(sourceY + targetY) / 2}
          dy={-10} // Adjust label position relative to the edge
          textAnchor="middle"
          className="text-xs fill-gray-700 dark:fill-gray-300 select-none"
          // No need for onClick handler here, ReactFlow will handle it
        >
          {data.label}
        </text>
      )}
    </>
  );
};

export default CustomEdge;