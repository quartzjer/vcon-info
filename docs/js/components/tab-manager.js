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
      },
      [TABS.RAW]: {
        button: document.getElementById('tab-raw'),
        content: document.getElementById('raw-view')
      }
    };
    
    this.rawContent = document.getElementById('raw-content');
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

    // Listen for vconData changes to update raw view
    stateManager.subscribe('vconData', (vconData) => {
      this.updateRawView(vconData);
    });

    stateManager.subscribe('input', (input) => {
      this.updateRawView(null, input);
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

  updateRawView(vconData, rawInput) {
    const activeTab = stateManager.getState('activeTab');
    
    // Only update if raw tab is active (performance optimization)
    if (activeTab !== TABS.RAW) {
      return;
    }

    let content = '';
    
    if (vconData) {
      // Show parsed and formatted vCon data
      content = JSON.stringify(vconData, null, 2);
    } else if (rawInput) {
      // Show raw input with syntax highlighting attempt
      try {
        const parsed = JSON.parse(rawInput);
        content = JSON.stringify(parsed, null, 2);
      } catch {
        // If parsing fails, show raw input
        content = rawInput;
      }
    } else {
      content = 'No data to display';
    }

    this.rawContent.textContent = content;
    this.addSyntaxHighlighting();
  }

  addSyntaxHighlighting() {
    // Simple syntax highlighting for JSON
    const content = this.rawContent.textContent;
    if (!content || content === 'No data to display') {
      return;
    }

    try {
      // Basic JSON syntax highlighting using regex
      let highlighted = content
        .replace(/("([^"\\]|\\.)*")\s*:/g, '<span class="text-blue-400">$1</span>:') // Keys
        .replace(/:\s*("([^"\\]|\\.)*")/g, ': <span class="text-green-400">$1</span>') // String values
        .replace(/:\s*([0-9]+\.?[0-9]*)/g, ': <span class="text-yellow-400">$1</span>') // Numbers
        .replace(/:\s*(true|false|null)/g, ': <span class="text-purple-400">$1</span>') // Booleans/null
        .replace(/(\{|\}|\[|\])/g, '<span class="text-gray-400">$1</span>') // Brackets
        .replace(/,/g, '<span class="text-gray-500">,</span>'); // Commas

      this.rawContent.innerHTML = highlighted;
    } catch (error) {
      // If highlighting fails, just show plain text
      this.rawContent.textContent = content;
    }
  }
}