// Base component class for shared functionality and cleanup

export class BaseComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.listeners = new Map();
    this.stateSubscriptions = new Map();
    
    if (!this.container) {
      throw new Error(`Container element with id '${containerId}' not found`);
    }
  }

  // Subscribe to state changes with automatic cleanup tracking
  subscribeToState(stateManager, stateKey, callback) {
    stateManager.subscribe(stateKey, callback);
    
    // Track subscription for cleanup
    if (!this.stateSubscriptions.has(stateManager)) {
      this.stateSubscriptions.set(stateManager, new Map());
    }
    
    const managerSubscriptions = this.stateSubscriptions.get(stateManager);
    if (!managerSubscriptions.has(stateKey)) {
      managerSubscriptions.set(stateKey, []);
    }
    managerSubscriptions.get(stateKey).push(callback);
  }

  // Add event listener with automatic cleanup tracking
  addEventListener(element, event, handler, options = {}) {
    element.addEventListener(event, handler, options);
    
    // Track listener for cleanup
    const key = `${element.tagName}_${event}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push({ element, event, handler, options });
  }

  // Add delegated event listener to container
  addDelegatedEventListener(selector, event, handler) {
    const delegatedHandler = (e) => {
      const target = e.target.closest(selector);
      if (target) {
        handler.call(target, e);
      }
    };
    
    this.addEventListener(this.container, event, delegatedHandler);
  }

  // Render method to be implemented by subclasses
  render(data) {
    throw new Error('render() method must be implemented by subclass');
  }

  // Update container content and reattach event listeners
  updateContent(html) {
    this.container.innerHTML = html;
    this.attachEventListeners();
  }

  // Attach event listeners - to be implemented by subclasses
  attachEventListeners() {
    // Override in subclasses
  }

  // Show loading state
  showLoading(message = 'Loading...') {
    this.container.innerHTML = `<p class="text-gray-400 text-sm">${message}</p>`;
  }

  // Show empty state
  showEmpty(message = 'No data available') {
    this.container.innerHTML = `<p class="text-gray-400 text-sm">${message}</p>`;
  }

  // Show error state
  showError(message = 'An error occurred') {
    this.container.innerHTML = `<p class="text-red-400 text-sm">${message}</p>`;
  }

  // Clean up all event listeners and state subscriptions
  cleanup() {
    // Clean up DOM event listeners
    for (const [key, listenerArray] of this.listeners) {
      for (const { element, event, handler, options } of listenerArray) {
        element.removeEventListener(event, handler, options);
      }
    }
    this.listeners.clear();

    // Clean up state subscriptions
    for (const [stateManager, subscriptions] of this.stateSubscriptions) {
      for (const [stateKey, callbacks] of subscriptions) {
        for (const callback of callbacks) {
          stateManager.unsubscribe(stateKey, callback);
        }
      }
    }
    this.stateSubscriptions.clear();
  }

  // Utility method to safely get element by ID within container
  getElement(id) {
    return this.container.querySelector(`#${id}`);
  }

  // Utility method to safely get elements by selector within container
  getElements(selector) {
    return this.container.querySelectorAll(selector);
  }
}