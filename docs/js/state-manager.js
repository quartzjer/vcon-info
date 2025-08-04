// Vanilla JS State Management System
// Replaces React hooks with event-driven state management

import { detectVconType, validateVcon, parseVcon } from './vcon-validator.js';
import { sampleVcon } from './sample-data.js';

class StateManager {
  constructor() {
    // Initialize state similar to React hook
    this.state = {
      input: '',
      activeTab: 'inspector',
      expandedNodes: new Set(['parties', 'dialog', 'analysis', 'attachments']),
      selectedParty: null,
      validationResult: { status: 'idle' },
      vconType: 'unsigned',
      showKeyInput: false,
      publicKey: '',
      privateKey: '',
      vconData: null
    };
    
    // Event listeners for state changes
    this.listeners = {
      input: [],
      activeTab: [],
      expandedNodes: [],
      selectedParty: [],
      validationResult: [],
      vconType: [],
      showKeyInput: [],
      publicKey: [],
      privateKey: [],
      vconData: []
    };
    
    // Sample data will be loaded by main.js after components are ready
  }
  
  // Subscribe to state changes
  subscribe(stateKey, callback) {
    if (this.listeners[stateKey]) {
      this.listeners[stateKey].push(callback);
    }
  }
  
  // Unsubscribe from state changes
  unsubscribe(stateKey, callback) {
    if (this.listeners[stateKey]) {
      this.listeners[stateKey] = this.listeners[stateKey].filter(cb => cb !== callback);
    }
  }
  
  // Notify listeners of state changes
  notify(stateKey, newValue, oldValue) {
    if (this.listeners[stateKey]) {
      this.listeners[stateKey].forEach(callback => {
        callback(newValue, oldValue);
      });
    }
  }
  
  // State getters
  getState(key = null) {
    return key ? this.state[key] : this.state;
  }
  
  // State setters with validation and notification
  setInput(value) {
    const oldValue = this.state.input;
    this.state.input = value;
    this.notify('input', value, oldValue);
    
    // Auto-validate on input change (like useEffect in React)
    this.validateInput();
  }
  
  setActiveTab(value) {
    const oldValue = this.state.activeTab;
    this.state.activeTab = value;
    this.notify('activeTab', value, oldValue);
  }
  
  toggleNode(node) {
    const newExpanded = new Set(this.state.expandedNodes);
    if (newExpanded.has(node)) {
      newExpanded.delete(node);
    } else {
      newExpanded.add(node);
    }
    const oldValue = this.state.expandedNodes;
    this.state.expandedNodes = newExpanded;
    this.notify('expandedNodes', newExpanded, oldValue);
  }
  
  setSelectedParty(value) {
    const oldValue = this.state.selectedParty;
    this.state.selectedParty = value;
    this.notify('selectedParty', value, oldValue);
  }
  
  setShowKeyInput(value) {
    const oldValue = this.state.showKeyInput;
    this.state.showKeyInput = value;
    this.notify('showKeyInput', value, oldValue);
  }
  
  setPublicKey(value) {
    const oldValue = this.state.publicKey;
    this.state.publicKey = value;
    this.notify('publicKey', value, oldValue);
  }
  
  setPrivateKey(value) {
    const oldValue = this.state.privateKey;
    this.state.privateKey = value;
    this.notify('privateKey', value, oldValue);
  }
  
  // Auto-validation (replaces useEffect)
  validateInput() {
    const detectedType = detectVconType(this.state.input);
    const result = validateVcon(this.state.input);
    
    // Update vconType
    let newType = this.state.vconType;
    if (detectedType) {
      newType = detectedType;
    } else if (result.type) {
      newType = result.type;
    }
    
    if (newType !== this.state.vconType) {
      const oldType = this.state.vconType;
      this.state.vconType = newType;
      this.notify('vconType', newType, oldType);
    }
    
    // Update validation result
    const oldResult = this.state.validationResult;
    this.state.validationResult = result;
    this.notify('validationResult', result, oldResult);
    
    // Update vconData
    let newData = null;
    if (result.status === 'valid') {
      newData = parseVcon(this.state.input);
    }
    
    const oldData = this.state.vconData;
    this.state.vconData = newData;
    this.notify('vconData', newData, oldData);
  }
  
  // Helper methods
  isNodeExpanded(node) {
    return this.state.expandedNodes.has(node);
  }
  
  getValidationStatus() {
    return this.state.validationResult.status;
  }
}

// Create singleton instance
export const stateManager = new StateManager();