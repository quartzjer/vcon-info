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
      if (parsed.vcon !== '0.0.2') {
        return 'invalid';
      }
      
      // Validate UUID format
      if (!isValidUUID(parsed.uuid)) {
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