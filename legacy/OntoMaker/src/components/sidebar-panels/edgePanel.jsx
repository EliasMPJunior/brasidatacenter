
import React from 'react';

const EdgePanel = ({ id, updateElement, setElementData, elementData, labelInputRef }) => {
  const isInactive = elementData?.isInactive || false;

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

  return (
    <div className="h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Edge Editor</h2>
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Label
          </label>
          <input
            ref={labelInputRef}
            type="text"
            value={elementData?.data?.label || ''}
            onChange={handleLabelChange}
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
      </div>
    </div>
  );
};

export default EdgePanel;