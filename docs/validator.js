// vCon Info - Validator Module
// Handles vCon validation logic and detailed validation functions

/**
 * Parse and validate vCon data
 * @param {string} input - Raw vCon input
 * @returns {object} Parsed vCon object or error
 */
function parseVcon(input) {
    try {
        return JSON.parse(input);
    } catch (e) {
        return { error: e.message };
    }
}

/**
 * Perform detailed validation of vCon data
 * @param {object} vcon - Parsed vCon object
 * @returns {object} Detailed validation results
 */
function performDetailedValidation(vcon) {
    const results = {};
    const errors = [];
    const warnings = [];
    
    // 1. Schema validation - check vcon version
    if (!vcon.vcon) {
        errors.push('Missing required "vcon" version field');
        results.schema = { status: 'fail', message: 'Missing required "vcon" version field' };
    } else {
        const supportedVersions = ['0.0.1', '0.0.2', '0.3.0'];
        const currentVersion = '0.3.0';
        
        if (supportedVersions.includes(vcon.vcon)) {
            if (vcon.vcon === currentVersion) {
                results.schema = { status: 'good', message: 'Valid vCon v0.3.0 format (current version)' };
            } else {
                warnings.push(`vCon version ${vcon.vcon} is valid but not current (latest: ${currentVersion})`);
                results.schema = { status: 'good', message: `Valid vCon v${vcon.vcon} format (older version, current: ${currentVersion})` };
            }
        } else {
            // Check if it's a plausible version format (e.g., 0.2.0, 1.0.0)
            const versionRegex = /^[0-9]+\.[0-9]+\.[0-9]+$/;
            if (versionRegex.test(vcon.vcon)) {
                warnings.push(`vCon version ${vcon.vcon} may not be fully supported (expected ${currentVersion})`);
                results.schema = { status: 'warning', message: `vCon version ${vcon.vcon} detected (expected ${currentVersion})` };
            } else {
                errors.push(`Invalid vCon version format: ${vcon.vcon}`);
                results.schema = { status: 'fail', message: `Invalid vCon version format: ${vcon.vcon} (expected format: x.y.z)` };
            }
        }
    }
    
    // 1.5. Version-specific field compatibility checks
    if (vcon.vcon) {
        const versionCompatibilityIssues = checkVersionSpecificFields(vcon, vcon.vcon);
        warnings.push(...versionCompatibilityIssues.warnings);
        errors.push(...versionCompatibilityIssues.errors);
    }
    
    // 2. Required fields validation
    const requiredFields = {
        'uuid': 'Unique identifier for the vCon',
        'created_at': 'Creation timestamp',
        'parties': 'Array of conversation participants'
    };
    
    const missingRequired = [];
    Object.entries(requiredFields).forEach(([field, description]) => {
        if (!vcon[field]) {
            missingRequired.push(`${field} (${description})`);
            errors.push(`Missing required field: ${field}`);
        }
    });
    
    if (missingRequired.length === 0) {
        // Additional validation for required fields
        let fieldErrors = [];
        
        // Validate UUID format
        if (vcon.uuid && !isValidUUID(vcon.uuid)) {
            fieldErrors.push('Invalid UUID format');
            warnings.push('UUID should be a valid UUID format');
        }
        
        // Validate created_at is RFC3339 date
        if (vcon.created_at && !isValidRFC3339Date(vcon.created_at)) {
            fieldErrors.push('created_at must be RFC3339 date format');
            errors.push('created_at must be in RFC3339 date format');
        }
        
        // Validate parties is non-empty array
        if (vcon.parties) {
            if (!Array.isArray(vcon.parties)) {
                fieldErrors.push('parties must be an array');
                errors.push('parties must be an array');
            } else if (vcon.parties.length === 0) {
                fieldErrors.push('parties array cannot be empty');
                warnings.push('parties array should not be empty');
            } else {
                // Validate each party object
                vcon.parties.forEach((party, index) => {
                    const partyErrors = validatePartyObject(party, index);
                    fieldErrors = fieldErrors.concat(partyErrors.errors);
                    errors.push(...partyErrors.errors);
                    warnings.push(...partyErrors.warnings);
                });
            }
        }
        
        if (fieldErrors.length === 0) {
            results.required = { status: 'good', message: 'All required fields are valid' };
        } else {
            results.required = { status: 'warning', message: fieldErrors.join('; ') };
        }
    } else {
        results.required = { 
            status: 'fail', 
            message: `Missing: ${missingRequired.map(f => f.split(' (')[0]).join(', ')}` 
        };
    }
    
    // 3. Data integrity validation
    const integrityIssues = [];
    
    // Check mutually exclusive fields
    const exclusiveFields = [
        { name: 'redacted', value: vcon.redacted },
        { name: 'appended', value: vcon.appended },
        { name: 'group', value: vcon.group }
    ];
    
    const fieldsWithContent = exclusiveFields.filter(field => 
        field.value !== undefined && hasValidContent(field.value)
    );
    const fieldsWithEmptyContent = exclusiveFields.filter(field => 
        field.value !== undefined && !hasValidContent(field.value)
    );
    
    if (fieldsWithContent.length > 1) {
        const fieldNames = fieldsWithContent.map(f => f.name).join(', ');
        integrityIssues.push(`Mutually exclusive fields with values: ${fieldNames}`);
        errors.push(`${fieldNames} parameters are mutually exclusive and cannot all have values`);
    } else if (fieldsWithEmptyContent.length > 1) {
        const fieldNames = fieldsWithEmptyContent.map(f => f.name).join(', ');
        integrityIssues.push(`Multiple empty mutually exclusive fields: ${fieldNames}`);
        warnings.push(`${fieldNames} parameters are present but empty - these are mutually exclusive fields`);
    }
    
    // Validate optional date fields
    if (vcon.updated_at && !isValidRFC3339Date(vcon.updated_at)) {
        integrityIssues.push('updated_at must be RFC3339 date format');
        errors.push('updated_at must be in RFC3339 date format');
    }
    
    // Validate extensions and must_support arrays
    if (vcon.extensions && !Array.isArray(vcon.extensions)) {
        integrityIssues.push('extensions must be an array');
        errors.push('extensions must be an array of strings');
    }
    
    if (vcon.must_support && !Array.isArray(vcon.must_support)) {
        integrityIssues.push('must_support must be an array');
        errors.push('must_support must be an array of strings');
    }
    
    // Validate dialog array if present
    if (vcon.dialog) {
        if (!Array.isArray(vcon.dialog)) {
            integrityIssues.push('dialog must be an array');
            errors.push('dialog must be an array');
        } else {
            vcon.dialog.forEach((dialog, index) => {
                const dialogErrors = validateDialogObject(dialog, index, vcon.parties ? vcon.parties.length : 0);
                integrityIssues.push(...dialogErrors.errors);
                errors.push(...dialogErrors.errors);
                warnings.push(...dialogErrors.warnings);
            });
        }
    }
    
    // Validate analysis array if present
    if (vcon.analysis) {
        if (!Array.isArray(vcon.analysis)) {
            integrityIssues.push('analysis must be an array');
            errors.push('analysis must be an array');
        } else {
            vcon.analysis.forEach((analysis, index) => {
                const analysisErrors = validateAnalysisObject(analysis, index);
                integrityIssues.push(...analysisErrors.errors);
                errors.push(...analysisErrors.errors);
                warnings.push(...analysisErrors.warnings);
            });
        }
    }
    
    // Validate attachments array if present
    if (vcon.attachments) {
        if (!Array.isArray(vcon.attachments)) {
            integrityIssues.push('attachments must be an array');
            errors.push('attachments must be an array');
        } else {
            vcon.attachments.forEach((attachment, index) => {
                const attachmentErrors = validateAttachmentObject(attachment, index);
                integrityIssues.push(...attachmentErrors.errors);
                errors.push(...attachmentErrors.errors);
                warnings.push(...attachmentErrors.warnings);
            });
        }
    }
    
    if (integrityIssues.length === 0) {
        results.integrity = { status: 'good', message: 'Data structure integrity validated' };
    } else if (errors.length > integrityIssues.length / 2) {
        results.integrity = { status: 'fail', message: integrityIssues[0] };
    } else {
        results.integrity = { status: 'warning', message: integrityIssues[0] };
    }
    
    // 4. Security validation
    if (vcon.signatures || vcon.payload) {
        results.security = { status: 'pending', message: 'Signed/encrypted vCon validation not yet implemented' };
    } else {
        results.security = { status: 'good', message: 'Unsigned vCon - no security validation required' };
    }
    
    // Determine overall status
    results.overallStatus = errors.length > 0 ? 'fail' : (warnings.length > 0 ? 'warning' : 'good');
    results.errors = errors;
    results.warnings = warnings;
    
    return results;
}

/**
 * Validate Party object according to spec
 * @param {object} party - Party object to validate
 * @param {number} index - Index in parties array
 * @returns {object} Object with errors and warnings arrays
 */
function validatePartyObject(party, index) {
    const errors = [];
    const warnings = [];
    
    // At least one identifier should be present
    const identifiers = ['tel', 'sip', 'mailto', 'name', 'did', 'uuid'];
    const hasIdentifier = identifiers.some(id => party[id]);
    
    if (!hasIdentifier) {
        warnings.push(`Party ${index} has no identifying information`);
    }
    
    // Validate tel URL if present
    if (party.tel && !isValidTelURL(party.tel)) {
        warnings.push(`Party ${index}: Invalid tel URL format`);
    }
    
    // Validate mailto if present
    if (party.mailto && !isValidEmail(party.mailto)) {
        warnings.push(`Party ${index}: Invalid email format`);
    }
    
    // If name is provided, validation should also be provided
    if (party.name && !party.validation) {
        warnings.push(`Party ${index}: validation SHOULD be provided when name is present`);
    }
    
    // Validate UUID if present
    if (party.uuid && !isValidUUID(party.uuid)) {
        errors.push(`Party ${index}: Invalid UUID format`);
    }
    
    // Validate gmlpos format if present
    if (party.gmlpos && !isValidGMLPos(party.gmlpos)) {
        warnings.push(`Party ${index}: Invalid gmlpos format (should be "latitude longitude")`);
    }
    
    return { errors, warnings };
}

/**
 * Validate Dialog object according to spec
 * @param {object} dialog - Dialog object to validate
 * @param {number} index - Index in dialog array
 * @param {number} partiesCount - Number of parties in vCon
 * @returns {object} Object with errors and warnings arrays
 */
function validateDialogObject(dialog, index, partiesCount) {
    const errors = [];
    const warnings = [];
    
    // Type is required
    const validTypes = ['recording', 'text', 'transfer', 'incomplete'];
    if (!dialog.type) {
        errors.push(`Dialog ${index}: Missing required 'type' field`);
    } else if (!validTypes.includes(dialog.type)) {
        errors.push(`Dialog ${index}: Invalid type '${dialog.type}' (must be one of: ${validTypes.join(', ')})`);
    }
    
    // Start date validation
    if (!dialog.start) {
        errors.push(`Dialog ${index}: Missing required 'start' field`);
    } else if (!isValidRFC3339Date(dialog.start)) {
        errors.push(`Dialog ${index}: 'start' must be RFC3339 date format`);
    }
    
    // Parties validation
    if (!dialog.parties) {
        errors.push(`Dialog ${index}: Missing required 'parties' field`);
    } else if (!Array.isArray(dialog.parties)) {
        errors.push(`Dialog ${index}: 'parties' must be an array`);
    } else if (dialog.parties.length === 0) {
        warnings.push(`Dialog ${index}: 'parties' array should not be empty`);
    } else {
        // Validate party indices
        dialog.parties.forEach((partyIndex, i) => {
            if (typeof partyIndex !== 'number' || partyIndex < 0) {
                errors.push(`Dialog ${index}: Invalid party index at position ${i}`);
            } else if (partyIndex >= partiesCount) {
                errors.push(`Dialog ${index}: Party index ${partyIndex} exceeds parties array length`);
            }
        });
    }
    
    // Duration validation if present
    if (dialog.duration !== undefined && (typeof dialog.duration !== 'number' || dialog.duration < 0)) {
        errors.push(`Dialog ${index}: 'duration' must be a positive number`);
    }
    
    // Validate content for non-incomplete/transfer types
    if (dialog.type && !['incomplete', 'transfer'].includes(dialog.type)) {
        const hasContent = (dialog.body && dialog.encoding) || (dialog.url && dialog.content_hash);
        if (!hasContent) {
            warnings.push(`Dialog ${index}: Should contain either inline (body/encoding) or external (url/content_hash) content`);
        }
    }
    
    // Validate disposition for incomplete type
    if (dialog.type === 'incomplete') {
        const validDispositions = ['no-answer', 'congestion', 'failed', 'busy', 'hung-up', 'voicemail-no-message'];
        if (!dialog.disposition) {
            errors.push(`Dialog ${index}: 'disposition' is required for incomplete type`);
        } else if (!validDispositions.includes(dialog.disposition)) {
            errors.push(`Dialog ${index}: Invalid disposition '${dialog.disposition}'`);
        }
    }
    
    // Validate mediatype if present
    if (dialog.mediatype && !isStandardMediaType(dialog.mediatype)) {
        warnings.push(`Dialog ${index}: Non-standard media type '${dialog.mediatype}'`);
    }
    
    return { errors, warnings };
}

/**
 * Validate Analysis object according to spec
 * @param {object} analysis - Analysis object to validate
 * @param {number} index - Index in analysis array
 * @returns {object} Object with errors and warnings arrays  
 */
function validateAnalysisObject(analysis, index) {
    const errors = [];
    const warnings = [];
    
    // Type is required
    if (!analysis.type) {
        errors.push(`Analysis ${index}: Missing required 'type' field`);
    }
    
    // Dialog reference validation
    if (analysis.dialog !== undefined) {
        if (!Array.isArray(analysis.dialog)) {
            errors.push(`Analysis ${index}: 'dialog' must be an array`);
        } else {
            analysis.dialog.forEach((dialogIndex, i) => {
                if (typeof dialogIndex !== 'number' || dialogIndex < 0) {
                    errors.push(`Analysis ${index}: Invalid dialog index at position ${i}`);
                }
            });
        }
    }
    
    // Validate content
    const hasContent = (analysis.body && analysis.encoding) || (analysis.url && analysis.content_hash);
    if (!hasContent) {
        warnings.push(`Analysis ${index}: Should contain either inline (body/encoding) or external (url/content_hash) content`);
    }
    
    // Validate mediatype if present
    if (analysis.mediatype && !isStandardMediaType(analysis.mediatype)) {
        warnings.push(`Analysis ${index}: Non-standard media type '${analysis.mediatype}'`);
    }
    
    return { errors, warnings };
}

/**
 * Validate Attachment object according to spec
 * @param {object} attachment - Attachment object to validate
 * @param {number} index - Index in attachments array
 * @returns {object} Object with errors and warnings arrays
 */
function validateAttachmentObject(attachment, index) {
    const errors = [];
    const warnings = [];
    
    // Type or purpose should be present
    if (!attachment.type && !attachment.purpose) {
        warnings.push(`Attachment ${index}: Should have 'type' or 'purpose' field`);
    }
    
    // Start date validation if present
    if (attachment.start && !isValidRFC3339Date(attachment.start)) {
        errors.push(`Attachment ${index}: 'start' must be RFC3339 date format`);
    }
    
    // Party reference validation
    if (attachment.party !== undefined && (typeof attachment.party !== 'number' || attachment.party < 0)) {
        errors.push(`Attachment ${index}: Invalid party index`);
    }
    
    // Dialog reference validation
    if (attachment.dialog !== undefined && (typeof attachment.dialog !== 'number' || attachment.dialog < 0)) {
        errors.push(`Attachment ${index}: Invalid dialog index`);
    }
    
    // Validate content
    const hasContent = (attachment.body && attachment.encoding) || (attachment.url && attachment.content_hash);
    if (!hasContent) {
        warnings.push(`Attachment ${index}: Should contain either inline (body/encoding) or external (url/content_hash) content`);
    }
    
    // Validate mediatype if present
    if (attachment.mediatype && !isStandardMediaType(attachment.mediatype)) {
        warnings.push(`Attachment ${index}: Non-standard media type '${attachment.mediatype}'`);
    }
    
    return { errors, warnings };
}

/**
 * Check version-specific field compatibility issues
 * @param {object} vcon - vCon object to check
 * @param {string} version - vCon version
 * @returns {object} Object with errors and warnings arrays
 */
function checkVersionSpecificFields(vcon, version) {
    const errors = [];
    const warnings = [];
    
    // Check for deprecated fields based on version changes
    function checkObjectForVersionFields(obj, path = '') {
        if (!obj || typeof obj !== 'object') return;
        
        // Check for v0.0.1 -> v0.0.2 field changes
        if (version >= '0.0.2') {
            if (obj.mimetype) {
                warnings.push(`${path}mimetype deprecated in v0.0.2, use mediatype instead`);
            }
            if (obj.alg && obj.signature && !obj.content_hash) {
                warnings.push(`${path}alg/signature deprecated in v0.0.2, use content_hash instead`);
            }
        }
        
        // Check for v0.0.2 -> v0.3.0 field changes  
        if (version >= '0.3.0') {
            if (obj['transfer-target']) {
                warnings.push(`${path}transfer-target deprecated in v0.3.0, use transfer_target instead`);
            }
            if (obj['target-dialog']) {
                warnings.push(`${path}target-dialog deprecated in v0.3.0, use target_dialog instead`);
            }
        }
        
        // Check for fields that shouldn't exist in older versions
        if (version < '0.0.2') {
            if (obj.mediatype) {
                warnings.push(`${path}mediatype not available in v${version}, use mimetype instead`);
            }
            if (obj.content_hash) {
                warnings.push(`${path}content_hash not available in v${version}, use alg/signature instead`);
            }
        }
        
        if (version < '0.3.0') {
            if (obj.transfer_target) {
                warnings.push(`${path}transfer_target not available in v${version}, use transfer-target instead`);
            }
            if (obj.target_dialog) {
                warnings.push(`${path}target_dialog not available in v${version}, use target-dialog instead`);
            }
        }
        
        // Recursively check arrays and nested objects
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    checkObjectForVersionFields(item, `${path}${key}[${index}].`);
                });
            } else if (typeof value === 'object' && value !== null) {
                checkObjectForVersionFields(value, `${path}${key}.`);
            }
        });
    }
    
    // Check the entire vCon object
    checkObjectForVersionFields(vcon);
    
    return { errors, warnings };
}

/**
 * Check if media type is a standard type
 * @param {string} mediaType - Media type to check
 * @returns {boolean} True if standard type
 */
function isStandardMediaType(mediaType) {
    // Common vCon media types from the spec
    const standardTypes = [
        'text/plain',
        'audio/x-wav',
        'audio/x-mp3', 
        'audio/x-mp4',
        'audio/ogg',
        'video/x-mp4',
        'video/ogg',
        'multipart/mixed',
        'application/json',
        'application/pdf'
    ];
    
    return standardTypes.includes(mediaType);
}

/**
 * Validate media type format
 * @param {string} mediaType - Media type to validate
 * @returns {boolean} True if valid format
 */
function isValidMediaType(mediaType) {
    // Check if it has valid format (type/subtype)
    return /^[a-z]+\/[a-z0-9.\-+]+$/i.test(mediaType);
}

// Export functions for use by other modules
window.Validator = {
    parseVcon,
    performDetailedValidation,
    validatePartyObject,
    validateDialogObject,
    validateAnalysisObject,
    validateAttachmentObject,
    checkVersionSpecificFields,
    isStandardMediaType,
    isValidMediaType
};