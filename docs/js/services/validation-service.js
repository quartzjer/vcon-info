// Validation service - extracted from state manager for separation of concerns
import { VCON_TYPES, VALIDATION_STATUS, DIALOG_TYPES } from '../constants.js';

export class ValidationService {
  constructor() {
    this.validators = new Map();
    this.setupValidators();
  }

  setupValidators() {
    this.validators.set('uuid', this.isValidUUID);
    this.validators.set('rfc3339', this.isValidRFC3339Date); 
    this.validators.set('mediatype', this.isValidMediaType);
    this.validators.set('dialogObject', this.validateDialogObject.bind(this));
  }

  detectVconType(input) {
    if (!input.trim()) return null;
    
    try {
      const parsed = JSON.parse(input);
      if (parsed.signatures) {
        return VCON_TYPES.SIGNED;
      } else if (parsed.ciphertext) {
        return VCON_TYPES.ENCRYPTED;
      } else if (parsed.vcon) {
        return VCON_TYPES.UNSIGNED;
      }
      return null;
    } catch {
      return null;
    }
  }

  validateVcon(input) {
    if (!input.trim()) {
      return { status: VALIDATION_STATUS.IDLE };
    }
    
    try {
      const parsed = JSON.parse(input);
      
      // Check for JWS format first
      if (parsed.payload && parsed.signatures) {
        return { status: VALIDATION_STATUS.VALID, type: VCON_TYPES.SIGNED };
      }
      
      // Check for JWE format
      if (parsed.ciphertext && parsed.protected) {
        return { status: VALIDATION_STATUS.VALID, type: VCON_TYPES.ENCRYPTED };
      }
      
      // Validate unsigned vCon format
      if (parsed.vcon && parsed.uuid) {
        return this.validateUnsignedVcon(parsed);
      }
      
      return { 
        status: VALIDATION_STATUS.INVALID, 
        errors: ['Not a valid vCon format'] 
      };
    } catch (e) {
      return { 
        status: VALIDATION_STATUS.INVALID, 
        errors: [`JSON parse error: ${e.message}`] 
      };
    }
  }

  validateUnsignedVcon(vcon) {
    const errors = [];
    
    // Validate vCon version
    if (vcon.vcon !== '0.3.0') {
      errors.push(`Invalid vCon version: expected '0.3.0', got '${vcon.vcon}'`);
    }
    
    // Validate UUID format
    if (!this.isValidUUID(vcon.uuid)) {
      errors.push('Invalid UUID format');
    }

    // Validate required parties field
    if (!vcon.parties || !Array.isArray(vcon.parties) || vcon.parties.length === 0) {
      errors.push('Missing or empty parties array - at least one party is required');
    }

    // Validate timestamps
    if (vcon.created_at && !this.isValidRFC3339Date(vcon.created_at)) {
      errors.push('Invalid created_at date format - must be valid RFC3339');
    }

    if (vcon.updated_at && !this.isValidRFC3339Date(vcon.updated_at)) {
      errors.push('Invalid updated_at date format - must be valid RFC3339');
    }
    
    // Validate dialog objects if present
    if (vcon.dialog && Array.isArray(vcon.dialog)) {
      errors.push(...this.validateDialogArray(vcon.dialog, vcon.parties));
    }
    
    if (errors.length > 0) {
      return { 
        status: VALIDATION_STATUS.INVALID, 
        errors, 
        type: VCON_TYPES.UNSIGNED 
      };
    }
    
    return { status: VALIDATION_STATUS.VALID, type: VCON_TYPES.UNSIGNED };
  }

  validateDialogArray(dialog, parties) {
    const errors = [];
    
    for (let i = 0; i < dialog.length; i++) {
      const dialogItem = dialog[i];
      const dialogErrors = this.validateDialogObject(dialogItem, parties);
      
      if (dialogErrors.length > 0) {
        errors.push(`Dialog[${i}]: ${dialogErrors.join(', ')}`);
      }
    }
    
    return errors;
  }

  validateDialogObject(dialog, parties) {
    const errors = [];
    
    // Validate type
    if (!dialog.type) {
      errors.push('missing type');
    } else if (!Object.values(DIALOG_TYPES).includes(dialog.type)) {
      errors.push(`invalid type '${dialog.type}'`);
    }
    
    // Validate mediatype when body is present
    if (dialog.body && !dialog.mediatype) {
      errors.push('missing mediatype when body is present');
    }
    
    // Validate mediatype format
    if (dialog.mediatype && !this.isValidMediaType(dialog.mediatype)) {
      errors.push(`invalid mediatype format '${dialog.mediatype}'`);
    }
    
    // Validate party references
    if (dialog.parties) {
      if (!Array.isArray(dialog.parties)) {
        errors.push('parties must be an array');
      } else {
        for (const partyIndex of dialog.parties) {
          if (!Number.isInteger(partyIndex) || partyIndex < 0 || partyIndex >= parties.length) {
            errors.push(`invalid party reference ${partyIndex}`);
          }
        }
      }
    }
    
    return errors;
  }

  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  isValidRFC3339Date(dateString) {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      return date.toISOString() === dateString;
    } catch {
      return false;
    }
  }

  isValidMediaType(mediatype) {
    if (!mediatype || typeof mediatype !== 'string') return false;
    // Basic MIME type validation: type/subtype
    const mimeRegex = /^[a-zA-Z][a-zA-Z0-9][a-zA-Z0-9!#$&\-\^]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^]*$/;
    return mimeRegex.test(mediatype);
  }

  parseVcon(input) {
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  }
}

// Create singleton instance
export const validationService = new ValidationService();