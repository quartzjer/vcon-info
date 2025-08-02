import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Key, Unlock } from 'lucide-react';

const ValidationStatusBar = ({ 
  validationResult,
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
        const errorCount = validationResult?.errors?.length || 0;
        return errorCount > 0 ? `${errorCount} validation error${errorCount === 1 ? '' : 's'}` : 'Invalid JSON';
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
        
        {/* Error Details */}
        {validationStatus === 'invalid' && validationResult?.errors && (
          <div className="mt-2 p-3 bg-red-900/20 border border-red-600/30 rounded">
            <div className="text-red-400 text-sm font-medium mb-2">Validation Errors:</div>
            <ul className="text-red-300 text-sm space-y-1">
              {validationResult.errors.map((error, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationStatusBar;