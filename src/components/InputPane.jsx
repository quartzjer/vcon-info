import React from 'react';

const InputPane = ({ input, setInput }) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <h2 className="font-semibold">Input vCon</h2>
      </div>
      <textarea
        className="flex-1 p-4 bg-transparent font-mono text-sm resize-none focus:outline-none"
        placeholder="Paste your vCon here (unsigned, JWS, or JWE format)..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        spellCheck={false}
      />
    </div>
  );
};

export default InputPane;