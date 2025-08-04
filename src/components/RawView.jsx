import React, { useMemo } from 'react';

const RawView = ({ vconData }) => {
  if (!vconData) return null;

  // Color palette matching InspectorView sections
  const sectionColors = {
    parties: 'bg-blue-500/40',
    dialog: 'bg-green-500/40',
    analysis: 'bg-purple-500/40',
    attachments: 'bg-orange-500/40',
    signatures: 'bg-red-500/40'
  };

  const jsonString = JSON.stringify(vconData, null, 2);
  const lines = jsonString.split('\n');

  // Calculate which lines belong to which sections
  const sectionLineRanges = useMemo(() => {
    const ranges = {};
    let currentSection = null;
    let braceCount = 0;
    let sectionStart = null;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Check if this line starts a new section
      if (trimmed.startsWith('"parties"') || 
          trimmed.startsWith('"dialog"') || 
          trimmed.startsWith('"analysis"') || 
          trimmed.startsWith('"attachments"') || 
          trimmed.startsWith('"signatures"')) {
        
        // End previous section
        if (currentSection && sectionStart !== null) {
          if (!ranges[currentSection]) ranges[currentSection] = [];
          ranges[currentSection].push({ start: sectionStart, end: index - 1 });
        }

        // Start new section
        const sectionName = trimmed.split('"')[1];
        currentSection = sectionName;
        sectionStart = index;
        braceCount = 0;
      }

      // Track braces to know when section ends
      if (currentSection) {
        const openBraces = (line.match(/[{\[]/g) || []).length;
        const closeBraces = (line.match(/[}\]]/g) || []).length;
        braceCount += openBraces - closeBraces;
        
        // If we're back to 0 braces and this line ends with a comma or is the last property
        if (braceCount <= 0 && (trimmed.endsWith(',') || trimmed.endsWith('}') || trimmed.endsWith(']'))) {
          if (!ranges[currentSection]) ranges[currentSection] = [];
          ranges[currentSection].push({ start: sectionStart, end: index });
          currentSection = null;
          sectionStart = null;
        }
      }
    });

    // Handle case where last section doesn't end properly
    if (currentSection && sectionStart !== null) {
      if (!ranges[currentSection]) ranges[currentSection] = [];
      ranges[currentSection].push({ start: sectionStart, end: lines.length - 1 });
    }

    return ranges;
  }, [lines]);

  // Get color for a specific line
  const getLineColor = (lineIndex) => {
    for (const [section, ranges] of Object.entries(sectionLineRanges)) {
      for (const range of ranges) {
        if (lineIndex >= range.start && lineIndex <= range.end) {
          return sectionColors[section];
        }
      }
    }
    return null;
  };

  return (
    <div className="relative flex h-full font-mono text-xs">
      {/* Color-coded sidebar column */}
      <div className="w-2 flex-shrink-0 relative">
        <div className="absolute inset-0 flex flex-col">
          {lines.map((_, index) => {
            const color = getLineColor(index);
            return (
              <div
                key={index}
                className={`${color || ''}`}
                style={{ height: '1.2em', lineHeight: '1.2em' }}
              />
            );
          })}
        </div>
      </div>
      
      {/* JSON content */}
      <div className="flex-1 overflow-auto">
        <pre className="whitespace-pre-wrap pl-2 leading-[1.2]">
          {jsonString}
        </pre>
      </div>
    </div>
  );
};

export default RawView;