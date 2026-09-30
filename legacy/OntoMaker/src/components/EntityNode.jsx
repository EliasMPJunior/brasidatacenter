import React, { useEffect, useState } from 'react';
// Update the import path
import { Handle, Position } from '@xyflow/react';

const EntityNode = ({ data, id }) => {
  const [isDark, setIsDark] = useState(false);
  const isSelected = data.isSelected;

  useEffect(() => {
    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains('dark'));
    });

    // Observe changes to the class attribute on <html>
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });

    // Set initial state
    setIsDark(html.classList.contains('dark'));

    return () => observer.disconnect();
  }, []);

  // Apply conditional classes based on selection state
  // Using Tailwind's active: pseudo-class for the "hit" state
  // Added rounded-full to make the node circular
  const className = `
    px-4 py-2 rounded-full shadow-md select-none 
    transition-all duration-150
    flex items-center justify-center
    min-w-[100px] min-h-[100px] aspect-square
    ${isDark ? 'bg-blue-600 text-white' : 'bg-white text-black'}
    ${isSelected 
      ? `border-2 ${isDark ? 'border-yellow-400' : 'border-yellow-500'} shadow-md` 
      : `border ${isDark ? 'border-gray-600' : 'border-gray-400'}`
    }
    active:border-4 active:${isDark ? 'border-yellow-400' : 'border-yellow-500'} active:shadow-lg
  `;

  return (
    <div className={className}>
      <div className={`font-semibold ${isSelected ? 'font-bold' : ''} text-center`}>
        {data.label || 'New Node'}
      </div>
      {/* Handles remain the same */}
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </div>
  );
};

export default EntityNode;
