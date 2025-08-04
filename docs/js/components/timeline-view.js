// Timeline View Component - Vanilla JS replacement for React TimelineView
import { stateManager } from '../state-manager.js';

export class TimelineView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.setupEventListeners();
  }

  setupEventListeners() {
    stateManager.subscribe('vconData', (vconData) => {
      this.render(vconData);
    });

    stateManager.subscribe('selectedParty', () => {
      this.render(stateManager.getState('vconData'));
    });
  }

  render(vconData) {
    if (!vconData || !vconData.dialog || vconData.dialog.length === 0) {
      this.container.innerHTML = '<p class="text-gray-400 text-sm">No timeline data available</p>';
      return;
    }

    // Sort dialog items by start time
    const sortedDialog = [...vconData.dialog]
      .filter(item => item.start)
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    if (sortedDialog.length === 0) {
      this.container.innerHTML = '<p class="text-gray-400 text-sm">No dialog items with timestamps found</p>';
      return;
    }

    this.container.innerHTML = this.buildTimeline(sortedDialog, vconData.parties);
    this.attachEventListeners();
  }

  buildTimeline(dialogItems, parties) {
    const selectedParty = stateManager.getState('selectedParty');
    
    return `
      <div class="space-y-4">
        <div class="flex items-center gap-4 mb-4">
          <h3 class="font-semibold">Timeline</h3>
          ${selectedParty !== null ? 
            `<span class="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300">
              Filtered: ${this.escapeHtml(parties[selectedParty]?.name || `Party ${selectedParty}`)}
            </span>` : 
            ''}
        </div>
        
        <div class="relative">
          <!-- Timeline line -->
          <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-600"></div>
          
          <!-- Timeline items -->
          <div class="space-y-6">
            ${dialogItems.map((item, index) => this.renderTimelineItem(item, index, parties, selectedParty)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderTimelineItem(item, index, parties, selectedParty) {
    // Filter by selected party if one is selected
    if (selectedParty !== null && item.parties && !item.parties.includes(selectedParty)) {
      return '';
    }

    const typeColors = {
      'recording': { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-300', dot: 'bg-orange-500' },
      'text': { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-300', dot: 'bg-green-500' },
      'transfer': { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-300', dot: 'bg-blue-500' },
      'incomplete': { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-300', dot: 'bg-red-500' }
    };

    const colors = typeColors[item.type] || typeColors['text'];
    const startTime = new Date(item.start);
    const formattedTime = startTime.toLocaleTimeString();
    const formattedDate = startTime.toLocaleDateString();

    // Get party names for this dialog item
    const partyNames = item.parties ? 
      item.parties.map(partyIndex => 
        parties[partyIndex]?.name || `Party ${partyIndex}`
      ).join(', ') : 
      'Unknown';

    // Format body content
    let bodyContent = '';
    if (item.body) {
      if (typeof item.body === 'string') {
        bodyContent = item.body.length > 200 ? 
          item.body.substring(0, 200) + '...' : 
          item.body;
      } else {
        bodyContent = JSON.stringify(item.body, null, 2);
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
                <span class="px-2 py-1 rounded text-xs bg-gray-600 ${colors.text} font-medium">
                  ${item.type}
                </span>
                <span class="text-xs text-gray-400">
                  ${this.escapeHtml(partyNames)}
                </span>
              </div>
              <div class="text-xs text-gray-400 text-right">
                <div>${formattedTime}</div>
                <div>${formattedDate}</div>
              </div>
            </div>

            <!-- Metadata -->
            <div class="space-y-1 text-sm mb-3">
              ${item.duration ? `<div><span class="text-gray-400">Duration:</span> <span class="text-yellow-400">${item.duration}s</span></div>` : ''}
              ${item.mediatype ? `<div><span class="text-gray-400">Media:</span> <span class="text-green-400">${this.escapeHtml(item.mediatype)}</span></div>` : ''}
            </div>

            <!-- Body content -->
            ${bodyContent ? `
              <div class="mt-3 p-3 bg-gray-900/50 rounded border border-gray-600">
                <div class="text-xs text-gray-400 mb-2">Content:</div>
                <div class="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                  ${this.escapeHtml(bodyContent)}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Future: Add click handlers for timeline items if needed
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}