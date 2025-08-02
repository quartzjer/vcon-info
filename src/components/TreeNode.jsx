import React from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

const TreeNode = ({ label, children, icon: Icon, nodeKey, expandedNodes, toggleNode }) => {
  const isExpanded = expandedNodes.has(nodeKey);
  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="select-none">
      <div 
        className="flex items-center gap-2 py-1 px-2 hover:bg-gray-800 rounded cursor-pointer"
        onClick={() => hasChildren && toggleNode(nodeKey)}
      >
        {hasChildren && (
          isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
        )}
        {!hasChildren && <div className="w-4" />}
        {Icon && <Icon className="w-4 h-4 text-blue-400" />}
        <span className="text-gray-300">{label}</span>
      </div>
      {isExpanded && hasChildren && (
        <div className="ml-6 border-l border-gray-700 pl-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default TreeNode;