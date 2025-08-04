// Unit Tests: ValidationService
import { describe, test, expect, beforeEach } from "bun:test";
import { ValidationService } from "../../docs/js/services/validation-service.js";

describe("Unit: ValidationService", () => {
  let validationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe("detectVconType", () => {
    test("detects unsigned vCon", () => {
      const input = JSON.stringify({ vcon: "0.3.0", uuid: "test-uuid" });
      expect(validationService.detectVconType(input)).toBe("unsigned");
    });

    test("detects signed vCon", () => {
      const input = JSON.stringify({ signatures: [{ protected: "header" }] });
      expect(validationService.detectVconType(input)).toBe("signed");
    });

    test("detects encrypted vCon", () => {
      const input = JSON.stringify({ ciphertext: "encrypted-data" });
      expect(validationService.detectVconType(input)).toBe("encrypted");
    });

    test("returns null for empty input", () => {
      expect(validationService.detectVconType("")).toBeNull();
      expect(validationService.detectVconType("   ")).toBeNull();
    });

    test("returns null for invalid JSON", () => {
      expect(validationService.detectVconType("invalid json")).toBeNull();
    });
  });

  describe("isValidUUID", () => {
    test("validates correct UUID format", () => {
      expect(validationService.isValidUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
      expect(validationService.isValidUUID("A1B2C3D4-E5F6-7890-ABCD-EF1234567890")).toBe(true);
    });

    test("rejects invalid UUID format", () => {
      expect(validationService.isValidUUID("not-a-uuid")).toBe(false);
      expect(validationService.isValidUUID("123e4567-e89b-12d3-a456")).toBe(false);
      expect(validationService.isValidUUID("")).toBe(false);
    });
  });

  describe("isValidRFC3339Date", () => {
    test("validates correct RFC3339 dates", () => {
      expect(validationService.isValidRFC3339Date("2023-01-01T00:00:00.000Z")).toBe(true);
      expect(validationService.isValidRFC3339Date("2023-12-31T23:59:59.999Z")).toBe(true);
    });

    test("rejects invalid dates", () => {
      expect(validationService.isValidRFC3339Date("not-a-date")).toBe(false);
      expect(validationService.isValidRFC3339Date("2023-01-01")).toBe(false);
      expect(validationService.isValidRFC3339Date("")).toBe(false);
    });
  });

  describe("isValidMediaType", () => {
    test("validates correct media types", () => {
      expect(validationService.isValidMediaType("text/plain")).toBe(true);
      expect(validationService.isValidMediaType("application/json")).toBe(true);
      expect(validationService.isValidMediaType("audio/wav")).toBe(true);
    });

    test("rejects invalid media types", () => {
      expect(validationService.isValidMediaType("notamediatype")).toBe(false);
      expect(validationService.isValidMediaType("text/")).toBe(false);
      expect(validationService.isValidMediaType("/plain")).toBe(false);
      expect(validationService.isValidMediaType("")).toBe(false);
    });
  });

  describe("validateVcon", () => {
    test("validates minimal unsigned vCon", () => {
      const vcon = {
        vcon: "0.3.0",
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        parties: [{ name: "Test Party" }]
      };
      
      const result = validationService.validateVcon(JSON.stringify(vcon));
      expect(result.status).toBe("valid");
      expect(result.type).toBe("unsigned");
    });

    test("rejects vCon without required fields", () => {
      const vcon = { vcon: "0.3.0" }; // Missing uuid and parties
      
      const result = validationService.validateVcon(JSON.stringify(vcon));
      expect(result.status).toBe("invalid");
      expect(result.errors).toContain("Not a valid vCon format");
    });

    test("validates JWS signed vCon", () => {
      const jws = {
        payload: "encoded-payload",
        signatures: [{ protected: "header", signature: "sig" }]
      };
      
      const result = validationService.validateVcon(JSON.stringify(jws));
      expect(result.status).toBe("valid");
      expect(result.type).toBe("signed");
    });

    test("validates JWE encrypted vCon", () => {
      const jwe = {
        ciphertext: "encrypted-data",
        protected: "header"
      };
      
      const result = validationService.validateVcon(JSON.stringify(jwe));
      expect(result.status).toBe("valid");
      expect(result.type).toBe("encrypted");
    });
  });

  describe("validateDialogObject", () => {
    const mockParties = [{ name: "Party 1" }, { name: "Party 2" }];

    test("validates dialog with required fields", () => {
      const dialog = {
        type: "text",
        body: "Hello world",
        mediatype: "text/plain"
      };
      
      const errors = validationService.validateDialogObject(dialog, mockParties);
      expect(errors).toHaveLength(0);
    });

    test("requires type field", () => {
      const dialog = { body: "Hello" };
      
      const errors = validationService.validateDialogObject(dialog, mockParties);
      expect(errors).toContain("missing type");
    });

    test("requires mediatype when body is present", () => {
      const dialog = { type: "text", body: "Hello" };
      
      const errors = validationService.validateDialogObject(dialog, mockParties);
      expect(errors).toContain("missing mediatype when body is present");
    });

    test("validates party references", () => {
      const dialog = {
        type: "text",
        parties: [0, 1] // Valid references
      };
      
      const errors = validationService.validateDialogObject(dialog, mockParties);
      expect(errors).toHaveLength(0);
      
      // Invalid reference
      dialog.parties = [2]; // Out of bounds
      const errorsInvalid = validationService.validateDialogObject(dialog, mockParties);
      expect(errorsInvalid).toContain("invalid party reference 2");
    });
  });
});