// Unit Tests: StateManager
import { describe, test, expect, beforeEach, mock } from "bun:test";
import { StateManager } from "../../docs/js/state-manager.js";

// Mock validation service
const mockValidationService = {
  detectVconType: mock(() => "unsigned"),
  validateVcon: mock(() => ({ status: "valid", type: "unsigned" })),
  parseVcon: mock((input) => JSON.parse(input))
};

// Mock the validation service import
mock.module("../../docs/js/services/validation-service.js", () => ({
  validationService: mockValidationService
}));

describe("Unit: StateManager", () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager();
    // Reset mocks
    mockValidationService.detectVconType.mockClear();
    mockValidationService.validateVcon.mockClear();
    mockValidationService.parseVcon.mockClear();
  });

  describe("initialization", () => {
    test("initializes with default state", () => {
      expect(stateManager.getState("input")).toBe("");
      expect(stateManager.getState("activeTab")).toBe("inspector");
      expect(stateManager.getState("selectedParty")).toBeNull();
      expect(stateManager.getState("vconData")).toBeNull();
    });

    test("initializes with default expanded nodes", () => {
      const expandedNodes = stateManager.getState("expandedNodes");
      expect(expandedNodes).toBeInstanceOf(Set);
      expect(expandedNodes.has("vcon")).toBe(true);
    });
  });

  describe("state subscription", () => {
    test("subscribes and notifies listeners", () => {
      const callback = mock();
      stateManager.subscribe("input", callback);
      
      stateManager.updateInput("test input");
      
      expect(callback).toHaveBeenCalledWith("test input", "");
    });

    test("unsubscribes listeners", () => {
      const callback = mock();
      stateManager.subscribe("input", callback);
      stateManager.unsubscribe("input", callback);
      
      stateManager.updateInput("test input");
      
      expect(callback).not.toHaveBeenCalled();
    });

    test("supports multiple listeners for same state", () => {
      const callback1 = mock();
      const callback2 = mock();
      
      stateManager.subscribe("input", callback1);
      stateManager.subscribe("input", callback2);
      
      stateManager.updateInput("test input");
      
      expect(callback1).toHaveBeenCalledWith("test input", "");
      expect(callback2).toHaveBeenCalledWith("test input", "");
    });
  });

  describe("state updates", () => {
    test("updateInput triggers validation", async () => {
      stateManager.updateInput('{"vcon": "0.3.0"}');
      
      // Wait for debounced validation
      await new Promise(resolve => setTimeout(resolve, 350));
      
      expect(mockValidationService.validateVcon).toHaveBeenCalledWith('{"vcon": "0.3.0"}');
    });

    test("updateActiveTab changes tab state", () => {
      const callback = mock();
      stateManager.subscribe("activeTab", callback);
      
      stateManager.updateActiveTab("timeline");
      
      expect(stateManager.getState("activeTab")).toBe("timeline");
      expect(callback).toHaveBeenCalledWith("timeline", "inspector");
    });

    test("toggleNodeExpansion manages expanded nodes", () => {
      const initialExpanded = stateManager.getState("expandedNodes");
      const wasExpanded = initialExpanded.has("test-node");
      
      stateManager.toggleNodeExpansion("test-node");
      
      const newExpanded = stateManager.getState("expandedNodes");
      expect(newExpanded.has("test-node")).toBe(!wasExpanded);
      
      // Toggle again
      stateManager.toggleNodeExpansion("test-node");
      expect(stateManager.getState("expandedNodes").has("test-node")).toBe(wasExpanded);
    });

    test("updateSelectedParty changes party selection", () => {
      const callback = mock();
      stateManager.subscribe("selectedParty", callback);
      
      stateManager.updateSelectedParty(1);
      
      expect(stateManager.getState("selectedParty")).toBe(1);
      expect(callback).toHaveBeenCalledWith(1, null);
    });
  });

  describe("helper methods", () => {
    test("isNodeExpanded checks expansion state", () => {
      expect(stateManager.isNodeExpanded("vcon")).toBe(true);
      expect(stateManager.isNodeExpanded("non-existent")).toBe(false);
    });

    test("getValidationStatus returns current validation status", () => {
      expect(stateManager.getValidationStatus()).toBe("idle");
    });
  });

  describe("backward compatibility", () => {
    test("deprecated methods still work", () => {
      const callback = mock();
      stateManager.subscribe("input", callback);
      
      stateManager.setInput("legacy input");
      
      expect(callback).toHaveBeenCalledWith("legacy input", "");
      expect(stateManager.getState("input")).toBe("legacy input");
    });
  });
});