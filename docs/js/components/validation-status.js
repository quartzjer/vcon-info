// Validation Status Component - Refactored with constants and utilities
import { stateManager } from '../state-manager.js';
import { VALIDATION_STATUS, VCON_TYPES, STATUS_COLORS, VCON_TYPE_STYLES } from '../constants.js';
import { createIcon } from '../utils/dom.js';
import { ICONS } from '../constants.js';

export class ValidationStatus {
  constructor() {
    this.statusIndicator = document.getElementById('status-indicator');
    this.statusText = document.getElementById('status-text');
    this.vconTypeBadge = document.getElementById('vcon-type-badge');
    this.keyInputToggle = document.getElementById('key-input-toggle');
    this.keyInputPanel = document.getElementById('key-input-panel');
    this.keysHeader = document.getElementById('keys-header');
    this.keysContent = document.getElementById('keys-content');
    this.keysChevron = document.getElementById('keys-chevron');
    
    // Initialize keys content as collapsed by default
    this.keysExpanded = false;
    this.updateKeysCollapse();
    
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
      stateManager.updateShowKeyInput(!currentShow);
    });

    // Keys header click handler for collapse/expand
    this.keysHeader.addEventListener('click', () => {
      this.keysExpanded = !this.keysExpanded;
      this.updateKeysCollapse();
    });
  }

  updateStatus(result) {
    const { status, errors } = result;
    const colors = STATUS_COLORS[status] || STATUS_COLORS[VALIDATION_STATUS.IDLE];
    
    // Update indicator and text using constants
    this.statusIndicator.className = `w-3 h-3 rounded-full ${colors.indicator}`;
    this.statusText.className = `text-sm ${colors.text}`;
    
    switch (status) {
      case VALIDATION_STATUS.IDLE:
        this.statusText.textContent = 'Ready';
        break;
        
      case VALIDATION_STATUS.VALID:
        this.statusText.textContent = 'Valid vCon';
        break;
        
      case VALIDATION_STATUS.INVALID:
        const errorCount = errors ? errors.length : 0;
        this.statusText.textContent = `Invalid - ${errorCount} error${errorCount !== 1 ? 's' : ''}`;
        
        // Show detailed errors in tooltip
        if (errors && errors.length > 0) {
          this.statusText.title = errors.join('\n');
        }
        break;
        
      default:
        this.statusText.textContent = 'Unknown status';
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
    
    const typeStyle = VCON_TYPE_STYLES[type];
    if (typeStyle) {
      this.vconTypeBadge.textContent = typeStyle.text;
      this.vconTypeBadge.className = `px-2 py-1 rounded text-xs ${typeStyle.classes}`;
    } else {
      this.vconTypeBadge.textContent = type;
      this.vconTypeBadge.className = 'px-2 py-1 rounded text-xs bg-gray-700 text-gray-300';
    }
    
    // Update key input toggle based on type
    switch (type) {
      case VCON_TYPES.UNSIGNED:
        this.keyInputToggle.classList.add('hidden');
        break;
        
      case VCON_TYPES.SIGNED:
        this.keyInputToggle.classList.remove('hidden');
        this.keyInputToggle.innerHTML = `${createIcon(ICONS.LOCK, 'w-4 h-4 flex-shrink-0')} <span>Verify</span>`;
        break;
        
      case VCON_TYPES.ENCRYPTED:
        this.keyInputToggle.classList.remove('hidden');
        this.keyInputToggle.innerHTML = `${createIcon(ICONS.UNLOCK, 'w-4 h-4 flex-shrink-0')} <span>Decrypt</span>`;
        break;
        
      default:
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

  updateKeysCollapse() {
    if (this.keysExpanded) {
      this.keysContent.classList.remove('hidden');
      this.keysChevron.classList.add('rotate-90');
    } else {
      this.keysContent.classList.add('hidden');
      this.keysChevron.classList.remove('rotate-90');
    }
  }
}