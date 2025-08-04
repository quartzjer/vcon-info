// Tab Manager Component - Refactored with constants and utilities
import { stateManager } from '../state-manager.js';
import { TABS } from '../constants.js';

export class TabManager {
  constructor() {
    this.tabs = {
      [TABS.INSPECTOR]: {
        button: document.getElementById('tab-inspector'),
        content: document.getElementById('inspector-view')
      },
      [TABS.TIMELINE]: {
        button: document.getElementById('tab-timeline'),
        content: document.getElementById('timeline-view')
      }
    };
    
    this.setupEventListeners();
    
    // Set initial tab state
    const initialTab = stateManager.getState('activeTab');
    this.switchTab(initialTab);
  }

  setupEventListeners() {
    // Tab button click handlers
    Object.entries(this.tabs).forEach(([tabName, tab]) => {
      tab.button.addEventListener('click', () => {
        stateManager.updateActiveTab(tabName);
      });
    });

    // Listen for active tab changes
    stateManager.subscribe('activeTab', (activeTab) => {
      this.switchTab(activeTab);
    });
  }

  switchTab(activeTab) {
    // Update button states
    Object.entries(this.tabs).forEach(([tabName, tab]) => {
      if (tabName === activeTab) {
        // Active tab styling
        tab.button.className = 'px-4 py-3 font-medium text-sm border-b-2 border-blue-600 text-blue-400 transition-colors';
        tab.content.classList.remove('hidden');
      } else {
        // Inactive tab styling
        tab.button.className = 'px-4 py-3 font-medium text-sm border-b-2 border-transparent text-gray-400 hover:text-gray-300 transition-colors';
        tab.content.classList.add('hidden');
      }
    });
  }

}