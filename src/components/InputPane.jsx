import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import JsonHighlighter from './JsonHighlighter';

const InputPane = ({ input, setInput }) => {
  const [showHighlighting, setShowHighlighting] = useState(true);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-full">
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="font-semibold">Input vCon</h2>
        <button
          onClick={() => setShowHighlighting(!showHighlighting)}
          className="flex items-center gap-2 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title={showHighlighting ? 'Hide syntax highlighting' : 'Show syntax highlighting'}
        >
          {showHighlighting ? (
            <>
              <Eye className="w-3 h-3" />
              Highlighting
            </>
          ) : (
            <>
              <EyeOff className="w-3 h-3" />
              Plain Text
            </>
          )}
        </button>
      </div>
      <div className="flex-1 relative">
        {showHighlighting && input ? (
          <div className="absolute inset-0 p-4 overflow-auto pointer-events-none">
            <JsonHighlighter jsonText={input} />
          </div>
        ) : null}
        <textarea
          className={`flex-1 w-full h-full p-4 font-mono text-sm resize-none focus:outline-none overflow-auto ${
            showHighlighting && input ? 'bg-transparent text-transparent caret-white' : 'bg-transparent'
          }`}
          placeholder="Paste your vCon here (unsigned, JWS, or JWE format)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default InputPane;