import React, { useState } from 'react';
import { Users, MessageSquare, BarChart3, Paperclip, Key, Link, Eye, EyeOff } from 'lucide-react';
import PartyLink from './PartyLink';
import { sampleJWS } from '../data/sampleData';
import { formatTimestamp } from '../utils/timeUtils';

const InspectorView = ({ 
  vconData, 
  vconType, 
  expandedNodes, 
  toggleNode, 
  selectedParty, 
  setSelectedParty 
}) => {
  const [timestampMode, setTimestampMode] = useState('ago');
  const [visibleSections, setVisibleSections] = useState(new Set(['parties', 'dialog', 'analysis', 'attachments', 'signatures']));
  
  // Color palette for sections
  const sectionColors = {
    parties: {
      bg: 'bg-blue-900/20',
      border: 'border-blue-500/30',
      accent: 'bg-blue-500/20',
      text: 'text-blue-300'
    },
    dialog: {
      bg: 'bg-green-900/20',
      border: 'border-green-500/30',
      accent: 'bg-green-500/20',
      text: 'text-green-300'
    },
    analysis: {
      bg: 'bg-purple-900/20',
      border: 'border-purple-500/30',
      accent: 'bg-purple-500/20',
      text: 'text-purple-300'
    },
    attachments: {
      bg: 'bg-orange-900/20',
      border: 'border-orange-500/30',
      accent: 'bg-orange-500/20',
      text: 'text-orange-300'
    },
    signatures: {
      bg: 'bg-red-900/20',
      border: 'border-red-500/30',
      accent: 'bg-red-500/20',
      text: 'text-red-300'
    }
  };
  
  const toggleSectionVisibility = (sectionKey) => {
    setVisibleSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  const CardSection = ({ sectionKey, title, icon: Icon, children }) => {
    const isVisible = visibleSections.has(sectionKey);
    const colors = sectionColors[sectionKey];
    
    return (
      <div className={`bg-gray-700 rounded-lg border ${colors.border} ${colors.bg}`}>
        <div className={`flex items-center justify-between p-3 border-b ${colors.border}`}>
          <div className="flex items-center gap-2">
            {Icon && <Icon className={`w-4 h-4 ${colors.text}`} />}
            <span className={`font-medium ${colors.text}`}>{title}</span>
          </div>
          <button
            onClick={() => toggleSectionVisibility(sectionKey)}
            className={`p-1 hover:${colors.accent} rounded transition-colors`}
            title={isVisible ? 'Hide section' : 'Show section'}
          >
            {isVisible ? (
              <Eye className={`w-4 h-4 ${colors.text}`} />
            ) : (
              <EyeOff className={`w-4 h-4 ${colors.text}`} />
            )}
          </button>
        </div>
        {isVisible && (
          <div className="p-3">
            {children}
          </div>
        )}
      </div>
    );
  };
  
  const cycleTimestampMode = () => {
    setTimestampMode(current => {
      switch (current) {
        case 'ago': return 'full';
        case 'full': return 'unix';
        case 'unix': return 'ago';
        default: return 'ago';
      }
    });
  };

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
        {vconData.created_at && (
          <div className="flex justify-between">
            <span className="text-gray-400">Created:</span>
            <button 
              onClick={cycleTimestampMode}
              className="text-sm hover:text-blue-400 cursor-pointer transition-colors duration-200"
              title="Click to cycle between formats: relative time → full date → unix timestamp"
            >
              {formatTimestamp(vconData.created_at, timestampMode)}
            </button>
          </div>
        )}
      </div>

      {/* Card Sections */}
      <div className="space-y-4">
        <CardSection 
          sectionKey="parties"
          title={`parties (${vconData.parties?.length || 0})`}
          icon={Users}
        >
          <div className="space-y-2">
            {vconData.parties?.map((party, i) => (
              <div 
                key={i} 
                className={`p-2 rounded ${selectedParty === i ? 'bg-blue-900' : 'hover:bg-gray-600'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">[{i}]</span>
                  <span>{party.name}</span>
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded">{party.role}</span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {party.tel && <div>📞 {party.tel}</div>}
                  {party.email && <div>✉️ {party.email}</div>}
                </div>
              </div>
            ))}
          </div>
        </CardSection>

        <CardSection 
          sectionKey="dialog"
          title={`dialog (${vconData.dialog?.length || 0})`}
          icon={MessageSquare}
        >
          <div className="space-y-2">
            {vconData.dialog?.map((item, i) => (
              <div key={i} className="p-2 hover:bg-gray-600 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">[{i}]</span>
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded">{item.type}</span>
                  <span className="text-xs text-gray-400">{item.mediatype}</span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  <div>🕐 {new Date(item.start).toLocaleTimeString()} ({item.duration}s)</div>
                  <div><PartyLink parties={item.parties} setSelectedParty={setSelectedParty} /></div>
                  {item.body && typeof item.body === 'string' && item.mediatype === 'text/plain' && (
                    <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
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
          </div>
        </CardSection>

        <CardSection 
          sectionKey="analysis"
          title={`analysis (${vconData.analysis?.length || 0})`}
          icon={BarChart3}
        >
          <div className="space-y-2">
            {vconData.analysis?.map((item, i) => (
              <div key={i} className="p-2 hover:bg-gray-600 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">[{i}]</span>
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded">{item.type}</span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  <div>📊 Dialog: {Array.isArray(item.dialog) ? item.dialog.join(', ') : item.dialog}</div>
                  {item.body && (
                    <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
                      <pre>{JSON.stringify(item.body, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardSection>

        <CardSection 
          sectionKey="attachments"
          title={`attachments (${vconData.attachments?.length || 0})`}
          icon={Paperclip}
        >
          <div className="space-y-2">
            {vconData.attachments?.map((item, i) => (
              <div key={i} className="p-2 hover:bg-gray-600 rounded">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">[{i}]</span>
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded">{item.type}</span>
                  <span className="text-xs text-gray-400">{item.mediatype}</span>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {item.url && (
                    <div className="flex items-center gap-2">
                      <Link className="w-3 h-3" />
                      <a href={item.url} className="text-blue-400 hover:text-blue-300 text-xs truncate">
                        {item.url}
                      </a>
                      <button className="ml-auto text-xs bg-gray-600 px-2 py-1 rounded hover:bg-gray-500">
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
          </div>
        </CardSection>

        {/* Signed vCon Details */}
        {vconType === 'signed' && (
          <CardSection 
            sectionKey="signatures"
            title="signatures (1)"
            icon={Key}
          >
            <div className="space-y-2">
              <div className="bg-gray-600 rounded p-2">
                <div className="text-xs font-mono">
                  <div className="text-gray-400">Protected Header:</div>
                  <div className="truncate">{sampleJWS.signatures[0].protected}</div>
                </div>
              </div>
              <div className="bg-gray-600 rounded p-2">
                <div className="text-xs">
                  <div className="text-gray-400">Key ID:</div>
                  <div>{sampleJWS.signatures[0].header.kid}</div>
                  <div className="text-gray-400 mt-1">Certificate URL:</div>
                  <div className="text-blue-400">{sampleJWS.signatures[0].header.x5u}</div>
                </div>
              </div>
              <div className="bg-gray-600 rounded p-2">
                <div className="text-xs font-mono">
                  <div className="text-gray-400">Signature:</div>
                  <div className="truncate">{sampleJWS.signatures[0].signature}</div>
                </div>
              </div>
            </div>
          </CardSection>
        )}
      </div>
    </div>
  );
};

export default InspectorView;