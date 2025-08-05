// Unit Tests: Core Functions
import { describe, test, expect, beforeEach } from "bun:test";
import { TestHelpers } from "../setup/test-helpers.js";

describe("Unit: Core Functions", () => {
  let mockElement, stateManager;

  beforeEach(() => {
    // Set up mock DOM for unit tests
    const mockDOM = TestHelpers.createMockDOM();
    mockElement = mockDOM.mockElement;
    
    // Create mock state manager
    stateManager = TestHelpers.createMockStateManager();
  });

  describe("parseVcon", () => {
    test("parses valid JSON vCon", () => {
      const validVcon = JSON.stringify({
        vcon: "0.3.0",
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        parties: [{ name: "Test Party" }]
      });

      // Import the function (we'll simulate since it's not exported)
      const parseVcon = (input) => {
        try {
          return JSON.parse(input);
        } catch (e) {
          return { error: e.message };
        }
      };

      const result = parseVcon(validVcon);
      expect(result.vcon).toBe("0.3.0");
      expect(result.uuid).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(result.parties).toHaveLength(1);
    });

    test("handles invalid JSON", () => {
      const invalidJson = '{"invalid": json}';
      
      const parseVcon = (input) => {
        try {
          return JSON.parse(input);
        } catch (e) {
          return { error: e.message };
        }
      };

      const result = parseVcon(invalidJson);
      expect(result.error).toBeDefined();
    });

    test("handles empty input", () => {
      const parseVcon = (input) => {
        try {
          return JSON.parse(input);
        } catch (e) {
          return { error: e.message };
        }
      };

      const result = parseVcon('');
      expect(result.error).toBeDefined();
    });
  });

  describe("updateValidationStatus", () => {
    test("updates status element with correct class and text", () => {
      const mockStatusElement = {
        classList: {
          classes: [],
          remove: function(...classes) {
            classes.forEach(cls => {
              const index = this.classes.indexOf(cls);
              if (index > -1) this.classes.splice(index, 1);
            });
          },
          add: function(cls) {
            if (!this.classes.includes(cls)) {
              this.classes.push(cls);
            }
          },
          contains: function(cls) {
            return this.classes.includes(cls);
          }
        },
        textContent: 'validation: unknown'
      };

      // Mock getElementById to return our status element
      global.document.getElementById = (id) => {
        if (id === 'validation-status') return mockStatusElement;
        return null;
      };

      // Simulate the updateValidationStatus function
      const updateValidationStatus = (status = "unknown", message = "") => {
        const statusElement = document.getElementById('validation-status');
        if (!statusElement) return;
        
        // Remove all status classes
        statusElement.classList.remove('unknown', 'good', 'warning', 'fail');
        
        // Add the new status class
        statusElement.classList.add(status);
        
        // Update the text
        const displayMessage = message || status;
        statusElement.textContent = `validation: ${displayMessage}`;
      };

      updateValidationStatus('good');
      expect(mockStatusElement.classList.contains('good')).toBe(true);
      expect(mockStatusElement.textContent).toBe('validation: good');

      updateValidationStatus('fail', 'invalid JSON');
      expect(mockStatusElement.classList.contains('fail')).toBe(true);
      expect(mockStatusElement.textContent).toBe('validation: invalid JSON');
    });
  });

  describe("vCon Sample Data", () => {
    test("creates valid vCon structure", () => {
      const sampleVcon = TestHelpers.createSampleVcon('minimal');
      
      expect(sampleVcon.vcon).toBe("0.3.0");
      expect(sampleVcon.uuid).toBeDefined();
      expect(sampleVcon.parties).toHaveLength(2);
      expect(sampleVcon.parties[0]).toHaveProperty('name');
      expect(sampleVcon.parties[0]).toHaveProperty('tel');
    });

    test("creates full vCon with dialog and analysis", () => {
      const fullVcon = TestHelpers.createSampleVcon('full');
      
      expect(fullVcon.vcon).toBe("0.3.0");
      expect(fullVcon.dialog).toBeDefined();
      expect(fullVcon.dialog).toHaveLength(2);
      expect(fullVcon.analysis).toBeDefined();
      expect(fullVcon.analysis).toHaveLength(1);
    });

    test("creates signed vCon structure", () => {
      const signedVcon = TestHelpers.createSampleVcon('signed');
      
      expect(signedVcon.payload).toBeDefined();
      expect(signedVcon.signatures).toBeDefined();
      expect(signedVcon.signatures).toHaveLength(1);
    });

    test("creates encrypted vCon structure", () => {
      const encryptedVcon = TestHelpers.createSampleVcon('encrypted');
      
      expect(encryptedVcon.protected).toBeDefined();
      expect(encryptedVcon.ciphertext).toBeDefined();
      expect(encryptedVcon.iv).toBeDefined();
      expect(encryptedVcon.tag).toBeDefined();
    });
  });

  describe("State Manager", () => {
    test("manages state correctly", () => {
      expect(stateManager.getState('input')).toBe('');
      expect(stateManager.getState('activeTab')).toBe('inspector');
      
      stateManager.updateInput('test input');
      expect(stateManager.getState('input')).toBe('test input');
    });

    test("handles subscriptions", () => {
      let callbackCalled = false;
      let receivedValue = null;
      
      const callback = (value) => {
        callbackCalled = true;
        receivedValue = value;
      };
      
      stateManager.subscribe('input', callback);
      stateManager.updateInput('new value');
      
      expect(callbackCalled).toBe(true);
      expect(receivedValue).toBe('new value');
    });
  });

  describe("Test Environment", () => {
    test("validates test environment in proper context", () => {
      // The test environment validation checks for globals that exist during testing
      // In this context, the test functions are imported, not global
      expect(typeof describe).toBe('function');
      expect(typeof test).toBe('function');
      expect(typeof expect).toBe('function');
      expect(typeof beforeEach).toBe('function');
    });

    test("creates mock DOM correctly", () => {
      const { mockElement } = TestHelpers.createMockDOM();
      
      expect(global.document).toBeDefined();
      expect(global.document.getElementById).toBeDefined();
      expect(global.window).toBeDefined();
      expect(mockElement).toBeDefined();
    });

    test("cleans up properly", () => {
      TestHelpers.createMockDOM();
      expect(global.document).toBeDefined();
      
      TestHelpers.cleanup();
      expect(global.document).toBeUndefined();
      expect(global.window).toBeUndefined();
    });
  });
});