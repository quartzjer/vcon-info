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

      // Apply section content coloring for the entire value
      Object.keys(sectionColors).forEach(section => {
        const colorClass = sectionColors[section];
        
        // Match the section key and its complete value (array, object, or primitive)
        const sectionValueRegex = new RegExp(
          `(<span class="${colorClass} font-semibold">"${section}"</span><span class="text-gray-400">\\s*:\\s*</span>)([\\s\\S]*?)(?=,\\s*<span class="text-blue-200">"|\\s*<span class="text-gray-400">}</span>|$)`,
          'g'
        );
        
        highlighted = highlighted.replace(sectionValueRegex, (match, keyPart, valuePart) => {
          // Color the entire value with the section color
          const coloredValue = valuePart.replace(
            /<span class="([^"]*)">/g,
            `<span class="$1 ${colorClass}/80">`
          );
          return `${keyPart}${coloredValue}`;
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