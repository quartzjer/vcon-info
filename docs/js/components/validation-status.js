// Validation Status Component - Vanilla JS replacement for React ValidationStatusBar
import { stateManager } from '../state-manager.js';

export class ValidationStatus {
  constructor() {
    this.statusIndicator = document.getElementById('status-indicator');
    this.statusText = document.getElementById('status-text');
    this.vconTypeBadge = document.getElementById('vcon-type-badge');
    this.keyInputToggle = document.getElementById('key-input-toggle');
    this.keyInputPanel = document.getElementById('key-input-panel');
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for validation state changes
    stateManager.subscribe('validationResult', (result) => {
      this.updateStatus(result);
    });

    stateManager.subscribe('vconType', (type) => {
      this.updateTypeBadge(type);
    });

    stateManager.subscribe('showKeyInput', (show) => {
      this.toggleKeyInput(show);
    });

    // Key input toggle button
    this.keyInputToggle.addEventListener('click', () => {
      const currentShow = stateManager.getState('showKeyInput');
      stateManager.setShowKeyInput(!currentShow);
    });
  }

  updateStatus(result) {
    const { status, errors } = result;
    
    // Update indicator color and status text
    switch (status) {
      case 'idle':
        this.statusIndicator.className = 'w-3 h-3 rounded-full bg-gray-600';
        this.statusText.textContent = 'Ready';
        this.statusText.className = 'text-sm text-gray-400';
        break;
        
      case 'valid':
        this.statusIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
        this.statusText.textContent = 'Valid vCon';
        this.statusText.className = 'text-sm text-green-300';
        break;
        
      case 'invalid':
        this.statusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
        const errorCount = errors ? errors.length : 0;
        this.statusText.textContent = `Invalid - ${errorCount} error${errorCount !== 1 ? 's' : ''}`;
        this.statusText.className = 'text-sm text-red-400';
        
        // Show detailed errors in tooltip or expandable area
        if (errors && errors.length > 0) {
          this.statusText.title = errors.join('\n');
        }
        break;
        
      default:
        this.statusIndicator.className = 'w-3 h-3 rounded-full bg-gray-600';
        this.statusText.textContent = 'Unknown status';
        this.statusText.className = 'text-sm text-gray-400';
    }
  }

  updateTypeBadge(type) {
    if (!type) {
      this.vconTypeBadge.classList.add('hidden');
      this.keyInputToggle.classList.add('hidden');
      return;
    }

    // Show the badge
    this.vconTypeBadge.classList.remove('hidden');
    
    // Update badge content and styling
    switch (type) {
      case 'unsigned':
        this.vconTypeBadge.textContent = 'Unsigned';
        this.vconTypeBadge.className = 'px-2 py-1 rounded text-xs bg-gray-700 text-gray-300';
        this.keyInputToggle.classList.add('hidden');
        break;
        
      case 'signed':
        this.vconTypeBadge.textContent = 'JWS Signed';
        this.vconTypeBadge.className = 'px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300';
        this.keyInputToggle.classList.remove('hidden');
        this.keyInputToggle.innerHTML = '🔐 Verify';
        break;
        
      case 'encrypted':
        this.vconTypeBadge.textContent = 'JWE Encrypted';
        this.vconTypeBadge.className = 'px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300';
        this.keyInputToggle.classList.remove('hidden');
        this.keyInputToggle.innerHTML = '🔓 Decrypt';
        break;
        
      default:
        this.vconTypeBadge.textContent = type;
        this.vconTypeBadge.className = 'px-2 py-1 rounded text-xs bg-gray-700 text-gray-300';
        this.keyInputToggle.classList.add('hidden');
    }
  }

  toggleKeyInput(show) {
    if (show) {
      this.keyInputPanel.classList.remove('hidden');
    } else {
      this.keyInputPanel.classList.add('hidden');
    }
  }
}