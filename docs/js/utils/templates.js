// Template utility functions for consistent UI components
import { escapeHtml, createIcon, formatTimestamp, truncateText } from './dom.js';
import { TYPE_COLORS } from '../constants.js';

export const createCard = (content, colorClasses = 'bg-gray-700 border-gray-600') => {
  return `<div class="p-3 rounded border ${colorClasses}">${content}</div>`;
};

export const createBadge = (text, colorClasses = 'bg-gray-600 text-gray-300') => {
  return `<span class="px-2 py-1 rounded text-xs ${colorClasses}">${escapeHtml(text)}</span>`;
};

export const createPropertyRow = (label, value, valueClass = 'text-gray-300') => {
  return `
    <div class="flex items-start gap-2">
      <span class="text-gray-400 font-mono text-sm">${escapeHtml(label)}:</span>
      <span class="${valueClass} font-mono text-sm break-all">${escapeHtml(String(value))}</span>
    </div>
  `;
};

export const createExpandableNode = (key, value, isExpanded, hasContent) => {
  if (!hasContent) {
    return createPropertyRow(key, '[]', 'text-gray-500');
  }

  const chevron = isExpanded ? '▼' : '▶';
  const count = Array.isArray(value) ? value.length : Object.keys(value).length;
  
  return `
    <div class="flex items-center gap-2 cursor-pointer hover:bg-gray-800 p-1 rounded" data-toggle-node="${key}">
      <span class="text-gray-400 select-none w-3 text-center">${chevron}</span>
      <span class="text-gray-400 font-mono text-sm">${escapeHtml(key)}:</span>
      <span class="text-gray-500 font-mono text-sm">[${count}]</span>
    </div>
  `;
};

export const createPartyCard = (party, index, isSelected) => {
  const bgClass = isSelected ? 'bg-blue-500/20 border-blue-500/30' : 'bg-gray-700 border-gray-600';
  
  const content = `
    <div class="flex items-center gap-2 mb-2">
      <span class="font-mono text-xs text-gray-400">Party ${index}</span>
      ${party.role ? createBadge(party.role, 'bg-purple-500/20 text-purple-300') : ''}
    </div>
    <div class="space-y-1 text-sm">
      ${party.name ? `<div><span class="text-gray-400">name:</span> <span class="text-gray-300">${escapeHtml(party.name)}</span></div>` : ''}
      ${party.tel ? `<div><span class="text-gray-400">tel:</span> <span class="text-blue-400">${escapeHtml(party.tel)}</span></div>` : ''}
      ${party.email ? `<div><span class="text-gray-400">email:</span> <span class="text-blue-400">${escapeHtml(party.email)}</span></div>` : ''}
    </div>
  `;
  
  return `
    <div class="mb-2 p-3 rounded border ${bgClass} cursor-pointer party-item" data-party-index="${index}">
      ${content}
    </div>
  `;
};

export const createDialogCard = (dialog, index) => {
  const colors = TYPE_COLORS[dialog.type] || TYPE_COLORS.text;
  const timestamp = formatTimestamp(dialog.start);
  
  const content = `
    <div class="flex items-center gap-2 mb-2">
      <span class="font-mono text-xs text-gray-400">Dialog ${index}</span>
      ${createBadge(dialog.type, `bg-gray-600 ${colors.text}`)}
    </div>
    <div class="space-y-1 text-sm">
      ${dialog.start ? `<div><span class="text-gray-400">start:</span> <span class="text-purple-400">${escapeHtml(timestamp.full)}</span></div>` : ''}
      ${dialog.duration ? `<div><span class="text-gray-400">duration:</span> <span class="text-yellow-400">${dialog.duration}s</span></div>` : ''}
      ${dialog.parties ? `<div><span class="text-gray-400">parties:</span> <span class="text-blue-400">[${dialog.parties.join(', ')}]</span></div>` : ''}
      ${dialog.mediatype ? `<div><span class="text-gray-400">mediatype:</span> <span class="text-green-400">${escapeHtml(dialog.mediatype)}</span></div>` : ''}
      ${dialog.body ? `<div><span class="text-gray-400">body:</span> <span class="text-gray-300 truncate block">${escapeHtml(truncateText(String(dialog.body)))}</span></div>` : ''}
    </div>
  `;
  
  return createCard(content, 'bg-gray-700 border-gray-600');
};

export const createAnalysisCard = (analysis, index) => {
  const content = `
    <div class="flex items-center gap-2 mb-2">
      <span class="font-mono text-xs text-gray-400">Analysis ${index}</span>
      ${createBadge(analysis.type, 'bg-purple-500/20 text-purple-300')}
    </div>
    <div class="space-y-1 text-sm">
      ${analysis.dialog !== undefined ? `<div><span class="text-gray-400">dialog:</span> <span class="text-blue-400">${Array.isArray(analysis.dialog) ? `[${analysis.dialog.join(', ')}]` : analysis.dialog}</span></div>` : ''}
      ${analysis.mediatype ? `<div><span class="text-gray-400">mediatype:</span> <span class="text-green-400">${escapeHtml(analysis.mediatype)}</span></div>` : ''}
      ${analysis.body ? `<div><span class="text-gray-400">body:</span> <span class="text-gray-300">${escapeHtml(JSON.stringify(analysis.body, null, 2))}</span></div>` : ''}
    </div>
  `;
  
  return createCard(content, 'bg-gray-700 border-gray-600');
};

export const createAttachmentCard = (attachment, index) => {
  const content = `
    <div class="flex items-center gap-2 mb-2">
      <span class="font-mono text-xs text-gray-400">Attachment ${index}</span>
      ${createBadge(attachment.type, 'bg-orange-500/20 text-orange-300')}
    </div>
    <div class="space-y-1 text-sm">
      ${attachment.mediatype ? `<div><span class="text-gray-400">mediatype:</span> <span class="text-green-400">${escapeHtml(attachment.mediatype)}</span></div>` : ''}
      ${attachment.url ? `<div><span class="text-gray-400">url:</span> <a href="${escapeHtml(attachment.url)}" class="text-blue-400 hover:text-blue-300 break-all">${escapeHtml(attachment.url)}</a></div>` : ''}
      ${attachment.content_hash ? `<div><span class="text-gray-400">hash:</span> <span class="text-gray-300 font-mono text-xs truncate block">${escapeHtml(attachment.content_hash)}</span></div>` : ''}
    </div>
  `;
  
  return createCard(content, 'bg-gray-700 border-gray-600');
};

export const createTimelineItem = (dialog, index, parties, selectedParty) => {
  // Filter by selected party if one is selected
  if (selectedParty !== null && dialog.parties && !dialog.parties.includes(selectedParty)) {
    return '';
  }

  const colors = TYPE_COLORS[dialog.type] || TYPE_COLORS.text;
  const timestamp = formatTimestamp(dialog.start);
  
  // Get party names for this dialog item
  const partyNames = dialog.parties ? 
    dialog.parties.map(partyIndex => 
      parties[partyIndex]?.name || `Party ${partyIndex}`
    ).join(', ') : 
    'Unknown';

  // Format body content
  let bodyContent = '';
  if (dialog.body) {
    if (typeof dialog.body === 'string') {
      bodyContent = truncateText(dialog.body, 200);
    } else {
      bodyContent = JSON.stringify(dialog.body, null, 2);
    }
  }

  return `
    <div class="relative flex items-start gap-4">
      <!-- Timeline dot -->
      <div class="relative z-10 flex items-center justify-center w-4 h-4 ${colors.dot} rounded-full ring-4 ring-gray-900 flex-shrink-0 mt-1"></div>
      
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <div class="p-4 rounded-lg border ${colors.bg} ${colors.border}">
          <!-- Header -->
          <div class="flex items-center justify-between gap-4 mb-2">
            <div class="flex items-center gap-2">
              ${createBadge(dialog.type, `bg-gray-600 ${colors.text} font-medium`)}
              <span class="text-xs text-gray-400">${escapeHtml(partyNames)}</span>
            </div>
            <div class="text-xs text-gray-400 text-right">
              <div>${timestamp.time}</div>
              <div>${timestamp.date}</div>
            </div>
          </div>

          <!-- Metadata -->
          <div class="space-y-1 text-sm mb-3">
            ${dialog.duration ? `<div><span class="text-gray-400">Duration:</span> <span class="text-yellow-400">${dialog.duration}s</span></div>` : ''}
            ${dialog.mediatype ? `<div><span class="text-gray-400">Media:</span> <span class="text-green-400">${escapeHtml(dialog.mediatype)}</span></div>` : ''}
          </div>

          <!-- Body content -->
          ${bodyContent ? `
            <div class="mt-3 p-3 bg-gray-900/50 rounded border border-gray-600">
              <div class="text-xs text-gray-400 mb-2">Content:</div>
              <div class="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                ${escapeHtml(bodyContent)}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
};