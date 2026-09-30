import React, { useCallback, useEffect, useRef, useState } from 'react';
// Update imports from @xyflow/react
// Import ReactFlow as a named export, along with the others
import {
  ReactFlow, // Changed from default to named import
  Background,
  Controls,
  MiniMap,
  addEdge,
  MarkerType,
  applyNodeChanges, // Use helper from the library
  applyEdgeChanges, // Use helper from the library
} from '@xyflow/react';
import CustomEdge from './CustomEdge';
import EntityNode from './EntityNode';
// Import the necessary CSS for @xyflow/react
import '@xyflow/react/dist/style.css';
// Import the node position helper
import { adjustNodePositionIfOverlapping } from '../utils/nodePositionHelper';

const nodeTypes = {
  entityNode: EntityNode,
};

// Define edge types to register the CustomEdge component
const edgeTypes = {
  custom: CustomEdge,
};

// Define validation function outside the component (remains the same)
const alwaysValidConnection = () => true;

const DiagramCanvas = ({
  nodes: initialNodes,
  setNodes: setParentNodes,
  edges: initialEdges,
  setEdges: setParentEdges,
  selectedNode,
  setSelectedNode,
  selectedNodeId,
  selectedEdge,
  setSelectedEdge,
  selectedEdgeId,
  theme,
}) => {
  // Use local state instead of ReactFlow's hooks
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const isUpdatingFromParent = useRef(false);
  const isUpdatingToParent = useRef(false);
  const connectStartRef = useRef(null); // Keep using this for custom connection logic
  const lastAddedNodeRef = useRef(null); // Track the last added node for overlap detection

  // Add keyboard shortcut for node deletion
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if a node is selected and Shift key is pressed
      if (e.shiftKey) {
        // Check for Delete key (Windows/Linux) or Backspace key (macOS)
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault(); // Prevent default browser behavior
          
          if (selectedNodeId) {
            // Delete the selected node
            const updatedNodes = nodes.filter(node => node.id !== selectedNodeId);
            
            // Update local state
            setNodes(updatedNodes);
            
            // Update parent state
            setParentNodes(updatedNodes);
            
            // Clear the selected node
            clearSelection();
          } else if (selectedEdgeId) {
            // Delete the selected edge
            const updatedEdges = edges.filter(edge => edge.id !== selectedEdgeId);
            
            // Update local state
            setEdges(updatedEdges);
            
            // Update parent state
            setParentEdges(updatedEdges);
            
            // Clear the selected edge
            clearSelection();
          }
        }
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeId, selectedEdgeId, nodes, edges, setParentNodes, setParentEdges]);

  // Utility: shallow compare nodes array (ignoring isSelected)
  const nodesEqual = (a, b) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].id !== b[i].id) return false;
      if (JSON.stringify({ ...a[i].data, isSelected: undefined }) !== JSON.stringify({ ...b[i].data, isSelected: undefined })) return false;
      if (a[i].position?.x !== b[i].position?.x || a[i].position?.y !== b[i].position?.y) return false;
    }
    return true;
  };

  // Initialize nodes with selection state, but only if changed
  useEffect(() => {
    if (isUpdatingToParent.current) return;

    const initialNodeMap = new Map(initialNodes.map(n => [n.id, n]));
    const currentNodesMap = new Map(nodes.map(n => [n.id, n])); // Use current nodes for comparison base

    let nextNodes = initialNodes.map(initNode => {
        const currentNode = currentNodesMap.get(initNode.id);
        return {
            ...initNode, // Start with the parent's version
            position: currentNode?.position ?? initNode.position, // Keep local position if node exists
            data: {
                ...initNode.data, // Parent data
                isSelected: initNode.id === selectedNodeId, // Update selection based on parent prop
            }
        };
    });

    // Ensure nodes only present locally are kept (e.g., during add before parent sync)
    nodes.forEach(localNode => {
        if (!initialNodeMap.has(localNode.id)) {
            // This case is less likely with the current sync logic but good for safety
            nextNodes.push({
                ...localNode,
                 data: {
                    ...localNode.data,
                    isSelected: localNode.id === selectedNodeId,
                 }
            });
        }
    });

    // Filter out potential duplicates if local node was added but parent hasn't updated yet
    const uniqueNodes = Array.from(new Map(nextNodes.map(n => [n.id, n])).values());

    // More robust comparison needed if order might change
    const sortedCurrent = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
    const sortedNext = [...uniqueNodes].sort((a, b) => a.id.localeCompare(b.id));

    if (!nodesEqual(sortedCurrent, sortedNext)) {
      isUpdatingFromParent.current = true;
      
      // Check if there's a new node that wasn't in our previous state
      const newNode = uniqueNodes.find(node => 
        !nodes.some(existingNode => existingNode.id === node.id)
      );
      
      if (newNode) {
        // Store the new node for overlap detection
        lastAddedNodeRef.current = newNode.id;
      }
      
      setNodes(uniqueNodes); // Use the merged and unique list
      isUpdatingFromParent.current = false;
    }
  }, [initialNodes, selectedNodeId]); // Keep dependencies

  // Effect to handle node overlap detection for newly added nodes
  useEffect(() => {
    if (lastAddedNodeRef.current && nodes.length > 0) {
      const newNodeId = lastAddedNodeRef.current;
      const newNode = nodes.find(node => node.id === newNodeId);
      
      if (newNode) {
        // Get other nodes to check for overlap
        const otherNodes = nodes.filter(node => node.id !== newNodeId);
        
        // Adjust position if overlapping
        const adjustedNode = adjustNodePositionIfOverlapping(otherNodes, newNode);
        
        // Only update if position changed
        if (adjustedNode.position.y !== newNode.position.y) {
          isUpdatingToParent.current = true;
          
          // Update the node position
          setNodes(currentNodes => 
            currentNodes.map(node => 
              node.id === newNodeId ? adjustedNode : node
            )
          );
          
          // Update parent nodes
          setParentNodes(currentNodes => 
            currentNodes.map(node => 
              node.id === newNodeId ? adjustedNode : node
            )
          );
          
          isUpdatingToParent.current = false;
        }
      }
      
      // Clear the reference
      lastAddedNodeRef.current = null;
    }
  }, [nodes, setNodes, setParentNodes]);

  // Initialize edges
  useEffect(() => {
    if (isUpdatingToParent.current) return;

    // Simple comparison for edges (can be improved if needed)
    if (JSON.stringify(edges) !== JSON.stringify(initialEdges)) {
        isUpdatingFromParent.current = true;
        setEdges(initialEdges);
        isUpdatingFromParent.current = false;
    }
  }, [initialEdges]); // Keep dependency

  // Update selection state when selectedNodeId changes
  useEffect(() => {
    // This effect might conflict with the initialNodes effect.
    // Let's simplify: selection is primarily driven by the initialNodes effect.
    // We only need to ensure the *local* state reflects the selection prop if initialNodes hasn't changed.
     if (isUpdatingToParent.current) return;

     const needsUpdate = nodes.some(node => node.data.isSelected !== (node.id === selectedNodeId));

     if (needsUpdate) {
        isUpdatingFromParent.current = true;
        setNodes(nds => nds.map(node => ({
          ...node,
          data: {
            ...node.data,
            isSelected: node.id === selectedNodeId,
          }
        })));
        isUpdatingFromParent.current = false;
     }
  }, [selectedNodeId]); // Keep dependency

  // Handle node changes using the library's helper
  const onNodesChange = useCallback(changes => {
    if (isUpdatingFromParent.current) return;
    
    // Apply changes first
    const updatedNodes = applyNodeChanges(changes, nodes);
    
    // Check for position changes
    const positionChanges = changes.filter(change => 
      change.type === 'position' && change.position
    );
    
    if (positionChanges.length > 0) {
      // Process each moved node
      let finalNodes = [...updatedNodes];
      
      positionChanges.forEach(change => {
        const movedNodeId = change.id;
        const movedNode = finalNodes.find(node => node.id === movedNodeId);
        
        if (movedNode) {
          // Get other nodes to check for overlap
          const otherNodes = finalNodes.filter(node => node.id !== movedNodeId);
          
          // Adjust position if overlapping
          const adjustedNode = adjustNodePositionIfOverlapping(otherNodes, movedNode);
          
          // Update the node in our final array if position was adjusted
          if (adjustedNode.position.y !== movedNode.position.y) {
            finalNodes = finalNodes.map(node => 
              node.id === movedNodeId ? adjustedNode : node
            );
          }
        }
      });
      
      // Update nodes with overlap adjustments
      setNodes(finalNodes);
      
      // Update parent state
      isUpdatingToParent.current = true;
      setParentNodes(finalNodes);
      isUpdatingToParent.current = false;
    } else {
      // No position changes, just update normally
      setNodes(updatedNodes);
    }
  }, [nodes, setNodes, setParentNodes]); // Include dependencies

  // Rest of the component remains unchanged
  // ...

  // Handle edge changes using the library's helper
  const onEdgesChange = useCallback(changes => {
    if (isUpdatingFromParent.current) return;
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, [setEdges]); // setEdges is stable

  // Store the starting node ID and handle position when connection drag begins
  const handleConnectStart = useCallback((event, { nodeId, handleId }) => {
    connectStartRef.current = { nodeId, handleId }; // Store starting node and handle
    // console.log('Connection started from:', nodeId, 'handle:', handleId);
  }, []);

  // Handle connection completion ensuring valid source/target based on handle types
  const handleConnect = useCallback(
    (params) => {
      const start = connectStartRef.current;
      if (!start) return; // Safety check

      // --- FIX START: Determine source/target based on handle types ---

      // 1. Identify the two nodes and handles involved
      const node1_id = start.nodeId;
      const handle1_id = start.handleId;
      let node2_id, handle2_id;

      // Find the 'other' end from params (where the connection ended)
      if (params.source === node1_id && params.sourceHandle === handle1_id) {
        node2_id = params.target;
        handle2_id = params.targetHandle;
      } else if (params.target === node1_id && params.targetHandle === handle1_id) {
        node2_id = params.source;
        handle2_id = params.sourceHandle;
      } else {
        // This might happen if the connection ends improperly or params are unexpected
        console.error("Connection parameters don't match the connection start reference.");
        connectStartRef.current = null; // Reset ref
        return;
      }

      // Ensure we identified the second node/handle
      if (!node2_id || !handle2_id) {
        console.error("Could not determine the target node/handle for the connection.");
        connectStartRef.current = null; // Reset ref
        return;
      }

      // 2. Determine the actual source/target based on handle IDs ('bottom' is source, 'top' is target)
      let sourceNodeId, sourceHandleId, targetNodeId, targetHandleId;

      if (handle1_id === 'bottom' && handle2_id === 'top') {
          // Started at 'bottom' (source), ended at 'top' (target) - Valid
          sourceNodeId = node1_id;
          sourceHandleId = handle1_id; // 'bottom'
          targetNodeId = node2_id;
          targetHandleId = handle2_id; // 'top'
      } else if (handle1_id === 'top' && handle2_id === 'bottom') {
          // Started at 'top' (target), ended at 'bottom' (source) - Valid, but swap for React Flow
          sourceNodeId = node2_id;     // The node with the 'bottom' handle is the source
          sourceHandleId = handle2_id; // 'bottom'
          targetNodeId = node1_id;     // The node with the 'top' handle is the target
          targetHandleId = handle1_id; // 'top'
      } else {
          // Invalid connection attempt (e.g., top-to-top, bottom-to-bottom, or unknown handle IDs)
          console.warn(`Invalid connection prevented between handles: ${handle1_id} on ${node1_id} and ${handle2_id} on ${node2_id}`);
          connectStartRef.current = null; // Reset ref
          return; // Do not create the edge
      }

      // --- FIX END ---

      // Log React Flow's perspective and the user's click order
      const sourceNode = nodes.find(node => node.id === sourceNodeId);
      const targetNode = nodes.find(node => node.id === targetNodeId);

      const isInverted = start.nodeId !== params.source;

      // Create the edge using the source/target determined by handle types
      const newEdge = {
        id: `edge-${Date.now()}`,
        source: sourceNode.id,
        target: targetNode.id,
        sourceHandle: sourceHandleId,
        targetHandle: targetHandleId,
        label: 'has_property',
        type: 'custom',
        elementType: 'edge',
        animated: false,
        style: {
          stroke: theme === 'dark' ? '#6272a4' : '#4b5563',
          strokeWidth: 2,
        },
        data: {
          label: 'has_property', // Pass label for CustomEdge to render
          direction: isInverted ? 'start' : 'end',
        sourceHandle: sourceHandleId,
        targetHandle: targetHandleId,
        isInverted: isInverted,
        }
      };

      // Update edges state locally and in parent
      setEdges(eds => addEdge(newEdge, eds)); // Use addEdge helper for safety
      setParentEdges(eds => addEdge(newEdge, eds)); // Update parent as well

      connectStartRef.current = null; // Reset ref
    },
    [nodes, setEdges, setParentEdges, theme, addEdge] // Ensure all dependencies are listed
  );

  // Optional: Handle connection end (cleanup)
  const handleConnectEnd = useCallback((event) => {
    // console.log('Connection drag ended.');
    // Reset ref if connection was cancelled (didn't end on a valid handle)
    // This prevents creating an edge if the drag ends on the canvas pane
    if (connectStartRef.current) {
       // Check if the event target is the pane or outside the flow area
       // This part might need refinement depending on exact behavior desired
       const targetIsPane = event.target.classList.contains('react-flow__pane');
       if (targetIsPane) {
           console.log('Connection ended on pane, cancelling.');
           connectStartRef.current = null;
       }
       // If it ended on a handle, onConnect will fire and clear the ref.
       // If it ended somewhere else unexpected, we might still clear it here.
       // else {
       //    connectStartRef.current = null;
       // }
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  // Handle node selection (remains the same)
  const onNodeClick = useCallback(
    (event, node) => {
      event.stopPropagation();
      clearSelection();
      setSelectedNode(node);
    },
    [setSelectedNode, clearSelection]
  );

  // Add this function to handle edge clicks
  const onEdgeClick = useCallback((event, edge) => {
    // Prevent event propagation
    event.stopPropagation();
    
    // Find the full edge data
    const edgeWithData = edges.find(e => e.id === edge.id);
    
    // Clear any selected node
    clearSelection();
    
    // Update the selected edge in the parent component
    setSelectedEdge(edgeWithData);
  }, [edges, setSelectedEdge, clearSelection]);

  // Clear selection when clicking on the canvas (remains the same)
  const onPaneClick = useCallback(() => {
    clearSelection(); // This still triggers parent update via props
  }, [clearSelection]);

  // Update edge styles when theme changes (remains largely the same)
  useEffect(() => {
    if (edges.length > 0) {
      setEdges(currentEdges =>
        currentEdges.map(edge => ({
          ...edge,
          markerEnd: { // Ensure markerEnd structure is correct
            type: MarkerType.Arrow,
            width: 20,
            height: 20,
            // color: theme === 'dark' ? '#6272a4' : '#4b5563', // Optional: color the marker
          },
          style: {
            ...edge.style,
            stroke: theme === 'dark' ? '#6272a4' : '#4b5563',
            strokeWidth: 2,
          },
          labelStyle: {
            ...edge.labelStyle,
            fill: theme === 'dark' ? '#ffffff' : '#1a202c', // Use fill for text color
          },
           labelBgStyle: { // Ensure labelBgStyle is applied correctly
             ...edge.labelBgStyle,
             fill: theme === 'dark' ? 'transparent' : 'rgba(255, 255, 255, 0.7)',
           },
        }))
      );
    }
  }, [theme, setEdges]); // Added setEdges dependency

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onConnectStart={handleConnectStart}
        onConnectEnd={handleConnectEnd}
        isValidConnection={alwaysValidConnection}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}
      >
        <Background
          color={theme === 'dark' ? '#4b5563' : '#e5e7eb'}
          gap={16}
          size={1}
        />
        <Controls />
        <MiniMap
          nodeColor={theme === 'dark' ? '#6b7280' : '#9ca3af'}
          maskColor={theme === 'dark' ? 'rgba(17, 24, 39, 0.7)' : 'rgba(243, 244, 246, 0.7)'}
        />
      </ReactFlow>
    </div>
  );
};

export default DiagramCanvas;