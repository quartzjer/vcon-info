import React from 'react';

const InputPane = ({ input, setInput }) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-full">
      <div className="p-3 border-b border-gray-700">
        <h2 className="font-semibold">Input vCon</h2>
      </div>
      <div className="flex-1">
        <textarea
          className="flex-1 w-full h-full p-4 font-mono text-sm resize-none focus:outline-none overflow-auto bg-transparent"
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