import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Key, Unlock } from 'lucide-react';

const ValidationStatusBar = ({ 
  validationStatus, 
  vconType, 
  showKeyInput, 
  setShowKeyInput 
}) => {
  const getStatusIcon = () => {
    switch (validationStatus) {
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'invalid':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (validationStatus) {
      case 'valid':
        return `Valid ${vconType} vCon`;
      case 'invalid':
        return 'Invalid JSON';
      default:
        return 'Paste a vCon to begin';
    }
  };

  const getStatusColor = () => {
    switch (validationStatus) {
      case 'valid':
        return 'text-green-500';
      case 'invalid':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getBorderColor = () => {
    switch (validationStatus) {
      case 'valid':
        return 'border-green-600';
      case 'invalid':
        return 'border-red-600';
      default:
        return 'border-gray-700';
    }
  };

  return (
    <div className={`bg-gray-800 border-b ${getBorderColor()}`}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={getStatusColor()}>{getStatusText()}</span>
          </div>
          {vconType === 'signed' && (
            <button 
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              <Key className="w-4 h-4" />
              Verify Signature
            </button>
          )}
          {vconType === 'encrypted' && (
            <button 
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
            >
              <Unlock className="w-4 h-4" />
              Decrypt
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationStatusBar;