import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { sidebarComponentMap } from './sidebar-panels';

const SidebarEditor = ({ selectedElement, updateElement }) => {
  // Create ref for the label input
  const labelInputRef = useRef(null);

  // State management remains the same
  const [elementData, setElementData] = useState(null);

  // Effect to update form data when selectedElement changes
  useEffect(() => {
    if (selectedElement) {
      setElementData({ ...selectedElement });
    } else {
      // Keep the last node data but mark it as inactive
      if (elementData) {
        setElementData({ ...elementData, isInactive: true });
      }
    }
  }, [selectedElement]);

  // Focus handling with improved reliability
  useEffect(() => {
    if (selectedElement) {
      // Use a sequence of timers to ensure the DOM is ready
      // First timer waits for React to finish rendering
      const timer1 = setTimeout(() => {
        // Second timer waits for the CSS transition to start
        const timer2 = setTimeout(() => {
          if (labelInputRef.current) {
            labelInputRef.current.focus();
            labelInputRef.current.setSelectionRange(0, 0); // Place cursor at start
          }
        }, 50); // Short delay after the first timer

        return () => clearTimeout(timer2);
      }, 0);

      return () => clearTimeout(timer1);
    }
  }, [selectedElement]);

  // Handle edge click rendering (basic check)
  // console.log('selectedElement:', selectedElement);

  // If no node data at all, show nothing (first render)
  if (!elementData) {
    return null;
  }

  // If node is inactive (no node selected), we still render but with no-op handlers
  const isInactive = elementData.isInactive;

  if (selectedElement?.elementType === 'edge') {
    const EdgeComponent = sidebarComponentMap.edge;
    return (
        <EdgeComponent 
          id={selectedElement.id}
          data={selectedElement.data}
          updateElement={updateElement}
          setElementData={setElementData}
          labelInputRef={labelInputRef}
          elementData={elementData}
        />
    );
  }


  // Handlers remain the same
  const handleLabelChange = (e) => {
    if (isInactive) return;

    const updatedElement = {
      ...elementData,
      data: {
        ...elementData.data,
        label: e.target.value
      }
    };

    setElementData(updatedElement);
    updateElement(updatedElement);
  };

  const handleUriChange = (e) => {
    if (isInactive) return;

    const updatedElement = {
      ...elementData,
      data: {
        ...elementData.data,
        uri: e.target.value
      }
    };
    setElementData(updatedElement);
    updateElement(updatedElement);
  };

  const handleDescriptionChange = (lang, value) => {
    if (isInactive) return;

    const updatedElement = {
      ...elementData,
      data: {
        ...elementData.data,
        description: {
          ...elementData.data.description,
          [lang]: value
        }
      }
    };
    setElementData(updatedElement);
    updateElement(updatedElement);
  };

  const handleAddProperty = () => {
    if (isInactive) return;

    const newProperty = {
      id: `prop-${Date.now()}`,
      name: `property${elementData.data.properties.length + 1}`,
      type: 'string',
      label: {
        'pt-br': `Propriedade ${elementData.data.properties.length + 1}`,
        'en': `Property ${elementData.data.properties.length + 1}`
      }
    };

    const updatedElement = {
      ...elementData,
      data: {
        ...elementData.data,
        properties: [...elementData.data.properties, newProperty]
      }
    };
    setElementData(updatedElement);
    updateElement(updatedElement);
  };

  const handlePropertyChange = (index, field, value, lang = null) => {
    if (isInactive) return;

    const updatedProperties = [...elementData.data.properties];

    if (lang) {
      updatedProperties[index] = {
        ...updatedProperties[index],
        label: {
          ...updatedProperties[index].label,
          [lang]: value
        }
      };
    } else {
      updatedProperties[index] = {
        ...updatedProperties[index],
        [field]: value
      };
    }

    const updatedElement = {
      ...elementData,
      data: {
        ...elementData.data,
        properties: updatedProperties
      }
    };
    setElementData(updatedElement);
    updateElement(updatedElement);
  };

  const handleRemoveProperty = (index) => {
    if (isInactive) return;

    const updatedProperties = [...elementData.data.properties];
    updatedProperties.splice(index, 1);

    const updatedElement = {
      ...elementData,
      data: {
        ...elementData.data,
        properties: updatedProperties
      }
    };
    setElementData(updatedElement);
    updateElement(updatedElement);
  };

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Entity Editor</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Label
          </label>
          <input
            ref={labelInputRef}
            type="text"
            value={elementData.data?.label || ''}
            onChange={handleLabelChange}
            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isInactive}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            URI
          </label>
          <input
            type="text"
            value={elementData.data?.uri || ''}
            onChange={handleUriChange}
            placeholder="http://example.org/entity/name"
            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isInactive}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Description (pt-br)
          </label>
          <textarea
            value={elementData.data?.description?.['pt-br'] || ''}
            onChange={(e) => handleDescriptionChange('pt-br', e.target.value)}
            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="2"
            disabled={isInactive}
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Description (en)
          </label>
          <textarea
            value={elementData.data?.description?.['en'] || ''}
            onChange={(e) => handleDescriptionChange('en', e.target.value)}
            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="2"
            disabled={isInactive}
          ></textarea>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Properties
            </label>
            <button
              onClick={handleAddProperty}
              className={`text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isInactive}
            >
              + Add Property
            </button>
          </div>

          {elementData.data?.properties?.length === 0 ? (
            <p className="text-sm text-gray-500">No properties defined</p>
          ) : (
            <div className="space-y-4">
              {elementData.data?.properties?.map((prop, index) => (
                <div key={prop.id || index} className="bg-gray-100 dark:bg-gray-800 p-3 rounded border border-gray-300 dark:border-gray-700">
                  <div className="flex justify-between mb-2">
                    <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">Property #{index + 1}</h4>
                    <button
                      onClick={() => handleRemoveProperty(index)}
                      className={`text-xs text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 ${isInactive ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isInactive}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Name</label>
                      <input
                        type="text"
                        value={prop.name}
                        onChange={(e) => handlePropertyChange(index, 'name', e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-white"
                        disabled={isInactive}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Type</label>
                      <select
                        value={prop.type}
                        onChange={(e) => handlePropertyChange(index, 'type', e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-white"
                        disabled={isInactive}
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                        <option value="object">Object</option>
                        <option value="array">Array</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Label (pt-br)</label>
                      <input
                        type="text"
                        value={prop.label['pt-br']}
                        onChange={(e) => handlePropertyChange(index, 'label', e.target.value, 'pt-br')}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-white"
                        disabled={isInactive}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Label (en)</label>
                      <input
                        type="text"
                        value={prop.label['en']}
                        onChange={(e) => handlePropertyChange(index, 'label', e.target.value, 'en')}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm text-gray-900 dark:text-white"
                        disabled={isInactive}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarEditor;