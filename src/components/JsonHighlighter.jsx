import React from 'react';

const JsonHighlighter = ({ jsonText }) => {
  // Color palette matching InspectorView
  const sectionColors = {
    parties: 'text-blue-300',
    dialog: 'text-green-300',
    analysis: 'text-purple-300',
    attachments: 'text-orange-300',
    signatures: 'text-red-300'
  };

  const highlightJson = (text) => {
    if (!text) return text;

    try {
      let highlighted = text;

      // First apply general JSON syntax highlighting
      // Highlight strings (but exclude keys for now)
      highlighted = highlighted.replace(
        /:\s*("(?:[^"\\]|\\.)*")/g,
        ': <span class="text-green-200">$1</span>'
      );

      // Highlight numbers
      highlighted = highlighted.replace(
        /:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g,
        ': <span class="text-yellow-300">$1</span>'
      );

      // Highlight booleans
      highlighted = highlighted.replace(
        /:\s*(true|false)\b/g,
        ': <span class="text-orange-300">$1</span>'
      );

      // Highlight null
      highlighted = highlighted.replace(
        /:\s*(null)\b/g,
        ': <span class="text-red-300">$1</span>'
      );

      // Highlight object/array keys (all quoted strings before colons)
      highlighted = highlighted.replace(
        /("(?:[^"\\]|\\.)*")(\s*:)/g,
        '<span class="text-blue-200">$1</span><span class="text-gray-400">$2</span>'
      );

      // Highlight structural characters
      highlighted = highlighted.replace(
        /([{}[\],])/g,
        '<span class="text-gray-400">$1</span>'
      );

      // Now apply special highlighting for vCon section names with their colors
      Object.keys(sectionColors).forEach(section => {
        const colorClass = sectionColors[section];
        const regex = new RegExp(`<span class="text-blue-200">("${section}")</span>`, 'g');
        highlighted = highlighted.replace(
          regex, 
          `<span class="${colorClass} font-semibold">$1</span>`
        );
      });

      // Apply subtle section content coloring
      Object.keys(sectionColors).forEach(section => {
        const colorClass = sectionColors[section];
        
        // Match section content - from "section": [ to the closing ]
        const sectionRegex = new RegExp(
          `(<span class="${colorClass} font-semibold">"${section}"</span><span class="text-gray-400">\\s*:\\s*</span><span class="text-gray-400">\\[</span>)([\\s\\S]*?)(<span class="text-gray-400">\\]</span>(?=\\s*<span class="text-gray-400">[,}]</span>))`, 
          'g'
        );
        
        highlighted = highlighted.replace(sectionRegex, (match, start, content, end) => {
          // Apply section-specific tinting to strings within this section
          const coloredContent = content.replace(
            /<span class="text-green-200">("[^"]*")<\/span>/g, 
            `<span class="text-green-200 ${colorClass}/60">$1</span>`
          );
          return `${start}${coloredContent}${end}`;
        });
      });

      return highlighted;
    } catch (error) {
      // Fallback to original text if highlighting fails
      return text;
    }
  };

  return (
    <div 
      className="font-mono text-sm whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: highlightJson(jsonText) }}
    />
  );
};

export default JsonHighlighter;