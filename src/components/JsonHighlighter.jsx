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
      // Simple regex-based highlighting for better performance
      let highlighted = text;

      // Highlight section names with their respective colors
      Object.keys(sectionColors).forEach(section => {
        const colorClass = sectionColors[section];
        const regex = new RegExp(`("${section}")(\\s*:)`, 'g');
        highlighted = highlighted.replace(
          regex, 
          `<span class="${colorClass} font-semibold">$1</span><span class="${colorClass}/60">$2</span>`
        );
      });

      // Add subtle coloring to the content within each section
      Object.keys(sectionColors).forEach(section => {
        const colorClass = sectionColors[section];
        
        // Match section content - from "section": [ to the closing ]
        const sectionRegex = new RegExp(
          `("${section}"\\s*:\\s*\\[)([\\s\\S]*?)(\\](?=\\s*[,}]))`, 
          'g'
        );
        
        highlighted = highlighted.replace(sectionRegex, (match, start, content, end) => {
          // Color the content lightly
          const coloredContent = content.replace(
            /("([^"\\]|\\.)*")/g, 
            `<span class="${colorClass}/40">$1</span>`
          );
          return `<span class="${colorClass}/60">${start}</span>${coloredContent}<span class="${colorClass}/60">${end}</span>`;
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