
import React, { useState } from 'react';

const NodePanel = ({ id, data, updateElement, labelInputRef }) => {
  // Determine if the node is inactive
  const isInactive = data?.isInactive || false;

  // Handler functions
  const handleLabelChange = (e) => {
    if (isInactive) return;
    
    const updatedNode = {
      id,
      data: {
        ...data,
        label: e.target.value
      }
    };
    
    updateElement(updatedNode);
  };

  const handleUriChange = (e) => {
    if (isInactive) return;
    
    const updatedNode = {
      id,
      data: {
        ...data,
        uri: e.target.value
      }
    };
    
    updateElement(updatedNode);
  };

  const handleDescriptionChange = (lang, value) => {
    if (isInactive) return;
    
    const updatedNode = {
      id,
      data: {
        ...data,
        description: {
          ...data.description,
          [lang]: value
        }
      }
    };
    
    updateElement(updatedNode);
  };

  const handleAddProperty = () => {
    if (isInactive) return;
    
    const newProperty = {
      id: `prop-${Date.now()}`,
      name: `property${data.properties?.length + 1 || 1}`,
      type: 'string',
      label: {
        'pt-br': `Propriedade ${data.properties?.length + 1 || 1}`,
        'en': `Property ${data.properties?.length + 1 || 1}`
      }
    };

    const updatedNode = {
      id,
      data: {
        ...data,
        properties: [...(data.properties || []), newProperty]
      }
    };
    
    updateElement(updatedNode);
  };

  const handlePropertyChange = (index, field, value, lang = null) => {
    if (isInactive) return;
    
    const updatedProperties = [...(data.properties || [])];
    
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

    const updatedNode = {
      id,
      data: {
        ...data,
        properties: updatedProperties
      }
    };
    
    updateElement(updatedNode);
  };

  const handleRemoveProperty = (index) => {
    if (isInactive) return;
    
    const updatedProperties = [...(data.properties || [])];
    updatedProperties.splice(index, 1);

    const updatedNode = {
      id,
      data: {
        ...data,
        properties: updatedProperties
      }
    };
    
    updateElement(updatedNode);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          Label
        </label>
        <input
          ref={labelInputRef}
          type="text"
          value={data?.label || ''}
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
          value={data?.uri || ''}
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
          value={data?.description?.['pt-br'] || ''}
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
          value={data?.description?.['en'] || ''}
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
        
        {(!data?.properties || data.properties.length === 0) ? (
          <p className="text-sm text-gray-500">No properties defined</p>
        ) : (
          <div className="space-y-4">
            {data.properties.map((prop, index) => (
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
  );
};

export default NodePanel;