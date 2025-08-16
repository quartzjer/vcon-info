// vCon Processor Module
// Handles validation, parsing, and extraction of vCon data according to draft-ietf-vcon-vcon-core-00

class VConProcessor {
    constructor() {
        // vCon version support aligned with draft-ietf-vcon-vcon-core-00
        this.supportedVersions = ['0.0.1', '0.0.2', '0.3.0'];
        
        // Required fields as per spec
        this.requiredFields = ['vcon', 'uuid', 'created_at', 'parties'];
        
        // Optional but commonly used fields
        this.optionalFields = [
            'updated_at', 'subject', 'redacted', 'appended', 'group',
            'dialog', 'analysis', 'attachments', 'must_support'
        ];
        
        // Initialize JWS/JWE support
        this.cryptoSupport = {
            available: typeof Jose !== 'undefined',
            algorithms: {
                signature: ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'HS256', 'HS384', 'HS512'],
                encryption: ['RSA-OAEP', 'RSA-OAEP-256', 'A128KW', 'A256KW', 'dir']
            }
        };
        
        // Initialize crypto API support for hash verification
        this.hashSupport = {
            available: typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined',
            algorithms: ['SHA-256', 'SHA-384', 'SHA-512']
        };
    }
    
    // Main processing function
    async process(vconData) {
        const result = {
            isValid: false,
            validation: {},
            metadata: {},
            parties: [],
            dialog: [],
            attachments: [],
            analysis: [],
            extensions: {},
            timeline: [],
            errors: [],
            warnings: [],
            crypto: {
                isEncrypted: false,
                isSigned: false,
                canDecrypt: false,
                canVerify: false,
                jwsHeader: null,
                jweHeader: null,
                externalFiles: [],
                hashVerification: {}
            }
        };
        
        try {
            // Check if input is JWS/JWE format
            const cryptoResult = this.detectCryptoFormat(vconData);
            result.crypto = { ...result.crypto, ...cryptoResult };
            
            // Parse if string - handle both regular JSON and JWS/JWE formats
            let vcon;
            if (result.crypto.isEncrypted) {
                // Try to decrypt if private key is available
                const privateKeyInput = document.getElementById('private-key');
                if (privateKeyInput && privateKeyInput.value.trim()) {
                    try {
                        const decryptResult = await this.decryptJWE(vconData, privateKeyInput.value.trim());
                        if (decryptResult.decrypted) {
                            result.crypto.decrypted = true;
                            result.crypto.decryptionHeaders = decryptResult.headers;
                            
                            // Process the decrypted content (might be signed)
                            const decryptedResult = await this.processVCon(decryptResult.plaintext);
                            // Merge crypto info with decrypted result
                            decryptedResult.crypto = { ...result.crypto, ...decryptedResult.crypto };
                            return decryptedResult;
                        } else {
                            result.crypto.decryptionError = decryptResult.error;
                        }
                    } catch (decryptError) {
                        result.crypto.decryptionError = decryptError.message;
                    }
                }
                
                // If decryption failed or no key provided, show JWE metadata only
                vcon = {
                    vcon: "1.0",
                    uuid: result.crypto.jweHeader?.uuid || "unknown",
                    created_at: new Date().toISOString(),
                    parties: [],
                    dialog: [],
                    attachments: [],
                    analysis: []
                };
                result.metadata.encrypted = true;
                
            } else if (result.crypto.isSigned) {
                // Extract payload for signed vCons
                vcon = this.extractPayloadForDisplay(vconData);
                if (!vcon) {
                    throw new Error('Unable to extract payload from signed vCon');
                }
            } else {
                vcon = typeof vconData === 'string' ? JSON.parse(vconData) : vconData;
            }
            
            // Validate structure
            result.validation = this.validate(vcon);
            result.isValid = result.validation.isValid;
            
            // Extract metadata
            result.metadata = this.extractMetadata(vcon);
            
            // Process parties
            result.parties = this.processParties(vcon.parties || []);
            
            // Process dialog
            result.dialog = this.processDialog(vcon.dialog || [], result.parties);
            
            // Process attachments
            result.attachments = this.processAttachments(vcon.attachments || [], result.parties);
            
            // Process analysis
            result.analysis = this.processAnalysis(vcon.analysis || [], result.dialog);
            
            // Extract extensions
            result.extensions = this.extractExtensions(vcon);
            
            // Generate timeline
            result.timeline = this.generateTimeline(vcon, result);
            
            // Collect errors and warnings
            result.errors = result.validation.errors || [];
            result.warnings = result.validation.warnings || [];
            
            // Collect external files for hash verification
            result.crypto.externalFiles = this.collectExternalFiles(vcon);
            
        } catch (error) {
            result.errors.push({
                type: 'parse_error',
                message: error.message
            });
        }
        
        return result;
    }
    
    // Validate vCon structure
    validate(vcon) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            details: {}
        };
        
        // Check vCon version
        if (!vcon.vcon) {
            validation.errors.push({
                field: 'vcon',
                message: 'Missing required vCon version field'
            });
            validation.isValid = false;
        } else {
            validation.details.version = {
                value: vcon.vcon,
                supported: this.supportedVersions.includes(vcon.vcon)
            };
            if (!validation.details.version.supported) {
                validation.warnings.push({
                    field: 'vcon',
                    message: `vCon version ${vcon.vcon} may not be fully supported`
                });
            }
        }
        
        // Check required fields
        for (const field of this.requiredFields) {
            if (!vcon.hasOwnProperty(field)) {
                validation.errors.push({
                    field: field,
                    message: `Missing required field: ${field}`
                });
                validation.isValid = false;
            }
        }
        
        // Validate UUID format (RFC 4122)
        if (vcon.uuid) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(vcon.uuid)) {
                validation.errors.push({
                    field: 'uuid',
                    message: 'Invalid UUID format (must be RFC 4122 compliant)'
                });
                validation.isValid = false;
            } else {
                // Extract and validate UUID version
                const version = parseInt(vcon.uuid.charAt(14), 16);
                validation.details.uuid = {
                    value: vcon.uuid,
                    version: version,
                    valid: true
                };
            }
        }
        
        // Validate timestamps
        if (vcon.created_at && !this.isValidDate(vcon.created_at)) {
            validation.errors.push({
                field: 'created_at',
                message: 'Invalid date format for created_at'
            });
            validation.isValid = false;
        }
        
        if (vcon.updated_at && !this.isValidDate(vcon.updated_at)) {
            validation.errors.push({
                field: 'updated_at',
                message: 'Invalid date format for updated_at'
            });
            validation.isValid = false;
        }
        
        // Validate parties array
        if (vcon.parties && !Array.isArray(vcon.parties)) {
            validation.errors.push({
                field: 'parties',
                message: 'Parties must be an array'
            });
            validation.isValid = false;
        } else if (vcon.parties && vcon.parties.length === 0) {
            validation.warnings.push({
                field: 'parties',
                message: 'Parties array is empty'
            });
        }
        
        // Validate dialog references to parties
        if (vcon.dialog && vcon.parties) {
            vcon.dialog.forEach((dialog, index) => {
                if (dialog.parties) {
                    const partyIndices = Array.isArray(dialog.parties) ? dialog.parties : [dialog.parties];
                    partyIndices.forEach(partyIndex => {
                        if (typeof partyIndex === 'number' && partyIndex >= vcon.parties.length) {
                            validation.errors.push({
                                field: `dialog[${index}].parties`,
                                message: `Invalid party index ${partyIndex} (only ${vcon.parties.length} parties defined)`
                            });
                            validation.isValid = false;
                        }
                    });
                }
                
                // Validate originator party index
                if (dialog.originator !== undefined && typeof dialog.originator === 'number' && dialog.originator >= vcon.parties.length) {
                    validation.errors.push({
                        field: `dialog[${index}].originator`,
                        message: `Invalid originator party index ${dialog.originator} (only ${vcon.parties.length} parties defined)`
                    });
                    validation.isValid = false;
                }
            });
        }
        
        // Validate attachment references to parties
        if (vcon.attachments && vcon.parties) {
            vcon.attachments.forEach((attachment, index) => {
                if (attachment.party !== undefined && typeof attachment.party === 'number' && attachment.party >= vcon.parties.length) {
                    validation.errors.push({
                        field: `attachments[${index}].party`,
                        message: `Invalid party index ${attachment.party} (only ${vcon.parties.length} parties defined)`
                    });
                    validation.isValid = false;
                }
            });
        }
        
        // Check for mutually exclusive fields
        const exclusiveFields = [
            { name: 'redacted', value: vcon.redacted },
            { name: 'appended', value: vcon.appended },
            { name: 'group', value: vcon.group }
        ];
        
        const fieldsWithContent = exclusiveFields.filter(field => 
            field.value !== undefined && this.hasValidContent(field.value)
        );
        const fieldsWithEmptyContent = exclusiveFields.filter(field => 
            field.value !== undefined && !this.hasValidContent(field.value)
        );
        
        if (fieldsWithContent.length > 1) {
            const fieldNames = fieldsWithContent.map(f => f.name).join(', ');
            validation.errors.push({
                field: 'vcon',
                message: `${fieldNames} parameters are mutually exclusive and cannot all have values`
            });
            validation.isValid = false;
        } else if (fieldsWithEmptyContent.length > 1) {
            const fieldNames = fieldsWithEmptyContent.map(f => f.name).join(', ');
            validation.warnings.push({
                field: 'vcon',
                message: `${fieldNames} parameters are present but empty - these are mutually exclusive fields`
            });
        }
        
        // Validate must_support if present
        if (vcon.must_support) {
            if (!Array.isArray(vcon.must_support)) {
                validation.errors.push({
                    field: 'must_support',
                    message: 'must_support must be an array of strings'
                });
                validation.isValid = false;
            } else {
                // Validate extension name format (should be strings, preferably URIs or identifiers)
                vcon.must_support.forEach((ext, index) => {
                    if (typeof ext !== 'string') {
                        validation.errors.push({
                            field: `must_support[${index}]`,
                            message: 'Extension names must be strings'
                        });
                        validation.isValid = false;
                    } else if (ext.trim().length === 0) {
                        validation.errors.push({
                            field: `must_support[${index}]`,
                            message: 'Extension names cannot be empty'
                        });
                        validation.isValid = false;
                    } else if (!/^[a-zA-Z0-9._-]+$/.test(ext) && !/^https?:\/\//.test(ext)) {
                        validation.warnings.push({
                            field: `must_support[${index}]`,
                            message: `Extension name "${ext}" should be a valid identifier or URI`
                        });
                    }
                });
            }
        }
        
        return validation;
    }
    
    // Extract metadata from vCon
    extractMetadata(vcon) {
        const metadata = {
            version: vcon.vcon || 'unknown',
            uuid: vcon.uuid || 'not specified',
            created: this.formatDate(vcon.created_at),
            updated: this.formatDate(vcon.updated_at),
            subject: vcon.subject || null,
            must_support: vcon.must_support || [],
            type: this.determineVConType(vcon)
        };
        
        // Add redaction info if present
        if (vcon.redacted) {
            metadata.redacted = {
                uuid: vcon.redacted.uuid,
                type: vcon.redacted.type,
                url: vcon.redacted.url
            };
        }
        
        // Add appended info if present
        if (vcon.appended) {
            metadata.appended = {
                uuid: vcon.appended.uuid,
                url: vcon.appended.url
            };
        }
        
        // Add group info if present
        if (vcon.group) {
            metadata.group = {
                count: vcon.group.length,
                uuids: vcon.group.map(g => g.uuid)
            };
        }
        
        return metadata;
    }
    
    // Process parties array
    processParties(parties) {
        return parties.map((party, index) => {
            const processed = {
                index: index,
                identifiers: [],
                name: party.name || null,
                validation: this.processValidation(party.validation),
                location: this.processLocation(party),
                timezone: party.timezone || null,
                jCard: party.jCard || null
            };
            
            // Collect identifiers
            if (party.tel) {
                processed.identifiers.push({
                    type: 'tel',
                    value: party.tel,
                    display: this.formatPhoneNumber(party.tel),
                    valid: this.validateTelURL(party.tel)
                });
            }
            
            if (party.sip) {
                processed.identifiers.push({
                    type: 'sip',
                    value: party.sip,
                    display: party.sip,
                    valid: this.validateSipURL(party.sip)
                });
            }
            
            if (party.mailto || party.email) {
                const email = party.mailto || party.email;
                processed.identifiers.push({
                    type: 'email',
                    value: email,
                    display: email.replace('mailto:', ''),
                    valid: this.validateEmailURL(email)
                });
            }
            
            if (party.did) {
                processed.identifiers.push({
                    type: 'did',
                    value: party.did,
                    display: party.did,
                    valid: this.validateDID(party.did)
                });
            }
            
            if (party.stir) {
                processed.identifiers.push({
                    type: 'stir',
                    value: party.stir,
                    display: 'PASSporT Token',
                    valid: this.validateSTIR(party.stir)
                });
            }
            
            if (party.uuid) {
                processed.identifiers.push({
                    type: 'uuid',
                    value: party.uuid,
                    display: party.uuid,
                    valid: this.validateUUID(party.uuid)
                });
            }
            
            return processed;
        });
    }
    
    // Process dialog array
    processDialog(dialogs, parties) {
        return dialogs.map((dialog, index) => {
            const processed = {
                index: index,
                type: dialog.type || 'unknown',
                start: this.formatDate(dialog.start),
                duration: dialog.duration || null,
                parties: this.resolveParties(dialog.parties, parties),
                originator: dialog.originator !== undefined ? 
                    parties[dialog.originator] : null,
                disposition: this.processDisposition(dialog.disposition, dialog.type),
                mediatype: dialog.mediatype || dialog.mimetype || null,
                filename: dialog.filename || null,
                content: null,
                transfer: null,
                session_id: this.processSessionId(dialog.session_id),
                party_history: this.processPartyHistory(dialog.party_history || []),
                application: this.processApplication(dialog.application),
                message_id: this.processMessageId(dialog.message_id),
                validation: this.validateDialog(dialog)
            };
            
            // Handle different dialog types
            if (dialog.type === 'recording' || dialog.type === 'text') {
                processed.content = {
                    hasBody: !!dialog.body,
                    hasUrl: !!dialog.url,
                    encoding: dialog.encoding || null,
                    contentHash: dialog.content_hash || null,
                    valid: this.validateDialogContent(dialog)
                };
            } else if (dialog.type === 'transfer') {
                processed.transfer = {
                    transferee: dialog.transferee,
                    transferor: dialog.transferor,
                    transfer_target: dialog.transfer_target,
                    original: dialog.original,
                    consultation: dialog.consultation,
                    target_dialog: dialog.target_dialog,
                    valid: this.validateTransferDialog(dialog)
                };
            } else if (dialog.type === 'incomplete') {
                processed.incomplete = {
                    hasDisposition: !!dialog.disposition,
                    reason: dialog.disposition || 'not specified',
                    valid: this.validateIncompleteDialog(dialog)
                };
            }
            
            // Calculate end time if duration is provided
            if (dialog.start && dialog.duration) {
                const startTime = new Date(dialog.start);
                const endTime = new Date(startTime.getTime() + (dialog.duration * 1000));
                processed.end = this.formatDate(endTime.toISOString());
            } else if (dialog.end) {
                processed.end = this.formatDate(dialog.end);
            }
            
            return processed;
        });
    }
    
    // Process attachments array
    processAttachments(attachments, parties) {
        return attachments.map((attachment, index) => ({
            index: index,
            type: attachment.type || 'document',
            start: this.formatDate(attachment.start),
            party: attachment.party !== undefined ? 
                parties[attachment.party] : null,
            dialog: attachment.dialog,
            mediatype: attachment.mediatype || attachment.mimetype || 'application/octet-stream',
            filename: attachment.filename || 'attachment',
            content: {
                hasBody: !!attachment.body,
                hasUrl: !!attachment.url,
                encoding: attachment.encoding || null,
                contentHash: attachment.content_hash || null
            }
        }));
    }
    
    // Process analysis array
    processAnalysis(analyses, dialogs) {
        return analyses.map((analysis, index) => ({
            index: index,
            type: analysis.type || 'unknown',
            dialog: Array.isArray(analysis.dialog) ? 
                analysis.dialog : (analysis.dialog !== undefined ? [analysis.dialog] : []),
            mediatype: analysis.mediatype || 'application/json',
            filename: analysis.filename || null,
            vendor: analysis.vendor || null,
            product: analysis.product || null,
            schema: analysis.schema || null,
            content: {
                hasBody: !!analysis.body,
                hasUrl: !!analysis.url,
                encoding: analysis.encoding || null,
                contentHash: analysis.content_hash || null
            }
        }));
    }
    
    // Extract extensions (non-standard fields)
    extractExtensions(vcon) {
        const standardFields = [
            'vcon', 'uuid', 'created_at', 'updated_at', 'subject',
            'redacted', 'appended', 'group', 'parties', 'dialog',
            'analysis', 'attachments', 'must_support'
        ];
        
        const extensions = {};
        for (const key in vcon) {
            if (!standardFields.includes(key)) {
                extensions[key] = vcon[key];
            }
        }
        
        return extensions;
    }
    
    // Generate timeline from vCon data
    generateTimeline(vcon, processedData) {
        const events = [];
        
        // Add creation event
        if (vcon.created_at) {
            events.push({
                time: new Date(vcon.created_at),
                type: 'system',
                description: 'vCon created',
                details: { uuid: vcon.uuid }
            });
        }
        
        // Add dialog events
        processedData.dialog.forEach((dialog, index) => {
            if (dialog.start) {
                events.push({
                    time: new Date(dialog.start),
                    type: 'dialog_start',
                    description: `${dialog.type} started`,
                    details: {
                        index: index,
                        parties: dialog.parties,
                        type: dialog.type
                    }
                });
            }
            
            if (dialog.end) {
                events.push({
                    time: new Date(dialog.end),
                    type: 'dialog_end',
                    description: `${dialog.type} ended`,
                    details: {
                        index: index,
                        duration: dialog.duration
                    }
                });
            }
            
            // Add party history events
            if (dialog.party_history) {
                dialog.party_history.forEach(event => {
                    events.push({
                        time: new Date(event.time),
                        type: `party_${event.event}`,
                        description: `Party ${event.party} ${event.event}`,
                        details: event
                    });
                });
            }
        });
        
        // Add attachment events
        processedData.attachments.forEach((attachment, index) => {
            if (attachment.start) {
                events.push({
                    time: new Date(attachment.start),
                    type: 'attachment',
                    description: `${attachment.type} attached`,
                    details: {
                        index: index,
                        filename: attachment.filename,
                        mediatype: attachment.mediatype
                    }
                });
            }
        });
        
        // Add update event
        if (vcon.updated_at && vcon.updated_at !== vcon.created_at) {
            events.push({
                time: new Date(vcon.updated_at),
                type: 'system',
                description: 'vCon updated',
                details: {}
            });
        }
        
        // Sort events by time
        events.sort((a, b) => a.time - b.time);
        
        return events;
    }
    
    // Helper functions
    
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }
    
    formatDate(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString);
        if (!this.isValidDate(dateString)) return dateString;
        
        return {
            iso: dateString,
            display: date.toLocaleString(),
            timestamp: date.getTime()
        };
    }
    
    formatPhoneNumber(tel) {
        // Remove tel: prefix if present
        let number = tel.replace(/^tel:/, '');
        // Basic formatting for display
        if (number.match(/^\+1\d{10}$/)) {
            return number.replace(/^\+1(\d{3})(\d{3})(\d{4})$/, '+1 ($1) $2-$3');
        }
        return number;
    }
    
    resolveParties(partyIndices, processedParties) {
        if (!partyIndices) return [];
        
        const indices = Array.isArray(partyIndices) ? partyIndices : [partyIndices];
        return indices.map(index => {
            if (typeof index === 'number' && processedParties[index]) {
                return processedParties[index];
            }
            return { index: index, error: 'Invalid party reference' };
        });
    }
    
    determineVConType(vcon) {
        if (vcon.redacted) return 'redacted';
        if (vcon.appended) return 'appended';
        if (vcon.group) return 'group';
        return 'standard';
    }
    
    // Helper function to check if a value has meaningful content (not empty)
    hasValidContent(value) {
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
    
    // Enhanced party processing helper functions
    
    processValidation(validation) {
        if (!validation) return null;
        
        return {
            raw: validation,
            type: this.determineValidationType(validation),
            display: this.formatValidationDisplay(validation)
        };
    }
    
    determineValidationType(validation) {
        if (!validation || validation === 'none') return 'none';
        
        // Common validation types based on spec guidance
        const commonTypes = {
            'ssn': 'government_id',
            'social security': 'government_id', 
            'dob': 'personal_info',
            'date of birth': 'personal_info',
            'user id': 'credential',
            'password': 'credential',
            'username': 'credential',
            'pin': 'credential',
            'id card': 'document',
            'passport': 'document',
            'driver license': 'document'
        };
        
        const lowerVal = validation.toLowerCase();
        for (const [key, type] of Object.entries(commonTypes)) {
            if (lowerVal.includes(key)) return type;
        }
        
        return 'custom';
    }
    
    formatValidationDisplay(validation) {
        if (!validation || validation === 'none') return 'None';
        
        // Capitalize and format common validation methods
        return validation.charAt(0).toUpperCase() + validation.slice(1);
    }
    
    processLocation(party) {
        if (!party.gmlpos && !party.civicaddress) return null;
        
        const location = {};
        
        if (party.gmlpos) {
            location.gmlpos = {
                raw: party.gmlpos,
                coordinates: this.parseGMLPos(party.gmlpos),
                display: this.formatGMLPosDisplay(party.gmlpos)
            };
        }
        
        if (party.civicaddress) {
            location.civic = {
                raw: party.civicaddress,
                display: this.formatCivicAddressDisplay(party.civicaddress)
            };
        }
        
        return location;
    }
    
    parseGMLPos(gmlpos) {
        if (!gmlpos) return null;
        
        // GML pos format: "latitude longitude" (space-separated)
        const coords = gmlpos.trim().split(/\s+/);
        if (coords.length >= 2) {
            const lat = parseFloat(coords[0]);
            const lng = parseFloat(coords[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
                return { latitude: lat, longitude: lng };
            }
        }
        return null;
    }
    
    formatGMLPosDisplay(gmlpos) {
        const coords = this.parseGMLPos(gmlpos);
        if (coords) {
            return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
        }
        return gmlpos;
    }
    
    formatCivicAddressDisplay(civicaddress) {
        if (typeof civicaddress === 'string') return civicaddress;
        if (typeof civicaddress === 'object' && civicaddress !== null) {
            // Format common civic address fields
            const parts = [];
            if (civicaddress.street) parts.push(civicaddress.street);
            if (civicaddress.city) parts.push(civicaddress.city);
            if (civicaddress.state) parts.push(civicaddress.state);
            if (civicaddress.postal) parts.push(civicaddress.postal);
            if (civicaddress.country) parts.push(civicaddress.country);
            return parts.length > 0 ? parts.join(', ') : 'Civic Address';
        }
        return 'Civic Address';
    }
    
    // Identifier validation functions
    
    validateTelURL(tel) {
        if (!tel) return false;
        
        // Remove tel: prefix for validation
        const number = tel.replace(/^tel:/, '');
        
        // Basic E.164 format check: + followed by up to 15 digits
        return /^\+[1-9]\d{1,14}$/.test(number) || /^\d{10,15}$/.test(number);
    }
    
    validateSipURL(sip) {
        if (!sip) return false;
        
        // Basic SIP URL format: user@domain or sip:user@domain
        const sipPattern = /^(sip:)?[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return sipPattern.test(sip);
    }
    
    validateEmailURL(email) {
        if (!email) return false;
        
        // Remove mailto: prefix for validation
        const addr = email.replace(/^mailto:/, '');
        
        // Basic email validation
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailPattern.test(addr);
    }
    
    validateDID(did) {
        if (!did) return false;
        
        // Basic DID format: did:method:identifier
        const didPattern = /^did:[a-zA-Z0-9]+:[a-zA-Z0-9._-]+$/;
        return didPattern.test(did);
    }
    
    validateSTIR(stir) {
        if (!stir) return false;
        
        // Basic JWT format check (PASSporT is a JWT)
        // Format: header.payload.signature (base64url encoded)
        const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
        return jwtPattern.test(stir);
    }
    
    validateUUID(uuid) {
        if (!uuid) return false;
        
        // RFC 4122 UUID format (supports versions 1-8 for vCon compatibility)
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidPattern.test(uuid);
    }
    
    // Enhanced dialog processing helper functions
    
    processDisposition(disposition, dialogType) {
        if (!disposition) return null;
        
        return {
            raw: disposition,
            display: this.formatDispositionDisplay(disposition),
            required: dialogType === 'incomplete',
            valid: this.validateDisposition(disposition, dialogType)
        };
    }
    
    formatDispositionDisplay(disposition) {
        // Common disposition values per spec
        const dispositionMap = {
            'busy': 'Busy',
            'no-answer': 'No Answer', 
            'failed': 'Failed',
            'rejected': 'Rejected',
            'redirected': 'Redirected',
            'voicemail-no-message': 'Voicemail (No Message)'
        };
        
        return dispositionMap[disposition] || disposition;
    }
    
    validateDisposition(disposition, dialogType) {
        if (dialogType === 'incomplete' && !disposition) return false;
        if (dialogType !== 'incomplete' && disposition) return false;
        return true;
    }
    
    processSessionId(sessionId) {
        if (!sessionId) return null;
        
        return {
            raw: sessionId,
            display: sessionId,
            valid: this.validateSessionId(sessionId)
        };
    }
    
    validateSessionId(sessionId) {
        // Basic validation - session ID should be a non-empty string
        return typeof sessionId === 'string' && sessionId.trim().length > 0;
    }
    
    processPartyHistory(partyHistory) {
        if (!Array.isArray(partyHistory) || partyHistory.length === 0) return [];
        
        return partyHistory.map((event, index) => ({
            index: index,
            party: event.party,
            time: this.formatDate(event.time),
            event: event.event,
            display: this.formatPartyHistoryDisplay(event),
            valid: this.validatePartyHistoryEvent(event)
        }));
    }
    
    formatPartyHistoryDisplay(event) {
        const eventMap = {
            'join': 'Joined',
            'drop': 'Dropped',
            'hold': 'On Hold',
            'unhold': 'Off Hold', 
            'mute': 'Muted',
            'unmute': 'Unmuted'
        };
        
        const eventDisplay = eventMap[event.event] || event.event;
        return `Party ${event.party} ${eventDisplay}`;
    }
    
    validatePartyHistoryEvent(event) {
        const validEvents = ['join', 'drop', 'hold', 'unhold', 'mute', 'unmute'];
        
        if (typeof event.party !== 'number') return false;
        if (!event.time || !this.isValidDate(event.time)) return false;
        if (!validEvents.includes(event.event)) return false;
        
        return true;
    }
    
    processApplication(application) {
        if (!application) return null;
        
        return {
            raw: application,
            display: application,
            valid: this.validateApplication(application)
        };
    }
    
    validateApplication(application) {
        return typeof application === 'string' && application.trim().length > 0;
    }
    
    processMessageId(messageId) {
        if (!messageId) return null;
        
        return {
            raw: messageId,
            display: messageId,
            valid: this.validateMessageId(messageId)
        };
    }
    
    validateMessageId(messageId) {
        return typeof messageId === 'string' && messageId.trim().length > 0;
    }
    
    validateDialog(dialog) {
        const errors = [];
        const warnings = [];
        
        // Validate dialog type
        const validTypes = ['recording', 'text', 'transfer', 'incomplete'];
        if (!validTypes.includes(dialog.type)) {
            errors.push(`Invalid dialog type: ${dialog.type}`);
        }
        
        // Type-specific validation
        if (dialog.type === 'incomplete' && !dialog.disposition) {
            errors.push('Incomplete dialogs must have a disposition parameter');
        }
        
        if ((dialog.type === 'incomplete' || dialog.type === 'transfer') && (dialog.body || dialog.url)) {
            errors.push(`${dialog.type} dialogs must not have body or url content`);
        }
        
        if ((dialog.type === 'recording' || dialog.type === 'text') && !dialog.body && !dialog.url) {
            warnings.push(`${dialog.type} dialogs should have either body or url content`);
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }
    
    validateDialogContent(dialog) {
        const hasContent = !!(dialog.body || dialog.url);
        const hasHash = !!dialog.content_hash;
        
        return {
            hasContent: hasContent,
            hasHash: hasHash,
            valid: hasContent // Content is required for recording/text
        };
    }
    
    validateTransferDialog(dialog) {
        const requiredFields = ['transferee', 'transferor', 'transfer_target'];
        const missing = requiredFields.filter(field => dialog[field] === undefined);
        
        return {
            hasRequiredFields: missing.length === 0,
            missingFields: missing,
            valid: missing.length === 0
        };
    }
    
    validateIncompleteDialog(dialog) {
        const hasDisposition = !!dialog.disposition;
        const hasContent = !!(dialog.body || dialog.url);
        
        return {
            hasDisposition: hasDisposition,
            hasContent: hasContent,
            valid: hasDisposition && !hasContent
        };
    }
    
    // JWS/JWE Detection and Processing Methods
    
    detectCryptoFormat(input) {
        const result = {
            isEncrypted: false,
            isSigned: false,
            canDecrypt: false,
            canVerify: false,
            jwsHeader: null,
            jweHeader: null,
            format: 'json',
            signatures: [],
            compliance: {
                isVConCompliant: false,
                hasX5cOrX5u: false,
                hasUuid: false,
                isRS256: false,
                isGeneralJSONSerialization: false,
                errors: []
            }
        };
        
        if (typeof input !== 'string') {
            return result;
        }
        
        // Check for JWS format (3 parts separated by dots for compact serialization)
        const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
        
        // Check for JWE format (5 parts separated by dots for compact serialization)
        const jwePattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
        
        if (jwePattern.test(input.trim())) {
            result.isEncrypted = true;
            result.format = 'jwe-compact';
            result.jweHeader = this.extractJWEHeader(input);
            // vCon spec requires General JWE JSON Serialization, not compact
            result.compliance.errors.push('vCon spec requires General JWE JSON Serialization, not compact form');
        } else if (jwtPattern.test(input.trim())) {
            result.isSigned = true;
            result.format = 'jws-compact';
            result.jwsHeader = this.extractJWSHeader(input);
            // vCon spec requires General JWS JSON Serialization, not compact
            result.compliance.errors.push('vCon spec requires General JWS JSON Serialization, not compact form');
        } else {
            // Check for JSON serialization format
            try {
                const parsed = JSON.parse(input);
                if (parsed.signatures && Array.isArray(parsed.signatures)) {
                    result.isSigned = true;
                    result.format = 'jws-json';
                    result.compliance.isGeneralJSONSerialization = true;
                    
                    // Extract all signatures and headers for vCon compliance checking
                    result.signatures = parsed.signatures;
                    
                    // Check the first signature for compliance (multi-signature handling)
                    if (parsed.signatures.length > 0) {
                        const firstSig = parsed.signatures[0];
                        
                        // Extract protected header
                        if (firstSig.protected) {
                            result.jwsHeader = JSON.parse(this.base64urlDecode(firstSig.protected));
                        }
                        
                        // Extract unprotected header
                        let unprotectedHeader = firstSig.header || {};
                        
                        // Check compliance
                        result.compliance = this.checkVConJWSCompliance(result.jwsHeader, unprotectedHeader, parsed);
                    }
                } else if (parsed.recipients && Array.isArray(parsed.recipients) && parsed.iv && parsed.ciphertext && parsed.tag) {
                    result.isEncrypted = true;
                    result.format = 'jwe-json';
                    result.compliance.isGeneralJSONSerialization = true;
                    
                    // Extract comprehensive JWE metadata
                    result.jweData = {
                        recipients: parsed.recipients,
                        unprotected: parsed.unprotected || {},
                        protected: parsed.protected,
                        iv: parsed.iv,
                        ciphertext: parsed.ciphertext,
                        tag: parsed.tag,
                        recipientCount: parsed.recipients.length
                    };
                    
                    // Extract unprotected header for compatibility
                    if (parsed.unprotected) {
                        result.jweHeader = parsed.unprotected;
                    }
                    
                    // Extract protected header if present
                    if (parsed.protected) {
                        try {
                            result.jweProtectedHeader = JSON.parse(this.base64urlDecode(parsed.protected));
                        } catch (e) {
                            console.warn('Failed to decode JWE protected header:', e);
                        }
                    }
                    
                    // Check vCon JWE compliance
                    result.compliance = this.checkVConJWECompliance(result.jweHeader, result.jweProtectedHeader, parsed);
                } else if (parsed.protected && parsed.encrypted_key && parsed.iv && parsed.ciphertext && parsed.tag) {
                    result.isEncrypted = true;
                    result.format = 'jwe-json';
                    result.jweHeader = JSON.parse(this.base64urlDecode(parsed.protected));
                }
            } catch (e) {
                // Not JSON, continue
            }
        }
        
        return result;
    }
    
    checkVConJWSCompliance(protectedHeader, unprotectedHeader, fullJWS) {
        const compliance = {
            isVConCompliant: false,
            hasX5cOrX5u: false,
            hasUuid: false,
            isRS256: false,
            isGeneralJSONSerialization: true,
            errors: []
        };
        
        // Check algorithm (should be RS256 per spec)
        if (protectedHeader && protectedHeader.alg) {
            compliance.isRS256 = protectedHeader.alg === 'RS256';
            if (!compliance.isRS256) {
                compliance.errors.push(`Algorithm ${protectedHeader.alg} is not recommended. vCon spec recommends RS256`);
            }
        } else {
            compliance.errors.push('Missing algorithm (alg) in protected header');
        }
        
        // Check for x5c or x5u in unprotected header (per spec requirement)
        if (unprotectedHeader.x5c || unprotectedHeader.x5u) {
            compliance.hasX5cOrX5u = true;
        } else {
            compliance.errors.push('vCon spec requires x5c or x5u in unprotected header for certificate chain');
        }
        
        // Check for uuid parameter in header (should be present per spec)
        if (unprotectedHeader.uuid) {
            compliance.hasUuid = true;
        } else if (protectedHeader && protectedHeader.uuid) {
            compliance.hasUuid = true;
        } else {
            compliance.errors.push('vCon spec recommends uuid parameter in JWS header');
        }
        
        // Overall compliance check
        compliance.isVConCompliant = compliance.hasX5cOrX5u && compliance.isRS256 && compliance.errors.length === 0;
        
        return compliance;
    }
    
    extractJWSHeader(jwsToken) {
        try {
            const parts = jwsToken.split('.');
            if (parts.length !== 3) return null;
            
            const headerB64 = parts[0];
            const headerJson = this.base64urlDecode(headerB64);
            return JSON.parse(headerJson);
        } catch (e) {
            console.warn('Failed to extract JWS header:', e);
            return null;
        }
    }
    
    extractJWEHeader(jweToken) {
        try {
            const parts = jweToken.split('.');
            if (parts.length !== 5) return null;
            
            const headerB64 = parts[0];
            const headerJson = this.base64urlDecode(headerB64);
            return JSON.parse(headerJson);
        } catch (e) {
            console.warn('Failed to extract JWE header:', e);
            return null;
        }
    }
    
    extractPayloadForDisplay(input) {
        // For encrypted data, we can't extract payload without decryption
        // For signed data, we can extract the payload for display (but not verify without key)
        
        const cryptoInfo = this.detectCryptoFormat(input);
        
        if (cryptoInfo.isEncrypted) {
            // Cannot extract payload from encrypted data
            return null;
        } else if (cryptoInfo.isSigned && cryptoInfo.format === 'jws') {
            try {
                const parts = input.split('.');
                if (parts.length === 3) {
                    const payloadB64 = parts[1];
                    const payloadJson = this.base64urlDecode(payloadB64);
                    return JSON.parse(payloadJson);
                }
            } catch (e) {
                console.warn('Failed to extract JWS payload:', e);
                return null;
            }
        } else if (cryptoInfo.isSigned && cryptoInfo.format === 'jws-json') {
            try {
                const parsed = JSON.parse(input);
                if (parsed.payload) {
                    const payloadJson = this.base64urlDecode(parsed.payload);
                    return JSON.parse(payloadJson);
                }
            } catch (e) {
                console.warn('Failed to extract JWS JSON payload:', e);
                return null;
            }
        }
        
        return null;
    }
    
    checkVConJWECompliance(unprotectedHeader, protectedHeader, jweObject) {
        const compliance = {
            isGeneralJSONSerialization: true,
            errors: [],
            warnings: []
        };
        
        // Check for required vCon JWE fields per spec
        if (!unprotectedHeader) {
            compliance.errors.push('Missing unprotected header required for vCon JWE');
        } else {
            // Check for required uuid field
            if (!unprotectedHeader.uuid) {
                compliance.errors.push('Missing uuid in unprotected header required for vCon JWE');
            } else if (!this.isValidUUID(unprotectedHeader.uuid)) {
                compliance.errors.push('Invalid UUID format in unprotected header');
            }
            
            // Check for content type
            if (!unprotectedHeader.cty || unprotectedHeader.cty !== 'application/vcon+json') {
                compliance.warnings.push('Missing or incorrect content type (cty) in unprotected header');
            }
            
            // Check encryption algorithm
            if (!unprotectedHeader.enc) {
                compliance.errors.push('Missing enc parameter in unprotected header');
            } else if (!['A128CBC-HS256', 'A256CBC-HS512', 'A128GCM', 'A256GCM'].includes(unprotectedHeader.enc)) {
                compliance.warnings.push(`Encryption algorithm ${unprotectedHeader.enc} may not be optimal for vCon`);
            }
        }
        
        // Check recipients
        if (jweObject.recipients && jweObject.recipients.length > 0) {
            compliance.recipientCount = jweObject.recipients.length;
            
            // Validate each recipient
            jweObject.recipients.forEach((recipient, index) => {
                if (!recipient.header) {
                    compliance.warnings.push(`Recipient ${index} missing header`);
                } else {
                    if (!recipient.header.alg || !['RSA-OAEP', 'RSA-OAEP-256'].includes(recipient.header.alg)) {
                        compliance.warnings.push(`Recipient ${index} using non-recommended key encryption algorithm: ${recipient.header.alg}`);
                    }
                }
                
                if (!recipient.encrypted_key) {
                    compliance.errors.push(`Recipient ${index} missing encrypted_key`);
                }
            });
        } else {
            compliance.warnings.push('No recipients found - JWE cannot be decrypted');
        }
        
        // Check for required JWE parameters
        if (!jweObject.iv) {
            compliance.errors.push('Missing initialization vector (iv)');
        }
        
        if (!jweObject.ciphertext) {
            compliance.errors.push('Missing ciphertext');
        }
        
        if (!jweObject.tag) {
            compliance.errors.push('Missing authentication tag');
        }
        
        return compliance;
    }
    
    // Crypto Support Methods
    
    isCryptoSupported() {
        return this.cryptoSupport.available;
    }
    
    getSupportedAlgorithms() {
        if (!this.cryptoSupport.available) {
            return null;
        }
        
        return {
            signing: ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'ES512'],
            keyEncryption: ['RSA-OAEP', 'RSA-OAEP-256'],
            contentEncryption: ['A128CBC-HS256', 'A256CBC-HS512', 'A128GCM', 'A256GCM']
        };
    }
    
    // JWS/JWE Operations (requires keys)
    
    async verifyJWS(jwsToken, publicKey) {
        if (!this.cryptoSupport.available) {
            throw new Error('Jose library not available for JWS verification');
        }
        
        try {
            // Use jose library to verify the JWS
            const verifier = new Jose.JoseJWS.Verifier(Jose.WebCryptographer, publicKey);
            const result = await verifier.verify(jwsToken);
            return {
                verified: true,
                payload: result.payload,
                header: result.header
            };
        } catch (error) {
            return {
                verified: false,
                error: error.message
            };
        }
    }
    
    async decryptJWE(jweToken, privateKey) {
        if (!this.cryptoSupport.available) {
            throw new Error('Jose library not available for JWE decryption');
        }
        
        try {
            // Handle both JWK and PEM private keys
            let keyPromise;
            if (typeof privateKey === 'string') {
                // Parse PEM to JWK if needed
                if (privateKey.includes('-----BEGIN')) {
                    throw new Error('PEM key format not supported yet - please provide JWK format');
                }
                // Assume it's a JWK JSON string
                const jwkKey = JSON.parse(privateKey);
                keyPromise = Jose.Utils.importPrivateKey(jwkKey, 'RSA-OAEP');
            } else if (Jose.Utils.isCryptoKey(privateKey)) {
                keyPromise = Promise.resolve(privateKey);
            } else {
                // Assume it's already a JWK object
                keyPromise = Jose.Utils.importPrivateKey(privateKey, 'RSA-OAEP');
            }
            
            const importedKey = await keyPromise;
            const decrypter = new Jose.JoseJWE.Decrypter(Jose.WebCryptographer, importedKey);
            const plaintext = await decrypter.decrypt(jweToken);
            
            return {
                decrypted: true,
                plaintext: plaintext,
                headers: decrypter.getHeaders()
            };
        } catch (error) {
            return {
                decrypted: false,
                error: error.message
            };
        }
    }
    
    async signVCon(vconObject, privateKey, algorithm = 'RS256') {
        if (!this.cryptoSupport.available) {
            throw new Error('Jose library not available for JWS signing');
        }
        
        try {
            const signer = new Jose.JoseJWS.Signer(Jose.WebCryptographer);
            signer.addSigner(privateKey, null, { alg: algorithm });
            const jwsToken = await signer.sign(JSON.stringify(vconObject));
            return {
                success: true,
                jws: jwsToken
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async encryptVCon(vconObject, publicKey, algorithm = 'RSA-OAEP') {
        if (!this.cryptoSupport.available) {
            throw new Error('Jose library not available for JWE encryption');
        }
        
        try {
            const encrypter = new Jose.JoseJWE.Encrypter(Jose.WebCryptographer, publicKey);
            const jweToken = await encrypter.encrypt(JSON.stringify(vconObject));
            return {
                success: true,
                jwe: jweToken
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Utility function for base64url decoding
    base64urlDecode(str) {
        // Add padding if necessary
        let padded = str;
        const padding = 4 - (str.length % 4);
        if (padding !== 4) {
            padded += '='.repeat(padding);
        }
        
        // Replace URL-safe characters
        const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
        
        // Decode base64
        try {
            return atob(base64);
        } catch (e) {
            throw new Error('Invalid base64url string');
        }
    }
    
    // Check if crypto operations are supported
    isCryptoSupported() {
        return this.cryptoSupport.available && typeof Jose !== 'undefined';
    }
    
    // Get supported algorithms
    getSupportedAlgorithms() {
        return this.cryptoSupport.algorithms;
    }

    // Hash verification methods per IETF vCon specification
    
    /**
     * Parse content_hash value according to spec
     * Format: "algorithm-base64url_encoded_hash"
     * @param {string|string[]} contentHash - Single hash or array of hashes
     * @returns {Object[]} Array of parsed hash objects
     */
    parseContentHash(contentHash) {
        if (!contentHash) return [];
        
        const hashes = Array.isArray(contentHash) ? contentHash : [contentHash];
        return hashes.map(hash => {
            const dashIndex = hash.indexOf('-');
            if (dashIndex <= 0) {
                throw new Error(`Invalid content_hash format: ${hash}`);
            }
            
            const algorithm = hash.substring(0, dashIndex);
            const hashValue = hash.substring(dashIndex + 1);
            
            // Validate algorithm (spec requires lowercase, no hyphens)
            if (!/^[a-z0-9]+$/.test(algorithm)) {
                throw new Error(`Invalid hash algorithm format: ${algorithm}`);
            }
            
            // Convert algorithm name to Web Crypto API format
            let cryptoAlgorithm;
            switch (algorithm.toLowerCase()) {
                case 'sha256':
                    cryptoAlgorithm = 'SHA-256';
                    break;
                case 'sha384':
                    cryptoAlgorithm = 'SHA-384';
                    break;
                case 'sha512':
                    cryptoAlgorithm = 'SHA-512';
                    break;
                default:
                    throw new Error(`Unsupported hash algorithm: ${algorithm}`);
            }
            
            return {
                algorithm,
                cryptoAlgorithm,
                hashValue,
                originalString: hash
            };
        });
    }

    /**
     * Calculate content hash of data
     * @param {ArrayBuffer|Uint8Array|string} data - Data to hash
     * @param {string} algorithm - Hash algorithm ('SHA-256', 'SHA-384', 'SHA-512')
     * @returns {Promise<string>} Base64url encoded hash
     */
    async calculateContentHash(data, algorithm = 'SHA-512') {
        if (!this.hashSupport.available) {
            throw new Error('Web Crypto API not available for hash calculation');
        }
        
        // Convert string to ArrayBuffer if needed
        let buffer;
        if (typeof data === 'string') {
            buffer = new TextEncoder().encode(data);
        } else if (data instanceof ArrayBuffer) {
            buffer = data;
        } else if (data instanceof Uint8Array) {
            buffer = data.buffer;
        } else {
            throw new Error('Invalid data type for hashing');
        }
        
        const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
        return this.base64urlEncode(new Uint8Array(hashBuffer));
    }

    /**
     * Verify content hash against data
     * @param {string} contentHash - Content hash string (algorithm-hash format)
     * @param {ArrayBuffer|Uint8Array|string} data - Data to verify
     * @returns {Promise<Object>} Verification result
     */
    async verifyContentHash(contentHash, data) {
        try {
            const parsed = this.parseContentHash(contentHash)[0]; // Take first hash if multiple
            const calculatedHash = await this.calculateContentHash(data, parsed.cryptoAlgorithm);
            
            const isValid = calculatedHash === parsed.hashValue;
            
            return {
                valid: isValid,
                algorithm: parsed.algorithm,
                expected: parsed.hashValue,
                actual: calculatedHash,
                error: null
            };
        } catch (error) {
            return {
                valid: false,
                algorithm: null,
                expected: null,
                actual: null,
                error: error.message
            };
        }
    }

    /**
     * Fetch external content and verify its hash
     * @param {string} url - URL to fetch
     * @param {string|string[]} contentHash - Expected content hash(es)
     * @returns {Promise<Object>} Fetch and verification result
     */
    async fetchAndVerifyContent(url, contentHash) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.arrayBuffer();
            const hashes = this.parseContentHash(contentHash);
            
            // Verify against all provided hashes
            const verifications = await Promise.all(
                hashes.map(hash => this.verifyContentHash(hash.originalString, data))
            );
            
            const allValid = verifications.every(v => v.valid);
            const firstError = verifications.find(v => v.error);
            
            return {
                success: response.ok,
                status: response.status,
                contentType: response.headers.get('content-type'),
                size: data.byteLength,
                hashVerification: {
                    valid: allValid,
                    results: verifications,
                    error: firstError?.error || null
                },
                data: allValid ? data : null // Only return data if hash verifies
            };
        } catch (error) {
            return {
                success: false,
                status: null,
                contentType: null,
                size: null,
                hashVerification: {
                    valid: false,
                    results: [],
                    error: error.message
                },
                data: null
            };
        }
    }

    /**
     * Check if hash algorithms are supported
     * @returns {boolean} True if hash verification is available
     */
    isHashVerificationSupported() {
        return this.hashSupport.available;
    }

    /**
     * Get supported hash algorithms
     * @returns {string[]} Array of supported algorithm names
     */
    getSupportedHashAlgorithms() {
        return this.hashSupport.available ? this.hashSupport.algorithms : [];
    }

    /**
     * Collect external files with content_hash from vCon data
     * @param {Object} vcon - vCon data object
     * @returns {Array} Array of external file objects
     */
    collectExternalFiles(vcon) {
        const externalFiles = [];
        
        // Check dialog entries
        if (vcon.dialog && Array.isArray(vcon.dialog)) {
            vcon.dialog.forEach((dialog, index) => {
                if (dialog.url && dialog.content_hash) {
                    externalFiles.push({
                        url: dialog.url,
                        content_hash: dialog.content_hash,
                        type: 'dialog',
                        index: index,
                        mediatype: dialog.mediatype || dialog.mimetype,
                        filename: dialog.filename
                    });
                }
            });
        }
        
        // Check attachment entries
        if (vcon.attachments && Array.isArray(vcon.attachments)) {
            vcon.attachments.forEach((attachment, index) => {
                if (attachment.url && attachment.content_hash) {
                    externalFiles.push({
                        url: attachment.url,
                        content_hash: attachment.content_hash,
                        type: 'attachment',
                        index: index,
                        mediatype: attachment.mediatype || attachment.mimetype,
                        filename: attachment.filename
                    });
                }
            });
        }
        
        // Check analysis entries
        if (vcon.analysis && Array.isArray(vcon.analysis)) {
            vcon.analysis.forEach((analysis, index) => {
                if (analysis.url && analysis.content_hash) {
                    externalFiles.push({
                        url: analysis.url,
                        content_hash: analysis.content_hash,
                        type: 'analysis',
                        index: index,
                        mediatype: analysis.mediatype || analysis.mimetype,
                        filename: analysis.filename
                    });
                }
            });
        }
        
        // Check redacted vCon references
        if (vcon.redacted && vcon.redacted.url && vcon.redacted.content_hash) {
            externalFiles.push({
                url: vcon.redacted.url,
                content_hash: vcon.redacted.content_hash,
                type: 'redacted_vcon',
                index: 0
            });
        }
        
        // Check appended vCon references
        if (vcon.appended && vcon.appended.url && vcon.appended.content_hash) {
            externalFiles.push({
                url: vcon.appended.url,
                content_hash: vcon.appended.content_hash,
                type: 'appended_vcon',
                index: 0
            });
        }
        
        // Check group vCon references
        if (vcon.group && Array.isArray(vcon.group)) {
            vcon.group.forEach((groupItem, index) => {
                if (groupItem.url && groupItem.content_hash) {
                    externalFiles.push({
                        url: groupItem.url,
                        content_hash: groupItem.content_hash,
                        type: 'group_vcon',
                        index: index,
                        uuid: groupItem.uuid
                    });
                }
            });
        }
        
        return externalFiles;
    }
}

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VConProcessor;
} else {
    window.VConProcessor = VConProcessor;
}