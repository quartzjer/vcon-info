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

export const validateVcon = (input) => {
  if (!input.trim()) return 'idle';
  
  try {
    const parsed = JSON.parse(input);
    
    // Basic vCon validation
    if (parsed.vcon && parsed.uuid) {
      return 'valid';
    }
    
    // Check for JWS format
    if (parsed.payload && parsed.signatures) {
      return 'valid';
    }
    
    // Check for JWE format
    if (parsed.ciphertext && parsed.protected) {
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