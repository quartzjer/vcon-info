import React from 'react';
import { Users, MessageSquare, BarChart3, Paperclip, Key, Link } from 'lucide-react';
import TreeNode from './TreeNode';
import PartyLink from './PartyLink';
import { sampleJWS } from '../data/sampleData';

const InspectorView = ({ 
  vconData, 
  vconType, 
  expandedNodes, 
  toggleNode, 
  selectedParty, 
  setSelectedParty 
}) => {
  if (!vconData) return null;

  return (
    <div className="space-y-2">
      {/* Header Info */}
      <div className="bg-gray-700 rounded p-3 space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-400">Version:</span>
          <span className="font-mono">{vconData.vcon}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">UUID:</span>
          <span className="font-mono text-sm">{vconData.uuid}</span>
        </div>
      </div>

      {/* Tree View */}
      <div className="space-y-1">
        <TreeNode 
          label={`parties (${vconData.parties?.length || 0})`} 
          icon={Users} 
          nodeKey="parties"
          expandedNodes={expandedNodes}
          toggleNode={toggleNode}
        >
          {vconData.parties?.map((party, i) => (
            <div 
              key={i} 
              className={`p-2 rounded ${selectedParty === i ? 'bg-blue-900' : 'hover:bg-gray-700'}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-500">[{i}]</span>
                <span>{party.name}</span>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">{party.role}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {party.tel && <div>📞 {party.tel}</div>}
                {party.email && <div>✉️ {party.email}</div>}
              </div>
            </div>
          ))}
        </TreeNode>

        <TreeNode 
          label={`dialog (${vconData.dialog?.length || 0})`} 
          icon={MessageSquare} 
          nodeKey="dialog"
          expandedNodes={expandedNodes}
          toggleNode={toggleNode}
        >
          {vconData.dialog?.map((item, i) => (
            <div key={i} className="p-2 hover:bg-gray-700 rounded">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">[{i}]</span>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">{item.type}</span>
                <span className="text-xs text-gray-400">{item.mediatype}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                <div>🕐 {new Date(item.start).toLocaleTimeString()} ({item.duration}s)</div>
                <div><PartyLink parties={item.parties} setSelectedParty={setSelectedParty} /></div>
                {item.body && typeof item.body === 'string' && item.mediatype === 'text/plain' && (
                  <div className="mt-2 p-2 bg-gray-900 rounded text-xs">
                    {item.body}
                  </div>
                )}
                {item.mediatype?.startsWith('audio/') && (
                  <div className="mt-2">
                    <audio controls className="w-full h-8">
                      <source src="#" type={item.mediatype} />
                    </audio>
                  </div>
                )}
              </div>
            </div>
          ))}
        </TreeNode>

        <TreeNode 
          label={`analysis (${vconData.analysis?.length || 0})`} 
          icon={BarChart3} 
          nodeKey="analysis"
          expandedNodes={expandedNodes}
          toggleNode={toggleNode}
        >
          {vconData.analysis?.map((item, i) => (
            <div key={i} className="p-2 hover:bg-gray-700 rounded">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">[{i}]</span>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">{item.type}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                <div>📊 Dialog: {Array.isArray(item.dialog) ? item.dialog.join(', ') : item.dialog}</div>
                {item.body && (
                  <div className="mt-2 p-2 bg-gray-900 rounded text-xs">
                    <pre>{JSON.stringify(item.body, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </TreeNode>

        <TreeNode 
          label={`attachments (${vconData.attachments?.length || 0})`} 
          icon={Paperclip} 
          nodeKey="attachments"
          expandedNodes={expandedNodes}
          toggleNode={toggleNode}
        >
          {vconData.attachments?.map((item, i) => (
            <div key={i} className="p-2 hover:bg-gray-700 rounded">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">[{i}]</span>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">{item.type}</span>
                <span className="text-xs text-gray-400">{item.mediatype}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {item.url && (
                  <div className="flex items-center gap-2">
                    <Link className="w-3 h-3" />
                    <a href={item.url} className="text-blue-400 hover:text-blue-300 text-xs truncate">
                      {item.url}
                    </a>
                    <button className="ml-auto text-xs bg-gray-700 px-2 py-1 rounded hover:bg-gray-600">
                      Fetch & Verify
                    </button>
                  </div>
                )}
                {item.content_hash && (
                  <div className="text-xs mt-1 font-mono truncate">
                    🔒 {item.content_hash}
                  </div>
                )}
              </div>
            </div>
          ))}
        </TreeNode>

        {/* Signed vCon Details */}
        {vconType === 'signed' && (
          <TreeNode 
            label="signatures (1)" 
            icon={Key} 
            nodeKey="signatures"
            expandedNodes={expandedNodes}
            toggleNode={toggleNode}
          >
            <div className="p-2 space-y-2">
              <div className="bg-gray-700 rounded p-2">
                <div className="text-xs font-mono">
                  <div className="text-gray-400">Protected Header:</div>
                  <div className="truncate">{sampleJWS.signatures[0].protected}</div>
                </div>
              </div>
              <div className="bg-gray-700 rounded p-2">
                <div className="text-xs">
                  <div className="text-gray-400">Key ID:</div>
                  <div>{sampleJWS.signatures[0].header.kid}</div>
                  <div className="text-gray-400 mt-1">Certificate URL:</div>
                  <div className="text-blue-400">{sampleJWS.signatures[0].header.x5u}</div>
                </div>
              </div>
              <div className="bg-gray-700 rounded p-2">
                <div className="text-xs font-mono">
                  <div className="text-gray-400">Signature:</div>
                  <div className="truncate">{sampleJWS.signatures[0].signature}</div>
                </div>
              </div>
            </div>
          </TreeNode>
        )}
      </div>
    </div>
  );
};

export default InspectorView;