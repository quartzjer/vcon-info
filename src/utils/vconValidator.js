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

const validateDialogObject = (dialog) => {
  if (!dialog.type) return false;
  const validTypes = ['recording', 'text', 'transfer', 'incomplete'];
  if (!validTypes.includes(dialog.type)) return false;
  
  // Check for required mediatype if body is present
  if (dialog.body && !dialog.mediatype) return false;
  
  return true;
};

export const validateVcon = (input) => {
  if (!input.trim()) return 'idle';
  
  try {
    const parsed = JSON.parse(input);
    
    // Check for JWS format first
    if (parsed.payload && parsed.signatures) {
      return 'valid';
    }
    
    // Check for JWE format
    if (parsed.ciphertext && parsed.protected) {
      return 'valid';
    }
    
    // Basic vCon validation for unsigned format
    if (parsed.vcon && parsed.uuid) {
      // Validate vCon version
      if (parsed.vcon !== '0.3.0') {
        return 'invalid';
      }
      
      // Validate UUID format
      if (!isValidUUID(parsed.uuid)) {
        return 'invalid';
      }

      // Validate required parties field
      if (!parsed.parties || !Array.isArray(parsed.parties) || parsed.parties.length === 0) {
        return 'invalid';
      }

      // Validate created_at if present (MUST be valid RFC3339 if provided)
      if (parsed.created_at && !isValidRFC3339Date(parsed.created_at)) {
        return 'invalid';
      }

      // Validate updated_at if present (MUST be valid RFC3339 if provided)
      if (parsed.updated_at && !isValidRFC3339Date(parsed.updated_at)) {
        return 'invalid';
      }
      
      // Validate dialog objects if present
      if (parsed.dialog && Array.isArray(parsed.dialog)) {
        for (const dialog of parsed.dialog) {
          if (!validateDialogObject(dialog)) {
            return 'invalid';
          }
        }
      }
      
      return 'valid';
    }
    
    return 'invalid';
  } catch {
    return 'invalid';
  }
};

export const parseVcon = (input) => {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
};