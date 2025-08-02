import React from 'react';

const TimelineView = ({ vconData }) => {
  if (!vconData?.dialog) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Dialog Timeline</h3>
      <div className="relative">
        {vconData.dialog.map((item, i) => {
          const startTime = new Date(item.start);
          const endTime = new Date(startTime.getTime() + item.duration * 1000);
          return (
            <div key={i} className="flex items-center gap-4 mb-4">
              <div className="w-20 text-right text-sm text-gray-400">
                {startTime.toLocaleTimeString()}
              </div>
              <div className="flex-1 bg-gray-700 rounded p-3 relative">
                <div className="absolute left-0 top-1/2 w-2 h-2 bg-blue-400 rounded-full -translate-x-6"></div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded">{item.type}</span>
                  <span className="text-xs text-gray-400">{item.duration}s</span>
                  <span className="text-xs text-blue-400">
                    Parties: {item.parties.map(p => vconData.parties[p].name).join(' → ')}
                  </span>
                </div>
                {item.body && typeof item.body === 'string' && (
                  <div className="text-sm mt-2">{item.body}</div>
                )}
              </div>
            </div>
          );
        })}
        <div className="absolute left-24 top-0 bottom-0 w-0.5 bg-gray-600"></div>
      </div>
    </div>
  );
};

export default TimelineView;