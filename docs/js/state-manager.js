// Refactored State Management System with consistent naming and separation of concerns

import { validationService } from './services/validation-service.js';
import { TABS, DEFAULT_EXPANDED_NODES, VALIDATION_STATUS, VCON_TYPES } from './constants.js';
import { debounce } from './utils/dom.js';

class StateManager {
  constructor() {
    // Initialize state with consistent naming
    this.state = {
      input: '',
      activeTab: TABS.INSPECTOR,
      expandedNodes: new Set(DEFAULT_EXPANDED_NODES),
      selectedParty: null,
      validationResult: { status: VALIDATION_STATUS.IDLE },
      vconType: VCON_TYPES.UNSIGNED,
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
    
    // Debounced validation to improve performance
    this._debouncedValidation = debounce(this._performValidation.bind(this), 300);
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
  
  // State setters with consistent naming and improved validation
  updateInput(value) {
    const oldValue = this.state.input;
    this.state.input = value;
    this.notify('input', value, oldValue);
    
    // Use debounced validation for better performance
    this._debouncedValidation();
  }
  
  updateActiveTab(value) {
    const oldValue = this.state.activeTab;
    this.state.activeTab = value;
    this.notify('activeTab', value, oldValue);
  }
  
  toggleNodeExpansion(node) {
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
  
  updateSelectedParty(value) {
    const oldValue = this.state.selectedParty;
    this.state.selectedParty = value;
    this.notify('selectedParty', value, oldValue);
  }
  
  updateShowKeyInput(value) {
    const oldValue = this.state.showKeyInput;
    this.state.showKeyInput = value;
    this.notify('showKeyInput', value, oldValue);
  }
  
  updatePublicKey(value) {
    const oldValue = this.state.publicKey;
    this.state.publicKey = value;
    this.notify('publicKey', value, oldValue);
  }
  
  updatePrivateKey(value) {
    const oldValue = this.state.privateKey;
    this.state.privateKey = value;
    this.notify('privateKey', value, oldValue);
  }
  
  // Private validation method using the validation service
  _performValidation() {
    const detectedType = validationService.detectVconType(this.state.input);
    const result = validationService.validateVcon(this.state.input);
    
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
    if (result.status === VALIDATION_STATUS.VALID) {
      newData = validationService.parseVcon(this.state.input);
    }
    
    const oldData = this.state.vconData;
    this.state.vconData = newData;
    this.notify('vconData', newData, oldData);
  }
  
  // Helper methods with consistent naming
  isNodeExpanded(node) {
    return this.state.expandedNodes.has(node);
  }
  
  getValidationStatus() {
    return this.state.validationResult.status;
  }

  // Backward compatibility methods (deprecated - use update* methods)
  setInput(value) { this.updateInput(value); }
  setActiveTab(value) { this.updateActiveTab(value); }
  toggleNode(node) { this.toggleNodeExpansion(node); }
  setSelectedParty(value) { this.updateSelectedParty(value); }
  setShowKeyInput(value) { this.updateShowKeyInput(value); }
  setPublicKey(value) { this.updatePublicKey(value); }
  setPrivateKey(value) { this.updatePrivateKey(value); }
}

// Create singleton instance
export const stateManager = new StateManager();