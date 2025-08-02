export const detectVconType = (input) => {
  if (!input.trim()) return null;
  
  try {
    const parsed = JSON.parse(input);
    if (parsed.signatures) {
      return 'signed';
    } else if (parsed.ciphertext) {
      return 'encrypted';
    } else if (parsed.vcon) {
      return 'unsigned';
    }
    return null;
  } catch {
    return null;
  }
};

const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

const isValidRFC3339Date = (dateString) => {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    return date.toISOString() === dateString;
  } catch {
    return false;
  }
};

const validateMediaType = (mediatype) => {
  if (!mediatype || typeof mediatype !== 'string') return false;
  // Basic MIME type validation: type/subtype
  const mimeRegex = /^[a-zA-Z][a-zA-Z0-9][a-zA-Z0-9!#$&\-\^]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^]*$/;
  return mimeRegex.test(mediatype);
};

const validateDialogObject = (dialog, parties) => {
  if (!dialog.type) return false;
  const validTypes = ['recording', 'text', 'transfer', 'incomplete'];
  if (!validTypes.includes(dialog.type)) return false;
  
  // Check for required mediatype if body is present
  if (dialog.body && !dialog.mediatype) return false;
  
  // Validate mediatype format if present
  if (dialog.mediatype && !validateMediaType(dialog.mediatype)) return false;
  
  // Validate party index references
  if (dialog.parties) {
    if (!Array.isArray(dialog.parties)) return false;
    for (const partyIndex of dialog.parties) {
      if (!Number.isInteger(partyIndex) || partyIndex < 0 || partyIndex >= parties.length) {
        return false;
      }
    }
  }
  
  return true;
};

export const validateVcon = (input) => {
  if (!input.trim()) return { status: 'idle' };
  
  try {
    const parsed = JSON.parse(input);
    
    // Check for JWS format first
    if (parsed.payload && parsed.signatures) {
      return { status: 'valid', type: 'signed' };
    }
    
    // Check for JWE format
    if (parsed.ciphertext && parsed.protected) {
      return { status: 'valid', type: 'encrypted' };
    }
    
    // Basic vCon validation for unsigned format
    if (parsed.vcon && parsed.uuid) {
      const errors = [];
      
      // Validate vCon version
      if (parsed.vcon !== '0.3.0') {
        errors.push(`Invalid vCon version: expected '0.3.0', got '${parsed.vcon}'`);
      }
      
      // Validate UUID format
      if (!isValidUUID(parsed.uuid)) {
        errors.push('Invalid UUID format');
      }

      // Validate required parties field
      if (!parsed.parties || !Array.isArray(parsed.parties) || parsed.parties.length === 0) {
        errors.push('Missing or empty parties array - at least one party is required');
      }

      // Validate created_at if present (MUST be valid RFC3339 if provided)
      if (parsed.created_at && !isValidRFC3339Date(parsed.created_at)) {
        errors.push('Invalid created_at date format - must be valid RFC3339');
      }

      // Validate updated_at if present (MUST be valid RFC3339 if provided)
      if (parsed.updated_at && !isValidRFC3339Date(parsed.updated_at)) {
        errors.push('Invalid updated_at date format - must be valid RFC3339');
      }
      
      // Validate dialog objects if present
      if (parsed.dialog && Array.isArray(parsed.dialog)) {
        for (let i = 0; i < parsed.dialog.length; i++) {
          const dialog = parsed.dialog[i];
          if (!validateDialogObject(dialog, parsed.parties)) {
            const dialogErrors = [];
            if (!dialog.type) dialogErrors.push('missing type');
            if (dialog.type && !['recording', 'text', 'transfer', 'incomplete'].includes(dialog.type)) {
              dialogErrors.push(`invalid type '${dialog.type}'`);
            }
            if (dialog.body && !dialog.mediatype) dialogErrors.push('missing mediatype when body is present');
            if (dialog.mediatype && !validateMediaType(dialog.mediatype)) {
              dialogErrors.push(`invalid mediatype format '${dialog.mediatype}'`);
            }
            if (dialog.parties && !Array.isArray(dialog.parties)) {
              dialogErrors.push('parties must be an array');
            } else if (dialog.parties) {
              for (const partyIndex of dialog.parties) {
                if (!Number.isInteger(partyIndex) || partyIndex < 0 || partyIndex >= parsed.parties.length) {
                  dialogErrors.push(`invalid party reference ${partyIndex}`);
                }
              }
            }
            errors.push(`Dialog[${i}]: ${dialogErrors.join(', ')}`);
          }
        }
      }
      
      if (errors.length > 0) {
        return { status: 'invalid', errors, type: 'unsigned' };
      }
      
      return { status: 'valid', type: 'unsigned' };
    }
    
    return { status: 'invalid', errors: ['Not a valid vCon format'] };
  } catch (e) {
    return { status: 'invalid', errors: [`JSON parse error: ${e.message}`] };
  }
};

export const parseVcon = (input) => {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
};