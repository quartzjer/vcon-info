// vCon Info - Utils Module
// Utility functions for validation, formatting, and data processing

/**
 * Escape HTML for safe display
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Validate UUID format according to vCon spec (Version 8 UUID from draft-peabody-dispatch-new-uuid-format)
 * @param {string} uuid - UUID string to validate
 * @returns {boolean} True if valid UUID
 */
function isValidUUID(uuid) {
    // Basic format check: 8-4-4-4-12 hex characters with hyphens
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
        return false;
    }
    
    // vCon spec requires Version 8 UUID (position 12 should be '8')
    // But we'll be more permissive and accept RFC 4122 versions 1-8 for compatibility
    const versionChar = uuid.charAt(14);
    const version = parseInt(versionChar, 16);
    if (version < 1 || version > 8) {
        return false;
    }
    
    // Check variant bits (position 16 should be 8, 9, A, or B for RFC 4122)
    const variantChar = uuid.charAt(19);
    const variantBits = parseInt(variantChar, 16);
    if (variantBits < 8 || variantBits > 11) { // 8-11 in hex = 8-B
        return false;
    }
    
    return true;
}

/**
 * Validate RFC3339 date format
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid RFC3339 date
 */
function isValidRFC3339Date(dateStr) {
    // RFC3339 format: YYYY-MM-DDTHH:mm:ss.sssZ or ±HH:MM
    const rfc3339Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
    if (!rfc3339Regex.test(dateStr)) {
        return false;
    }
    // Also check if it's a valid date
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}

/**
 * Validate tel URL format
 * @param {string} tel - Tel URL to validate
 * @returns {boolean} True if valid
 */
function isValidTelURL(tel) {
    // Accept with or without tel: prefix
    const telRegex = /^(tel:)?[+]?[0-9\-().\s]+$/;
    return telRegex.test(tel);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    // Accept with or without mailto: prefix
    const emailRegex = /^(mailto:)?[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate GML position format
 * @param {string} gmlpos - GML position string
 * @returns {boolean} True if valid
 */
function isValidGMLPos(gmlpos) {
    // Format: "latitude longitude" (two space-separated numbers)
    const parts = gmlpos.trim().split(/\s+/);
    if (parts.length !== 2) return false;
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/**
 * Check if a value has meaningful content (not empty)
 * @param {any} value - Value to check
 * @returns {boolean} True if value has meaningful content
 */
function hasValidContent(value) {
    if (value === null || value === undefined) {
        return false;
    }
    
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return value.length > 0;
        } else {
            return Object.keys(value).length > 0;
        }
    }
    
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    
    return true; // For other types (numbers, booleans), consider them as having content
}

/**
 * Format date for display
 * @param {string} dateStr - ISO date string
 * @returns {object} Object with raw and display formats
 */
function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return {
            raw: dateStr,
            display: date.toLocaleString(),
            iso: date.toISOString()
        };
    } catch (e) {
        return {
            raw: dateStr,
            display: 'Invalid date',
            iso: null
        };
    }
}

/**
 * Generate a safe filename from a string
 * @param {string} str - String to convert to filename
 * @returns {string} Safe filename
 */
function toSafeFilename(str) {
    return str
        .replace(/[^a-z0-9]/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .toLowerCase();
}

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    
    const cloned = {};
    Object.keys(obj).forEach(key => {
        cloned[key] = deepClone(obj[key]);
    });
    
    return cloned;
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit how often a function can be called
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Format file size in human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate a random UUID (version 4)
 * @returns {string} UUID string
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Validate JSON string
 * @param {string} str - String to validate
 * @returns {object} Validation result with isValid and error properties
 */
function validateJSON(str) {
    try {
        JSON.parse(str);
        return { isValid: true, error: null };
    } catch (e) {
        return { isValid: false, error: e.message };
    }
}

/**
 * Check if string is a valid base64
 * @param {string} str - String to check
 * @returns {boolean} True if valid base64
 */
function isValidBase64(str) {
    try {
        return btoa(atob(str)) === str;
    } catch (e) {
        return false;
    }
}

/**
 * Parse content type header
 * @param {string} contentType - Content type string
 * @returns {object} Parsed content type with type, subtype, and parameters
 */
function parseContentType(contentType) {
    const parts = contentType.split(';');
    const [type, subtype] = parts[0].trim().split('/');
    
    const parameters = {};
    for (let i = 1; i < parts.length; i++) {
        const [key, value] = parts[i].trim().split('=');
        if (key && value) {
            parameters[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
    }
    
    return {
        type: type?.trim(),
        subtype: subtype?.trim(),
        parameters,
        toString: () => contentType
    };
}

/**
 * Calculate hash of a string (simple djb2 hash)
 * @param {string} str - String to hash
 * @returns {string} Hash string
 */
function simpleHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash).toString(16);
}

/**
 * Check if two objects are deeply equal
 * @param {any} a - First object
 * @param {any} b - Second object
 * @returns {boolean} True if objects are equal
 */
function deepEqual(a, b) {
    if (a === b) return true;
    
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }
    
    if (!a || !b || (typeof a !== 'object' && typeof b !== 'object')) {
        return a === b;
    }
    
    if (a === null || a === undefined || b === null || b === undefined) {
        return false;
    }
    
    if (a.prototype !== b.prototype) return false;
    
    let keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) {
        return false;
    }
    
    return keys.every(k => deepEqual(a[k], b[k]));
}

/**
 * Get nested property from object using dot notation
 * @param {object} obj - Object to get property from
 * @param {string} path - Property path (e.g., 'a.b.c')
 * @param {any} defaultValue - Default value if property doesn't exist
 * @returns {any} Property value or default
 */
function getNestedProperty(obj, path, defaultValue = undefined) {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
        if (result === null || result === undefined || typeof result !== 'object') {
            return defaultValue;
        }
        result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
}

/**
 * Set nested property on object using dot notation
 * @param {object} obj - Object to set property on
 * @param {string} path - Property path (e.g., 'a.b.c')
 * @param {any} value - Value to set
 */
function setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
}

// Export functions for use by other modules
window.Utils = {
    escapeHtml,
    isValidUUID,
    isValidRFC3339Date,
    isValidTelURL,
    isValidEmail,
    isValidGMLPos,
    hasValidContent,
    formatDate,
    toSafeFilename,
    deepClone,
    debounce,
    throttle,
    formatFileSize,
    generateUUID,
    validateJSON,
    isValidBase64,
    parseContentType,
    simpleHash,
    deepEqual,
    getNestedProperty,
    setNestedProperty
};