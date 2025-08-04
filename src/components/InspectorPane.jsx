import React from 'react';
import InspectorView from './InspectorView';
import TimelineView from './TimelineView';

const InspectorPane = ({ 
  activeTab, 
  setActiveTab, 
  vconData, 
  vconType, 
  validationStatus,
  expandedNodes,
  toggleNode,
  selectedParty,
  setSelectedParty
}) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-full">
      <div className="p-3 border-b border-gray-700">
        <div className="flex gap-4">
          <button
            className={`px-3 py-1 rounded text-sm ${activeTab === 'inspector' ? 'bg-gray-700' : ''}`}
            onClick={() => setActiveTab('inspector')}
          >
            Inspector
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${activeTab === 'timeline' ? 'bg-gray-700' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'inspector' && validationStatus === 'valid' && (
          <InspectorView 
            vconData={vconData}
            vconType={vconType}
            expandedNodes={expandedNodes}
            toggleNode={toggleNode}
            selectedParty={selectedParty}
            setSelectedParty={setSelectedParty}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView vconData={vconData} />
        )}
      </div>
    </div>
  );
};

export default InspectorPane;