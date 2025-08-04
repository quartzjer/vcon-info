// Test Helper Utilities
export class TestHelpers {
  // Create mock DOM environment for unit tests
  static createMockDOM() {
    const mockElement = {
      innerHTML: '',
      textContent: '',
      value: '',
      addEventListener: () => {},
      removeEventListener: () => {},
      querySelector: () => null,
      querySelectorAll: () => [],
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      dataset: {}
    };

    global.document = {
      getElementById: () => mockElement,
      querySelector: () => mockElement,
      querySelectorAll: () => [mockElement],
      createElement: () => mockElement,
      addEventListener: () => {},
      removeEventListener: () => {}
    };

    global.window = {
      addEventListener: () => {},
      removeEventListener: () => {}
    };

    return { mockElement };
  }

  // Create sample vCon data for testing
  static createSampleVcon(type = 'minimal') {
    const base = {
      vcon: "0.3.0",
      uuid: "123e4567-e89b-12d3-a456-426614174000",
      parties: [
        { name: "Alice Smith", tel: "+1-555-0101" },
        { name: "Bob Jones", tel: "+1-555-0102" }
      ]
    };

    switch (type) {
      case 'minimal':
        return base;
      
      case 'full':
        return {
          ...base,
          created_at: "2023-01-01T00:00:00.000Z",
          updated_at: "2023-01-01T00:05:00.000Z",
          subject: "Test conversation",
          dialog: [
            {
              type: "text",
              parties: [0],
              start: "2023-01-01T00:01:00.000Z",
              body: "Hello, this is Alice",
              mediatype: "text/plain"
            },
            {
              type: "text", 
              parties: [1],
              start: "2023-01-01T00:01:30.000Z",
              body: "Hi Alice, this is Bob",
              mediatype: "text/plain"
            }
          ],
          analysis: [
            {
              type: "summary",
              body: "Brief conversation between Alice and Bob",
              mediatype: "text/plain"
            }
          ]
        };
      
      case 'signed':
        return {
          payload: btoa(JSON.stringify(base)),
          signatures: [{
            protected: btoa(JSON.stringify({ alg: "RS256" })),
            signature: "mock-signature-data"
          }]
        };
      
      case 'encrypted':
        return {
          protected: btoa(JSON.stringify({ alg: "RSA-OAEP", enc: "A256GCM" })),
          ciphertext: "mock-encrypted-data",
          iv: "mock-iv",
          tag: "mock-tag"
        };
      
      default:
        return base;
    }
  }

  // Wait for async operations with timeout
  static async waitFor(condition, timeout = 5000) {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  // Create mock state manager for testing
  static createMockStateManager() {
    const state = {
      input: '',
      activeTab: 'inspector',
      expandedNodes: new Set(['vcon']),
      selectedParty: null,
      validationResult: { status: 'idle' },
      vconType: 'unsigned',
      vconData: null
    };

    const listeners = {};

    return {
      state,
      getState: (key) => key ? state[key] : state,
      subscribe: (key, callback) => {
        if (!listeners[key]) listeners[key] = [];
        listeners[key].push(callback);
      },
      unsubscribe: (key, callback) => {
        if (listeners[key]) {
          listeners[key] = listeners[key].filter(cb => cb !== callback);
        }
      },
      notify: (key, newValue, oldValue) => {
        if (listeners[key]) {
          listeners[key].forEach(cb => cb(newValue, oldValue));
        }
      },
      updateInput: (value) => {
        const old = state.input;
        state.input = value;
        if (listeners.input) {
          listeners.input.forEach(cb => cb(value, old));
        }
      }
    };
  }

  // Validate test environment
  static validateTestEnvironment() {
    const required = ['describe', 'test', 'expect', 'beforeEach'];
    const missing = required.filter(fn => typeof global[fn] === 'undefined');
    
    if (missing.length > 0) {
      throw new Error(`Missing test functions: ${missing.join(', ')}`);
    }
    
    return true;
  }

  // Clean up test artifacts
  static cleanup() {
    // Clean up any global test state
    if (global.document) {
      delete global.document;
    }
    if (global.window) {
      delete global.window;
    }
  }
}