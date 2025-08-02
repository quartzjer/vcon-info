import React from 'react';

const RawView = ({ vconData }) => {
  if (!vconData) return null;

  return (
    <pre className="text-xs font-mono whitespace-pre-wrap">
      {JSON.stringify(vconData, null, 2)}
    </pre>
  );
};

export default RawView;