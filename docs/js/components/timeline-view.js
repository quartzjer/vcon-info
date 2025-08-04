// Timeline View Component - Refactored with shared utilities and base class
import { BaseComponent } from './base-component.js';
import { stateManager } from '../state-manager.js';
import { createTimelineItem } from '../utils/templates.js';
import { escapeHtml } from '../utils/dom.js';

export class TimelineView extends BaseComponent {
  constructor(containerId) {
    super(containerId);
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.subscribeToState(stateManager, 'vconData', (vconData) => {
      this.render(vconData);
    });

    this.subscribeToState(stateManager, 'selectedParty', () => {
      this.render(stateManager.getState('vconData'));
    });
  }

  render(vconData) {
    if (!vconData || !vconData.dialog || vconData.dialog.length === 0) {
      this.showEmpty('No timeline data available');
      return;
    }

    // Sort dialog items by start time
    const sortedDialog = [...vconData.dialog]
      .filter(item => item.start)
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    if (sortedDialog.length === 0) {
      this.showEmpty('No dialog items with timestamps found');
      return;
    }

    this.updateContent(this.generateTimelineHTML(sortedDialog, vconData.parties));
  }

  generateTimelineHTML(dialogItems, parties) {
    const selectedParty = stateManager.getState('selectedParty');
    
    return `
      <div class="space-y-4">
        <div class="flex items-center gap-4 mb-4">
          <h3 class="font-semibold">Timeline</h3>
          ${selectedParty !== null ? 
            `<span class="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300">
              Filtered: ${escapeHtml(parties[selectedParty]?.name || `Party ${selectedParty}`)}
            </span>` : 
            ''}
        </div>
        
        <div class="relative">
          <!-- Timeline line -->
          <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-600"></div>
          
          <!-- Timeline items -->
          <div class="space-y-6">
            ${dialogItems.map((item, index) => createTimelineItem(item, index, parties, selectedParty)).filter(Boolean).join('')}
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Future: Add click handlers for timeline items if needed
  }
}