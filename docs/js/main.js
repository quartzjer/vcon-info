// Main Application Entry Point - Vanilla JS vCon Inspector
import { stateManager } from './state-manager.js';
import { InspectorTree } from './components/inspector-tree.js';
import { TimelineView } from './components/timeline-view.js';
import { ValidationStatus } from './components/validation-status.js';
import { TabManager } from './components/tab-manager.js';

class VConApp {
  constructor() {
    this.initializeComponents();
    this.setupInputHandlers();
    this.setupKeyHandlers();
    
    // Load sample data after components are initialized
    this.loadSample();
    
    console.log('🚀 vCon Info - Vanilla JS Edition Loaded');
    console.log('📦 No React, no build tools, just pure JavaScript!');
  }

  initializeComponents() {
    // Initialize all UI components
    this.inspectorTree = new InspectorTree('vcon-tree');
    this.timelineView = new TimelineView('timeline-content');
    this.validationStatus = new ValidationStatus();
    this.tabManager = new TabManager();
  }

  setupInputHandlers() {
    const inputTextarea = document.getElementById('input-textarea');
    
    // Input change handler - debouncing now handled by state manager
    inputTextarea.addEventListener('input', (e) => {
      stateManager.updateInput(e.target.value);
    });

    // Set initial value
    inputTextarea.value = stateManager.getState('input');

    // Listen for programmatic input changes (like sample data loading)
    stateManager.subscribe('input', (newInput) => {
      if (inputTextarea.value !== newInput) {
        inputTextarea.value = newInput;
      }
    });
  }

  setupKeyHandlers() {
    const publicKeyInput = document.getElementById('public-key-input');
    const privateKeyInput = document.getElementById('private-key-input');

    // Public key input handler
    publicKeyInput.addEventListener('input', (e) => {
      stateManager.updatePublicKey(e.target.value);
    });

    // Private key input handler
    privateKeyInput.addEventListener('input', (e) => {
      stateManager.updatePrivateKey(e.target.value);
    });

    // Listen for programmatic key changes
    stateManager.subscribe('publicKey', (newKey) => {
      if (publicKeyInput.value !== newKey) {
        publicKeyInput.value = newKey;
      }
    });

    stateManager.subscribe('privateKey', (newKey) => {
      if (privateKeyInput.value !== newKey) {
        privateKeyInput.value = newKey;
      }
    });
  }

  // Utility method to load sample data (can be called from console)
  loadSample(type = 'unsigned') {
    import('./sample-data.js').then(({ sampleVcon, sampleJWS }) => {
      const sampleData = type === 'signed' ? sampleJWS : sampleVcon;
      stateManager.updateInput(JSON.stringify(sampleData, null, 2));
    });
  }

  // Debug method to inspect current state
  getAppState() {
    return stateManager.getState();
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create global app instance for debugging
  window.vconApp = new VConApp();
  
  // Add some helpful console commands
  console.log('💡 Debug commands:');
  console.log('   vconApp.loadSample() - Load sample unsigned vCon');
  console.log('   vconApp.loadSample("signed") - Load sample JWS vCon');
  console.log('   vconApp.getAppState() - Inspect current app state');
});

// Handle any uncaught errors gracefully
window.addEventListener('error', (event) => {
  console.error('🚨 Application Error:', event.error);
  
  // Show user-friendly error message
  const statusText = document.getElementById('status-text');
  const statusIndicator = document.getElementById('status-indicator');
  
  if (statusText && statusIndicator) {
    statusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
    statusText.textContent = 'Application Error - Check Console';
    statusText.className = 'text-sm text-red-400';
  }
});

// Handle module loading errors
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Promise Rejection:', event.reason);
  event.preventDefault();
});