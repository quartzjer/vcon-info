import { describe, it, expect } from 'vitest'
import { detectVconType, validateVcon, parseVcon } from '../vconValidator'

describe('vconValidator', () => {
  describe('detectVconType', () => {
    it('should return null for empty input', () => {
      expect(detectVconType('')).toBe(null)
      expect(detectVconType('   ')).toBe(null)
    })

    it('should return null for invalid JSON', () => {
      expect(detectVconType('invalid json')).toBe(null)
      expect(detectVconType('{"incomplete": ')).toBe(null)
    })

    it('should detect signed vCon', () => {
      const signedVcon = JSON.stringify({
        signatures: [{ signature: "test" }],
        payload: "test"
      })
      expect(detectVconType(signedVcon)).toBe('signed')
    })

    it('should detect encrypted vCon', () => {
      const encryptedVcon = JSON.stringify({
        ciphertext: "encrypted-data",
        protected: "header"
      })
      expect(detectVconType(encryptedVcon)).toBe('encrypted')
    })

    it('should detect unsigned vCon', () => {
      const unsignedVcon = JSON.stringify({
        vcon: "0.3.0",
        uuid: "018e3f72-c3a8-8b8e-b468-6ebf2e2e8c14"
      })
      expect(detectVconType(unsignedVcon)).toBe('unsigned')
    })

    it('should return null for objects without vCon indicators', () => {
      const normalObject = JSON.stringify({
        name: "test",
        value: 123
      })
      expect(detectVconType(normalObject)).toBe(null)
    })
  })

  describe('validateVcon', () => {
    it('should return idle for empty input', () => {
      expect(validateVcon('')).toEqual({ status: 'idle' })
      expect(validateVcon('   ')).toEqual({ status: 'idle' })
    })

    it('should return invalid for malformed JSON', () => {
      const result1 = validateVcon('invalid json')
      expect(result1.status).toBe('invalid')
      expect(result1.errors).toBeDefined()
      
      const result2 = validateVcon('{"incomplete": ')
      expect(result2.status).toBe('invalid')
      expect(result2.errors).toBeDefined()
    })

    it('should return valid for proper unsigned vCon', () => {
      const validVcon = JSON.stringify({
        vcon: "0.3.0",
        uuid: "018e3f72-c3a8-8b8e-b468-6ebf2e2e8c14",
        parties: [
          { tel: "+1234567890", name: "Test Party" }
        ]
      })
      expect(validateVcon(validVcon)).toEqual({ status: 'valid', type: 'unsigned' })
    })

    it('should return valid for JWS format', () => {
      const jwsVcon = JSON.stringify({
        payload: "eyJ2Y29uIjoiMC4wLjEifQ",
        signatures: [{ signature: "test-signature" }]
      })
      expect(validateVcon(jwsVcon)).toEqual({ status: 'valid', type: 'signed' })
    })

    it('should return valid for JWE format', () => {
      const jweVcon = JSON.stringify({
        ciphertext: "encrypted-data",
        protected: "header-data"
      })
      expect(validateVcon(jweVcon)).toEqual({ status: 'valid', type: 'encrypted' })
    })

    it('should return invalid for objects missing required fields', () => {
      const invalidVcon = JSON.stringify({
        vcon: "0.3.0"
        // missing uuid and parties
      })
      const result = validateVcon(invalidVcon)
      expect(result.status).toBe('invalid')
      expect(result.errors).toBeDefined()
    })

    it('should return invalid for completely unrelated objects', () => {
      const unrelatedObject = JSON.stringify({
        name: "test",
        data: "value"
      })
      const result = validateVcon(unrelatedObject)
      expect(result.status).toBe('invalid')
      expect(result.errors).toContain('Not a valid vCon format')
    })
  })

  describe('parseVcon', () => {
    it('should parse valid JSON', () => {
      const testObject = { vcon: "0.3.0", uuid: "018e3f72-c3a8-8b8e-b468-6ebf2e2e8c14" }
      const jsonString = JSON.stringify(testObject)
      expect(parseVcon(jsonString)).toEqual(testObject)
    })

    it('should return null for invalid JSON', () => {
      expect(parseVcon('invalid json')).toBe(null)
      expect(parseVcon('{"incomplete": ')).toBe(null)
    })

    it('should return null for empty string', () => {
      expect(parseVcon('')).toBe(null)
    })

    it('should handle complex nested objects', () => {
      const complexVcon = {
        vcon: "0.3.0",
        uuid: "018e3f72-c3a8-8b8e-b468-6ebf2e2e8c14",
        parties: [
          { tel: "+1234567890", name: "Party 1" }
        ],
        dialog: [],
        analysis: []
      }
      const jsonString = JSON.stringify(complexVcon)
      expect(parseVcon(jsonString)).toEqual(complexVcon)
    })
  })

  describe('enhanced dialog validation', () => {
    it('should validate party references in dialog', () => {
      const vconWithInvalidPartyRef = JSON.stringify({
        vcon: "0.3.0",
        uuid: "018e3f72-c3a8-8b8e-b468-6ebf2e2e8c14",
        parties: [
          { tel: "+1234567890", name: "Party 1" }
        ],
        dialog: [
          {
            type: "text",
            parties: [0, 1], // party 1 doesn't exist
            mediatype: "text/plain",
            body: "test"
          }
        ]
      })
      
      const result = validateVcon(vconWithInvalidPartyRef)
      expect(result.status).toBe('invalid')
      expect(result.errors.some(e => e.includes('invalid party reference 1'))).toBe(true)
    })

    it('should validate mediatype format', () => {
      const vconWithInvalidMediatype = JSON.stringify({
        vcon: "0.3.0",
        uuid: "018e3f72-c3a8-8b8e-b468-6ebf2e2e8c14",
        parties: [
          { tel: "+1234567890", name: "Party 1" }
        ],
        dialog: [
          {
            type: "text",
            parties: [0],
            mediatype: "invalid-mediatype", // invalid format
            body: "test"
          }
        ]
      })
      
      const result = validateVcon(vconWithInvalidMediatype)
      expect(result.status).toBe('invalid')
      expect(result.errors.some(e => e.includes('invalid mediatype format'))).toBe(true)
    })

    it('should require mediatype when body is present', () => {
      const vconWithMissingMediatype = JSON.stringify({
        vcon: "0.3.0",
        uuid: "018e3f72-c3a8-8b8e-b468-6ebf2e2e8c14",
        parties: [
          { tel: "+1234567890", name: "Party 1" }
        ],
        dialog: [
          {
            type: "text",
            parties: [0],
            body: "test" // body present but no mediatype
          }
        ]
      })
      
      const result = validateVcon(vconWithMissingMediatype)
      expect(result.status).toBe('invalid')
      expect(result.errors.some(e => e.includes('missing mediatype when body is present'))).toBe(true)
    })
  })
})