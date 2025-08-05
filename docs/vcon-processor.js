// vCon Processor Module
// Handles validation, parsing, and extraction of vCon data according to draft-ietf-vcon-vcon-core-00

class VConProcessor {
    constructor() {
        // vCon version support
        this.supportedVersions = ['0.0.1', '0.3.0', '1.0.0'];
        
        // Required fields as per spec
        this.requiredFields = ['vcon', 'uuid', 'created_at', 'parties'];
        
        // Optional but commonly used fields
        this.optionalFields = [
            'updated_at', 'subject', 'redacted', 'appended', 'group',
            'dialog', 'analysis', 'attachments', 'must_support'
        ];
    }
    
    // Main processing function
    process(vconData) {
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
            warnings: []
        };
        
        try {
            // Parse if string
            const vcon = typeof vconData === 'string' ? JSON.parse(vconData) : vconData;
            
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
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
        const exclusiveCount = [vcon.redacted, vcon.appended, vcon.group].filter(Boolean).length;
        if (exclusiveCount > 1) {
            validation.errors.push({
                field: 'root',
                message: 'redacted, appended, and group parameters are mutually exclusive'
            });
            validation.isValid = false;
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
                validation: party.validation || null,
                location: null
            };
            
            // Collect identifiers
            if (party.tel) {
                processed.identifiers.push({
                    type: 'tel',
                    value: party.tel,
                    display: this.formatPhoneNumber(party.tel)
                });
            }
            
            if (party.sip) {
                processed.identifiers.push({
                    type: 'sip',
                    value: party.sip,
                    display: party.sip
                });
            }
            
            if (party.mailto || party.email) {
                const email = party.mailto || party.email;
                processed.identifiers.push({
                    type: 'email',
                    value: email,
                    display: email.replace('mailto:', '')
                });
            }
            
            if (party.did) {
                processed.identifiers.push({
                    type: 'did',
                    value: party.did,
                    display: party.did
                });
            }
            
            if (party.stir) {
                processed.identifiers.push({
                    type: 'stir',
                    value: party.stir,
                    display: 'PASSporT Token'
                });
            }
            
            if (party.uuid) {
                processed.identifiers.push({
                    type: 'uuid',
                    value: party.uuid,
                    display: party.uuid
                });
            }
            
            // Process location
            if (party.gmlpos || party.civicaddress) {
                processed.location = {
                    gmlpos: party.gmlpos,
                    civic: party.civicaddress
                };
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
                disposition: dialog.disposition || null,
                mediatype: dialog.mediatype || dialog.mimetype || null,
                filename: dialog.filename || null,
                content: null,
                transfer: null,
                session_id: dialog.session_id || null,
                party_history: dialog.party_history || [],
                application: dialog.application || null,
                message_id: dialog.message_id || null
            };
            
            // Handle different dialog types
            if (dialog.type === 'recording' || dialog.type === 'text') {
                processed.content = {
                    hasBody: !!dialog.body,
                    hasUrl: !!dialog.url,
                    encoding: dialog.encoding || null,
                    contentHash: dialog.content_hash || null
                };
            } else if (dialog.type === 'transfer') {
                processed.transfer = {
                    transferee: dialog.transferee,
                    transferor: dialog.transferor,
                    transfer_target: dialog.transfer_target,
                    original: dialog.original,
                    consultation: dialog.consultation,
                    target_dialog: dialog.target_dialog
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
}

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VConProcessor;
} else {
    window.VConProcessor = VConProcessor;
}